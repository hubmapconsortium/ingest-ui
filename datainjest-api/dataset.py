'''
Created on Apr 18, 2019

@author: chb69
'''
from neo4j_connection import Neo4jConnection
from edu.pitt.dbmi.hubmap.neo4j.UUIDGenerator import getNewUUID
from neo4j import TransactionError, CypherError
import sys
import os
sys.path.append(os.path.realpath("../common-api"))
from hubmap_const import HubmapConst 

class Dataset(object):
    '''
    classdocs
    '''


    def __init__(self):
        pass

    @classmethod
    def get_datasets(self, driver): 
        with driver.session() as session:
            return_list = []
            try:
                stmt = "MATCH (a {{{type_attribute}: '{dataset_type}'}}) RETURN a.{uuid_attrib} AS uuid, a.{name_attrib} AS label, a.{desc_attrib} AS description, a.{publish_attrib} AS published, a.{has_phi_attrib} AS hasPHI".format(type_attribute=HubmapConst.ENTITY_TYPE_ATTRIBUTE, dataset_type=HubmapConst.DATASET_TYPE_CODE,uuid_attrib=HubmapConst.UUID_ATTRIBUTE, 
                        name_attrib=HubmapConst.NAME_ATTRIBUTE, desc_attrib=HubmapConst.DESCRIPTION_ATTRIBUTE, has_phi_attrib=HubmapConst.HAS_PHI_ATTRIBUTE, publish_attrib=HubmapConst.DATASET_STATUS_ATTRIBUTE)

                for record in session.run(stmt):
                    return_list.append({'uuid': str(record["uuid"]), 'label': str(record["label"]), 'description': str(record["description"]), 'hasPHI': str(record["hasPHI"]), 'published': str(record["published"])})
                print (return_list)
                return return_list                    
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
            except:
                print ('A general error occurred: ')
                for x in sys.exc_info():
                    print (x)

    # TODO: I may want to change this to simply use the properties(a) Cypher code
    @classmethod
    def get_dataset(self, driver, uuid): 
        with driver.session() as session:
            return_list = []
            try:
                stmt = "MATCH (a {{{uuid_attrib}: $uuid}}) RETURN properties(a) as properties".format(uuid_attrib=HubmapConst.UUID_ATTRIBUTE)

                for record in session.run(stmt, uuid=uuid):
                    dataset_record = record['properties']
                    return_list.append(dataset_record)
                if len(return_list) == 0:
                    raise LookupError('Unable to find dataset UUID:' + uuid)
                if len(return_list) > 1:
                    raise LookupError('Error more than one dataset found with UUID:' + uuid)
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

    '''
    NOTE!!!  You cannot pass the transaction variable to another method!!  The methods must return a Cypher statement string.
    '''
    @classmethod
    def create_datastage(self, driver, name, description, parentUUID, hasPHI, labCreatedUUID, createdByUUID): 
        conn = Neo4jConnection()
        # step 1: check all the incoming UUID's to make sure they exist
        if conn.does_uuid_exist(parentUUID) != True:
            raise LookupError('Cannot create datastage.  Could not find parentUUID: ' + parentUUID)
        if conn.does_uuid_exist(labCreatedUUID) != True:
            raise LookupError('Cannot create datastage.  Could not find labCreatedUUID: ' + labCreatedUUID)
        if conn.does_uuid_exist(createdByUUID) != True:
            raise LookupError('Cannot create datastage.  Could not find createdByUUID: ' + createdByUUID)

        with driver.session() as session:
            #TODO: swap with Bill's code
            datastage_uuid = getNewUUID()
            tx = None
            try:
                tx = session.begin_transaction()
                # step 2: create the data stage
                datastage_record = {HubmapConst.UUID_ATTRIBUTE : datastage_uuid,  
                                    HubmapConst.NAME_ATTRIBUTE : name, HubmapConst.DESCRIPTION_ATTRIBUTE : description, HubmapConst.HAS_PHI_ATTRIBUTE : hasPHI,
                                    HubmapConst.STATUS_ATTRIBUTE : 'New', HubmapConst.ENTITY_TYPE_ATTRIBUTE: HubmapConst.DATASTAGE_TYPE_CODE }
                stmt = Neo4jConnection.get_create_statement(datastage_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.DATASTAGE_TYPE_CODE, False)
                #tx.run(stmt, uuid=datastage_uuid, name=name, desc=description, has_phi=hasPHI)
                tx.run(stmt)
                # step 3: create the associated activity
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                activity_record = {HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.DATASTAGE_CREATE_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.DATASTAGE_CREATE_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)                
                # step 4: create all relationships
                stmt = Neo4jConnection.create_relationship_statement(datastage_uuid, HubmapConst.DERIVED_FROM_REL, parentUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.LAB_CREATED_AT_REL, labCreatedUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.CREATED_BY_REL, createdByUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, datastage_uuid)
                tx.run(stmt)
                tx.commit()
                return datastage_uuid
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
    def publish_datastage(self, driver, uuid, new_file_path): 
        conn = Neo4jConnection()
        if conn.does_uuid_exist(uuid) != True:
            raise LookupError('Cannot modify datastage.  Could not find datastage uuid: ' + uuid)
        publish_state = 'Published'

        with driver.session() as session:
            tx = None
            try:
                #step 1: copy the existing datastage entity
                datastage_record = self.get_dataset(driver, uuid)
                #TODO: swap with Bill's code
                dataset_uuid = getNewUUID()
                datastage_record[HubmapConst.UUID_ATTRIBUTE] = dataset_uuid
                datastage_record[HubmapConst.DATASET_FILE_PATH_ATTRIBUTE] = new_file_path
                datastage_record[HubmapConst.DATASET_STATUS_ATTRIBUTE] = publish_state
                datastage_record[HubmapConst.ENTITY_TYPE_ATTRIBUTE] = HubmapConst.DATASET_TYPE_CODE
                
                tx = session.begin_transaction()
                stmt = Neo4jConnection.get_create_statement(datastage_record, HubmapConst.ENTITY_NODE_NAME, HubmapConst.DATASET_TYPE_CODE, False)
                tx.run(stmt)
                #step 2: create new activity associated with the dataset
                #TODO: swap with Bill's code
                activity_uuid = getNewUUID()
                datastage_activity_record = { HubmapConst.UUID_ATTRIBUTE : activity_uuid, HubmapConst.ACTIVITY_TYPE_ATTRIBUTE : HubmapConst.DATASET_CREATE_ACTIVITY_TYPE_CODE}
                stmt = Neo4jConnection.get_create_statement(datastage_activity_record, HubmapConst.ACTIVITY_NODE_NAME, HubmapConst.DATASET_PUBLISH_ACTIVITY_TYPE_CODE, True)
                tx.run(stmt)
                # step 3: find all relationships
                stmt = Neo4jConnection.get_entity_from_relationship_statement(uuid, HubmapConst.DERIVED_FROM_REL)
                parentUUID_record = Dataset.get_node_properties(driver, stmt, True)
                parentUUID = parentUUID_record.get(HubmapConst.UUID_ATTRIBUTE)
                
                # step 4: create all relationships

                stmt = Neo4jConnection.create_relationship_statement(dataset_uuid, HubmapConst.DERIVED_FROM_REL, parentUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(activity_uuid, HubmapConst.ACTIVITY_OUTPUT_REL, dataset_uuid)
                tx.run(stmt)
                # assign the "old" datastage as the input to the new activity node
                stmt = Neo4jConnection.create_relationship_statement(uuid, HubmapConst.ACTIVITY_INPUT_REL, activity_uuid)
                tx.run(stmt)
                tx.commit()
                return dataset_uuid
            except TypeError as te:
                print ("Type Error: ", te.msg)
                raise te
            except AttributeError as ae:
                print ("Attribute Error: ", ae.msg)
                raise ae
            except:
                raise
            finally:
                pass                

    @classmethod
    def update_filepath_dataset(self, driver, uuid, filepath): 
        conn = Neo4jConnection()
        if conn.does_uuid_exist(uuid) != True:
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
    def update_status_dataset(self, driver, uuid, status): 
        conn = Neo4jConnection()
        if conn.does_uuid_exist(uuid) != True:
            raise LookupError('Cannot modify dataset.  Could not find dataset uuid: ' + uuid)
        if HubmapConst.DATASET_STATUS_OPTIONS.count(status) == 0:
            raise ValueError('Cannot modify dataset.  Unknown dataset status: ' + status)
            
        
        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                # step one, delete all relationships in case those are updated
                stmt = "MATCH (a:{type} {{{uuid_attrib}: $uuid}}) SET a.{status_attrib}= $status RETURN a.{uuid_attrib}".format(                                                                                                                                                               
                        type=HubmapConst.ENTITY_NODE_NAME, uuid_attrib=HubmapConst.UUID_ATTRIBUTE, 
                        status_attrib=HubmapConst.DATASET_STATUS_ATTRIBUTE)
                #print ("EXECUTING: " + stmt)
                tx.run(stmt, uuid=uuid, status=status)
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
    def update_dataset(self, driver, uuid, name, description, parentUUID, hasPHI, labCreatedUUID, createdByUUID): 
        conn = Neo4jConnection()
        if conn.does_uuid_exist(uuid) != True:
            raise LookupError('Cannot modify dataset.  Could not find dataset uuid: ' + uuid)
        if conn.does_uuid_exist(parentUUID) != True:
            raise LookupError('Cannot modify dataset.  Could not find parentUUID: ' + parentUUID)
        if conn.does_uuid_exist(labCreatedUUID) != True:
            raise LookupError('Cannot modify dataset.  Could not find labCreatedUUID: ' + labCreatedUUID)
        if conn.does_uuid_exist(createdByUUID) != True:
            raise LookupError('Cannot modify dataset.  Could not find createdByUUID: ' + createdByUUID)

        with driver.session() as session:
            tx = None
            try:
                tx = session.begin_transaction()
                # step one, delete all relationships in case those are updated
                stmt = "MATCH (a {{{uuid_attribute}: '{uuid_value}'}})-[r]-(b) DELETE r".format(uuid_attribute=HubmapConst.UUID_ATTRIBUTE, uuid_value=uuid)
                #print "EXECUTING: " + stmt
                tx.run(stmt)
                # step two, reset the properties
                stmt = "MATCH (a:{type} {{{uuid_attrib}: $uuid}}) SET a.{name_attrib}= $name, a.{desc_attrib}= $desc, a.{has_phi_attrib}= $has_phi, a.{status_attrib} = 'Reopened' RETURN a.{uuid_attrib}".format(                                                                                                                                                               
                        type=HubmapConst.ENTITY_NODE_NAME, uuid_attrib=HubmapConst.UUID_ATTRIBUTE, 
                        name_attrib=HubmapConst.NAME_ATTRIBUTE, desc_attrib=HubmapConst.DESCRIPTION_ATTRIBUTE, status_attrib=HubmapConst.DATASET_STATUS_ATTRIBUTE, 
                        has_phi_attrib=HubmapConst.HAS_PHI_ATTRIBUTE)
                #print ("EXECUTING: " + stmt)
                tx.run(stmt, uuid=uuid, name=name, desc=description, has_phi=hasPHI)
                # step 3, re-establish the relationships
                stmt = Neo4jConnection.create_relationship_statement(uuid, HubmapConst.DERIVED_FROM_REL, parentUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(uuid, HubmapConst.LAB_CREATED_AT_REL, labCreatedUUID)
                tx.run(stmt)
                stmt = Neo4jConnection.create_relationship_statement(uuid, HubmapConst.CREATED_BY_REL, createdByUUID)
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
                print ('A general error occurred: ', sys.exc_info()[0])
                tx.rollback()

    @classmethod
    def validate_dataset(self, driver, uuid): 
        conn = Neo4jConnection()
        if conn.does_uuid_exist(uuid) != True:
            raise LookupError('Cannot validate dataset.  Could not find dataset uuid: ' + uuid)

        with driver.session() as session:
            validate_code = True
            try:
                dataset = Dataset()
                if validate_code == True:
                    dataset.update_status_dataset(driver, uuid, 'Valid')
                else:
                    dataset.update_status_dataset(driver, uuid, 'Invalid')
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
    
    dataset = Dataset()
    #newuuid = dataset.create_datastage(driver, name, description, parentCollection, hasPHI, labCreatedAt, createdBy)
    #print ("New: " + str(newuuid))
    #activity_record = Neo4jConnection.(driver, 'd918ef0e-396f-4879-9f1a-ec5110757900')
    #print (activity_record)"""
    
    stmt = Neo4jConnection.get_entity_from_relationship_statement('b098d0c2-35c2-4702-8928-b537cc6bc5c8', 'ACTIVITY_OUTPUT', 'right')
    print (stmt)
    
    #newuuid = dataset.update_dataset(driver, uuid_to_modify, 'updated name', 'updated description', parentCollection, hasPHI, labCreatedAt, dr_x_uuid)
    #newuuid = dataset.publish_datastage(driver, uuid_to_modify, 'bogus/publish/path')
    #dataset.update_filepath_dataset(driver, '804bff5c-c0fd-4aa8-bfa5-a23c691c64f3', 'completelybogusfilepath')
    #print ("Modified: " + str(newuuid))
    """dataset_record = dataset.get_dataset(driver, '02ec0545-faaf-4d27-b89c-aed91d27b0b9')
    print (dataset_record)
    dataset_record = dataset.get_dataset(driver, 'ec08e0ee-f2f6-4744-acb4-c4c6745eb04f')
    print (dataset_record)
    activity_record = dataset.get_activity_output_for_dataset(driver, 'd918ef0e-396f-4879-9f1a-ec5110757900')
    print (activity_record)"""
    conn.close()
