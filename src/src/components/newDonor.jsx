import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
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
import { humanize } from "../utils/string_helper";

import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import {FormHeader,UserGroupSelectMenu} from "./ui/formParts";
import { DonorFormFields,DonorFieldSet } from "./ui/fields/DonorFormFields";

export const DonorForm = (props) => {
  let navigate = useNavigate();
  let[entityData, setEntityData] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
    group_uuid: "",
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
  const [valErrorMessages, setValErrorMessages] = useState([]);
  let[formErrors, setFormErrors] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
  });
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
                lab_donor_id: entityData.lab_donor_id,
                label: entityData.label,
                protocol_url: entityData.protocol_url,
                description: entityData.description,
                group_uuid: entityData.group_uuid,
                group_name: entityData.group_name
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
                  // console.error("ingest_api_allowable_edit_states ERROR", error);
                  setPageErrors(error);
                });
            }
          }else{
            // console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        })
        .catch((error) => {
          // console.debug("entity_api_get_entity ERROR", error);
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
      return [1,"Please enter a valid protocols.io URL"]
    } else if (!validateSingleProtocolIODOI(protocolDOI)) {
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': "Please enter only one valid protocols.io URL"
        }));
      return [1,"Please enter only one valid protocols.io URL"]
    }else{
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': ""
        }));
      return [0,""]
    }
  }

  function validateForm(){
    console.debug('%c◉ validateForm ', 'color:#00ff7b', );
    setValErrorMessages(null);
    let errors = 0;
    let e_messages = [];
    let newFormErrors = {};
    let requiredFields = ["label", "protocol_url"];
    requiredFields.forEach(field => {
      if (!formValues[field] || formValues[field] === "") {
        let fieldName = DonorFieldSet.find(f => f.id === field)?.label || humanize(field);
        console.debug('%c◉ fieldName ', 'color:#00ff7b', fieldName);
        newFormErrors[field] = fieldName+" | is a required field"
        e_messages.push(fieldName+" | is a required field");
        errors++;
      }
    });
    // Formatting Validation
    let doiVal = validateDOI(formValues['protocol_url']);
    errors += doiVal[0];
    if(doiVal[0]>0){
      e_messages.push(doiVal[1]);
      newFormErrors['protocol_url'] = true
    }
    // End Validation
    setFormErrors(newFormErrors);
    setValErrorMessages(errors > 0 ? e_messages : null);
    console.debug('%c◉ errorcount ', 'color:#00ff7b', errors);
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
      // console.debug("%c◉ Invalid ", "color:#00ff7b");
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
          className="m-2 cancelButton"
          onClick={() => navigate("/")}>
          Cancel
        </Button>
        {/* @TODO use next form to help work this in to its own UI component? */}
        {!uuid && (
          <LoadingButton
            variant="contained"
            loading={isProcessing}
            className="m-2 creationButton"
            onClick={(e) => handleSubmit(e)}>
            Generate ID
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton 
            loading={isProcessing} 
            variant="contained" 
            className="m-2 updateButton" 
            type="submit">
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
        <Grid container className=''>
          <FormHeader entityData={uuid ? entityData : ["new","Donor"]} permissions={permissions} />
        </Grid>
        <form className="entityForm">
          <DonorFormFields
            formValues={formValues}
            formErrors={formErrors}
            permissions={permissions}
            handleInputChange={handleInputChange}
            uuid={uuid}
          />
          
          {/* Group */}
          {/* Data is viewable in form header & cannot be changed, so only show on Creation */}
          {!uuid && (
            <Box className="my-3">           
              <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
                Group
              </InputLabel>
              <NativeSelect
                id="group_uuid"
                label="Group"
                onChange={(e) => handleInputChange(e)}
                fullWidth
                className="p-2"
                sx={{
                  BorderTopLeftRadius: "4px",
                  BorderTopRightRadius: "4px",
                }}
                disabled={uuid?true:false}
                value={formValues.group_uuid ? formValues.group_uuid : ""}>
                <UserGroupSelectMenu formValues={formValues} />
              </NativeSelect>
            </Box>
          )}

          {valErrorMessages && valErrorMessages.length > 0 && (
            <Alert severity="error">
              <AlertTitle>Please Review the following problems:</AlertTitle>
              {valErrorMessages.map((error) => (
                <Typography key={error}>{error}</Typography>
              ))}
            </Alert>
          )}
          {buttonEngine()}
        </form>
      
        {pageErrors && (
          <Alert variant="filled" severity="error" className="pageErrors">
            <strong>Error:</strong> {JSON.stringify(pageErrors)}
          </Alert>
        )}
      </Box>
    );
  }
}