import {useNavigate} from "react-router-dom";
import ArticleIcon from '@mui/icons-material/Article';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import ClearIcon from "@mui/icons-material/Clear";
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import LoadingButton from '@mui/lab/LoadingButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarningIcon from '@mui/icons-material/Warning';
import {Typography} from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBell, faHeadset, faCircleExclamation, faUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";
import Grid from '@mui/material/Grid';
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from '@mui/material/NativeSelect';
import Snackbar from '@mui/material/Snackbar';
import Tooltip from '@mui/material/Tooltip';
import React from "react";
import {SAMPLE_CATEGORIES} from "../../constants";
import {tsToDate} from "../../utils/string_helper";
import HIPPA from "./HIPPA";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';
import TextField from "@mui/material/TextField";
import FormHelperText from "@mui/material/FormHelperText";
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

// The header on all of the Forms (The top bit)
export const FormHeader = (props) => {
  let entityData = props.entityData;
  let details = (props.entityData[0]!=="new") ? `${entityData.entity_type}: ${entityData.hubmap_id}` : `New ${props.entityData[1]}`;
  let permissions = props.permissions;
  let globusURL = props.globusURL;
  // console.debug('%c◉ FormHeader ', 'color:#00ff7b', entityData,permissions,globusURL);
  document.title = `HuBMAP Ingest Portal | ${details}`; //@TODO - somehow handle this detection in App
  let entityType = entityData.entity_type ? entityData.entity_type : entityData[1];
  if (entityType === "Epicollection"){
    entityType = "EPICollection"
  }
  return (
    <Grid container className="FormHead" sx={{marginBottom: "5px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px"}}>
      {entityData[0] !== "new" && (
        <Grid item xs={12} className="topHeader" > 
          <h3 style={{marginLeft: "-2px"}}>{IconSelection(entityType)} {entityType} Information</h3>
        </Grid>
      )}
      {topHeader(entityData, entityType)}
      {infoPanels(entityData,permissions,globusURL)}
    </Grid>
  )
}

// Returns a styalized Icon based on the Entity Type & Status 
export function IconSelection(entity_type,status){  
  let style = {fontSize: "1.5em", "verticalAlign": "text-bottom"}
  let newSX={"&&": {color: status?"white":""}}
  switch
  (entity_type && entity_type.toLowerCase()){
    case "donor":
      return <PersonIcon style={style} sx={newSX} />
    case "sample":
      return <BubbleChartIcon style={style} sx={newSX} />
    case "dataset":
      return <TableChartIcon style={style} sx={newSX} />
    case "upload":
      return <DriveFolderUploadIcon style={style} sx={newSX} />
    case "publication":
      return <ArticleIcon style={style} sx={newSX} />
    case "collection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    case "eppicollection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    default:
      return <BubbleChartIcon style={style} />
  }
}

// Returns the badge class associated with provided status
export function badgeClass(status){
  // console.debug('%c◉ badgeClass status ', 'color:#00ff7b', status);
  var badge_class = "";
  if(status=== undefined || !status){
    badge_class = "badge-danger";
    // console.log("No Status Value for this unit ");
  }else{
	switch (status.toUpperCase()){
    case "NEW":
      badge_class = "badge-purple";
      break;
    case "REOPENED":
      badge_class = "badge-purple";
      break;
    case "REORGANIZED":
      badge_class = "badge-info";
      break;
    case "VALID":
      badge_class = "badge-success";
      break;
    case "INVALID":
      badge_class = "badge-danger";
      break;
    case "QA":
      badge_class = "badge-info";
      break;
    case "LOCKED":
      badge_class = "badge-secondary";
      break;
    case "PROCESSING":
      badge_class = "badge-secondary";
      break;
    case "PUBLISHED":
      badge_class = "badge-success";
      break;
    case "UNPUBLISHED":
      badge_class = "badge-light";
      break;
    case "DEPRECATED":
      break;
    case "ERROR":
      badge_class = "badge-danger";
      break;
    case "HOLD":
      badge_class = "badge-dark";
      break;
    case "SUBMITTED":
      badge_class = "badge-info";
      break;
    case "INCOMPLETE":
      badge_class = "badge-incomplete";
          break;
        default:
          break;
    }
    return badge_class;
  }
}

