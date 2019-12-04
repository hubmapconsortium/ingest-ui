# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/). It contians the web UIs for both the ID System and the Data Ingest tool. The source code is located in this reposiory at `src/ingest-ui`.   

And the backend ingest API is located in this repository at `src/ingest-api`, this is a restful web service exposing calls needed for the ingest UI React application.  The API is documented [here](http://smart-api.info/ui/2628cdd76b9994d89ad98ac92a82c18b).

## Deploy with other HuBMAP docker compose projects

### Local dev deployment

This option allows you to setup all the pieces in a containerized environment with docker and docker-compose. This requires to have the [HuBMAP Gateway](https://github.com/hubmapconsortium/gateway) running locally before starting building the Entity API docker compose project. Please follow the [instructions](https://github.com/hubmapconsortium/gateway#workflow-of-setting-up-multiple-hubmap-docker-compose-projects). It also requires the Gateway project to be configured accordingly.

### Testing and Production deployment

In local development mode, all the docker containers are running on the same host machine. However, the ingest-api will be deployed on a separare host machine for testing and production due to different deployment requirements. 

To build the docker image of ingest-api on that separate machine, you'll first need to Git clone the source code of this repo and change directory to the project root.

````
cd docker
./docker-setup-ingest-api.test.sh
sudo docker-compose -f docker-compose-ingest-api.test.yml build
````

To start up the containers:

````
sudo docker-compose -p ingest-api -f docker-compose-ingest-api.test.yml up -d
````

Note: here we specify the docker compose project with the `-p` to avoid "WARNING: Found orphan containers ..." due to the fact that docker compose uses the directory name as the default project name.

Note: for production deployment, use `docker-setup-ingest-api.prod.sh` and also change to `docker-compose-ingest-api.prod.yml` in the above commands.

