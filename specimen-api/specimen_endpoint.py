'''
Created on May 15, 2019

@author: chb69
'''
import sys
import os
sys.path.append(os.path.realpath("../common-api"))
from specimen import Specimen, AuthError
from globus_sdk.exc import TransferAPIError
import base64
from pprint import pprint
import configparser
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient
import globus_sdk
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json, Response
from flask_cors import CORS, cross_origin
from neo4j_connection import Neo4jConnection
from uuid_generator import getNewUUID
from hubmap_const import HubmapConst


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
    config.read('../common-api/app.properties')
    app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
except:
    msg = "Unexpected error:", sys.exc_info()[0]
    print(msg + "  Program stopped.")
    exit(0)
@app.route('/newspecimens2', methods=['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
def create_specimen2():
    if not request.form:
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
        data_directory = temp_get_data_directory('/Users/chb69/globus_temp_data/5bd084c8-edc2-11e8-802f-0e368f3075e8', 'temp_test', True)
        #request, json.loads(request.form['data']), request.files
        if 'metadata_file' in request.files:
            metadata_file_path = temp_upload_file_data(request, 'metadata_file', data_directory)
        """if 'images' in incoming_record:
            image_file_data_list = Specimen.upload_image_file_data(request, incoming_record['images'], file_list, data_directory)
            incoming_record[HubmapConst.IMAGE_FILE_METADATA_ATTRIBUTE] = image_file_data_list"""
        return jsonify({'metadata_file_path': metadata_file_path}), 201 

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

def temp_upload_file_data(request, file_key, directory_path):
    try:
        #TODO: handle case where file already exists.  Append a _x to filename where
        # x is an integer
        file = request.files[file_key]
        filename = os.path.basename(file.filename)
        file.save(os.path.join(directory_path, filename))
        return str(os.path.join(directory_path, filename))
    except:
        raise

def temp_get_data_directory(parent_folder, group_uuid, create_folder=False):
    if not os.path.exists(os.path.join(parent_folder, group_uuid)):
        if create_folder == False:
            raise ValueError('Error: cannot find path: ' + os.path.join(parent_folder, group_uuid))
        else:
            try:
                os.mkdir(os.path.join(parent_folder, group_uuid))
            except OSError as oserr:
                pprint(oserr)
    return os.path.join(parent_folder, group_uuid)
    
@app.route('/specimens', methods=['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
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
        if 'sourceuuid' in request.form.keys():
            sourceuuid = request.form['sourceuuid']
        new_uuid_record = specimen.create_specimen(
            driver, request, json.loads(request.form['data']), request.files, token, sourceuuid)
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


if __name__ == '__main__':
    try:
        app.run()
    finally:
        pass
