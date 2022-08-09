# HuBMAP Data Ingest Portal

The HuBMAP Data Ingest Portal UI is a web application built with [React](https://reactjs.org/) on [Nodejs v14 (includes npm)](https://nodejs.org/en/download/). It interacts with the backend APIs (ingest-api, entity-api, and search-api) to register Donor/Sample/Dataset/Upload and makes them searchable (via search-api).

## Configuration and local development

Create `.env` file base on `example.env` file in the same `src` directory.

````
npm install
npm start
````

Running the following command will create an optimized static build of your app in the `build` folder:

````
npm run build
````

## Docker build for DEV development

There are a few configurable environment variables to keep in mind:

- `HOST_UID`: the user id on the host machine to be mapped to the container. Default to 1000 if not set or null.
- `HOST_GID`: the user's group id on the host machine to be mapped to the container. Default to 1000 if not set or null.

```
cd docker
./docker-development.sh [check|config|build|start|stop|down]
```

## Docker build for deployment on TEST/STAGE/PROD

```
cd docker
docker pull hubmap/ingest-ui:2.3.0 (replace with the actual released version number)
./docker-deployment.sh [start|stop|down]
```
