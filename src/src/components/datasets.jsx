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
  var [isLoading, setLoading] = useState(true);
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


    search_api_get_assay_list({"primary": "true"})
    .then((response) => {
      // console.debug("fetchPrimaryDataTypes Response", response);
        let data = response.data;
        var dt_dict = data.result.map((value, index) => { return value });
        // console.debug("dt_dict", dt_dict);
        setDataTypeList(dt_dict);
        setLoading(isLoading++);
    })
    .catch(error => {
      // console.debug("fetch DT list Response Error", error);
      passError(error.status, error.response );
    });


    if(!props.new){
      console.debug("!props.new");
      function fetchEntity(authSet){
        entity_api_get_entity(uuid, authSet.groups_token)
          .then((response) => {
              if (response.status === 200) {
                setEntity(response.results);
                setLoading(isLoading++); 
                console.debug("fetchEntity Response", response);
                //console.debug("entity_data", response.results);
              }else{
                setLoading(isLoading--);
                console.debug("Non 200 response!");
                passError(response.status, response.results);
              }
              
            })  
            .catch((error) => {
              setLoading(isLoading--);
              console.debug("fetchData Response Error", error);
              passError(error.status, error.response );
            }); 
      };
      fetchEntity(authSet);
    }else{
      setLoading(isLoading+1);
      console.debug("NEW FORM",props);
    }


  }, [uuid]);

  function handleCancel(){
    // React wants to simply scroll to the top of the page if we use -1
    navigate(-2);  
  };

  function onUpdated(data){
    // Return to home search once finished here
    //console.debug("onUpdated", data);
    navigate('../')
  }



  function passError(status, message) {
    console.debug("passError Error", status, message);
    setLoading(false);
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
    console.debug(isLoading);
    if (isLoading <=3) {
      console.debug("SM");
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      console.debug("BG");
      console.debug("DTLIST", this.props.dataTypeList);
      //console.debug("!isLoading", !isLoading, "errorHandler", errorHandler);
      return (
        <div>
          <DatasetFormLegacy 
          onUpdated={onUpdated} 
          handleCancel={handleCancel} 
          editingDataset={entity_data} 
          passError={passError} 
          dataTypeList={this.props.dataTypeList} 
          />
        </div>
      )
    }
  }
  

