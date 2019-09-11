from neo4j import TransactionError, CypherError
import sys
import os
from flask import jsonify, json
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst
from entity import Entity
from uuid_generator import getNewUUID
from neo4j_connection import Neo4jConnection

class Collection(object):
    '''
    classdocs
    '''

    def __init__(self):
        pass

    @staticmethod
    def create_collection(driver, current_token, collection_record):
        with driver.session() as session:
            tx = None
            collection_uuid_record = None
            try:
                tx = session.begin_transaction()
                try:
                    collection_uuid_record_list = getNewUUID(current_token, HubmapConst.COLLECTION_TYPE_CODE)
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

if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    name = 'Test Collection'
    description= 'This dataset is a collection'
    nexus_token = 'AglKXgMkgndQ8Ddkz7Xab6p3wXwb3Qr7qyrW8JeVllVVKYY31ec8CQykV5DGE84XnbVyWox52djEEpTJBelW1t9gQd'
    transfer_token = 'Ag92Kzwm5MMj9neJ5XzVbKO3OK25PKWgBl2g6ejWdwmWGWO7M2hpC4DxemyvN6Gvz5V3KGJGv0kNplUr3k7NdhvjMl'
    auth_token = 'Agm9xX36yEyMbzQPnalaW7kwV6Dg6j8Bd8wGK3qYBGPwaJg95aS8Caabx5aPOlGMj03x6m8BDmzorDi8aVrnouk5jgS0mlgCl8NqhmX67'
    mauth_token = {"name": "Charles Borromeo", "email": "CHB69@pitt.edu", 
                   "globus_id": "32800bfe-83df-4b48-b755-701dc06a8913", 
                   "nexus_token": nexus_token, 
                   "auth_token": auth_token, 
                   "transfer_token": transfer_token}
    
    incoming_record = {'label' : name, 'description': description}
    collection = Collection.create_collection(driver, nexus_token, incoming_record)
    print ('New collection record uuid: ' + collection)
