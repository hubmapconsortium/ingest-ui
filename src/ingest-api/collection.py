from neo4j import TransactionError, CypherError
import sys
import os
import configparser

from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.entity import Entity


class Collection(object):
    '''
    classdocs
    '''

    confdata = {}
    
    @classmethod
    def __init__(self, config):
        self.confdata = config

    
    @classmethod
    def create_collection(self, driver, current_token, collection_record):
        ug = UUID_Generator(self.confdata['UUID_WEBSERVICE_URL'])
        with driver.session() as session:
            tx = None
            collection_uuid_record = None
            try:
                tx = session.begin_transaction()
                try:
                    collection_uuid_record_list = ug.getNewUUID(current_token, HubmapConst.COLLECTION_TYPE_CODE)
                    if (collection_uuid_record_list == None) or (len(collection_uuid_record_list) == 0):
                        raise ValueError("UUID service did not return a value")
                    if len(collection_uuid_record_list) > 1:
                        raise ValueError("UUID service returned more than one UUID value")
                    collection_uuid_record = collection_uuid_record_list[0]
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
                collection_record[HubmapConst.UUID_ATTRIBUTE] = collection_uuid_record[HubmapConst.UUID_ATTRIBUTE]
                collection_record[HubmapConst.DOI_ATTRIBUTE] = collection_uuid_record[HubmapConst.DOI_ATTRIBUTE]
                collection_record[HubmapConst.DISPLAY_DOI_ATTRIBUTE] = collection_uuid_record['displayDoi']
                collection_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.COLLECTION_TYPE_CODE
                if 'name' in collection_record:
                    collection_record[HubmapConst.NAME_ATTRIBUTE] = collection_record['name']
                stmt = Neo4jConnection.get_create_statement(
                    collection_record, HubmapConst.COLLECTION_NODE_NAME, HubmapConst.COLLECTION_TYPE_CODE, False)
                print('Collection Create statement: ' + stmt)
                tx.run(stmt)
                tx.commit()
                return collection_record[HubmapConst.UUID_ATTRIBUTE]
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

    @classmethod
    # NOTE: This will return a single entity, activity, or agent
    def get_collections(self, driver): 
        with driver.session() as session:
            return_list = []
            try:
                #TODO: I can use the OR operator to match on either uuid or doi:
                #MATCH (e) WHERE e.label= 'test dataset create file10' OR e.label= 'test dataset create file7' RETURN e
                stmt = "MATCH (a:{COLLECTION_TYPE}) RETURN properties(a) as properties".format(COLLECTION_TYPE=HubmapConst.COLLECTION_NODE_NAME)

                for record in session.run(str(stmt)):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
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
    # NOTE: This will return a single entity, activity, or agent
    def get_collection(self, driver, uuid): 
        try:
            return Entity.get_entity(driver, uuid)
        except BaseException as be:
            pprint(be)
            raise be

