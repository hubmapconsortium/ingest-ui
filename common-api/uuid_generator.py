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

def getNewUUID(current_token, uuid_type):
    load_config_file()
    url = app_config['UUID_WEBSERVICE_URL']
    if current_token == None or len(current_token) == 0:
        raise ValueError("Error in getNewUUID: the token cannot be blank")
    if uuid_type == None or len(uuid_type) == 0:
        raise ValueError("Error in getNewUUID: the uuid_type cannot be blank")
    try:
        # take the incoming uuid_type and uppercase it
        uuid_datatype = str(uuid_type).upper()
        r = requests.post(url, json={"entityType" : "{uuid_datatype}", "generateDOI" : "true"}, 
                          headers={'Content-Type':'application/json', 'Authorization': 'Bearer {token}'.format(token=current_token, uuid_datatype=uuid_datatype )})
        if r.ok == True:
            data = json.loads(r.content.decode())
            return data
        else:
            msg = 'HTTP Response: ' + r.status_code + ' msg: ' + r.text 
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
        current_token = 'Agg3ex54N76B70r80K2G5yOxnN13mM960q4goq8bdJra1p5a0tJCYw70lnQ8VYq7N89J0y0xMvNN9F168VVwfBgD6'
        returned_uuid = getNewUUID(current_token, HubmapConst.DATASET_TYPE_CODE)
        pprint(returned_uuid)

    except Exception as e:
        pprint(e)
    finally:
        #clear_tokens()
        pass
    