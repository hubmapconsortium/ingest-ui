import React, { useEffect, useState  } from "react";

// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import EditUploads from "./uploads/editUploads";
import {useNavigate} from "react-router-dom";




export const RenderUpload = (props) => {

  // console.debug("Rendering from NEWER Route, not Legacy Route");
  // console.debug("RenderUpload", props);
  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(true);
  var [isLoading, setLoading] = useState(true);
  // var [uuid, setUUID] = useState("");
  var [errorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });


  // Using the Set State here throws us into an Endless re-render :(
  // setUUID(useParams())
  const { uuid } = useParams();

  useEffect(() => {
    console.debug("USEEFFECT");
    entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        console.debug(response);
          if (response.status === 200) {
            setEntity(response.results);
            console.debug("entity_data", response.results);
            setLoading(false);
          }else{
            console.debug(response.status, response.results.error);
            // passError(response.status, response.results.error );
          }
        })
        .catch((error) => {
          console.debug(error);
          // passError(error.status, error.results.error );
        });
  },  [uuid]);


  function handleCancel(){
    // this.props.handleCancel();
    window.history.back()
  }

  function onUpdated(data){
    console.debug("onUpdated", data);
    navigate('../')
  
  }
  



  // function passError(status, message) {
  //  //console.debug("Error", status, message);
  //   setLoading(false);
  //   setErrorHandler({
  //       status: status,
  //       message:message,
  //       isError: true 
  //     })
  //   }

    if (!isLoading && errorHandler.isError === true){
      console.debug("errorHandler", errorHandler);
      return (
        <ErrBox err={errorHandler} />
      );
    }else if (isLoading) {
      console.debug("IS LOADING");
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      console.debug("LOADED",entity_data );
      return (
        <div>
          <EditUploads handleCancel={handleCancel} editingUpload={entity_data} onUpdated={onUpdated}/>
        </div>
      )
    }
  }
  

