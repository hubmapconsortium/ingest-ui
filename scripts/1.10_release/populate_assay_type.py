# MATCH (n:Entity {display_doi: 'HBM662.WFXS.697'}), (n)-[r1:HAS_METADATA]->(m) SET m.data_types="['dt_codex', 'dt_sciex']" RETURN n.uuid

import csv
from neo4j_connection import Neo4jConnection

config = {
    'NEO4J_SERVER': 'bolt://0.0.0.0:1234',
    'NEO4J_USERNAME': 'user',
    'NEO4J_PASSWORD': 'password'
}

with open('assay_types.csv') as csvfile:
    readCSV = csv.reader(csvfile, delimiter=',')
    
    conn = Neo4jConnection(config['NEO4J_SERVER'], config['NEO4J_USERNAME'], config['NEO4J_PASSWORD'])
    driver = conn.get_driver()

    with driver.session() as session:
        for row in readCSV:
            stmt = f"MATCH (n:Entity {{display_doi: '{row[0]}'}}), (n)-[r1:HAS_METADATA]->(m) SET m.data_types=\"['{row[1]}']\" RETURN n.uuid"

            uuid = session.run(stmt)

            print(uuid.value())
        