'''
Created on Apr 23, 2019

@author: chb69
'''
import sys
import os
import base64
import requests
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json, Response
from flask_cors import CORS, cross_origin
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
from globus_sdk.exc import TransferAPIError

from dataset import Dataset
from collection import Collection
from specimen import Specimen, AuthError

from hubmap_commons.hubmap_const import HubmapConst 
from hubmap_commons.neo4j_connection import Neo4jConnection
from hubmap_commons.hm_auth import AuthHelper, secured
from hubmap_commons.entity import Entity
from hubmap_commons.autherror import AuthError
from hubmap_commons.metadata import Metadata
from hubmap_commons.uuid_generator import UUID_Generator
from hubmap_commons.hubmap_error import HubmapError

from pprint import pprint


# Specify the absolute path of the instance folder and use the config file relative to the instance path
app = Flask(__name__, instance_path=os.path.join(os.path.abspath(os.path.dirname(__file__)), 'instance'), instance_relative_config=True)
app.config.from_pyfile('app.cfg')

token_list = {}

# Initialize the AuthHelper
# This is used by the @secured decorator
if AuthHelper.isInitialized() == False:
    authcache = AuthHelper.create(
        app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])
else:
    authcache = AuthHelper.instance()


####################################################################################################
## Default Routes
####################################################################################################

# Default endpoint for testing with gateway
@app.route('/', methods = ['GET'])
def index():
    return "Hello! This is HuBMAP Ingest API service :)"


