'''
Created on May 15, 2019

@author: chb69
'''
import sys
import os
sys.path.append(os.path.realpath("../common-api"))
from specimen import Specimen
from globus_sdk.exc import TransferAPIError
import base64
from pprint import pprint
import configparser
from globus_sdk import AccessTokenAuthorizer, TransferClient, AuthClient
import globus_sdk
from flask import Flask, jsonify, abort, request, make_response, url_for, session, redirect, json
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
        config.read('../common-api/config.ini')
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
    config.read('../common-api/config.ini')
    app.config['UUID_UI_URL'] = config.get('HUBMAP', 'UUID_UI_URL')
except:
    msg = "Unexpected error:", sys.exc_info()[0]
    print(msg + "  Program stopped.")
    exit(0)
@app.route('/specimens', methods=['POST'])
@cross_origin(origins=[app.config['UUID_UI_URL']], methods=['POST'])
def create_specimen():
    if not request.json:
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
        #    def crneate_specimen(driver, incoming_record, current_token, labUUID, sourceUUID=None):
        labuuid = None
        sourceuuid = None
        if 'labuuid' in request.json.keys():
            labuuid = request.json['labuuid']
        if 'sourceuuid' in request.json.keys():
            sourceuuid = request.json['sourceuuid']
        new_uuid_record = specimen.create_specimen(
            driver, request.json, token, labuuid, sourceuuid)
        conn.close()
        return jsonify({'uuid': new_uuid_record[HubmapConst.UUID_ATTRIBUTE]}), 201 

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
