import React, { Component } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CloudSyncTwoToneIcon from '@mui/icons-material/CloudSyncTwoTone';
import CircularProgress from '@mui/material/CircularProgress';

import Collapse from '@mui/material/Collapse';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


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
      showDetails:false,
      loadState: true,
      errStatus:false,
      respStatus:null,
      localStackFrames:"",
      stackCollapse:false,
      errorObj:{
          "source":null,
          "type":null,
          "reason":null,
          "target":null,
          "statusText":null,
          "index":null
      }
    };
    
  }

  
  componentDidCatch(error, errorInfo) {
      console.debug("Bound componentDidCatch");
      console.debug(error);
      console.debug(errorInfo);
      this.setState({
        error: error,
        loadState: true
      });
      

      if(error.message.includes('Source: Elastic Search')){
        var errArraySBT = error.message.substring(6);
        var errObj = JSON.parse(errArraySBT);
        var errMsg= errObj.message;
        var errMsgArr = errMsg.split(",");    
        this.setState({
          respStatus:errObj.status,
          loadState: false,
          errStatus:true,
          errorObj:{
            "source": "Elastic Search",
            "type": errMsgArr[1].slice(6),
            "reason": errMsgArr[2].slice(8),
            "target": errMsgArr[4].slice(8),
            "statusText": errMsgArr[3].slice(11),
            "index":errMsgArr[5].slice(6),
          }
        });
        
      // StackTrace.fromError(error).then(this.stackTraceCallback);
  }}

  static getDerivedStateFromError() {
    return { hasError: true };
  }


  closeErr(){
    this.setState({
      errStatus:false
    });
  }

  handleDetails(){
    this.setState({
      showDetails:!this.state.showDetails
    });
  };

  formatErrorMessage() {
        
        return (
        <React.Fragment>
           <Typography 
            sx={{
              fontSize:"1em",
              color:"red"}}>
            <strong>Message:</strong>  {this.state.errorObj.statusText}
          </Typography>
           <Typography 
            sx={{fontSize:"1em"}}>
            <strong>Type:</strong>  {this.state.errorObj.type}
          </Typography>
          <Typography sx={{fontSize:"1em"}}>
            <strong>Reason:</strong>  {this.state.errorObj.reason}
          </Typography>
          {this.state.submit_error && (
            <Typography sx={{fontSize:"1em"}}>
              <strong>Index:</strong>  {this.state.errorObj.index}
            </Typography>
          )} 

          <Typography sx={{fontSize:"1em"}}>
            <strong>Source: </strong>{this.state.errorObj.source}
          </Typography>
         </React.Fragment>
        )
  }

  formatStack() {
    var stackMSG = {
      function: "",
      file: "",
      line:""
    }
    if(this.props.stack.length > 0){
      //console.debug("capturedStack", capturedStack);
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
  
      return (
        <React.Fragment>
           <Typography 
            sx={{fontSize:"1em"}}>
            <strong>Function:</strong>  {stackMSG.function}
          </Typography>
          <Typography 
            sx={{fontSize:"1em"}}>
            <strong>File: {stackMSG.file}</strong>  : {stackMSG.line} 
          </Typography>
          <Typography 
            sx={{fontSize:"1em"}}>
            <strong>Target:</strong>  {this.state.errorObj.target}
          </Typography>
         </React.Fragment>
        )
        
      }
  }
  
  renderLoadingSpinner() {
    if (this.state.loading) {
      return ( <CircularProgress /> );
    }
  }

  render() {
    if (this.state.errStatus) {
      return (
        <Drawer
        open={this.state.errStatus}
        anchor="right"
        PaperProps={{  sx:{ width: "300px" }}}> 
        <Box 
          role="error">
          <ThemeProvider theme={theme}>
            <Box  
              sx={{
                backgroundColor: 'red',
                color: 'white',
                padding: '1em',
              }}> 
              <Typography variant="h4" >
                <ErrorTwoToneIcon color="red" fontSize="Large"/>  Internal Error  
              </Typography>
            </Box>
          </ThemeProvider>
        </Box>

        {this.state.loadState && (
          <CircularProgress />
        )}
        {!this.state.loadState && (
          <>
          <Box 
            sx={{
                padding: '1em',
              }}>  
              <Typography sx={{}}> <strong>Status:</strong> {this.state.respStatus}</Typography>
              <Typography sx={{}}> <strong>Message:</strong>  {this.state.errorObj.statusText}</Typography>
              <Button sx={{}} onClick={() => this.handleDetails()}> Details:  {this.state.showDetails ? <ExpandLess /> : <ExpandMore />} </Button>
              <Collapse
                in={this.state.showDetails}>
              <Box
                sx={{
                  backgroundColor: '#f5f5f5',
                  padding: '1em',
                  fontSize: '0.8rem',
                }}>
                {this.formatErrorMessage()}
              </Box>
              <Typography sx={{marginTop: '1em'}}> <strong>Location:</strong> </Typography>
              <Box
                sx={{
                backgroundColor: '#f5f5f5',
                padding: '1em',
                fontSize: '0.8rem',
                }}>
                {this.formatStack()}
              </Box>
              </Collapse>
          </Box>
          <Box sx={{ padding: '1em', }}>
            If this error persists, please contact help@hubmapconsiortium.org
          </Box>
          <Box sx={{padding: '1em', }}>
              <Button 
                variant="outlined" 
                fullWidth
                startIcon={<CloudSyncTwoToneIcon />}
                onClick={() => window.location.reload(true)}>
                Close
              </Button>
          </Box>
        </>
        )}


    </Drawer>
      );
    } else {
        return <>{this.props.children}</>;
    }
  }
}
