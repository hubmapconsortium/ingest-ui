
import React from "react";

import Tooltip,{tooltipClasses} from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import {styled} from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import HelpTwoToneIcon from '@mui/icons-material/HelpTwoTone';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

import Paper from '@material-ui/core/Paper';
import Grid from "@mui/material/Grid";

import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Icon from '@mui/material/Icon';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import LaunchIcon from '@mui/icons-material/Launch';

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

export function Sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function ErrBox(params) {
  console.debug("ErrBox", params);
  var statusName = params.err.status;
  console.debug("ErrBox", params);
  return( 
    
      <Alert severity="error" variant="filled" sx={{ width: '100%', backgroundColor:"red" }}>
        <AlertTitle>{statusName}</AlertTitle>
       { params.err.message}
      </Alert>
    
  ); 
}


export function HelpLabelTooltip(params) {
  let info = params.info;
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

  export function TestTable() {

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


  export function VersionNavigation(previous,next) {

      return (
        <Grid container spacing={2} sx={{display:"flex",justifyContent:"flex-start",textAlign:"left"}}>      
          {previous &&(
            <Grid item xs={6}>
              {renderVersionList(previous,"Previous")}
            </Grid>
          )}
          {next &&(
            <Grid item xs={6}>
            {renderVersionList(next,"Next")}
          </Grid>
          )}
        </Grid>
      )
  }

  function renderVersionList(list,which){
    return (
      <Paper className="p5">
      <Typography sx={{backgroundColor:'#343a40', color:'#fff', padding:"2px 5px"}}>{which ==="Previous" ? <ChevronLeftIcon /> : <ChevronRightIcon />}{which} List Revisions</Typography>
        {list[0] &&(
          <List
            divider={true}
            dense={true}
            sx={{maxHeight: '140px', maxWidth:'auto', overflowY: 'scroll', overflowX:'auto', flexDirection: 'column', flexWrap:'inherit', padding:'0px', backgroundColor:'#f5f5f5'}}>
            {list.map((entity, index) => {
              return (
                <ListItemButton sx={{width:"100%"}} key={index + 1}  href={"/"+entity.type+"/"+entity.hubmapID}>
                  <ListItemText primary={entity.hubmapID}sx={{padding:'2px 5px'}} /> <LaunchIcon />
                </ListItemButton>
              );
            })}
          </List>
        )}
        {!list[0] &&(
          <Typography sx={{padding:"2px 5px", backgroundColor:'#f5f5f5'}}>No Revisions Found</Typography>
        )}
      </Paper>
    )
  }


