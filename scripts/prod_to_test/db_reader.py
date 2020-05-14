from libs.neo4j_connection import Neo4jConnection
from neo4j import TransactionError, CypherError
from hubmap_commons.hubmap_const import HubmapConst
from pprint import pprint
import json
import ast

class DBReader:

    def __init__(self, config):
        self.config = config
        self.conn = Neo4jConnection(self.config['NEO4J_SERVER'], self.config['NEO4J_USERNAME'], self.config['NEO4J_PASSWORD'])
        self.driver = self.conn.get_driver()

    def get_all_donors(self):
        '''
        get all donor entities
        '''
        donors = []
        with self.driver.session() as session:
            try:
                stmt = f'MATCH (e:Entity), (e)-[r1:HAS_METADATA]->(m) WHERE e.entitytype=\'Donor\' RETURN e, m'

                for record in session.run(stmt):
                    donor = {}
                    donor.update(record.get('e')._properties)
                    for key, value in record.get('m')._properties.items():
                        donor.setdefault(key, value)
                    donors.append(donor)
                
                return donors
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except BaseException as be:
                pprint(be)
                raise be

    def get_entity(self, uuid):
        '''
        get entity by uuid
        '''
        entity = {}
        with self.driver.session() as session:
            try:
                stmt = f'MATCH (e:Entity), (e)-[r1:HAS_METADATA]->(m) WHERE e.uuid=\'{uuid}\' RETURN e, m'
                
                count = 0
                for record in session.run(stmt, uuid=uuid):
                    entity.update(record.get('e')._properties)
                    for key, value in record.get('m')._properties.items():
                        if key == 'ingest_metadata':
                            ingest_metadata = ast.literal_eval(value)
                            for key, value in ingest_metadata.items():
                                entity.setdefault(key, value)
                        else:
                            entity.setdefault(key, value)

                    count += 1
                
                if count > 1:
                    raise Exception("Two or more entity have same uuid in the Neo4j database.")
                else:
                    return entity
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except BaseException as be:
                pprint(be)
                raise be

    def get_all_ancestors(self, uuid):
        '''
        Get all ancestors by uuid
        '''
        with self.driver.session() as session:
            ancestor_ids = []
            ancestors = []
            try:
                stmt = f'''MATCH (e:Entity {{ {HubmapConst.UUID_ATTRIBUTE}: '{uuid}' }})<-[ACTIVITY_OUTPUT]-(e1)<-[r:ACTIVITY_INPUT|:ACTIVITY_OUTPUT*]-(a:Entity), 
                (e)-[r1:HAS_METADATA]->(m), (a)-[r2:HAS_METADATA]->(am) 
                RETURN e, m, a, am'''

                for record in session.run(stmt, uuid=uuid):
                    ancestor_ids.append(record.get('a')['uuid'])
                    ancestor = {}
                    ancestor.update(record.get('a')._properties)
                    for key, value in record.get('am')._properties.items():
                        ancestor.setdefault(key, value)
                    ancestors.append(ancestor)

                return ancestors               
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except BaseException as be:
                pprint(be)
                raise be

    def get_all_descendants(self, uuid):
        '''
        Get all descendants by uuid
        '''
        with self.driver.session() as session:
            descendant_ids = []
            descendants = []
            try:
                stmt = f'''MATCH (e:Entity {{ {HubmapConst.UUID_ATTRIBUTE}: '{uuid}' }})-[:ACTIVITY_INPUT]->(a:Activity)-[r:ACTIVITY_INPUT|:ACTIVITY_OUTPUT*]->(d:Entity),
                         (e)-[r1:HAS_METADATA]->(m), (d)-[r2:HAS_METADATA]->(dm) 
                        RETURN DISTINCT e, m, d, dm'''

                for record in session.run(stmt, uuid=uuid):
                    descendant_ids.append(record.get('d')['uuid'])
                    descendant = {}
                    descendant.update(record.get('d')._properties)
                    for key, value in record.get('dm')._properties.items():
                        descendant.setdefault(key, value)s
                        # if key == 'ingest_metadata':
                        #     ingest_metadata = ast.literal_eval(value)
                        #     for key, value in ingest_metadata.items():
                        #         descendant.setdefault(key, value)
                        # else:
                        #     descendant.setdefault(key, value)
                    descendants.append(descendant)

                return descendants               
            except CypherError as cse:
                print ('A Cypher error was encountered: '+ cse.message)
                raise
            except BaseException as be:
                pprint(be)
                raise be


# if __name__ == '__main__':
#     db_reader = DBReader({'NEO4J_SERVER':'bolt://18.205.215.12:7687', 'NEO4J_USERNAME': 'neo4j', 'NEO4J_PASSWORD': 'td8@-F7yC8cjrJ?3'})
#     # print(db_reader.get_donor('TEST0012-SP-4'))
#     print(db_reader.get_all_donors())