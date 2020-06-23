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
import traceback
from flask import Response
from typing import List
from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hm_auth import AuthHelper, AuthCache
from hubmap_commons.entity import Entity
from hubmap_commons.autherror import AuthError
from hubmap_commons.metadata import Metadata
from hubmap_commons.hubmap_error import HubmapError
from hubmap_commons.provenance import Provenance
from hubmap_commons.activity import Activity

class Specimen:
    confdata = {}
    
    @classmethod
    def __init__(self, config):
        self.confdata = config

    @staticmethod
    # NOTE: This will return an entity, activity, or agent
    def get_specimen(driver, uuid):
        try:
            return Entity.get_entity(driver, uuid)
        except BaseException as be:
            pprint(be)
            raise be

    @classmethod
    def update_specimen(self, driver, uuid, request, incoming_record, file_list, current_token, groupUUID):
        # using this deferred import statement to avoid a circular reference
        from dataset import Dataset
        conn = Neo4jConnection(self.confdata['NEO4J_SERVER'], self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD'])
        metadata_uuid = None
        entity_record = None
        try:
            metadata_obj = Entity.get_entity_metadata(driver, uuid)
            #metadata_obj = Entity.get_entity(driver, uuid)
            metadata_uuid = metadata_obj[HubmapConst.UUID_ATTRIBUTE]
        except ValueError as ve:
            raise ve
        except:
            raise

        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        userinfo = authcache.getUserInfo(current_token, True)
        
        if type(userinfo) == Response and userinfo.status_code == 401:
            raise AuthError('token is invalid.', 401)
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        
        # by default, set the proveance group uuid to the record's current group uuid
        provenance_group_uuid = metadata_obj['provenance_group_uuid']
        if groupUUID == None:
            groupUUID = provenance_group_uuid
        prov = Provenance(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
        try:
            provenance_group = prov.get_provenance_data_object(current_token, groupUUID)
        except ValueError as ve:
            raise ve

        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_USER_EMAIL_ATTRIBUTE] = userinfo['email']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        #get a link to the data directory using the group uuid
        # ex: <data_parent_directory>/<group UUID>

        
        data_directory = get_data_directory(self.confdata['LOCAL_STORAGE_DIRECTORY'], provenance_group[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE])

        
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
                current_metadatafiles = None
                if 'metadatas' in incoming_record:
                    current_metadatafiles = incoming_record['metadatas']
                current_protocolfile = None
                if 'protocol_file' in incoming_record:
                    current_protocolfile = incoming_record['protocol_file']
                current_imagefiles = None
                if 'images' in incoming_record:
                    current_imagefiles = incoming_record['images']
                all_files = Specimen.build_complete_file_list(current_metadatafiles, current_protocolfile, current_imagefiles)
                Specimen.cleanup_files(data_directory, all_files)
                # append the current UUID to the data_directory to avoid filename collisions.
                if 'metadata_file' in file_list:
                    metadata_file_path = Specimen.upload_file_data(request, 'metadata_file', data_directory)
                    incoming_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                if 'metadatas' in incoming_record:
                    current_metadata_file_list = None
                    if 'metadata_file' in metadata_obj:
                        current_metadata_file_list = metadata_obj['metadatas']
                    metadata_file_path = Specimen.upload_multiple_file_data(request, incoming_record['metadatas'], file_list, data_directory, current_metadata_file_list)
                    incoming_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                    incoming_record[HubmapConst.METADATAS_ATTRIBUTE] = metadata_file_path
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
                
                if 'rui_location' in incoming_record or 'lab_tissue_id' in incoming_record:
                    entity_record = {}
                    entity_record[HubmapConst.UUID_ATTRIBUTE] = uuid
                    if 'rui_location' in incoming_record:
                        entity_record[HubmapConst.RUI_LOCATION_ATTRIBUTE] = incoming_record['rui_location']
                        incoming_record.pop('rui_location')
                    if 'lab_tissue_id' in incoming_record:
                        entity_record[HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE] = incoming_record['lab_tissue_id']
                        incoming_record.pop('lab_tissue_id')
                metadata_record = incoming_record
                # don't change the type of this node
                metadata_record.pop(HubmapConst.ENTITY_TYPE_ATTRIBUTE)
                # metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
                # metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
                # metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
                # set last updated user when updating specimen
                metadata_record[HubmapConst.PROVENANCE_LAST_UPDATED_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_SUB_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_LAST_UPDATED_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_USER_EMAIL_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_LAST_UPDATED_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_LAST_UPDATED_USER_DISPLAYNAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE]
                metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE]
                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid
                
                # check if this is a Donor specimen
                # if a donor, check if the open_consent flag is changing
                # if the open_consent flag changes, you need to check the access level on any
                # child datasets
                entity_record = Entity.get_entity(driver, uuid)
                existing_open_consent = False
                if HubmapConst.DONOR_OPEN_CONSENT in metadata_obj:
                    existing_open_consent = metadata_obj[HubmapConst.DONOR_OPEN_CONSENT]

                new_open_consent = False
                if HubmapConst.DONOR_OPEN_CONSENT in metadata_record:
                    new_open_consent = metadata_record[HubmapConst.DONOR_OPEN_CONSENT]
                
                if entity_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] == 'Donor':
                    if HubmapConst.DONOR_OPEN_CONSENT in metadata_record:
                        #only update if the flag has changed
                        if new_open_consent != existing_open_consent: 
                            uuid_list = []
                            uuid_list.append(uuid)
                            dataset_list = Dataset.get_datasets_by_donor(driver, uuid_list)
                            for ds in dataset_list:
                                dataset = Dataset(self.confdata)
                                dataset_record = {HubmapConst.UUID_ATTRIBUTE: ds[HubmapConst.UUID_ATTRIBUTE],
                                                  HubmapConst.SOURCE_UUID_ATTRIBUTE: ds['properties'][HubmapConst.SOURCE_UUID_ATTRIBUTE]}
                                
                                # the dataset access level will be reset using the modify_dataset method
                                dataset.modify_dataset(driver, request.headers, ds[HubmapConst.UUID_ATTRIBUTE], dataset_record, groupUUID)
                                #    def modify_dataset(self, driver, headers, uuid, formdata, group_uuid):


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
                
                # some of the data is written to the entity node.  Update the entity node if necessary.
                if entity_record != None:
                    stmt = Neo4jConnection.get_update_statement(
                        entity_record, True)
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
                traceback.print_exc()
                if tx.closed() == False:
                    tx.rollback()
    
    @classmethod
    def batch_update_specimen_lab_ids(cls, driver, incoming_records, token):
        conn = Neo4jConnection(cls.confdata['NEO4J_SERVER'], cls.confdata['NEO4J_USERNAME'], cls.confdata['NEO4J_PASSWORD'])
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                
                for item in incoming_records:
                    if 'uuid' not in item:
                        raise ValueError('Error: missing uuid from data')
                    uuid = item['uuid']
                    # verify uuid
                    ug = UUID_Generator(cls.confdata['UUID_WEBSERVICE_URL'])
                    metadata_uuid = None
                    try:
                        hmuuid_data = ug.getUUID(token, uuid)
                        if len(hmuuid_data) != 1:
                            raise ValueError("Could not find information for identifier" + uuid)
                        #specimen_metadata = Entity.get_entity_metadata(driver, uuid)
                        #metadata_uuid = specimen_metadata['uuid']
                    except:
                        raise ValueError('Unable to resolve UUID for: ' + uuid)

                    update_record = {HubmapConst.UUID_ATTRIBUTE: uuid}
                    if 'lab_identifier' in item:
                       update_record[HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE] = item['lab_identifier']
                    if 'rui_location' in item:
                        # strip out newlines
                        rui_json = str(item['rui_location']).replace('\n', '')
                        update_record[HubmapConst.RUI_LOCATION_ATTRIBUTE] = rui_json
                    if HubmapConst.RUI_LOCATION_ATTRIBUTE not in update_record and HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE not in update_record:
                        raise ValueError('Error: cannot update uuid: ' + uuid + ': no data found for specimen identifier and RUI data')
                         
                    stmt = Neo4jConnection.get_update_statement(
                        update_record, True)
                    tx.run(stmt)
                tx.commit()
                return True
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
                traceback.print_exc()
                if tx.closed() == False:
                    tx.rollback()

    @staticmethod
    def build_complete_file_list(metadata_list, protocol_list, image_list):
        return_list = []
        #if metadata_file != None:
        #    return_list.append(metadata_file)
        if metadata_list != None:
            for metadata_data in metadata_list:
                return_list.append(metadata_data['file_name'])
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

        
    @classmethod
    def create_specimen(self, driver, request, incoming_record, file_list, current_token, groupUUID, sourceUUID=None, sample_count=None):
        return_list = []
        # step 1: check that the uuids already exist
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        userinfo = authcache.getUserInfo(current_token, True)
        
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        data_directory = None
        specimen_uuid_record_list = None
        metadata_record = None
        prov = Provenance(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
        try:
            provenance_group = prov.get_provenance_data_object(current_token, groupUUID)
        except ValueError as ve:
            raise ve

        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['email']
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

        ug = UUID_Generator(self.confdata['UUID_WEBSERVICE_URL'])
        #userinfo = AuthCache.userInfo(current_token, True)
        if len(file_list) > 0:
            data_directory = get_data_directory(self.confdata['LOCAL_STORAGE_DIRECTORY'], provenance_group[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE])


        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                is_new_donor = False
                organ_specifier = None
                if incoming_record['entitytype'] == 'Donor':
                    is_new_donor = True
                    # for a donor, set the parentUUID to the Lab UUID (which is the same as the group)
                    sourceUUID = groupUUID
                elif incoming_record['specimen_type'] == 'organ':
                    if 'organ' in incoming_record:
                        organ_specifier = incoming_record['organ']
                    else:
                        raise ValueError("Error: The data indicates an organ sample, but no organ specified.")
                new_lab_id_data = Specimen.generate_lab_identifiers(driver, sourceUUID, sample_count, organ_specifier, is_new_donor)
                
                lab_id_list = new_lab_id_data['new_id_list']
                
                stmt = new_lab_id_data['update_statement']
                
                # make the necessary updates
                tx.run(stmt)

                # generate the set of specimen UUIDs required for this request
                specimen_uuid_record_list = None
                try:
                    specimen_uuid_record_list = ug.getNewUUID(current_token, entity_type, lab_id_list, sample_count)
                    if (specimen_uuid_record_list == None) or (len(specimen_uuid_record_list) == 0):
                        raise ValueError("UUID service did not return a value")
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
                
                # loop through data to create the samples
                cnt = 0
                while cnt < sample_count:
                    if specimen_uuid_record_list == None:
                        raise ValueError("Error: UUID returned is empty")
                    incoming_record[HubmapConst.UUID_ATTRIBUTE] = specimen_uuid_record_list[cnt][HubmapConst.UUID_ATTRIBUTE]
                    incoming_record[HubmapConst.DOI_ATTRIBUTE] = specimen_uuid_record_list[cnt][HubmapConst.DOI_ATTRIBUTE]
                    incoming_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = specimen_uuid_record_list[cnt]['displayDoi']
                    
                    #Assign the generate lab id code here
                    incoming_record[HubmapConst.LAB_IDENTIFIER_ATTRIBUTE] = lab_id_list[cnt]
                    incoming_record[HubmapConst.NEXT_IDENTIFIER_ATTRIBUTE] = 1
                    
                    specimen_data = {}
                    required_list = HubmapConst.DONOR_REQUIRED_ATTRIBUTE_LIST
                    if entity_type == HubmapConst.SAMPLE_TYPE_CODE:
                        required_list = HubmapConst.SAMPLE_REQUIRED_ATTRIBUTE_LIST
                    required_list = [o['attribute_name'] for o in required_list]
                    for attrib in required_list:
                        specimen_data[attrib] = incoming_record[attrib]
                    stmt = Neo4jConnection.get_create_statement(
                        specimen_data, HubmapConst.ENTITY_NODE_NAME, entity_type, True)
                    print('Specimen Create statement: ' + stmt)
                    tx.run(stmt)
                    return_list.append(specimen_data)
                    cnt += 1

                # remove the attributes related to the Entity node
                for attrib in required_list:
                    specimen_data[attrib] = incoming_record.pop(attrib)
                
                # use the remaining attributes to create the Entity Metadata node
                metadata_record = incoming_record
                metadata_uuid_record_list = None
                metadata_uuid_record = None
                try: 
                    metadata_uuid_record_list = ug.getNewUUID(current_token, HubmapConst.METADATA_TYPE_CODE)
                    if (metadata_uuid_record_list == None) or (len(metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    metadata_uuid_record = metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))

                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]

                stmt = Specimen.get_create_metadata_statement(metadata_record, current_token, specimen_uuid_record_list, metadata_userinfo, provenance_group, file_list, data_directory, request)
                tx.run(stmt)

                # create the Activity Entity node
                activity_uuid_record_list = None
                activity_uuid_record = None
                try: 
                    activity_uuid_record_list = ug.getNewUUID(current_token, activity_type)
                    if (activity_uuid_record_list == None) or (len(activity_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    activity_uuid_record = activity_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))

                activity_record = {HubmapConst.UUID_ATTRIBUTE: activity_uuid_record[HubmapConst.UUID_ATTRIBUTE],
                                   HubmapConst.DOI_ATTRIBUTE: activity_uuid_record[HubmapConst.DOI_ATTRIBUTE],
                                   HubmapConst.DISPLAY_DOI_ATTRIBUTE: activity_uuid_record['displayDoi'],
                                   HubmapConst.ACTIVITY_TYPE_ATTRIBUTE: activity_type}
                stmt = Neo4jConnection.get_create_statement(
                    activity_record, HubmapConst.ACTIVITY_NODE_NAME, activity_type, False)
                tx.run(stmt)

                # create the Activity Metadata node
                activity_metadata_record = {}
                activity_metadata_uuid_record_list = None
                activity_metadata_uuid_record = None
                try:
                    activity_metadata_uuid_record_list = ug.getNewUUID(
                        current_token, HubmapConst.METADATA_TYPE_CODE)
                    if (activity_metadata_uuid_record_list == None) or (len(activity_metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    activity_metadata_uuid_record = activity_metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))

                stmt = Activity.get_create_activity_metadata_statement(activity_metadata_record, activity_metadata_uuid_record, activity_uuid_record, metadata_userinfo, provenance_group)              
                tx.run(stmt)

                # create the relationships
                stmt = Neo4jConnection.create_relationship_statement(
                    sourceUUID, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(
                    activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                # create multiple relationships if several samples are created
                for uuid_record in specimen_uuid_record_list:
                    stmt = Neo4jConnection.create_relationship_statement(
                        uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE])
                    tx.run(stmt)
                    stmt = Neo4jConnection.create_relationship_statement(
                        activity_uuid_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.ACTIVITY_OUTPUT_REL, uuid_record[HubmapConst.UUID_ATTRIBUTE])
                    tx.run(stmt)

                tx.commit()
                return_obj = {'new_samples': return_list, 'sample_metadata' : metadata_record}
                return return_obj
                #return specimen_uuid_record_list
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
            except LookupError as le:
                print('A lookup error occurred: ', str(le))
                if tx.closed() == False:
                    tx.rollback()
                raise le
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                if tx.closed() == False:
                    tx.rollback()
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                if tx.closed() == False:
                    tx.rollback()
            except HubmapError as he:
                print('A Hubmap error was encountered: ', str(he))
                if tx.closed() == False:
                    tx.rollback()
                raise he
            except:
                print('A general error occurred: ')
                traceback.print_exc()
                if tx.closed() == False:
                    tx.rollback()

    @staticmethod
    def generate_lab_identifiers(driver, parentUUID, specimen_count=1, organ_specifier=None, is_new_donor=False):
        return_list = []
        return_data = {}
        update_stmt = None
        with driver.session() as session:
            tx = None
            try:
                parent_uuid_list = []
                parent_uuid_record = {}
                stmt = "MATCH (e:{ENTITY_NODE_NAME} {{ {UUID_ATTRIBUTE}: '{parentUUID}' }} ) RETURN e.{UUID_ATTRIBUTE} AS uuid, e.{LAB_IDENTIFIER_ATTRIBUTE} AS lab_identifier, e.{NEXT_IDENTIFIER_ATTRIBUTE} AS next_identifier".format(
                    UUID_ATTRIBUTE=HubmapConst.UUID_ATTRIBUTE, ENTITY_NODE_NAME=HubmapConst.ENTITY_NODE_NAME, 
                    parentUUID=parentUUID, doi_attr=HubmapConst.DOI_ATTRIBUTE,LAB_IDENTIFIER_ATTRIBUTE=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                    HAS_METADATA=HubmapConst.HAS_METADATA_REL, NEXT_IDENTIFIER_ATTRIBUTE=HubmapConst.NEXT_IDENTIFIER_ATTRIBUTE)    
                for record in session.run(stmt):
                    parent_uuid_list.append(record)
                if len(parent_uuid_list) == 0:
                    raise LookupError('Unable to find entity using identifier:' + parentUUID)
                if len(parent_uuid_list) > 1:
                    raise LookupError('Error more than one entity found with identifier:' + parentUUID)
                parent_uuid_record['uuid'] = parent_uuid_list[0]['uuid']
                parent_lab_identifier = parent_uuid_list[0]['lab_identifier']
                parent_uuid_record['next_identifier'] = parent_uuid_list[0]['next_identifier']
                
                
                # update the parent record with the new counter
                current_identifier = int(parent_uuid_record['next_identifier'])
                if organ_specifier == None:
                    parent_uuid_record['next_identifier'] = current_identifier + specimen_count
                # NOTE: We don't want to run this statement because it could disrupt the other transaction active on the driver
                update_stmt = Neo4jConnection.get_update_statement(parent_uuid_record, False)

                cnt = 0
                new_lab_identifier = None
                while cnt < specimen_count:
                    if is_new_donor == True:
                        new_id = cnt+current_identifier
                        str_new_id = '{0:04d}'.format(new_id)
                        new_lab_identifier = str(parent_lab_identifier) + str_new_id
                        return_list.append(new_lab_identifier)
                    elif organ_specifier != None:
                        # this covers the case where a new organ is added to a donor record
                        # first, check to see if the identifier already exists
                        new_lab_identifier = str(parent_lab_identifier) + '-' + organ_specifier
                        does_id_exist = Specimen.lab_identifier_exists(driver, new_lab_identifier)
                        if does_id_exist == True:
                            raise HubmapError('Error: organ identifier already exists: ' + new_lab_identifier,'Error: organ identifier already exists: ' + new_lab_identifier)
                        return_list.append(new_lab_identifier)
                            
                    else:
                        # this covers the "normal" sample case
                        new_lab_identifier = str(parent_lab_identifier) + '-' + str(cnt+current_identifier)
                        return_list.append(new_lab_identifier)
                    
                    # check to see if the new_lab_identifier already exists in Neo4j
                    check_stmt = "MATCH (e:{ENTITY_NODE_NAME} {{ {LAB_IDENTIFIER_ATTRIBUTE}: '{newIdentifier}' }} ) RETURN e.{UUID_ATTRIBUTE} AS uuid, e.{LAB_IDENTIFIER_ATTRIBUTE} AS lab_identifier".format(
                        UUID_ATTRIBUTE=HubmapConst.UUID_ATTRIBUTE, ENTITY_NODE_NAME=HubmapConst.ENTITY_NODE_NAME, 
                        LAB_IDENTIFIER_ATTRIBUTE=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,newIdentifier=new_lab_identifier)    
                    for record in session.run(check_stmt):
                        raise HubmapError("Error: display identifier {newid} already exists in the system.  Please check to see if the organ already exists for this donor.".format(newid=new_lab_identifier), "Error: display identifier {newid} already exists in the system".format(newid=new_lab_identifier))
                    
                        
                    cnt += 1

            except ConnectionError as ce:
                print('A connection error occurred: ', str(ce.args[0]))
                raise ce
            except ValueError as ve:
                print(ve)
                raise ve
            except LookupError as le:
                print('A lookup error occurred: ', str(le))
                raise le
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                raise te
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                raise cse
            except HubmapError as he:
                print('A Hubmap error was encountered: ', str(he))
                raise he
            except Exception as e:
                print('A general error occurred: ')
                print(str(e))
                traceback.print_exc()
        return_data = {'update_statement' : update_stmt, 'new_id_list' : return_list}
        return return_data

    @staticmethod
    def lab_identifier_exists(driver, new_lab_identifier):
        with driver.session() as session:
            try:
                return_list = []
                stmt = """MATCH (e:Entity {{ {entitytype}: '{SAMPLE_TYPE_CODE}', {LAB_IDENTIFIER_ATTRIBUTE}: '{new_lab_identifier}' }}) RETURN e.{LAB_IDENTIFIER_ATTRIBUTE} AS lab_identifier""".format(
                    entitytype=HubmapConst.ENTITY_TYPE_ATTRIBUTE, SAMPLE_TYPE_CODE=HubmapConst.SAMPLE_TYPE_CODE, LAB_IDENTIFIER_ATTRIBUTE=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                    new_lab_identifier=new_lab_identifier) 
                for record in session.run(stmt):
                    return_list.append(record)
                if len(return_list) == 0:
                    return False
                if len(return_list) > 1:
                    return True
            except ConnectionError as ce:
                print('A connection error occurred: ', str(ce.args[0]))
                raise ce
            except TransactionError as te:
                print('A transaction error occurred: ', te.value)
                raise te
            except CypherError as cse:
                print('A Cypher error was encountered: ', cse.message)
                raise cse
        
        
    """    
    @staticmethod
    def get_create_activity_metadata_statement(activity_metadata_record, activity_metadata_uuid_record, activity_uuid_record, metadata_userinfo, provenance_group):
        activity_metadata_record[HubmapConst.UUID_ATTRIBUTE] = activity_metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
        activity_metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
        activity_metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = activity_uuid_record[HubmapConst.UUID_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[
            HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE]
        activity_metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE]
        stmt = Neo4jConnection.get_create_statement(
            activity_metadata_record, HubmapConst.METADATA_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
        return stmt
    """
    
    @staticmethod
    def get_create_metadata_statement(metadata_record, current_token, specimen_uuid_record, metadata_userinfo, provenance_group, file_list, data_directory, request):
        metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
        uuid_reference_list = []
        for uuid_item in specimen_uuid_record:
            uuid_reference_list.append(uuid_item[HubmapConst.UUID_ATTRIBUTE])
        metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = uuid_reference_list
        metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE]

        metadata_file_path = None
        protocol_file_path = None
        image_file_data_list = None
        if len(file_list) > 0:
            # append the current metadata UUID to the data_directory to avoid filename collisions.
            # this method will also only create one copy of the file if the file is shared across several
            # samples
            data_directory = get_data_directory(data_directory, metadata_record[HubmapConst.UUID_ATTRIBUTE], True)
            #if 'metadata_file' in file_list:
            #    metadata_file_path = Specimen.upload_file_data(request, 'metadata_file', data_directory)
            #    metadata_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
            if 'protocol_file' in file_list:
                protocol_file_path = Specimen.upload_file_data(request, 'protocol_file', data_directory)
                metadata_record[HubmapConst.PROTOCOL_FILE_ATTRIBUTE] = protocol_file_path
            if 'metadatas' in metadata_record:
                metadata_file_path = Specimen.upload_multiple_file_data(request, metadata_record['metadatas'], file_list, data_directory)
                metadata_record[HubmapConst.METADATA_FILE_ATTRIBUTE] = metadata_file_path
                metadata_record[HubmapConst.METADATAS_ATTRIBUTE] = metadata_file_path
            if 'images' in metadata_record:
                image_file_data_list = Specimen.upload_multiple_file_data(request, metadata_record['images'], file_list, data_directory)
                metadata_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list
            if 'protocols' in metadata_record:
                protocol_file_data_list = Specimen.upload_multiple_protocol_file_data(request, metadata_record['protocols'], file_list, data_directory)
                metadata_record[HubmapConst.PROTOCOL_FILE_METADATA_ATTRIBUTE] = protocol_file_data_list
                     


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
            metadata_record, HubmapConst.METADATA_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
        print('Metadata Create statement: ' + stmt)
        return stmt

    @classmethod 
    def get_image_file_list_for_uuid(self, uuid):
        conn = Neo4jConnection(self.confdata['NEO4J_SERVER'], self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD'])
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
            traceback.print_exc()
    
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
                    existing_file = existing_file_data_dict[str(os.path.basename(file_data['file_name']))]
                    if 'description' in file_data:
                        existing_file['description'] = file_data['description']
                    return_list.append(existing_file)
                    
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
        “protocol_doi”:””}, 
        {"description": "", " protocol_file ": "/Users/chb69/globus_temp_data/5bd084c8-edc2-11e8-802f-0e368f3075e8/f8ed3f8e2e8a49c032b602a35126ec71/Revision2OfTR15-119.pdf", “protocol_doi”:””}]" 
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
                """else:
                    if 'protocol_doi' not in data_entry:
                        data_entry['protocol_doi'] = None
                    existing_url_data_dict[data_entry['protocol_doi']] = data_entry
                """
        # walk through each file represented on the web form.  For each file decide if it represents a new file or an existing file
        # Note: this code builds a list of the current files.  Effectively, this approach implicitly "deletes" any previous files removed from the
        # web form. 
        for file_data in annotated_file_list:
            try:
                # upload the file if it represents a new file.  New files are found in the file_name_dict
                if (str(os.path.basename(file_data['protocol_file'])) in file_name_dict) == True:
                    new_filepath = Specimen.upload_file_data(request, str(file_data['id']), directory_path)
                    file_obj = {'protocol_file': new_filepath, 'protocol_doi': ''}
                    return_list.append(file_obj)
                else:
                    if len(str(file_data['protocol_file'])) > 0:
                        # in this case, simply copy an existing file's data into the retrun_list
                        return_list.append(existing_file_data_dict[os.path.basename(file_data['protocol_file'])])
                    else:
                        if file_data['protocol_doi'] in existing_url_data_dict:
                            # copy the existing protocol_doi entry
                            return_list.append(existing_url_data_dict[file_data['protocol_doi']])
                        else:
                            #create a new protocol_doi entry
                            file_obj = {'protocol_file': '', 'protocol_doi': str(file_data['protocol_doi'])}
                            return_list.append(file_obj)  
                            

                    """            
                    for file_data in annotated_file_list:
                        try:
                            # upload the file if it represents a new file
                            if (str(file_data['id']) in request_file_list) == True:
                                new_filepath = Specimen.upload_file_data(request, str(file_data['id']), directory_path)
                                file_obj = {'protocol_file': new_filepath, 'protocol_doi': ''}
                                return_list.append(file_obj)
                            # if there is no file to upload, but there is a protocol URL:
                            elif len(str(file_data['protocol_doi'])) > 0:
                                file_obj = {'protocol_file': '', 'protocol_doi': str(file_data['protocol_doi'])}
                                return_list.append(file_obj)  
                    """                                      
            except:
                raise
        return_string = json.dumps(return_list)
        return_string = str(return_string).replace('\'', '"')
        return return_string

    @staticmethod
    def get_siblingid_list(driver, uuid):
        sibling_return_list = []
        with driver.session() as session:
            try:
                stmt = "MATCH (e:{ENTITY_NODE_NAME} {{ {UUID_ATTRIBUTE}: '{uuid}' }})<-[:{ACTIVITY_OUTPUT_REL}]-(a:{ACTIVITY_NODE_NAME}) OPTIONAL MATCH (a:{ACTIVITY_NODE_NAME})-[:{ACTIVITY_OUTPUT_REL}]->(sibling:{ENTITY_NODE_NAME}) RETURN sibling.{UUID_ATTRIBUTE} AS sibling_uuid, sibling.{LAB_IDENTIFIER_ATTRIBUTE} AS sibling_hubmap_identifier, sibling.{LAB_TISSUE_ID} AS sibling_lab_tissue_id, sibling.{RUI_LOCATION_ATTR} AS sibling_rui_location".format(
                    UUID_ATTRIBUTE=HubmapConst.UUID_ATTRIBUTE, ENTITY_NODE_NAME=HubmapConst.ENTITY_NODE_NAME, 
                    uuid=uuid, ACTIVITY_NODE_NAME=HubmapConst.ACTIVITY_NODE_NAME, LAB_IDENTIFIER_ATTRIBUTE=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                    ACTIVITY_OUTPUT_REL=HubmapConst.ACTIVITY_OUTPUT_REL, LAB_TISSUE_ID =HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE, RUI_LOCATION_ATTR=HubmapConst.RUI_LOCATION_ATTRIBUTE)    
                for record in session.run(stmt):
                    sibling_record = {}
                    sibling_record['uuid'] = record.get('sibling_uuid')
                    sibling_record['hubmap_identifier'] = record.get('sibling_hubmap_identifier')
                    if record.get('sibling_lab_tissue_id') != None:
                        sibling_record['lab_tissue_id'] = record.get('sibling_lab_tissue_id')
                    if record.get('sibling_rui_location') != None:
                        sibling_record['rui_location'] = record.get('sibling_rui_location')
                    sibling_return_list.append(sibling_record)
                return sibling_return_list
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
                traceback.print_exc()

    @staticmethod
    def get_donor(driver, uuid_list):
        donor_return_list = []
        with driver.session() as session:
            try:
                for uuid in uuid_list:
                    stmt = "MATCH (donor)-[:{ACTIVITY_INPUT_REL}*]->(activity)-[:{ACTIVITY_INPUT_REL}|:{ACTIVITY_OUTPUT_REL}*]->(e) WHERE e.{UUID_ATTRIBUTE} = '{uuid}' and donor.{ENTITY_TYPE_ATTRIBUTE} = 'Donor' RETURN donor.{UUID_ATTRIBUTE} AS donor_uuid".format(
                        UUID_ATTRIBUTE=HubmapConst.UUID_ATTRIBUTE, ENTITY_TYPE_ATTRIBUTE=HubmapConst.ENTITY_TYPE_ATTRIBUTE, 
                        uuid=uuid, ACTIVITY_OUTPUT_REL=HubmapConst.ACTIVITY_OUTPUT_REL, ACTIVITY_INPUT_REL=HubmapConst.ACTIVITY_INPUT_REL)    
                    for record in session.run(stmt):
                        donor_record = {}
                        donor_uuid = record['donor_uuid']
                        donor_record = Entity.get_entity(driver, donor_uuid)
                        #donor_metadata = Entity.get_entity_metadata(driver, donor_uuid)
                        #donor_record['metadata'] = donor_metadata
                        donor_return_list.append(donor_record)
                return donor_return_list
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
                traceback.print_exc()
    
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
    def search_specimen(driver, search_term, readonly_uuid_list, writeable_uuid_list, group_uuid_list, specimen_type=None, include_datasets=False):
        return_list = []
        lucence_index_name = "testIdx"
        entity_type_clause = "entity_node.entitytype IN ['Donor','Sample']"
        if include_datasets == True:
            entity_type_clause = "entity_node.entitytype IN ['Donor','Sample','Dataset']"
        metadata_clause = "{entitytype: 'Metadata'}"
        if specimen_type != None:
            if str(specimen_type).lower() == 'donor':
                entity_type_clause = "entity_node.entitytype = 'Donor'"
            elif str(specimen_type).lower() == 'dataset':
                entity_type_clause = "entity_node.entitytype = 'Dataset'"
            else: #default case: it is a Sample
                entity_type_clause = "entity_node.entitytype = 'Sample' AND lucene_node.specimen_type = '{specimen_type}'".format(specimen_type=specimen_type)
            
        #group_clause = ""
        # first swap the entity_node.entitytype out of the clause, then the lucene_node.specimen_type
        # I can't do this in one step since replacing the entity_node would update other sections of the query
        lucene_type_clause = entity_type_clause.replace('entity_node.entitytype', 'lucene_node.entitytype')
        lucene_type_clause = lucene_type_clause.replace('lucene_node.specimen_type', 'metadata_node.specimen_type')
        
        print("-----><entity_type_clause: " + entity_type_clause)
        
        provenance_group_uuid_clause = ""
        if group_uuid_list != None:
            if len(group_uuid_list) > 0:
                provenance_group_uuid_clause += " AND lucene_node.{provenance_group_uuid_attr} IN [".format(provenance_group_uuid_attr=HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE)
                for group_uuid in group_uuid_list:
                    provenance_group_uuid_clause += "'{uuid}', ".format(uuid=group_uuid)
                # lop off the trailing comma and space and add the finish bracket:
                provenance_group_uuid_clause = provenance_group_uuid_clause[:-2] +']'
            # if all groups are being selected, ignore the test group
            elif len(group_uuid_list) == 0:
                test_group_uuid = '5bd084c8-edc2-11e8-802f-0e368f3075e8'
                provenance_group_uuid_clause += " AND NOT lucene_node.{provenance_group_uuid_attr} IN ['{group_uuid}']".format(provenance_group_uuid_attr=HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE,group_uuid=test_group_uuid)
        
        stmt_list = []
        if search_term == None:
            stmt1 = """MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node) WHERE {entity_type_clause} {provenance_group_uuid_clause}
            RETURN COALESCE(entity_node.{hubmapid_attr}, entity_node.{display_doi_attr}) AS hubmap_identifier, entity_node.{lab_tissue_id_attr} AS lab_tissue_id, entity_node.{rui_location_attr} AS rui_location, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, lab_tissue_id_attr=HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE, rui_location_attr=HubmapConst.RUI_LOCATION_ATTRIBUTE)
            stmt_list = [stmt1]
        else:
            # use the full text indexing if searching for a term
            cypher_index_clause = "CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score"
            return_clause = "score, "
            order_by_clause = "score DESC, "    
            stmt1 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node) WHERE {entity_type_clause} {provenance_group_uuid_clause}
            RETURN score, COALESCE(entity_node.{hubmapid_attr}, entity_node.{display_doi_attr}) AS hubmap_identifier, entity_node.{lab_tissue_id_attr} AS lab_tissue_id, entity_node.{rui_location_attr} AS rui_location, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, lab_tissue_id_attr=HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE, rui_location_attr=HubmapConst.RUI_LOCATION_ATTRIBUTE)
    
            provenance_group_uuid_clause = provenance_group_uuid_clause.replace('lucene_node.', 'metadata_node.')

            stmt2 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (metadata_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(lucene_node) WHERE {lucene_type_clause} {provenance_group_uuid_clause}
            RETURN score, COALESCE(lucene_node.{hubmapid_attr}, lucene_node.{display_doi_attr}) AS hubmap_identifier, lucene_node.{lab_tissue_id_attr} AS lab_tissue_id, lucene_node.{rui_location_attr} AS rui_location, lucene_node.{uuid_attr} AS entity_uuid, lucene_node.{entitytype_attr} AS datatype, lucene_node.{doi_attr} AS entity_doi, lucene_node.{display_doi_attr} as entity_display_doi, properties(metadata_node) AS metadata_properties, metadata_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, lab_tissue_id_attr=HubmapConst.LAB_SAMPLE_ID_ATTRIBUTE, rui_location_attr=HubmapConst.RUI_LOCATION_ATTRIBUTE)
    
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
                                if record.get('score', None) != None:
                                    data_record['score'] = record['score']
                                data_record['entity_display_doi'] = record['entity_display_doi']
                                data_record['entity_doi'] = record['entity_doi']
                                data_record['datatype'] = record['datatype']
                                data_record['properties'] = record['metadata_properties']
                                data_record['hubmap_identifier'] = record['hubmap_identifier']
                                if record.get('lab_tissue_id', None) != None:
                                    data_record['properties']['lab_tissue_id'] = record['lab_tissue_id']
                                if record.get('rui_location', None) != None:
                                    data_record['properties']['rui_location'] = record['rui_location']
                                # determine if the record is writable by the current user
                                data_record['writeable'] = False
                                if record['metadata_properties']['provenance_group_uuid'] in writeable_uuid_list:
                                    data_record['writeable'] = True
                                display_doi_list.append(str(data_record['entity_display_doi']))
                                return_list.append(data_record)
                            # find any existing records and update their score (if necessary)
                            else:
                                if search_term != None:
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
                    traceback.print_exc()
                    raise
        if search_term != None:
            # before returning the list, sort it again if new items were added
            return_list.sort(key=lambda x: x['score'], reverse=True)
            # promote any items where the entity_display_doi is an exact match to the search term (ex: HBM:234-TRET-596)
            # to the top of the list (regardless of score)
            if search_term != None:
                for ret_record in return_list:
                    if str(ret_record['hubmap_identifier']).find(str(search_term)) > -1:
                        return_list.remove(ret_record)
                        return_list.insert(0,ret_record)     
                        break                       

        return return_list                    

    @staticmethod
    def update_metadata_access_levels(driver, datasets: List[str] = []):
        from dataset import Dataset
        """ Function to update data_access_level attribute for entities base on datasets' uuid

        Args:
            driver: Neo4j connection driver
            datasets: A list of dataset uuid
        Returns:
            
        """
        try:
            entity_uuids = set()
            for uuid in datasets:
                ans = Entity.get_ancestors(driver, uuid)
                for an in ans:
                    if an['entitytype'].lower() != 'dataset':
                        entity_uuids.add((an['uuid'], an['entitytype']))
                col = Entity.get_collection(driver, uuid)
                if col is not None:
                    entity_uuids.add((col['uuid'], col['entitytype']))

            for uuid, entity_type in entity_uuids:
                if entity_type.lower() != 'dataset':
                    uuid_arg = uuid if entity_type.lower() == 'collection' else [uuid]
                    datasets = getattr(Dataset, f'get_datasets_by_{entity_type.lower()}')(driver, uuid_arg)
                    data_access_level = Specimen.__metadata_get_access_level_by_datasets(datasets)
                    # import pdb; pdb.set_trace()
                    Specimen.__update_access_level(driver = driver, uuid = uuid, 
                                                   entity_type = entity_type, 
                                                   data_access_level = data_access_level)
        except:
            raise Exception("unexcepted error")

    @staticmethod
    def __metadata_get_access_level_by_datasets(datasets = []):
        """ Funtion determind the data_access_level
        
        Args:
            datasets: a lists of dataset node with metadat info in 'properties' key

        Return:
            HubmapConst.ACCESS_LEVEL_PUBLIC or HubmapConst.ACCESS_LEVEL_CONSORTIUM
        """
        return HubmapConst.ACCESS_LEVEL_PUBLIC \
                    if any([True for d in datasets  \
                        if 'properties' in d and HubmapConst.DATA_ACCESS_LEVEL in d['properties'] \
                        and d['properties'][HubmapConst.DATA_ACCESS_LEVEL] == HubmapConst.ACCESS_LEVEL_PUBLIC]) \
                    else HubmapConst.ACCESS_LEVEL_CONSORTIUM

    @staticmethod
    def __update_access_level(driver, uuid, entity_type, data_access_level):
        """ Function to update the data_access_level attribute

        Args:
            driver: Neo4j DB driver
            uuid: The uuid of the node
            entity_type: The type of the node
            data_access_level: The data access_level

        Return:

        """
        with driver.session() as session:
            try:
                if entity_type.lower() in ['donor', 'sample']:
                    stmt = f"""MATCH (e {{uuid: '{uuid}'}})-[:{HubmapConst.HAS_METADATA_REL}]->(m) 
                        SET m.{HubmapConst.DATA_ACCESS_LEVEL} = '{data_access_level.lower()}' RETURN e, m"""
                elif entity_type.lower() == 'collection':
                    stmt = f"""MATCH (c {{uuid: '{uuid}'}})
                        SET c.{HubmapConst.DATA_ACCESS_LEVEL} = '{data_access_level.lower()}' RETURN c"""
                else:
                    raise ValueError(f"Cannot update data_access_level attribute for '{entity_type}' type")
                session.run(stmt)
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
                traceback.print_exc()    

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

def initialize_lab_identifiers(driver):
    group_list = AuthCache.getHMGroups()
    with driver.session() as session:
        tx = None
        try:
            tx = session.begin_transaction()
            for group_name in group_list:
                group = group_list[group_name]
                if 'tmc_prefix' in group:
                    #create an entry in Neo4j
                    stmt = """CREATE (a:Entity {{ {ENTITY_TYPE_ATTRIBUTE} : '{LAB_TYPE_CODE}', {LAB_IDENTIFIER_ATTRIBUTE} : '{tmc_prefix}',
                     {NAME_ATTRIBUTE} : '{name}', {DISPLAYNAME_ATTRIBUTE} : '{displayname}', {UUID_ATTRIBUTE} : '{uuid}', {NEXT_IDENTIFIER_ATTRIBUTE} : 1,
                     provenance_create_timestamp: TIMESTAMP(), provenance_modified_timestamp: TIMESTAMP()}} )""".format(
                        LAB_TYPE_CODE=HubmapConst.LAB_TYPE_CODE, ENTITY_TYPE_ATTRIBUTE=HubmapConst.ENTITY_TYPE_ATTRIBUTE,
                        LAB_IDENTIFIER_ATTRIBUTE=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,tmc_prefix=group['tmc_prefix'],
                        NAME_ATTRIBUTE=HubmapConst.NAME_ATTRIBUTE, name=group['name'], DISPLAYNAME_ATTRIBUTE=HubmapConst.DISPLAY_NAME_ATTRIBUTE,
                        displayname=group['displayname'], UUID_ATTRIBUTE=HubmapConst.UUID_ATTRIBUTE, uuid=group['uuid'],
                        NEXT_IDENTIFIER_ATTRIBUTE=HubmapConst.NEXT_IDENTIFIER_ATTRIBUTE)
                    print("Here is the stmt: " + stmt)
                    tx.run(stmt)
            tx.commit()
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
            traceback.print_exc()
            if tx.closed() == False:
                tx.rollback()
            
if __name__ == "__main__":
    NEO4J_SERVER = 'bolt://12.123.12.123:3213'
    NEO4J_USERNAME = 'neo4j'
    NEO4J_PASSWORD = '123'
    conn = Neo4jConnection(NEO4J_SERVER, NEO4J_USERNAME, NEO4J_PASSWORD)
    driver = conn.get_driver()
    
    # uuid_list = ['c1e69dc0e6b3c1ba0773ba337661791a']
    
    # donor_data = Specimen.get_donor(driver, uuid_list)
    
    # print("Donor:")
    # print(donor_data)

    #  '26040ef5c7b7e265d9bab019f7a52188', '90a3630e7d6afc4b335eb586dab4304a'
    Specimen.update_metadata_access_levels(driver, ['26040ef5c7b7e265d9bab019f7a52188'])
    

