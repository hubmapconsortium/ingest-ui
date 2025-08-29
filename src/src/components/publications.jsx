import React, { useEffect, useState, useRef  } from "react";
import { useParams }from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { ubkg_api_get_dataset_type_set } from "../service/ubkg_api";
import PublicationFormLegacy from "./ingest/publications_edit";
import {useNavigate} from "react-router-dom";
import { useLocation } from 'react-router'

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import ResultLegacy from "./uuid/result";

// !!! Deprecated & succedded by newPublication.jsx

/*
title: string, required-- this overrides the title field in Dataset which is auto-calculated
  The title of the paper
publication_date: date, required
  The date of publication
publication_doi: string as standard DOI format (##.#####/[alpha-numberic-string]), not-required
  The DOI of the publication
publication_url: string as standard URL format (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]), required
  The URL at the publishers server for print/pre-print
publication_venue, string, required
  The venue of the publication, journal, conference, preprint server, etc...
volume, integer, not-required
  The volume number of a journal that it was published in
issue, integer, not-required
  The issue number of the journal that it was published in
pages_or_article_num, string, e.g., “23”, “23-49”, “e1003424”, not-required
  The pages or the aricle number in the publication journal
publication_status, boolean, required
  A boolean representing if the publication has been published yet or not.  (Published in the target/venue journal/proceeding/etc.. NOT published in the sense of Dataset publication)
*/


export const RenderPublication = (props) => {
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
  var [isLoadingDTList, setIsLoadingDTList] = useState(1);
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
      // These'll likely be changing and it's causing off behavior for publications
      //  // Nuking for now
      // Just swap for the new dataset types call

      // ubkg_api_get_assay_type_set("primary")// the list call only gets primaries for now.
      ubkg_api_get_dataset_type_set()
      .then((response) => {
        console.debug("checkAssayType Primary", response);
        setDataTypeList(response);
        setDtl_primary(response);
        setDtl_all(response);
        setDtl_status(true);
        setIsLoadingDTList(0);
      }) 
      .catch(error => {
        console.debug("checkAssayType Primary Error", error);
        reportError(error );
      });
    }
    


    function fetchEntity(authSet){
      console.debug("fetchEntity", uuid, authSet.groups_token);
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
          console.debug("fetchEntity RESP", response);
            if (response.status === 200) {
              if(response.results.entity_type !== "Publication"){
                navigate("/"+response.results.entity_type+"/"+uuid);
              }else{
                var newEnt = response.results;
                // delete newEnt.next_revision_uuids;
                // If we have versions in original single string format,
                // lets bundle into an array
                // if(newEnt.next_revision_uuid && ! newEnt.next_revision_uuids){newEnt.next_revision_uuids = [newEnt.next_revision_uuid]}
                // if(newEnt.previous_revision_uuid && ! newEnt.previous_revision_uuids){newEnt.previous_revision_uuids = [newEnt.previous_revision_uuid]}
                setEntity(newEnt);
                setIsLoadingEntity(false); 
                document.title = ("HuBMAP Ingest Portal | Publication: "+response.results.hubmap_id +"" );
                var checkAssay = response.results.data_types;
                checkAssayType(checkAssay)
              }
            }else{
              console.debug("NON 200",  response.status, response.data);
              passError(response.status, response.data);
              setIsLoadingEntity(false);
            }
          })  
          .catch((error) => {
            console.debug("fetchEntity Error", error);
            reportError(error);
            setIsLoadingEntity(false);
          }); 
    };


    if(!props.new){
     
      fetchEntity(authSet);
    }else{
      // the NEW route loads the forms through the legacy Forms loader,
      // not here // so that all shouldnt matter now
      setIsLoadingEntity(false);
    }
    
   

  }, [uuid]);
  

  function handleCancelForm(){
    window.history.back();
    // if(this.props && this.props.handleCancel){
    //   // How is this happening???
    //  this.props.handleCancel();
    // }else{
    //   window.history.back();
    // }
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

  function onChangeGlobusLink(newLink, newPublication) {
    console.debug(newPublication, newLink)
    // const {name, display_doi, doi} = newPublication;
  }

  function renderSuccessDialog(){
    if (newVersionShow) {
      return (
        <Dialog aria-labelledby="result-dialog" open={newVersionShow} maxWidth="xs">
        <DialogContent>
        <ResultLegacy
          result={newResult}
          onReturn={onClose}
          handleCancelForm={handleCancelForm}
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
  
  
    if (!isLoadingEntity && isLoadingDTList<1 ) {
      console.debug("Loaded!", dtl_status, dtl_primary, dtl_all);
      return ( 
        <div>
          {renderSuccessDialog()}
          <PublicationFormLegacy 
          authToken={authToken}
          changeLink={onChangeGlobusLink}
          onUpdated={onUpdated} 
          onCreated={onCreated}
          handleCancelForm={handleCancelForm} 
          editingPublication={entity_data} 
          reportError={props.reportError} 
          dataTypeList={dataTypeList} 
          dtl_primary={dtl_primary} 
          dtl_all={dtl_all} 
          dtl_status={true} 
          />
        </div>
      )
    }else{
      console.debug("Loading...", isLoadingEntity, isLoadingDTList);
      return (
        <div className="card-body ">
          <div className="loader">Loading...</div>
        </div>
      );
    }
  }
  

