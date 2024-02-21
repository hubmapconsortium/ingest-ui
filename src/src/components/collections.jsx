import React, { useEffect, useState, createContext  } from "react";
import LinearProgress from '@material-ui/core/LinearProgress';
import { useParams } from "react-router-dom";
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import { CollectionForm } from "./collections/collections"
import { ingest_api_allowable_edit_states} from "../service/ingest_api";

export const RenderCollection = (props) => {

  // var isNew = props.new;
  var [isNew] = useState(props.newForm);
  var [authToken] = useState(props.groupsToken);
  var [dataGroups] = useState(props.dataGroups);
  var [entity_data, setEntity] = useState();
  var [isLoadingEntity, setIsLoadingEntity] = useState(true);
  var [permissions, setPermissions] = useState();
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  const uuid = useParams();

  // const reportError = props.reportError;
  // const { firstName, lastName, city } = person;
  // let reportError = ;

  useEffect(() => {
    const entityUUID = uuid.uuid
    var authSet = JSON.parse(localStorage.getItem("info"));
    if (entityUUID) {
      entity_api_get_entity(entityUUID, authSet.groups_token)
      .then((response) => {
        setEntity(response.results);
        setIsLoadingEntity(false); 
        document.title = ("HuBMAP Ingest Portal | Collection: "+response.results.hubmap_id +"" );
      })  
      .catch((error) => {
        setIsLoadingEntity(false);
      }); 
    }else{
      setIsLoadingEntity(false); 
    }
  }, [uuid]);



  var processPlan = (result) => {
    if (isNew) {
      props.onCreated(result)
    } else {
      props.onUpdated(result)
    }
  }

 
    if (!isLoadingEntity && errorHandler.isError === true){
      return (
        <div><ErrBox err={errorHandler} /></div>
      );
    }else if (isLoadingEntity) {
        return (
            <div className="card-body ">
                <LinearProgress />
                <div className="loader">Loading...</div>
          </div>
        );
    }else{
      return (
        <div>
          <CollectionForm 
            // packed={searchWrapper}
            authToken={authToken}
            handleCancel={() => props.handleCancel()} 
            reportError={(err) => props.reportError(err)} 
            // Cleaner if we pass in an On Processed that can do either?
            onProcessed={isNew? props.onCreated : props.onUpdated } 
            editingCollection={entity_data} 
            // writeable={true}
            dataGroups={dataGroups}
            dtl_all={props.dtl_all}
            newForm={ isNew ? true : null}
            />
        </div>
      )
    }
  }
  

