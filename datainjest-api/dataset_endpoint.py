'''
Created on Apr 23, 2019

@author: chb69
'''
import sys
import os
from dataset import Dataset
from neo4j_connection import Neo4jConnection
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json
import sys
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import configparser
# from edu.pitt.dbmi.hubmap.neo4j.UUIDGenerator import getNewUUID
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from pprint import pprint
import base64
from globus_sdk.exc import TransferAPIError
from flask_cors import CORS, cross_origin
from hm_auth import AuthHelper, secured


app = Flask(__name__)
token_list = {}
@app.before_first_request
def load_app_client():
    load_config_file()
    return globus_sdk.ConfidentialAppAuthClient(
        app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])

def load_config_file():
    config = configparser.ConfigParser()
    try:
        config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
        app.config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
        app.config['APP_CLIENT_SECRET'] = config.get(
            'GLOBUS', 'APP_CLIENT_SECRET')
        app.config['STAGING_ENDPOINT_UUID'] = config.get('GLOBUS', 'STAGING_ENDPOINT_UUID')
        app.config['PUBLISH_ENDPOINT_UUID'] = config.get('GLOBUS', 'PUBLISH_ENDPOINT_UUID')
        app.config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
        app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
        app.config['UUID_WEBSERVICE_URL'] = config.get('HUBMAP', 'UUID_WEBSERVICE_URL')
        app.config['LOCAL_STORAGE_DIRECTORY'] = config.get('FILE_SYSTEM','LOCAL_STORAGE_DIRECTORY')
        #app.config['DEBUG'] = True
    except OSError as err:
        msg = "OS error.  Check config.ini file to make sure it exists and is readable: {0}".format(
            err)
        print(msg + "  Program stopped.")
        exit(0)
    except configparser.NoSectionError as noSectError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
            noSectError)
        print(msg + "  Program stopped.")
        exit(0)
    except configparser.NoOptionError as noOptError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
            noOptError)
        print(msg + "  Program stopped.")
        exit(0)
    except SyntaxError as syntaxError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
            syntaxError)
        msg = msg + "  Cannot read line: {0}".format(syntaxError.text)
        print(msg + "  Program stopped.")
        exit(0)
    except AttributeError as attrError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(
            attrError)
        msg = msg + "  Cannot read line: {0}".format(attrError.text)
        print(msg + "  Program stopped.")
        exit(0)
    except:
        msg = "Unexpected error:", sys.exc_info()[0]
        print(msg + "  Program stopped.")
        exit(0)

config = configparser.ConfigParser()
try:
    config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
    app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
    app.config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
    app.config['APP_CLIENT_SECRET'] = config.get(
        'GLOBUS', 'APP_CLIENT_SECRET')
    app.config['UUID_WEBSERVICE_URL'] = config.get('HUBMAP', 'UUID_WEBSERVICE_URL')
    if AuthHelper.isInitialized() == False:
        authcache = AuthHelper.create(
            app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])
    else:
        authcache = AuthHelper.instance()
except:
    msg = "Unexpected error:", sys.exc_info()[0]
    print(msg + "  Program stopped.")
    exit(0)
    
@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({'uuid': 'hello'}), 200

@app.route('/datasets', methods = ['GET'])
def get_datasets():
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        data = dataset.get_datasets(driver)
        conn.close()
    
        response = app.response_class(
            response=json.dumps(data),
            status=200,
            mimetype='application/json'
        )
    except:
        #TODO: return a 400 or 500 error
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()
    return response

