import React, { Component } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import ListAltTwoToneIcon from '@mui/icons-material/ListAltTwoTone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CloudSyncTwoToneIcon from '@mui/icons-material/CloudSyncTwoTone';
import CancelTwoToneIcon from '@mui/icons-material/CancelTwoTone';


import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';

import Collapse from '@mui/material/Collapse';
import StackTrace from 'stacktrace-js'

const theme = createTheme();

theme.typography.h3 = {
  fontSize: '1.2rem',
  '@media (min-width:600px)': {
    fontSize: '1.5rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '2rem',
  },
};

// Error BOundaries only work as classes as of React 16(.8?)
// We Get the error gere, not loaded conditonally but loading & wrapping sub-funcs

// ALSO does not handle promises. Can we pipe em?
// https://jaketrent.com/post/react-error-boundaries-event-handlers
// https://eddiewould.com/2021/28/28/handling-rejected-promises-error-boundary-react/

// key="0"
// FallbackComponent={MyFallbackComponent}
// onError={(error, errorInfo) => console.error({ error, errorInfo })}

// interface State {
//     error: any; // Could be an exception thrown in synchronous code or could be a rejection reason from a Promise, we don't care
// }

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: "",
      localStackFrames:"",
      stackCollapse:false,
    };
    
  }

  
  componentDidCatch(error, errorInfo) {
      console.debug("Bound componentDidCatch");
      console.debug(error);
      // console.debug(errorInfo);
      this.setState({error: error});
      // StackTrace.fromError(error).then(this.stackTraceCallback);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  formatErrorMessage() {
    var ErrMessage = {
      source: "",
      type: "",
      reason:""
    }
    if(this.state.error.message){
      var capturedMessage = this.state.error.message;
      console.debug("capturedMessage", capturedMessage);
      // Gonna need to format the different messages right.
      //  Comes back custom from an ES error
      if(capturedMessage.includes('Source: Elastic Search')){


        var errArraySBT = this.state.error.message.substring(6);
        console.debug("errArraySBT", errArraySBT);
        // var errArray = this.state.error.message.split(",");
        var errArray = errArraySBT.toJSON();

        console.debug("errArray", errArray);


        ErrMessage.source = "Elastic Search";
        ErrMessage.type = errArray[1].slice(6);
        ErrMessage.reason = errArray[2].slice(8);
      }else{
        ErrMessage.source = "IMPORT";
        ErrMessage.type = "IMPORT";
        ErrMessage.reason = "IMPORT";
      }
      
      console.log(errArray);
      return (
        <React.Fragment>
           <Typography 
            sx={{
              color:"red"}}>
            <strong>Type:</strong>  {ErrMessage.type}
          </Typography>
          <Typography> 
          <Typography>
            <strong>Reason:</strong>  {ErrMessage.reason}
          </Typography>
            <strong>Source: </strong>{ErrMessage.source}
          </Typography>
         </React.Fragment>
        )
        
      }
  }

  formatStack() {
    var stackMSG = {
      function: "",
      file: "",
      line:""
    }
    if(this.props.stack.length > 0){
      var capturedStack = this.props.stack;
      console.debug("capturedStack", capturedStack);
      if(this.state.error.message.includes('Source: Elastic Search')){
        // We're from StackTracey / API Error
        stackMSG.function = this.props.stack[0].slice(0,-2);;
        stackMSG.file = this.props.stack[1];
        stackMSG.line = this.props.stack[2];
      }else{
        stackMSG.function = "IMPORT";
        stackMSG.file = "IMPORT";
        stackMSG.line = "IMPORT";
      }
      
      console.log("stackMSG", stackMSG);
      return (
        <React.Fragment>
            <Typography 
              sx={{}}> 
              {stackMSG.function} 
            </Typography>
            <Typography 
              sx={{fontSize: '0.9em'}}>
               <strong>{stackMSG.file}</strong>: {stackMSG.line}   
            </Typography> 
         </React.Fragment>
        )
        
      }
  }

  formatRequest() {
    var requestMSG = {
      function: "",
      file: "",
      line:""
    }
    if(this.props.request.length > 0){
      var capturedStack = this.props.stack;
      console.debug("capturedStack", capturedStack);
      if(this.state.error.message.includes('Source: Elastic Search')){
        // We're from StackTracey / API Error
        requestMSG.function = this.props.stack[0].slice(0,-2);;
        requestMSG.file = this.props.stack[1];
        requestMSG.line = this.props.stack[2];
      }else{
        requestMSG.function = "IMPORT";
        requestMSG.file = "IMPORT";
        requestMSG.line = "IMPORT";
      }
      
      console.log("requestMSG", requestMSG);
      return (
        <React.Fragment>
            <Typography 
              sx={{}}> 
              {requestMSG.function} 
            </Typography>
            <Typography 
              sx={{fontSize: '0.9em'}}>
               <strong>{requestMSG.file}</strong>: {requestMSG.line}   
            </Typography> 
         </React.Fragment>
        )
        
      }
  }


  render() {
    
    const handleClick = () => {
      this.setState({stackCollapse: !this.state.stackCollapse});
    };
    const {error} = this.state;
    // var stack = this.state.localStackFrames;
    // console.debug("stack",stack);
    if (error) {
      // console.debug("ErrorBoundary error", error);
      return (
        <Drawer
        PaperProps={{
          sx: { 
            width: "300px" 
          },
        }}
        // open={errStatus}
        open={true}
        anchor="right"
        // onClose={setErrDrawerOpen(false)}
        > 
      


      <Box 
        role="error">
        <ThemeProvider theme={theme}>
          <Box  
            sx={{
            //   margin: '1em' ,
              backgroundColor: 'red',
              color: 'white',
              padding: '1em',
            }}> 
            <Typography variant="h4" > <ErrorTwoToneIcon color="red" fontSize="Large"/>  Internal Error  </Typography>

          </Box>
        </ThemeProvider>
      </Box>

      <Box 
      sx={{
          padding: '1em',
        }}>  

        <Typography sx={{}}> <strong>Message:</strong></Typography>

        <Box
          sx={{
           backgroundColor: '#f5f5f5',
           padding: '1em',
           fontSize: '0.8rem',
          }}>
        {this.formatErrorMessage()}
      </Box>
      

        <Typography sx={{
          marginTop: '1em',
        }}> <strong>Location:</strong></Typography>
        
        <Box
          sx={{
           backgroundColor: '#f5f5f5',
           padding: '1em',
           fontSize: '0.8rem',
          }}>
        {this.formatStack()}
      </Box>

      <Box
          sx={{
           backgroundColor: '#f5f5f5',
           padding: '1em',
           fontSize: '0.8rem',
          }}>
        {this.formatRequest()}
      </Box>


       
      </Box>


          

      <Box sx={{ padding: '1em', }}>
        If this error persists, please contact help@hubmapconsiortium.org
      </Box>

      <Box sx={{padding: '1em', }}>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<CloudSyncTwoToneIcon />}>
            Reload Page
          </Button>
          <Button variant="outlined" startIcon={<CancelTwoToneIcon />}>
            Close
          </Button>
        </Stack>
      </Box>
      </Drawer>
        // <div>ERROR {error}</div>
      );
    } else {
      return <>{this.props.children}</>;
    }
  }
}
