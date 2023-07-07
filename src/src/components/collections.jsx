import React, { useEffect, useState  } from "react";
import { useParams } from "react-router-dom";
import { entity_api_get_entity} from '../service/entity_api';
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
  const routeParams = useParams();
  let propValues = props;

  useEffect(() => {
    console.debug("Collection WRAPPER uses=effect");
    var authSet = JSON.parse(localStorage.getItem("info"));
    if(!propValues.new){
      var uuid = routeParams.uuid;
      console.debug("useEffect NotNew");
      entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
        console.debug("fetchEntity RESP", response);
        var collectionEntity = response.results;
        // collectionEntity["dataset_uuids"] = [ "9c9f27da754e677e7eeede464fd4c97d", "dcdabfcfa50ecab40e1f2955a495f987"]
          setEntity(response.results);
          setIsLoadingEntity(false); 
        })  
        .catch((error) => {
          console.debug("fetchEntity Error", error);
          // props.reportError(error);
          setIsLoadingEntity(false);
        }); 
    }else{
      setIsLoadingEntity(false); 
    }
    // console.debug("useEffect",props);
  }, [propValues,routeParams]);


  function onUpdated(data){
    console.debug("onUpdated", data);
  }
  function onCreated (reaponse) {
    console.debug('WRAPPER onCreated:', reaponse);
    // window.history.pushState(
    //     null,
    //     "", 
    //     "/collection/"+data.uuid);
  }
  function handleCancel(){
    window.history.back();
    // if(this.props && this.props.handleCancel){
    //   // How is this happening???
    //  this.props.handleCancel();
    // }else{
    //   window.history.back();
    // }
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
            handleCancel={() => handleCancel()} 
            onCreated={() => onCreated()} 
            onUpdated={() => onUpdated()}
            editingCollection={entity_data} 
            writeable={true}
            // newForm={false}
            />
        </div>
      )
    }
  }
  

