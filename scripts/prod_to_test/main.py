from indexer import Indexer

print("Please select below:")
print("1. Pull Neo4j data from prod to test")
print("2. Pull UUID data from prod to test")
print("3. Reindex Elastic Search against test Neo4j")
try:
    option = int(input("I want to do:"))
    if not 1 <= option <= 3:
        raise ValueError()
except ValueError as ve:
    print("Please select 1 2 or 3.")

if option == 1:
    pass
elif option == 2:
    pass
elif option == 3:
    start = time.time()
    indexer = Indexer(index_name, config['ELASTICSEARCH_DOMAIN_ENDPOINT'], config['ENTITY_WEBSERVICE_URL'])
    indexer.main()
    end = time.time()
    print(end - start)
else:
    print("Unknown option selected")