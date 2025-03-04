import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
} from "../service/entity_api";
// import {useNavigate} from "react-router-dom";
import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import {tsToDate} from "../utils/string_helper";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUserShield} from "@fortawesome/free-solid-svg-icons";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import {validateRequired} from "../utils/validators";
import HIPPA from "./ui/HIPPA";
import {LocalLaundryServiceOutlined} from "@material-ui/icons";
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
  let[pageErrors, setPageErrors] = useState(false);
  let[formErrors, setFormErrors] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
  });
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const allGroups = JSON.parse(localStorage.getItem("allGroups"));
  const defaultGroup = userGroups[0].uuid;
  var[formValues, setFormValues] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
    group_uuid: userGroups[0].uuid,
    group_name: userGroups[0].shortname,
  });
  const{uuid} = useParams();


  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      const authSet = JSON.parse(localStorage.getItem("info"));
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
          //console.debug("useEffect entity_api_get_entity", response);
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
                console.debug('%c◉ ALLOWS ', 'color:#ff005d', response);
                setPermissions(response.results);
              })
              .catch((error) => {
                console.error("ingest_api_allowable_edit_states ERROR", error);
              });
              document.title = `HuBMAP Ingest Portal | Donor: ${entityData.hubmap_id}`; //@TODO - somehow handle this detection in App
            }
          }else{
            console.error(
              "entity_api_get_entity RESP NOT 200",
              response.status,
              response
            );
          }
        })
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          passError();
          passError(error);
        });
    }else{
      setPermissions({
        has_write_priv: true,
      });
    }
    setLoading(false);
  }, [uuid]);

  function passError(error){
    setLoading(false);
    setPageErrors(error);
  }

  function toggleHippa(){
    setShowHippa(!showHippa);
  }

  function handleInputChange(e){
    const{id, value} = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  }

  function renderHeader(){
    let PanelStyle = {
      width: "50%",
      margin: "0 auto",
      display: "inline-block",
      boxSizing: "border-box",
    };

    return(
      <Box sx={{maxWidth: "90%", margin: "10px auto 20px auto "}}>
        <Box className="portal-label " sx={PanelStyle}>
          HuBMAP ID: {entityData.hubmap_id}
        </Box>
        <Box className="portal-label " sx={PanelStyle}>
          Submission ID: {entityData.submission_id}
        </Box>
        <Box className="portal-label" sx={PanelStyle}>
          Entered by: {entityData.created_by_user_email}
        </Box>
        <Box className="portal-label" sx={PanelStyle}>
          Entry Date: {tsToDate(entityData.created_timestamp)}
        </Box>
      </Box>
    );
  }

  function validateForm(){
    // So it looks like this no longer gets triggered
    // and instead the browser has a built in error thing?
    // that wont even fire Submit unless required fields are filled?
    // need to test across a few browsers
    let errors = {};
    let requiredFields = ["label", "protocol_url"];
    for(let field of requiredFields){
      if(!validateRequired(formValues[field])){
        setFormErrors((prevValues) => ({
          ...prevValues,
          field: "required",
        }));
      }
      //console.log("errors",errors, field);
    }
    if(errors.length > 0){
      setFormErrors(errors);
    }
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e){
    e.preventDefault();
    setIsProcessing(true);

    if(validateForm()){
      if(uuid){
        // We're in Edit mode
        let cleanForm ={
          lab_donor_id: formValues.lab_donor_id,
          label: formValues.label,
          protocol_url: formValues.protocol_url,
          description: formValues.description,
        }
        entity_api_update_entity(
          uuid,
          JSON.stringify(cleanForm),
          JSON.parse(localStorage.getItem("info")).groups_token
        )
          .then((response) => {
            if(response.status === 200){
              console.debug("%c◉ ON UPDATED! ", "color:#00ff7b");
              props.onUpdated(response.results);
            }else{
              console.error("%c◉ SUBMIT ERROR ", "color:#00ff7b", response);
            }
          })
          .catch((error) => {
            console.error("%c◉ SUBMITERROR ", "color:#00ff7b", error);
          });
      }else{
        // We're in Create mode
        entity_api_create_entity(
          "donor",
          JSON.stringify(formValues),
          JSON.parse(localStorage.getItem("info")).groups_token
        )
          .then((response) => {
            if(response.status === 200){
              props.onCreated(response.results);
            }else{
              console.error(
                "%c◉ entity_api_create_entity ",
                "color:#ff007b",
                response
              );
            }
          })
          .catch((error) => {
            console.error(
              "%c◉ entity_api_create_entity ",
              "color:#00ff7b",
              error
            );
          });
      }
    }else{
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }

  function buttonEngine(){
    //console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
    return(
      <Box sx={{textAlign: "right"}}>
        <Button
          variant="contained"
          className="m-2"
          onClick={() => window.history.back()}>
          Cancel
        </Button>
        {/* Here we compile which buttons they get */}
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

  return isLoading ||(!entityData && !formValues && uuid) ? <LinearProgress /> : (
    <Box>
      <Box className="col-sm-12 text-center">
        <h4>{entityData ? "Donor Information" : "Registering a Donor"}</h4>
      </Box>

      <Alert
        sx={{maxWidth: "80%", margin: "0 auto"}}
        icon={false}
        severity="error">
        <FontAwesomeIcon icon={faUserShield} /> - Do not provide any Protected
        Health Information. This includes the{" "}
        <span
          style={{cursor: "pointer"}}
          className="text-primary"
          onClick={() => toggleHippa()}>
          {" "}
          18 identifiers specified by HIPAA
        </span>
      </Alert>

      <HIPPA show={showHippa} handleClose={() => toggleHippa()} />
      {!isLoading && uuid && uuid !== "" && renderHeader()}

      <form onSubmit={(e) => handleSubmit(e)}>
        <TextField //"Lab's Donor Non-PHI ID "
          id="lab_donor_id"
          label="Lab's Donor Non-PHI ID "
          helperText="An non-PHI id used by the lab when referring to the donor"
          value={formValues ? formValues.lab_donor_id : ""}
          error={formErrors.lab_donor_id !== ""}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => handleInputChange(e)}
          fullWidth
          disabled={!permissions.has_write_priv}
          variant="standard"
          className="my-3"
        />
        <TextField //"Deidentified Name "
          id="label"
          label="Deidentified Name "
          helperText="A deidentified name used by the lab to identify the donor (e.g. HuBMAP Donor 1)"
          value={formValues ? formValues.label : ""}
          error={formErrors.label !== ""}
          required
          InputLabelProps={{ shrink: true }}
          onChange={(e) => handleInputChange(e)}
          fullWidth
          disabled={!permissions.has_write_priv}
          variant="standard"
          className="my-3"
        />
        <TextField //"Case Selection Protocol "
          id="protocol_url"
          label="Case Selection Protocol "
          helperText="The protocol used when choosing and acquiring the donor. This can be supplied a DOI from http://protocols.io"
          value={formValues ? formValues.protocol_url : ""}
          error={formErrors.protocol_url !== ""}
          required
          InputLabelProps={{ shrink: true }}
          onChange={(e) => handleInputChange(e)}
          fullWidth
          disabled={!permissions.has_write_priv}
          variant="standard"
          className="my-3"
        />
        <TextField //"Description "
          id="description"
          label="Description "
          helperText="Free text field to enter a description of the donor"
          value={formValues ? formValues.description : ""}
          error={formErrors.description !== ""}
          InputLabelProps={{ shrink: true }}
          onChange={(e) => handleInputChange(e)}
          fullWidth
          disabled={!permissions.has_write_priv}
          variant="standard"
          className="my-3"
          multiline
          rows={4}
        />
        <Box className="my-3">
          <InputLabel InputLabelProps={{ shrink: true }} variant="standard" htmlFor="group">
            Group
          </InputLabel>
          {permissions.has_write_priv && (
            <Select // Group
              label="Group "
              id="group_uuid"
              onChange={(e) => handleInputChange(e)}
              fullWidth
              disabled={!permissions.has_write_priv}
              value={
                formValues.group_uuid ? formValues.group_uuid : defaultGroup
              }>
              {userGroups.map((group, index) => {
                return( 
                  <MenuItem key={index + 1} value={group.uuid}>
                    {group.shortname}
                  </MenuItem>
                );
              })}
            </Select>
          )}
          {!permissions.has_write_priv && (
            <Typography sx={{color:"rgba(0, 0, 0, 0.38)"}}>{formValues.group_name} </Typography>
          )}
        </Box>
        {buttonEngine()}
      </form>

      {pageErrors && pageErrors.length > 0 && (
        <Alert variant="filled" severity="error">
          <strong>Error:</strong> {JSON.stringify(pageErrors)}
        </Alert>
      )}
    </Box>
  );
};
