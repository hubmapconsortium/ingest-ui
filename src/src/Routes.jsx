import {Navigate, Route, Routes} from "react-router-dom";
import Alert from "@mui/material/Alert";

import Login from "./components/ui/login";
import {Search} from "./components/Search";
import {DonorForm} from "./components/forms/Donors";
import {UploadForm} from "./components/forms/Uploads";
import {SampleForm} from "./components/forms/Samples";
import {PublicationForm} from "./components/forms/Publications";
import {DatasetForm} from "./components/forms/Datasets";
import {CollectionForm} from "./components/forms/Collections";
import {EPICollectionForm} from "./components/forms/Epicollections";
import {BulkEntityForm} from "./components/forms/BulkEntity";
import {BulkMetaForm} from "./components/forms/BulkMeta";
import NotFound from "./components/404";
import {EntityRedirectResolver} from "./components/EntityRedirectResolver";

function SearchRoute({onUrlChange}) {
  return <Search urlChange={(event, params, details) => onUrlChange(event, params, details)}/>;
}

export function UnauthenticatedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/*" element={<Login />} />
      <Route path="*" element={<Login />} />
      <Route path="/login" element={<Login />} />
    </Routes>
  );
}

export function UnregisteredRoutes() {
  return (
    <Routes>
      <Route index element={
        <Alert
          variant="filled"
          severity="error">
            You do not have access to the HuBMAP Ingest Registration System.  You can request access by checking the "HuBMAP Data Via Globus" system in your profile. If you continue to have issues and have selected the "HuBMAP Data Via Globus" option make sure you have accepted the invitation to the Globus Group "HuBMAP-Read" or contact the help desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
        </Alert>
      }/>
    </Routes>
  );
}

export function AuthenticatedRoutes({
  onCreated,
  onUpdated,
  onUrlChange,
  reportError,
}) {
  return (
    <Routes>
      <Route index element={<SearchRoute onUrlChange={onUrlChange}/>}/>
      <Route path="/" element={<SearchRoute onUrlChange={onUrlChange}/>}/>
      <Route path="/login" element={<Login />} />
      <Route path="/newSearch" element={<SearchRoute onUrlChange={onUrlChange}/>}/>

      {/* Redirect plural top-level pages to the root Search with entity_type query */}
      <Route path="/donors" element={<Navigate to="/?entity_type=donor" replace />} />
      <Route path="/samples" element={<Navigate to="/?entity_type=sample" replace />} />
      <Route path="/publications" element={<Navigate to="/?entity_type=publication" replace />} />
      <Route path="/collections" element={<Navigate to="/?entity_type=collection" replace />} />
      <Route path="/epicollections" element={<Navigate to="/?entity_type=epicollection" replace />} />
      <Route path="/datasets" element={<Navigate to="/?entity_type=dataset" replace />} />
      <Route path="/uploads" element={<Navigate to="/?entity_type=upload" replace />} />

      <Route path="/new">
        <Route index element={<SearchRoute onUrlChange={onUrlChange}/>}/>
        <Route path="donor" element={<DonorForm onCreated={(response) => onCreated(response)}/>}/>
        <Route path="sample" element={<SampleForm onCreated={(response) => onCreated(response)} /> }/>
        <Route path="publication" element={<PublicationForm onCreated={(response) => onCreated(response)}/>} />
        <Route path="collection" element={<CollectionForm onCreated={(response) => onCreated(response)}/>} />
        <Route path="epicollection" element={<EPICollectionForm onCreated={(response) => onCreated(response)}/>} />
        <Route path="dataset" element={<SearchRoute onUrlChange={onUrlChange}/>}/>
        <Route path="datasetAdmin" element={<DatasetForm onCreated={(response) => onCreated(response)}/>}/>
        <Route path="upload" element={<UploadForm onCreated={(response) => onCreated(response)}/>}/>
        {/* In Develpment here */}
      </Route>

      <Route path="/donor/:uuid" element={<DonorForm onUpdated={(response) => onUpdated(response)}/>} />
      <Route path="/sample/:uuid" element={<SampleForm onUpdated={(response) => onUpdated(response)}/>} />
      <Route path="/dataset/:uuid" element={<DatasetForm onUpdated={(response) => onUpdated(response)}/>} />
      <Route path="/upload/:uuid" element={<UploadForm onUpdated={(response) => onUpdated(response)}/>} />

      <Route path="/publication/:uuid" element={<PublicationForm onUpdated={(response) => onUpdated(response)} />} />
      <Route path="/collection/:uuid" element={<CollectionForm onUpdated={(response) => onUpdated(response)} />} />
      <Route path="/epicollection/:uuid" element={<EPICollectionForm onUpdated={(response) => onUpdated(response)} />} />

      <Route path="/bulk/donors" element={<BulkEntityForm reportError={reportError} bulkType="donor" />} />
      <Route path="/bulk/samples" element={<BulkEntityForm reportError={reportError} bulkType="sample" />} />

      <Route path="/metadata">
        <Route index element={<BulkMetaForm reportError={reportError} type="block" />} />
        <Route path="block" element={<BulkMetaForm reportError={reportError} type="block"/>}/>
        <Route path="section" element={<BulkMetaForm reportError={reportError} type="section"/>}/>
        <Route path="suspension" element={<BulkMetaForm reportError={reportError} type="suspension"/>}/>
      </Route>

      {/* 404 */}
      <Route path="/notFound" element={<NotFound />} />
      <Route path="*" element={<EntityRedirectResolver />} />
    </Routes>
  );
}
