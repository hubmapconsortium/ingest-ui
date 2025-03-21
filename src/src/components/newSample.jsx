import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
  entity_api_get_entity_ancestor_organ,
  entity_api_get_entity_ancestor_list
} from "../service/entity_api";
import SearchComponent from "./search/SearchComponent";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FilledInput from '@mui/material/FilledInput';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import LoadingButton from "@mui/lab/LoadingButton";
import NativeSelect from '@mui/material/NativeSelect';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import SearchIcon from '@mui/icons-material/Search';
import TextField from "@mui/material/TextField";
import {Typography} from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import {FormHeader, GroupSelectMenu} from "./ui/formParts";
import { flattenSampleType } from "../utils/constants_helper";
import { toTitleCase } from "../utils/string_helper";
import { SAMPLE_CATEGORIES, RUI_ORGAN_TYPES } from "../utils/constants";

// @TODO: With Donors now in place, good opportunity to test out what can 
export const SampleForm = (props) => {
  const{uuid} = useParams();
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[sourceEntity, setSourceEntity] = useState(null);
  let [checked, setChecked] = React.useState(false);
  let [openSearch, setOpenSearch] = React.useState(false);
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const defaultGroup = userGroups[0].uuid;
  let organ_types = JSON.parse(localStorage.getItem("organs"));
  let[permissions,setPermissions] = useState({ 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let[entityData, setEntityData] = useState({
    direct_ancestor_uuid: "",
    sample_category: "",
    organ_type_donor_source_organ: "",
    visit: "",
    protocol_url: "",
    generate_ids_for_multiple_samples: "",
    number_to_generate: "",
    lab_sample_id_not_on_multiple: "",
    description: "",
    register_location_rui: "",
  });  
  let[formValues, setFormValues] = useState({
    // {"protocol_url":"dx.doi.org/10.17504/protocols.io.bs6fnhbnzxfgzxdfcgv","
    //   direct_ancestor_uuid":"3b59708ab41093a37291012d2850dd61","
    //   organ_other":"","
    //   visit":"","
    //   description":"aweawea","
    //   sample_category":"block","
    //   lab_tissue_sample_id":"awdwe","
    //   group_uuid":"5bd084c8-edc2-11e8-802f-0e368f3075e8"}
    direct_ancestor_uuid: "",
    sample_category: "",
    organ_type_donor_source_organ: "",
    visit: "",
    protocol_url: "",
    generate_ids_for_multiple_samples: "",
    number_to_generate: "",
    lab_tissue_sample_id: "",
    description: "",
    register_location_rui: "",
  });
  let[formErrors, setFormErrors] = useState({
  });

  let organMenu = Object.keys(organ_types).map((key) => {
    return(
      <option key={key} value={key}>{organ_types[key]}</option>
    )
  });
  
  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          if(response.status === 200){
            const entityType = response.results.entity_type;
            console.debug('%c◉ entityType ', 'color:#b300ff', entityType);
            if(entityType !== "Sample"){
              // Are we sure we're loading a Donor?
              // @TODO: Move this sort of handling/detection to the outer app, or into component
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            }else{
              const entityData = response.results;
              setSourceEntity(entityData.direct_ancestor);
              setEntityData(entityData);
              setFormValues(entityData);
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
    const{id, value, checked} = e.target;
    console.debug('%c◉ e ', 'color:#00ff7b', e);
    console.debug('%c◉ id & val ', 'color:#00ff7b', id, value, checked);
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: (id ==="generate_ids_for_multiple_samples") ? checked : value
    }));

    if(id ==="generate_ids_for_multiple_samples"){
      setChecked(checked)
    }
  }

  function validateForm(){
    let errors = 0;

    return errors === 0;
  }

  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    if(validateForm()){
      let cleanForm =formValues
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

        console.debug('%c◉ formValues ', 'color:#00ff7b', formValues);
        console.debug('%c◉ sample_category ', 'color:#00ff7b', formValues.sample_category, formValues.organ);
        console.debug('%c◉ ', 'color:#00ff7b', (!formValues.sample_category && formValues.organ) ? "organ": formValues.sample_category );

        // We're in Create mode
        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");

        let createSample = {
          direct_ancestor_uuid: formValues.direct_ancestor_uuid,
          sample_category: (formValues.sample_category === "" && formValues.organ) ? "organ": formValues.sample_category,
          protocol_url: formValues.protocol_url,
          visit: formValues.visit,
          description: formValues.description,
          ...((formValues.sample_category === "" && formValues.organ) && { organ: formValues.organ }),
          ...(selectedGroup?.value && { group_uuid: selectedGroup.value }),
          ...(formValues.RUILocation && { rui_location: formValues.RUILocation }),
          ...((!checked && formValues.lab_tissue_sample_id) && { lab_tissue_sample_id: formValues.lab_tissue_sample_id })
        }
       
        entity_api_create_entity("sample",JSON.stringify(createSample))
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

  function handleSelectSource(e){
    setOpenSearch(false);
    handleClose(e);
    console.debug('%c◉ handleSelectSource ', 'color:#00ff7b', e.row);
    setSourceEntity(e.row);
    setFormValues((prevValues) => ({
      ...prevValues,
      direct_ancestor_uuid: e.row.uuid,
    }));
  }

  function handleClose(e){
    setOpenSearch(false);
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

  function isOrganBloodType(sptype){
    return sptype === "organ" ||
      sptype === "blood";
  }
    
  if(isLoading ||(!entityData && uuid) ){
    return(<LinearProgress />);
  }else{
    return(
      <Box>

        <Dialog
            fullWidth={true}
            maxWidth="lg"
            // onClose={console.debug("CLOSED!")}
            onClose={(e) => handleClose(e)}
            aria-labelledby="source-lookup-dialog"
            open={openSearch === true ? true : false}>
            <DialogContent>
              <SearchComponent
                select={(e) => handleSelectSource(e)}
                custom_title="Search for a Source ID for your Sample"
                filter_type="Sample"
                blacklist={['collection']}
                modecheck="Source"
              />
            </DialogContent>
            <DialogActions>
              <Button
                onClick={(e) => handleClose(e)}
                variant="contained"
                color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
         
        <Grid container className=''>
          <FormHeader entityData={uuid ? entityData : ["new","Sample"]} permissions={permissions} />
        </Grid>

        <form onSubmit={(e) => handleSubmit(e)}>

          <FormControl sx={{ width: '100%', mt: 2 }} variant="filled">
            <InputLabel htmlFor="direct_ancestor_uuid" shrink={(uuid || (formValues?.direct_ancestor_uuid ) ? true:false)}>Source ID</InputLabel>
            <FilledInput
              id="direct_ancestor_uuid"
              value={sourceEntity ? sourceEntity.hubmap_id : ""}
              error={formErrors.direct_ancestor_uuid ? true : false}
              onClick={() => setOpenSearch(true)}
              disabled={permissions ?(!permissions.has_write_priv) : true}
              InputLabelProps={{shrink: ((uuid || (formValues?.direct_ancestor_uuid )) ? true:false)}}
              variant="filled"
              size="small"
              required
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Select a Source Entity"
                    onClick={() => setOpenSearch(true)}
                    edge="end">
                    {<SearchIcon />}
                  </IconButton>
                </InputAdornment>}/>
            <FormHelperText id="sourceIDHelp" className="mb-3">The HuBMAP Unique identifier of the direct origin entity,other sample or donor, where this sample came from.</FormHelperText>
          </FormControl>

          {sourceEntity && sourceEntity.uuid && ( 
            <Box sx={{p: 2, mb: 2,textAlign: "left", width: "auto", border: "1px solid #ccc", borderRadius: "5px", boxSizing: "border-box"}}>
              <Typography >
                <b>Source Category:</b>{" "}
                {sourceEntity.entity_type === "Donor" ? "Donor" : toTitleCase(sourceEntity.sample_category) }
              </Typography>

              {isOrganBloodType(sourceEntity.sample_category) && (
                <Typography>
                  <b>Organ Type:</b>{" "}
                  {organ_types[sourceEntity.organ]}
                </Typography>
              )}
              {sourceEntity.submission_id && (
                  <Typography>
                    <b>Submission ID:</b>{" "}
                    {sourceEntity.submission_id}
                  </Typography>
              )}
              {sourceEntity.lab_donor_id && (
                <Typography>
                    <b>Lab ID: </b>{" "}
                    {sourceEntity.lab_donor_id}     
                </Typography>
              )}
              {sourceEntity.group_name && (
                <Typography className="col-sm-12">
                  <b>Group Name: </b>{" "}
                  {sourceEntity.group_name}
                </Typography>
              )}
                    
            </Box>
          )}

          {sourceEntity && sourceEntity.uuid && (sourceEntity.entity_type === "Donor") && (
            <Box className="my-3" >           
                <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="organ">
                  Organ
                </InputLabel>
                <NativeSelect
                  id="organ"
                  label="Organ"
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  inputProps={{style: { padding: "0.8em"}}}
                  sx={{background: "rgba(0, 0, 0, 0.06)"}}
                  disabled={uuid?true:false}
                  value={formValues.organ ? formValues.organ : ""}>
                  <option key={"DEFAULT"} value={""}></option>
                  {organMenu}  
                </NativeSelect>
                <FormHelperText id="organIDHelp" className="mb-3">The HuBMAP Unique identifier of the direct origin entity,other sample or donor, where this sample came from.</FormHelperText>
            </Box>
          )}
          {sourceEntity && sourceEntity.uuid && (sourceEntity.entity_type !== "Donor") && (
            <Box className="my-3">
              <NativeSelect
                id="sample_category"
                onChange={(e) => handleInputChange(e)}
                fullWidth
                inputProps={{
                  style: { padding: "0.8em"}
                }}
                sx={{
                  background: "rgba(0, 0, 0, 0.06)"
                }}
                disabled={uuid?true:false}
                value={formValues.sample_category ? formValues.sample_category : ""}>
                <option key={"NA"} value={""}>Sample Category</option>                                        
                <option key={"block"} value={"block"}>Block</option>
                <option key={"section"} value={"section"}>Section</option>
                <option key={"suspension"} value={"suspension"}>Suspension</option>
              </NativeSelect>
              <FormHelperText id="sampleCategoryIDHelp" className="mb-3">The category of sample</FormHelperText>
            </Box>
          )}

          {/* Visit */}
          <TextField 
            id="visit"
            label="Visit "
            helperText="Associated visit in which sample was acquired (Non-PHI number). e.g., baseline"
            value={formValues ? formValues.visit : ""}
            error={formErrors.visit ? true : false}
            InputLabelProps={{shrink: ((uuid || (formValues?.visit )) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            size="small"
            disabled={!permissions.has_write_priv}
            variant="filled"/>
          
          {/* Protocol URL  */}
          <TextField 
            id="protocol_url"
            label="Preparation Protocol "
            helperText="The protocol used when procuring or preparing the tissue. This must be provided as a protocols.io DOI URL see https://www.protocols.io/"
            value={formValues ? formValues.protocol_url : ""}
            error={formErrors.protocol_url ? true : false}
            InputLabelProps={{shrink: ((uuid || (formValues?.protocol_url )) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
            required/>
          
          {/* lab_tissue_sample_id */}
          <Collapse in={!checked}> 
            <TextField 
              id="lab_tissue_sample_id"
              label="Lab Sample ID"
              helperText="An identifier used by the lab to identify the specimen, this can be an identifier from the system used to track the specimen in the lab. This field will be entered by the user."
              value={formValues ? formValues.lab_tissue_sample_id : ""}
              error={formErrors.lab_tissue_sample_id ? true : false}
              InputLabelProps={{shrink: ((uuid || (formValues?.lab_tissue_sample_id )) ? true:false)}}
              onChange={(e) => handleInputChange(e)}
              fullWidth
              disabled={!permissions.has_write_priv}
              variant="filled"
              className="my-3" />
          </Collapse>
          {/* generate_ids_for_multiple_samples */}
          {!uuid && ( 
            <FormControlLabel control={
              <Checkbox 
              checked={checked}
              id= "generate_ids_for_multiple_samples"
              onChange={(e) => handleInputChange(e)}
              />
            } label="Generate Multiple IDs" />
          )}
          
          {/*generate_number */}
          <Collapse in={checked}> 
            <TextField
              id="generate_number"
              label="Number to Generate"
              small />
          </Collapse>
          
          <TextField //"Description "
            id="description"
            label="Description "
            helperText="Free text field to enter a description of the donor"
            value={formValues ? formValues.description : ""}
            error={formErrors.description ? true : false}
            InputLabelProps={{shrink: ((uuid || (formValues?.description)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            variant="filled"
            className="my-3"
            multiline
            rows={4}/>
          
          <Box className="my-3">           
            <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
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

