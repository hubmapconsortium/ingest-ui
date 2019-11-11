# HuBMAP Data Ingest UI

The HuBMAP Data Ingest UI is built using [React.js](https://reactjs.org/), and initialized using [Create React App](https://create-react-app.dev/) tool.

## Project structure

```bash
/react-app/src/
|--components
|   |--ingest
|   |   |--createCollectionsModal.jsx # add new collectino modal
|   |   |--datalist.jsx # main list of datasets
|   |   |--dataset_edit.jsx # dataset form
|   |   |--filter.jsx # filter bar of datasets list
|   |   |--ingest_entrance.jsx # data ingest main entrance
|   |--uuid
|   |   |--donor_form_components
|   |   |   |--donorForm.jsx # donor form
|   |   |   |--imageUpload.jsx # multiple image files upload for donor form and tissue sample form
|   |   |--tissue_form_components
|   |   |   |--idSearchModal.jsx # look up source uuid modal for tissue sample form and dataset form
|   |   |   |--protocol.jsx # mutilple protocols for tissue sample form
|   |   |   |--tissueForm.jsx # tissue sample form
|   |   |--entityList.jsx # main list of entity Ids
|   |   |--forms.jsx
|   |   |--groupModal.jsx
|   |   |--HIPPA.jsx # 18 identifiers specifed by HIPPA pop up
|   |   |--intro.jsx
|   |   |--login.jsx
|   |   |--metadataUpload.jsx # mutilple metadata files upload for donor form and tissue sample form
|   |   |--purposeQuestion.jsx
|   |   |--result.jsx # result page after create donor or tissue sample
|   |   |--selectGroup.jsx # group select popup
|   |   |--uuid_entrance.jsx # main entrance of UUID system
|--utils
|   |--constants_helper.jsx
|   |--file_helper.jsx
|   |--string_helper.jsx
|   |--validators.jsx
|--constants.jsx # constants includeing SESSION_TIMEOUT_IDLE_TIME, SAMPLE_TYPES, ORGAN_TYPES
|--App.js  # main entrance of the react app
```

## Build

1. Add .env.production.local file base on .env.production.local.example file in the same directory.
2. Fill in the environment variables and make sure only staging or production section is enabled. Comment out the other section.
3. cd in to /ingest-ui/src/react-app/
4.

```bash
npm run build
```

## Debug

1. Add .env.development.local file, and fill in the following environment variables point to your web services run on your local machine or on development server.

```
REACT_APP_BACKEND_URL = 'http://localhost:5000'
REACT_APP_SPECIMEN_API_URL = 'http://localhost:5004'
REACT_APP_METADATA_API_URL = 'http://localhost:5002'
REACT_APP_URL = 'http://localhost:3000'
REACT_APP_PROFILE_URL = 'https://profile.dev.hubmapconsortium.org'
REACT_APP_DATAINGEST_API_URL = 'http://localhost:5005'
REACT_APP_READ_ONLY_GROUP_ID = '5777527e-ec11-11e8-ab41-0af86edb4424'
```

2.

```bash
npm start
```
