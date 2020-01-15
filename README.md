# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/). It contians the web UIs for both the ID System and the Data Ingest tool. The source code is located in this reposiory at `src/ingest-ui`.   

And the backend ingest API is located in this repository at `src/ingest-api`, this is a restful web service exposing calls needed for the ingest UI React application.  The API is documented [here](http://smart-api.info/ui/2628cdd76b9994d89ad98ac92a82c18b).

## Development and deployment environments

We have the following 4 development and deployment environments:

* local - all the containers are running on the same localhost listing on different ports, without globus data
* dev - similar to local, but on AWS EC2 instance with domains, with globus data
* test - ingest-api and ingest-pipeline are running on the same AWS VM (with globus data), the rest APIs on another VM
* prod - similar to test but for production settings

### Local development

This option allows you to setup all the pieces in a containerized environment with docker and docker-compose. This requires to have the [HuBMAP Gateway](https://github.com/hubmapconsortium/gateway) running locally before starting building this docker compose project. Please follow the [instructions](https://github.com/hubmapconsortium/gateway#workflow-of-setting-up-multiple-hubmap-docker-compose-projects). It also requires the Gateway project to be configured accordingly.

### Deployment on dev

The deployment on dev server is similar to local development, which all the containers are running on the same host machine.

### Deployment on test and prod

In local and dev mode, all the docker containers are running on the same host machine. However, the ingest-api will be deployed on a separare host machine for testing and production due to different deployment requirements. 

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

