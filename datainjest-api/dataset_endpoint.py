'''
Created on Apr 23, 2019

@author: chb69
'''
from dataset import Dataset
from neo4j_connection import Neo4jConnection
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json
import sys
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import configparser
from edu.pitt.dbmi.hubmap.neo4j.UUIDGenerator import getNewUUID
from pprint import pprint
import base64
from globus_sdk.exc import TransferAPIError


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
        config.read('config.ini')
        app.config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
        app.config['APP_CLIENT_SECRET'] = config.get('GLOBUS', 'APP_CLIENT_SECRET')
        app.config['TRANSFER_ENDPOINT_UUID'] = config.get('GLOBUS', 'TRANSFER_ENDPOINT_UUID')
        app.config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
        app.config['STAGING_FILE_PATH'] = config.get('GLOBUS', 'STAGING_FILE_PATH')
        app.config['PUBLISH_FILE_PATH'] = config.get('GLOBUS','PUBLISH_FILE_PATH')
        #app.config['DEBUG'] = True
    except OSError as err:
        msg = "OS error.  Check config.ini file to make sure it exists and is readable: {0}".format(err)
        print (msg + "  Program stopped.")
        exit(0)
    except configparser.NoSectionError as noSectError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(noSectError)
        print (msg + "  Program stopped.")
        exit(0)
    except configparser.NoOptionError as noOptError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(noOptError)
        print (msg + "  Program stopped.")
        exit(0)
    except SyntaxError as syntaxError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(syntaxError)
        msg = msg + "  Cannot read line: {0}".format(syntaxError.text)
        print (msg + "  Program stopped.")
        exit(0)        
    except AttributeError as attrError:
        msg = "Error reading the config.ini file.  Check config.ini file to make sure it matches the structure in config.ini.example: {0}".format(attrError)
        msg = msg + "  Cannot read line: {0}".format(attrError.text)
        print (msg + "  Program stopped.")
        exit(0)        
    except:
        msg = "Unexpected error:", sys.exc_info()[0]
        print (msg + "  Program stopped.")
        exit(0)


@app.route('/datasets', methods=["GET"])
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

# NOTE: The globus API would return a "No effective ACL rules on the endpoint" error
# if the file path was wrong.  
def staging_directory(dir_UUID):
    if dir_UUID == None or len(str(dir_UUID)) == 0:
        raise ValueError('The dataset UUID must have a value')
    transfer_token_entry = token_list['transfer.globus.org']
    transfer_token = transfer_token_entry['token']
    tc = globus_sdk.TransferClient(authorizer=AccessTokenAuthorizer(transfer_token))
    try:
        tc.operation_mkdir(app.config['TRANSFER_ENDPOINT_UUID'],path=get_staging_path(dir_UUID))
        print ("Done adding directory: " + get_staging_path(dir_UUID))
        return get_staging_path(dir_UUID)
    except:
        raise

def move_directory(dir_UUID, oldpath, newpath):
    if dir_UUID == None or len(str(dir_UUID)) == 0:
        raise ValueError('The dataset UUID must have a value')
    transfer_token_entry = token_list['transfer.globus.org']
    transfer_token = transfer_token_entry['token']
    tc = globus_sdk.TransferClient(authorizer=AccessTokenAuthorizer(transfer_token))
    try:
        tc.operation_rename(app.config['TRANSFER_ENDPOINT_UUID'],oldpath=oldpath, newpath=newpath)
        print ("Done moving directory: " + oldpath + " to:" + newpath)
        return str(app.config['STAGING_FILE_PATH'] + str(dir_UUID))
    except TransferAPIError as tae:
        print ('A TransferAPIError occurred: ', tae.msg)
        abort(400, tae.msg)
        
    except:
        raise

def publish_directory(dir_UUID):
    try:
        move_directory(dir_UUID, get_staging_path(dir_UUID), get_publish_path(dir_UUID))
        print ("Done publishing directory: " + get_publish_path(dir_UUID))
        return get_publish_path(dir_UUID)
    except:
        raise

#TODO: This method needs the user's group id
def get_staging_path(uuid):
    return str(app.config['STAGING_FILE_PATH'] + str(uuid))

#TODO: This method needs the user's group id
def get_publish_path(uuid):
    return str(app.config['PUBLISH_FILE_PATH'] + str(uuid))

    


if __name__ == '__main__':
    try:
        app.run()
    finally:
        pass
    

