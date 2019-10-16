from neo4j import TransactionError, CypherError
import sys
import os
import configparser
from flask import jsonify, json
from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.entity import Entity
from hubmap_commons.autherror import AuthError

class Collection(object):
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
            config.read(os.path.join(os.path.dirname(__file__), '../..', 'conf', 'app.properties'))
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
            self.confdata['UUID_WEBSERVICE_URL'] = config.get('HUBMAP', 'UUID_WEBSERVICE_URL')
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


if __name__ == "__main__":
    coll = Collection()
    confdata = coll.load_config_file()
    conn = Neo4jConnection(confdata['neo4juri'], confdata['neo4jusername'], confdata['neo4jpassword'])
    driver = conn.get_driver()
    name = 'Test Collection'
    description= 'This dataset is a collection'
    nexus_token = 'Ag4bomPanqamWmr6vQ9bm60MdDeQ8vwyplp4p5xMexJBGKvzQrT7C7ekxXQD3zj8axojEXly932xoycjMeKE6UEezX'
    transfer_token = 'AgnJlPv9Vv3bw34DrDgk2K99KVjjEjz3qxeX5yramDgPypQ7njt9C1wvPwJ3o6Nw0QVOM5PXl3NzwQs015DbWFxGpP'
    auth_token = 'AgJdY9GjqeWDv8a8lb64E1JVvY0NvaPJYbzmBdbrjVgpaDB2JQC0CV64zom3kKwGkwNV3nM98xoabpH3deKMJSejQDtVz2yIdQYpsDw98'
    mauth_token = {"name": "Charles Borromeo", "email": "CHB69@pitt.edu", 
                   "globus_id": "32800bfe-83df-4b48-b755-701dc06a8913", 
                   "nexus_token": nexus_token, 
                   "auth_token": auth_token, 
                   "transfer_token": transfer_token}
    
    #incoming_record = {'label' : name, 'description': description}
    #collection = Collection.create_collection(driver, nexus_token, incoming_record)
    #collection = Collection.create_collection(driver, nexus_token, incoming_record)
    #collection = Collection.create_collection(driver, nexus_token, incoming_record)
    collection_set = Collection.get_collections(driver)
    print (collection_set)
    #print ('New collection record uuid: ' + collection)
