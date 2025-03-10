import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
} from "../service/entity_api";
import {
  validateRequired,
  validateProtocolIODOI,
  validateSingleProtocolIODOI
} from "../utils/validators";

import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import {tsToDate} from "../utils/string_helper";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";

import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import HIPPA from "./ui/HIPPA";
import {Typography} from "@mui/material";

export const DonorForm = (props) => {
  let[entityData, setEntityData] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
    group_uuid: "",
  });
  let[showHippa, setShowHippa] = useState(false);
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[permissions,setPermissions] = useState({ 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let[pageErrors, setPageErrors] = useState(null);
  let[formErrors, setFormErrors] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
  });
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const defaultGroup = userGroups[0].uuid;
  var[formValues, setFormValues] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
  });
  const{uuid} = useParams();


  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          if(response.status === 200){
            const entityType = response.results.entity_type;
            if(entityType !== "Donor"){
              // Are we sure we're loading a Donor?
              // @TODO: Move this sort of handling/detection to the outer app, or into component
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            }else{
              const entityData = response.results;
              setEntityData(entityData);
              setFormValues({
                lab_donor_id:entityData.lab_donor_id,
                label:entityData.label,
                protocol_url:entityData.protocol_url,
                description:entityData.description,
                group_uuid:entityData.group_uuid,
                group_name:entityData.group_name
              });
              ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if(entityData.data_access_level === "public"){
                    setPermissions({
                      has_write_priv: false,
                    });
                    
                  }
                  setPermissions(response.results);
                })
                .catch((error) => {
                  console.error("ingest_api_allowable_edit_states ERROR", error);
                  setPageErrors(error);
                });
              document.title = `HuBMAP Ingest Portal | Donor: ${entityData.hubmap_id}`; //@TODO - somehow handle this detection in App
            }
          }else{
            console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        })
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          setPageErrors(error);
        });
    }else{
      setPermissions({
        has_write_priv: true,
      });
    }
    setLoading(false);
  }, [uuid]);

  // useEffect(() => {
  //   if(pageErrors){
  //     console.debug('%c◉ USEEFFECT ERROR ', 'color:#00ff7b', pageErrors, pageErrors.length);
  //     setLoading(false);
  //     // setPageErrors(pageErrors);
  //   }
  // }, [pageErrors]);

  // function setPageErrors(error){
  //   console.debug('%c◉ CAUGHT ERROR ', 'color:#00ff7b', );
  //   setLoading(false);
  //   setPageErrors(error);
  // }


  function handleInputChange(e){
    const{id, value} = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  }

  function validateDOI(protocolDOI){
    if (!validateProtocolIODOI(protocolDOI)) {
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': "Please enter a valid protocols.io URL"
        }));
      return 1
    } else if (!validateSingleProtocolIODOI(protocolDOI)) {
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': "Please enter only one valid protocols.io URL"
        }));
      return 1
    }else{
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': ""
        }));
      return 0
    }
  }

  function validateForm(){
    let errors = 0;

    // Required Fields
    //  So it looks like Required no longer gets triggered
    //  and instead the browser has a built in error thing?
    //  that wont even fire Submit unless required fields are filled?
    //  need to test across a few browsers
    let requiredFields = ["label", "protocol_url"];
    for(let field of requiredFields){
      if(!validateRequired(formValues[field])){
        setFormErrors((prevValues) => ({
          ...prevValues,
          field: "required",
        }));
        errors++;
      }
    }

    // Formatting Validation
    errors += validateDOI(formValues['protocol_url']);

    // End Validation
    return errors === 0;
  }

  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    if(validateForm()){
      let cleanForm ={
        lab_donor_id: formValues.lab_donor_id,
        label: formValues.label,
        protocol_url: formValues.protocol_url,
        description: formValues.description,
      }
      if(uuid){
        // We're in Edit mode
        entity_api_update_entity(uuid,JSON.stringify(cleanForm))
          .then((response) => {
            if(response.status === 200){
              props.onUpdated(response.results);
            }else{
              wrapUp(response)
            }
          })
          .catch((error) => {
            wrapUp(error)
          });
      }else{
        // We're in Create mode
        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");
        if(selectedGroup?.value){
          cleanForm = {...cleanForm, group_uuid: selectedGroup.value};
        }
        entity_api_create_entity("donor",JSON.stringify(cleanForm))
          .then((response) => {
            if(response.status === 200){
              props.onCreated(response.results);
            }else{
              wrapUp(response.error ? response.error : response)
            }
          })
          .catch((error) => {
            wrapUp(error)
          });
      }
    }else{
      setIsProcessing(false);
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }

  function wrapUp(error){
    setPageErrors(error);
    setIsProcessing(false);
  }

  function buttonEngine(){
    return(
      <Box sx={{textAlign: "right"}}>
        <Button
          variant="contained"
          className="m-2"
          onClick={() => window.history.back()}>
          Cancel
        </Button>
        {/* @TODO use next form to help work this in to its own UI component? */}
        {!uuid && (
          <LoadingButton
            variant="contained"
            loading={isProcessing}
            className="m-2"
            type="submit">
            Generate ID
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Update
          </LoadingButton>
        )}
      </Box>
    );
  }

  function renderHeader(){
  
    return(

      <Grid container className='p-2'>
        
        {!isLoading && uuid && uuid !== "" && ( <React.Fragment>
          <Grid item xs={12} className="" >  
            <h3 style={{marginLeft:"-2px"}}>Donor Information</h3>
          </Grid>
          <Grid item xs={6} className="" >
            <Typography>HuBMAP ID: {entityData.hubmap_id}</Typography>
            <Typography>Entered by: {entityData.created_by_user_email}</Typography>
            <Typography>Submission ID: {entityData.submission_id}</Typography>
            <Typography>Entry Date: {tsToDate(entityData.created_timestamp)}</Typography>   
          </Grid>
        </React.Fragment>)}
        {!isLoading && !uuid && ( <React.Fragment>
          <Grid item xs={6} className="" >  
            <h3 style={{marginLeft:"-2px"}}>Registering a Donor</h3>
          </Grid>
        </React.Fragment>)}

        <Grid item xs={6} className="" >
          {permissions.has_write_priv && (
          
             <HIPPA />
          )}
          {entityData && entityData.data_access_level === "public" && (
            // They might not have write access but not because of data_access_level
            <Alert severity="warning" sx={{
              minHeight: "100%",
              minWidth: "100%",
              padding: "10px"}}>
              This entity is no longer editable. It was locked when it became publicly
              acessible when data associated with it was published.
            </Alert>
          )}
        </Grid>
      </Grid>


    // <Box sx={{maxWidth: "90%", margin: "10px auto 20px auto "}}>
    //   <Box className="portal-label " sx={PanelStyle}>
    // <Typography>HuBMAP ID: {entityData.hubmap_id}</Typography>
    //     <Typography>Entered by: {entityData.created_by_user_email}</Typography>
    //     <Typography>Submission ID: {entityData.submission_id}</Typography>
    //     <Typography>Entry Date: {tsToDate(entityData.created_timestamp)}</Typography>
    //   </Box>
    //   <Box className="portal-label " sx={PanelStyle}>
    //     
    //   </Box>
    // </Box>
    );
  }

  function renderGroupSelectMenu(){
    if(formValues.group_name){
      return(
        <option value={formValues.group_uuid}>
          {formValues.group_name}
        </option>
      )
    }else{
      let menuArray = [];
      for(let group of userGroups){
        menuArray.push(
          <option key={group.uuid} value={group.uuid}>
            {group.shortname}
          </option>
        );
      }
      return menuArray;
    } 
  }


  if(isLoading ||(!entityData && !formValues && uuid) ){
    return(<LinearProgress />);
  }else{
    return(
      <Box>

        {renderHeader()}

        <form onSubmit={(e) => handleSubmit(e)}>
          <TextField //"Lab's Donor Non-PHI ID "
            id="lab_donor_id"
            label="Lab's Donor Non-PHI ID "
            helperText="A non-PHI id used by the lab when referring to the donor"
            value={formValues ? formValues.lab_donor_id : ""}
            error={formErrors.lab_donor_id !== ""}
            InputLabelProps={{shrink: ((uuid || (formValues?.lab_donor_id )) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
          />
          <TextField //"Deidentified Name "
            id="label"
            label="Deidentified Name "
            helperText={(formErrors.label && formErrors.label.length>0) ? formErrors.label :   "A deidentified name used by the lab to identify the donor (e.g. HuBMAP Donor 1)"}
            value={formValues ? formValues.label : ""}
            error={formErrors.label !== ""}
            required
            InputLabelProps={{shrink: ((uuid || (formValues?.label)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
          />
          <TextField //"Case Selection Protocol "
            id="protocol_url"
            label="Case Selection Protocol "
            helperText={(formErrors.protocol_url && formErrors.protocol_url.length>0) ? formErrors.protocol_url :   "The protocol used when choosing and acquiring the donor. This can be supplied a DOI from http://protocols.io"}
            value={formValues ? formValues.protocol_url : ""}
            error={formErrors.protocol_url !== ""}
            required
            InputLabelProps={{shrink: ((uuid || (formValues?.protocol_url)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
          />
          <TextField //"Description "
            id="description"
            label="Description "
            helperText="Free text field to enter a description of the donor"
            value={formValues ? formValues.description : ""}
            error={formErrors.description !== ""}
            InputLabelProps={{shrink: ((uuid || (formValues?.description)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
            multiline
            rows={4}
          />
          <Box className="my-3">           
            <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group">
              Group
            </InputLabel>
            <NativeSelect
              id="group_uuid"
              label="Group"
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="filled" 
              disabled={uuid?true:false}
              value={formValues.group_uuid ? formValues.group_uuid : defaultGroup}>
              {renderGroupSelectMenu()}
            </NativeSelect>
          </Box>
          {buttonEngine()}
        </form>
      
        {pageErrors && (
          <Alert variant="filled" severity="error">
            <strong>Error:</strong> {JSON.stringify(pageErrors)}
          </Alert>
        )}
      </Box>
    );
  }
}
