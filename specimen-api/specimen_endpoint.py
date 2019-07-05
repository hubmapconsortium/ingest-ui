'''
Created on May 15, 2019

@author: chb69
'''
import sys
import os
import requests
from specimen import Specimen, AuthError
from globus_sdk.exc import TransferAPIError
import base64
from pprint import pprint
import configparser
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient
import globus_sdk
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json, Response
from flask_cors import CORS, cross_origin
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
from entity import Entity
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from hubmap_const import HubmapConst
from hm_auth import AuthHelper, secured


app = Flask(__name__)

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
        app.config['TRANSFER_ENDPOINT_UUID'] = config.get(
            'GLOBUS', 'TRANSFER_ENDPOINT_UUID')
        app.config['SECRET_KEY'] = config.get('GLOBUS', 'SECRET_KEY')
        app.config['STAGING_FILE_PATH'] = config.get(
            'GLOBUS', 'STAGING_FILE_PATH')
        app.config['PUBLISH_FILE_PATH'] = config.get(
            'GLOBUS', 'PUBLISH_FILE_PATH')
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


@app.route('/hello', methods=['GET'])
def hello():
    return jsonify({'uuid': 'hello'}), 200


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
        conn = Neo4jConnection()
        driver = conn.get_driver()
        specimen = Specimen()
        sourceuuid = None
        if 'data' not in request.form:
            return Response('form data is invalid', 401)
        form_data = json.loads(request.form['data'])
        if 'source_uuid' in form_data:
            sourceuuid = form_data['source_uuid']
            r = requests.get(app.config['UUID_WEBSERVICE_URL'] + "/" + sourceuuid, headers={'Authorization': 'Bearer ' + token })
            if r.ok == False:
                raise ValueError("Cannot find specimen with identifier: " + sourceuuid)
            sourceuuid = json.loads(r.text)[0]['hmuuid']

        new_uuid_record = specimen.create_specimen(
            driver, request, form_data, request.files, token, sourceuuid)
        conn.close()
        return jsonify({'uuid': new_uuid_record[HubmapConst.UUID_ATTRIBUTE]}), 201 

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
        conn = Neo4jConnection()
        driver = conn.get_driver()
        specimen = Specimen()
        sourceuuid = None
        new_uuid_record = specimen.update_specimen(
            driver, uuid, request, json.loads(request.form['data']), request.files, token)
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
        conn = Neo4jConnection()
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
        conn.close()


if __name__ == '__main__':
    try:
        app.run(port=5004)
    finally:
        pass
