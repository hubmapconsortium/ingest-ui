from neo4j import GraphDatabase
from neo4j import TransactionError, CypherError

class Neo4jConnection:
    def __init__(self, servername, username, password):
        self.uri = servername
        self.username = username
        self.password = password
        self._driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))

    def close(self):
        self._driver.close()
    
    def get_driver(self):
        if self._driver.closed():
            self._driver = GraphDatabase.driver(self.uri, auth=(self.username, self.password))
        return self._driver