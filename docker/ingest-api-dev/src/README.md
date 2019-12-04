# injest-api for HuBMAP
A set of web service calls needed for data ingest.

The webservices are accessible through the /entities restful endpoint.
A description of the API calls is found here: [Entities API](https://drive.google.com/open?id=16C5vINOV53mKO5hIpFycbSdETsi6SIYd2FzB4Py2jBI).  (You may need to ask for permission to view this document)

## Flask app configuration

This application is written in Flask and it includes an **app.cfg.example** file in the `instance` directory.  Copy the file and rename it **app.cfg** and modify  with the appropriate information.

## Standalone local development

This assumes you are developing the code with the Flask development server and you have access to the remote neo4j database.

### Install dependencies

````
sudo pip3 install -r requirements.txt
````

Note: if you need to use a modified version of the [HuBMAP commons] dependency, download the code and make changes, then install the dependency using `src/requirements_dev.txt` and make sure the local file system path is specified correctly.

### Start Flask development server

````
cd src
export FLASK_APP=app.py
export FLASK_ENV=development
flask run
````

This code runs by default on port 5000. You can change the port using a `-p` or `--port` switch at command line. For instance:

````
flask run -p 5001
````
