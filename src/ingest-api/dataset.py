'''
Created on Apr 18, 2019

@author: chb69
'''
import requests
from neo4j import TransactionError, CypherError
import sys
import os
import configparser
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import base64
from globus_sdk.exc import TransferAPIError
import urllib.parse
from flask import Response
from pprint import pprint
import shutil
import json
import traceback

from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.hm_auth import AuthHelper, AuthCache
from hubmap_commons.entity import Entity
from hubmap_commons.autherror import AuthError
from hubmap_commons.metadata import Metadata
from hubmap_commons.activity import Activity
from hubmap_commons.provenance import Provenance

class Dataset(object):
    '''
    classdocs
    '''
    confdata = {}

    @classmethod
    
    def __init__(self, config): 
        self.confdata = config

    @classmethod
    def search_datasets(self, driver, token, search_term, readonly_uuid_list, writeable_uuid_list, group_uuid_list):
        return_list = []
        lucence_index_name = "testIdx"
        entity_type_clause = "entity_node.entitytype = 'Dataset'"
        metadata_clause = "{entitytype: 'Metadata'}"
            
        #group_clause = ""
        # first swap the entity_node.entitytype out of the clause, then the lucene_node.specimen_type
        # I can't do this in one step since replacing the entity_node would update other sections of the query
        lucene_type_clause = entity_type_clause.replace('entity_node.entitytype', 'lucene_node.entitytype')
        lucene_type_clause = lucene_type_clause.replace('lucene_node.specimen_type', 'metadata_node.specimen_type')
        
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
            stmt1 = """MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node)<-[:ACTIVITY_OUTPUT]-(create_activity:Activity)-[:HAS_METADATA]->(activity_metadata:Metadata) 
            WHERE {entity_type_clause} {provenance_group_uuid_clause}
            OPTIONAL MATCH (entity_node)-[:IN_COLLECTION]->(c:Collection)
            RETURN entity_node.{hubmapid_attr} AS hubmap_identifier, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, c.{uuid_attr} AS collection_uuid, 
            entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp, activity_metadata.{create_user_email} AS created_by_email
            ORDER BY modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, create_user_email=HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE)
            stmt_list = [stmt1]
        else:
            # use the full text indexing if searching for a term
            cypher_index_clause = "CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score"
            return_clause = "score, "
            order_by_clause = "score DESC, "    
            stmt1 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node:Entity)<-[:ACTIVITY_OUTPUT]-(create_activity:Activity)-[:HAS_METADATA]->(activity_metadata:Metadata) WHERE {entity_type_clause} {provenance_group_uuid_clause}
            OPTIONAL MATCH (entity_node)-[:IN_COLLECTION]->(c:Collection)
            RETURN score, entity_node.{hubmapid_attr} AS hubmap_identifier, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp, activity_metadata.{create_user_email} AS created_by_email
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, create_user_email=HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE)
    
            provenance_group_uuid_clause = provenance_group_uuid_clause.replace('lucene_node.', 'metadata_node.')

            stmt2 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (metadata_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(lucene_node:Entity)<-[:ACTIVITY_OUTPUT]-(create_activity:Activity)-[:HAS_METADATA]->(activity_metadata:Metadata) WHERE {lucene_type_clause} {provenance_group_uuid_clause}
            OPTIONAL MATCH (entity_node)-[:IN_COLLECTION]->(c:Collection)
            RETURN score, lucene_node.{hubmapid_attr} AS hubmap_identifier, lucene_node.{uuid_attr} AS entity_uuid, lucene_node.{entitytype_attr} AS datatype, lucene_node.{doi_attr} AS entity_doi, lucene_node.{display_doi_attr} as entity_display_doi, properties(metadata_node) AS metadata_properties, metadata_node.{provenance_timestamp} AS modified_timestamp, activity_metadata.{create_user_email} AS created_by_email
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause, create_user_email=HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE)
    
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
                                data_record['created_by'] = record['created_by_email']
                                if 'collection_uuid' in data_record['properties'] and (len(str(data_record['properties']['collection_uuid'])) > 0):
                                    dataset_collection = Entity.get_entity(driver, data_record['properties']['collection_uuid'])
                                    data_record['properties']['collection'] = dataset_collection
                                
                                # determine if the record is writable by the current user
                                write_flag = self.get_writeable_flag(token, writeable_uuid_list, record)                                
                                data_record['writeable'] = write_flag
                                
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
                    if str(ret_record['entity_display_doi']).find(str(search_term)) > -1:
                        return_list.remove(ret_record)
                        return_list.insert(0,ret_record)     
                        break                       

        return return_list                    

    @staticmethod
    def get_dataset(driver, identifier):
        try:
            dataset_record = Entity.get_entity_metadata(driver, identifier)
            if 'collection_uuid' in dataset_record and (len(str(dataset_record['collection_uuid'])) > 0):
                dataset_collection = Entity.get_entity(driver, dataset_record['collection_uuid'])
                dataset_record['collection'] = dataset_collection
            return dataset_record
        except BaseException as be:
            pprint(be)
            raise be

    @staticmethod
    def get_node_properties(driver, stmt, there_can_be_only_one=False): 
        with driver.session() as session:
            return_list = []
            try:
                for record in session.run(stmt):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
                if len(return_list) == 0:
                    raise LookupError('Unable to find entity in statement:' + stmt)
                if len(return_list) > 1 and there_can_be_only_one == True:
                    raise LookupError('Error more than one entity found in statement:' + stmt)
                if there_can_be_only_one == True:
                    return return_list[0]
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def get_create_metadata_statement(metadata_record, current_token, dataset_uuid, metadata_userinfo, provenance_group):
        metadata_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_TYPE_CODE
        metadata_record[HubmapConst.REFERENCE_UUID_ATTRIBUTE] = dataset_uuid
        metadata_record[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE]
        metadata_record[HubmapConst.PROVENANCE_GROUP_NAME_ATTRIBUTE] = provenance_group['name']
        metadata_record[HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE] = provenance_group['uuid']
        if HubmapConst.DATA_TYPES_ATTRIBUTE in metadata_record:
            if metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE] == None or len(metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE]) == 0:
                        metadata_record.pop(HubmapConst.DATA_TYPES_ATTRIBUTE)
            else:
                try:
                    #try to load the data as json
                    if isinstance(metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE], list):
                        json_data_type_list = json.loads(str(metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE]))
                        # then convert it to a json string
                        metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE] = json.dumps(json_data_type_list)
                except ValueError:
                    # that failed, so load it as a string
                    metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE] = metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE]
                     
        stmt = Neo4jConnection.get_create_statement(
            metadata_record, HubmapConst.METADATA_NODE_NAME, HubmapConst.METADATA_TYPE_CODE, True)
        print('Metadata Create statement: ' + stmt)
        return stmt

    # Use this method to return provenance data for a dataset
    @classmethod
    def get_activity_output_for_dataset(self, driver, uuid): 
        with driver.session() as session:
            return_list = []
            try:
                stmt = "MATCH (e {{{uuid_attrib}: $uuid}})-[:{activity_output_rel}]-(a) RETURN properties(a) AS properties".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE, 
                        activity_output_rel=HubmapConst.ACTIVITY_OUTPUT_REL)
                for record in session.run(stmt, uuid=uuid):
                    activity_record = record['properties']
                    return_list.append(activity_record)
                    #print (str(activity_record))
                return return_list                  
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise


    # Create derived dataset
    @classmethod
    def create_derived_datastage(self, driver, nexus_token, json_data):
        conn = Neo4jConnection(self.confdata['NEO4J_SERVER'], self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        
        # check the incoming UUID to make sure they exist
        source_dataset_uuid = str(json_data['source_dataset_uuid']).strip()

        if source_dataset_uuid == None or len(source_dataset_uuid) == 0:
            raise ValueError('Error: sourceUUID must be set to create a derived dataset')
        
        # In this derived dataset case, only one source uuid in the list
        source_UUID_Data = []
        ug = UUID_Generator(self.confdata['UUID_WEBSERVICE_URL'])
        try:
            hmuuid_data = ug.getUUID(nexus_token, source_dataset_uuid)
            if len(hmuuid_data) != 1:
                raise ValueError("Could not find information for identifier" + source_dataset_uuid)
            source_UUID_Data.append(hmuuid_data)
        except:
            raise ValueError('Unable to resolve UUID for: ' + source_dataset_uuid)

        # Get information of the source dataset
        dataset = Dataset(self.confdata) 
        dataset_record = dataset.get_dataset(driver, source_dataset_uuid)

        # See if provenance_group_uuid of the source dataset exists in the list of group uuids from the user info.
        # If so, use the provenance_group_uuid for the derived dataset. If not, throw an error.
        source_dataset_provenance_group_uuid = None
        if 'provenance_group_uuid' in dataset_record:
            source_dataset_provenance_group_uuid = dataset_record['provenance_group_uuid']

        # Note: the user who can create the derived dataset doesn't have to be the same person who created the source dataset
        # That's why we need to parase the userinfo again here
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()

        userinfo = None
        userinfo = authcache.getUserInfo(nexus_token, True)
        if userinfo is Response:
            raise ValueError('Cannot authenticate current token via Globus.')

        # Decide the provenance group UUID
        provenance_group = None

        # See if provenance_group_uuid of the source dataset exists in the list of group uuids from the user info.
        # Also check if the user is_system_account is True.  If it is True then just copy the proveance_group from the original dataset 
        # If so, use the provenance_group_uuid for the derived dataset. If not, throw an error.
        try:
            if source_dataset_provenance_group_uuid in userinfo['hmgroupids'] or ('is_system_account' in userinfo and userinfo['is_system_account'] == True):
                metadata = Metadata(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
                provenance_group = metadata.get_group_by_identifier(source_dataset_provenance_group_uuid)
        except ValueError as ve:
            print("This user has no group access to create this derived dataset from source dataset UUID: " + source_dataset_uuid)
            raise ve

        metadata_userinfo = {}

        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
    
    
        activity_type = HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE
        entity_type = HubmapConst.DATASET_TYPE_CODE
        
        with driver.session() as session:
            # First create a new uuid for this derived dataset
            datastage_uuid_record_list = None
            datastage_uuid = None
            try: 
                datastage_uuid_record_list = ug.getNewUUID(nexus_token, entity_type)
                if (datastage_uuid_record_list == None) or (len(datastage_uuid_record_list) == 0):
                    raise ValueError("UUID service did not return a value")
                datastage_uuid = datastage_uuid_record_list[0]
            except requests.exceptions.ConnectionError as ce:
                raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))

            tx = None
            
            try:
                tx = session.begin_transaction()
                # create the data stage
                dataset_entity_record = {HubmapConst.UUID_ATTRIBUTE : datastage_uuid[HubmapConst.UUID_ATTRIBUTE],
                                         HubmapConst.DOI_ATTRIBUTE : datastage_uuid[HubmapConst.DOI_ATTRIBUTE],
                                         HubmapConst.DISPLAY_DOI_ATTRIBUTE : datastage_uuid['displayDoi'],
                                         HubmapConst.ENTITY_TYPE_ATTRIBUTE : entity_type}
                
                stmt = Neo4jConnection.get_create_statement(dataset_entity_record, HubmapConst.ENTITY_NODE_NAME, entity_type, True)
                tx.run(stmt)
                
                # Create directory on file system for for this new derived dataset
                # setup initial Landing Zone directory for the new datastage
                group_display_name = provenance_group['displayname']

                new_path = make_new_dataset_directory(str(self.confdata['GLOBUS_ENDPOINT_FILEPATH']), str(self.confdata['HUBMAP_WEBSERVICE_FILEPATH']), group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = build_globus_url_for_directory(self.confdata['GLOBUS_ENDPOINT_UUID'], new_path)

                # Create the Entity Metadata node
                # Don't use None, it'll throw TypeError: 'NoneType' object does not support item assignment
                metadata_record = {}

                # Use the dataset name from input json
                # Need to use constant instead of hardcoding later
                metadata_record['name'] = json_data['derived_dataset_name']
                # Also use the dataset data types array from input json and store as string in metadata attribute
                metadata_record[HubmapConst.DATA_TYPES_ATTRIBUTE] = json.dumps(json_data['derived_dataset_types'])
                metadata_record[HubmapConst.SOURCE_UUID_ATTRIBUTE] = source_UUID_Data[0][0]['doiSuffix']

                metadata_record[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = new_globus_path
                metadata_record[HubmapConst.DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE] = new_path
                
                # Set the default status to New
                metadata_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = convert_dataset_status("New")

                metadata_uuid_record_list = None
                metadata_uuid_record = None
                try: 
                    metadata_uuid_record_list = ug.getNewUUID(nexus_token, HubmapConst.METADATA_TYPE_CODE)
                    if (metadata_uuid_record_list == None) or (len(metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    metadata_uuid_record = metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))

                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]

                stmt = Dataset.get_create_metadata_statement(metadata_record, nexus_token, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                tx.run(stmt)

                # Create the associated Activity node in neo4j
                activity = Activity(self.confdata['UUID_WEBSERVICE_URL'])
                sourceUUID_list = []
                for source_uuid in source_UUID_Data:
                    sourceUUID_list.append(source_uuid[0]['hmuuid'])
                
                activity_object = activity.get_create_activity_statements(nexus_token, activity_type, sourceUUID_list, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                activity_uuid = activity_object['activity_uuid']
                for stmt in activity_object['statements']: 
                    tx.run(stmt)                
                
                # Create all relationships
                stmt = Neo4jConnection.create_relationship_statement(datastage_uuid[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)

                tx.commit()

                response_data = {
                    'derived_dataset_uuid': datastage_uuid['uuid'],
                    'group_uuid': source_dataset_provenance_group_uuid,
                    'group_display_name': group_display_name
                }

                return response_data
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()



    @classmethod
    def get_writeable_flag(self, token, writeable_uuid_list, current_record):
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        userinfo = None
        userinfo = authcache.getUserInfo(token, True)
        role_list = AuthCache.getHMRoles()
        
        data_curator_uuid = role_list['hubmap-data-curator']['uuid']
        is_data_curator = False
        for role_uuid in userinfo['hmroleids']:
            if role_uuid == data_curator_uuid:
                    is_data_curator = True
                    break
        # the data curator role overrules the group level write rules
        if is_data_curator == True:
            if current_record['metadata_properties']['status'] in [HubmapConst.DATASET_STATUS_QA]:
                return True
            else:
                return False

        # perform two checks:
        # 1. make sure the user has write access to the record's group
        # 2. make sure the record has a status that is writable
        if current_record['metadata_properties']['provenance_group_uuid'] in writeable_uuid_list:
            if current_record['metadata_properties']['status'] in [HubmapConst.DATASET_STATUS_NEW, HubmapConst.DATASET_STATUS_ERROR, HubmapConst.DATASET_STATUS_REOPENED]:
                return True
        
        return False

        
            
        #print(str(userinfo) + ' is curator: ' + str(is_data_curator))
        
    
    @classmethod
    def create_datastage(self, driver, headers, incoming_record, groupUUID):
        current_token = None
        collection_uuid = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(headers)
        except:
            raise ValueError("Unable to parse token")
        conn = Neo4jConnection(self.confdata['NEO4J_SERVER'], self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        # check all the incoming UUID's to make sure they exist
        incoming_sourceUUID_string = str(incoming_record['source_uuid']).strip()
        if incoming_sourceUUID_string == None or len(incoming_sourceUUID_string) == 0:
            raise ValueError('Error: sourceUUID must be set to create a tissue')
        source_UUID_Data = []
        ug = UUID_Generator(self.confdata['UUID_WEBSERVICE_URL'])
        try:
            incoming_sourceUUID_list = []
            if str(incoming_sourceUUID_string).startswith('['):
                incoming_sourceUUID_list = eval(incoming_sourceUUID_string)
            else:
                incoming_sourceUUID_list.append(incoming_sourceUUID_string)
            for sourceID in incoming_sourceUUID_list:
                hmuuid_data = ug.getUUID(current_token['nexus_token'], sourceID)
                if len(hmuuid_data) != 1:
                    raise ValueError("Could not find information for identifier" + sourceID)
                source_UUID_Data.append(hmuuid_data)
        except:
            raise ValueError('Unable to resolve UUID for: ' + sourceUUID)

        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        nexus_token = current_token['nexus_token']
        transfer_token = current_token['transfer_token']
        auth_token = current_token['auth_token']
        transfer_endpoint = self.confdata['GLOBUS_ENDPOINT_UUID']
        userinfo = None
        userinfo = authcache.getUserInfo(nexus_token, True)
        if userinfo is Response:
            raise ValueError('Cannot authenticate current token via Globus.')
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        data_directory = None
        specimen_uuid_record_list = None
        metadata_record = None
        metadata = Metadata(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
        try:
            provenance_group = metadata.get_group_by_identifier(groupUUID)
        except ValueError as ve:
            raise ve
        metadata_userinfo = {}

        if 'collection_uuid' in incoming_record and (len(str(incoming_record['collection_uuid'])) > 0):
            try:
                collection_info = Entity.get_entity(driver, incoming_record['collection_uuid'])
            except ValueError as ve:
                raise ve
            
        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['email']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE
        entity_type = HubmapConst.DATASET_TYPE_CODE
        
        
        with driver.session() as session:
            datastage_uuid_record_list = None
            datastage_uuid = None
            try: 
                datastage_uuid_record_list = ug.getNewUUID(nexus_token, entity_type)
                if (datastage_uuid_record_list == None) or (len(datastage_uuid_record_list) == 0):
                    raise ValueError("UUID service did not return a value")
                datastage_uuid = datastage_uuid_record_list[0]
            except requests.exceptions.ConnectionError as ce:
                raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
            tx = None
            try:
                tx = session.begin_transaction()
                # create the data stage
                dataset_entity_record = {HubmapConst.UUID_ATTRIBUTE : datastage_uuid[HubmapConst.UUID_ATTRIBUTE],
                                         HubmapConst.DOI_ATTRIBUTE : datastage_uuid[HubmapConst.DOI_ATTRIBUTE],
                                         HubmapConst.DISPLAY_DOI_ATTRIBUTE : datastage_uuid['displayDoi'],
                                         HubmapConst.ENTITY_TYPE_ATTRIBUTE : entity_type}
                
                stmt = Neo4jConnection.get_create_statement(
                    dataset_entity_record, HubmapConst.ENTITY_NODE_NAME, entity_type, True)
                print('Dataset Create statement: ' + stmt)
                tx.run(stmt)
                
                # setup initial Landing Zone directory for the new datastage
                group_display_name = provenance_group['displayname']

                new_path = make_new_dataset_directory(str(self.confdata['GLOBUS_ENDPOINT_FILEPATH']), str(self.confdata['HUBMAP_WEBSERVICE_FILEPATH']), group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = build_globus_url_for_directory(transfer_endpoint, new_path)
                
                """new_path = self.get_globus_file_path(group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = os.makedirs(new_path)"""
                incoming_record[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = new_globus_path
                incoming_record[HubmapConst.DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE] = new_path
                
                # use the remaining attributes to create the Entity Metadata node
                metadata_record = incoming_record
                
                if 'phi' in metadata_record:
                    metadata_record[HubmapConst.HAS_PHI_ATTRIBUTE] = metadata_record['phi']
                    if HubmapConst.HAS_PHI_ATTRIBUTE != 'phi':
                        metadata_record.pop('phi', None)
                
                #set the status of the datastage to New
                metadata_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = convert_dataset_status(str(incoming_record['status']))

                metadata_uuid_record_list = None
                metadata_uuid_record = None
                try: 
                    metadata_uuid_record_list = ug.getNewUUID(nexus_token, HubmapConst.METADATA_TYPE_CODE)
                    if (metadata_uuid_record_list == None) or (len(metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    metadata_uuid_record = metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))


                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]

                stmt = Dataset.get_create_metadata_statement(metadata_record, nexus_token, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                tx.run(stmt)
                # step 4: create the associated activity
                activity = Activity(self.confdata['UUID_WEBSERVICE_URL'])
                sourceUUID_list = []
                for source_uuid in source_UUID_Data:
                    sourceUUID_list.append(source_uuid[0]['hmuuid'])
                activity_object = activity.get_create_activity_statements(nexus_token, activity_type, sourceUUID_list, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                activity_uuid = activity_object['activity_uuid']
                for stmt in activity_object['statements']: 
                    tx.run(stmt)                
                # step 4: create all relationships
                stmt = Neo4jConnection.create_relationship_statement(
                    datastage_uuid[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                if 'collection_uuid' in incoming_record:
                    stmt = Neo4jConnection.create_relationship_statement(
                        datastage_uuid[HubmapConst.UUID_ATTRIBUTE], HubmapConst.IN_COLLECTION_REL, incoming_record['collection_uuid'])
                    tx.run(stmt)
                
                tx.commit()
                ret_object = {'uuid' : datastage_uuid['uuid'], 
                            'display_doi': datastage_uuid['displayDoi'],
                            'doi': datastage_uuid['doi'],
                            HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE: new_globus_path}
                return ret_object
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()


    @classmethod
    def publishing_process(self, driver, headers, uuid, group_uuid, publish=True):
        group_info = None
        metadata_node = None
        metadata = None
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot modify dataset.  Could not find dataset uuid: ' + uuid)
        try:
            metadata_node = Entity.get_entity_metadata(driver, uuid)
            metadata = Metadata(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
        except:
            raise LookupError("Unable to find metadata node for '" + uuid + "'")
        
        try:
            group_info = metadata.get_group_by_identifier(metadata_node['provenance_group_uuid'])
        except:
            raise LookupError("Unable to find group information for '" + metadata_node['uuid'] + "'")
        
        publish_state = HubmapConst.DATASET_STATUS_PUBLISHED
        current_token = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(headers)
        except:
            raise ValueError("Unable to parse token")

        nexus_token = current_token['nexus_token']

        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                #step 1: move the files to the publish directory
                new_publish_path = self.get_publish_path(group_info['displayname'], uuid)
                current_staging_path = self.get_globus_file_path(group_info['displayname'], uuid)
                if publish == True:
                    #publish
                    metadata_node[HubmapConst.STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_PUBLISHED
                else:
                    #unpublish
                    move_directory(new_publish_path, current_staging_path)
                    metadata_node[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = build_globus_url_for_directory(self.confdata['GLOBUS_ENDPOINT_FILEPATH'],current_staging_path)
                    metadata_node[HubmapConst.STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_UNPUBLISHED
                #step 2: update the metadata node
                authcache = None
                if AuthHelper.isInitialized() == False:
                    authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
                else:
                    authcache = AuthHelper.instance()
                userinfo = None
                userinfo = authcache.getUserInfo(nexus_token, True)
                if userinfo is Response:
                    raise ValueError('Cannot authenticate current token via Globus.')
                user_group_ids = userinfo['hmgroupids']
                if 'sub' in userinfo.keys():
                    metadata_node[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
                    metadata_node[HubmapConst.PUBLISHED_SUB_ATTRIBUTE] = userinfo['sub']
                if 'username' in userinfo.keys():
                    metadata_node[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['email']
                    metadata_node[HubmapConst.PUBLISHED_USER_EMAIL_ATTRIBUTE] = userinfo['email']
                if 'name' in userinfo.keys():
                    metadata_node[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
                    metadata_node[HubmapConst.PUBLISHED_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']

                metadata_node[HubmapConst.PUBLISHED_TIMESTAMP_ATTRIBUTE] = 'TIMESTAMP()'
                metadata_node[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.METADATA_NODE_NAME
                
                stmt = Neo4jConnection.get_update_statement(metadata_node, True)
                print ("EXECUTING DATASET PUBLISH UPDATE: " + stmt)
                tx.run(stmt)
                tx.commit()
                return uuid
            except TypeError as te:
                print ("Type Error: ", te.msg)
                raise te
            except AttributeError as ae:
                print ("Attribute Error: ", ae.msg)
                raise ae
            except FileNotFoundError as fnfe:
                print ("File Note Found Error: ", fnfe)
                raise fnfe
            except FileExistsError as fee:
                print ("File Exists Error: ", fee)
                raise fee                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise
            finally:
                pass                

    @classmethod
    def update_filepath_dataset(self, driver, uuid, filepath): 
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot modify dataset.  Could not find dataset uuid: ' + uuid)
        
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                # step one, delete all relationships in case those are updated
                update_record = {HubmapConst.UUID_ATTRIBUTE : uuid, HubmapConst.DATASET_FILE_PATH_ATTRIBUTE : filepath }
                stmt = Neo4jConnection.get_update_statement(update_record, HubmapConst.ENTITY_NODE_NAME, False)
                #print ("EXECUTING: " + stmt)
                tx.run(stmt)
                tx.commit()
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()


    @classmethod
    def change_status(self, driver, headers, uuid, oldstatus, newstatus, formdata, group_uuid):
        if str(oldstatus).upper() == str(HubmapConst.DATASET_STATUS_PUBLISHED).upper() and str(newstatus).upper() == str(HubmapConst.DATASET_STATUS_REOPENED).upper():
            self.reopen_dataset(driver, headers, uuid, formdata, group_uuid)
        elif str(oldstatus).upper() == str(HubmapConst.DATASET_STATUS_QA).upper() and str(newstatus).upper() == str(HubmapConst.DATASET_STATUS_PUBLISHED).upper():
            self.publishing_process(driver, headers, uuid, group_uuid, True)
        elif str(oldstatus).upper() == str(HubmapConst.DATASET_STATUS_PUBLISHED).upper() and str(newstatus).upper() == str(HubmapConst.DATASET_STATUS_UNPUBLISHED).upper():
            self.publishing_process(driver, headers, uuid, group_uuid, False)
        else:
            self.modify_dataset(driver, headers, uuid, formdata, group_uuid)
     
    @classmethod
    def get_metadata_uuid_for_ingest_id(self, driver, ingest_id):
        stmt = "MATCH (e {" + HubmapConst.DATASET_INGEST_ID_ATTRIBUTE + ": '" + ingest_id + "'}) RETURN e." + HubmapConst.UUID_ATTRIBUTE + " AS uuid" 
        record_list = []
        with driver.session() as session:
            try:
                for record in session.run(stmt):
                    dataset_record = {}
                    dataset_record['uuid'] = record['uuid']
                    record_list.append(dataset_record)
                if len(record_list) == 1:
                   return record_list[0]['uuid']
                else:
                   if len(record_list) == 0:
                       raise ValueError('Error: Cannot find dataset with ingest_id of: ' + ingest_id)
                   else:
                       raise ValueError('Error: Found multiple datasets with ingest_id of: ' + ingest_id)
                       
            except CypherError as cse:
                raise cse
            except Exception as e:
                raise e

    @classmethod
    def set_ingest_status(self, driver, json_data):
        """ expect something like this:
        #{'dataset_id' : '4d3eb2a87cda705bde38495bb564c8dc', 'status': '<status>', 'message': 'the process ran', 'metadata': [maybe some metadata stuff]} 
        files: [{ "relativePath" : "/path/to/file/example.txt",
           "type":"filetype",
           "size":filesize,
           "checksum":"file-checksum"
         }]
         """
          
        """
        #validate the incoming json
        schema_file = '/Users/chb69/git/ingest-pipeline/src/ingest-pipeline/schemata/dataset_metadata.schema.json'
        schema_data = None
    
    
        try:
            #with open(sample_json) as json_sample_file:
            #    json_data = json.load(json_sample_file)
            new_json_data = json.load(json_data)
            with open(schema_file) as json_schema_file:
                schema_data = json.load(json_schema_file)
            
            validate(instance=new_json_data, schema=schema_data)
        except ValidationError as ve:
            print(ve)
        except SchemaError as se:
            print(se)
        except Exception as e:
            print(e)
        """
         
        if 'dataset_id' not in json_data:
            raise ValueError('cannot find dataset_id')
        dataset_id = json_data['dataset_id']
        uuid = None
        update_record = {}
        try:
            #uuid = self.get_metadata_uuid_for_ingest_id(driver, ingest_id)
            metadata_node = Entity.get_entity_metadata(driver, dataset_id)
            uuid = metadata_node['uuid']
        except:
            raise ValueError('cannot find metadata for dataset_id: ' + dataset_id)
        update_record['uuid'] = uuid
        if 'status' not in json_data:
            raise ValueError('cannot find status')
        if json_data['status'] not in HubmapConst.DATASET_STATUS_OPTIONS:
            raise ValueError('"' + json_data['status'] + '" is not a valid status')                              
        update_record['status'] = json_data['status']
        if 'files' in json_data:
            file_data = json_data['files']
            update_record[HubmapConst.DATASET_INGEST_FILE_LIST_ATTRIBUTE] = file_data
        if 'message' not in json_data:
            raise ValueError('cannot find "message" parameter')                  
        message_string = json_data['message']
        update_record['message'] = message_string
        metadata = None
        if 'metadata' in json_data:
            metadata = json_data['metadata']
        overwrite_metadata_flag = True
        if 'overwrite_metadata' in json_data:
            overwrite_metadata_flag = json_data['overwrite_metadata']
        # if the overwite_metadata_flag is true then the current metadata will be replaced by
        # the new metadata found in the json
        # if the overwrite_metadata_flag is set to false, then merge the current metadata plus 
        # the incoming metadata.   
        if overwrite_metadata_flag == False:
            current_metadata = metadata_node[HubmapConst.DATASET_INGEST_METADATA_ATTRIBUTE]
            if isinstance(current_metadata, str):
                current_metadata = eval(current_metadata)
            # loop through the json metadata keys
            # this code will either:
            # a) add missing keys to the current_metadata
            # or b) overwrite the current metadata key with the new data from the json object
            for key in metadata.keys():
                current_metadata[key] = metadata[key]
            # swap the metadata variable with the modified current_metadata
            metadata = current_metadata
        
        update_record[HubmapConst.DATASET_INGEST_METADATA_ATTRIBUTE] = metadata
    
        tx = None
        with driver.session() as session:
            try:
                tx = session.begin_transaction()
                stmt = Neo4jConnection.get_update_statement(update_record, True)
                print ("EXECUTING DATASET UPDATE: " + stmt)
                tx.run(stmt)
                tx.commit()
                return update_record
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()

    @classmethod
    def get_metadata_uuid_for_ingest_id(self, driver, ingest_id):
        stmt = "MATCH (e {" + HubmapConst.DATASET_INGEST_ID_ATTRIBUTE + ": '" + ingest_id + "'}) RETURN e." + HubmapConst.UUID_ATTRIBUTE + " AS uuid" 
        record_list = []
        with driver.session() as session:
            try:
                for record in session.run(stmt):
                    dataset_record = {}
                    dataset_record['uuid'] = record['uuid']
                    record_list.append(dataset_record)
                if len(record_list) == 1:
                   return record_list[0]['uuid']
                else:
                   if len(record_list) == 0:
                       raise ValueError('Error: Cannot find dataset with ingest_id of: ' + ingest_id)
                   else:
                       raise ValueError('Error: Found multiple datasets with ingest_id of: ' + ingest_id)
                       
            except CypherError as cse:
                raise cse
            except Exception as e:
                raise e
        

    @classmethod
    def set_status(self, driver, uuid, new_status):
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                metadata_node = Entity.get_entity_metadata(driver, uuid)
                #construct a small record consisting of the uuid and new status
                update_record = { "{uuid_attr}".format(uuid_attr=HubmapConst.UUID_ATTRIBUTE) : "{uuid}".format(uuid=metadata_node['uuid']), 
                                 "{status_attr}".format(status_attr=HubmapConst.STATUS_ATTRIBUTE): "{new_status}".format(new_status=new_status)}
                #{"entityType" : "{uuid_datatype}".format(uuid_datatype=uuid_datatype), "generateDOI" : "true", "hubmap-ids" : hubmap_identifier}
                stmt = Neo4jConnection.get_update_statement(update_record, True)
                print ("EXECUTING DATASET UPDATE: " + stmt)
                tx.run(stmt)
                tx.commit()
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()
    
   
    @classmethod
    def modify_dataset(self, driver, headers, uuid, formdata, group_uuid):
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                update_record = formdata

                # # get current userinfo
                try:
                    current_token = AuthHelper.parseAuthorizationTokens(headers)
                except:
                    raise ValueError("Unable to parse token")
                authcache = None
                if AuthHelper.isInitialized() == False:
                    authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
                else:
                    authcache = AuthHelper.instance()
                userinfo = authcache.getUserInfo(current_token['nexus_token'], True)

                if type(userinfo) == Response and userinfo.status_code == 401:
                    raise AuthError('token is invalid.', 401)

                # put the metadata UUID into the form data
                metadata_node = Entity.get_entity_metadata(driver, uuid)
                update_record[HubmapConst.UUID_ATTRIBUTE] = metadata_node[HubmapConst.UUID_ATTRIBUTE]

                if 'old_status' in update_record:
                    del update_record['old_status']

                if 'phi' in update_record:
                    update_record[HubmapConst.HAS_PHI_ATTRIBUTE] = update_record['phi']
                    if HubmapConst.HAS_PHI_ATTRIBUTE != 'phi':
                        update_record.pop('phi', None)
                
                update_record['status'] = convert_dataset_status(str(update_record['status']))
                
                #update the dataset source uuid's (if necessary)
                
                dataset_metadata_uuid = metadata_node[HubmapConst.UUID_ATTRIBUTE]
                dataset_source_id_list = []
                dataset_create_activity_uuid = None

                # get a list of the current source uuids
                stmt = """MATCH (e:Entity {{  {entitytype_attr}: 'Dataset'}})<-[activity_relations:{activity_output_rel}]-(dataset_create_activity:Activity)<-[:{activity_input_rel}]-(source_uuid_list)
                 WHERE e.{uuid_attr} = '{uuid}' 
                 RETURN dataset_create_activity.{uuid_attr} AS dataset_create_activity_uuid,
                 source_uuid_list.{source_id_attr} AS source_ids""".format(entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, 
                                                                                        activity_output_rel=HubmapConst.ACTIVITY_OUTPUT_REL,
                                                                                        activity_input_rel=HubmapConst.ACTIVITY_INPUT_REL,
                                                                                        uuid_attr=HubmapConst.UUID_ATTRIBUTE,
                                                                                        source_id_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                                                                                        uuid=uuid) 
                
                #print("stmt: " + stmt)
                
                for record in session.run(stmt):
                    dataset_create_activity_uuid = record['dataset_create_activity_uuid']
                    dataset_source_id_list.append(record['source_ids'])
                
                # check to see if any updates were made to the source uuids
                dataset_source_id_list.sort()
                form_source_uuid_list = eval(str(formdata['source_uuid']))
                form_source_uuid_list.sort()
                
                # need to make updates
                if dataset_source_id_list != form_source_uuid_list:
                     # first remove the existing relations
                    stmt = """MATCH (e)-[r:{activity_input_rel}]->(a) WHERE e.{source_id_attr} IN {id_list} AND a.{uuid_attr} = '{activity_uuid}'
                    DELETE r""".format(activity_input_rel=HubmapConst.ACTIVITY_INPUT_REL,
                                        uuid_attr=HubmapConst.UUID_ATTRIBUTE,
                                        source_id_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                                        activity_uuid=dataset_create_activity_uuid,
                                        id_list=dataset_source_id_list)
                    
                    print("Delete statement: " + stmt)
                    tx.run(stmt)
                
                    # next create the new relations
                    stmt = """MATCH (e),(a)
                    WHERE e.{source_id_attr} IN {id_list} AND a.{uuid_attr} = '{activity_uuid}'
                    CREATE (e)-[r:{activity_input_rel}]->(a)""".format(activity_input_rel=HubmapConst.ACTIVITY_INPUT_REL,
                                        uuid_attr=HubmapConst.UUID_ATTRIBUTE,
                                        source_id_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,
                                        activity_uuid=dataset_create_activity_uuid,
                                        id_list=str(form_source_uuid_list))
                    
                    print("Create statement: " + stmt)
                    tx.run(stmt)

                if update_record['status'] == str(HubmapConst.DATASET_STATUS_PROCESSING):
                    #the status is set...so no problem
                    # I need to retrieve the ingest_id from the call and store it in neo4j
                    # /datasets/submissions/request_ingest 
                    try:
                        current_token = None
                        try:
                            current_token = AuthHelper.parseAuthorizationTokens(headers)
                        except:
                            raise ValueError("Unable to parse token")
                        prov = Provenance(self.confdata['APP_CLIENT_ID'],self.confdata['APP_CLIENT_SECRET'], None)
                        group_info = prov.get_group_by_identifier(group_uuid)
                        # take the incoming uuid_type and uppercase it
                        url = self.confdata['INGEST_PIPELINE_URL'] + '/request_ingest'
                        print('sending request_ingest to: ' + url)
                        r = requests.post(url, json={"submission_id" : "{uuid}".format(uuid=uuid),
                                                     "process" : self.confdata['INGEST_PIPELINE_DEFAULT_PROCESS'],
                                                     "provider": "{group_name}".format(group_name=group_info['displayname'])}, 
                                          #headers={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=current_token )})
                                          headers={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=AuthHelper.instance().getProcessSecret() )})
                        if r.ok == True:
                            """expect data like this:
                            {"ingest_id": "abc123", "run_id": "run_657-xyz", "overall_file_count": "99", "top_folder_contents": "["IMS", "processed_microscopy","raw_microscopy","VAN0001-RK-1-spatial_meta.txt"]"}
                            """
                            data = json.loads(r.content.decode())
                            submission_data = data['response']
#                            if 'overall_file_count' in submission_data:
#                                if int(submission_data['overall_file_count']) <= 0:
#                                    raise ValueError("Error: overall_file_count equals zero: {group_name}/{uuid}".format(uuid=uuid, group_name=group_info['displayname']))
#                            else:
#                                raise ValueError("Error: missing 'overall_file_count' from request ingest call")
#                            if 'top_folder_contents' in submission_data:
#                                top_folder_contents = submission_data['top_folder_contents']
#                                if len(top_folder_contents) == 0:
#                                    raise ValueError("Error: did not find any files for: {group_name}/{uuid}".format(uuid=uuid, group_name=group_info['displayname']))
#                            else:
#                                raise ValueError("Error: missing 'top_folder_contents' from request ingest call")
                                    
                            update_record[HubmapConst.DATASET_INGEST_ID_ATTRIBUTE] = submission_data['ingest_id']
                            update_record[HubmapConst.DATASET_RUN_ID] = submission_data['run_id']
                        else:
                            msg = 'HTTP Response: ' + str(r.status_code) + ' msg: ' + str(r.text) 
                            raise Exception(msg)
                    except ConnectionError as connerr:
                        pprint(connerr)
                        raise connerr
                    except TimeoutError as toerr:
                        pprint(toerr)
                        raise toerr
                    except Exception as e:
                        pprint(e)
                        raise e
                
                # set last updated user info
                update_record[HubmapConst.PROVENANCE_LAST_UPDATED_SUB_ATTRIBUTE] = userinfo['sub']
                update_record[HubmapConst.PROVENANCE_LAST_UPDATED_USER_EMAIL_ATTRIBUTE] = userinfo['email']
                update_record[HubmapConst.PROVENANCE_LAST_UPDATED_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
                
                stmt = Neo4jConnection.get_update_statement(update_record, True)
                print ("EXECUTING DATASET UPDATE: " + stmt)
                tx.run(stmt)
                tx.commit()
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                traceback.print_exc(file=sys.stdout)
                tx.rollback()
    
    
    @classmethod
    def process_update_request(self, driver, headers, uuid, old_status, new_status, form_data, group_uuid): 
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot modify dataset.  Could not find dataset uuid: ' + uuid)
        try:
            self.change_status(driver, headers, uuid, old_status, new_status, form_data, group_uuid)
            return uuid
        except:
            print ('A general error occurred: ', sys.exc_info()[0])
            raise
        

    @classmethod
    def validate_dataset(self, driver, uuid): 
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot validate dataset.  Could not find dataset uuid: ' + uuid)

        with driver.session() as session:
            validate_code = True
            try:
                dataset = Dataset()
                if validate_code == True:
                    dataset.set_status(driver, uuid, HubmapConst.DATASET_STATUS_VALID)
                else:
                    dataset.set_status(driver, uuid, HubmapConst.DATASET_STATUS_INVALID)
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                raise
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                raise               
            except:
                print ('A general error occurred: ', sys.exc_info()[0])
                raise

    @classmethod
    def lock_dataset(self, driver, uuid): 
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot lock dataset.  Could not find dataset uuid: ' + uuid)

        with driver.session() as session:
            try:
                dataset = Dataset()
                dataset.set_status(driver, uuid, HubmapConst.DATASET_STATUS_LOCKED)
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                raise
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                raise               
            except:
                print ('A general error occurred: ', sys.exc_info()[0])
                raise

    @classmethod
    def reopen_dataset(self, driver, headers, uuid, incoming_record, group_uuid):
        """Reopen involves several large tasks:
        1.  Create a new dataset entity object.
        2.  Copy the existing metadata object and connect it to the new dataset entity object.
        3.  Copy the existing files from the published location to staging using the new dataset uuid
        --Steps to update the existing "original" dataset
        4.  Move the existing files from the published location to the staging location
        5.  Update the original dataset's state to deprecated
        """ 
        if uuid == None or len(str(uuid)) == 0:
            raise ValueError('Cannot reopen dataset.  Could not find dataset uuid')
        #uuid = incoming_record['HubmapConst.UUID_ATTRIBUTE']
        if Entity.does_identifier_exist(driver, uuid) != True:
            raise LookupError('Cannot reopen dataset.  Could not find dataset uuid: ' + uuid)
        current_token = None
        collection_uuid = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(headers)
        except:
            raise ValueError("Unable to parse token")
        conn = Neo4jConnection(self.confdata['NEO4J_SERVER'], self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        # check all the incoming UUID's to make sure they exist
        sourceUUID = str(incoming_record['source_uuid']).strip()
        if sourceUUID == None or len(sourceUUID) == 0:
            raise ValueError('Error: sourceUUID must be set to create a tissue')
        
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'])
        else:
            authcache = AuthHelper.instance()
        nexus_token = current_token['nexus_token']
        transfer_token = current_token['transfer_token']
        auth_token = current_token['auth_token']
        transfer_endpoint = self.confdata['GLOBUS_ENDPOINT_UUID']
        userinfo = None
        userinfo = authcache.getUserInfo(nexus_token, True)
        if userinfo is Response:
            raise ValueError('Cannot authenticate current token via Globus.')
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        data_directory = None
        specimen_uuid_record_list = None
        metadata_record = None
        metadata = Metadata(self.confdata['APP_CLIENT_ID'], self.confdata['APP_CLIENT_SECRET'], self.confdata['UUID_WEBSERVICE_URL'])
        try:
            provenance_group = metadata.get_group_by_identifier(group_uuid)
        except ValueError as ve:
            raise ve
        metadata_userinfo = {}

        if 'collection_uuid' in incoming_record:
            try:
                collection_info = Entity.get_entity(driver, incoming_record['collection_uuid'])
            except ValueError as ve:
                raise ve
            
        if 'sub' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_SUB_ATTRIBUTE] = userinfo['sub']
        if 'username' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['email']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE
        entity_type = HubmapConst.DATASET_TYPE_CODE

        ug = UUID_Generator(self.confdata['UUID_WEBSERVICE_URL'])
        
        with driver.session() as session:
            datastage_uuid_record_list = None
            datastage_uuid = None
            try: 
                datastage_uuid_record_list = ug.getNewUUID(nexus_token, entity_type)
                if (datastage_uuid_record_list == None) or (len(datastage_uuid_record_list) != 1):
                    raise ValueError("UUID service did not return a value")
                datastage_uuid = datastage_uuid_record_list[0]
            except requests.exceptions.ConnectionError as ce:
                raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
            tx = None
            try:
                tx = session.begin_transaction()
                #step 1: create a new datastage entity
                
                # create the data stage
                dataset_entity_record = {HubmapConst.UUID_ATTRIBUTE : datastage_uuid[HubmapConst.UUID_ATTRIBUTE],
                                         HubmapConst.DOI_ATTRIBUTE : datastage_uuid[HubmapConst.DOI_ATTRIBUTE],
                                         HubmapConst.DISPLAY_DOI_ATTRIBUTE : str(datastage_uuid['displayDoi']) + 'newEntity',
                                         HubmapConst.ENTITY_TYPE_ATTRIBUTE : entity_type}
                
                stmt = Neo4jConnection.get_create_statement(
                    dataset_entity_record, HubmapConst.ENTITY_NODE_NAME, entity_type, True)
                print('Dataset Create statement: ' + stmt)
                tx.run(stmt)
                
                # copy the metadata node from the original dataset
                original_metadata_record = None
                try:
                    original_metadata_record = Entity.get_entity_metadata(driver, uuid)
                except LookupError as le:
                    raise LookupError("Unable to find metadata for uuid: " + uuid)

                metadata_record = original_metadata_record
                metadata_uuid_record_list = None
                metadata_uuid_record = None
                try: 
                    metadata_uuid_record_list = ug.getNewUUID(nexus_token, HubmapConst.METADATA_TYPE_CODE)
                    if (metadata_uuid_record_list == None) or (len(metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    metadata_uuid_record = metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))


                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                metadata_record[HubmapConst.DOI_ATTRIBUTE] = metadata_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                metadata_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = str(metadata_uuid_record['displayDoi']) + 'newEntity'
                
                #set the status of the datastage to Reopened
                metadata_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_REOPENED

                # copy the existing files from the original dataset to the staging directories
                group_display_name = provenance_group['displayname']
                """new_path = make_new_dataset_directory(transfer_token, transfer_endpoint, group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = build_globus_url_for_directory(transfer_endpoint,new_path)
                """
                
                
                #new_path = self.get_globus_file_path(group_display_name, dataset_entity_record[HubmapConst.UUID_ATTRIBUTE])
                #old_path = metadata_record[HubmapConst.DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE]
                #copy_directory(old_path, new_path)
                #incoming_record[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = new_path
                

                stmt = Dataset.get_create_metadata_statement(metadata_record, nexus_token, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                tx.run(stmt)

                # step 4: create the associated activity
                activity = Activity(self.confdata['UUID_WEBSERVICE_URL'])
                activity_object = activity.get_create_activity_statements(nexus_token, activity_type, uuid, dataset_entity_record[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                activity_uuid = activity_object['activity_uuid']
                for stmt in activity_object['statements']: 
                    tx.run(stmt)                
                # step 4: create all relationships
                stmt = Neo4jConnection.create_relationship_statement(
                    dataset_entity_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.HAS_METADATA_REL, metadata_record[HubmapConst.UUID_ATTRIBUTE])
                tx.run(stmt)
                if 'collection_uuid' in incoming_record:
                    stmt = Neo4jConnection.create_relationship_statement(
                        dataset_entity_record[HubmapConst.UUID_ATTRIBUTE], HubmapConst.IN_COLLECTION_REL, incoming_record['collection_uuid'])
                    tx.run(stmt)


                # step 5: update status of original dataset
                original_metadata_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_DEPRECATED
                stmt = Neo4jConnection.get_update_statement(original_metadata_record, True)
                tx.run(stmt)
                
                tx.commit()
                return uuid
            except TransactionError as te: 
                print ('A transaction error occurred: ', te.value)
                tx.rollback()
            except CypherError as cse:
                print ('A Cypher error was encountered: ', cse.message)
                tx.rollback()                
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                tx.rollback()


    @classmethod
    def get_globus_file_path(self, group_name, dataset_uuid):
        start_dir = str(self.confdata['GLOBUS_ENDPOINT_FILEPATH'])
        ret_dir = os.path.join(start_dir, group_name, dataset_uuid)
        return ret_dir
    
def make_new_dataset_directory(file_path_root_dir, file_path_symbolic_dir, groupDisplayname, newDirUUID):
    if newDirUUID == None or len(str(newDirUUID)) == 0:
        raise ValueError('The dataset UUID must have a value')
    try:
        new_path = str(os.path.join(file_path_root_dir, groupDisplayname, newDirUUID))
        os.makedirs(new_path)
        # make a sym link too
        sym_path = str(os.path.join(file_path_symbolic_dir, newDirUUID))
        os.symlink(new_path, sym_path, True)
        relative_path = str(os.path.join('/', groupDisplayname, newDirUUID))
        return relative_path
    except globus_sdk.TransferAPIError as e:
        if e.code == "ExternalError.MkdirFailed.Exists":
            pass
        elif e.code == "ExternalError.MkdirFailed.PermissionDenied":
            raise OSError('User not authorized to create new directory: ' + new_path)
    except:
        raise

def build_globus_url_for_directory(transfer_endpoint_uuid,new_directory):
    encoded_path = urllib.parse.quote(str(new_directory))
    ret_string = 'https://app.globus.org/file-manager?origin_id={endpoint_uuid}&origin_path={new_path}'.format(endpoint_uuid=transfer_endpoint_uuid, new_path=encoded_path)
    return ret_string

def move_directory(oldpath, newpath):
    """it may seem like overkill to use a define a method just to move files, but we might need to move these
    files across globus endpoints in the future"""
    try:
        #os.makedirs(newpath)
        ret_path = shutil.move(oldpath, newpath)
    except: 
        raise 
    return ret_path

def copy_directory(oldpath, newpath):
    try:
        #os.makedirs(newpath)
        ret_path = shutil.copy(oldpath, newpath)
    except: 
        raise 
    return ret_path


def convert_dataset_status(raw_status):
    new_status = ''
    # I need to convert the status to what is found in the HubmapConst file
    if str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_NEW).upper():
        new_status = HubmapConst.DATASET_STATUS_NEW
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_INVALID).upper():
        new_status = HubmapConst.DATASET_STATUS_INVALID
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_VALID).upper():
        new_status = HubmapConst.DATASET_STATUS_VALID
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_PUBLISHED).upper():
        new_status = HubmapConst.DATASET_STATUS_PUBLISHED
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_REOPENED).upper():
        new_status = HubmapConst.DATASET_STATUS_REOPENED
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_LOCKED).upper():
        new_status = HubmapConst.DATASET_STATUS_LOCKED
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_NEW).upper():
        new_status = HubmapConst.DATASET_STATUS_NEW
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_UNPUBLISHED).upper():
        new_status = HubmapConst.DATASET_STATUS_UNPUBLISHED
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_QA).upper():
        new_status = HubmapConst.DATASET_STATUS_QA
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_ERROR).upper():
        new_status = HubmapConst.DATASET_STATUS_ERROR
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_PROCESSING).upper():
        new_status = HubmapConst.DATASET_STATUS_PROCESSING
    elif str(raw_status).upper() == str(HubmapConst.DATASET_STATUS_HOLD).upper():
        new_status = HubmapConst.DATASET_STATUS_HOLD
    return new_status

