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
    
  
    function checkAssayType(dt){
      // console.debug("checkAssayType", dt);
      search_api_get_assay_list()// the list call only gets primaries for now. 
      .then((response) => {
        let primaries = response.data;
        // console.debug("primaries", primaries, primaries.length);
        // const data_type_options = new Set(primaries.map((elt, idx) => {return elt.name.toLowerCase()}));
        const data_type_options = new Set(primaries.map((elt, idx) => {return elt.name}));
        var isPrim = data_type_options.has(dt[0]);
        // console.debug("data_type_options", data_type_options, dt, isPrim);
        // console.debug(dt);
        // console.debug("isPrim", isPrim);
        if(isPrim){ // Are we primary? 
          let data = response.data;
          var dt_dict = data.map((value, index) => { return value })
          setDataTypeList(dt_dict);
          setIsLoadingDTList(false);
        }else{ /// Or not
          search_api_get_assay_set() // Getting the full lst now 
          .then((response) => {
            let newList = response.data;
            var new_dict = newList.result.map((value, index) => { return value })
            setDataTypeList(new_dict);
            setIsLoadingDTList(false);
          })
          .catch((error) => {
            console.error(error);
          })
        }
      })
      .catch(error => {
        // console.debug("checkAssayType Error", error);
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
              checkAssay = response.results.data_types;
              setEntityDT(checkAssay);
              checkAssayType(checkAssay)
              // console.log("entity_data", entity_data.data_types);
              // previousValue.current = entity_data.data_types;
              // if(entity_data.data_types !== previousValue.current){
              //   // previousValue.current = entity_data.data_types;
              //   console.log("previousValue.current", entity_data.data_type, previousValue.current);
              //   // checkAssayType(checkAssay)

              // }
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
      // console.debug("props.new", props.new);
      // setLoading(isLoading+1);
      setIsLoadingEntity(false);
      // setAssays("primary");
    }
    
   

  }, [uuid, props]);
  

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
      return ( 
        <div>
          <DatasetFormLegacy 
          onUpdated={onUpdated} 
          handleCancel={handleCancel} 
          editingDataset={entity_data} 
          passError={passError} 
          dataTypeList={dataTypeList} 
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
  