@app.route('/datasets/<uuid>', methods = ['GET'])
def get_dataset(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to get a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        dataset_record = dataset.get_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'dataset': dataset_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets', methods = ['POST'])
# NOTE: The first step in the process is to create a "data stage" entity
# A data stage entity is the entity before a dataset entity.
def create_datastage():
    if not request.json or not 'name' in request.json:
        abort(400)
    
    #build a dataset from the json
    new_datastage = {}
    # Convert the incoming JSON into an associative array using the JSON keys as the keys for the array
    for key in request.json.keys():
        new_datastage[key] = request.json[key]
    #TODO: make this a list in a configuration file
    min_datastage_keys = ['name','description','hasphi','labcreatedat','createdby','parentcollection']
    missing_key_list = [x for x in min_datastage_keys if x not in request.json.keys()]
    if len(missing_key_list) > 0:
        abort(400, "Bad request, the JSON is missing these required fields:" + str(missing_key_list))
        
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        new_uuid = dataset.create_datastage(driver, new_datastage['name'], new_datastage['description'], new_datastage['parentcollection'], new_datastage['hasphi'], new_datastage['labcreatedat'], new_datastage['createdby'])
        filepath = staging_directory(new_uuid)
        new_uuid = dataset.update_filepath_dataset(driver, new_uuid, filepath)
        conn.close()
        return jsonify( { 'uuid': new_uuid } ), 201
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/validate', methods = ['PUT'])
def validate_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to publish a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        new_uuid = dataset.validate_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Valid' } ), 204
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/publish', methods = ['POST'])
def publish_datastage(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to publish a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        #TODO: if this doesn't work, we need to move the directory back
        new_file_path = publish_directory(uuid)  
        new_uuid = dataset.publish_datastage(driver, uuid, new_file_path)
        conn.close()
        return jsonify( { 'uuid': new_uuid } ), 204
    
    except ValueError:
        abort(404, jsonify( { 'error': 'dataset {uuid} not found'.format(uuid=uuid) } ))
        
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        print (msg)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>', methods = ['PUT'])
def modify_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to modify a dataset' } ))
    
    new_dataset = {
        'name': request.json['name'],
        'description': request.json.get('description', ''),
        'parentcollection': request.json['parentcollection'],
        'hasphi': request.json['hasphi'],
        'labcreatedat': request.json['labcreatedat'],
        'createdby': request.json['createdby'],        
    }
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        new_uuid = dataset.update_dataset(driver, uuid, new_dataset['name'], new_dataset['description'], new_dataset['parentcollection'], new_dataset['hasphi'], new_dataset['labcreatedat'], new_dataset['createdby'])
        conn.close()
        return jsonify( { 'uuid': new_uuid } ), 204
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/lock', methods = ['POST'])
def lock_dataset(uuid):
    pass

@app.route('/datasets/<uuid>/reopen', methods = ['POST'])
def reopen_dataset(uuid):
    pass

@app.route('/collections', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_collections():
    return json.dumps([{
        'name': 'collection1',
        'description': 'This is collection 1',
        'uuid': 'dc01a09f-e4db-4e53-a560-7a2ad80c1f02',
        'display_dio': 'HBM:838-SWXH-475',
        'doi': '838SWXH475',
        'entitytype': 'Collection'
    }, {
        'name': 'collection2',
        'description': 'This is collection 2',
        'uuid': '4501a09f-66bd-4e53-a560-7a269bdd1f02',
        'display_doi': 'HBM:654-STTH-775',
        'doi': '654STTH775',
        'entitytype': 'Collection'
    }]), 200

@app.route('/collections', methods = ['POST'])
def create_collection():
    return jsonify({
        'name': 'collection3',
        'description': 'This is collection 3',
        'uuid': '4501a09f-66bd-4e53-a560-7a269bdd1f03',
        'display_doi': 'HBM:654-STTH-775',
        'doi': '654STTH775',
        'entitytype': 'Collection'
    }), 201

@app.route('/collections/<uuid>', methods = ['PUT'])
def update_collection():
    return jsonify({
        'name': 'collection1',
        'description': 'This is collection 1',
        'uuid': '4501a09f-66bd-4e53-a560-7a269bdd1f02',
        'display_doi': 'HBM:654-STTH-775',
        'doi': '654STTH775',
        'entitytype': 'Collection'
    }), 200


    


if __name__ == '__main__':
    try:
        app.run(port=5005)
    finally:
        pass
    

