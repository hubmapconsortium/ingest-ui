import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'common-api'))
import time
import logging
from uuid_worker import UUIDWorker
import json
from flask import Flask, request, Response
import string_helper
from hm_auth import secured



LOG_FILE_NAME = "uuid-" + time.strftime("%d-%m-%Y-%H-%M-%S") + ".log" 
logger = None
worker = None
app = Flask(__name__)
app.config.from_pyfile('uuid_app.conf')
    
'''
POST arguments in json
  entityType- required: the type of entity, DONOR, TISSUE, DATASET
  generateDOI- optional, defaults to false
  parentId- required for entity type of TISSUE, optional for all others
'''


@app.route('/hello')
def hello():
    return Response("Hello", 200)

@app.route('/hmuuid', methods=["POST"])
@secured(groups="HuBMAP-read")
def add_hmuuid():
    try:
        if request.method == "POST":
            return worker.uuidPost(request)
        else:
            return Response("Invalid request.  Use POST to create a UUID", 500)
    except Exception as e:                                                                                                            
        eMsg = str(e)                                                                                                                 
        logger.error(e, exc_info=True)                                                                                                
        return(Response("Unexpected error: " + eMsg, 500))    

@app.route('/hmuuid/<hmuuid>', methods=["GET"])
@secured(groups="HuBMAP-read")
def get_hmuuid(hmuuid):
    try:
        if request.method == "GET":
            info = worker.getIdInfo(hmuuid)
            return info
        else:
            return Response ("Invalid request use GET to retrieve UUID information", 500)
    except Exception as e:                                                                                                            
        eMsg = str(e)                                                                                                                 
        logger.error(e, exc_info=True)                                                                                                
        return(Response("Unexpected error: " + eMsg, 500))    

@app.route('/hmuuid/<hmuuid>/exists', methods=["GET"])
@secured(groups="HuBMAP-read")
def is_hmuuid(hmuuid):
    try:
        if request.method == "GET":
            exists = worker.getIdExists(hmuuid)
            if isinstance(exists, Response):
                return exists
            return json.dumps(exists)
        else:
            return Response ("Invalid request use GET to check the status of a UUID", 500)
    except Exception as e:
        eMsg = str(e)
        logger.error(e, exc_info=True)
        return(Response("Unexpected error: " + eMsg, 500))

if __name__ == "__main__":
    try:
        logger = logging.getLogger('uuid.service')                                                                                             
        logger.setLevel(logging.INFO)                                                                                                     
        logFH = logging.FileHandler(LOG_FILE_NAME)                                                                                          
        logger.addHandler(logFH)
    except Exception as e:
        print("Error opening log file during startup")
        print(str(e))

    try:
        
        if 'APP_CLIENT_ID' not in app.config or string_helper.isBlank(app.config['APP_CLIENT_ID']):
            raise Exception("Required configuration parameter APP_CLIENT_ID not found in application configuration.")
        if 'APP_CLIENT_SECRET' not in app.config or string_helper.isBlank(app.config['APP_CLIENT_ID']):
            raise Exception("Required configuration parameter APP_CLIENT_SECRET not found in application configuration.")
        cId = app.config['APP_CLIENT_ID']
        cSecret = app.config['APP_CLIENT_SECRET']
        worker = UUIDWorker(clientId=cId, clientSecret=cSecret)
        app.run(host='0.0.0.0')
    except Exception as e:                                                                                                            
        print("Error during startup.")                                                                                              
        print(str(e))                                                                                                                 
        logger.error(e, exc_info=True)                                                                                                
        print("Check the log file for further information: " + LOG_FILE_NAME)                                                           
