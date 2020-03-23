# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/). It contians the web UIs for both the ID System and the Data Ingest tool. The source code is located in this reposiory at `src/ingest-ui`.   

And the backend ingest API is located in this repository at `src/ingest-api`, this is a restful web service exposing calls needed for the ingest UI React application.  The API is documented [here](http://smart-api.info/ui/2628cdd76b9994d89ad98ac92a82c18b).

## Development and deployment environments

We have the following 4 development and deployment environments:

* localhost - all the services will be deployed with docker containers including sample Neo4j and sample MySQL are running on the same localhost listing on different ports, without globus data
* dev - all services except ingest-api will be running on AWS EC2 with SSL certificates, Neo4j and MySQL are dev versions on AWS, and ingest-api(and another nginx) will be running on PSC with domain and globus data
* test - similar to dev but for production-like settings with Neo4j and MySQL test versions of database
* prod - similar to test but for production settings with production versions of Neo4j and MySQL

### Localhost development

This option allows you to setup all the pieces in a containerized environment with docker and docker-compose. This requires to have the [HuBMAP Gateway](https://github.com/hubmapconsortium/gateway) running locally before starting building this docker compose project. Please follow the [instructions](https://github.com/hubmapconsortium/gateway#workflow-of-setting-up-multiple-hubmap-docker-compose-projects). It also requires the Gateway project to be configured accordingly.

### Deployment on dev, test, and prod

In localhost mode, all the docker containers are running on the same host machine. However, the ingest-api will be deployed on a separare host machine for dev, test, and prod mode due to different deployment requirements. 

Before we go ahead to start building the docker image, we can do a check to see if the required configuration file is in place:

````
cd docker
./ingest-api-docker.sh dev check
````

Building the docker images and starting/stopping the contianers require to use docker daemon, you'll probably need to use `sudo` in the following steps. 

To build the docker image of ingest-api:

````
sudo ./ingest-api-docker.sh dev build
````

To start up the ingest-api container (including nginx on the same container):

````
sudo ./ingest-api-docker.sh dev start
````

And stop the running container by:

````
sudo ./ingest-api-docker.sh dev stop
````
### Updating API Documentation

The documentation for the API calls is hosted on SmartAPI.  Modifying the ingest-api-spec.yaml file and commititng the changes to github should update the API shown on SmartAPI.  SmartAPI allows users to register API documents.  The Ingest-UI HuBMAP API's are associated with this github account: api-developers@hubmapconsortium.org.  Please contact Chuck Borromeo (chb69@pitt.edu) if you want to register a new API on SmartAPI.
