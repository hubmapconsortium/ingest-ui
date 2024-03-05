import React, { useEffect, useState  } from "react";

// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import EditUploads from "./uploads/editUploads";
import {useNavigate} from "react-router-dom";




export const RenderUpload = (props) => {

  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(true);
  var [isLoading, setLoading] = useState(true);
  var [errorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });


  // Using the Set State here throws us into an Endless re-render :(
  // setUUID(useParams())
  const { uuid } = useParams();

  useEffect(() => {
    entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
          if (response.status === 200) {
            if(response.results.entity_type !== "Upload"){
              navigate("/"+response.results.entity_type+"/"+uuid);
            }else{
              setEntity(response.results);
              setLoading(false);
            }
          }else{
            console.error(response.status, response.results.error);
            return(response.status, response.results.error );
          }
        })
        .catch((error) => {
          console.error(error);
          return(error.status, error.results.error );
        });
  },  [uuid]);


  function handleCancel(){
    window.history.back()
  }

  function onUpdated(data){
    console.debug("onUpdated", data);
    navigate('../')
  
  }
  

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
    return (
      <div>
        <EditUploads handleCancel={handleCancel} editingUpload={entity_data} onUpdated={onUpdated} allGroups={props.allGroups}/>
      </div>
    )
  }
}
  

