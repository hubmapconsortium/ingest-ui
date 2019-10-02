'''
Created on Apr 18, 2019

@author: chb69
'''
from neo4j import TransactionError, CypherError
import sys
import os
import configparser
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import base64
from globus_sdk.exc import TransferAPIError
import requests
import urllib.parse
from flask import Response
from pprint import pprint
import shutil
from builtins import staticmethod
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst
from hm_auth import AuthCache, AuthHelper
from entity import Entity
from uuid_generator import getNewUUID, getUUID
from neo4j_connection import Neo4jConnection
from activity import Activity
from autherror import AuthError
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'metadata-api'))
from metadata import Metadata

class Dataset(object):
    '''
    classdocs
    '''
    confdata = {}

    @classmethod
    def __init__(self):
        self.load_config_file()

    @classmethod
    def load_config_file(self):
        config = configparser.ConfigParser()
        
        try:
            config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
            self.confdata['neo4juri'] = config.get('NEO4J', 'server')
            self.confdata['neo4jusername'] = config.get('NEO4J', 'username')
            self.confdata['neo4jpassword'] = config.get('NEO4J', 'password')
            self.confdata['appclientid'] = config.get('GLOBUS', 'APP_CLIENT_ID')
            self.confdata['STAGING_ENDPOINT_UUID'] = config.get('GLOBUS', 'STAGING_ENDPOINT_UUID')
            self.confdata['PUBLISH_ENDPOINT_UUID'] = config.get('GLOBUS', 'PUBLISH_ENDPOINT_UUID')
            self.confdata['appclientsecret'] = config.get(
                'GLOBUS', 'APP_CLIENT_SECRET')
            self.confdata['localstoragedirectory'] = config.get(
                'FILE_SYSTEM', 'GLOBUS_STORAGE_DIRECTORY_ROOT')
            self.confdata['STAGING_ENDPOINT_FILEPATH'] = config.get('FILE_SYSTEM', 'STAGING_ENDPOINT_FILEPATH')
            self.confdata['PUBLISH_ENDPOINT_FILEPATH'] = config.get('FILE_SYSTEM', 'PUBLISH_ENDPOINT_FILEPATH')
            return self.confdata
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
            traceback.print_exc()
            exit(0)

    @staticmethod
    def search_datasets(driver, search_term, readonly_uuid_list, writeable_uuid_list, group_uuid_list):
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
                
        
        stmt_list = []
        if search_term == None:
            stmt1 = """MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node) WHERE {entity_type_clause} {provenance_group_uuid_clause}
            RETURN entity_node.{hubmapid_attr} AS hubmap_identifier, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause)
            stmt_list = [stmt1]
        else:
            # use the full text indexing if searching for a term
            cypher_index_clause = "CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score"
            return_clause = "score, "
            order_by_clause = "score DESC, "    
            stmt1 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (lucene_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(entity_node) WHERE {entity_type_clause} {provenance_group_uuid_clause}
            RETURN score, entity_node.{hubmapid_attr} AS hubmap_identifier, entity_node.{uuid_attr} AS entity_uuid, entity_node.{entitytype_attr} AS datatype, entity_node.{doi_attr} AS entity_doi, entity_node.{display_doi_attr} as entity_display_doi, properties(lucene_node) AS metadata_properties, lucene_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause)
    
            provenance_group_uuid_clause = provenance_group_uuid_clause.replace('lucene_node.', 'metadata_node.')

            stmt2 = """CALL db.index.fulltext.queryNodes('{lucence_index_name}', '{search_term}') YIELD node AS lucene_node, score 
            MATCH (metadata_node:Metadata {{entitytype: 'Metadata'}})<-[:HAS_METADATA]-(lucene_node) WHERE {lucene_type_clause} {provenance_group_uuid_clause}
            RETURN score, lucene_node.{hubmapid_attr} AS hubmap_identifier, lucene_node.{uuid_attr} AS entity_uuid, lucene_node.{entitytype_attr} AS datatype, lucene_node.{doi_attr} AS entity_doi, lucene_node.{display_doi_attr} as entity_display_doi, properties(metadata_node) AS metadata_properties, metadata_node.{provenance_timestamp} AS modified_timestamp
            ORDER BY score DESC, modified_timestamp DESC""".format(metadata_clause=metadata_clause,entity_type_clause=entity_type_clause,lucene_type_clause=lucene_type_clause,lucence_index_name=lucence_index_name,search_term=search_term,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, entitytype_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE, activitytype_attr=HubmapConst.ACTIVITY_TYPE_ATTRIBUTE, doi_attr=HubmapConst.DOI_ATTRIBUTE, 
                display_doi_attr=HubmapConst.DISPLAY_DOI_ATTRIBUTE,provenance_timestamp=HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE, 
                hubmapid_attr=HubmapConst.LAB_IDENTIFIER_ATTRIBUTE,provenance_group_uuid_clause=provenance_group_uuid_clause)
    
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
                    if str(ret_record['entity_display_doi']).find(str(search_term)) > -1:
                        return_list.remove(ret_record)
                        return_list.insert(0,ret_record)     
                        break                       

        return return_list                    

    @staticmethod
    def get_dataset(driver, identifier):
        try:
            return Entity.get_entity(driver, identifier)
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

    @classmethod
    def create_datastage(self, driver, headers, incoming_record, groupUUID):
        current_token = None
        collection_uuid = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(headers)
        except:
            raise ValueError("Unable to parse token")
        conn = Neo4jConnection()
        driver = conn.get_driver()
        # check all the incoming UUID's to make sure they exist
        sourceUUID = str(incoming_record['source_uuid']).strip()
        if sourceUUID == None or len(sourceUUID) == 0:
            raise ValueError('Error: sourceUUID must be set to create a tissue')
        source_UUID_Data = None
        try:
            source_UUID_Data = getUUID(current_token['nexus_token'], sourceUUID)
            if len(source_UUID_Data) != 1:
                raise ValueError("Could not find information for identifier" + sourceUUID)
        except:
            raise ValueError('Unable to resolve UUID for: ' + sourceUUID)
        confdata = self.confdata
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                confdata['appclientid'], confdata['appclientsecret'])
        else:
            authcache = AuthHelper.instance()
        nexus_token = current_token['nexus_token']
        transfer_token = current_token['transfer_token']
        auth_token = current_token['auth_token']
        transfer_endpoint = confdata['STAGING_ENDPOINT_UUID']
        userinfo = None
        userinfo = authcache.getUserInfo(nexus_token, True)
        if userinfo is Response:
            raise ValueError('Cannot authenticate current token via Globus.')
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        data_directory = None
        specimen_uuid_record_list = None
        metadata_record = None
        metadata = Metadata()
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
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE
        entity_type = HubmapConst.DATASET_TYPE_CODE
        
        with driver.session() as session:
            datastage_uuid_record_list = None
            datastage_uuid = None
            try: 
                datastage_uuid_record_list = getNewUUID(nexus_token, entity_type)
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
                new_path = make_new_dataset_directory(transfer_token, transfer_endpoint, group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = build_globus_url_for_directory(transfer_endpoint,new_path)
                
                """new_path = self.get_staging_path(group_display_name, datastage_uuid[HubmapConst.UUID_ATTRIBUTE])
                new_globus_path = os.makedirs(new_path)"""
                incoming_record[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = new_globus_path
                incoming_record[HubmapConst.DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE] = new_path
                
                # use the remaining attributes to create the Entity Metadata node
                metadata_record = incoming_record
                
                #set the status of the datastage to New
                metadata_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = 'New'
                metadata_uuid_record_list = None
                metadata_uuid_record = None
                try: 
                    metadata_uuid_record_list = getNewUUID(nexus_token, HubmapConst.METADATA_TYPE_CODE)
                    if (metadata_uuid_record_list == None) or (len(metadata_uuid_record_list) != 1):
                        raise ValueError("UUID service did not return a value")
                    metadata_uuid_record = metadata_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))


                metadata_record[HubmapConst.UUID_ATTRIBUTE] = metadata_uuid_record[HubmapConst.UUID_ATTRIBUTE]

                stmt = Dataset.get_create_metadata_statement(metadata_record, nexus_token, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                tx.run(stmt)
                # step 4: create the associated activity
                activity_object = Activity.get_create_activity_statements(nexus_token, activity_type, source_UUID_Data[0]['hmuuid'], datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
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
                ret_object = {'uuid' : datastage_uuid['uuid'], HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE: new_globus_path}
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
            metadata = Metadata()
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
                current_staging_path = self.get_staging_path(group_info['displayname'], uuid)
                if publish == True:
                    #publish
                    move_directory(current_staging_path, new_publish_path)
                    metadata_node[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = build_globus_url_for_directory(self.confdata['PUBLISH_ENDPOINT_FILEPATH'],new_publish_path)
                    metadata_node[HubmapConst.STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_PUBLISHED
                else:
                    #unpublish
                    move_directory(new_publish_path, current_staging_path)
                    metadata_node[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = build_globus_url_for_directory(self.confdata['STAGING_ENDPOINT_FILEPATH'],current_staging_path)
                    metadata_node[HubmapConst.STATUS_ATTRIBUTE] = HubmapConst.DATASET_STATUS_UNPUBLISHED
                #step 2: update the metadata node
                authcache = None
                if AuthHelper.isInitialized() == False:
                    authcache = AuthHelper.create(
                        self.confdata['appclientid'], self.confdata['appclientsecret'])
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
                    metadata_node[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
                    metadata_node[HubmapConst.PUBLISHED_USER_EMAIL_ATTRIBUTE] = userinfo['username']
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
    def set_status(self, driver, uuid, new_status):
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                #construct a small record consisting of the uuid and new status
                update_record = { "{uuid_attr}".format(uuid_attr=HubmapConst.UUID_ATTRIBUTE) : "{uuid}".format(uuid=uuid), 
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

                # put the metadata UUID into the form data
                metadata_node = Entity.get_entity_metadata(driver, uuid)
                update_record[HubmapConst.UUID_ATTRIBUTE] = metadata_node[HubmapConst.UUID_ATTRIBUTE]

                if 'old_status' in update_record:
                    del update_record['old_status']
                    
                # I need to convert the status to what is found in the HubmapConst file
                if str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_NEW).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_NEW
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_INVALID).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_INVALID
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_VALID).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_VALID
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_PUBLISHED).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_PUBLISHED
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_REOPENED).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_REOPENED
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_LOCKED).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_LOCKED
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_NEW).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_NEW
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_UNPUBLISHED).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_UNPUBLISHED
                elif str(update_record['status']).upper() == str(HubmapConst.DATASET_STATUS_QA).upper():
                    update_record['status'] = HubmapConst.DATASET_STATUS_QA

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
        conn = Neo4jConnection()
        driver = conn.get_driver()
        # check all the incoming UUID's to make sure they exist
        sourceUUID = str(incoming_record['source_uuid']).strip()
        if sourceUUID == None or len(sourceUUID) == 0:
            raise ValueError('Error: sourceUUID must be set to create a tissue')
        
        confdata = self.confdata
        authcache = None
        if AuthHelper.isInitialized() == False:
            authcache = AuthHelper.create(
                confdata['appclientid'], confdata['appclientsecret'])
        else:
            authcache = AuthHelper.instance()
        nexus_token = current_token['nexus_token']
        transfer_token = current_token['transfer_token']
        auth_token = current_token['auth_token']
        transfer_endpoint = confdata['STAGING_ENDPOINT_UUID']
        userinfo = None
        userinfo = authcache.getUserInfo(nexus_token, True)
        if userinfo is Response:
            raise ValueError('Cannot authenticate current token via Globus.')
        user_group_ids = userinfo['hmgroupids']
        provenance_group = None
        data_directory = None
        specimen_uuid_record_list = None
        metadata_record = None
        metadata = Metadata()
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
            metadata_userinfo[HubmapConst.PROVENANCE_USER_EMAIL_ATTRIBUTE] = userinfo['username']
        if 'name' in userinfo.keys():
            metadata_userinfo[HubmapConst.PROVENANCE_USER_DISPLAYNAME_ATTRIBUTE] = userinfo['name']
        activity_type = HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE
        entity_type = HubmapConst.DATASET_TYPE_CODE

        with driver.session() as session:
            datastage_uuid_record_list = None
            datastage_uuid = None
            try: 
                datastage_uuid_record_list = getNewUUID(nexus_token, entity_type)
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
                    metadata_uuid_record_list = getNewUUID(nexus_token, HubmapConst.METADATA_TYPE_CODE)
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
                
                
                #new_path = self.get_staging_path(group_display_name, dataset_entity_record[HubmapConst.UUID_ATTRIBUTE])
                #old_path = metadata_record[HubmapConst.DATASET_LOCAL_DIRECTORY_PATH_ATTRIBUTE]
                #copy_directory(old_path, new_path)
                #incoming_record[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = new_path
                

                stmt = Dataset.get_create_metadata_statement(metadata_record, nexus_token, datastage_uuid[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
                tx.run(stmt)

                # step 4: create the associated activity
                activity_object = Activity.get_create_activity_statements(nexus_token, activity_type, uuid, dataset_entity_record[HubmapConst.UUID_ATTRIBUTE], metadata_userinfo, provenance_group)
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


    #TODO: This method needs the user's group id
    @classmethod
    def get_staging_path(self, group_name, dataset_uuid):
        start_dir = str(self.confdata['STAGING_ENDPOINT_FILEPATH'])
        ret_dir = os.path.join(start_dir, group_name, dataset_uuid)
        return ret_dir
    
    #TODO: This method needs the user's group id
    @classmethod
    def get_publish_path(self, group_name, dataset_uuid):
        start_dir = str(self.confdata['PUBLISH_ENDPOINT_FILEPATH'])
        ret_dir = os.path.join(start_dir, group_name, dataset_uuid)
        return ret_dir

# NOTE: The globus API would return a "No effective ACL rules on the endpoint" error
# if the file path was wrong.  
def make_new_dataset_directory(transfer_token, transfer_endpoint_uuid, groupDisplayname, newDirUUID):
    if newDirUUID == None or len(str(newDirUUID)) == 0:
        raise ValueError('The dataset UUID must have a value')
    try:
        tc = globus_sdk.TransferClient(authorizer=AccessTokenAuthorizer(transfer_token))
        new_path = str(os.path.join('/',groupDisplayname, newDirUUID))
        tc.operation_mkdir(transfer_endpoint_uuid,new_path)
        #print ("Done adding directory: " + new_path)
        return new_path
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
    
"""
def move_directory(dir_UUID, oldpath, newpath):
    if dir_UUID == None or len(str(dir_UUID)) == 0:
        raise ValueError('The dataset UUID must have a value')
    transfer_token_entry = token_list['transfer.globus.org']
    transfer_token = transfer_token_entry['token']
    tc = globus_sdk.TransferClient(authorizer=AccessTokenAuthorizer(transfer_token))
    try:
        tc.operation_rename(app.config['TRANSFER_ENDPOINT_UUID'],oldpath=oldpath, newpath=newpath)
        print ("Done moving directory: " + oldpath + " to:" + newpath)
        return str(app.config['STAGING_FILE_PATH'] + str(dir_UUID))
    except TransferAPIError as tae:
        print ('A TransferAPIError occurred: ', tae.msg)
        abort(400, tae.msg)
        
    except:
        raise
