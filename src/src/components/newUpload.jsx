import React, {useEffect, useState, useMemo} from "react";
import {useParams} from "react-router-dom";
import {
  ingest_api_allowable_edit_states, 
  ingest_api_create_upload,
  ingest_api_submit_upload,
  ingest_api_validate_entity,
  ingest_api_reorganize_upload,
  ingest_api_notify_slack
} from "../service/ingest_api";
import { ubkg_api_get_upload_dataset_types } from '../service/ubkg_api';
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_get_globus_url
} from "../service/entity_api";
import {RevertFeature} from "../utils/revertModal";
import {COLUMN_DEF_DATASET_MINI} from './search/table_constants';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LoadingButton from "@mui/lab/LoadingButton";
import Collapse from '@mui/material/Collapse';
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import FormHelperText from '@mui/material/FormHelperText';
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import Button from "@mui/material/Button";
import {FormHeader,UserGroupSelectMenu,EntityValidationMessage,SnackbarFeedback} from "./ui/formParts";
import {RenderPageError} from "../utils/error_helper";
import {Typography} from "@mui/material";
import {DataGrid} from "@mui/x-data-grid";
import dayjs from "dayjs";
import isBetween from "dayjs";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

export const UploadForm = (props) => {
  const [eValopen, setEValopen] = useState(true);
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  let [submitProcessModal, setSubmitProcessModal] = useState(false);
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
    anticipated_complete_upload_month: "",
    anticipated_dataset_count: "",
  });
  let[formErrors, setFormErrors] = useState({});
  let[valErrorMessages, setValErrorMessages] = useState([]); //form validation
  let[valMessage, setValMessage] = useState([]); //Entity Validation
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
  let[globusPath, setGlobusPath] = useState(null);
  let[datasetMenu, setDatasetMenu] = useState();
  let[expandVMessage, setExpandVMessage] = useState(false);
  const allGroups = JSON.parse(localStorage.getItem("allGroups"));
  let saveStatuses = ["submitted", "valid", "invalid", "error", "new"]
  // let validateStatuses = ["valid", "invalid", "error", "new", "incomplete"]
  let validateRestrictions = ["reorganized", "processing"]
  let[validationError, setValidationError] = useState(null);
  const{uuid} = useParams();
  dayjs.extend(isBetween);
  const [SWAT, setSWAT] = useState(false);
  const [MOSDAP, setMOSDAP] = useState(false);
  let projectPriorityValues=[
    {name: "SWAT (Integration Paper)",description: "For questions about the SWAT effort, email Ajay"},
    {name: "MOSDAP",description: "For questions about the MOSDAP effort, email Gloria Pryhuber"},
  ]

 
  // Organ Menu Build
  const organ_types = JSON.parse(localStorage.getItem("organs"));
  const organMenu = useMemo(() => {
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
              console.group("Entity Info");
              console.table(entityData);
              console.groupEnd();
              setEntityData(entityData)
              setFormValues({
                title: entityData.title,
                description: entityData.description,
                intended_organ: entityData.intended_organ,
                intended_dataset_type: entityData.intended_dataset_type,
                data_provider_group: entityData.data_provider_group,
                group_uuid: entityData.group_uuid,
                anticipated_dataset_count: entityData.anticipated_dataset_count,
                ...((entityData.ingest_task) && {ingest_task: entityData.ingest_task} ),
                ...((entityData.assigned_to_group_name) && {assigned_to_group_name: entityData.assigned_to_group_name} ),
                anticipated_complete_upload_month: entityData.anticipated_complete_upload_month,
              });

              entity_api_get_globus_url(uuid)
                .then((response) => {
                  setGlobusPath(response.results);
                }) //Nothing's wrong if this fails; no need to catch

              ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  setPermissions(response.results);
                  if(entityData.data_access_level === "public"){
                    setPermissions({
                      has_write_priv: false,
                    });
                  }
                })
                .catch((error) => {
                  wrapUp(error)
                });
            }
          }else{
            wrapUp(response)
          }
        })
        .catch((error) => {
          wrapUp(error)
        });
    }else{
      // URL Form Pre-fill
      let url = new URL(window.location.href);
      let params = Object.fromEntries(url.searchParams.entries());
      if(Object.keys(params).length > 0){
        console.debug('%c◉ URL params ', 'color:#00ff7b', params);
        setFormValues((prevValues) => ({
          ...prevValues,
          ...params
        }));
        setSnackbarController({
          open: true,
          message: "Passing Form values from URL parameters",
          status: "success"
        });
      }

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
        wrapUp(error);
      });
    setLoading(false);
  }, [uuid]);

  function handleInputChange(e, test){
    // console.debug('%c◉ e', 'color:#00ff7b', e);

    if(e && e.target){
      const{id, value} = e.target;
      setFormValues((prevValues) => ({
        ...prevValues,
        [id]: value,
      }));
    }else if (e && e.$d){
      let selectedDate = new Date(e.$d);
      setFormValues((prevValues) => ({
        ...prevValues,
        anticipated_complete_upload_month: dayjs(selectedDate).format("YYYY-MM")
      }));
    }
  }

  function validateForm(){
    setValidationError(null);
    setValErrorMessages(null);
    let errors = 0;
    console.debug('%c◉  Form Values:', 'color:#00ff7b' );
    console.table(formValues );

    // Requireds
    let requiredFields = ["title", "description", "intended_organ", "intended_dataset_type"]; 
    let e_messages=[]
    let newFormErrors = {};
    requiredFields.forEach(field => {
      if (!formValues[field] || formValues[field] === "") {
        let fieldName = document.getElementById([field]).getAttribute("name")
        newFormErrors[field] = true
        e_messages.push(fieldName+" is a required field");
        errors++;
      }
    });

    // Count is a #
    if(formValues.anticipated_dataset_count && isNaN(formValues.anticipated_dataset_count)){
      newFormErrors['anticipated_dataset_count'] = true;
      e_messages.push("Anticipated Dataset Count must be a number");
      errors++;
    }

    // They Could have Typed the Date... is it within range?
    if(formValues.anticipated_complete_upload_month && formValues.anticipated_complete_upload_month !== ""){
      const earliest = dayjs().subtract(1, 'day').startOf('M')
      const latest = dayjs('2026-12-31')
      const selectedDate = dayjs(formValues.anticipated_complete_upload_month, 'YYYY-MM').startOf('M')
      if(!selectedDate.isBetween(earliest, latest, 'day', '[)')){
        newFormErrors['anticipated_complete_upload_month'] = true;
        e_messages.push("Please select a date between "+earliest.format("YYYY-MM") + " and " + latest.format("YYYY-MM"));
      }
    }

    // Final Judgement
    setFormErrors(newFormErrors);
    setValErrorMessages(e_messages);
    console.debug('%c◉ newFormErrors ', 'color:#00ff7b', newFormErrors);
    if(errors>0){
     setValidationError("Please Review the following fields and try again.");
    }else{
      setValidationError(null);
    }    
    console.debug('%c◉ ERRORTEST ', 'color:#00ff7b', );
    // return false;
    return errors === 0;
  }

  function renderValidationMessage (){
    return (
      <Alert severity={entityData.status.toLowerCase() === "error" ? "error" : "warning"} >
        <AlertTitle>{entityData.status}</AlertTitle>
        {entityData.validation_message}
      </Alert>
    )
  }

  function processResults(response){
    console.debug('%c◉ ✅ Processing Results: ', 'color:#00ff7b', response);
    if (response.status === 200) {
      props.onUpdated(response.results);
    } else {
      wrapUp(response)
    }
  }

  function wrapUp(error){
    console.error('%c◉⚠️ WRAP UP ERROR: ', 'color:#ff005d', error);
    console.error(error.error.response.data);
    setPageErrors(error?.error?.response?.data ? error.error.response.data : error);
    setIsProcessing(false);
    setProcessingButton(false);
  }

  function openDataset(e){
      if (e.hasOwnProperty("row")) {
        let url = `${process.env.REACT_APP_URL}/dataset/${e.row.uuid}/`
        window.open(url, "_blank");
      }
    
  }

  function submitForm(e,target){
    e.preventDefault()    
    setIsProcessing(true);
    setProcessingButton(target)
    if(validateForm()){
      let selectedGroup = document.getElementById("group_uuid");
      let selectedGroupUUID = (!uuid && selectedGroup?.value) ? selectedGroup.value : "";
      let cleanForm ={
        title: formValues.title,
        description: formValues.description,
        intended_organ: formValues.intended_organ,
        intended_dataset_type: formValues.intended_dataset_type,
        ...((formValues.anticipated_complete_upload_month) && {anticipated_complete_upload_month: formValues.anticipated_complete_upload_month} ),
        ...((formValues.anticipated_dataset_count) && {anticipated_dataset_count: parseInt(formValues.anticipated_dataset_count)} ),
        ...(((formValues.assigned_to_group_name && formValues.assigned_to_group_name !== entityData.assigned_to_group_name) && permissions.has_admin_priv) && {assigned_to_group_name: formValues.assigned_to_group_name}),
        ...(((formValues.ingest_task && formValues.ingest_task !== entityData.ingest_task) && permissions.has_admin_priv) && {ingest_task: formValues.ingest_task}),
        ...((!uuid) && {group_uuid: selectedGroupUUID	}),
      }
      console.group("Form valid, sending following info:");
      console.table(cleanForm);
      console.groupEnd();

      switch(target){
        case "Create":
          console.debug('%c◉ Create ', 'color:#00ff7b');
          ingest_api_create_upload(JSON.stringify(cleanForm))
            .then((response) => {
              if(response.status === 200){
                props.onCreated(response.results);
              }else{
                wrapUp(response.error ? response.error : response);
              }
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
          // We open that follow up Modal first now,
          // then from THERE, continue submitting
          setSubmitProcessModal(false);
          // Lets grab the SWAT/MOSDAP checkboxes
          cleanForm.priority_project_list = [ SWAT?"SWAT (Integration Paper)":null, MOSDAP?"MOSDAP":null].filter(Boolean);
          ingest_api_submit_upload(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if(response.status === 200){
                var slackMessage = {"message": `Upload has been submitted (${process.env.REACT_APP_URL}/upload/${uuid})`}
                if(cleanForm.priority_project_list.length === 2){
                  slackMessage.message += `\nThis data will be used for the ${cleanForm.priority_project_list[0]} and ${cleanForm.priority_project_list[1]} projects.`
                }else if (cleanForm.priority_project_list.length === 1){
                  slackMessage.message += `\nThis data will be used for the ${cleanForm.priority_project_list[0]} project.`
                }
                console.debug('%c◉ slackMessage ', 'color:#00ff7b', slackMessage);
                ingest_api_notify_slack(slackMessage)
                  .then((slackRes) => {
                    if (slackRes.status === 200) {
                      processResults(response);
                    } else {
                      wrapUp(slackRes);
                    }
                  })
                  .catch((error) => {
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
          console.debug('%c◉ Validate ', 'color:#2158FF');
          ingest_api_validate_entity(uuid, "uploads")
            .then((response) => {
              console.debug("Response from validate", response);
              setValMessage(response);
              setEValopen(true)
              setProcessingButton(false);
            })
            .catch((error) => {
              console.debug('%c◉  error', 'color:#ff005d', error );
              console.debug('%c◉  error long', 'color:#ff005d', error?.data?.error );
                setValMessage(error?.data?.error || error);
                setProcessingButton(false);
              
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
      setProcessingButton(false);
      console.debug('%c◉ Invalid ', 'color:#ff005d');
    }
    
  }

  function submitModalOpen(){
    // We Need to Validate the whole thing first now I guess
    
    if(validateForm()){
      setSubmitProcessModal(true);
    }else{
      // Dont bother
    }
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
        <div style={{ width: "100%", }}>
          <DataGrid
            columnVisibilityModel={{
              uuid: false,
            }}
            className='associationTable w-100'
            rows={compiledCollection}
            columns={COLUMN_DEF_DATASET_MINI}
            disableColumnMenu={true}
            hideFooterPagination={true}
            hideFooterSelectedRowCount
            onCellClick={(e)=> openDataset(e)} 
            autoHeight
            rowCount={compiledCollection.length}
            loading={!compiledCollection.length > 0 && uuid}
            sx={{
              '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': {minHeight: '60px',overflowY: 'scroll!important',maxHeight: '350px'},
              background: "rgba(0, 0, 0, 0.04)",
              cursor: "cell!important",
              
              }}
          />
        </div>
      );
    }
  }

  function saveCheck(){
    // Slightly more compelx
    if(entityData && entityData.status){
      if(saveStatuses.includes(entityData.status.toLowerCase()) && (permissions.has_write_priv === true || permissions.has_admin_priv === true) ){
        return true
      }else{
        return false
      }
    }
  }

  function colorizeField(field) {
    return formErrors[field]
      ? "rgb(211, 47, 47)!important" // Error color
      : !permissions.has_write_priv
      ? "rgba(0, 0, 0, 0.3)!important" // Disabled color
      : "rgba(0, 0, 0, 0.6)!important"; // Default color
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
              onClick={(e) => submitForm(e,"Create")}
              loading={isProcessing}
              className="m-2"
              type="submit">
              Generate ID
            </LoadingButton>
          )}

          {uuid && uuid.length > 0 && permissions.has_admin_priv &&(
            <RevertFeature uuid={entityData ? entityData.uuid : null} type={entityData ? entityData.entity_type : 'entity'}/>
          )}

          {uuid && uuid.length > 0 && (permissions.has_write_priv || permissions.has_admin_priv) && (entityData.status && (entityData.status.toLowerCase() !== "reorganized" && entityData.status.toLowerCase() !== "submitted")) &&(
            <LoadingButton disaled={isProcessing.toString()} loading={processingButton === "Submit"} variant="contained" className="m-1" onClick={() => submitModalOpen()}>
              Submit
            </LoadingButton>
          )}

          {uuid && uuid.length > 0 && permissions.has_admin_priv && (entityData.status && entityData.status.toLowerCase() === "submitted") && (
            <LoadingButton disaled={isProcessing.toString()} loading={processingButton === "Reorganize"} variant="contained" className="m-1" onClick={(e) => submitForm(e,"Reorganize")}>
              Reorganize
            </LoadingButton>
          )}

          {/* For Uploads not in Published or Processing status (If Upload status is Published or Upload status is Processing do not enable) */}
          {uuid && uuid.length > 0 && permissions.has_admin_priv && (entityData.status && !validateRestrictions.includes(entityData.status.toLowerCase())) && (
            <LoadingButton disaled={isProcessing.toString()} loading={processingButton === "Validate"} variant="contained" className="m-1" onClick={(e) => submitForm(e,"Validate")}>
              Validate
            </LoadingButton>
          )}
          {uuid && uuid.length > 0 && saveCheck() === true && (
            <LoadingButton disabled={!saveCheck.toString()} loading={processingButton === "Save"} variant="contained" className="m-1" onClick={(e) => submitForm(e,"Save")}>
              Save
            </LoadingButton>
          )}
        </Box>

    );
  }

  function renderSubmitDialog(){
    return(
      <Dialog
        maxWidth='sm'
        onClose={() => setSubmitProcessModal(false)}
        aria-labelledby="customized-dialog-title"
        open={submitProcessModal}>
        <DialogTitle sx={{ m: 0, p: 2, background: "#444a65", color: "White" }} id="customized-dialog-title"> 
          Submitting Upload... 
        </DialogTitle>
          <IconButton
            sx={(theme) => ({
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            })}
            aria-label="close"
            onClick={() => setSubmitProcessModal(false)}>
            <CloseIcon />
          </IconButton>
        <DialogContent dividers>
          <Typography gutterBottom>This data will be used for:</Typography>
          <FormGroup>
            <Box>
              <FormControlLabel sx={{margin:"0px 10px"}} control={<Checkbox checked={SWAT} onChange={() => setSWAT(!SWAT)}/>} label={projectPriorityValues[0].name} />
              <Tooltip
                placement="top" 
                title={projectPriorityValues[0].description}
                slotProps={{
                  popper: {
                    modifiers: [{
                      name: 'offset',
                      options: {
                        offset: [0, -20],
                      }
                    }],
                  }
                }}>
                <Typography variant="caption" sx={{
                  position: "relative",
                  bottom: "5px",
                  right: "5px",}} >
                    <HelpOutlineOutlinedIcon style={{ fontSize: 16 }} />
                </Typography>
              </Tooltip>
            </Box>
            <Box>
              <FormControlLabel sx={{margin:"0px 10px"}} control={<Checkbox checked={MOSDAP} onChange={() => setMOSDAP(!MOSDAP)}/>} label={projectPriorityValues[1].name} />
              <Tooltip
                placement="top" 
                title={projectPriorityValues[1].description}
                slotProps={{
                  popper: {
                    modifiers: [{
                      name: 'offset',
                      options: {
                        offset: [0, -20],
                      }
                    }],
                  }
                }}>
                <Typography variant="caption" sx={{
                  position: "relative",
                  bottom: "5px",
                  right: "5px",}} >
                    <HelpOutlineOutlinedIcon style={{ fontSize: 16 }} />
                </Typography>
              </Tooltip>
            </Box>

          </FormGroup>
        </DialogContent>
        <DialogActions>
          
          <Button sx={{margin:"0 10px"}} onClick={() => setSubmitProcessModal(false)}>
            Cancel
          </Button>
          <Button sx={{margin:"0 10px"}} variant="contained" onClick={(e)=>submitForm(e,"Submit")}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    )
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
          <><Collapse in={expandVMessage} collapsedSize="50px" className="mt-3" sx={{border: "1px solid #f1aeae", borderRadius: "4px", }}>
            {renderValidationMessage()}
          </Collapse> 
          <Button startIcon={ !expandVMessage ? <ExpandMoreIcon /> : <ExpandLessIcon /> } size="small" variant="text" onClick={()=>setExpandVMessage(!expandVMessage)} sx={{float: "right"}}>
            Click to { !expandVMessage ? "View All" : "Collapse" }
          </Button></>
        )}
        <form onSubmit={(e) => submitForm(e,"Create")}>
          <TextField //"Title "
            id="title"
            label="Title "
            name="Title "
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
            name="Description "
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
              <InputLabel 
                className="mb-1"
                sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="datasets">
                Datasets
              </InputLabel>
              {renderDatasets()}
            </>
          )}
          
          <div className="row mt-3">
                
            {/* Organ */}
            <Box className={` col-6 ${formErrors.intended_organ ? "invalid" : "valid"}`} >           
              <InputLabel sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="organ">
                Intended Organ Type *
              </InputLabel>
              <NativeSelect
                  id="intended_organ"
                  name="Intended Organ"
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  required
                  error={formErrors.intended_organ}
                  inputProps={{style: {padding: "0.8em"}}}
                  disabled={!permissions.has_write_priv}
                  value={formValues.intended_organ ? formValues.intended_organ : ""}>
                  <option key={"DEFAULT"} value={""}></option>
                  {organMenu}  
              </NativeSelect>
              <FormHelperText id="organIDHelp" className="" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} >Select the organ type that the data in this Upload is intended to be derived from. {formErrors.intended_organ ? formErrors.intended_organ : ""} </FormHelperText>
              {formValues.intended_organ && !organ_types[formValues.intended_organ] && (
                <Alert variant="filled" severity="error">
                  <strong>Error:</strong> {`Invalid organ type stored: ${formValues.intended_organ}`}
                </Alert>
              )}
            </Box>

            {/* Dataset */}
            <Box className=" col-6" > 
              <Grid container spacing={2}>
                <Grid item xs={12} className={`${formErrors.intended_dataset_type ? "invalid" : "valid"}`} >
                  <InputLabel sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}} htmlFor="intended_dataset_type">
                    Intended Dataset Type *
                  </InputLabel>
                  <NativeSelect
                      id="intended_dataset_type"
                      required
                      onChange={(e) => handleInputChange(e)}
                      fullWidth
                      name="Intended Dataset Type"
                      error={formErrors.intended_dataset_type}
                      // helperText={(formErrors.intended_dataset_type ? formErrors.intended_dataset_type : "aaaa")}
                      inputProps={{style: {padding: "0.8em"}}}
                      // sx={ uuid ? { background: "rgba(0, 0, 0, 0.07)", padding: "0.15em"} : { padding: "0.15em"}}
                      disabled={!permissions.has_write_priv}
                      value={formValues.intended_dataset_type ? formValues.intended_dataset_type : ""}>
                      <option key={"DEFAULT"} value={""}></option>
                      {datasetMenu}  
                  </NativeSelect>
                  <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>Select the organ type that the data in this Upload is intended to be derived from.</FormHelperText>
                </Grid>
                
              </Grid>
            </Box>

          </div>

          <div className="row mt-3">
            {/* DATE */}
            <Box className="col-6">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <InputLabel sx={{color: colorizeField("anticipated_complete_upload_month")}} htmlFor="anticipated_complete_upload_month">
                    Anticipated Completion Month/Year
                </InputLabel>
                <Box>
                  <DatePicker
                    openTo="month"
                    clearable
                    value={(formValues && formValues.anticipated_complete_upload_month) ? dayjs(formValues.anticipated_complete_upload_month, "YYYY-MM") : dayjs("")}
                    onChange={(e) => handleInputChange(e)}
                    format="YYYY-MM"
                    views={['year', 'month']}
                    id="anticipated_complete_upload_month"
                    disablePast 
                    slotProps={{ field: { clearable: true, error: false, fullWidth: true } }}
                    sx={{color: colorizeField("anticipated_complete_upload_month"), borderRadius: "4px", outline: formErrors.anticipated_complete_upload_month ? "1px solid red" : "none"}}
                    maxDate={dayjs("2026-12-31")}
                    disableHighlightToday
                    disabled={!permissions.has_write_priv}/>
                </Box>
              </LocalizationProvider>
              <FormHelperText sx={{color: colorizeField("anticipated_complete_upload_month")}} id="monthYearIDHelp" className="mb-3">The month and year of that this Upload will have all required data uploaded and be ready for reorganization into Datasets.</FormHelperText>
            </Box>

            <Box className="col-6">

              <TextField //"Title "
                id="anticipated_dataset_count"
                label="Anticipated Number of Datasets "
                name="Anticipated Number of Datasets "
                helperText={"The total number of datasets that this Upload will eventually contain."}
                value={formValues ? formValues.anticipated_dataset_count : ""}
                error={formErrors.anticipated_dataset_count}
                InputLabelProps={{shrink: ((uuid || (formValues?.anticipated_dataset_count )) ? true:false)}}
                onChange={(e) => handleInputChange(e)}
                fullWidth
                disabled={!permissions.has_write_priv}
                className="my-3"/>
            </Box>
          </div>

          <div className={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false ? "taskAssignment disabled row my-3" : "row my-3"}>
            {/* TASK ASSIGNMENT */}
            {uuid && (<>
                <Box className={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false ? "col-6 taskAssignment disabled" : "col-6"}>
                  <InputLabel htmlFor="ingest_task" >
                    Ingest Task
                  </InputLabel>
                  <TextField //" Ingest Task "
                    id="ingest_task"
                    value={formValues ? formValues.ingest_task : ""}
                    error={formErrors.ingest_task}
                    InputLabelProps={{shrink: ((uuid || (formValues?.ingest_task)) ? true:false)}}
                    onChange={(e) => handleInputChange(e)}
                    fullWidth
                    disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false }
                    className="taskInputStyling"/>
                    <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>The next task in the data ingest process.</FormHelperText>
                </Box>
                
                <Box className="col-6 ">
                  <InputLabel htmlFor="assigned_to_group_name">
                    Assigned to Group
                  </InputLabel>
                  <NativeSelect
                    id="assigned_to_group_name"
                    onChange={(e) => handleInputChange(e)}
                    fullWidth
                    inputProps={{style: {padding: "0.8em"}}}
                    className="taskInputStyling"
                    disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false }
                    value={formValues.assigned_to_group_name ? formValues.assigned_to_group_name : ""}>
                      <option key={"0000"} value={""}></option>
                      {allGroups.map(group => (
                        <option key={group.uuid} value={group.displayname}>
                          {group.displayname}
                        </option>
                      ))}
                  </NativeSelect>
                  <FormHelperText disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false ? true : false }>The group responsible for the next step in the data ingest process.</FormHelperText>
                </Box>
              
              </>)}

              {/* Group */}
              {/* Data is viewable in form header & cannot be changed, so only show on Creation */}
              {!uuid && (
                <Box className="mb-3 col-6">           
                  <InputLabel htmlFor="group_uuid" sx={permissions.has_write_priv ? {color: "rgba(0, 0, 0, 0.6)"} : {color: "rgba(0, 0, 0, 0.3)"}}>
                    Group
                  </InputLabel>
                  <NativeSelect
                    id="group_uuid"
                    label="Group"
                    onChange={(e) => handleInputChange(e)}
                    fullWidth
                    disabled={uuid?true:false}
                    value={formValues.group_uuid ? formValues.group_uuid : ""}>
                    <option key={"0"} value={null}></option>
                    <UserGroupSelectMenu formValues={formValues} />
                  </NativeSelect>
                </Box>
              )}
           
          </div>
          
          {validationError && (<>
            <Alert severity="error">
              <AlertTitle>Please Review the following problems:</AlertTitle>
              {valErrorMessages.map(error => (
                <Typography >
                  {error}
                </Typography>
              ))}
            </Alert>
            </>)}

          {buttonEngine()}
        </form>

        {renderSubmitDialog()}
        
        {valMessage?.status && (
          <EntityValidationMessage
            response={valMessage}
            eValopen={eValopen}
            setEValopen={setEValopen}
          />
        )}

        {pageErrors && (
          <>{RenderPageError(pageErrors)}</>
        )}

        <SnackbarFeedback snackbarController={snackbarController} setSnackbarController={setSnackbarController}/>

      </Box>
    );
  }
}
