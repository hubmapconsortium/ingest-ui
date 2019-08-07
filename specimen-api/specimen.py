'''
Created on May 15, 2019
@author: chb69
'''
import os
import sys
import re
from neo4j import TransactionError, CypherError
import requests
import configparser
from pprint import pprint
import json
from werkzeug.utils import secure_filename
from flask import json
from builtins import staticmethod
from _ast import stmt
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst
from hm_auth import AuthCache, AuthHelper
from entity import Entity
from uuid_generator import getNewUUID
from neo4j_connection import Neo4jConnection
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'metadata-api'))
from metadata import Metadata
from flask import Response
from autherror import AuthError

class Specimen:

    @staticmethod
    # NOTE: This will return an entity, activity, or agent
    def get_specimen(driver, identifier):
        try:
            return Entity.get_entity(driver, identifier)
        except BaseException as be:
            pprint(be)
            raise be

    @staticmethod
    def update_specimen(driver, uuid, request, incoming_record, file_list, current_token, groupUUID):
        conn = Neo4jConnection()
        metadata_uuid = None
        try:
            metadata_obj = Entity.get_entity_metadata(driver, uuid)
            #metadata_obj = Entity.get_entity(driver, uuid)
            metadata_uuid = metadata_obj[HubmapConst.UUID_ATTRIBUTE]
        except ValueError as ve:
            raise ve
        except:
            raise
        confdata = Specimen.load_config_file()
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                confdata['appclientid'], confdata['appclientsecret'])
        else:
            authcache = AuthHelper.instance()
        userinfo = authcache.getUserInfo(current_token, True)
        
        if type(userinfo) == Response and userinfo.status_code == 401:
            raise AuthError('token is invalid.', 401)
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        metadata = Metadata()
        try:
            provenance_group = metadata.get_group_by_identifier(groupUUID)
        except ValueError as ve:
            raise ve

        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        #get a link to the data directory using the group uuid
        # ex: <data_parent_directory>/<group UUID>
        data_directory = get_data_directory(confdata['localstoragedirectory'], provenance_group['uuid'])
        #get a link to the subdirectory within data directory using the current uuid
        # ex: <data_parent_directory>/<group UUID>/<specimen uuid>
        # We need to allow this method to create a new directory.  It is possible that an earlier
        # specimen didn't have any files when it was initially created
        data_directory = get_data_directory(data_directory, uuid, True)

        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                metadata_file_path = None
                protocol_file_path = None
                image_file_data_list = None
                
                #NEED CODE TO RESOLVE DELETEED FILES
                #TODO: get a list of the filenames and put them into current_file_list
                #if len(file_list) > 0:
                #TODO: get a list of the filenames and put them into current_file_list
                current_metadatafile = None
                if 'metadata_file' in incoming_record:
                    current_metadatafile = incoming_record['metadata_file']
                current_protocolfile = None
                if 'protocol_file' in incoming_record:
                    current_protocolfile = incoming_record['protocol_file']
                current_imagefiles = None
                if 'images' in incoming_record:
                    current_imagefiles = incoming_record['images']
                all_files = Specimen.build_complete_file_list(current_metadatafile, current_protocolfile, current_imagefiles)
                Specimen.cleanup_files(data_directory, all_files)
                # append the current UUID to the data_directory to avoid filename collisions.
                if 'metadata_file' in file_list:
                    metadata_file_path = Specimen.upload_file_data(request, 'metadata_file', data_directory)
                    incoming_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                if 'protocol_file' in file_list:
                    protocol_file_path = Specimen.upload_file_data(request, 'protocol_file', data_directory)
                    incoming_record[HubmapConst.PROTOCOL_FILE_ATTRIBUTE] = protocol_file_path
                if 'images' in incoming_record:
                    # handle the case where the current record has no images
                    current_image_file_metadata = None
                    if 'image_file_metadata' in metadata_obj:
                        current_image_file_metadata = metadata_obj['image_file_metadata']
                    image_file_data_list = Specimen.upload_multiple_file_data(request, incoming_record['images'], file_list, data_directory, current_image_file_metadata)
                    incoming_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list
                if 'protocols' in incoming_record:
                    # handle the case where the current record has no images
                    current_image_file_metadata = None
                    if 'protocols' in metadata_obj:
                        current_protocol_file_metadata = metadata_obj['protocols']
                    protocol_file_data_list = Specimen.upload_multiple_protocol_file_data(request, incoming_record['protocols'], file_list, data_directory, current_protocol_file_metadata)
                    incoming_record[HubmapConst.PROTOCOL_FILE_METADATA_ATTRIBUTE] = protocol_file_data_list
                
                metadata_record = incoming_record
                # don't change the type of this node
                metadata_record.pop(HubmapConst.ENTITY_TYPE_ATTRIBUTE)
                metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
                metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid

                if 'metadata' in metadata_record.keys():
                    # check if metadata contains valid data
                    # if not, just remove it from the metadata_record
                    if metadata_record['metadata'] == None or len(metadata_record['metadata']) == 0:
                        metadata_record.pop('metadata')
                    else:
                        try:
                            #try to load the data as json
                            json.loads(metadata_record['metadata'])
                            metadata_record['metadata'] = json.dumps(
                                metadata_record['metadata'])
                        except ValueError:
                            # that failed, so load it as a string
                            metadata_record['metadata'] = metadata_record['metadata']
                if 'files' in metadata_record.keys():
                    metadata_record.pop('files')
                if 'images' in metadata_record.keys():
                    metadata_record.pop('images')
                #if 'protocols' in metadata_record.keys():
                #    metadata_record.pop('protocols')
                stmt = Neo4jConnection.get_update_statement(
                    metadata_record, True)
                tx.run(stmt)
                tx.commit()
                return uuid
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                if tx.closed() == False:
                    tx.rollback()
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                if tx.closed() == False:
                    tx.rollback()
            except:
                print('A general error occurred: ')
                for x in sys.exc_info():
                    print(x)
                if tx.closed() == False:
                    tx.rollback()
    
    @staticmethod
    def build_complete_file_list(metadata_file, protocol_list, image_list):
        return_list = []
        if metadata_file != None:
            return_list.append(metadata_file)
        if protocol_list != None:
            if isinstance(object, (list,)):
                return_list.extend(protocol_list)
            else:
                return_list.append(protocol_list)
        if image_list != None:
            for image_data in image_list:
                return_list.append(image_data['file_name'])
        return return_list
      
    # This method deletes any files found in directory_path that are NOT in the current_file_list
    @staticmethod
    def cleanup_files(directory_path, current_file_list):
        try:
            onlyfiles = [f for f in os.listdir(directory_path) if os.path.isfile(os.path.join(directory_path, f))]
            for filename in onlyfiles:
                if filename not in current_file_list:
                    os.remove(os.path.join(directory_path, filename))
        except:
            pass

        
    @staticmethod
    def create_specimen(driver, request, incoming_record, file_list, current_token, groupUUID, sourceUUID=None):
        # step 1: check that the uuids already exist
        conn = Neo4jConnection()
        confdata = Specimen.load_config_file()
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                confdata['appclientid'], confdata['appclientsecret'])
        else:
            authcache = AuthHelper.instance()
        userinfo = authcache.getUserInfo(current_token, True)
        
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        metadata = Metadata()
        try:
            provenance_group = metadata.get_group_by_identifier(groupUUID)
        except ValueError as ve:
            raise ve
        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.REGISTER_DONOR_ACTIVITY_TYPE_CODE
        entity_type = incoming_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE]
        if entity_type == HubmapConst.SAMPLE_TYPE_CODE:
            activity_type = HubmapConst.CREATE_SAMPLE_ACTIVITY_TYPE_CODE
            sourceUUID = str(sourceUUID).strip()
            if sourceUUID == None or len(sourceUUID) == 0:
                raise ValueError('Error: sourceUUID must be set to create a tissue')
            try:
                entity = Entity.get_entity(driver, sourceUUID)
                sourceUUID = entity['uuid']
            except:
                raise

        #userinfo = AuthCache.userInfo(current_token, True)
        if len(file_list) > 0:
            data_directory = get_data_directory(confdata['localstoragedirectory'], provenance_group['uuid'])

        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                try:
                    specimen_uuid_record = getNewUUID(
                        current_token, incoming_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE])
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
                if specimen_uuid_record == None:
                    raise ValueError("Error: UUID returned is empty")
                incoming_record[HubmapConst.UUID_ATTRIBUTE] = specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                incoming_record[HubmapConst.DOI_ATTRIBUTE] = specimen_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                incoming_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = specimen_uuid_record['displayDoi']
                specimen_data = {}
                metadata_file_path = None
                protocol_file_path = None
                image_file_data_list = None
                if len(file_list) > 0:
                    # append the current UUID to the data_directory to avoid filename collisions.
                    data_directory = get_data_directory(data_directory, specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE], True)
                    if 'metadata_file' in file_list:
                        metadata_file_path = Specimen.upload_file_data(request, 'metadata_file', data_directory)
                        incoming_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                    if 'protocol_file' in file_list:
                        protocol_file_path = Specimen.upload_file_data(request, 'protocol_file', data_directory)
                        incoming_record[HubmapConst.PROTOCOL_FILE_ATTRIBUTE] = protocol_file_path
                    if 'images' in incoming_record:
                        image_file_data_list = Specimen.upload_multiple_file_data(request, incoming_record['images'], file_list, data_directory)
                        incoming_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list
                    if 'protocols' in incoming_record:
                        protocol_file_data_list = Specimen.upload_multiple_protocol_file_data(request, incoming_record['protocols'], file_list, data_directory)
                        incoming_record[HubmapConst.PROTOCOL_FILE_METADATA_ATTRIBUTE] = protocol_file_data_list
                         
                required_list = HubmapConst.DONOR_REQUIRED_ATTRIBUTE_LIST
                if entity_type == HubmapConst.SAMPLE_TYPE_CODE:
                    required_list = HubmapConst.SAMPLE_REQUIRED_ATTRIBUTE_LIST
                required_list = [o['attribute_name'] for o in required_list]
                for attrib in required_list:
                    specimen_data[attrib] = incoming_record.pop(attrib)
                stmt = Neo4jConnection.get_create_statement(
                    specimen_data, HubmapConst.ENTITY_NODE_NAME, entity_type, True)
                print('Specimen Create statement: ' + stmt)
                tx.run(stmt)

                metadata_record = incoming_record
                metadata_uuid_record = getNewUUID(
                    current_token, HubmapConst.METADATA_TYPE_CODE)
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                #metadata_record[HubmapConst.DOI_ATTRIBUTE] = metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                #metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = metadata_uuid_record['displayDoi']
                metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
                metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
                metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']

                if 'metadata' in metadata_record.keys():
                    # check if metadata contains valid data
                    # if not, just remove it from the metadata_record
                    if metadata_record['metadata'] == None or len(metadata_record['metadata']) == 0:
                        metadata_record.pop('metadata')
                    else:
                        try:
                            #try to load the data as json
                            json.loads(metadata_record['metadata'])
                            metadata_record['metadata'] = json.dumps(
                                metadata_record['metadata'])
                        except ValueError:
                            # that failed, so load it as a string
                            metadata_record['metadata'] = metadata_record['metadata']
                if 'files' in metadata_record.keys():
                    metadata_record.pop('files')
                if 'images' in metadata_record.keys():
                    metadata_record.pop('images')
                #if 'protocols' in metadata_record.keys():
                #    metadata_record.pop('protocols')
                stmt = Neo4jConnection.get_create_statement(
                    metadata_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
                print('MEtadata Create statement: ' + stmt)

                tx.run(stmt)

                activity_uuid_record = getNewUUID(current_token, activity_type)
                activity_record = {HubmapConst.UUID_ATTRIBUTE: activity_uuid_record[HubmapConst.UUID_ATTRIBUTE],
                                   HubmapConst.DOI_ATTRIBUTE: activity_uuid_record[HubmapConst.DOI_ATTRIBUTE],
                                   HubmapConst.DISPLAY_DOI_ATTRIBUTE: activity_uuid_record['displayDoi'],
                                   HubmapConst.ACTIVITY_TYPE_ATTRIBUTE: activity_type}
                stmt = Neo4jConnection.get_create_statement(
                    activity_record, HubmapConst.ACTIVITY_NODE_NAME, activity_type, False)
                tx.run(stmt)

                activity_metadata_record = {}
                activity_metadata_uuid_record = getNewUUID(
                    current_token, HubmapConst.METADATA_TYPE_CODE)
                activity_metadata_record[HubmapConst.UUID_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                activity_metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
                activity_metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = activity_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[
                    HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                activity_metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
                activity_metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']
                stmt = Neo4jConnection.get_create_statement(
                    activity_metadata_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
                tx.run(stmt)

                # step 5: create the relationships
                if entity_type == HubmapConst.SAMPLE_TYPE_CODE:
                    stmt = Neo4jConnection.create_relationship_statement(
                        sourceUUID, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                    tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.ACTIVITY_OUTPUT_REL, specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                """stmt = Neo4jConnection.create_relationship_statement(specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.LAB_CREATED_AT_REL, labUUID)
                tx.run(stmt)"""
                tx.commit()
                return specimen_uuid_record
            except ConnectionError as ce:
                print('A connection error occurred: ', str(ce.args[0]))
                if tx.closed() == False:
                    tx.rollback()
                raise ce
            except ValueError as ve:
                print('A value error occurred: ', ve.value)
                if tx.closed() == False:
                    tx.rollback()
                raise ve
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                if tx.closed() == False:
                    tx.rollback()
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                if tx.closed() == False:
                    tx.rollback()
            except:
                print('A general error occurred: ')
                for x in sys.exc_info():
                    print(x)
                if tx.closed() == False:
                    tx.rollback()

    @staticmethod 
    def get_image_file_list_for_uuid(uuid):
        conn = Neo4jConnection()
        try:
            with driver.session() as session:
                stmt = " WHERE a.{entitytype_attr} IS NOT NULL RETURN a.{uuid_attr} AS entity_uuid, a.{entitytype_attr} AS datatype, a.{doi_attr} AS entity_doi, a.{display_doi_attr} as entity_display_doi, properties(m) AS metadata_properties ORDER BY m.{provenance_timestamp} DESC".format(
                    uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE, provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE)
    
                for record in session.run(stmt):
                    pass
        except ConnectionError as ce:
            print('A connection error occurred: ', str(ce.args[0]))
            raise ce
        except ValueError as ve:
            print('A value error occurred: ', ve.value)
            raise ve
        except CypherError as cse:
            print('A Cypher error was encountered: ', cse.message)
            raise cse
        except:
            print('A general error occurred: ')
            for x in sys.exc_info():
                print(x)
    
    @staticmethod
    def upload_multiple_file_data(request, annotated_file_list, request_file_list, directory_path, existing_file_data=None):
        """This method takes information about the file(s) associated with the specimen and builds a new list of files for storage in the Neo4j system.
        For each file encountered, there are two cases handled by this code: 1) it is a new file to be uploaded or 2) it is an existing file.
        
        Keyword arguments:
        request -- the HTTP request containing the submitted web form
        annotated_file_list -- the dictionary of file data from the web form.  For example: [{'id': 'image_1', 'file_name': 'chicken_crossing.jpg', 'description': 'crossing'}, {'id': 'image_2', 'file_name': 'chicago_background.jpg', 'description': 'chicago'}, {'id': 'image_3', 'file_name': 'bug_feature.jpg', 'description': 'bug'}]
        request_file_list -- the dictionary of the file data from the HTTP request.  This contains a key plus the actual binary data representing the file.  for example: [('image_3', <FileStorage: 'bug_feature.jpg' ('image/jpeg')>)]
        directory_path -- a file path where any new files will be stored.  This is unique to the user's group and the uuid for the current specimen
        existing_file_data -- a dictionary of the existing file information.  This is an optional parameter and is only set if the specimen is being updated
        """
        return_list = []
        #rebuild the request['files'] dictionary.  Make it based on filename.  The request['files'] represents new files
        file_name_dict = {}
        for key_index, current_file_data in request_file_list.items():
            file_name_dict[str(current_file_data.filename)] = current_file_data
            
        #rebuild the existing files dictionary.  Make it based on filename
        existing_file_data_dict = {}
        if existing_file_data != None:
            existing_file_data_json = json.loads(existing_file_data)
            for data_entry in existing_file_data_json:
                existing_file_data_dict[os.path.basename(data_entry['filepath'])] = data_entry
        # walk through each file represented on the web form.  For each file decide if it represents a new file or an existing file
        # Note: this code builds a list of the current files.  Effectively, this approach implicitly "deletes" any previous files removed from the
        # web form. 
        for file_data in annotated_file_list:
            try:
                # upload the file if it represents a new file.  New files are found in the file_name_dict
                if (str(file_data['file_name']) in file_name_dict) == True:
                    new_filepath = Specimen.upload_file_data(request, str(file_data['id']), directory_path)
                    desc = ''
                    if 'description' in file_data:
                        desc = file_data['description']
                    file_obj = {'filepath': new_filepath, 'description': desc}
                    return_list.append(file_obj)
                else:
                    # in this case, simply copy an existing file's data into the retrun_list
                    return_list.append(existing_file_data_dict[str(os.path.basename(file_data['file_name']))])
                    
            except:
                raise
        # dump the data as JSON
        return_string = json.dumps(return_list)
        # replace any of the single quotes with double quotes so it can be stored by Neo4j statements
        return_string = str(return_string).replace('\'', '"')
        return return_string

    """Note: There is a subtle difference between storing data for protocols vs data for images.
    For one thing, the protocol may not be a file, but an URL.  Second, there is no description field associated with
    the protocol file.
    The output protocol JSON should look like this:
    "protocols": "[{"description": "", 
        "protocol_file": "/Users/chb69/globus_temp_data/5bd084c8-edc2-11e8-802f-0e368f3075e8/f8ed3f8e2e8a49c032b602a35126ec71/C11_technical_survey_summary.pdf", 
        “protocol_url”:””}, 
        {"description": "", " protocol_file ": "/Users/chb69/globus_temp_data/5bd084c8-edc2-11e8-802f-0e368f3075e8/f8ed3f8e2e8a49c032b602a35126ec71/Revision2OfTR15-119.pdf", “protocol_url”:””}]" 
    """
    @staticmethod
    def upload_multiple_protocol_file_data(request, annotated_file_list, request_file_list, directory_path, existing_file_data=None):
        return_list = []
        #rebuild the request['files'] dictionary.  Make it based on filename.  The request['files'] represents new files
        file_name_dict = {}
        for key_index, current_file_data in request_file_list.items():
            file_name_dict[str(current_file_data.filename)] = current_file_data
            
        #rebuild the existing files dictionary.  Make it based on filename
        existing_file_data_dict = {}
        existing_url_data_dict = {}
        if existing_file_data != None:
            # replace single quotes with JSON compliant double quotes before converting to JSON:
            existing_file_data = str(existing_file_data).replace("\'", "\"")
            existing_file_data_json = json.loads(existing_file_data)
            for data_entry in existing_file_data_json:
                if len(str(data_entry['protocol_file'])) > 0: 
                    existing_file_data_dict[os.path.basename(data_entry['protocol_file'])] = data_entry
                else:
                    existing_url_data_dict[data_entry['protocol_url']] = data_entry
        
        # walk through each file represented on the web form.  For each file decide if it represents a new file or an existing file
        # Note: this code builds a list of the current files.  Effectively, this approach implicitly "deletes" any previous files removed from the
        # web form. 
        for file_data in annotated_file_list:
            try:
                # upload the file if it represents a new file.  New files are found in the file_name_dict
                if (str(os.path.basename(file_data['protocol_file'])) in file_name_dict) == True:
                    new_filepath = Specimen.upload_file_data(request, str(file_data['id']), directory_path)
                    file_obj = {'protocol_file': new_filepath, 'protocol_url': ''}
                    return_list.append(file_obj)
                else:
                    if len(str(file_data['protocol_file'])) > 0:
                        # in this case, simply copy an existing file's data into the retrun_list
                        return_list.append(existing_file_data_dict[os.path.basename(file_data['protocol_file'])])
                    else:
                        if file_data['protocol_url'] in existing_url_data_dict:
                            # copy the existing protocol_url entry
                            return_list.append(existing_url_data_dict[file_data['protocol_url']])
                        else:
                            #create a new protocol_url entry
                            file_obj = {'protocol_file': '', 'protocol_url': str(file_data['protocol_url'])}
                            return_list.append(file_obj)  
                            

                    """            
                    for file_data in annotated_file_list:
                        try:
                            # upload the file if it represents a new file
                            if (str(file_data['id']) in request_file_list) == True:
                                new_filepath = Specimen.upload_file_data(request, str(file_data['id']), directory_path)
                                file_obj = {'protocol_file': new_filepath, 'protocol_url': ''}
                                return_list.append(file_obj)
                            # if there is no file to upload, but there is a protocol URL:
                            elif len(str(file_data['protocol_url'])) > 0:
                                file_obj = {'protocol_file': '', 'protocol_url': str(file_data['protocol_url'])}
                                return_list.append(file_obj)  
                    """                                      
            except:
                raise
        return_string = json.dumps(return_list)
        return_string = str(return_string).replace('\'', '"')
        return return_string

    @staticmethod
    def upload_file_data(request, file_key, directory_path):
        try:
            #TODO: handle case where file already exists.  Append a _x to filename where
            # x is an integer
            file = request.files[file_key]
            filename = os.path.basename(file.filename)
            file.save(os.path.join(directory_path, filename))
            return str(os.path.join(directory_path, filename))
        except:
            raise
     
    @staticmethod
    def load_config_file():
        config = configparser.ConfigParser()
        confdata = {}
        try:
            config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
            confdata['neo4juri'] = config.get('NEO4J', 'server')
            confdata['neo4jusername'] = config.get('NEO4J', 'username')
            confdata['neo4jpassword'] = config.get('NEO4J', 'password')
            confdata['appclientid'] = config.get('GLOBUS', 'APP_CLIENT_ID')
            confdata['appclientsecret'] = config.get(
                'GLOBUS', 'APP_CLIENT_SECRET')
            confdata['localstoragedirectory'] = config.get(
                'FILE_SYSTEM', 'LOCAL_STORAGE_DIRECTORY')
            return confdata
        except OSError as err:
            msg = "OS error.  Check config.ini file to make sure it exists and is readable: {0}".format(
                err)
            print(msg + "  Program stopped.")
            exit(0)
        except configparser.NoSectionError as noSectError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                noSectError)
            print(msg + "  Program stopped.")
            exit(0)
        except configparser.NoOptionError as noOptError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                noOptError)
            print(msg + "  Program stopped.")
            exit(0)
        except SyntaxError as syntaxError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                syntaxError)
            msg = msg + "  Cannot read line: {0}".format(syntaxError.text)
            print(msg + "  Program stopped.")
            exit(0)
        except AttributeError as attrError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
                attrError)
            msg = msg + "  Cannot read line: {0}".format(attrError.text)
            print(msg + "  Program stopped.")
            exit(0)
        except:
            msg = "Unexpected error:", sys.exc_info()[0]
            print(msg + "  Program stopped.")
            exit(0)


    @staticmethod
    def search_specimen(driver, search_term, readonly_uuid_list, writeable_uuid_list, specimen_type=None):
        return_list = []
        group_list = []
        group_list.extend(readonly_uuid_list)
        group_list.extend(writeable_uuid_list)
        lucence_index_name = "testIdx"
        entity_type_clause = "entity_node.entitytype IN ['Donor','Sample']"
        metadata_clause = "{entitytype: 'Metadata'}"
        if specimen_type != 'Donor' and specimen_type != None:
            entity_type_clause = "entity_node.entitytype = 'Sample' AND lucene_node.specimen_type = '{specimen_type}'".format(specimen_type=specimen_type)
        elif specimen_type == 'Donor':
            entity_type_clause = "entity_node.entitytype = 'Donor'"
        lucene_type_clause = entity_type_clause.replace('entity_node.entitytype', 'lucene_node.entitytype')
        lucene_type_clause = lucene_type_clause.replace('lucene_node.specimen_type', 'metadata_node.specimen_type')
        
        original_search_term = None
        pattern = re.compile('\d\d\d-\D\D\D\D-\d\d\d')
        result = pattern.match(search_term)
        if result != None:
            original_search_term = result 
        # for now, just escape Lucene special characters
        lucene_special_characters = ['+','-','&','|','!','(',')','{','}','[',']','^','"','~','*','?',':']
        for special_char in lucene_special_characters:
            search_term = search_term.replace(special_char, '\\\\'+ special_char)
            
        stmt1 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
        MATCH (lucene_node:Entity {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node) WHERE {entity_type_clause} AND lucene_node.provenance_group_uuid IN {group_list} 
        RETURN score, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp
        ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,group_list=group_list,lucence_index_name=lucence_index_name,search_term=search_term,
            uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
            display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE)

        stmt2 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
        MATCH (metadata_node:Entity {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(lucene_node) WHERE {lucene_type_clause} AND metadata_node.provenance_group_uuid IN {group_list} 
        RETURN score, lucene_node.{uuid_attr} AS entity_uuid, lucene_node.{entitytype_attr} AS datatype, lucene_node.{doi_attr} AS entity_doi, lucene_node.{display_doi_attr} as entity_display_doi, properties(metadata_node) AS metadata_properties, metadata_node.{provenance_timestamp} AS modified_timestamp
        ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,group_list=group_list,lucence_index_name=lucence_index_name,search_term=search_term,
            uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
            display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE)

        stmt_list = [stmt1, stmt2]
        return_list = []
        display_doi_list = []
        for stmt in stmt_list:
            print("Search query: " + stmt)
            with driver.session() as session:
    
                try:
                    for record in session.run(stmt):
                        # skip any records with empty display_doi
                        if record['entity_display_doi'] != None:
                            # insert any new records
                            if str(record['entity_display_doi']) not in display_doi_list:
                                data_record = {}
                                data_record['uuid'] = record['entity_uuid']
                                data_record['score'] = record['score']
                                data_record['entity_display_doi'] = record['entity_display_doi']
                                data_record['entity_doi'] = record['entity_doi']
                                data_record['datatype'] = record['datatype']
                                data_record['properties'] = record['metadata_properties']
                                # determine if the record is writable by the current user
                                data_record['writeable'] = False
                                if record['metadata_properties']['provenance_group_uuid'] in writeable_uuid_list:
                                    data_record['writeable'] = True
                                display_doi_list.append(str(data_record['entity_display_doi']))
                                if original_search_term != None:
                                    if str(data_record['entity_display_doi']).find(original_search_term.string) > -1:
                                        return_list.insert(0,data_record)                            
                                    else:
                                        return_list.append(data_record)
                                else:
                                    return_list.append(data_record)
                            # find any existing records and update their score (if necessary)
                            else:
                                for ret_record in return_list:
                                    if record['entity_display_doi'] == ret_record['entity_display_doi']:
                                        # update the score if it is higher
                                        if record['score'] > ret_record['score']:
                                            ret_record['score'] = record['score']
                        
                except CypherError as cse:
                    print ('A Cypher error was encountered: '+ cse.message)
                    raise
                except:
                    print ('A general error occurred: ')
                    for x in sys.exc_info():
                        print (x)
                    raise
        # before returning the list, sort it again if new items were added
        return_list.sort(key=lambda x: x['score'], reverse=True)
        return return_list                    


def create_site_directories(parent_folder):
    hubmap_groups = AuthCache.getHMGroups()
    for group in hubmap_groups:
        if not os.path.exists(os.path.join(parent_folder, hubmap_groups[group]['uuid'])):
            os.mkdir(os.path.join(parent_folder, hubmap_groups[group]['uuid']))

def get_data_directory(parent_folder, group_uuid, create_folder=False):
    if not os.path.exists(os.path.join(parent_folder, group_uuid)):
        if create_folder == False:
            raise ValueError('Error: cannot find path: ' + os.path.join(parent_folder, group_uuid))
        else:
            try:
                os.mkdir(os.path.join(parent_folder, group_uuid))
            except OSError as oserr:
                pprint(oserr)
    return os.path.join(parent_folder, group_uuid)

if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    return_list = Specimen.search_specimen(driver, 'HBM:273-VXXV-779', ['5bd084c8-edc2-11e8-802f-0e368f3075e8'])
    print("Found " + str(len(return_list)) + " items")
    pprint(return_list)

    """name = 'Test Dataset'
    description = 'This dataset is a test'
    parentCollection = '4470c8e8-3836-4986-9773-398912831'
    hasPHI = False
    labCreatedAt = '0ce5be9b-8b7f-47e9-a6d9-16a08df05f50'
    createdBy = '70a43e57-c4fd-4616-ad41-ca8c80d6d827'

    uuid_to_modify = 'ec08e0ee-f2f6-4744-acb4-c4c6745eb04f'
    dr_x_uuid = '33a46e57-c55d-4617-ad41-ca8a30d6d844'
    datastage_uuid = 'c67a6dec-5ef8-4728-8f42-b70966edcb7e'
    create_datastage_activity = '05e699aa-0320-48ee-b3bc-f92cd72e9f5f'
    donor_uuid = 'aa7100ec-5e34-8628-3342-ac4566edcb22'
    current_token = 'AgBkdvv7dqN5oYG0peddbwmoO6l0ep5OD3ovmyJ4Dx99vwQ3B4cyCrM20k1j3nYz3nk65aM9lm2yVdik174abHW845'

    specimen_record = {'label': 'test specimen record',
                       'description': 'test specimen record',
                       'hasPHI': 'true', 'status': 'Published'}
    #specimen_uuid_record = Specimen.create_specimen(
    #    driver, specimen_record,  current_token, labCreatedAt, parentCollection)
    specimen_record = Specimen.get_specimen(driver, '838-CVMW-577')
    pprint(specimen_record)
    
    Specimen.cleanup_files('/Users/chb69/globus_temp_data/5bd084c8-edc2-11e8-802f-0e368f3075e8/388877c5ceed0ceb715b91231ae7db18', ['crosby.jpeg','lift.jpg'])
    conn.close()
    
    #confdata = Specimen.load_config_file()
    #parent_folder = confdata['localstoragedirectory']
    #create_site_directories(parent_folder)"""