@app.route('/hello', methods=['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def hello():
    return jsonify({'uuid': 'hello'}), 200


####################################################################################################
## Ingest API Endpoints
####################################################################################################

@app.route('/datasets', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'POST'])
@secured(groups="HuBMAP-read")
def get_datasets():
    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
        if 'keywords' in request.args:
            searchterm = request.args.get('keywords')
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
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        token = str(request.headers["AUTHORIZATION"])[7:]
        dataset_record = Dataset.get_dataset(driver, identifier)
        conn.close()
        return jsonify( { 'dataset': dataset_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
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
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        current_token = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(request.headers)
        except:
            raise ValueError("Unable to parse token")
        nexus_token = current_token['nexus_token']
        # determine the group UUID to use when creating the dataset
        group_uuid = None
        form_data = json.loads(request.form['data'])
        if 'user_group_uuid' in form_data:
            if is_user_in_group(nexus_token, form_data['user_group_uuid']):
                group_uuid = form_data['user_group_uuid']
                entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
            entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

@app.route('/datasets/<uuid>/validate', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def validate_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to validate a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        new_uuid = dataset.validate_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Valid' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

@app.route('/datasets/<uuid>/publish', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def publish_datastage(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to publish a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)        
        group_uuid = get_group_uuid_from_request(request)        
        new_uuid = dataset.publishing_process(driver, request.headers, uuid, group_uuid, True)
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
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

@app.route('/datasets/<uuid>/unpublish', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def unpublish_datastage(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to unpublish a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)        
        group_uuid = get_group_uuid_from_request(request)        
        new_uuid = dataset.publishing_process(driver, request.headers, uuid, group_uuid, False)
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
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()
                

@app.route('/datasets/status', methods = ['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
#disabled for now @secured(groups="HuBMAP-read")
def update_ingest_status():
    if not request.json:
        abort(400, jsonify( { 'error': 'no data found cannot process update' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        status_obj = dataset.set_ingest_status(driver, request.json)
        conn.close()
        return jsonify( { 'result' : status_obj } ), 200
    
    except ValueError:
        abort(404, jsonify( { 'error': 'ingest_id {ingest_id} not found'.format(ingest_id=ingest_id) } ))
        
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        print (msg)
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()


def get_group_uuid_from_request(request):
    return_group_uuid = None
    try:
        form_data = json.loads(request.form['data'])

        current_token = None
        try:
            current_token = AuthHelper.parseAuthorizationTokens(request.headers)
        except:
            raise ValueError("Unable to parse token")
        nexus_token = current_token['nexus_token']

        # determine the group UUID to use when creating the dataset
        group_uuid = None
        form_data = json.loads(request.form['data'])
        if 'user_group_uuid' in form_data:
            if is_user_in_group(nexus_token, form_data['user_group_uuid']):
                group_uuid = form_data['user_group_uuid']
                entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
            entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
            group_list = entity.get_user_groups(nexus_token)
            for grp in group_list:
                if grp['generateuuid'] == True:
                    return_group_uuid = grp['uuid']
                    break

            if return_group_uuid == None:
                return Response('Unauthorized: Current user is not a member of a group allowed to create new datasets', 401)
            return return_group_uuid
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    

@app.route('/datasets/<uuid>', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT', 'GET'])
@secured(groups="HuBMAP-read")
def modify_dataset(uuid):
    if not request.form or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to modify a dataset' } ))
    if 'data' not in request.form:
        abort(400, jsonify( { 'error': 'form data is required to modify a dataset' } ))
    conn = None
    new_uuid = None
    try:
        
        group_uuid = get_group_uuid_from_request(request)    
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        
        form_data = json.loads(request.form['data'])
        
        new_uuid = dataset.modify_dataset(driver, request.headers, uuid, form_data, group_uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid } ), 204
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()
"""
@app.route('/datasets/<uuid>/lock', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def lock_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to lock a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        new_uuid = dataset.lock_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Locked' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

@app.route('/datasets/<uuid>/reopen', methods = ['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT'])
@secured(groups="HuBMAP-read")
def reopen_dataset(uuid):
    if not request.json or uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to reopen a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        dataset = Dataset(app.config)
        new_uuid = dataset.reopen_dataset(driver, uuid)
        conn.close()
        return jsonify( { 'uuid': new_uuid, 'status': 'Locked' } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += x
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()
"""
@app.route('/collections', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'POST'])
@secured(groups="HuBMAP-read")
def get_collections():
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
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
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()

    

@app.route('/collections', methods = ['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST', 'GET'])
@secured(groups="HuBMAP-read")
def create_collection():
    if not request.form:
        abort(400)
    if 'data' not in request.form:
        abort(400)
    conn = None
    new_uuid = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
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
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['PUT', 'GET'])
@secured(groups="HuBMAP-read")
def update_collection():
    return Response('PUT method not implemented is invalid', 400)


@app.route('/collections/<identifier>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'PUT'])
@secured(groups="HuBMAP-read")
def get_collection(identifier):
    if identifier == None or len(identifier) == 0:
        abort(400, jsonify( { 'error': 'identifier parameter is required to get a dataset' } ))
    
    conn = None
    new_uuid = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        collection_record = Collection.get_collection(driver, identifier)
        conn.close()
        return jsonify( { 'collection': collection_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        if conn != None:
            if conn.get_driver().closed() == False:
                conn.close()
    



####################################################################################################
## Metadata API Endpoints
####################################################################################################

@app.route('/metadata/usergroups', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def user_group_list():
    token = str(request.headers["AUTHORIZATION"])[7:]
    try:
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
        group_list = entity.get_user_groups(token)
        return jsonify( {'groups' : group_list}), 200
    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

@app.route('/metadata/userroles', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def user_role_list():
    token = str(request.headers["AUTHORIZATION"])[7:]
    try:
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
        role_list = entity.get_user_roles(token)
        
        #temp code!!
        #role_list = []
        
        return jsonify( {'roles' : role_list}), 200
    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

# this method returns a JSON list of the UUIDs for the entities the current user can edit.  The entitytype is an optional parameter.  If it is not set,
# the method returns all the editable entities available to the user. 
@app.route('/metadata/usercanedit/type', methods = ['GET'])
@app.route('/metadata/usercanedit/type/<entitytype>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def user_edit_entity_list(entitytype=None):
    token = str(request.headers["AUTHORIZATION"])[7:]
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
        edit_list = entity.get_editable_entities_by_type(driver, token, entitytype)
        return jsonify( { 'entity_list': edit_list } ), 200
    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

# this method returns a simple JSON message {'editable':'True|False'}.  True indicates that the current
# user can edit the given entity.  False indicates they cannot edit the entity.
@app.route('/metadata/usercanedit/<entityuuid>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def can_user_edit_entity(entityuuid):
    token = str(request.headers["AUTHORIZATION"])[7:]
    #entityuuid = request.args.get('entityuuid')
    if len(entityuuid) == 0:
        abort(400, jsonify( { 'error': 'entityuuid parameter is required' } ))
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
        can_edit = entity.can_user_edit_entity(driver, token, entityuuid)
        return jsonify( { 'editable': can_edit } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

# this method returns JSON containing a group uuid if given the name of a group (ex: hubmap-read) or returns
# the name of the group if given a uuid (ex: 5777527e-ec11-11e8-ab41-0af86edb4424).  If the idenfier cannot be found,
# it returns a 404.
# The JSON returned looks like {"groupuuid":"5777527e-ec11-11e8-ab41-0af86edb4424", "groupname":"hubmap-all-access"}
# example url: /metadata/groups/hubmap-read or /metadata/groups/777527e-ec11-11e8-ab41-0af86edb4424  
@app.route('/metadata/groups/<identifier>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_group_by_identifier(identifier):
    if len(identifier) == 0:
        abort(400, jsonify( { 'error': 'identifier parameter is required' } ))
    metadata = Metadata(confdata['APP_CLIENT_ID'], confdata['APP_CLIENT_SECRET'], confdata['UUID_WEBSERVICE_URL'])
    try:
        group = metadata.get_group_by_identifier(identifier)
        return jsonify( { 'group': group } ), 200
    except ValueError as ve:
        return jsonify( { 'error': 'cannot find a Hubmap group matching: [' + identifier + ']' } ), 404
        

    
@app.route('/metadata/source/type/<type_code>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_metadata_by_source_type(type_code):
    if type_code == None or len(type_code) == 0:
        abort(400, jsonify( { 'error': 'type_code parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        metadata = Metadata(confdata['APP_CLIENT_ID'], confdata['APP_CLIENT_SECRET'], confdata['UUID_WEBSERVICE_URL'])
        general_type_attr = HubmapConst.get_general_node_type_attribute(type_code)
        if len(general_type_attr) == 0:
            abort(400, 'Unable to find type data for type: ' + type_code)
        metadata_record = metadata.get_metadata_by_source_type(driver, general_type_attr, type_code)
        conn.close()
        #TODO: figure out how to jsonify an array
        return jsonify( { 'metadata': metadata_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/metadata/source/<uuid>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_metadata_by_source(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        metadata = Metadata(confdata['APP_CLIENT_ID'], confdata['APP_CLIENT_SECRET'], confdata['UUID_WEBSERVICE_URL'])
        metadata_record = metadata.get_metadata_by_source(driver, uuid)
        conn.close()
        #TODO: figure out how to jsonify an array
        return jsonify( { 'metadata': metadata_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()

@app.route('/metadata/<uuid>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_metadata(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        metadata = Metadata(confdata['APP_CLIENT_ID'], confdata['APP_CLIENT_SECRET'], confdata['UUID_WEBSERVICE_URL'])
        metadata_record = metadata.get_metadata(driver, uuid)
        conn.close()
        return jsonify( { 'metadata': metadata_record } ), 200
    
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
    finally:
        conn.close()





####################################################################################################
## Specimen API Endpoints
####################################################################################################
   
@app.route('/specimens', methods=['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
@secured(groups="HuBMAP-read")
def create_specimen():
    if not request.form:
        abort(400)
    if 'data' not in request.form:
        abort(400)

    # build a dataset from the json
    #new_specimen = {}
    # Convert the incoming JSON into an associative array using the JSON keys as the keys for the array
    # for key in request.json.keys():
    #    new_specimen[key] = request.json[key]
    # TODO: make this a list in a configuration file
    #min_datastage_keys = ['name','description','hasphi','labcreatedat','createdby','parentcollection']
    #missing_key_list = [x for x in min_datastage_keys if x not in request.json.keys()]
    # if len(missing_key_list) > 0:
    #    abort(400, "Bad request, the JSON is missing these required fields:" + str(missing_key_list))


    conn = None
    new_uuid = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        specimen = Specimen()
        sourceuuid = None
        if 'data' not in request.form:
            return Response('form data is invalid', 401)
        form_data = json.loads(request.form['data'])
        
        # determine the group UUID to use when creating the specimen
        group_uuid = None
        if 'user_group_uuid' in form_data:
            if is_user_in_group(token, form_data['user_group_uuid']):
                group_uuid = form_data['user_group_uuid']
                entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
            entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
            group_list = entity.get_user_groups(token)
            for grp in group_list:
                if grp['generateuuid'] == True:
                    group_uuid = grp['uuid']
                    break

            if group_uuid == None:
                return Response('Unauthorized: Current user is not a member of a group allowed to create new specimens', 401)
        # default to one new specimen
        sample_count = 1    
        if 'source_uuid' in form_data:
            sourceuuid = form_data['source_uuid']
            r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + sourceuuid, headers={'Authorization': 'Bearer ' + token })
            if r.ok == False:
                raise ValueError("Cannot find specimen with identifier: " + sourceuuid)
            sourceuuid = json.loads(r.text)[0]['hmuuid']
            
            if 'sample_count' in form_data:
                if len(str(form_data['sample_count'])) > 0:
                    sample_count = int(form_data['sample_count'])

        new_uuid_records = specimen.create_specimen(
            driver, request, form_data, request.files, token, group_uuid, sourceuuid, sample_count)
        #new_uuid_record = specimen.create_specimen(
        #    driver, request, form_data, request.files, token, group_uuid, sourceuuid, sample_count)
        conn.close()
        #return jsonify({'uuid': new_uuid_record[HubmapConst.UUID_ATTRIBUTE]}), 201 

        return jsonify(new_uuid_records), 201 

    except HubmapError as he:
        print('A Hubmap error was encountered: ', str(he))
        return jsonify( he.getJson()), 400
        #return Response(jsonify(he.getJson()), 401)
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

def is_user_in_group(token, group_uuid):
    entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
    group_list = entity.get_user_groups(token)
    for grp in group_list:
        if grp['uuid'] == group_uuid:
            return True
    return False

@app.route('/specimens/<identifier>', methods=['PUT'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'PUT'])
@secured(groups="HuBMAP-read")
def update_specimen(identifier):
    if not request.form:
        abort(400)
    if 'data' not in request.form:
        abort(400)

    # build a dataset from the json
    #new_specimen = {}
    # Convert the incoming JSON into an associative array using the JSON keys as the keys for the array
    # for key in request.json.keys():
    #    new_specimen[key] = request.json[key]
    # TODO: make this a list in a configuration file
    #min_datastage_keys = ['name','description','hasphi','labcreatedat','createdby','parentcollection']
    #missing_key_list = [x for x in min_datastage_keys if x not in request.json.keys()]
    # if len(missing_key_list) > 0:
    #    abort(400, "Bad request, the JSON is missing these required fields:" + str(missing_key_list))


    conn = None
    new_uuid = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + identifier, headers={'Authorization': 'Bearer ' + token })
        if r.ok == False:
            raise ValueError("Cannot find specimen with identifier: " + identifier)
        uuid = json.loads(r.text)[0]['hmuuid']
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        specimen = Specimen()
        form_data = request.form['data']
        # use the group uuid if it is sent from the front-end
        group_uuid = None
        if 'user_group_uuid' in form_data:
            if is_user_in_group(token, form_data['user_group_uuid']):
                group_uuid = form_data['user_group_uuid']
            else:
                return Response('Unauthorized: Current user is not a member of group: ' + str(group_uuid), 401) 
        sourceuuid = None
        new_uuid_record = specimen.update_specimen(
            driver, uuid, request, json.loads(form_data), request.files, token, group_uuid)
        conn.close()
        return jsonify({'uuid': uuid}), 200 

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

@app.route('/specimens/exists/<uuid>', methods=['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def does_specimen_exist(uuid):
    if uuid == None:
        abort(400)
    if len(uuid) == 0:
        abort(400)

    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + uuid, headers={'Authorization': 'Bearer ' + token })
        return jsonify({'exists': r.ok}), 200 

    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

@app.route('/specimens/<identifier>/siblingids', methods=['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_specimen_siblings(identifier):
    if identifier == None:
        abort(400)
    if len(identifier) == 0:
        abort(400)

    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + identifier, headers={'Authorization': 'Bearer ' + token })
        if r.ok == False:
            raise ValueError("Cannot find specimen with identifier: " + identifier)
        uuid = json.loads(r.text)[0]['hmuuid']
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        siblingid_list = Specimen.get_siblingid_list(driver, uuid)
        return jsonify({'siblingid_list': siblingid_list}), 200 

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

@app.route('/specimens/<identifier>', methods=['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET', 'PUT'])
@secured(groups="HuBMAP-read")
def get_specimen(identifier):
    if identifier == None:
        abort(400)
    if len(identifier) == 0:
        abort(400)

    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + identifier, headers={'Authorization': 'Bearer ' + token })
        if r.ok == False:
            raise ValueError("Cannot find specimen with identifier: " + identifier)
        uuid = json.loads(r.text)[0]['hmuuid']
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        specimen = Entity.get_entity_metadata(driver, uuid)
        return jsonify({'specimen': specimen}), 200 

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

@app.route('/specimens/search/', methods=['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def search_specimen():
    """ Search using Lucene indices.  The items returned are visible to the user according to their token.
    
    Some example URLs are:
        http://localhost:5004/specimens/search?search_term=test donor&entity_type=whole_organ
        uses Lucene index to find items with matching terms
        
        http://localhost:5004/specimens/search/
        uses straight Neo4j query to find items the current user is allowed to see

    """
    conn = None
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection(app.config['NEO4J_SERVER'], app.config['NEO4J_USERNAME'], app.config['NEO4J_PASSWORD'])
        driver = conn.get_driver()
        entity = Entity(app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'], app.config['UUID_WEBSERVICE_URL'])
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
        entity_type_list = request.args.get('entity_type')
        specimen_type = None
        searchterm = None
        if 'specimen_type' in request.args:
            specimen_type = request.args.get('specimen_type')
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
                
        specimen_list =  Specimen.search_specimen(driver, searchterm, readonly_uuid_list, writeable_uuid_list, filtered_group_uuid_list, specimen_type)
        """if searchterm == None:
            specimen_list = entity.get_editable_entities_by_type(driver, token, specimen_type)
        else:
            specimen_list =  Specimen.search_specimen(driver, searchterm, readonly_uuid_list, writeable_uuid_list, filtered_group_uuid_list, specimen_type)
        """
        return jsonify({'specimens': specimen_list}), 200 

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










if __name__ == '__main__':
    try:
        app.run(port=5005)
    finally:
        pass
    

