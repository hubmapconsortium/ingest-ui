import React, { useEffect, useState  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { search_api_get_assay_list, search_api_get_assay_set } from '../service/search_api';
import DatasetFormLegacy from "./ingest/dataset_edit";
import {useNavigate} from "react-router-dom";




export const RenderDataset = (props) => {
  //console.debug("Rendering from NEWER Route, not Legacy Route");
  //console.debug("RenderSearchComponent", props);

  let navigate = useNavigate();
  var [entity_data, setEntity] = useState(null);
  var [isLoadingEntity, setIsLoadingEntity] = useState(true);
  var [isLoadingDTList, setIsLoadingDTList] = useState(true);
  var [dataTypeList, setDataTypeList] = useState();
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
    var authSet = JSON.parse(localStorage.getItem("info"));
    
    var primary ={primary:false}; 
    // if(props.new){primary={"primary":true} }

    // Datatype might not be a primary one, butif it's not we're disabling the dropdown 
    // so we add that one & it's fine if the other non-primares are secretly in the list or not 
    // search_api_get_assay_list(primary)

    function checkAssayType(dt){
      search_api_get_assay_list()
      .then((response) => {
        let primaries = response.data;
        console.debug("Primaries:", primaries, "dt:", dt);


        if(primaries.includes(dt)){ // Are we primary? 
          console.debug("*************8 PRIMARY DT");
          let data = response.data;
          var dt_dict = data.map((value, index) => { return value })
          setDataTypeList(dt_dict);
          setIsLoadingDTList(false);



        }else{ /// Or not
          console.debug("********* NOT PRIM");
          search_api_get_assay_set() // Getting the full lst now 
          .then((response) => {
            let newList = response.data;
            var new_dict = newList.result.map((value, index) => { return value })
            setDataTypeList(new_dict);
            setIsLoadingDTList(false);
            console.debug("New Dict:", new_dict);
          })
          .catch((error) => {
            console.error(error);
            setIsLoadingDTList(false);
           
          })
        }
          
          
      })
      .catch(error => {
        console.debug("checkAssayType Error", error);
        passError(error.status, error.response );
      });
    }


    function setAssays(scope,dt){
      search_api_get_assay_list(scope)
      .then((response) => {
        console.debug("fetchPrimaryDataTypes Response", response);
          let data = response.data;
          console.debug("fetchPrimaryDataTypes Data", data, typeof data, response);
          // console.debug(d);
          var dt_dict = data.map((value, index) => { return value })
          console.debug("dt_dict", dt_dict);
          setDataTypeList(dt_dict);
          setIsLoadingDTList(false);
      })
      .catch(error => {
        console.debug("fetch DT list Response Error", error);
        passError(error.status, error.response );
        setIsLoadingDTList(false);
      });
    }


    function fetchEntity(authSet){
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
            if (response.status === 200) {
              setEntity(response.results);
              setIsLoadingEntity(false); 
              console.debug("fetchEntity Response", response);
              var checkAssay = response.results.data_types;
              console.debug("checkAssay", checkAssay);
              checkAssayType(checkAssay)
              
            }
            
          })  
          .catch((error) => {
            setIsLoadingEntity(false);
            console.debug("fetchData Response Error", error);
            passError(error.status, error.response );
          }); 
    };


    if(!props.new){
      console.debug("!props.new");
      fetchEntity(authSet);
    }else{
      // setLoading(isLoading+1);
      setIsLoadingEntity(false);
      setAssays(primary);
      console.debug("NEW FORM",props);
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
    console.debug("passError Error", status, message);
    // setIsLoadingEntity(false);
    console.debug("errorHandler", errorHandler);
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
      console.debug("ISLOADING");
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
      console.debug("SM", isLoadingEntity, isLoadingDTList);
      return (
        <div className="card-body ">
          <div className="loader">Loading...</div>
        </div>
      );
    }
  }
  

