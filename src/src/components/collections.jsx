import React, { useEffect, useState  } from "react";
import { entity_api_get_entity} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import {CollectionForm} from "./collections/collections"


export const RenderCollection = (props) => {
  var [entity_data, setEntity] = useState(false);
  var [isLoading, setLoading] = useState(false);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  
  // Using the Set State here throws us into an Endless re-render :(
    // setUUID(useParams())
    
    // const { uuid } = useParams();
  useEffect(() => {
    console.debug("useEffect",props);
  }, []);

  function onUpdated(data){
    console.debug("onUpdated", data);
  }


  function handleCancel(){
    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };

  function onCreated (data) {
    console.debug('FORMS onCreated:', data);
  }

  function passError(status, message) {
    setLoading(false);
    setErrorHandler({
      status: status,
      message:message,
      isError: true 
    })
  }


  
    if (!isLoading && errorHandler.isError === true){
      return (
        <div><ErrBox err={errorHandler} /></div>
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
          <CollectionForm handleCancel={handleCancel} onCreated={onCreated} editingEntity={entity_data} onUpdated={onUpdated}/>
        </div>
      )
    }
  }
  

