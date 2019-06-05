# Microservices for HuBMAP Provenance and Metadata
This repository contains the code for several restful microservices related to data provenance and metadata.

### UUID service
Located in /uuid-api/, the UUID service is a restful web service used to create and query UUIDs used across HuBMAP.

### Common Auth API
Located in /common-api/, this is a collection of Python APIs used to interface with the Globus Auth system and a few generic helper classes/methods.

### Data Injest API
Located in /datainjest-api/, this is a restful web service exposing calles needed for data injest.

### Metadata API
Located in /metadata-api/, this is a collection of Python APIs and a web service used to add, edit and query metadata.

## Specimen API
Located in /specimen-api/, this is a restful web service that is used by the HuBMAP UUID UI for generating and maintaining UUIDs associated with tissue and donors as well as the associted meta and provenance data.



