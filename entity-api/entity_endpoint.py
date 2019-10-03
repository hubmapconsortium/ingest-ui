'''
Created on May 15, 2019

@author: chb69
'''
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json, Response
import globus_sdk
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient 
import configparser
from pprint import pprint
import base64
from globus_sdk.exc import TransferAPIError
import sys
import os
from neo4j import TransactionError, CypherError
from flask_cors import CORS, cross_origin
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from hubmap_const import HubmapConst 
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID, getUUID
from hm_auth import AuthHelper, secured
from entity import Entity
from flask_cors import CORS, cross_origin
from autherror import AuthError


app = Flask(__name__)

config = configparser.ConfigParser()
try:
    config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
    app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
    app.config['APP_CLIENT_ID'] = config.get('GLOBUS', 'APP_CLIENT_ID')
    app.config['APP_CLIENT_SECRET'] = config.get(
        'GLOBUS', 'APP_CLIENT_SECRET')
    if AuthHelper.isInitialized() == False:
        authcache = AuthHelper.create(
            app.config['APP_CLIENT_ID'], app.config['APP_CLIENT_SECRET'])
    else:
        authcache = AuthHelper.instance()
except:
    msg = "Unexpected error:", sys.exc_info()[0]
    print(msg + "  Program stopped.")
    exit(0)

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
        app.config['APP_CLIENT_SECRET'] = config.get('GLOBUS', 'APP_CLIENT_SECRET')
        app.config['STAGING_ENDPOINT_UUID'] = config.get('GLOBUS', 'STAGING_ENDPOINT_UUID')
        app.config['PUBLISH_ENDPOINT_UUID'] = config.get('GLOBUS', 'PUBLISH_ENDPOINT_UUID')
        app.config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
        app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
        app.config['GLOBUS_STORAGE_DIRECTORY_ROOT'] = config.get('FILE_SYSTEM','GLOBUS_STORAGE_DIRECTORY_ROOT')
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


@app.route('/entities/types/<type_code>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_entity_by_type(type_code):
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        entity_list = Entity.get_entities_by_type(driver, type_code)
        return jsonify( {'uuids' : entity_list}), 200
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

@app.route('/entities/types', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_entity_types():
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        type_list = Entity.get_entity_type_list(driver)
        return jsonify( {'entity_types' : type_list}), 200
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

@app.route('/entities/samples', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_entity_by_sample_type():
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        attribute_name = HubmapConst.SPECIMEN_TYPE_ATTRIBUTE
        search_term = None
        if 'sample_type' in request.args:
            search_term = request.args.get('sample_type')
        elif 'organ_type' in request.args:
            search_term = request.args.get('organ_type')
            attribute_name = HubmapConst.ORGAN_TYPE_ATTRIBUTE

        
        uuid_list = Entity.get_entities_by_metadata_attribute(driver, attribute_name, search_term) 
        return jsonify( {'uuids' : uuid_list}), 200
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)

"""
@app.route('/entities/samples?organ-type=<organ_type>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
def get_entity_by_organ_type(organ_type):
    try:
        conn = Neo4jConnection()
        driver = conn.get_driver()
        uuid_list = Entity.get_entities_by_metadata_attribute(driver, HubmapConst.ORGAN_TYPE_ATTRIBUTE, organ_type) 
        return jsonify( {'uuids' : uuid_list}), 200
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)
"""

@app.route('/entities/<identifier>', methods = ['GET'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['GET'])
@secured(groups="HuBMAP-read")
def get_entity(identifier):
    try:
        token = str(request.headers["AUTHORIZATION"])[7:]
        conn = Neo4jConnection()
        driver = conn.get_driver()
        identifier_list = getUUID(token, identifier)
        if len(identifier_list) == 0:
            raise LookupError('unable to find information on identifier: ' + str(identifier))
        if len(identifier_list) > 1:
            raise LookupError('found multiple records for identifier: ' + str(identifier))

        entity_node = Entity.get_entity(driver, identifier_list[0]['hmuuid'])
        return jsonify( {'entity_node' : entity_node}), 200
    except AuthError as e:
        print(e)
        return Response('token is invalid', 401)
    except LookupError as le:
        print(le)
        return Response(str(le), 404)
    except CypherError as ce:
        print(ce)
        return Response('Unable to perform query to find identifier: ' + identifier, 500)            
    except:
        msg = 'An error occurred: '
        for x in sys.exc_info():
            msg += str(x)
        abort(400, msg)





"""
to get list of uuids for organs: MATCH (e:Entity)-[:HAS_METADATA]-(m) WHERE m.organ IS NOT NULL RETURN e.uuid

"""
if __name__ == '__main__':
    try:
        app.run(port=5006)
    finally:
        pass