// Admin Tool for Assigning Tasks to Groups to Entities
export function TaskAssignment({
    uuid,
    permissions,
    entityData,
    formValues,
    formErrors,
    handleInputChange,
    allGroups
  }) {
  return (
    <Box sx={{ width: '100%', display: "flex", marginTop: "20px" }} >
      <Box sx={{ marginRight: "20px" }} className={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false ? "col-6 taskAssignment disabled" : "col-6"}>
        <InputLabel htmlFor="ingest_task">
          Ingest Task
        </InputLabel>
        <TextField
          id="ingest_task"
          name="ingest_task"
          value={formValues ? formValues.ingest_task : ""}
          error={formErrors.ingest_task}
          InputLabelProps={{ shrink: ((uuid || (formValues?.ingest_task)) ? true : false) }}
          onChange={handleInputChange}
          fullWidth
          disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false}
          className="taskInputStyling"
        />
        <FormHelperText id="organIDHelp" className="mb-3" sx={permissions.has_write_priv ? { color: "rgba(0, 0, 0, 0.6)" } : { color: "rgba(0, 0, 0, 0.3)" }}>
          The next task in the data ingest process.
        </FormHelperText>
      </Box>
      <Box className="col-6 ">
        <InputLabel htmlFor="assigned_to_group_name">
          Assigned to Group
        </InputLabel>
        <NativeSelect
          id="assigned_to_group_name"
          name="assigned_to_group_name"
          onChange={handleInputChange}
          fullWidth
          inputProps={{ style: { padding: "0.8em" } }}
          className="taskInputStyling"
          disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false}
          value={formValues.assigned_to_group_name ? formValues.assigned_to_group_name : ""}
        >
          <option key={"0000"} value={""}></option>
          {allGroups && allGroups.map(group => (
            <option key={group.uuid} value={group.displayname}>
              {group.displayname}
            </option>
          ))}
        </NativeSelect>
        <FormHelperText disabled={(permissions.has_admin_priv && entityData.status === "Reorganized") || permissions.has_admin_priv === false ? true : false}>
          The group responsible for the next step in the data ingest process.
        </FormHelperText>
      </Box>
    </Box>
  );
}

// Returns a styalized Globus Link Button
export function renderUploadLink(entityData){
  function handleUploadSelect(e, uuid){
    window.location.assign(`/upload/${uuid}`,);
  }
  return (
    <Box sx={{ display: "flex" }}>
      <Box sx={{ width: "100%" }}>
        <strong>
          This {entityData.entityType} is contained in the data Upload{" "}
        </strong>
        <Button
          variant="text"
          onClick={(e) => handleUploadSelect(e, entityData.upload.hubmap_id)}>
          {entityData.upload.hubmap_id}
        </Button>
      </Box>
    </Box>
  )
}

// Reusable helper to pre-fill form values from URL parameters
// NOTE: source_list is specifically handled inside the BulkSelector component itself
export function prefillFormValuesFromUrl(setFormValues, setSnackbarController) {
  const url = new URL(window.location.href);
  const params = Object.fromEntries(url.searchParams.entries());
  if (Object.keys(params).length > 0) {
    setFormValues((prevValues) => ({
      ...prevValues,
      ...params
    }));
    if (setSnackbarController) {
      setSnackbarController({
        open: true,
        message: "Passing Form values from URL parameters",
        status: "success"
      });
    }
  }
  return params;
}

// Not yet in use Modal similar to the one in the legacy forms that prompts for your group if you have multiple groups
// Considering switching back to this, saving for now
export function GroupModal ({
    submitWithGroup,
    showGroupSelect,
    closeGroupModal
  }){
    let userGroups = JSON.parse(localStorage.getItem("userGroups")) || [];
    return (
       <Dialog aria-labelledby="group-dialog" open={showGroupSelect}>
        <DialogTitle >
          You currently have multiple group assignments, Please select a primary group for submission
        </DialogTitle>
       <DialogContent>
          <select
            name="selected_group"
            id="selected_group"
            className="form-control">
            {userGroups
              .filter((g) => g.data_provider)  // only show those designated as data providers
              .map(g => {
              return (
                <option id={g.uuid} value={g.uuid} key={g.name}>
                  {g.displayname}
                </option>
              );
            })}
          </select>               
         </DialogContent>
           <DialogActions>
            <Button
            className="btn btn-primary mr-1"
            onClick={() => submitWithGroup()}>
            Submit
          </Button>
          <Button
           variant="outlined"
            onClick={() => closeGroupModal()}>
            Cancel
          </Button>          
          </DialogActions>
        </Dialog>
    
    );
}

