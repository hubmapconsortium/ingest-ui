from neo4j import TransactionError, CypherError
import sys
import traceback
import pprint
import json
from py2neo import Graph

from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.entity import Entity
from hubmap_commons.exceptions import HTTPException
from hubmap_commons import string_helper

class Collection(object):
    '''
    classdocs
    '''

    confdata = {}
        
    @classmethod
    def __init__(self, config):
        self.confdata = config
        self.allowed_collection_update_attributes = [HubmapConst.NAME_ATTRIBUTE, HubmapConst.DESCRIPTION_ATTRIBUTE, HubmapConst.COLLECTION_DOI_REGISTERED_ATTRIBUTE, HubmapConst.COLLECTION_CREATORS_ATTRIBUTE]
        self.allowed_creator_attributes = [HubmapConst.CREATOR_FIRST_NAME_ATTRIBUTE, HubmapConst.CREATOR_LAST_NAME_ATTRIBUTE, HubmapConst.CREATOR_ORCID_ID_ATTRIBUTE, HubmapConst.CREATOR_AFFILIATION_ATTRIBUTE, HubmapConst.CREATOR_FULL_NAME_ATTRIBUTE, HubmapConst.CREATOR_MIDDLE_INITIAL_ATTRIBUTE]


    @classmethod
    def get_py2neo_conn(self):
        graph = Graph(self.confdata['NEO4J_SERVER'], auth=(self.confdata['NEO4J_USERNAME'], self.confdata['NEO4J_PASSWORD']))
        return(graph)
    
    @classmethod
    def update_collection(self, uuid, record):
        if (HubmapConst.UUID_ATTRIBUTE in record or
            HubmapConst.DOI_ATTRIBUTE in record or
            HubmapConst.DISPLAY_DOI_ATTRIBUTE in record or
            HubmapConst.ENTITY_TYPE_ATTRIBUTE in record):
            raise HTTPException("ID attributes cannot be changed", 400)
        
        not_allowed = []
        for attrib in record.keys():
            if not attrib in self.allowed_collection_update_attributes:
                not_allowed.append(attrib)
                
        if len(not_allowed) > 0:
            raise HTTPException("Attribute(s) not allowed: " + string_helper.listToDelimited(not_allowed, " "), 400)
        
        if HubmapConst.COLLECTION_CREATORS_ATTRIBUTE in record:
            creators = record[HubmapConst.COLLECTION_CREATORS_ATTRIBUTE]
            for creator in creators:
                for attrib in creator.keys():
                    if not attrib in self.allowed_creator_attributes and not attrib in not_allowed:
                        not_allowed.append(attrib)
            
            if len(not_allowed) > 0:
                raise HTTPException("Creator Aattribute(s) not allowed: " +  string_helper.listToDelimited(not_allowed, " "), 400)
            
        save_record = {}
        for attrib in record.keys():
            if attrib == HubmapConst.COLLECTION_CREATORS_ATTRIBUTE:
                save_record[attrib] = json.dumps(record[attrib])
            else:
                save_record[attrib] = record[attrib]
        
        
        rval = self.get_py2neo_conn().run("match(c:Collection {uuid: {uuid}}) set c += {params} return c.uuid", uuid=uuid, params=save_record).data()
        if len(rval) == 0:
            raise HTTPException("Update failed for collection with uuid " + uuid + ".  UUID possibly not found.", 400)
        else:
            if rval[0]['c.uuid'] != uuid:
                raise HTTPException("Update failed, wrong uuid returned while trying to update " + uuid + " returned: " + rval[0]['c.uuid'])  

    
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

