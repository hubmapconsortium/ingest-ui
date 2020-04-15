# MATCH (n:Entity {display_doi: 'HBM662.WFXS.697'}), (n)-[r1:HAS_METADATA]->(m) SET m.data_types="['dt_codex', 'dt_sciex']" RETURN n.uuid

import csv

with open('assay_types.csv') as csvfile:
    readCSV = csv.reader(csvfile, delimiter=',')
    
    with driver.session() as session:
        for row in readCSV:
            stmt = f"MATCH (n:Entity {{display_doi: '{row[0]}'}}), (n)-[r1:HAS_METADATA]->(m) SET m.data_types=\"[${row[1]}'']\" RETURN n.uuid"

            uuid = session.run(stmt)

            print(uuid)
        