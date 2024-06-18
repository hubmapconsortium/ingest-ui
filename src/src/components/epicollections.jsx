import React, { useEffect, useState, createContext  } from "react";
import LinearProgress from '@material-ui/core/LinearProgress';
import { useParams } from "react-router-dom";
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import { EPICollectionForm } from "./collections/epicollections"
import { ingest_api_allowable_edit_states} from "../service/ingest_api";
import {useNavigate} from "react-router-dom";

export const RenderEPICollection = (props) => {
  let navigate = useNavigate();
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
  const newForm = props.newForm ? props.newForm : "";

  // const reportError = props.reportError;
  // const { firstName, lastName, city } = person;
  // let reportError = ;

  useEffect(() => {
    if (!newForm && uuid) {
      const entityUUID = uuid.uuid
      var authSet = JSON.parse(localStorage.getItem("info"));
      console.debug('%c◉ entityUUID ', 'color:#00ff7b', entityUUID);
      entity_api_get_entity(entityUUID, authSet.groups_token)
      .then((response) => {
        console.debug('%c◉ response ', 'color:#00ff7b', response);
        if (response.status === 200) {
          if(response.results.entity_type !== "Collection"){
            navigate("/"+response.results.entity_type+"/"+uuid);
          }else{
            // Converting the datasets field to a more general 
            // Associations field, for eventual flexability
            var collection = response.results;
            if(collection.datasets){collection.associations = collection.datasets};
            setEntity(collection);
            setIsLoadingEntity(false);
            document.title = ("HuBMAP Ingest Portal | Collection: "+response.results.hubmap_id +"" );
          }
        } else {
          console.debug("entity_api_get_entity RESP NOT 200", response.status, response);
          passError(response.status, response.message);
        }
      })
      .catch((error) => {
        console.debug("entity_api_get_entity ERROR", error);
        passError(error.status, error.results.error );
      })
    }else if(newForm && newForm === true){
      setIsLoadingEntity(false);
    }
  }, [uuid,newForm]);

  // @TODO: Dry up, unify error passing 
  function passError(status, message) {
    setIsLoadingEntity(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
    }


  
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
          <EPICollectionForm 
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
  

