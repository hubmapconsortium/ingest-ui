#This file will include any version related update scripts

from neo4j import TransactionError, CypherError
import sys
import os

from dataset import Dataset

from hubmap_commons.hubmap_const import HubmapConst
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.entity import Entity
from hubmap_commons.hm_auth import AuthHelper


def initialize_all_entity_access_levels(confdata):
    conn = Neo4jConnection(confdata['NEO4J_SERVER'], confdata['NEO4J_USERNAME'], confdata['NEO4J_PASSWORD'])
    driver = conn.get_driver()
    with driver.session() as session:
        tx = None
        try:
            tx = session.begin_transaction()
            stmt = """MATCH (e)-[:{has_metadata_rel}]-(m) WHERE e.{entity_type_attr} IN ['Donor','Sample']
            SET m += {{ {data_access_attr}: '{access_level}' }} RETURN e.{uuid_attr}""".format(
                has_metadata_rel=HubmapConst.HAS_METADATA_REL,entity_type_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE,
                data_access_attr=HubmapConst.DATA_ACCESS_LEVEL, access_level=HubmapConst.ACCESS_LEVEL_CONSORTIUM,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE)

            print ("EXECUTING UPDATE: " + stmt)
            tx.run(stmt)

            stmt = """MATCH (c:Collection) 
            SET c += {{ {data_access_attr}: '{access_level}' }} RETURN c.{uuid_attr}""".format(
                data_access_attr=HubmapConst.DATA_ACCESS_LEVEL, access_level=HubmapConst.ACCESS_LEVEL_CONSORTIUM,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE)

            print ("EXECUTING UPDATE: " + stmt)
            tx.run(stmt)
            tx.commit()
        except TransactionError as te: 
            print ('A transaction error occurred: ', te.value)
            tx.rollback()
        except CypherError as cse:
            print ('A Cypher error was encountered: ', cse.message)
            tx.rollback()                
        except:
            print ('A general error occurred: ')
            traceback.print_exc(file=sys.stdout)
            tx.rollback()

def initialize_all_dataset_access_levels(confdata, nexus_token):
    conn = Neo4jConnection(confdata['NEO4J_SERVER'], confdata['NEO4J_USERNAME'], confdata['NEO4J_PASSWORD'])
    driver = conn.get_driver()
    header={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=nexus_token )}
    with driver.session() as session:
        tx = None
        try:
            tx = session.begin_transaction()
            stmt = """MATCH (e)-[:{has_metadata_rel}]-(m) WHERE e.{entity_type_attr} = 'Dataset'
            RETURN e.{uuid_attr} AS uuid, m.{source_uuid_attr} AS source_uuid,
              m.{group_uuid_attr} AS group_uuid, m.{has_phi_attr} AS {has_phi_attr}""".format(
                has_metadata_rel=HubmapConst.HAS_METADATA_REL,entity_type_attr=HubmapConst.ENTITY_TYPE_ATTRIBUTE,
                uuid_attr=HubmapConst.UUID_ATTRIBUTE, source_uuid_attr=HubmapConst.SOURCE_UUID_ATTRIBUTE,
                group_uuid_attr=HubmapConst.PROVENANCE_GROUP_UUID_ATTRIBUTE, has_phi_attr=HubmapConst.HAS_PHI_ATTRIBUTE)
            for record in session.run(stmt):
                uuid = record['uuid']
                source_uuid = record['source_uuid']
                if str(source_uuid).startswith('[') == False:
                    source_uuid = [source_uuid]

                group_uuid = record['group_uuid']
                has_phi = record['phi']
                dataset_record = {'uuid': uuid, 'source_uuid':source_uuid, 'group_uuid':group_uuid, 'phi': has_phi}
                dataset = Dataset(conf_data)
                dataset.modify_dataset(driver, header, uuid, dataset_record, dataset_record['group_uuid'])


        except TransactionError as te: 
            print ('A transaction error occurred: ', te.value)
            tx.rollback()
        except CypherError as cse:
            print ('A Cypher error was encountered: ', cse.message)
            tx.rollback()                
        except:
            print ('A general error occurred: ')
            tx.rollback()

    
if __name__ == "__main__":
    NEO4J_SERVER = ''
    NEO4J_USERNAME = ''
    NEO4J_PASSWORD = ''
    APP_CLIENT_ID = ''
    APP_CLIENT_SECRET = ''
    UUID_WEBSERVICE_URL = ''
    HUBMAP_WEBSERVICE_FILEPATH = ''

    if AuthHelper.isInitialized() == False:
        authcache = AuthHelper.create(
        APP_CLIENT_ID, APP_CLIENT_SECRET)
    else:
        authcache = AuthHelper.instance() 
    processed_secret = AuthHelper.instance().getProcessSecret() 

    conf_data = {'NEO4J_SERVER' : NEO4J_SERVER, 'NEO4J_USERNAME': NEO4J_USERNAME, 
                 'NEO4J_PASSWORD': NEO4J_PASSWORD,
                 'APP_CLIENT_ID': APP_CLIENT_ID,
                 'APP_CLIENT_SECRET': processed_secret,
                 'UUID_WEBSERVICE_URL': UUID_WEBSERVICE_URL,
                 'HUBMAP_WEBSERVICE_FILEPATH': HUBMAP_WEBSERVICE_FILEPATH}
    
    nexus_token = ''
    initialize_all_entity_access_levels(conf_data)
    initialize_all_dataset_access_levels(conf_data, nexus_token)
    
    
    