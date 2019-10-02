'''
Created on Apr 18, 2019

@author: chb69
'''

import uuid
import requests
import json
import os
import sys
from hubmap_const import HubmapConst 
from pprint import pprint
from flask import session
import configparser
import globus_sdk #pip import globus_sdk
import base64
from requests.exceptions import TooManyRedirects

app_config = {}

def load_config_file():    
    config = configparser.ConfigParser()
    try:
        config.read(os.path.join(os.path.dirname(__file__), '..', 'common-api', 'app.properties'))
        app_config['UUID_WEBSERVICE_URL'] = config.get('HUBMAP', 'UUID_WEBSERVICE_URL')
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

def getNewUUID(current_token, uuid_type, hubmap_identifier=None, sample_count=1):
    load_config_file()
    url = app_config['UUID_WEBSERVICE_URL'] + "?sample_count=" + str(sample_count)
    if current_token == None or len(current_token) == 0:
        raise ValueError("Error in getNewUUID: the token cannot be blank")
    if uuid_type == None or len(uuid_type) == 0:
        raise ValueError("Error in getNewUUID: the uuid_type cannot be blank")
    try:
        # take the incoming uuid_type and uppercase it
        uuid_datatype = str(uuid_type).upper()
        r = requests.post(url, json={"entityType" : "{uuid_datatype}".format(uuid_datatype=uuid_datatype), "generateDOI" : "true", "hubmap-ids" : hubmap_identifier}, 
                          headers={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=current_token )})
        if r.ok == True:
            data = json.loads(r.content.decode())
            return data
        else:
            msg = 'HTTP Response: ' + str(r.status_code) + ' msg: ' + str(r.text) 
            raise Exception(msg)
    except ConnectionError as connerr: # "connerr"...get it? like "ConAir"
        pprint(connerr)
        raise connerr
    except TimeoutError as toerr:
        pprint(toerr)
        raise toerr
    except TooManyRedirects as toomany:
        pprint(toomany)
        raise toomany
    except Exception as e:
        pprint(e)
        raise e

def getUUID(current_token, identifier):
    load_config_file()
    url = app_config['UUID_WEBSERVICE_URL'] + "/" + str(identifier)
    if current_token == None or len(current_token) == 0:
        raise ValueError("Error in getNewUUID: the token cannot be blank")
    try:
        # take the incoming uuid_type and uppercase it
        r = requests.get(url, headers={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=current_token )})
        if r.ok == True:
            data = json.loads(r.content.decode())
            return data
        else:
            msg = 'HTTP Response: ' + str(r.status_code) + ' msg: ' + str(r.text) 
            raise Exception(msg)
    except ConnectionError as connerr: # "connerr"...get it? like "ConAir"
        pprint(connerr)
        raise connerr
    except TimeoutError as toerr:
        pprint(toerr)
        raise toerr
    except TooManyRedirects as toomany:
        pprint(toomany)
        raise toomany
    except Exception as e:
        pprint(e)
        raise e


if __name__ == '__main__':
    try:
        #app.run()
        current_token = 'AgK6EKN866y61K0Pbo0Jkag53kkD9BJN6DgprwVqWlpkpn1VnYueC4x0PJKpqPp8K00OpoxJbMWGJyI17KebkfmBwW'
        hum_id = ['id4', 'id5', 'id6' ]
        returned_uuid = getNewUUID(current_token, HubmapConst.SAMPLE_TYPE_CODE, hum_id, len(hum_id))
        pprint(returned_uuid)
        """returned_uuid = getUUID(current_token, 'HBM347.BPJH.682')
        pprint(returned_uuid)
        returned_uuid = getUUID(current_token, '347BPJH682')
        pprint(returned_uuid)
        returned_uuid = getUUID(current_token, 'f05e1b358b00bbf22ebab7834b730a06')
        pprint(returned_uuid)
        """
    except Exception as e:
        pprint(e)
    finally:
        #clear_tokens()
        pass
    