import React, { useEffect, useState  } from "react";
import { entity_api_get_entity_faux} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import {CollectionForm} from "./collections/collections"



export const RenderCollection = (props) => {
  
  // var isNew = props.new;
  var [isNew] = useState(props.new);
  var [entity_data, setEntity] = useState();
  var [isLoadingEntity, setIsLoadingEntity] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });

  useEffect(() => {
   
    if(isNew){
      console.debug("useEffect ISNEW");
      // Passsing an empty entity to be filled might help
      // avoid some undefined errors
      setEntity({
        title:"",
        description:"",
      });
      setIsLoadingEntity(false);
    }else{
      console.debug("useEffect NotNew");
      entity_api_get_entity_faux()
      .then((response) => {
        console.debug("fetchEntity RESP", response);
          setEntity(response.results);
          setIsLoadingEntity(false); 
        })  
        .catch((error) => {
          console.debug("fetchEntity Error", error);
          props.reportError(error);
          setIsLoadingEntity(false);
        }); 
    }
    // console.debug("useEffect",props);
  }, []);

  function onUpdated(data){
    console.debug("onUpdated", data);
  }
  function onCreated (data) {
    console.debug('FORMS onCreated:', data);
  }
  function handleCancel(){
    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };
  function passError(status, message) {
    setErrorHandler({
      status: status,
      message:message,
      isError: true 
    })
  }


  
    if (!isLoadingEntity && errorHandler.isError === true){
      return (
        <div><ErrBox err={errorHandler} /></div>
      );
    }else if (isLoadingEntity) {
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      return (
        <div>
          <CollectionForm 
            // packed={searchWrapper}
            newForm={props.new}
            handleCancel={handleCancel} 
            onCreated={onCreated} 
            onUpdated={onUpdated}
            editingCollection={entity_data} 
            // newForm={false}
            />
        </div>
      )
    }
  }
  