"""

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


def publish_directory(dir_UUID):
    try:
        move_directory(dir_UUID, get_staging_path(dir_UUID), get_publish_path(dir_UUID))
        print ("Done publishing directory: " + get_publish_path(dir_UUID))
        return get_publish_path(dir_UUID)
    except:
        raise

    


if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    name = 'Test Dataset'
    description= 'This dataset is a test'
    parentCollection = '4470c8e8-3836-4986-9773-398912831'
    hasPHI = False
    nexus_token = 'AglKXgMkgndQ8Ddkz7Xab6p3wXwb3Qr7qyrW8JeVllVVKYY31ec8CQykV5DGE84XnbVyWox52djEEpTJBelW1t9gQd'
    transfer_token = 'Ag92Kzwm5MMj9neJ5XzVbKO3OK25PKWgBl2g6ejWdwmWGWO7M2hpC4DxemyvN6Gvz5V3KGJGv0kNplUr3k7NdhvjMl'
    auth_token = 'Agm9xX36yEyMbzQPnalaW7kwV6Dg6j8Bd8wGK3qYBGPwaJg95aS8Caabx5aPOlGMj03x6m8BDmzorDi8aVrnouk5jgS0mlgCl8NqhmX67'
    mauth_token = {"name": "Charles Borromeo", "email": "CHB69@pitt.edu", 
                   "globus_id": "32800bfe-83df-4b48-b755-701dc06a8913", 
                   "nexus_token": nexus_token, 
                   "auth_token": auth_token, 
                   "transfer_token": transfer_token}
    
    groupUUID = "5bd084c8-edc2-11e8-802f-0e368f3075e8"
    dataset = Dataset()
    sourceUUID = 'e8fa2558e19ca2226ccbb8521557236b' # this should be TEST0001-RK-1
    incoming_record = {'name' : 'Test Dataset', 'description': 'Description of this dataset', 'sourceUUID' : sourceUUID, 'hasPHI': False}
    
    #dataset.create_datastage(driver, mauth_token, incoming_record, groupUUID)
    #make_new_staging_directory(transfer_token, groupUUID, sourceUUID)
    #result_set = Dataset.search_datasets(driver, None, None, [groupUUID], [groupUUID])
    """result_set = Dataset.get_dataset(driver, '03589ba88596106ca8cde53514676882')
    pprint (result_set)
    result_set = Dataset.get_dataset(driver, '129e3c9c5f6ec157f884c172b502097c')
    pprint (result_set)
    result_set = Dataset.get_dataset(driver, '9240537e62fac5ee38ad6da118d59886')
    pprint (result_set)"""
    # Test create dataset file functionality:
    
    group_display_name = 'IEC Testing Group'
    new_path = make_new_dataset_directory(transfer_token, transfer_endpoint, group_display_name, 'test001')
    new_globus_path = build_globus_url_for_directory(transfer_endpoint,new_path)
    pprint(new_globus_path)
    
    
    #Test publishing
    new_publish_path = dataset.get_publish_path(group_info['displayname'], uuid)
    current_staging_path = dataset.get_staging_path(group_info['displayname'], uuid)
    move_directory(current_staging_path, new_publish_path)
    metadata_node[HubmapConst.DATASET_GLOBUS_DIRECTORY_PATH_ATTRIBUTE] = build_globus_url_for_directory(self.confdata['PUBLISH_ENDPOINT_FILEPATH'],new_publish_path)
            



    
    conn.close()
