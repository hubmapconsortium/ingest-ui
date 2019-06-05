'''
Created on Apr 18, 2019

@author: chb69
'''
from neo4j import TransactionError, CypherError
import sys
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from builtins import staticmethod

class Entity(object):
    '''
    classdocs
    '''


    def __init__(self):
        pass

    @staticmethod
    # NOTE: This will return a single entity, activity, or agent
    def get_entity(driver, identifier): 
        with driver.session() as session:
            return_list = []
            try:
                #TODO: I can use the OR operator to match on either uuid or doi:
                #MATCH (e) WHERE e.label= 'test dataset create file10' OR e.label= 'test dataset create file7' RETURN e
                stmt = "MATCH (a) WHERE a.{uuid_attrib}= $identifier OR a.{doi_attrib} = $identifier OR a.{doi_display_attrib} = $identifier RETURN properties(a) as properties".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE,
                                                                                                                                                 doi_attrib=HubmapConst.DOI_ATTRIBUTE, doi_display_attrib=HubmapConst.DISPLAY_DOI_ATTRIBUTE)

                for record in session.run(stmt, identifier=identifier):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
                if len(return_list) == 0:
                    raise LookupError('Unable to find entity using identifier:' + identifier)
                if len(return_list) > 1:
                    raise LookupError('Error more than one entity found with identifier:' + identifier)
                return return_list[0]                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)
                raise

    @staticmethod
    def does_identifier_exist(driver, identifier):
        try:
            entity = Entity.get_entity(driver, identifier)
            return True
        except:
            return False
        
    @staticmethod
    def get_entity_by_type(driver, general_type, type_code): 
        with driver.session() as session:
            return_list = []

            # by default assume Entity type
            type_attrib = HubmapConst.ENTITY_TYPE_ATTRIBUTE
            if str(general_type).lower() == str(HubmapConst.ACTIVITY_NODE_NAME).lower():
                type_attrib = HubmapConst.ACTIVITY_TYPE_ATTRIBUTE
            elif str(general_type).lower() == str(HubmapConst.AGENT_NODE_NAME).lower():
                type_attrib = HubmapConst.AGENT_TYPE_ATTRIBUTE
            try:
                stmt = "MATCH (a {type_attrib}: '{type_code}') RETURN properties(a) as properties".format(
                    type_attrib=general_type, type_code=type_code)

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

    """This method builds a Cypher statement that returns a set of nodes constrained on the given UUID
    and relationship type.  This method also includes an optional "direction" parameter.  This can be used 
    to constrain the Cypher query further to only return the matching nodes adhering to the directionality of the query.
    For more details: https://neo4j.com/docs/cypher-manual/current/clauses/match/#directed-rels-and-variable.
    By default, the direction parameter is None.  This is the most inclusive parameter and will match nodes regardless of direction."""
    @staticmethod
    def get_entity_from_relationship_statement(identifier, relationship_label, direction=None):
        left_dir = ''
        right_dir = ''
        if str(direction).lower() not in ['left', 'right']:
            direction = None
        if str(direction).lower() == 'left':
            left_dir = '<'
        elif str(direction).lower() == 'right':
            right_dir = '>'
        stmt = "MATCH (e){left_dir}-[:{relationship_label}]-{right_dir}(a) WHERE e.{uuid_attrib}= '{identifier}' OR e.{doi_attrib} = '{identifier}' OR e.{doi_display_attrib} = '{identifier}' RETURN properties(a) AS properties".format(
            identifier=identifier,uuid_attrib=HubmapConst.UUID_ATTRIBUTE, doi_attrib=HubmapConst.DOI_ATTRIBUTE, doi_display_attrib=HubmapConst.DISPLAY_DOI_ATTRIBUTE,
                relationship_label=relationship_label, right_dir=right_dir, left_dir=left_dir)
        return stmt                  

    @staticmethod
    def get_entities_by_relationship(driver, identifier, relationship_label, direction=None): 
        with driver.session() as session:
            return_list = []

            try:
                stmt = Entity.get_entity_from_relationship_statement(identifier, relationship_label, direction)

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

    @staticmethod
    def add_datafile_entity(self, driver, entity_uuid, activity_uuid, filepath, label): 
        # step 1: the filepath exists
        """TODO: fix this code
           check that the filepath exists
        """
        
        # step 2: check that the entity_uuid already exists
        if Entity.does_identifier_exist(driver, entity_uuid) != True:
            raise LookupError('Cannot find entity_uuid: ' + entity_uuid)        
        
        # step 3: check that the activity_uuid already exists
        if Entity.does_identifier_exist(driver, activity_uuid) != True:
            raise LookupError('Cannot find activity_uuid: ' + activity_uuid)        

        with driver.session() as session:
            tx = None
            try:
                #TODO: swap with Bill's code
                file_uuid = getNewUUID()

                tx = session.begin_transaction()
                # step 4: create the entity representing the file
                file_record = {HubmapConst.UUID_ATTRIBUTE : file_uuid,  
                                    HubmapConst.ENTITY_TYPE_ATTRIBUTE: HubmapConst.FILE_TYPE_CODE, HubmapConst.FILE_PATH_ATTRIBUTE: filepath }
                stmt = Neo4jConnection.get_create_statement(file_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.FILE_TYPE_CODE, False)
                tx.run(stmt)
                # step 5: create the associated activity
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                
                #TODO: Add provenance data in addition to the TIMESTAMP
                activity_record = {HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.ADD_FILE_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)                
                # step 6: create the relationships
                stmt = Neo4jConnection.create_relationship_statement(entity_uuid, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, file_uuid)
                tx.run(stmt)
                tx.commit()
                return file_uuid
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

    @staticmethod
    #TODO: I could abstract this more with a signature like:
    #connect_entities(self, driver, orig_uuid, connected_uuid, relationship_activity_type_code)
    def derive_entity(self, driver, orig_uuid, derived_uuid): 
        
        # step 1: check that the uuids already exist
        if Entity.does_identifier_exist(orig_uuid) != True:
            raise LookupError('Cannot find orig_uuid: ' + orig_uuid)        
        if Entity.does_identifier_exist(derived_uuid) != True:
            raise LookupError('Cannot find derived_uuid: ' + derived_uuid)        
        
        with driver.session() as session:
            tx = None
            try:
                # step 2: create the associated activity
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                
                #TODO: Add provenance data in addition to the TIMESTAMP
                activity_record = {HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.DERIVED_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.DERIVED_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)                
                # step 5: create the relationships
                stmt = Neo4jConnection.create_relationship_statement(orig_uuid, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, derived_uuid)
                tx.run(stmt)
                tx.commit()
                return activity_uuid
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

    @staticmethod
    def get_node_properties(driver, stmt, there_can_be_only_one=False): 
        with driver.session() as session:
            return_list = []
            try:
                for record in session.run(stmt):
                    entity_record = record['properties']
                    return_list.append(entity_record)
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


