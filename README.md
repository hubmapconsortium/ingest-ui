# HuBMAP Data Ingest Portal
The HuBMAP Data Ingest Portal contians the web UIs for both the ID System and the Data Ingest tool.  The ID system  

##The UI
The user interface is a web application built with [React](https://reactjs.org/).  It is located in this reposiory in [src/react-app](https://github.com/hubmapconsortium/ingest-ui/tree/master/src/react-app).

## Microservices for HuBMAP Provenance and Metadata
This repository contains the code for several restful microservices related to ingest, data provenance and metadata.

### Data Ingest API
Located in this repository at [src/ingest-api](https://github.com/hubmapconsortium/ingest-ui/tree/master/src/ingest-api), this is a restful web service exposing calls needed for data ingest and the ingest React application.  The API is documented [here](http://smart-api.info/ui/2628cdd76b9994d89ad98ac92a82c18b).

### Metadata API
Located in /src/metadata-api/, this is a collection of Python APIs and a web service used to add, edit and query metadata. This API has been frozen and functionality is being moved to the [HuBMAP Entity API](https://github.com/hubmapconsortium/entity-api) and [Data Ingest API]{(https://github.com/hubmapconsortium/ingest-ui/tree/master/src/ingest-api).

## Specimen API
Located in this repository at [/src/specimen-api/](https://github.com/hubmapconsortium/ingest-ui/tree/master/src/specimen-api), this is a restful web service that is used by the ingest UI to create speciment entities which are associated with tissue and donors as well as the associted meta and provenance data. This API has been frozen and functionality is being moved to the [HuBMAP Entity API](https://github.com/hubmapconsortium/entity-api) and [Data Ingest API]{(https://github.com/hubmapconsortium/ingest-ui/tree/master/src/ingest-api).
