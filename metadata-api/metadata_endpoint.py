'''
Created on May 15, 2019

@author: chb69
'''
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import configparser
from pprint import pprint
import base64
from globus_sdk.exc import TransferAPIError
import sys
import os
from flask_cors import CORS, cross_origin
sys.path.append(os.path.realpath("../common-api"))
from metadata import Metadata
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from hm_auth import AuthHelper
from entity import Entity


app = Flask(__name__)

@app.before_first_request
def load_app_client():
    load_config_file()
    return globus_sdk.ConfidentialAppAuthClient(
        app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])

def load_config_file():    
    config = configparser.ConfigParser()
    try:
        config.read('../common-api/app.properties')
        app.config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
        app.config['APP_CLIENT_SECRET'] = config.get('GLOBUS', 'APP_CLIENT_SECRET')
        app.config['TRANSFER_ENDPOINT_UUID'] = config.get('GLOBUS', 'TRANSFER_ENDPOINT_UUID')
        app.config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
        app.config['STAGING_FILE_PATH'] = config.get('GLOBUS', 'STAGING_FILE_PATH')
        app.config['PUBLISH_FILE_PATH'] = config.get('GLOBUS','PUBLISH_FILE_PATH')
        app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
        app.config['LOCAL_STORAGE_DIRECTORY'] = config.get('FILE_SYSTEM','LOCAL_STORAGE_DIRECTORY')
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

config = configparser.ConfigParser()
try:
    config.read('../common-api/app.properties')
    app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
except:
    msg = "Unexpected error:", sys.exc_info()[0]
    print(msg + "  Program stopped.")
    exit(0)

         
# this method returns a JSON list of the UUIDs for the entities the current user can edit.  The entitytype is an optional parameter.  If it is not set,
# the method returns all the editable entities available to the user. 
@app.route('/metadata/usercanedit/type', methods = ['GET'])
@app.route('/metadata/usercanedit/type/<entitytype>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def user_edit_entity_list(entitytype=None):
    token = str(request.headers["AUTHORIZATION"])[7:]
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        entity = Entity()
        edit_list = entity.get_editable_entities_by_type(driver, token, entitytype)
        return jsonify( { 'entity_list': edit_list } ), 200
    
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
def can_user_edit_entity(entityuuid):
    token = str(request.headers["AUTHORIZATION"])[7:]
    #entityuuid = request.args.get('entityuuid')
    if len(entityuuid) == 0:
        abort(400, jsonify( { 'error': 'entityuuid parameter is required' } ))
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        entity = Entity()
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
def get_group_by_identifier(identifier):
    if len(identifier) == 0:
        abort(400, jsonify( { 'error': 'identifier parameter is required' } ))
    metadata = Metadata()
    try:
        group = metadata.get_group_by_identifier(identifier)
        return jsonify( { 'group': group } ), 200
    except ValueError as ve:
        return jsonify( { 'error': 'cannot find a Hubmap group matching: [' + identifier + ']' } ), 404
        

    
@app.route('/metadata/source/type/<type_code>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_metadata_by_source_type(type_code):
    if type_code == None or len(type_code) == 0:
        abort(400, jsonify( { 'error': 'type_code parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        metadata = Metadata()
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
def get_metadata_by_source(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        metadata = Metadata()
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
def get_metadata(uuid):
    if uuid == None or len(uuid) == 0:
        abort(400, jsonify( { 'error': 'uuid parameter is required to get a metadata instance' } ))
    
    conn = None
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        metadata = Metadata()
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

if __name__ == '__main__':
    try:
        app.run(port=5002)
    finally:
        pass
