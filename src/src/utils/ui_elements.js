
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


export function InputSelect(params) {
  let field = params.field;
  let title = params.title;
  let details = params.details;
    return(
      <label
        htmlFor="{field}">
        {title}<span className="text-danger">*</span>   
        <HtmlTooltip
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

  export function TestTable(params) {

    return(
      <div className="card"><div className="card-body"><div className="row"><div className="col-sm-6"><b>Source Type:</b> Organ</div><div className="col-sm-12"><b>Organ Type:</b> Spleen</div><div className="col-sm-12"><b>Submission ID:</b> UFL0012-SP</div><div className="col-sm-12"><b>Group Name: </b> University of Florida TMC</div><div className="col-sm-12"><p><b>Description: </b> 2/3 of spleen</p></div></div></div></div>
    )
  }


  export function MetadataBadge(params) {
    let status = params.status;
    var options = {
      "null":'<span className="badge badge-secondary">No value set</span>',
      "0":'<span className="badge badge-secondary">No metadata</span>',
      "1":'<span className="badge badge-primary">Metadata provided</span>',
      "2":'<span className="badge badge-primary">Metadata curated</span>',
    }
    console.debug("MetadataBadge", status, options[status]);
    return(options[status]);
  }