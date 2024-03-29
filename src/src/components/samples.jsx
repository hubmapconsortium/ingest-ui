import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import { entity_api_get_entity,entity_api_get_entity_ancestor} from '../service/entity_api';
import {ErrBox} from "../utils/ui_elements";
import TissueFormLegacy from "./uuid/tissue_form_components/tissueForm";
import {useNavigate} from "react-router-dom";
export const RenderSample = (props) => {
  console.debug("Rendering from NEWER Route, not Legacy Route");
  // let navigate = useNavigate();
  var authSet = JSON.parse(localStorage.getItem("info"));
  const { uuid } = useParams();
  var navigate = useNavigate();
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
      fetchEntity(uuid, authSet.groups_token);
    }else{
    }
  }, [authSet, uuid, loadFlag]);


  function fetchEntity(uuid, auth){
    entity_api_get_entity(uuid, auth)
      .then((response) => {
          setLoadFlag(true);
          if (response.status === 200) {
            if(response.results.entity_type !=="Sample"){
              navigate("/"+response.results.entity_type+"/"+uuid);
            }else{
              var sample = response.results;
            // console.debug('%c◉ response.result.organ ', 'color:#00ff7b',response.result.organ );
            document.title = ("HuBMAP Ingest Portal | Sample: "+response.results.hubmap_id +"" );
            if (!sample.organ){
              entity_api_get_entity_ancestor(sample.uuid,JSON.parse(localStorage.getItem("info")).groups_token)
              .then((response) => {
                console.debug('%c◉ RESPONSE entity_api_get_entity_ancestor', 'color:#00ff7b', response.results,response.results[0].organ);
                if (response.results[0].organ){
                  sample.organ = response.results[0].organ;
                }
                // console.debug('%c◉ SAMPLE IS NOW  ', 'color:#00ff7b', sample);
                setEntity(sample);
                setLoading(false);
              })
              .catch((error) => {
                passError(error.status, error.results.error );
                setEntity(sample);
                setLoading(false);
              });
            }else{
              setEntity(sample);
                setLoading(false);
            }
            
            }
          } else {  
            passError(response.status, response.message);
          }
        })
        .catch((error) => {
          passError(error.status, error.results.error );
        });
      
  };



  function handleCancel(){
    navigate('/');
    // if(this.props && this.props.handleCancel){
    //  this.props.handleCancel();
    // }else{
    //   window.history.back();
    // }
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
    // Return to home search once finished here
    navigate('../')
  }

  function handleChangeSamplePage(uuid){
    setLoading(true);
    navigate('/sample/'+uuid);
    fetchEntity(uuid, authSet.groups_token);
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
        <TissueFormLegacy 
        handleCancel={handleCancel} 
        uuid={entity_data.uuid} 
        onUpdated={onUpdated} 
        editingEntity={entity_data}
        handleChangeSamplePage={handleChangeSamplePage} />
      </div>
    )
  }
}