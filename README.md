# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/) on [Nodejs v14 (includes npm)](https://nodejs.org/en/download/). It interacts with the backend APIs (ingest-api, entity-api, and search-api) to register Donor/Sample/Dataset/Upload and makes them searchable (via search-api).

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

For docker deployment, you'll need to have Docker Engine and Docker Compose installed.

````
Usage: ./ingest-ui-docker.sh [localhost|dev|test|stage|prod] [check|config|build|start|stop|down]
````
