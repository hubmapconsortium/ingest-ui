# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/). It contians the web UIs for both the ID System and the Data Ingest tool. The source code is located in this reposiory at `src/ingest-ui`.   

And the backend ingest API is a restful web service exposing calls needed for the ingest UI React application.  The API is documented [here](https://smart-api.info/registry?q=5a6bea1158d2652743c7a201fdb1c44d).

The HuBMAP Data Ingest UI is built using [React.js](https://reactjs.org/), and initialized using [Create React App](https://create-react-app.dev/) tool.

## Build

1. Create `.env` file base on `example.env` file in the same directory.
2. Fill in the environment variables and make sure only staging or production section is enabled. Comment out the other section.
3.

```bash
npm install
npm run build
```

## Debug

1. Add .env.development.local file, and fill in the defined environment variables point to your web services run on your local machine or on development server.


2.

```bash
npm start
```


## Development and deployment environments

We have the following 5 development and deployment environments:

* localhost - all the services will be deployed with docker containers including sample Neo4j and sample MySQL are running on the same localhost listing on different ports, without globus data
* dev - all services except ingest-api will be running on AWS EC2 with SSL certificates, Neo4j and MySQL are dev versions on AWS, and ingest-api(and another nginx) will be running on PSC with domain and globus data
* test - similar to dev with a focus on testing and connects to Neo4j and MySQL test versions of database
* stage - as similar to the production environment as it can be.
* prod - similar to test but for production settings with production versions of Neo4j and MySQL

### Localhost development

This option allows you to setup all the pieces in a containerized environment with docker and docker-compose. This requires to have the [HuBMAP Gateway](https://github.com/hubmapconsortium/gateway) running locally before starting building this docker compose project. Please follow the [instructions](https://github.com/hubmapconsortium/gateway#workflow-of-setting-up-multiple-hubmap-docker-compose-projects). It also requires the Gateway project to be configured accordingly.

### Remote deployment of ingest UI individually

Similar to the ingest-api, just use the `ingest-ui-docker.sh`

````
Usage: ./ingest-ui-docker.sh [localhost|dev|test|stage|prod] [check|config|build|start|stop|down]
````
