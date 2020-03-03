from os.path import join, dirname
from jsonschema import validate, ValidationError, SchemaError
import jsonref
import json


def assert_valid_schema(data, schema_file):
    """ Checks whether the given data matches the schema """

    schema = _load_json_schema(schema_file)
    return validate(data, schema)


def _load_json_schema(filename):
    """ Loads the given schema file """

    relative_path = join('schemas', filename)
    absolute_path = join(dirname(__file__), relative_path)
    
    base_path = dirname(absolute_path)
    base_uri = 'file://{}/'.format(base_path)

    with open(absolute_path) as schema_file:
        return jsonref.loads(schema_file.read(), base_uri=base_uri, jsonschema=True)

if __name__ == '__main__':
    """
    stanford_mapping = extract_stanford_mapping()
    akoya_mapping = extract_akoya_mapping()
    akoya_output_filename = "/Users/chb69/Documents/workspace/codex_converter/data/akoya_experiment_output.json"
    stanford_output_filename = "/Users/chb69/Documents/workspace/codex_converter/data/stanford_experiment_output.json"
    akoya_input_filename = "/Users/chb69/Documents/workspace/codex_converter/data/akoya_experiment.json"
    stanford_input_filename = "/Users/chb69/Documents/workspace/codex_converter/data/stanford_experiment.json"
    print("Akoya output")
    process_akoya_file(akoya_input_filename, akoya_output_filename)
    print("\n")
    print("Stanford output")
    print("\n")
    process_stanford_file(stanford_input_filename, stanford_output_filename)
    """
    schema_file = '/Users/chb69/git/ingest-pipeline/src/ingest-pipeline/schemata/cytokit.schema.json'
    sample_json = '/Users/chb69/git/ingest-ui/src/ingest-api/cytokit_sample_spleen_experiment.json'
    schema_file = '/Users/chb69/git/ingest-pipeline/src/ingest-pipeline/schemata/dataset_metadata.schema.json'
    schema_file = '/Users/chb69/git/ingest-pipeline/src/ingest-pipeline/schemata/dataset_metadata_with_refs.schema.json'
    sample_json = '/Users/chb69/git/ingest-ui/src/ingest-api/dataset_file_metadata_sample.json'
    json_data = None
    schema_data = None

    try:
        with open(sample_json) as json_sample_file:
            json_data = json.load(json_sample_file)
        
        with open(schema_file) as json_schema_file:
            schema_data = json.load(json_schema_file)
        
        #validate(instance=json_data, schema=schema_data)
        assert_valid_schema(json_data, schema_file)
    except ValidationError as ve:
        print(ve)
    except SchemaError as se:
        print(se)
    except Exception as e:
        print(e)
    
    
    print("Done.")
