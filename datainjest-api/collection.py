from neo4j_connection import Neo4jConnection
from edu.pitt.dbmi.hubmap.neo4j.UUIDGenerator import getNewUUID
from neo4j import TransactionError, CypherError
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst 

class Collection(object):
    '''
    classdocs
    '''

    def __init__(self):
        pass


if __name__ == "__main__":
    pass