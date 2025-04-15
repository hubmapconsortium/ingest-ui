import React, {useEffect, useState, useMemo} from "react";
import {useParams} from "react-router-dom";
import {
  ingest_api_allowable_edit_states, 
  ingest_api_submit_upload,
  ingest_api_validate_upload,
  ingest_api_reorganize_upload,
  ingest_api_notify_slack
} from "../service/ingest_api";
import { ubkg_api_get_upload_dataset_types } from '../service/ubkg_api';
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
  entity_api_get_globus_url
} from "../service/entity_api";
import {
  validateRequired,
  validateProtocolIODOI,
  validateSingleProtocolIODOI
} from "../utils/validators";
import {getPublishStatusColor} from "../utils/badgeClasses";
import {RevertFeature} from "../utils/revertModal";
import {COLUMN_DEF_DATASET_MINI} from './search/table_constants';

import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import FormHelperText from '@mui/material/FormHelperText';
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Button from "@mui/material/Button";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StaticDatePicker } from "@mui/x-date-pickers/StaticDatePicker";
import {FormHeader,UserGroupSelectMenu} from "./ui/formParts";
import {Typography} from "@mui/material";
import {DataGrid,GridToolbar,GridEventListener} from "@mui/x-data-grid";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

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
    anticipated_complete_upload_month_string: null,
    anticipated_complete_upload_month_date: null,
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
  let[processingButton, setProcessingButton] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[formErrors, setFormErrors] = useState({});
  let[globusPath, setGlobusPath] = useState(null);
  let[datasetMenu, setDatasetMenu] = useState();
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const allGroups = JSON.parse(localStorage.getItem("allGroups"));
  const defaultGroupUUID = userGroups[0].uuid;
  const defaultGroupName = userGroups[0].shortname;
  const{uuid} = useParams();
  let saveStatuses = ["submitted", "valid", "invalid", "error", "new"]
  let validateStatuses = ["valid", "invalid", "error", "new", "incomplete"]
  let[validationError, setValidationError] = useState(null);
  
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
              // Are we sure we're loading an Upload?
              // @TODO: Move this sort of handling/detection to the outer app, or into component
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            }else{
              const entityData = response.results;
              console.debug('%c◉ entityData.anticipated_complete_upload_month ', 'color:#00ff7b', entityData.anticipated_complete_upload_month);
              let formattedDate = dayjs(entityData.anticipated_complete_upload_month, "YYYY-MM");
              console.debug('%c◉ formattedDate ', 'color:#D17BFF', formattedDate, entityData.anticipated_complete_upload_month);
              console.debug('%c◉ $D  ', 'color:#D17BFF', formattedDate["$d"]);
              setEntityData({
                ...entityData,
                anticipated_complete_upload_month_string: formattedDate["$d"],
              });
              console.debug('%c◉ assigned_to_group_name ', 'color:#00ff7b', entityData.assigned_to_group_name);
              setFormValues({
                title: entityData.title,
                description: entityData.description,
                intended_organ: entityData.intended_organ,
                intended_dataset_type: entityData.intended_dataset_type,
                data_provider_group: entityData.data_provider_group,
                anticipated_complete_upload_month_string: entityData.anticipated_complete_upload_month,
                anticipated_complete_upload_month_date: formattedDate["$d"],
                anticipated_dataset_count: entityData.anticipated_dataset_count,
                ...((entityData.ingest_task) && {ingest_task: entityData.ingest_task} ),
                ...((entityData.assigned_to_group_name) && {assigned_to_group_name: entityData.assigned_to_group_name} ),
              });
              entity_api_get_globus_url(uuid)
                .then((response) => {
                  console.debug('%c◉ GLOBUS PATH: ', 'color:#00ff7b', response.results);
                  setGlobusPath(response.results);
                })
                .catch((error) => {
                  console.error("entity_api_get_globus_url ERROR", error);
                })

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
                  if(response.results.has_write_priv === false && (entityData.anticipated_complete_upload_month ===undefined || entityData.anticipated_complete_upload_month === null)){
                    var targetHTML = document.getElementsByClassName("MuiPickersCalendarHeader-label"); 
                    if(targetHTML && targetHTML[0]){targetHTML[0].innerHTML = "No Date Set";}
                  }
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
      var targetHTML = document.getElementsByClassName("MuiPickersCalendarHeader-label"); 
      setTimeout(() => {
        if(targetHTML && targetHTML[0]){targetHTML[0].innerHTML = "No Date Set";}
      }, 1000);
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
      let unFormattedDate = selectedDate.getFullYear() + "-" + (monthFix);
      let formattedDate = dayjs(unFormattedDate, "YYYY-MM");
      console.debug('%c◉ ym ', 'color:#00ff7b', formattedDate["$d"], formattedDate, unFormattedDate);
      setFormValues((prevValues) => ({
        ...prevValues,
        anticipated_complete_upload_month_string: unFormattedDate,
        anticipated_complete_upload_month_date: formattedDate,
      }));
    }
  }

  function validateForm(){
    let errors = 0;
    // Browser handles requireds UNLESS we're not using the baked in form submit
    let requiredFields = ["title", "description", "intended_organ", "intended_dataset_type"]; 
    let newFormErrors = {};
    requiredFields.forEach(field => {
      if (!formValues[field] || formValues[field] === "") {
        newFormErrors[field] = true;
        errors++;
      }
    });
    
    setFormErrors(prevValues => ({
      ...prevValues,
      ...newFormErrors,
    }));
    
    if(errors > 0){
      setValidationError("Please Fill In the required Fields: " + requiredFields.join(", "));
    }
    
    console.debug('%c◉ errors: ', 'color:#00ff7b', errors);
    // picker itself handles date
    // cant select invalids from dropdowns
    // so I think we're good here?
    return errors === 0;
  }

  function renderValidationMessage (){
    return (
      <Alert severity={entityData.status.toLowerCase() === "error" ? "error" : "warning"}>
        <AlertTitle>{entityData.status}</AlertTitle>
        {entityData.validation_message}
      </Alert>
    )
  }

  function processResults(response){
    if (response.status === 200) {
      props.onUpdated(response.results);
    } else {
      console.error('%c◉ error ', 'color:#ff005d', response);
    }
  }

  function processForm(e,target){
    console.debug('%c◉ target ', 'color:#00ff7b', target);
    e.preventDefault()    
    setIsProcessing(true);
    setProcessingButton(target)
    if(validateForm()){
      let cleanForm ={
        title: formValues.title,
        description: formValues.description,
        intended_organ: formValues.intended_organ,
        intended_dataset_type: formValues.intended_dataset_type,
        ...((formValues.anticipated_complete_upload_month_string) && {anticipated_complete_upload_month: formValues.anticipated_complete_upload_month_string} ),
        ...((formValues.anticipated_dataset_count) && {anticipated_dataset_count: parseInt(formValues.anticipated_dataset_count)} ),
        ...(((formValues.assigned_to_group_name && formValues.assigned_to_group_name !== entityData.assigned_to_group_name) && permissions.has_admin_priv) && {assigned_to_group_name: formValues.assigned_to_group_name}),
        ...(((formValues.ingest_task && formValues.ingest_task !== entityData.ingest_task) && permissions.has_admin_priv) && {ingest_task: formValues.ingest_task}),
      }

      switch(target){
        case "Create":
          console.debug('%c◉ Create ', 'color:#00ff7b');
          entity_api_create_entity("upload",JSON.stringify(cleanForm))
            .then((response) => {
              processResults(response);
            })
            .catch((error) => {
              wrapUp(error)
            });
          break;

        case "Save":
          console.debug('%c◉ Save ', 'color:#00ff7b');
          entity_api_update_entity(uuid,JSON.stringify(cleanForm))
            .then((response) => {
              processResults(response);
            })
            .catch((error) => {
              wrapUp(error)
            });
          break;

        case "Submit":
          console.debug('%c◉ Submit ', 'color:#00ff7b');
          ingest_api_submit_upload(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if(response.status === 200){
                console.debug('%c◉ response ', 'color:#00ff7b', response);
                var ingestURL= `${process.env.REACT_APP_URL}/upload/${uuid}`;
                var slackMessage = {"message": "Upload has been submitted ("+ingestURL+")"}
                ingest_api_notify_slack(slackMessage)
                  .then((slackRes) => {
                    console.debug('%c◉ slackRes` ', 'color:#00ff7b', slackRes);
                    if (slackRes.status === 200) {
                      processResults(response);
                    } else {
                      console.debug('%c◉ SLAXCK MESSAGE ERROR ', 'color:#ff005d', slackRes);
                      wrapUp(slackRes);
                    }
                  })
                  .catch((error) => {
                    console.debug('%c◉  ingest_api_notify_slack error', 'color:#ff005d', error);
                    wrapUp(error);
                  })
              }else{
                wrapUp(response.results)
              }
            })
            .catch((error) => {
              wrapUp(error)
            });
          break;
         
        case "Validate":
          console.debug('%c◉ Validate ', 'color:#00ff7b');
          ingest_api_validate_upload(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              processResults(response);
            })
            .catch((error) => {
              wrapUp(error)
            });
          break;

        case "Reorganize":
          console.debug('%c◉ Reorganize ', 'color:#00ff7b');
          ingest_api_reorganize_upload(uuid)
            .then((response) => {
              processResults(response)
            })
            .catch((error) => {
              wrapUp(error)
            });
          break;

        default:
          console.debug('%c◉ Default ', 'color:#00ff7b');
          break;
      }

    }else{

      setIsProcessing(false);
      console.debug('%c◉ Invalid ', 'color:#ff005d');
    }
    
  }

  function wrapUp(error){
    setPageErrors(error);
    setIsProcessing(false);
  }

  function clearDate(){
    setFormValues((prevValues) => ({
      ...prevValues,
      anticipated_complete_upload_month_string: null,
      anticipated_complete_upload_month_date: null,
    }));
    console.debug('%c◉ ClearDate Trigger ', 'color:#00ff7b');
    var targetHTML = document.getElementsByClassName("MuiPickersCalendarHeader-label"); 
    targetHTML[0].innerHTML = "No Date Set";
  }

  function renderDatasets(){
    if(entityData.datasets && entityData.datasets.length > 0 ){
      // @TODO: use the Datatables used elsewhere across the site 
      var compiledCollection = [];
      for (var i in entityData.datasets){
        compiledCollection.push({
          hubmap_id: entityData.datasets[i].hubmap_id,
          lab_dataset_id: entityData.datasets[i].lab_dataset_id,
          group_name: entityData.datasets[i].group_name,
          status: entityData.datasets[i].status,
          uuid: entityData.datasets[i].uuid,
          id: entityData.datasets[i].uuid
        });
      }
      return (
        <div style={{ width: "100%", maxHeight: "340px", overflowX: "auto", padding: "10px 0" }}>
          <DataGrid
            columnVisibilityModel={{
              uuid: false,
            }}
            className='associationTable w-100'
            rows={compiledCollection}
            rowHeight={75 }
            columns={COLUMN_DEF_DATASET_MINI}
            disableColumnMenu={true}
            hideFooterPagination={true}
            hideFooterSelectedRowCount
            rowCount={compiledCollection.length}
            // onCellClick={handleEvent}
            loading={!compiledCollection.length > 0 && uuid}
            sx={{'.MuiDataGrid-main > .MuiDataGrid-virtualScroller': {minHeight: '60px'},
            }}
          />
        </div>
      );
    }
  }

  function saveCheck(){
    // Slightly more compelx
    if(entityData && entityData.status){
      if((saveStatuses.includes(entityData.status.toLowerCase()) && permissions.has_write_priv) || permissions.has_admin_priv ){
        return true
      }else{
        return false
      }
    }
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
              onClick={(e) => processForm(e,"Create")}
              loading={isProcessing}
              className="m-2"
              type="submit">
              Generate ID
            </LoadingButton>
          )}

          {uuid && uuid.length > 0 && permissions.has_admin_priv &&(
            <RevertFeature uuid={entityData ? entityData.uuid : null} type={entityData ? entityData.entity_type : 'entity'}/>
          )}
          {uuid && uuid.length > 0 && (permissions.has_write_priv || permissions.has_admin_priv) && (entityData.status.toLowerCase() === "valid") &&(
            <LoadingButton disaled={isProcessing} loading={processingButton === "Submit"} variant="contained" className="m-1" onClick={(e) => processForm(e,"Submit")}>
              Submit
            </LoadingButton>
          )}
          {uuid && uuid.length > 0 && permissions.has_admin_priv && entityData.status.toLowerCase() === "submitted" && (
            <LoadingButton disaled={isProcessing} loading={processingButton === "Reorganize"} variant="contained" className="m-1" onClick={(e) => processForm(e,"Reorganize")}>
              Reorganize
            </LoadingButton>
          )}
          {uuid && uuid.length > 0 && permissions.has_admin_priv && validateStatuses.includes(entityData.status.toLowerCase()) && (
            <LoadingButton disaled={isProcessing} loading={processingButton === "Validate"} variant="contained" className="m-1" onClick={(e) => processForm(e,"Validate")}>
              Validate
            </LoadingButton>
          )}
          {uuid && uuid.length > 0 && saveCheck() === true && (
            <LoadingButton loading={isProcessing} variant="contained" className="m-1" onClick={(e) => processForm(e,"Save")}>
              Save
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
          <FormHeader entityData={uuid ? entityData : ["new","Upload"]} permissions={permissions} globusURL={globusPath?globusPath:null}/>
        </Grid>
        { entityData.status && (entityData.status.toLowerCase() === "error" || entityData.status.toLowerCase() === "invalid" ) && entityData.validation_message && (
          <Box className="my-3" sx={{border: "1px solid #f1aeae", borderRadius: "4px"}}>
            {renderValidationMessage()}
          </Box> 
        )}
        <form onSubmit={(e) => processForm(e,"Create")}>
          <TextField //"Title "
            id="title"
            label="Title "
            required
            helperText={"A name for this upload. This will be used internally by Consortium members for the purposes of finding this Data Upload"}
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
            helperText={"A full description of this Data Upload which will be used internally by the Consortium (not displayed publicly) for the purposes of searching for the Data Upload."}
            value={formValues ? formValues.description : ""}
            error={formErrors.description}
            InputLabelProps={{shrink: ((uuid || (formValues?.description)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            className="my-3"
            multiline
            rows={4}/>

          {entityData.datasets && (
            <>
              <Typography sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                Datasets
              </Typography>
              {renderDatasets()}
            </>
          )}
          
          <div className="row mt-3">
            <Grid container spacing={2}>
              
              <Grid item sm={8} md={6} lg={5} xl={4} >

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <InputLabel sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="anticipated_complete_upload_month_string">
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
                      id="anticipated_complete_upload_month_string"
                      displayStaticWrapperAs="desktop"
                      className="col-12"
                      orientation="landscape"
                      openTo="month"
                      disableHighlightToday
                      showToolbar={false}
                      maxDate={dayjs("2026-12-31")}
                      label=" "
                      views={["year", "month"]}
                      value={formValues.anticipated_complete_upload_month_date ? formValues.anticipated_complete_upload_month_date : null}
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
                      onClick={(e) => clearDate(e)}>
                      Clear
                    </Button>
                  </Box>
                </LocalizationProvider>
                <FormHelperText id="monthYearIDHelp" className="mb-3">The month and year of that this Upload will have all required data uploaded and be ready for reorganization into Datasets.</FormHelperText>
              </Grid>

              <Grid item sm={4} md={6} lg={7} xl={8} >
                
                {/* Organ */}
                <Box className={`mb-4 ${formErrors.intended_organ ? "invalid" : "valid"}`} >           
                  <InputLabel sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="organ">
                    Intended Organ Type *
                  </InputLabel>
                  <NativeSelect
                      id="intended_organ"
                      onChange={(e) => handleInputChange(e)}
                      fullWidth
                      required
                      error={formErrors.intended_organ}
                      helperText={(formErrors.intended_organ ? formErrors.intended_organ : "")}
                      inputProps={{style: {padding: "0.8em"}}}
                      disabled={!permissions.has_write_priv}
                      // sx={ uuid ? { background: "rgba(0, 0, 0, 0.07)"} : {}}
                      value={formValues.intended_organ ? formValues.intended_organ : ""}>
                      <option key={"DEFAULT"} value={""}></option>
                      {organMenu}  
                  </NativeSelect>
                  <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} >Select the organ type that the data in this Upload is intended to be derived from. {formErrors.intended_organ ? formErrors.intended_organ : ""} </FormHelperText>
                  {formValues.intended_organ && !organ_types[formValues.intended_organ] && (
                    <Alert variant="filled" severity="error">
                      <strong>Error:</strong> {`Invalid organ type stored: ${formValues.intended_organ}`}
                    </Alert>
                  )}
                </Box>

                {/* Dataset */}
                <Box className="mt-4" > 
                  <Grid container spacing={2}>
                    <Grid item xs={8} className={`${formErrors.intended_organ ? "invalid" : "valid"}`} >
                      <InputLabel sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="intended_dataset_type">
                        Intended Dataset Type *
                      </InputLabel>
                      <NativeSelect
                          id="intended_dataset_type"
                          required
                          onChange={(e) => handleInputChange(e)}
                          fullWidth
                          error={formErrors.intended_dataset_type}
                          helperText={(formErrors.intended_dataset_type ? formErrors.intended_dataset_type : "")}
                          inputProps={{style: {padding: "0.8em"}}}
                          // sx={ uuid ? { background: "rgba(0, 0, 0, 0.07)", padding: "0.15em"} : { padding: "0.15em"}}
                          disabled={!permissions.has_write_priv}
                          value={formValues.intended_dataset_type ? formValues.intended_dataset_type : ""}>
                          <option key={"DEFAULT"} value={""}></option>
                          {datasetMenu}  
                      </NativeSelect>
                      <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>Select the organ type that the data in this Upload is intended to be derived from.</FormHelperText>
                    </Grid>
                    <Grid item xs={4} >
                      <InputLabel htmlFor="anticipated_dataset_count" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                        Number
                      </InputLabel>
                      <TextField
                        id="anticipated_dataset_count"
                        fullWidth 
                        onChange={(e) => handleInputChange(e)}
                        disabled={!permissions.has_write_priv}
                        sx={{ padding: "0.09em"}}
                        type="number"
                        value={formValues.anticipated_dataset_count ? formValues.anticipated_dataset_count : ""}/>
                        <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>Anticipated number of datasets</FormHelperText>
                    </Grid>
                    
                  </Grid>
                </Box>

                {/* Group */}
                <Box className="mt-2 mb-3">           
                  <InputLabel htmlFor="group_uuid" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                    Group
                  </InputLabel>
                  <NativeSelect
                    id="group_uuid"
                    label="Group"
                    onChange={(e) => handleInputChange(e)}
                    fullWidth
                    disabled={uuid?true:false}
                    value={formValues.group_uuid ? formValues.group_uuid : defaultGroupUUID}>
                    <option key={"0"} value={null}></option>
                    <UserGroupSelectMenu formValues={formValues} />
                  </NativeSelect>
                </Box>
              </Grid>
            </Grid>
          </div>

          {uuid && (
            <Grid container className="my-4 row">
              <Grid item className='form-group col-6'> 
                <InputLabel htmlFor="group_uuid" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                  Assigned to Group
                </InputLabel>
                <NativeSelect
                  id="assigned_to_group_name"
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  sx={{marginTop: "40px"}}
                  disabled={!permissions.has_admin_priv}
                  value={formValues.assigned_to_group_name ? formValues.assigned_to_group_name : defaultGroupName}>
                  {allGroups.map(group => (
                    <option key={group.uuid} value={group.shortName}>
                      {group.shortName}
                    </option>
                  ))}
                </NativeSelect>
                <FormHelperText sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>The group responsible for the next step in the data ingest process.</FormHelperText>
              </Grid>
              <Grid item className='form-group col-6'> 
                <InputLabel htmlFor="group_uuid" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                  Ingest Task
                </InputLabel>
                <TextField //" Ingest Task "
                  id="ingest_task"
                  // label="Ingest Task"
                  helperText="The next task in the data ingest process."
                  value={formValues ? formValues.ingest_task : ""}
                  error={formErrors.ingest_task}
                  InputLabelProps={{shrink: ((uuid || (formValues?.ingest_task)) ? true:false)}}
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  disabled={!permissions.has_admin_priv}
                  className="mt-3"/>
              </Grid>
            </Grid>
          )}

          {validationError && (
            <Alert variant="filled" severity="error">
              <strong>Error:</strong> {JSON.stringify(validationError)}
            </Alert>
          )}

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
