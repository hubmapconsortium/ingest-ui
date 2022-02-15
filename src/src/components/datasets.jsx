import React, { useEffect, useState  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import DatasetFormLegacy from "./ingest/dataset_edit";
import {useNavigate} from "react-router-dom";





export const RenderDataset = (props) => {
  console.debug("Rendering from NEWER Route, not Legacy Route");
  //console.debug("RenderSearchComponent", props);

  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(true);
  var [isLoading, setLoading] = useState(true);
  var [uuid, setUUID] = useState("");
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });


  setUUID(useParams())
  useEffect(() => {
    var authSet = JSON.parse(localStorage.getItem("info"));
    entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
          if (response.status === 200) {
            setEntity(response.results);
            console.debug("entity_data", response.results);
            setLoading(false);
          }else{
            console.debug("Response not 200 Error", response);
            setLoading(true); //@TODO: lets flip the error display up here instead 
            passError(response.status, response.results);
          }
        })
        .catch((error) => {
          console.debug("fetchData Response Error", error);
          passError(error.status, error.response );
        });

  }, [uuid]);


  function HandleCancel(){
    navigate(-1);  
  };

  function onUpdated(data){
    console.debug("onUpdated", data);
  }



  function passError(status, message) {
    console.debug("passError Error", status, message);
    setLoading(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
    }

    if (!isLoading && errorHandler.isError === true){
      console.debug("ERR HANDLER ", errorHandler);
      return (
        <ErrBox err={errorHandler} />
      );
    }else if (isLoading) {
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      console.debug("!isLoading", !isLoading, "errorHandler", errorHandler);
      return (
        <div>
          <DatasetFormLegacy onUpdated={onUpdated} HandleCancel={HandleCancel} editingDataset={entity_data} />
        </div>
      )
    }
  }
  

