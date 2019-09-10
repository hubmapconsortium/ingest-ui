from neo4j_connection import Neo4jConnection
from neo4j import TransactionError, CypherError
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst 
from uuid_generator import getNewUUID

class Collection(object):
    '''
    classdocs
    '''

    def __init__(self):
        pass

    @staticmethod
    def create_collection(driver, current_token, incoming_record):
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                try:
                    collection_uuid_record_list = getNewUUID(current_token, HubmapConst.COLLECTION_TYPE_CODE)
                    if (collection_uuid_record_list == None) or (len(collection_uuid_record_list) == 0):
                        raise ValueError("UUID service did not return a value")
                except requests.exceptions.ConnectionError as ce:
                    raise ConnectionError("Unable to connect to the UUID service: " + str(ce.args[0]))
            finally:
                pass

if __name__ == "__main__":
    pass