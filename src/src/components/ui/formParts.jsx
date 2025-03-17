import React from "react";
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import Typography from '@mui/material/Typography';
import {tsToDate} from "../../utils/string_helper";
import HIPPA from "./HIPPA";

// const userGroups = JSON.parse(localStorage.getItem("userGroups"));

export const FormHeader = (props) => {
  let entityData = props.entityData;
  let permissions = props.permissions;
  return (
    <React.Fragment>
      {topHeader(entityData)}
      {infoPanels(entityData,permissions)}
    </React.Fragment>
  )
}

function topHeader(entityData){
  if(entityData[0] !== "new"){
    return (
      <React.Fragment>
        <Grid item xs={12} className="" >  
          <h3 style={{marginLeft: "-2px"}}>{entityData.entity_type} Information</h3>
        </Grid>
        <Grid item xs={6} className="" >
          <Typography>HuBMAP ID: {entityData.hubmap_id}</Typography>
          <Typography>Entered by: {entityData.created_by_user_email}</Typography>
          <Typography>Submission ID: {entityData.submission_id}</Typography>
          <Typography>Entry Date: {tsToDate(entityData.created_timestamp)}</Typography>   
        </Grid>
      </React.Fragment>
    )
  }else{
    return (
    <Grid item xs={6} className="" >  
      <h3 style={{marginLeft: "-2px"}}>Registering a {entityData[1]}</h3>
    </Grid>
    )
  }
}

function infoPanels(entityData,permissions){
  return (
    <Grid item xs={6} className="" >
      {permissions.has_write_priv && (
        <HIPPA />
      )}
      {entityData && entityData.data_access_level === "public" && (
      // They might not have write access but not because of data_access_level
        <Alert severity="warning" sx={{
            minHeight: "100%",
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