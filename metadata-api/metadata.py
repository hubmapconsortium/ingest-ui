'''
Created on May 15, 2019

@author: chb69
'''
from neo4j import TransactionError, CypherError
import json
import sys
import os
from pprint import pprint
import configparser
sys.path.append(os.path.realpath("../common-api"))
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from entity import Entity
from hm_auth import AuthHelper, AuthCache

class Metadata:

    md_config = {}
    
    def __init__(self):
        self.load_config_file()
        
    def load_config_file(self):    
        config = configparser.ConfigParser()
        try:
            config.read('../common-api/config.ini')
            self.md_config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
            self.md_config['APP_CLIENT_SECRET'] = config.get('GLOBUS', 'APP_CLIENT_SECRET')
            self.md_config['TRANSFER_ENDPOINT_UUID'] = config.get('GLOBUS', 'TRANSFER_ENDPOINT_UUID')
            self.md_config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
            self.md_config['STAGING_FILE_PATH'] = config.get('GLOBUS', 'STAGING_FILE_PATH')
            self.md_config['PUBLISH_FILE_PATH'] = config.get('GLOBUS','PUBLISH_FILE_PATH')
            #app.config['DEBUG'] = True
        except OSError as err:
            msg = "OS error.  Check config.ini file to make sure it exists and is readable: {0}".format(err)
            print (msg + "  Program stopped.")
            exit(0)
        except configparser.NoSectionError as noSectError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(noSectError)
            print (msg + "  Program stopped.")
            exit(0)
        except configparser.NoOptionError as noOptError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(noOptError)
            print (msg + "  Program stopped.")
            exit(0)
        except SyntaxError as syntaxError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(syntaxError)
            msg = msg + "  Cannot read line: {0}".format(syntaxError.text)
            print (msg + "  Program stopped.")
            exit(0)        
        except AttributeError as attrError:
            msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(attrError)
            msg = msg + "  Cannot read line: {0}".format(attrError.text)
            print (msg + "  Program stopped.")
            exit(0)        
        except:
            msg = "Unexpected error:", sys.exc_info()[0]
            print (msg + "  Program stopped.")
            exit(0)

    @staticmethod
    # NOTE: This will return a metadata object using its identifier
    def get_metadata(driver, identifier): 
        try:
            return Entity.get_entity(driver, identifier)
        except BaseException as be:
            pprint(be)
            raise be

    @staticmethod
    # NOTE: This will return the metadata for a specific instance of an entity, activity, or agent
    def get_metadata_by_source(driver, identifier): 
        try:
            return Entity.get_entities_by_relationship(driver, identifier, HubmapConst.HAS_METADATA_REL)
        except BaseException as be:
            pprint(be)
            raise be

    def can_user_edit_entity(self, driver, token, entityuuid): 
        try:
            if Entity.does_identifier_exist(driver, entityuuid) == False:
                raise ValueError("Cannot find entity with uuid: " + entityuuid)
            authcache = None
            if AuthHelper.isInitialized() == False:
                authcache = AuthHelper.create(
                    self.md_config['APP_CLIENT_ID'], self.md_config['APP_CLIENT_SECRET'])
            else:
                authcache = AuthHelper.instance()
            userinfo = authcache.getUserInfo(token, True)

            #return Entity.get_entities_by_relationship(driver, identifier, HubmapConst.HAS_METADATA_REL)
        except BaseException as be:
            pprint(be)
            raise be

    @staticmethod
    # NOTE: This will return a metadata object using the source's type
    def get_metadata_by_source_type(driver, general_type_attribute, type_code): 
        with driver.session() as session:
            return_list = []


            try:
                stmt = "MATCH (a {{{type_attrib}: '{type_code}'}})-[:{metadata_rel}]-(b) RETURN properties(b) as properties".format(
                    type_attrib=general_type_attribute, type_code=type_code, metadata_rel=HubmapConst.HAS_METADATA_REL)

                for record in session.run(stmt):
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

if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    uuid = "cafd03e784d2fd091dd2bafc71db911d"
    record = Metadata.get_metadata_by_source(driver, uuid)
    pprint(record)
    
    record_list = Metadata.get_metadata_by_source_type(driver, 'entitytype', 'Donor')
    pprint(record_list)

    record_list = Metadata.get_metadata_by_source_type(driver, 'entitytype', 'Tissue Sample')
    pprint(record_list)

    
    record_list = Metadata.get_metadata_by_source_type(driver, 'entitytype', 'bad entity')
    pprint(record_list)
    
    pprint(AuthCache.getHMGroups())

    conn.close()
        
