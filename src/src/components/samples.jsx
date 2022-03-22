import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import TissueFormLegacy from "./uuid/tissue_form_components/tissueForm";
import {useNavigate} from "react-router-dom";




export const RenderSample = (props) => {
  console.debug("Rendering from NEWER Route, not Legacy Route");
  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(null);
  // var [uuid, setUUID] = useState("");
  var [isLoading, setLoading] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });

  // Using the Set State here throws us into an Endless re-render :(
  // setUUID(useParams())
  const { uuid } = useParams();

  console.debug("uuid,", uuid);
  useEffect(() => {
    console.debug("ise Effect");
    if(!localStorage.getItem("info")){
      // the app.js should reload on missing/outdated Info item
    }else{
    
    entity_api_get_entity(uuid,  JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        console.debug("response", response);
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
      }
  }, [uuid]);

  function HandleCancel(){
    navigate(-1);  
  };


  function passError(status, message) {
    console.debug("passError Error ", status, message);
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
          <TissueFormLegacy onCancel={HandleCancel} uuid={entity_data.uuid} onUpdated={onUpdated} editingEntity={entity_data} />
        </div>
      )
    }
  }