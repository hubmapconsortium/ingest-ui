import React, { useEffect, useState, useRef  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { search_api_get_assay_list, search_api_get_assay_set } from '../service/search_api';
import DatasetFormLegacy from "./ingest/dataset_edit";
import {useNavigate} from "react-router-dom";
import { useLocation } from 'react-router'



export const RenderDataset = (props) => {
  //console.debug("Rendering from NEWER Route, not Legacy Route");
  //console.debug("RenderSearchComponent", props);
  const previousValue = useRef(null);
  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(null);
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

  // componentDidUpdate(prevProps) {
  //   // // Typical usage (don't forget to compare props):
  //   // if (this.props.userID !== prevProps.userID) {
  //   //   console.log("componentDidUpdate", this.props.userID, prevProps.userID);
  //   // }
  // }




  var checkAssay = [];
  useEffect(() => {
    
    // console.debug("useEffect", uuid, props);
    var authSet = JSON.parse(localStorage.getItem("info"));
    
  
    function checkAssayType(dtype){
      // console.debug("checkAssayType", dt);
      search_api_get_assay_set("primary")// the list call only gets primaries for now. 
      .then((response) => {
        // console.debug("checkAssayType PRIM", response.data.result);
        let primaries = response.data.result ;
        var primarySet = primaries.map((elt, idx) => {return elt.name});
        var primaryStatus = primarySet.includes(dtype[0])
        setDataTypeList(primaries);
        setDtl_primary(primaries);
        setDtl_status( primarySet.includes(dtype[0]));
        // console.debug("checkAssayType", dtype, dtype[0], primaryStatus, primarySet);
        search_api_get_assay_set()// the list call only gets primaries for now. 
          .then((response) => {
            let allDTs = response.data.result;
            // console.debug("checkkAssayType ALL", allDTs);
            // var allDTSet = new Set(primaries.map((elt, idx) => {return elt.name}));
            setDtl_all(allDTs);
            // setDataTypeList(allDTs);
            setIsLoadingDTList(false);
          })
          .catch(error => {
            console.debug("checkAssayType Error", error);
            passError(error.status, error.response );
          });
      })
      .catch(error => {
        console.debug("checkAssayType Primary Error", error);
        passError(error.status, error.response );
      });
    }


    function fetchEntity(authSet){
      // console.log("fetchEntity", uuid);
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
          console.debug("fetchEntity RESP", response);
            if (response.status === 200) {
              setEntity(response.results);
              // console.debug("fetchEntity", response.results);
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
      // console.debug("props.new", props.new);
      fetchEntity(authSet);
    }else{
      // the NEW route loads the forms through the legacy Forms loader,
      // not here
      // console.debug("props.new", props.new);
      // setLoading(isLoading+1);
      setIsLoadingEntity(false);
      // setAssays("primary");
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
    //console.debug("onUpdated", data);
    navigate('../')
  }

  
  
  function passError(status, message) {
    // console.debug("passError Error", status, message);
    // setIsLoadingEntity(false);
    setErrorHandler({
      status: status,
      message:message,
      isError: true 
    })
  }
  
  
    // if (!isLoading && errorHandler.isError === true){
    // if (!isLoading && errorHandler.isError === true){
    //   console.error("ERR HANDLER ", errorHandler);
    //   // @TODO dont duplicate this use of the dataset form import, 
    //   return (
    //     <>
    //       <div>
    //         <DatasetFormLegacy 
    //         onUpdated={onUpdated} 
    //         handleCancel={handleCancel} 
    //         editingDataset={entity_data} 
    //         passError={passError} 
    //         dataTypeList={dataTypeList} 
    //         />

    //       </div>
    //       {/* <ErrBox err={errorHandler} /> */}
    //     </>
    //   );
    // }else 
    if (!isLoadingEntity && !isLoadingDTList ) {
      // console.debug(isLoadingDTList, dataTypeList );
      // console.debug(isLoadingEntity, entity_data);
      // console.debug("BG");
      // console.debug("DTLIST", this.props.dataTypeList);
      //console.debug("!isLoading", !isLoading, "errorHandler", errorHandler);
      console.debug("Loaded!", dtl_status, dtl_primary, dtl_all);
      return ( 
        <div>
          <DatasetFormLegacy 
          onUpdated={onUpdated} 
          handleCancel={handleCancel} 
          editingDataset={entity_data} 
          passError={passError} 
          dataTypeList={dataTypeList} 
          dtl_primary={dtl_primary} 
          dtl_all={dtl_all} 
          dtl_status={dtl_status} 
          />
        </div>
      )
    }else{
      // console.debug("ISLOADING");
      return (
        <div className="card-body ">
          <div className="loader">Loading...</div>
        </div>
      );
    }
  }
  

