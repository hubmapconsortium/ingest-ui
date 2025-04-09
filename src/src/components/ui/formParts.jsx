import React from "react";
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import Typography from '@mui/material/Typography';
import {tsToDate} from "../../utils/string_helper";
import HIPPA from "./HIPPA";
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';

import Chip from '@mui/material/Chip';

// import {ingest_api_allowable_edit_states} from "../../service/ingest_api";
// import {entity_api_get_entity} from "../../service/entity_api";
// const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;

export const FormHeader = (props) => {
  let entityData = props.entityData;
  let permissions = props.permissions;
  // console.debug('%c◉ formHeadeer ', 'color:#00ff7b', props);
  return (
    <React.Fragment>
      {topHeader(entityData)}
      {infoPanels(entityData,permissions)}
    </React.Fragment>
  )
}

function iconSelection(entity_type){
  let style = {fontSize: "1.5em", "verticalAlign": "text-bottom"}
  switch
  (entity_type && entity_type.toLowerCase()){
    case "donor":
      return <PersonIcon style={style} />
    case "sample":
      return <BubbleChartIcon style={style} />
    case "dataset":
      return <TableChartIcon style={style} />
    case "upload":
      return <DriveFolderUploadIcon style={style} />
    case "publication":
      return <NewspaperIcon style={style} />
    case "collection":
      return <CollectionsBookmarkIcon style={style} />
    case "eppicollection":
      return <CollectionsBookmarkIcon style={style} />
    default:
      return <BubbleChartIcon style={style} />
  }
}

function topHeader(entityData){
  
  if(entityData[0] !== "new"){
    return (
      <React.Fragment>
        <Grid item xs={12} className="" >  

          {entityData.entity_type === "Upload" && (
            <h3 style={{marginLeft: "-2px"}}>{iconSelection(entityData.entity_type)}  {entityData.status ? statusBadge(entityData.status) : ""}  HuBMAP {entityData.entity_type} {entityData.hubmap_id}</h3>   
          )}
          {entityData.entity_type !== "Upload" && (
            <h3 style={{marginLeft: "-2px"}}>{iconSelection(entityData.entity_type)}{entityData.entity_type} Information</h3>
          )}
        </Grid>
        <Grid item xs={6} className="" >
          {entityData.entity_type === "Upload" && (
            <Typography><strong>Group Name:</strong> {entityData.group_name} </Typography>             
          )}
          {entityData.entity_type !== "Upload" && (
            <Typography><strong>HuBMAP ID:</strong> {entityData.hubmap_id}</Typography> 
          )}
          <Typography><strong>Entered by: </strong> {entityData.created_by_user_email}</Typography>
          {(entityData.entity_type === "Donor" || entityData.entity_type ==="Sample" ) && (
            <Typography><strong>Submission ID:  </strong> {entityData.submission_id}</Typography>
          )}
          <Typography><strong>Entry Date: </strong> {tsToDate(entityData.created_timestamp)}</Typography>   
        </Grid>
      </React.Fragment>
    )
  }else{
    return (
      <React.Fragment>
        <Grid item xs={entityData[1] === "Upload" ? 12 : 6} className="" >  
          <h3 style={{marginLeft: "-2px"}}> {iconSelection(entityData[1])} Registering a new {entityData[1]}</h3>
        </Grid>
        {entityData[1] === "Upload" && (
          <Grid item xs={6} className="" >
            <Typography> 
              Register a new Data Upload which will be used to bulk upload data which will organized by the HIVE into multiple Datasets. For more information about registering and uploading data see the <a href="https://docs.hubmapconsortium.org/data-submission/" target="_blank" >Data Submission Guide</a>.
            </Typography>
          </Grid>
        )}
      </React.Fragment>
    )
  }
}

function infoPanels(entityData,permissions){
  // console.debug('%c◉ infoPan ', 'color:#00ff7b', entityData,permissions );
  return (
    <Grid item xs={6} className="" >
      {permissions.has_write_priv && (
        <HIPPA />
      )}
      {!permissions.has_write_priv && (
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
     
    </Grid>
  )
}

export function badgeClass(status){
  var badge_class = "";
	//console.log('status', status)\
  if(status=== undefined || !status){
    badge_class = "badge-danger";
    console.log("No Status Value for this unit ");
  }else{
	switch (status.toUpperCase()) {
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

export function statusBadge(status){
  console.debug('%c◉ status: ', 'color:#00ff7b', status);
  return (
    <Chip className={badgeClass(status)} label={status.toUpperCase()} sx={{marginBottom: "10px"}} />
  )
}

export function GroupSelectMenu(formValues){
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

export function FormCheckRedirect(uuid,entityType,form){
  console.debug('%c◉ FormCheckRedirect ', 'color:#ff0073', uuid,entityType,form);
  if(entityType !== form){
    // @TODO: Move this sort of handling/detection to the outer app, or into component
    window.location.replace(
      `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
    );
  }
}