// Styalized snackbar component rendering Error Notes for FeedbackDialog
function errorNote(){
  return (<>
    <Typography variant="caption" color={"#444a65"}>
      <strong><FontAwesomeIcon sx={{padding: "1.2em"}} icon={faHeadset}/></strong>If this message persists, please reach out to help@hubmapconsortium.org symbol beneith the table will re-launch this message
    </Typography>
  </>)
}

// Styalized Footnote component for FeedbackDialog
function noteWrap(note){
  return (
    <Typography variant="caption" color={"#444a65"}>
      <strong>Note: </strong>{note}
    </Typography>
  );
}

// Returns a Chip / Badge with status text and color based on status (using badgeClass for class)
export function StatusBadge(status){
  if (typeof status !== "string" && status.status){
    status = status.status.toString() ;
  }
  return (
    <Chip sx={{fontWeight: "bold", fontVariant:"all-small-caps"}} className={badgeClass(status)} label={status.toUpperCase()} size="small" />
  )
}

// Returns Special a Chip / Badge with NEW text and color (Purple)
function newBadge(type){
  // console.debug('%c◉ newBadge ', 'color:#00ff7b', type);
  let newBadgeStyle = {
    "&&": {color: "#ffffff!important"} ,
    fontWeight: "bold",
    color: "white",
    padding: "4px",
    fontSize: "1.2rem!important",
    height: "auto",
    display: "inlineTable",
    verticalAlign: "super",
  }
  return (  
    <Chip style={newBadgeStyle} className={badgeClass("NEW")} icon={IconSelection(type,"new")} label={"NEW"} size="small" />
  )
}

// SWAT / MOSDAP Helper to build a pretty list of priority projects
// The TopLeftmost part of the Form Header 
function topHeader(entityData, entityType){  
  if(entityData[0] !== "new"){
    return (
        <Grid item xs={6} className="entityDataHead" >
          <Typography><strong>HuBMAP ID:</strong> {entityData.hubmap_id}</Typography>
          {entityData.status && (
              <Typography><strong>Status: </strong> 
                <Tooltip
                  placement="bottom-start" 
                  title={
                    <Box>
                      <Typography variant="caption">
                      {entityData?.pipeline_message || "" }
                      </Typography><br />
                    </Box>}>
                  {entityData.status ? StatusBadge(entityData.status) : ""}
                  </Tooltip> 
                </Typography>   
            )}
          {entityData.priority_project_list	 && (
              <Typography variant="caption" sx={{display: "inline-block"}}>
                <strong>Priority Projects:</strong> {entityData.priority_project_list?.length > 1
                  ? entityData.priority_project_list.join(", ")
                  : entityData.priority_project_list?.[0]}
              </Typography>   
          )}
          <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Entered by: </strong> {entityData.created_by_user_email}</Typography>
          <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Group: </strong> {entityData.group_name}</Typography>
          {(entityData.entity_type === "Donor" || entityData.entity_type ==="Sample") && (
            <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Submission ID:  </strong> {entityData.submission_id}</Typography>
          )}
          <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Entry Date: </strong> {tsToDate(entityData.created_timestamp)}</Typography>   
        </Grid>
    ) 
  }else{
    return (
      <React.Fragment>
        <Grid item xs={["Upload","EPICollection"].includes(entityData[1]) ? 9 : 6} className="" >  
          {newBadge(entityData[1],"new")}
          <h3 style={{margin: "4px 5px", display: "inline-table",verticalAlign: "bottom"}}> Registering a new {entityType}</h3>
        </Grid>
        
        {entityData[1] === "Upload" && (
          <Grid item xs={6} className="" >
            <Typography sx={{marginRight: "10px"}} >
              Register a new Data Upload that will be used to bulk upload data, which will be organized by HIVE into multiple datasets. For more information about registering and uploading data see the <a href="https://docs.hubmapconsortium.org/data-submission/" target="_blank" >Data Submission Guide</a>.
            </Typography>
          </Grid>
        )}
        
      </React.Fragment>
    )
  }
}

