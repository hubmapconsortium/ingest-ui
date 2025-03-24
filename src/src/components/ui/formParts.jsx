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

import {ingest_api_allowable_edit_states} from "../../service/ingest_api";
import {entity_api_get_entity} from "../../service/entity_api";

const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;

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
  (entity_type){
    case "Donor":
      return <PersonIcon style={style} />
    case "Sample":
      return <BubbleChartIcon style={style} />
    case "Dataset":
      return <TableChartIcon style={style} />
    case "Upload":
      return <DriveFolderUploadIcon style={style} />
    case "Publication":
      return <NewspaperIcon style={style} />
    case "Collection":
      return <CollectionsBookmarkIcon style={style} />
    case "EPICollection":
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
          <h3 style={{marginLeft: "-2px"}}>{iconSelection(entityData.entity_type)}{entityData.entity_type} Information</h3>
        </Grid>
        <Grid item xs={6} className="" >
          <Typography><strong>HuBMAP ID:</strong> {entityData.hubmap_id}</Typography>
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
    <Grid item xs={6} className="" >  
      <h3 style={{marginLeft: "-2px"}}> {iconSelection(entityData.entity_type)} Registering a new {entityData[1]}</h3>
    </Grid>
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
      {entityData && entityData.data_access_level === "public" && (
      // They might not have write access but not because of data_access_level
        <Alert severity="warning" 
          iconMapping={{warning: <WarningIcon style={{fontSize: "2em"}} />}}
          sx={{
            // minHeight: "100%",
            minWidth: "100%",
            padding: "10px"}}>
          This entity is no longer editable. It was locked when it became publicly
          acessible when data associated with it was published.
        </Alert>
      )}
    </Grid>
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