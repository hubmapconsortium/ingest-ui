import React, { useEffect, useState  } from "react";
// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import DonorForm from "./uuid/donor_form_components/donorForm";
import {useNavigate} from "react-router-dom";





export const RenderDonor = (props) => {
  //console.debug("Rendering from NEWER Route, not Legacy Route");
//console.debug("RenderSearchComponent", props);
  let navigate = useNavigate();
  var authSet = JSON.parse(localStorage.getItem("info"));
  var [entity_data, setEntity] = useState(true);
  var [isLoading, setLoading] = useState(true);
  // var [uuid, setUUID] = useState("");
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });

  // Using the Set State here throws us into an Endless re-render :(
  // setUUID(useParams())
  const { uuid } = useParams();
  
  useEffect(() => {
    entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
          if (response.status === 200) {
            setEntity(response.results);
            //console.debug("entity_data", response.results);
            setLoading(false);
          } else {
            passError(response.status, response.message);
          }
        })
        .catch((error) => {
          passError(error.status, error.results.error );
        });
  }, [authSet, uuid]);

  function onUpdated(data){
    //console.debug("onUpdated", data);
  }


  function handleCancel(){
    navigate(-1);  
  };

 function onCreated (data) {
    console.debug('FORMS onCreated:', data);
    if (data["new_samples"]) {  // means that we need to show a larger screen
      this.setState({
        result_dialog_size: "xl"
      });
    }
    this.setState({
      entity: data.entity,
      result: data,
      formType: "----",
      createSuccess: true,
      showSuccessDialog: true
   });
  }

  function passError(status, message) {
   //console.debug("Error", status, message);
    setLoading(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
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
          <DonorForm handleCancel={handleCancel} onCreated={onCreated} editingEntity={entity_data} onUpdated={onUpdated}/>
        </div>
      )
    }
  }
  

