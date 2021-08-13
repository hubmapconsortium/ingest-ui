# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/). It interacts with the backend APIs (ingest-api and entity-api) to register Donor/Sample/Dataset and makes them searchable (via search-api).

## Overview of tools

- [Nodejs v14 (includes npm)](https://nodejs.org/en/download/)

For docker deployment:

- [Docker Engine](https://docs.docker.com/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Configuration and Installation

Create `.env` file base on `example.env` file in the same `src` directory.

````
npm install
npm start
````

When you're ready to deploy to production, running the following command will create an optimized build of your app in the `build` folder:

````
npm run build
````

## Docker deployment

We have the following 5 deployment environments:

* localhost - all the services will be deployed with docker containers including sample Neo4j and sample MySQL are running on the same localhost listing on different ports, without globus data
* dev - all services except ingest-api will be running on AWS EC2 with SSL certificates, Neo4j and MySQL are dev versions on AWS, and ingest-api(and another nginx) will be running on PSC with domain and globus data
* test - similar to dev with a focus on testing and connects to Neo4j and MySQL test versions of database
* stage - as similar to the production environment as it can be.
* prod - similar to test but for production settings with production versions of Neo4j and MySQL

### Localhost development with other containers

This option allows you to setup all the pieces in a containerized environment with docker and docker-compose. This requires to have the [HuBMAP Gateway](https://github.com/hubmapconsortium/gateway) running locally before starting building this docker compose project. Please follow the [instructions](https://github.com/hubmapconsortium/gateway#workflow-of-setting-up-multiple-hubmap-docker-compose-projects). It also requires the Gateway project to be configured accordingly.

### Remote deployment of ingest UI individually

````
Usage: ./ingest-ui-docker.sh [localhost|dev|test|stage|prod] [check|config|build|start|stop|down]
````
