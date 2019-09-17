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
from flask_cors import CORS, cross_origin
from pprint import pprint
import base64
from globus_sdk.exc import TransferAPIError
from collection import Collection
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from entity import Entity
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from hubmap_const import HubmapConst
from hm_auth import AuthHelper, secured
from autherror import AuthError

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
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def hello():
    return jsonify({'uuid': 'hello'}), 200

@app.route('/datasets', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'POST'])
@secured(groups="HuBMAP-read")
def get_datasets():
    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection()
        driver = conn.get_driver()
        entity = Entity()
        readonly_group_list = entity.get_readonly_user_groups(token)
        writeable_group_list = entity.get_writeable_user_groups(token)
        readonly_uuid_list = []
        writeable_uuid_list = []
        #build UUID group list
        for readonly_group_data in readonly_group_list:
            readonly_uuid_list.append(readonly_group_data['uuid'])
        for writeable_group_data in writeable_group_list:
            writeable_uuid_list.append(writeable_group_data['uuid'])
            
        filtered_group_uuid_list = [] 
        searchterm = None
        if 'search_term' in request.args:
            searchterm = request.args.get('search_term')
        # by default, show data from all the groups that the user can access
        filtered_group_uuid_list.extend(readonly_uuid_list)
        filtered_group_uuid_list.extend(writeable_uuid_list)
        # remove the test group, by default
        test_group_uuid = '5bd084c8-edc2-11e8-802f-0e368f3075e8'
        if test_group_uuid in filtered_group_uuid_list:
            filtered_group_uuid_list.remove(test_group_uuid)
        # if the user selects a specific group in the search filter,
        # then use it for the search
        if 'group' in request.args:
            group_name = request.args.get('group')
            if group_name != 'All Groups':
                group_info = entity.get_group_by_name(group_name)
                # reset the filtered group list
                filtered_group_uuid_list = []
                filtered_group_uuid_list.append(group_info['uuid'])
                
        dataset_list =  Dataset.search_datasets(driver, searchterm, readonly_uuid_list, writeable_uuid_list, filtered_group_uuid_list)
        return jsonify({'datasets': dataset_list}), 200 

    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

@app.route('/datasets/<identifier>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'PUT'])
@secured(groups="HuBMAP-read")
def get_dataset(identifier):
    if identifier == None or len(identifier) == 0:
        abort(400, jsonify( { 'error': 'identifier parameter is required to get a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + identifier, headers={'Authorization': 'Bearer ' + token })
        if r.ok == False:
            raise ValueError("Cannot find specimen with identifier: " + identifier)
        uuid = json.loads(r.text)[0]['hmuuid']
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

@app.route('/datasets', methods=['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST', 'GET'])
@secured(groups="HuBMAP-read")
# NOTE: The first step in the process is to create a "data stage" entity
# A data stage entity is the entity before a dataset entity.
def create_datastage():
    if not request.form:
        abort(400)
    if 'data' not in request.form:
        abort(400)
    
    #build a dataset from the json
    new_datastage = {}
    conn = None
    new_record = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        current_token = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(request.headers)
        except:
            raise ValueError("Unable to parse token")
        nexus_token = current_token['nexus_token']
        # determine the group UUID to use when creating the specimen
        group_uuid = None
        form_data = json.loads(request.form['data'])
        if 'user_group_uuid' in form_data:
            if is_user_in_group(nexus_token, form_data['user_group_uuid']):
                group_uuid = form_data['user_group_uuid']
                entity = Entity()
                grp_info = None
                try:
                    grp_info = entity.get_group_by_identifier(group_uuid)
                except ValueError as ve:
                    return Response('Unauthorized: Cannot find information on group: ' + str(group_uuid), 401)
                if grp_info['generateuuid'] == False:
                    return Response('Unauthorized: This group {grp_info} is not a group with write privileges.'.format(grp_info=grp_info), 401)
            else:
                return Response('Unauthorized: Current user is not a member of group: ' + str(group_uuid), 401) 
        else:
            #manually find the group id given the current user:
            entity = Entity()
            group_list = entity.get_user_groups(nexus_token)
            for grp in group_list:
                if grp['generateuuid'] == True:
                    group_uuid = grp['uuid']
                    break

            if group_uuid == None:
                return Response('Unauthorized: Current user is not a member of a group allowed to create new specimens', 401)
        new_record = dataset.create_datastage(driver, request.headers, form_data, group_uuid)
        conn.close()
        return jsonify( new_record ), 201
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/validate', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
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
        return jsonify( { 'uuid': new_uuid, 'status': 'Valid' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/publish', methods = ['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
@secured(groups="HuBMAP-read")
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
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT', 'GET'])
@secured(groups="HuBMAP-read")
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
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
@secured(groups="HuBMAP-read")
def lock_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to lock a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        new_uuid = dataset.lock_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Locked' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()

@app.route('/datasets/<uuid>/reopen', methods = ['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
@secured(groups="HuBMAP-read")
def reopen_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to reopen a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        dataset = Dataset()
        new_uuid = dataset.reopen_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Locked' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        conn.close()

@app.route('/collections', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'POST'])
@secured(groups="HuBMAP-read")
def get_collections():
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        collection_records = Collection.get_collections(driver)
        conn.close()
        return jsonify( { 'collections': collection_records } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

    

@app.route('/collections', methods = ['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST', 'GET'])
@secured(groups="HuBMAP-read")
def create_collection():
    import pdb; pdb.set_trace()
    if not request.form:
        abort(400)
    if 'data' not in request.form:
        abort(400)
    conn = None
    new_uuid = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection()
        driver = conn.get_driver()
        collection = Collection()
        form_data = json.loads(request.form['data'])
        collection_uuid = Collection.create_collection(driver, token, form_data)
        
        conn.close()
        return jsonify({ 'uuid': collection_uuid}), 201 

    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()


@app.route('/collections/<uuid>', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def update_collection():
    return jsonify({
        'name': 'collection1',
        'description': 'This is collection 1',
        'uuid': '4501a09f-66bd-4e53-a560-7a269bdd1f02',
        'display_doi': 'HBM:654-STTH-775',
        'doi': '654STTH775',
        'entitytype': 'Collection'
    }), 200


@app.route('/collections/<identifier>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_collection(identifier):
    if identifier == None or len(identifier) == 0:
        abort(400, jsonify( { 'error': 'identifier parameter is required to get a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + identifier, headers={'Authorization': 'Bearer ' + token })
        if r.ok == False:
            raise ValueError("Cannot find specimen with identifier: " + identifier)
        uuid = json.loads(r.text)[0]['hmuuid']
        collection_record = Collection.get_collection(driver, uuid)
        conn.close()
        return jsonify( { 'collection': dataset_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()
    


if __name__ == '__main__':
    try:
        app.run(port=5005)
    finally:
        pass
    

