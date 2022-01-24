import React, { useEffect, useState  } from "react";

// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import { useParams } from 'react-router-dom';


import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

import { entity_api_get_entity} from '../service/entity_api';
import { ingest_api_allowable_edit_states } from '../service/ingest_api';


import {ErrBox} from "../utils/ui_elements";
import { TissueForm } from "../utils/form_schema";

import DonorForm from "./uuid/tissue_form_components/tissueForm";
import { useNavigate} from "react-router-dom";



function HandleCancel(){
  window.history.back();
}




export const RenderDonor = (props) => {
//console.debug("RenderSearchComponent", props);
  var authSet = JSON.parse(localStorage.getItem("info"));
  var [entity_data, setEntity] = useState(true);
  var [isLoading, setLoading] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  let { uuid } = useParams();

  useEffect(() => {
    fetchData(uuid);
  }, []);


  function passError(status, message) {
   //console.debug("Error", status, message);
    setLoading(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
    }


  function fetchData(uuid){
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
  }
  
    if (!isLoading && errorHandler.isError === true){
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
      return (
        <div>
          <DonorForm HandleCancel={HandleCancel} editingEntity={entity_data} />
        </div>
      )
    }
  }
  