if __name__ == "__main__":
    conn = Neo4jConnection()
    driver = conn.get_driver()
    name = 'Test Dataset'
    description= 'This dataset is a test'
    parentCollection = '4470c8e8-3836-4986-9773-398912831'
    hasPHI = False
    labCreatedAt = '0ce5be9b-8b7f-47e9-a6d9-16a08df05f50'
    createdBy = '70a43e57-c4fd-4616-ad41-ca8c80d6d827'

    uuid_to_modify = 'ec08e0ee-f2f6-4744-acb4-c4c6745eb04f'
    dr_x_uuid = '33a46e57-c55d-4617-ad41-ca8a30d6d844'
    datastage_uuid = 'c67a6dec-5ef8-4728-8f42-b70966edcb7e'
    create_datastage_activity = '05e699aa-0320-48ee-b3bc-f92cd72e9f5f'
    entity = Entity()
    file_uuid = entity.get_entity(driver, uuid_to_modify)
    print (file_uuid)
    file_uuid = entity.get_entity(driver, datastage_uuid)
    print (file_uuid)
    file_uuid = entity.get_entity(driver, create_datastage_activity)
    print (file_uuid)
    
    stmt = Entity.get_entity_from_relationship_statement("cafd03e784d2fd091dd2bafc71db911d", "HAS_METADATA", "left")
    print(stmt)
    conn.close()
