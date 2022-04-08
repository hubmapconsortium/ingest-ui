import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import TissueFormLegacy from "./uuid/tissue_form_components/tissueForm";
import {useNavigate} from "react-router-dom";




export const RenderSample = (props) => {
  console.debug("Rendering from NEWER Route, not Legacy Route");
  let navigate = useNavigate();
  var authSet = JSON.parse(localStorage.getItem("info"));
  const { uuid } = useParams();

  var [entity_data, setEntity] = useState(null);
  var [isLoading, setLoading] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });

  console.debug("uuid,", uuid);
  useEffect(() => {
    
    entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
          if (response.status === 200) {
            setEntity(response.results);
            console.debug("entity_data", response.results);
            setLoading(false);
          } else {  
            passError(response.status, response.message);
          }
        })
        .catch((error) => {
          passError(error.status, error.results.error );
        });
  }, [authSet, uuid]);

  function handleCancel(){
    navigate(-1);  
  };


  function passError(status, message) {
   //console.debug("Error", status, message);
    setLoading(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
    }

  function onUpdated(data){
    console.debug("onUpdated", data);
  }


 

  
    if (!isLoading && errorHandler.isError === true){
      return (
        <ErrBox err={errorHandler} />
      );
    }else if (isLoading) {
      console.debug("Samples Loading");
      console.debug(props);
      console.debug(entity_data);
      console.debug(errorHandler);
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      return (
        <div>
          <TissueFormLegacy onCancel={handleCancel} uuid={entity_data.uuid} onUpdated={onUpdated} editingEntity={entity_data} />
        </div>
      )
    }
  }