// The Rightmost part of the Form Header
function infoPanels(entityData,permissions,globusURL){
  let HIPPATypes = ["donor","sample","upload"];
  const type = entityData?.entity_type ?? entityData?.[1];
  const isEPICollection = type === "EPICollection" || String(type).toLowerCase() === "epicollection";

  return (
    
    <Grid item xs={(isEPICollection && entityData[0]==="new" )? 3 : 6} className="">
      {globusURL&& (
        <Typography className="pb-1">
          <strong><big>
            <a href={globusURL}
              target='_blank'
              rel='noopener noreferrer'>   
                {(entityData.status && (entityData.status.toUpperCase() ==="REORGANIZED" || entityData.status.toUpperCase() ==="SUBMITTED")) && (
                  <>Open data repository {" "}</>
                )}
                {entityData.status && entityData.status.toUpperCase() !=="REORGANIZED" && entityData.status.toUpperCase() !=="SUBMITTED" && (
                  <>To add or modify data files go to the data repository {" "}</>
                )}
                <OpenInNewIcon />
            </a>
          </big></strong>
        </Typography>
      )}
      {permissions.has_write_priv && HIPPATypes.includes(entityData.entity_type) &&(
        <HIPPA />
      )}
    {entityData && ((entityData.data_access_level && entityData.data_access_level === "public") || (entityData.status && entityData.status === "Published")) && (
        // They might not have write access but not because of data_access_level
        <Alert severity="warning" 
          iconMapping={{warning: <WarningIcon style={{fontSize: "2em"}} />}}
          sx={{
            // minHeight: "100%",
            minWidth: "100%",
            padding: "10px"
          }}>
          This entity is no longer editable. It was locked when it became publicly
          acessible when data associated with it was published.
        </Alert>
      )}
      {entityData && (entityData.upload) &&(
        renderUploadLink(entityData)
      )}
      {entityData && (entityData.doi_url || entityData.registered_doi) &&(
        <Typography>
          <a href={entityData.doi_url} target='_blank' rel="noreferrer" >{entityData.doi_url || entityData.registered_doi} </a><FontAwesomeIcon style={{color: "rgb(10, 109, 255)", fontSize: "0.8em", marginLeft: "5px"}} icon={faUpRightFromSquare}/>
        </Typography>
      )}
      {!permissions.has_write_priv && !permissions.has_admin_priv && (
        <Alert  
          variant="caption" 
          severity="info" 
          sx={{
            color: "rgba(0, 0, 0, 0.38)",
            minWidth: "100%", 
            margin: "0px",
            padding: "0px",
          }}
          iconMapping={{
            warning: <WarningIcon style={{fontSize: "2em"}} />
          }} >
          You do not have permission to modify this item.
        </Alert>
      )}
     
    </Grid>
  )
}

// Looks at the Bulk Selector Table and returns an array of  all Hubmap IDs
// Used in HandleCopyFormUrl to populate source_list
function getHubmapIDsFromBulkTable() {
  const wrapper = document.getElementById('bulkTableWrapper');
  if (!wrapper) return [];
  const table = wrapper.querySelector('table');
  if (!table) return [];
  // Select all first-column <a> elements in table rows
  const idLinks = table.querySelectorAll('tbody tr td:first-child a');
  // console.log("idLinks",idLinks);
  return Array.from(idLinks).map(a => a.textContent.trim());
}

export function RenderSubmitModal({showSubmitModal, setIsSubmitModalOpen, submitting, handleSubmitAction}){
      return (
          <Dialog
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs" 
            aria-labelledby="submit-dialog" 
            open={showSubmitModal}>
            <DialogContent>
              <h4>Preparing to Submit</h4>
              <div>  Has all data for this dataset been <br/>
                1	&#41; validated locally, and  <br/>
                2	&#41; uploaded to the globus folder?</div>
           </DialogContent>
             <DialogActions>
             <LoadingButton 
                loading={submitting} 
                sx={{width:"150px"}} 
                loadingIndicator="Submitting..." 
                variant="outlined" 
                onClick={ (e) => handleSubmitAction(e)}>
              Submit
             </LoadingButton>
            <Button
              className="btn btn-secondary"
              onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>          
            </DialogActions>
          </Dialog>
      
      );
    }

