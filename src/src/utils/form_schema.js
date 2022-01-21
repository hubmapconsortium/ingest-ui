
import React, { useEffect, useState  } from "react";

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import HelpTwoToneIcon from '@mui/icons-material/HelpTwoTone';
import Button from '@mui/material/Button';





const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props}  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));



export function ErrBox(params) {
  console.debug("ErrBox", params);
  return( 
    <div className="error text-center">
      <h1>{params.err.status}</h1>
      <p>{params.err.message }</p>
    </div>
  ); 
}

export function HelpLabelTooltip(params) {
  let info = params.info;
  let field = info.field;
  let title = info.title;
  let details = info.details;
  let place = info.place;
  // console.debug("HelpTooltip", info, field, title, details);  
  return(
    <label
      htmlFor="{field}">
      {title}<span className="text-danger">*</span>   
      <HtmlTooltip placement={place} arrow
          title={
            <React.Fragment>
              <Typography color="inherit">{title}</Typography>
                {details}
            </React.Fragment>
          }>
            <IconButton className="p0 m0" aria-label="help">
              <HelpTwoToneIcon />
            </IconButton>            
        </HtmlTooltip>    
    </label>
  );
}


export function TissueForm(params) {
  console.debug("TissueForm", params);
  let field = params;
  var tooltips = {
    'specimen_type':{
      "field":"specimen_type",
      "title":"Specimen Type",
      "details":"The type of specimen",
      "place":"right"
    },
    'source_id':{
      "field":"source_id",
      "details":[
        "The HuBMAP Unique identifier of the direct direct origin entity,","other sample, or donor ",<em>where this sample came from</em>," " ],
      "title":"Source ID",
      "place":"right"
      },
    'visit':{
      "field":"visit",
      "details":[
        "Associated visit in which sample was acquired (Non-PHI number). e.g., baseline" ],
      "title":"Visit",
      "place":"right"
    },
    'protocol_url':{
      "field":"protocol_url",
      "details":[
        "The protocol used when procuring or ",
        "preparing the tissue.",
        "This must be provided as a ",
        "protocols.io DOI URL",
        "see https://www.protocols.io/" ],
      "title":"Preparation Protocol",
      "place":"right"
    },
    'lab_tissue_sample_id':{
      "field":"lab_tissue_sample_id",
      "details":[
        "An identifier used by the lab to identify the specimen,",
        "this can be an identifier from the system",
        <br />,"used to track the specimen in the lab. This field will be entered by the user."
       ],
      "title":"Lab Sample Id",
      "place":"right"
    },
    'description':{
      "field":"description",
      "details":[
        "A free text description of the specimen." ],
      "title":"Description ",
      "place":"right"
    }};

    let myField;
    if(params==="all"){
      myField = tooltips;
    }else{
      myField = tooltips[field];
    }
    console.debug("myField", myField);
    return new Promise((resolve, reject) => resolve(myField));
  }