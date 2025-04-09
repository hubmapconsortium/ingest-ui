import React, {useEffect, useState, useMemo} from "react";
import {useParams} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import { ubkg_api_get_upload_dataset_types } from '../service/ubkg_api';
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
import {getPublishStatusColor} from "../utils/badgeClasses";

import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import FormHelperText from '@mui/material/FormHelperText';
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import {FormHeader,GroupSelectMenu} from "./ui/formParts";
import {Typography} from "@mui/material";

export const UploadForm = (props) => {
  let[entityData, setEntityData] = useState({
    title: "",
    description: "",
    intended_organ: "",
    intended_dataset_type: "",
    data_provider_group: "",
    anticipated_complete_upload_month: "",
    anticipated_dataset_count: "",
  });
  var[formValues, setFormValues] = useState({
    title: "",
    description: "",
    intended_organ: "",
    intended_dataset_type: "",
    data_provider_group: "",
    anticipated_complete_upload_month_raw: null,
    anticipated_dataset_count: "",
  });
  let[permissions,setPermissions] = useState({ 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[formErrors, setFormErrors] = useState({});
  let[datasetMenu, setDatasetMenu] = useState();
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const defaultGroup = userGroups[0].uuid;
  const{uuid} = useParams();
  
  // Organ Menu Build
  const organ_types = JSON.parse(localStorage.getItem("organs"));
  const organMenu = useMemo(() => {

    console.debug('%c◉ organ_types ', 'color:#00ff7b',organ_types );
    return Object.keys(organ_types)
    .sort((a, b) => organ_types[a].localeCompare(organ_types[b]))
    .map((key) => (
      <option key={key} value={key}>
          {organ_types[key]}
        </option>
      ));
    }, [organ_types]);
  
  // Dataset Menu Build
  // Datasets are based not on the basic ontology dataset call but on a specilized call with filters

  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          if(response.status === 200){
            const entityType = response.results.entity_type;
            if(entityType !== "Upload"){
              // Are we sure we're loading a Upload?
              // @TODO: Move this sort of handling/detection to the outer app, or into component
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            }else{
              const entityData = response.results;
              let formattedDate = dayjs(entityData.anticipated_complete_upload_month, "YYYY-MM");
              console.debug('%c◉ formattedDate ', 'color:#D17BFF', formattedDate, entityData.anticipated_complete_upload_month);
              setEntityData({
                ...entityData,
                anticipated_complete_upload_month_raw: formattedDate,
              });

              setFormValues({
                title: entityData.title,
                description: entityData.description,
                intended_organ: entityData.intended_organ,
                intended_dataset_type: entityData.intended_dataset_type,
                data_provider_group: entityData.data_provider_group,
                anticipated_complete_upload_month: entityData.anticipated_complete_upload_month,
                anticipated_dataset_count: entityData.anticipated_dataset_count,
              });
              
              ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if(entityData.data_access_level === "public"){
                    setPermissions({
                      has_write_priv: false,
                    });
                  }
                  setPermissions(response.results);
                  // if we can't edit, and there is no date set, 
                  // we'll want to clear out any value in the date picker label
                  console.debug('%c◉ response.results.has_write_priv ', 'color:#00ff7b', response.results.has_write_priv);
                  console.debug('%c◉ entityData.anticipated_complete_upload_month ', 'color:#00ff7b', entityData.anticipated_complete_upload_month);
                  if(response.results.has_write_priv === false && (entityData.anticipated_complete_upload_month ===undefined || entityData.anticipated_complete_upload_month === null)){
                    console.debug('%c◉ Clear triggered ', 'color:#00ff7b');
                    // console.debug('%c◉  document.getElementsByClassName(".MuiPickersCalendarHeader-label") ', 'color:#00ff7b', document.getElementsByClassName(".MuiPickersCalendarHeader-label"));
                    console.debug('%c◉  [0] ', 'color:#00ff7b', document.getElementById("mui-2-grid-label")[0]);
                    // console.debug('%c◉  [0] ', 'color:#00ff7b', document.getElementsByClassName(".MuiPickersCalendarHeader-label")[0]);
                    document.getElementById("mui-2-grid-label").innerHTML = "No Date Set";
                  }
                  // document.getElementsByClassName("MuiPickersCalendarHeader-label")[0].innerHTML = "";
                })
                .catch((error) => {
                  console.error("ingest_api_allowable_edit_states ERROR", error);
                  setPageErrors(error);
                });
              document.title = `HuBMAP Ingest Portal | Upload: ${entityData.hubmap_id}`; //@TODO - somehow handle this detection in App
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

    ubkg_api_get_upload_dataset_types()
      .then((results) => {
        const filteredArray = results.filter(item => item.term !== "UNKNOWN");
        const sortedArray = filteredArray.sort((a, b) => a.term.localeCompare(b.term));
        setDatasetMenu(sortedArray.map((item) => (
          <option key={item.code} value={item.term}>
            {item.term}
          </option>
        )));
      })
      .catch((error) => {
        console.debug('%c◉ UPLOAD DTYPES ERROR  ', 'color:#00e5ff', error);
      });
    setLoading(false);
  }, [uuid]);

  function handleInputChange(e){
    if(e.target){
      const{id, value} = e.target;
      setFormValues((prevValues) => ({
        ...prevValues,
        [id]: value,
      }));
    }else if (e.$d){
      let selectedDate = new Date(e.$d);
      let monthFix = selectedDate.getMonth() < 10 ? "0"+(selectedDate.getMonth()+1) : selectedDate.getMonth();
      let formattedDate = selectedDate.getFullYear() + "-" + (monthFix);
      console.debug('%c◉ ym ', 'color:#00ff7b', formattedDate);
      setFormValues((prevValues) => ({
        ...prevValues,
        anticipated_complete_upload_month_raw: formattedDate,
      }));
    }
  }

  function validateForm(){
    let errors = 0;
    // Formatting Validation
    // errors += validateDOI(formValues['protocol_url']);
    // End Validation
    return errors === 0;
  }

  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    if(validateForm()){
      let cleanForm ={
        title: formValues.title,
        description: formValues.description,
        ...((formValues.intended_organ) && {intended_organ: formValues.intended_organ} ),
        ...((formValues.intended_dataset_type) && {intended_dataset_type: formValues.intended_dataset_type} ),
        ...((formValues.anticipated_complete_upload_month_raw) && {anticipated_complete_upload_month: formValues.anticipated_complete_upload_month_raw} ),
        ...((formValues.anticipated_dataset_count) && {anticipated_dataset_count: parseInt(formValues.anticipated_dataset_count)} ),
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
        let anticipated_complete_upload_month = formValues.anticipated_complete_upload_month_raw;
        if(anticipated_complete_upload_month && anticipated_complete_upload_month !== null){
          cleanForm = {...cleanForm, anticipated_complete_upload_month: formValues.anticipated_complete_upload_month_raw};
        }
        entity_api_create_entity("upload",JSON.stringify(cleanForm))
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

  function clearDate(error){
    setFormValues((prevValues) => ({
      ...prevValues,
      anticipated_complete_upload_month_raw: null,
    }));
  }

  function statusPermissions(){
    let buttons = [];
    let casedStatus = entityData.status ? entityData.status.toUpperCase() : "";

    if(permissions.has_admin_priv){
      if (
        casedStatus === "NEW" ||
        casedStatus === "SUBMITTED" ||
        casedStatus === "VALID" ||
        casedStatus === "INVALID" ||
        casedStatus === "ERROR"){
          buttons.push("Validate");
      }
      if(casedStatus === "SUBMITTED" ){
        buttons.push("Reorganize");
      }        
      if(casedStatus !== "REORGANIZED" ){
        buttons.push("Revert");
      }
    }

    // Group / write privs OR Admin Privs 
    if(permissions.has_write_priv || permissions.has_admin_priv){
      if(casedStatus !== "VALID" ){
        buttons.push("Submit");
      } 
      if(casedStatus === "VALID" ||
        casedStatus === "INVALID" ||
        casedStatus === "ERROR"||
        casedStatus === "NEW" ||
        casedStatus === "INCOMPLETE"){
        buttons.push("Save");
      }
    }
    console.debug('%c◉ buttons ', 'color:#00ff7b', buttons);
    return (buttons)
  }

  function buttonEngine(){
    let buttonList = statusPermissions();
    console.debug('%c◉ buttonList ', 'color:#00ff7b', buttonList);
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
            Save
          </LoadingButton>
        )}

        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Validdate
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Submit
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Reorganize
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Revert
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
          <FormHeader entityData={uuid ? entityData : ["new","Upload"]} permissions={permissions} />
        </Grid>
        <form onSubmit={(e) => handleSubmit(e)}>
          <TextField //"Title "
            id="title"
            label="Title "
            required
            helperText="A name for this upload. This will be used internally by Consortium members for the purposes of finding this Data Upload"
            value={formValues ? formValues.title : ""}
            error={formErrors.title}
            InputLabelProps={{shrink: ((uuid || (formValues?.title )) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            className="my-3"
          />
          <TextField //"Description "
            id="description"
            label="Description "
            required
            helperText="A full description of this Data Upload which will be used internally by the Consortium (not displayed publicly) for the purposes of searching for the Data Upload."
            value={formValues ? formValues.description : ""}
            error={formErrors.description}
            InputLabelProps={{shrink: ((uuid || (formValues?.description)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            className="my-3"
            multiline
            rows={4}/>
          
          <div className="row mt-3">
            <Grid container spacing={2}>
              
              <Grid item sm={8} md={6} lg={5} xl={4} >

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <InputLabel sx={{color: "rgba(0, 0, 0, 0.6)"}} htmlFor="anticipated_complete_upload_month_raw">
                      Anticipated Completion Month/Year
                  </InputLabel>
                  <Box
                    sx={{
                      borderTopLeftRadius: "4px",
                      borderTopRightRadius: "4px",
                      border: "1px solid rgba(0, 0, 0, 0.15)",
                      paddingBottom: "1em", 
                    }}>
                    <StaticDatePicker
                      id="anticipated_complete_upload_month_raw"
                      displayStaticWrapperAs="desktop"
                      className="col-12"
                      orientation="landscape"
                      openTo="month"
                      disableHighlightToday
                      showToolbar={false}
                      maxDate={dayjs("2026-12-31")}
                      // shouldDisableDate={disablePastCutoff()}
                      // label="Anticipated Completion Month/Year"
                      label=" "
                      views={["year", "month"]}
                      value={formValues.anticipated_complete_upload_month ? formValues.anticipated_complete_upload_month : null}
                      disablePast
                      disabled={!permissions.has_write_priv}
                      onChange={(e) => handleInputChange(e)}
                      renderInput={(params) => <TextField {...params} />}/>
                    <Button
                      sx={{
                        marginTop: "1em",
                        float: "right",
                      }}
                      disabled={!permissions.has_write_priv}
                      onClick={() => clearDate()}>
                      Clear
                    </Button>
                  </Box>
                </LocalizationProvider>
                <FormHelperText id="monthYearIDHelp" className="mb-3">The month and year of that this Upload will have all required data uploaded and be ready for reorganization into Datasets.</FormHelperText>
              </Grid>

              <Grid item sm={4} md={6} lg={7} xl={8} >
                {/* Organ */}
                <Box className="mb-4" >           
                  <InputLabel sx={{color: "rgba(0, 0, 0, 0.6)"}} htmlFor="organ">
                    Intended Organ Type *
                  </InputLabel>
                  <NativeSelect
                      id="intended_organ"
                      onChange={(e) => handleInputChange(e)}
                      fullWidth
                      required
                      helperText={(formErrors.intended_organ ? formErrors.intended_organ : "")}
                      inputProps={{style: {padding: "0.8em"}}}
                      disabled={!permissions.has_write_priv}
                      // sx={ uuid ? { background: "rgba(0, 0, 0, 0.07)"} : {}}
                      value={formValues.intended_organ ? formValues.intended_organ : ""}>
                      <option key={"DEFAULT"} value={""}></option>
                      {organMenu}  
                  </NativeSelect>
                  <FormHelperText id="organIDHelp" className="mb-3">Select the organ type that the data in this Upload is intended to be derived from.</FormHelperText>
                  {formValues.intended_organ && !organ_types[formValues.intended_organ] && (
                    <Alert variant="filled" severity="error">
                      <strong>Error:</strong> {`Invalid organ type stored: ${formValues.intended_organ}`}
                    </Alert>
                  )}
                </Box>
                {/* Dataset */}

                <Box className="mt-4" > 
                  <Grid container spacing={2}>
                    <Grid item xs={8} >
                      <InputLabel sx={{color: "rgba(0, 0, 0, 0.6)"}} htmlFor="intended_dataset_type">
                        Intended Dataset Type *
                      </InputLabel>
                      <NativeSelect
                          id="intended_dataset_type"
                          required
                          onChange={(e) => handleInputChange(e)}
                          fullWidth
                          helperText={(formErrors.intended_dataset_type ? formErrors.intended_dataset_type : "")}
                          inputProps={{style: {padding: "0.8em"}}}
                          // sx={ uuid ? { background: "rgba(0, 0, 0, 0.07)", padding: "0.15em"} : { padding: "0.15em"}}
                          disabled={!permissions.has_write_priv}
                          value={formValues.intended_dataset_type ? formValues.intended_dataset_type : ""}>
                          <option key={"DEFAULT"} value={""}></option>
                          {datasetMenu}  
                      </NativeSelect>
                      <FormHelperText id="organIDHelp" className="mb-3">Select the organ type that the data in this Upload is intended to be derived from.</FormHelperText>
                    </Grid>
                    <Grid item xs={4} >
                      <InputLabel htmlFor="anticipated_dataset_count">
                        Number
                      </InputLabel>
                      <TextField
                        id="anticipated_dataset_count"
                        fullWidth 
                        disabled={!permissions.has_write_priv}
                        sx={{ padding: "0.09em"}}
                        type="number"
                        helperText={(formErrors.anticipated_dataset_count ? formErrors.anticipated_dataset_count : "")}/>
                        <FormHelperText id="organIDHelp" className="mb-3">Anticipated number of datasets</FormHelperText>

                    </Grid>
                    
                  </Grid>
                </Box>

                {/* Group */}
                <Box className="mt-2 mb-3">           
                  <InputLabel htmlFor="group_uuid">
                    Group
                  </InputLabel>
                  <NativeSelect
                    id="group_uuid"
                    label="Group"
                    onChange={(e) => handleInputChange(e)}
                    fullWidth
                    disabled={uuid?true:false}
                    value={formValues.group_uuid ? formValues.group_uuid : defaultGroup}>
                    <GroupSelectMenu formValues={formValues} />
                  </NativeSelect>
                </Box>
              </Grid>
            </Grid>
          </div>
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
