import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import TissueFormLegacy from "./uuid/tissue_form_components/tissueForm";
// import {useNavigate} from "react-router-dom";




export const RenderSample = (props) => {
  console.debug("Rendering from NEWER Route, not Legacy Route");
  // let navigate = useNavigate();
  var authSet = JSON.parse(localStorage.getItem("info"));
  const { uuid } = useParams();
  // console.debug("uuid,", uuid);
  var [entity_data, setEntity] = useState(null);
  var [isLoading, setLoading] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  })

  //@TODO: Figure out Why The Samples Pages re-polls for the UUID here and not on other entity Types
  // & address Underlying issue instead of using this Bandage 
  var [loadFlag, setLoadFlag] = useState(false);


  useEffect(() => {
    if(loadFlag === false){ //@TODO: See Coments At loadFlag Definition
      entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
          setLoadFlag(true);
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
    }else{
      console.debug("Loadflag True");
    }
    
  }, [authSet, uuid, loadFlag]);

  function handleCancel(){
    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
    // console.debug(this.props);
    // console.debug("Props On Cancel");
    // // window.history.back();  
    // // navigate(-1,  {replace: true});  
    // window.history.back()
  };


  function passError(status, message) {
    console.debug("Error", status, message);
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
          <TissueFormLegacy handleCancel={handleCancel} uuid={entity_data.uuid} onUpdated={onUpdated} editingEntity={entity_data} />
        </div>
      )
    }
  }