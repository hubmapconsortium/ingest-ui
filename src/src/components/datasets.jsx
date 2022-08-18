import React, { useEffect, useState  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { search_api_get_assay_list} from '../service/search_api';
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


    search_api_get_assay_list({"primary": "false"})
    .then((response) => {
      console.debug("fetchPrimaryDataTypes Response", response);
        let data = response.data;
        // console.debug(d);
        var dt_dict = data.map((value, index) => { return value });
        // console.debug("dt_dict", dt_dict);
        setDataTypeList(dt_dict);
        // setLoading(isLoading++);
        setIsLoadingDTList(false);
    })
    .catch(error => {
      console.debug("fetch DT list Response Error", error);
      passError(error.status, error.response );
    });


    if(!props.new){
      console.debug("!props.new");
      function fetchEntity(authSet){
        entity_api_get_entity(uuid, authSet.groups_token)
          .then((response) => {
              if (response.status === 200) {
                setEntity(response.results);
                setIsLoadingEntity(false); 
                console.debug("fetchEntity Response", response);
                //console.debug("entity_data", response.results);
              }else{
                // setLoading(isLoading--);
                console.debug("Non 200 response!");
                passError(response.status, response.results);
              }
              
            })  
            .catch((error) => {
              setIsLoadingEntity(true);
              console.debug("fetchData Response Error", error);
              passError(error.status, error.response );
            }); 
      };
      fetchEntity(authSet);
    }else{
      // setLoading(isLoading+1);
      setIsLoadingEntity(false);
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
      console.debug(isLoadingDTList, dataTypeList );
      console.debug(isLoadingEntity, entity_data);
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
      console.debug("SM");
      return (
        <div className="card-body ">
          <div className="loader">Loading...</div>
        </div>
      );
    }
  }
  

