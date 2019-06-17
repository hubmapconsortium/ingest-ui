'''
Created on May 15, 2019

@author: chb69
'''
import os
import sys
from neo4j import TransactionError, CypherError
import configparser
from pprint import pprint
import json
from werkzeug.utils import secure_filename
from flask import json
sys.path.append(os.path.realpath("../common-api"))
from hubmap_const import HubmapConst
from hm_auth import AuthCache, AuthHelper
from entity import Entity
from uuid_generator import getNewUUID
from neo4j_connection import Neo4jConnection
sys.path.append(os.path.realpath("../metadata-api"))
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
    def update_specimen(driver, uuid, request, incoming_record, file_list, current_token):
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
            for groupid in user_group_ids:
                group = metadata.get_group_by_identifier(groupid)
                if group['generateuuid'] == True:
                    provenance_group = group
        except ValueError as ve:
            raise ve

        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        if len(file_list) > 0:
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
                if len(file_list) > 0:
                    Specimen.cleanup_files(data_directory, file_list)
                    # append the current UUID to the data_directory to avoid filename collisions.
                    if 'metadata_file' in file_list:
                        metadata_file_path = Specimen.upload_file_data(request, 'metadata_file', data_directory)
                        incoming_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                    if 'protocol_file' in file_list:
                        protocol_file_path = Specimen.upload_file_data(request, 'protocol_file', data_directory)
                        incoming_record[HubmapConst.PROTOCOL_FILE_ATTRIBUTE] = protocol_file_path
                    if 'images' in incoming_record:
                        image_file_data_list = Specimen.upload_image_file_data(request, incoming_record['images'], file_list, data_directory)
                        incoming_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list
                
                metadata_record = incoming_record
                # don't change the type of this node
                metadata_record.pop(HubmapConst.ENTITY_TYPE_ATTRIBUTE)
                metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
                metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid

                # This is temporary, I need a set of calls to extract the metadata and file info
                if 'metadata' in metadata_record.keys():
                    # TODO: see if the metadata stays here or needs to move to another section of code
                    # TODO I need to check to see if this data is json before I dump it as json
                    metadata_record['metadata'] = json.dumps(
                        metadata_record['metadata'])
                if 'files' in metadata_record.keys():
                    metadata_record.pop('files')
                if 'images' in metadata_record.keys():
                    metadata_record.pop('images')
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
    def create_specimen(driver, request, incoming_record, file_list, current_token, sourceUUID=None):
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
            for groupid in user_group_ids:
                group = metadata.get_group_by_identifier(groupid)
                if group['generateuuid'] == True:
                    provenance_group = group
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
        if entity_type == HubmapConst.TISSUE_TYPE_CODE:
            activity_type = HubmapConst.CREATE_TISSUE_ACTIVITY_TYPE_CODE
            if sourceUUID == None:
                raise ValueError('Error: sourceUUID must be set for ')
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
                specimen_uuid_record = getNewUUID(
                    current_token, incoming_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE])
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
                        image_file_data_list = Specimen.upload_image_file_data(request, incoming_record['images'], file_list, data_directory)
                        incoming_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list
                         
                required_list = HubmapConst.DONOR_REQUIRED_ATTRIBUTE_LIST
                if entity_type == HubmapConst.TISSUE_TYPE_CODE:
                    required_list = HubmapConst.TISSUE_REQUIRED_ATTRIBUTE_LIST
                required_list = [o['attribute_name'] for o in required_list]
                for attrib in required_list:
                    specimen_data[attrib] = incoming_record.pop(attrib)
                stmt = Neo4jConnection.get_create_statement(
                    specimen_data, HubmapConst.ENTITY_NODE_NAME, entity_type, False)
                tx.run(stmt)

                metadata_record = incoming_record
                metadata_uuid_record = getNewUUID(
                    current_token, HubmapConst.METADATA_TYPE_CODE)
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.DOI_ATTRIBUTE] = metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = metadata_uuid_record['displayDoi']
                metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
                metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = specimen_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
                metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']

                # This is temporary, I need a set of calls to extract the metadata and file info
                if 'metadata' in metadata_record.keys():
                    # TODO: see if the metadata stays here or needs to move to another section of code
                    # TODO I need to check to see if this data is json before I dump it as json
                    metadata_record['metadata'] = json.dumps(
                        metadata_record['metadata'])
                if 'files' in metadata_record.keys():
                    metadata_record.pop('files')
                if 'images' in metadata_record.keys():
                    metadata_record.pop('images')
                stmt = Neo4jConnection.get_create_statement(
                    metadata_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
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
                activity_metadata_record[HubmapConst.DOI_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                activity_metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = activity_metadata_uuid_record['displayDoi']
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
                if entity_type == HubmapConst.TISSUE_TYPE_CODE:
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
    def upload_image_file_data(request, image_list, file_list, directory_path):
        return_list = []
        for image_data in image_list:
            try:
                if image_data['file_name'] in file_list:
                    new_filepath = Specimen.upload_file_data(request, image_data['file_name'], directory_path)
                    desc = ''
                    if 'description' in image_data:
                        desc = image_data['description']
                    file_obj = {'filepath': new_filepath, 'description': desc}
                    return_list.append(file_obj)
                else:
                    raise ValueError('Error: cannot find file: ' + image_data.file_name + ' in the list of files')
            except:
                raise
        return json.dumps(return_list)

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
            config.read('../common-api/app.properties')
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
    name = 'Test Dataset'
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
    #create_site_directories(parent_folder)
