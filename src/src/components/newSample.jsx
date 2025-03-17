import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
} from "../service/entity_api";
import {
  validateProtocolIODOI,
  validateSingleProtocolIODOI
} from "../utils/validators";

import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";

import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import {FormHeader, GroupSelectMenu} from "./ui/formParts";


// @TODO: With Donors now in place, good opportunity to test out what can 
export const SampleForm = (props) => {
  let[entityData, setEntityData] = useState({
    source_id:"",
    sample_category:"",
    organ_type_donor_source_organ:"",
    visit:"",
    preparation_protocol:"",
    generate_ids_for_multiple_samples:"",
    number_to_generate:"",
    lab_sample_id_not_on_multiple:"",
    description:"",
    register_location_rui:"",
  });
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
    source_id:"",
    sample_category:"",
    organ_type_donor_source_organ:"",
    visit:"",
    preparation_protocol:"",
    generate_ids_for_multiple_samples:"",
    number_to_generate:"",
    lab_sample_id_not_on_multiple:"",
    description:"",
    register_location_rui:"",
  });
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const defaultGroup = userGroups[0].uuid;
  var[formValues, setFormValues] = useState({
    source_id:"",
    sample_category:"",
    organ_type_donor_source_organ:"",
    visit:"",
    preparation_protocol:"",
    generate_ids_for_multiple_samples:"",
    number_to_generate:"",
    lab_sample_id_not_on_multiple:"",
    description:"",
    register_location_rui:"",
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
            console.debug('%c◉ entityType ', 'color:#b300ff', entityType);
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
    // Required Field Validation 
    // is now handled by the browser's built-in 
    // form handling thanks to the form tag & handleSubmit

    // Formatting Validation
  
    // End Validation
    return errors === 0;
  }

  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    if(validateForm()){
      let cleanForm ={
        
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


  if(isLoading ||(!entityData && !formValues && uuid) ){
    return(<LinearProgress />);
  }else{
    return(
      <Box>
        
        <Grid container className='p-2'>
          <FormHeader entityData={uuid ?  entityData : ["new","Sample"]} permissions={permissions} />
        </Grid>

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
            className="my-3"/>
          
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
              <GroupSelectMenu formValues={formValues} />
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