// Returns a select menu of the User's dataprovider groups
// Possibly Deprecating with move of GroupsSelector into modal or Field managers
export function UserGroupSelectMenu(formValues){
  let userGroups = JSON.parse(localStorage.getItem("userGroups"));
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

// Checks if the entityType in the URL matches the type of entity requested
// if it's not, redirects you on over to the proper form
export function FormCheckRedirect(uuid,entityType,form){
  // console.debug('%c◉ FormCheckRedirect ', 'color:#ff0073', uuid,entityType,form);
  if(entityType !== form){
    // @TODO: Move this sort of handling/detection to the outer app, or into component
    window.location.replace(
      `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
    );
  }
}

// Prevents the Search Filter Restrictions from lingering & effecting the main Search View
export function combineTypeOptionsComplete(){
  // Removes the Whitelist / Blacklist stuff,
  // mostly for use for resetting the main Search Page View
  var combinedList = [];
  // FIRST: Main Entity Types
  combinedList.push( {  // @TODO: Find out why Importing Warps this
    donor: "Donor" ,
    sample: "Sample",
    dataset: "Dataset", 
    upload: "Data Upload",
    publication: "Publication",
    collection: "Collection"} );

  // NEXT: Sample Categories
  combinedList.push(SAMPLE_CATEGORIES);
  // @TODO: Switch these to UBKG too?
  // LAST: Organs
  let organs = [];
  let organList = handleSortOrgans(JSON.parse(localStorage.getItem("organs")))
  try {
    organList.forEach((value, key) => {
      organs[value] = "\u00A0\u00A0\u00A0\u00A0\u00A0" + key; // Gives it that Indent
    } );
    combinedList.push(organs.sort());
    // console.debug('%c⊙', 'color:#00ff7b', "combinedList", combinedList);
    return combinedList;
  } catch (error){
    // console.debug("%c⭗", "color:#ff005d", "combinedList error", error);
    var errStringMSG = "";
    typeof error.type === "string"
      ? (errStringMSG = "Error on Organ Assembly")
      : (errStringMSG = error);
    console.debug('%c◉ ERROR  ', 'color:#ff005d', error,errStringMSG);
  }
};

// Returns a sorted Map of Organs (accounting for L/R) for use in Search Filters 
export function handleSortOrgans(organList){
  let sortedDataProp = {};
  let sortedDataArray = [];
  var sortedMap = new Map();
  for (let key in organList){
    let value = organList[key];
    sortedDataProp[value] = key;
    sortedDataArray.push(value);
  }
  sortedDataArray = sortedDataArray.sort();
  for (const [, element] of sortedDataArray.entries()){
    sortedMap.set(element, sortedDataProp[element]);
  }
  return sortedMap;
};
export function CombinedTypeOptions(blackList){
  let coreList = {
    donor: "Donor" ,
    sample: "Sample",
    dataset: "Dataset", 
    upload: "Data Upload",
    publication: "Publication",
    collection: "Collection"
  }
  let organs = [];
  let organList = handleSortOrgans(JSON.parse(localStorage.getItem("organs")))
  organList.forEach((value, key) => {
    organs[value] = key;
  });

  if(blackList?.blackList && blackList?.blackList.length > 0){
    blackList?.blackList.forEach((item) => {
      delete coreList[item.toLowerCase()];  
      if(item in organs){
        delete organs[item];
      }
    });
  }
  // WhiteList is only theoretical for now; nothing uses that approach yet
  return (<>
    <option aria-label="None" value="" />
    <optgroup label="Entity Types">
    {Object.entries(coreList).map(([key, label]) => (
      <option key={key} value={key}>
        {label}
      </option>
    ))}
    </optgroup>
    <optgroup label="Sample Types">
      {Object.entries(SAMPLE_CATEGORIES).map(([, label], index) => (
        <option key={index + 1} value={label}>
          {label}
        </option>
      ))}
    </optgroup>
    <optgroup label="Organs">
      {Object.entries(organs).map(([label, key], index) => (
        <option key={index + 1} value={label}>
          {key}
        </option>
      ))}
    </optgroup>
  </>)
}
export function CombineTypeSelect({
  formFilters,
  handleInputChange,
  restrictions,
  embedded
  }){
  // console.debug('%c◉  CombineTypeSelect', 'color:#9359FF', );
  // let coreList = ["Donor","Sample","Dataset","Data Upload","Publication","Collection"]
  let coreList = {
    donor: "Donor" ,
    sample: "Sample",
    dataset: "Dataset", 
    upload: "Data Upload",
    publication: "Publication",
    collection: "Collection"
  }
  let organs = [];
  let organList = handleSortOrgans(JSON.parse(localStorage.getItem("organs")))
  // console.debug('%c◉ organList ', 'color:#00fzof7b', organList, organList.length);
  try {
    organList.forEach((value, key) => {
      organs[value] = key;
    });
    // console.debug('%c◉ organs ', 'color:#00ff7b', organs, organs.length );
    return (
        <FormControl size="small" sx={{width:"100%"}}>
          {embedded && (
            <InputLabel htmlFor="entity_type">Type</InputLabel>
          )}
          {!embedded && (
            <Box className="searchFieldLabel" id="SearchLabelType" >
              <BubbleChartIcon sx={{marginRight:"5px",marginTop:"-4px", fontSize:"1.1em" }} />
              <Typography variant="overline" id="group_label" sx={{fontWeight:"700", color:"#fff", display:"inline-flex"}}> Type | </Typography>  <Typography variant="caption" id="group_label" sx={{color:"#fff"}}>Select a type to search for:</Typography>
            </Box>
          )}
          
            <Select 
              native 
              fullWidth
              label="Type"
              id="entity_type"
              sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize:"0.9em", }}
              name="entity_type"
              value={formFilters.entity_type}
              onChange={(e) => handleInputChange(e)}
              disabled={restrictions && restrictions.entityType?true:false}>
              <CombinedTypeOptions />
            </Select>
          
        </FormControl>
    )
  }catch(error){
    let msg = typeof error.type === "string" ? "Error on Organ Assembly" : error;
    console.debug('%c◉ ERROR  ', 'color:#ff005d', msg, error);
    return (<Typography> ERROR: {error.toString()} </Typography>)
  }  
};

// Gathers all of the Input fields on the page Plus some other data to generate a pre-fill URL
export function HandleCopyFormUrl() {
  // e.preventDefault();
  const url = new URL(window.location.origin + window.location.pathname);
  let formValues = document.querySelectorAll("input, textarea, select");
  // console.debug('%c◉ Found Inputs: ', 'color:#00ff7b',formValues );
  Object.entries(formValues).forEach(([key, value]) => {
    // console.debug('%c◉ formValues ', 'color:#00ff7b', value.id, value.type, value.value);
    if (value !== undefined && value !== null && value !== "" && value.type !== "checkbox" && value.id && value.value && !value.disabled) {
      url.searchParams.set(value.id, value.value);
    }
    else if (value.type === "checkbox" && value.checked ) {
      url.searchParams.set(value.id, value.checked === true ? "true" : "false");
    }
  });
  let sourceTable = getHubmapIDsFromBulkTable();
  if (sourceTable.length > 0) {
    url.searchParams.set("source_list", sourceTable.join(","));
  }
  navigator.clipboard.writeText(url.toString())
    .then(() => {
      // setSnackMessage("Form URL copied to clipboard!");
      // setShowSnack(true)
    })
    .catch(() => {
      // setSnackMessage("Form URL Failed to copy to clipboard!");
      // setShowSnack(true)
    });
}

// The SpeedDial tool being used for quick actions like Copy Form URL & Create Dataset (Admin quick access)
export function SpeedDialTooltipOpen() {
  let navigate = useNavigate();
  const actions = [
    { icon: <DynamicFormIcon />, name: 'Copy Form Prefil URL', action: (e) => HandleCopyFormUrl(e) },
    { icon: <TableChartIcon />, name: 'Create Dataset', action: () => navigate(`/new/datasetAdmin`) },
  ];
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', top: "80px", right: 0 }}>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'absolute', top: 0, right: 16,/*  background:"#0080d009", borderRadius:"1.2em"*/ }}
        icon={<OfflineBoltIcon />}
        direction={"down"}>
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={() => action.action ? action.action() : alert(action.name)}
            slotProps={{
              tooltip: {
                title: action.name,
              },
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}

// Returns a Feedback Dialog Modal for displaying Warnings, Errors, etc
export function FeedbackDialog( { 
  showMessage, 
  setShowMessage, 
  message,
  title,
  summary,
  note,
  color,
  icon
  } ){
  let messageColor = color ? color : "#444A65";
  let altColorLight = LightenHex(messageColor, 20);
  let altColorDark = DarkenHex(messageColor, 20);
  let defaultSummary = "";
  if (!message || message.length <= 0){
    defaultSummary = "No Known Problems or Messages";
  }
  
  return (
    <Dialog 
      maxWidth="sm"
      open={showMessage} 
      sx={{margin: "auto", marginBottom: "0px"}}
      fullWidth={true}>
      <DialogTitle sx={{
        background: `linear-gradient(180deg,${messageColor} 0%, ${altColorLight} 100%)`, 
        border: `1px solid ${messageColor}`, 
        color: "white", 
        padding: "2px 10px 0px 10px",
        borderTopLeftRadius: "4px",
        borderTopRightRadius: "4px",}}> 
        <FontAwesomeIcon icon={icon?icon:faBell} sx={{marginRight: "10px"}} /> {title?title:"Attention: "}
      </DialogTitle>
      <DialogContent sx={{border: `1px solid ${messageColor}`}}> 
        <Typography sx={{fontSize: "0.9rem", marginBottom: "10px", marginTop: "10px"}}>
          {summary?summary:defaultSummary}
        </Typography >
        {(message && message.length>0 && typeof message ==="object") ? message.map(([details, items], index) => (
          <React.Fragment key={index}>
            <Typography sx={{fontSize: "0.9rem", marginTop: "20px"}}>{details}</Typography>
            <ul style={{margin: "10px 0px 20px 0px", padding: "20px", background: messageColor+"20", borderRadius: "5px", border: `1px solid ${messageColor+20}`}}>
              {Array.isArray(items) && items.map((item, i) => {
                // Split at the first space before the parenthesis
                const match = item.match(/^([^\s(]+)\s*(\(.*\))?$/);
                return (
                  <li key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        borderBottom: "1px solid #444a6520"
                      }}>
                      <Typography component="span" >
                        <FontAwesomeIcon 
                          className='messageIcon'
                          icon={icon?icon:faCircleExclamation} 
                          color={altColorLight} 
                          style={{marginRight: "10px"}}/> 
                        {match ? match[1] : item}
                      </Typography>
                      {match && match[2] && (
                        <Typography component="span" sx={{marginLeft: "0.5em", fontSize: "0.8rem", color: altColorDark}}>
                          {match[2] && match[2].includes("Invalid Type:") ? (
                            <>Invalid Type: <strong>{match[2].match(/Invalid Type:\s*([^)]+)/)?.[1] || ""}</strong></>
                          ) : (
                            match[2]
                          )}
                        </Typography>
                      )}
                  </li>
                );
              } )}
            </ul>
          </React.Fragment>
        )) : ""}
      </DialogContent>
      <DialogActions sx={{
        background: "rgb(207, 211, 226)", 
        padding: "6px 10px", 
        display: "flex", 
        border: `1px solid ${messageColor}`, 
        borderTop: "none",
        borderBottomLeftRadius: "4px",
        borderBottomRightRadius: "4px"}}>
        {note && (
          noteWrap(note)  
        )}
        {((!message || message.length <= 0) && (!summary || summary.length<=0)) && (!note || note.length<=0) && (
          errorNote(errorNote)  
        )}
        
        <Button
          size="small"
          sx={{
            background: "white", 
            color: "#444a65",
            "&:hover": {
              backgroundColor: "#444a65",
              color: "white"
            }
          }}
          onClick={() => setShowMessage(false)}
          variant="contained"
          startIcon={<ClearIcon />}
          color="primary">
          Ok
        </Button>
      </DialogActions>
		</Dialog>
  )
}

// Returns a Snackbar on Entity Validation messages
export function EntityValidationMessage(props) {
  const {response, eValopen, setEValopen} = props
  let message = response?.results ?? response?.data ?? "No Response";
  let severity = message?.error ? "error" : "info";
  if (message?.error) message = message.error;
  if (response?.status === 202) message = "This Entity has been accepted for validation.";
  const handleClose = (event, reason) => reason !== 'clickaway' && setEValopen(false);
  return (
    <Snackbar
      sx={{ marginBottom: "20px" }}
      direction="up"
      autoHideDuration={5000}
      disableWindowBlurListener
      open={eValopen}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={handleClose}>
      <Alert
        className="eValSnackbar"
        variant="filled"
        severity={severity}
        sx={severity === "info" ? { backgroundColor: "#444a65" } : {}}
        onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}

// Universal Snackbar for messages
export function SnackbarFeedback(props){
  const {snackbarController, setSnackbarController, } = props
  function closeSnack(){
    setSnackbarController(prev => ({...prev, open: false}))
  }
  return(
    <Snackbar 
      open={snackbarController.open} 
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}
      autoHideDuration={snackbarController.hide ? snackbarController.hide : 6000} 
      onClose={closeSnack}>
      <Alert
        onClose={closeSnack}
        severity={snackbarController.status}
        variant="filled"
        sx={{ 
          width: '100%',
          backgroundColor: snackbarController.color ? snackbarController : 
            snackbarController.status === "error" ? "#f44336" : "#4caf50",
        }}>
        {snackbarController.message}
      </Alert>
    </Snackbar>
  );
}


// @TODO: Maybe move to a utils file?
// Sanitize a Python-ish dict string and return the desired array/object structure
export function ParsePreflightString(s) {
  if (!s || typeof s !== 'string') return [];
  // replace literal or escaped tabs with " | "
  s = s.replace(/\\t/g, ' | ').replace(/\t/g, ' | ');
  // convert \xNN to \u00NN (JSON requires \u escapes)
  s = s.replace(/\\x([0-9A-Fa-f]{2})/g, '\\u00$1');
  // convert Python-like single-quoted keys/values into JSON double-quoted ones
  // escape any double-quotes inside captured value/key
  s = s.replace(/'([^']+)'\s*:\s*'([^']*)'/g, (key, val) => {
    const k = key.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const v = val.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${k}":"${v}"`;
  });
  // now should be valid JSON object text like {"Preflight":"Decode Error: ..."}
  let obj;
  try {
    obj = JSON.parse(s);
  } catch (err) {
    // fallback: try to recover minimal structure if JSON.parse still fails
    // create a best-effort object by extracting the Preflight value substring
    const m = s.match(/["']?Preflight["']?\s*[:=]\s*["']?(.+)["']?\s*}$/);
    const val = m ? m[1].trim() : s;
    obj = { Preflight: val };
  }
  // If Preflight is a string like "Decode Error: blah : ...", split at first ": "
  if (typeof obj.Preflight === 'string') {
    const idx = obj.Preflight.indexOf(':');
    if (idx !== -1) {
      const key = obj.Preflight.slice(0, idx).trim();
      const value = obj.Preflight.slice(idx + 1).trim();
      obj.Preflight = { [key]: value };
    }
  }
  return [obj];
}

// Color manipullation (Right now namely for Feedback Dialog Colors)
function HexToHsl(hex){
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min){ h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }
    h /= 6;
  }
  return {h: h * 360, s: s * 100, l: l * 100};
}
function HslToHex(h, s, l){
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2, r = 0, g = 0, b = 0;
  if (0 <= h && h < 60){ r = c; g = x; b = 0; }
  else if (60 <= h && h < 120){ r = x; g = c; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
  else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
  else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
  else if (300 <= h && h < 360){ r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16).slice(1).toUpperCase();
}
function LightenHex(hex, amount = 15){
  let {h, s, l} = HexToHsl(hex);
  l = Math.min(100, l + amount); // Increase lightness by 'amount'
  return HslToHex(h, s, l);
}
function DarkenHex(hex, amount = 15){
  let {h, s, l} = HexToHsl(hex);
  l = Math.max(0, l - amount); // Decrease lightness by 'amount', but not below 0
  return HslToHex(h, s, l);
}