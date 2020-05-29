from neo4j import TransactionError, CypherError
from libs.es_writer import ESWriter
import sys, json, time, concurrent.futures
import requests
import configparser
import ast

config = configparser.ConfigParser()
config.read('conf.ini')

class Indexer:

    def __init__(self, index_name, elasticsearch_url, entity_webservice_url):
        self.eswriter = ESWriter(elasticsearch_url)
        self.entity_webservice_url = entity_webservice_url
        self.index_name = index_name

    def main(self):
        try:
            self.eswriter.remove_index(self.index_name)
            donors = requests.get(self.entity_webservice_url + "/entities?entitytypes=Donor").json()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                results = [executor.submit(self.index_tree, donor) for donor in donors]
                for f in concurrent.futures.as_completed(results):
                    print(f.result())
            # for donor in donors:
            #     self.index_tree(donor)
        
        except Exception as e:
            print(e)

    def index_tree(self, donor):
        descendants = requests.get(self.entity_webservice_url + "/entities/descendants/" + donor.get('uuid', None)).json()
        for node in [donor] + descendants:
            print(node.get('hubmap_identifier', None))
            doc = self.generate_doc(node)
            self.eswriter.write_document(self.index_name, doc)

        return f"Done. {donor.get('hubmap_identifier', 'hubmap_identifier missing')}"

    def reindex(self, uuid):
        print(f"Before /entities/uuid/{uuid} call")
        print(self.entity_webservice_url + "/entities/uuid/" + uuid)
        entity = requests.get(self.entity_webservice_url + "/entities/uuid/" + uuid).json()['entity']
        print(f"After /entities/uuid/{uuid} call")
        print(f"Before /entities/ancestors/{uuid} call")
        ancestors = requests.get(self.entity_webservice_url + "/entities/ancestors/" + uuid).json()
        print(f"After /entities/ancestors/{uuid} call")
        print(f"Before /entities/descendants/{uuid} call")
        descendants = requests.get(self.entity_webservice_url + "/entities/descendants/" + uuid).json()
        print(f"After /entities/descendants/{uuid} call")
        nodes = [entity] + ancestors + descendants

        for node in nodes:
            print(node.get('hubmap_identifier', None))
            doc = self.generate_doc(node)
            self.eswriter.delete_document(self.index_name, node['uuid'])
            self.eswriter.write_document(self.index_name, doc)
        
        return f"Done."

    def generate_doc(self, entity):
        try:
            ancestors = requests.get(self.entity_webservice_url + "/entities/ancestors/" + entity.get('uuid', None)).json()
            descendants = requests.get(self.entity_webservice_url + "/entities/descendants/" + entity.get('uuid', None)).json()

            for a in ancestors:
                if 'ingest_metadata' in a:
                    a['ingest_metadata'] = str(a['ingest_metadata'])
            for d in descendants:
                if 'ingest_metadata' in d:
                    d['ingest_metadata'] = str(d['ingest_metadata'])
            # build json
            entity['ancestor_ids'] = [a.get('uuid', 'missing') for a in ancestors]
            entity['descendant_ids'] = [d.get('uuid', 'missing') for d in descendants]
            entity['ancestors'] = ancestors
            entity['descendants'] = descendants
            entity['access_group'] = self.access_group(entity)
            if 'ingest_metadata' in entity:
                entity['ingest_metadata'] = ast.literal_eval(entity['ingest_metadata'])

            return json.dumps(entity)

        except Exception as e:
            print(e)
    
    def access_group(self, entity):
        try:
            if entity['entitytype'] == 'Dataset':
                if entity['status'] == 'Published' and entity['phi'] == 'no':
                    return 'Open'
                else:
                    return 'Readonly'
            else:
                return 'Readonly'
        
        except Exception as e:
            print(e)

if __name__ == '__main__':
    try:
        index_name = sys.argv[1]
    except IndexError as ie:
        index_name = input("Please enter index name (Warning: All documents in this index will be clear out first): ")
    
    start = time.time()
    indexer = Indexer(index_name, config['ELASTICSEARCH']['ELASTICSEARCH_DOMAIN_ENDPOINT'], config['ELASTICSEARCH']['ENTITY_WEBSERVICE_URL'])
    indexer.main()
    end = time.time()
    print(end - start)