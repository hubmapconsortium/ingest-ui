from neo4j import GraphDatabase
import configparser
import sys
import os
from hubmap_const import HubmapConst
from pprint import pprint 
from neo4j import TransactionError, CypherError

'''
Created on Apr 17, 2019

@author: chb69
'''

class Neo4jConnection(object):

    
    def __init__(self):
        self.load_config_file()
        self._driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))

    def close(self):
        self._driver.close()
        
    # gimme the driver...fore!
    def get_driver(self):
        if self._driver.closed():
            self._driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
        return self._driver
       

    #NOTE!!!  You cannot pass the transaction variable to another method!!  The methods must return a Cypher statement string.
    @staticmethod
    def create_relationship_statement(startuuid, rel_label, enduuid):
        stmt = "MATCH (a),(b) WHERE a.{uuid} = '{startuuid}' AND b.{uuid} = '{enduuid}' CREATE (a)-[r:{rel_label}]->(b) RETURN type(r)".format(                                                                                                                                                               
                    rel_label=rel_label,startuuid=startuuid,enduuid=enduuid,uuid=HubmapConst.UUID_ATTRIBUTE)
        return stmt               

    """This method builds a Cypher statement that returns a set of nodes constrained on the given UUID
    and relationship type.  This method also includes an optional "direction" parameter.  This can be used 
    to constrain the Cypher query further to only return the matching nodes adhering to the directionality of the query.
    For more details: https://neo4j.com/docs/cypher-manual/current/clauses/match/#directed-rels-and-variable.
    By default, the direction parameter is None.  This is the most inclusive parameter and will match nodes regardless of direction."""
    @staticmethod
    def get_entity_from_relationship_statement(uuid, relationship_label, direction=None):
        left_dir = ''
        right_dir = ''
        if str(direction).lower() not in ['left', 'right']:
            direction = None
        if str(direction).lower() == 'left':
            left_dir = '<'
        elif str(direction).lower() == 'right':
            right_dir = '>'
        stmt = "MATCH (e {{{uuid_attrib}: '{uuid}'}}){left_dir}-[:{relationship_label}]-{right_dir}(a) RETURN properties(a) AS properties".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE, 
                relationship_label=relationship_label, uuid=uuid, right_dir=right_dir, left_dir=left_dir)
        return stmt                  

    
    def does_identifier_exist(self, uuid):
        returnData = self.get_node_by_identifer(uuid)
        return len(returnData) > 0
        
    def load_config_file(self):    
        config = configparser.ConfigParser()
        try:
            config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
            self.uri = config.get('NEO4J', 'server')
            self.username = config.get('NEO4J', 'username')
            self.password = config.get('NEO4J', 'password')
            #return { 'server' : server, 'user' : username, 'password' : password }
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

    """Build a Cypher create statement based on the create_record variable.  Extract all the fields and values from the
    create_record.  The type_string denotes what type of Neo4j entity to create.  specific_type_string is the sub-type of
    the entity.  include_provenance_timestamp is a boolean flag that includes/excludes the TIMESTAMP() method
    in the create statement."""
    @staticmethod
    def get_create_statement(create_record, type_string, specific_type_string, include_provenance_timestamp):
        try:
            if Neo4jConnection.validate_record(create_record, specific_type_string) == False:
                raise ValueError("Record is missing some required fields for datatype: " + specific_type_string)
            #create_record.get(HubmapConst.UUID_ATTRIBUTE)
            attr_string = ""
            for key in create_record.keys():
                if create_record.get(key) == None or len(str(create_record.get(key))) == 0:
                    #skip empty fields
                    continue
                # escape single quotes
                key_value = str(create_record.get(key)).replace("'", r"\'")
                attr_string += key + ": '" + key_value + "', "
            if include_provenance_timestamp == True:
                attr_string += HubmapConst.PROVENANCE_CREATE_TIMESTAMP_ATTRIBUTE + ": TIMESTAMP(), "
                attr_string += HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE + ": TIMESTAMP()"
            else:
                # Remove the trailing comma
                attr_string = attr_string[:-2]
            stmt =  "CREATE (a:" + type_string +" {" + attr_string + "}} ) RETURN a.{uuid_attrib}".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE)
            return stmt
        except ValueError as valerror:
            raise valerror
        except KeyError as keyerror:
            raise KeyError("Error: Unable to find UUID in the create record")
        except:
            msg = 'An error occurred: '
            for x in sys.exc_info():
                msg += str(x)
            print (msg)
            raise

    """Build a Cypher update statement based on the update_record variable.  Extract all the fields and values from the
    update_record.  The type_string denotes what type of Neo4j entity to create and the
    include_update_timestamp is a boolean flag that includes/excludes the TIMESTAMP() method
    in the update statement."""
    @staticmethod
    def get_update_statement(update_record, include_provenance_data=True):
        attr_string = ""
        uuid = None
        try:
            uuid = update_record.pop(HubmapConst.UUID_ATTRIBUTE)
        except KeyError as keyerror:
            raise KeyError("Error: Unable to find UUID in the update record")
        
        attr_string = "{"
        for key in update_record.keys():
            # escape single quotes
            key_value = str(update_record.get(key)).replace("'", r"\'")
            #handle the case where a Cypher function is sent
            if key_value == 'TIMESTAMP()':
                attr_string += key + ": " + key_value + ", "
            else:
                attr_string += key + ": '" + key_value + "', "
        if include_provenance_data == True:
            attr_string += HubmapConst.PROVENANCE_MODIFIED_TIMESTAMP_ATTRIBUTE + ": TIMESTAMP()"
        else:
            # Remove the trailing space and comma
            attr_string = attr_string[:-2]
        attr_string += "}"
        stmt =  "MATCH (a {{{uuid_attrib}: '{uuid}'}}) SET a += {attr_string} RETURN a.{uuid_attrib}".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE,
                                                                                                            attr_string=attr_string, uuid=uuid)
        return stmt


    """Ensure the data_record contains all the required fields for the given datatype"""
    @staticmethod
    def validate_record(data_record, datatype):
        current_required_fields = None
        if str(datatype).lower() == str(HubmapConst.DATASET_TYPE_CODE).lower():
            current_required_fields = HubmapConst.DATASET_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DATASET_TYPE_CODE).lower():
            current_required_fields = HubmapConst.DATASET_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DATASTAGE_CREATE_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DATASET_PUBLISH_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.FILE_TYPE_CODE).lower():
            current_required_fields = HubmapConst.FILE_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DERIVED_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DATASET_REOPEN_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.METADATA_TYPE_CODE).lower():
            current_required_fields = HubmapConst.METADATA_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.DONOR_TYPE_CODE).lower():
            current_required_fields = HubmapConst.DONOR_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.SAMPLE_TYPE_CODE).lower():
            current_required_fields = HubmapConst.SAMPLE_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.REGISTER_DONOR_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.CREATE_SAMPLE_ACTIVITY_TYPE_CODE).lower():
            current_required_fields = HubmapConst.ACTIVITY_REQUIRED_ATTRIBUTE_LIST
        elif str(datatype).lower() == str(HubmapConst.COLLECTION_TYPE_CODE).lower():
            current_required_fields = HubmapConst.COLLECTION_REQUIRED_ATTRIBUTE_LIST
        else:
            raise ValueError("Error: cannot find required fields for datatype: " + datatype)

        field_list = [o['attribute_name'] for o in current_required_fields]
        for attr in field_list:
            if attr not in data_record:
                return False        
        return True
    
def build_indices(driver):
    with driver.session() as session:
        tx = None
        try:
            tx = session.begin_transaction()
            f = open("create_indices.cql","r")
            fl = f.readlines()
            for l in fl:
                tx.run(l)
            tx.commit()
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
        
            
    
if __name__ == "__main__":
    conn = Neo4jConnection()
    drv1 = conn.get_driver()
    build_indices(drv1)
    #conn.does_identifier_exist('70a43e57-c4fd-4616-ad41-ca8c80d6d827')
    #conn.does_identifier_exist('0ce5be9b-8b7f-47e9-a6d9-16a08df05f50')
    #new_record = {'uuid': '8686865-faaf-4d27-b89c-99999999999', 'label': 'test dataset create file12', 'description': 'description test dataset create file12', 'hasphi': 'true', 'status': 'Published'}
    #stmt = conn.get_create_statement(new_record, 'Entity', 'Datastage', False)
    #curr_record = conn.get_node_by_uuid("91bacfb2a398288222499f4ed208704a")
    conn.close()
    


