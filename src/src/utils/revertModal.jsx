import React, { useEffect, useState  } from "react";
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import {getPublishStatusColor} from "./badgeClasses";
import ReactTooltip from "react-tooltip";
import Popover from '@mui/material/Popover';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import {entity_api_update_entity} from '../service/entity_api';
import {useNavigate,Routes,Route,Link,useLocation,} from "react-router-dom";


export const RevertFeature = (props) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(props.open);
  const [type] = useState(props.type);
  const [uuid] = useState(props.uuid);
  const [RStatus, setRStatus] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);

  };  
  const handleChange = (event) => {
    setRStatus(event.target.value);
  };

  const handleStatusSet = (e) => {
    setSubmittingUpdate(true);
    entity_api_update_entity(
      uuid, 
      {"status":RStatus}, 
      JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        if (response.status < 300) {
          props.onUpdated(response.results);
          function onUpdated(data){
            console.debug('%c◉ RESPULTD ', 'color:#00ff7b', response.results);
            console.debug("onUpdated", data);
            navigate('../')
          }
        } else {
          console.debug('%c◉ RESPONSE NOGOOD ', 'color:#00ff7b', response.status);
          // this.setState({ 
          //   submit_error:true, 
          //   submitting:false, 
          //   submittingUpdate:false,
          //   submitErrorResponse:response.results.statusText
          // });
        }
      })
      .catch((error) => {
        console.debug('%c◉ ERROR ', 'color:#ff005d', error);
      });
    }
  

    return (
      <>
        <ReactTooltip
          id='revert_tooltip'
          className='zindex-tooltip revertTooltip'
          place='top'
          variant='light'
          border="#000000"
          effect='solid'>
          <p sx={{ color: "black!important", maxWidth: "160px", fontSize:"inherent"}}>
            Revert this <span sx={{color:'red'}}>{type}</span> back to <span label='New' className={ 'badge '+getPublishStatusColor('NEW')}>New</span> <span label='Valid' className={ 'badge '+getPublishStatusColor('VALID')}>Valid</span> <br /> <span label='Invalid' className={ 'badge '+getPublishStatusColor('INVALID')}>Invalid</span> <span label='qa' className={ 'badge '+getPublishStatusColor('QA')}>QA</span> <span label='Submitted' className={ 'badge '+getPublishStatusColor('SUBMITTED')}>Submitted</span>  <br /> or <span label='Incomplete' className={ 'badge '+getPublishStatusColor('INCOMPLETE')}>Incomplete</span> status</p> 
        </ReactTooltip>
        <Button variant="outlined" onClick={() => handleClickOpen()} data-tip data-for='revert_tooltip'> Revert </Button>
        <Dialog onClose={handleClose} aria-labelledby="Revert-Dialog" open={open}>
          <React.Fragment>
            <DialogTitle sx={{ m: 0, p: 2 }} id="customized-dialog-title">
              Select {type} Status
            </DialogTitle>
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
              }}>
              <CloseIcon />
            </IconButton>
            <DialogContent dividers>
              <Typography >
                Choose a status to revert this <span className="text-da nger">{type}</span> to, then click [Revert] to apply your changes
              </Typography>
              
              <FormControl sx={{ m: 1, width: "100%" }}>
                <Select
                  id="revert-status"
                  value={RStatus}
                  onChange={handleChange}>
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                <MenuItem value={"New"}>New</MenuItem>
                <MenuItem value={"Valid"}>Valid</MenuItem>
                <MenuItem value={"Invalid"}>Invalid</MenuItem>
                <MenuItem value={"Qa"}>Qa</MenuItem>
                <MenuItem value={"Submitted"}>Submitted</MenuItem>
                <MenuItem value={"Incomplete"}>Incomplete</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button
                className="btn btn-primary mr-1"
                onClick={handleClose}>
                Close
              </Button>
              <Button
                className="btn btn-secondary"
                onClick={(e) => handleClose(e) }
                variant="outlined">
                Revert
              </Button>          
            </DialogActions>
          </React.Fragment>s
        </Dialog>
      </>
    );
  
}