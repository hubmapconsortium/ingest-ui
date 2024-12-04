
import * as React from 'react';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";

export default function MUIDialog(props) {  

  return (
    <React.Fragment>
     
      <Dialog
        // onClose={props.handleClose}
        aria-labelledby="customized-dialog-title"
        open={props.open}
        className="fullDialog"
      >
        <DialogTitle sx={{ m: 0, p: 2 }} style={{background:"red", color:"white"}} id="customized-dialog-title">
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ fontSize:"2.5rem", marginRight:"20px"}} sx={{padding:1}}/> {props.title}      </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={props.handleClose}
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            color: "white",
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent dividers>
          <Typography dangerouslySetInnerHTML={{ __html:props.message }}>
            
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button style={{position:"relative",margin:"0 auto 0 auto"}} autoFocus onClick={props.handleClose}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}