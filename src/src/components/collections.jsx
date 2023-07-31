import React, { useEffect, useState  } from "react";
import LinearProgress from '@material-ui/core/LinearProgress';
import { useParams } from "react-router-dom";
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import {CollectionForm} from "./collections/collections"
export const RenderCollection = (props) => {
  
  // var isNew = props.new;
  var [isNew] = useState(props.newForm);
  var [entity_data, setEntity] = useState();
  var [isLoadingEntity, setIsLoadingEntity] = useState(true);
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
    console.debug("PARAMS", uuid);
    const entityUUID = uuid.uuid
    // console.debug("Collection WRAPPER uses=effect", uuid);
    // console.debug("Collection WRAPPER uses=effect");
    var authSet = JSON.parse(localStorage.getItem("info"));
    if (entityUUID) {
      console.debug(entityUUID);
      // console.debug("ROUTE UUID",uuid);
      entity_api_get_entity(entityUUID, authSet.groups_token)
      .then((response) => {
        console.debug("fetchEntity RESP", response);
        // var collectionEntity = response.results;
        // collectionEntity["dataset_uuids"] = [ "9c9f27da754e677e7eeede464fd4c97d", "dcdabfcfa50ecab40e1f2955a495f987"]
          setEntity(response.results);
          setIsLoadingEntity(false); 
        })  
        .catch((error) => {
          setIsLoadingEntity(false);
        }); 
    }else{
      setIsLoadingEntity(false); 
    }
      
    // if( !isLoadingEntity ) {
    //     setIsLoadingEntity(false); 
    // }
    // console.debug("useEffect",props);
  }, [uuid]);

  const createNew = (entity) => {
    // To Debug
    console.debug("WAPPER createNew", entity);
    // props.onCreated(entity);
    
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
            handleCancel={() => props.handleCancel()} 
            onCreated={() => createNew()} 
            onUpdated={() => props.onUpdated()}
            editingCollection={entity_data} 
            // writeable={true}
            newForm={ isNew ? true : null}
            />
        </div>
      )
    }
  }
  

