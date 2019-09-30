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



LOG_FILE_NAME = "/tmp/uuid-" + time.strftime("%d-%m-%Y-%H-%M-%S") + ".log" 
logger = None
worker = None
app = Flask(__name__)
app.config.from_pyfile('uuid_app.conf')

@app.before_first_request
def init():
    global logger
    global worker
    try:
        logger = logging.getLogger('uuid.service')
        logger.setLevel(logging.INFO)
        logFH = logging.FileHandler(LOG_FILE_NAME)
        logger.addHandler(logFH)
        logger.info("started")
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
        logger.info("initialized")

    except Exception as e:
        print("Error during startup.")
        print(str(e))
        logger.error(e, exc_info=True)
        print("Check the log file for further information: " + LOG_FILE_NAME)




@app.route('/hello')
def hello():
    global logger
    return Response("Hello", 200)


'''
POST arguments in json
  entityType- required: the type of entity, DONOR, TISSUE, DATASET
  generateDOI- optional, defaults to false
  parentId- required for entity type of TISSUE, optional for all others
  hubmap-ids- optional, an array of ids to associate and store with the
              generated ids. If provide, the length of this array must
              match the sample_count argument
              
 Query (in url) argument
   sample_count optional, the number of ids to generate.  If omitted,
                defaults to 1 
              
 curl example:  curl -d '{"entityType":"BILL-TEST","generateDOI":"true","hubmap-ids":["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]   }' -H "Content-Type: application/json" -H "Authorization: Bearer AgX07PVbz9Wb6WDK3QvP9p23j2vWV7bYnMGBvaQxQQGEY5MjJEIwC8x3vwqYmzwEzPw93qWYeGpEkKu4nOkPgs7VKQ" -X POST http://localhost:5000/hmuuid?sample_count=7  
'''
@app.route('/hmuuid', methods=["POST"])
@secured(groups="HuBMAP-read")
def add_hmuuid():
    global worker
    global logger
    try:
        if request.method == "POST":
            if 'sample_count' in request.args:
                nArgs = request.args.get('sample_count')
                if string_helper.isBlank(nArgs) or not nArgs.strip().isnumeric():
                    return Response("Sample count must be an integer ", 400)
                rjson = worker.uuidPost(request, int(nArgs))
            else:
                rjson = worker.uuidPost(request, 1)
            if isinstance(rjson, Response):
                return rjson                
            jsonStr = json.dumps(rjson)
            
            return Response(jsonStr, 200, {'Content-Type': "application/json"})
        else:
            return Response("Invalid request.  Use POST to create a UUID", 500)
    except Exception as e:
        eMsg = str(e)
        logger.error(e, exc_info=True)
        return(Response("Unexpected error: " + eMsg, 500))

@app.route('/hmuuid/<hmuuid>', methods=["GET"])
@secured(groups="HuBMAP-read")
def get_hmuuid(hmuuid):
    global worker
    global logger
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
    global worker
    global logger
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
        app.run(host='0.0.0.0')
    except Exception as e:
        print("Error during starting debug server.")
        print(str(e))
        logger.error(e, exc_info=True)
        print("Check the log file for further information: " + LOG_FILE_NAME)

