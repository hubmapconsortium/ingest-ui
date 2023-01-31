import React, { useEffect, useState, useRef  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { search_api_get_assay_list, search_api_get_assay_set } from '../service/search_api';
import DatasetFormLegacy from "./ingest/dataset_edit";
import {useNavigate} from "react-router-dom";
import { useLocation } from 'react-router'



import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Result from "./uuid/result";


export const RenderDataset = (props) => {
  const previousValue = useRef(null);
  let navigate = useNavigate();

  var [newEntity, setNewEntity] = useState(null);
  var [newResult, setNewResult] = useState(null);
  var [newVersionShow, setNewVersionShow] = useState(false);
  var [globusLink, setGlobusLink] = useState(null);

  var [entity_data, setEntity] = useState(null);
  var [authToken, setAuthToken] = useState(null);
  var [entityDT, setEntityDT] = useState([""]);
  var [dtl_all, setDtl_all] = useState([""]);
  var [dtl_primary, setDtl_primary] = useState([""]);
  var [dtl_status, setDtl_status] = useState([""]);
  var [isLoadingEntity, setIsLoadingEntity] = useState(true);
  var [isLoadingDTList, setIsLoadingDTList] = useState(true);
  var [dataTypeList, setDataTypeList] = useState();
  // var [uuid, setUUID] = useState("");
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });

  const location = useLocation()
  // Using the Set State here throws us into an Endless re-render :(
  // setUUID(useParams())
  const { uuid } = useParams();


  var checkAssay = [];
  useEffect(() => {
    
    var authSet = JSON.parse(localStorage.getItem("info"));
    setAuthToken(authSet);
  
    function checkAssayType(dtype){
      search_api_get_assay_set("primary")// the list call only gets primaries for now. 
      .then((response) => {
        let primaries = response.data.result ;
        var primarySet = primaries.map((elt, idx) => {return elt.name});
        var primaryStatus = primarySet.includes(dtype[0])
        setDataTypeList(primaries);
        setDtl_primary(primaries);
        setDtl_status( primarySet.includes(dtype[0]));
        search_api_get_assay_set()// the list call only gets primaries for now. 
          .then((response) => {
            let allDTs = response.data.result;
            setDtl_all(allDTs);
            setIsLoadingDTList(false);
          })
          .catch(error => {
            console.debug("checkAssayType Error", error);
            props.reportError(error.status, error.response );
          });
      })
      .catch(error => {
        console.debug("checkAssayType Primary Error", error);
        reportError(error.status, error.response );
      });
    }


    function fetchEntity(authSet){
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
          console.debug("fetchEntity RESP", response);
            if (response.status === 200) {
              setEntity(response.results);
              setIsLoadingEntity(false); 
              var checkAssay = response.results.data_types;
              checkAssayType(checkAssay)
            }
            
          })  
          .catch((error) => {
            setIsLoadingEntity(false);
          }); 
    };


    if(!props.new){
     
      fetchEntity(authSet);
    }else{
      // the NEW route loads the forms through the legacy Forms loader,
      // not here
      setIsLoadingEntity(false);
    }
    
   

  }, [uuid]);
  

  function handleCancel(){

    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };

  function onUpdated(data){
    // Return to home search once finished here
    navigate('../')
  }

  function onClose(data){
    navigate("/");  
}

  function onCreated(data) {
    // @TODO: Originally lived in the Forms wrapper which wrapped all New forms
    // New Versioning uses the Edit view, however. We need to eventually unwrap 
    // all the NEW form wrapping stuff
      console.debug(' onCreated:', data);
      setNewEntity(data.entity);
      setNewResult(data);
      setGlobusLink(data.globus_path);
      setNewVersionShow(true);
     
  }

  function onChangeGlobusLink(newLink, newDataset) {
    console.debug(newDataset, newLink)
    const {name, display_doi, doi} = newDataset;
  }

  function renderSuccessDialog(){
    if (newVersionShow) {
      return (
        <Dialog aria-labelledby="result-dialog" open={newVersionShow} maxWidth="xs">
        <DialogContent>
        <Result
          result={newResult}
          onReturn={onClose}
          handleCancel={handleCancel}
          entity={newEntity}
        />
        </DialogContent>
        </Dialog>
      );
    }
  }
  
  function passError(status, message) {
    setErrorHandler({
      status: status,
      message:message,
      isError: true 
    })
  }
  
  
    if (!isLoadingEntity && !isLoadingDTList ) {
      console.debug("Loaded!", dtl_status, dtl_primary, dtl_all);
      return ( 
        <div>
          {renderSuccessDialog()}
          <DatasetFormLegacy 
          authToken={authToken}
          changeLink={onChangeGlobusLink}
          onUpdated={onUpdated} 
          onCreated={onCreated}
          handleCancel={handleCancel} 
          editingDataset={entity_data} 
          reportError={props.reportError} 
          dataTypeList={dataTypeList} 
          dtl_primary={dtl_primary} 
          dtl_all={dtl_all} 
          dtl_status={dtl_status} 
          />
        </div>
      )
    }else{
      return (
        <div className="card-body ">
          <div className="loader">Loading...</div>
        </div>
      );
    }
  }
  

