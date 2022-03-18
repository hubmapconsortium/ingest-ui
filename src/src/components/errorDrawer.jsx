import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {useNavigate} from "react-router-dom";
import {useState, useEffect} from "react";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import {toTitleCase} from '../utils/string_helper'  // Site Content

import StackTrace from 'stacktrace-js'
import StackTraceGPS from 'stacktrace-gps'

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

// props: errorstate, error?
export const ErrorDrawer = (props) => {
  console.debug("ErrorDrawer FUNC");
  // We get Error and ErrState from Props
  var [errorStackTrace, setErrorStackTrace] = useState();

  useEffect(() => {
    if(!localStorage.getItem("info")){
      // the app.js should reload on missing/outdated Info item
    }else{
    
    entity_api_get_entity(uuid,  JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        console.debug("response", response);
        if (response.status === 200) {
            setEntity(response.results);
            console.debug("entity_data", response.results);
            setLoading(false);
          } else {  
            passError(response.status, response.message);
          }
        })
        .catch((error) => {
          passError(error.status, error.results.error );
        });
      }
  }, [uuid]);
  


  stgpsCallback = (stackTrace) => {
    console.debug("callBackStackTrace", stackTrace);
    var StackTraceBits = stackTrace.splice(stackTrace[0] === 'Error' ? 2 : 1, 4);
    console.debug("StackTraceBits", StackTraceBits);
  }

  callBackStackTrace = (stackTrace) => {
    console.debug("callBackStackTrace", stackTrace);
    var localStackFrames = [];
    for (var i = 0; i < stackTrace.length; i++) {
      var fileName = stackTrace[i].fileName

      if (fileName.includes("/src/src")) {
        localStackFrames.push(stackTrace[i]);
        // console.debug("FOUND IT", fileName);
      }
      console.debug("localStackFrames", localStackFrames);

      // var STR = localStackFrames.map(
      //   ({ columnNumber, lineNumber, fileName, functionName }) => `functionName:   Location: Line ${lineNumber} Col ${columnNumber}`);
      //   console.debug(STR);
      //   this.setState({
      //     renderStackString:STR
      //   });
        
      // 

      

    }
    // var StackTraceBits = stackTrace.splice(stackTrace[0] === 'Error' ? 2 : 1, 4);
    // console.debug("StackTraceBits", StackTraceBits);
    console.debug("localStackFrames", localStackFrames);
    this.setState({
      stack:localStackFrames,
    });    
  }

  componentDidCatch(error, errorInfo) {
    console.debug("Bound componentDidCatch",error, "INFO ",errorInfo);
    this.setState({error: error});
    StackTrace.fromError(error).then(this.callBackStackTrace);
    
    // console.log( StackTrace.getSync() );
    // StackTrace.fromError(error).then(callback).catch(errback);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  renderStack(){

    return this.state.renderStackString

    // return (
    //       <ListItem>
    //         STR
    //       </ListItem>
    //       // <ListItem>
    //       //   <ListItemText  
    //       //   primary={"File:"} 
    //       //   secondary={<Typography> fileName </Typography>} />
    //       // </ListIten>
    //       // <ListItem>
    //       //   <ListItemText  
    //       //   primary={"Location:"} 
    //       //   secondary={<Typography> lineNumber + "" +columnNumber</Typography>} />
    //       // </ListIten>
    //        );
    // })
  }


  render() {
    
    const {error} = this.state;
    if (error) {
      // const {stackTrace} = this.getStackTrace(error);
      // var rendST = this.getStackTrace()[1]+""
      // const {stackTrace} = this.getStackTrace()[1]+""
      // var {stackTrace} = this.getStackTraceINFO();
      // console.debug("ST", stackTrace);
      console.debug("ErrorBoundary error", error);
      return (
        <Drawer
        // open={errStatus}
        open={true}
        anchor="right"
        width= '50px' 
        // onClose={setErrDrawerOpen(false)}
        variant={"temporary"}
      >

        <Box display="inline-block" sx={{  maxWidth: "400px",}}>


          <Box display="inline-block" 
            sx={{ 
              background:"red",
              color:"white",
              width: "100%",
            }}
            role="error">
            <ThemeProvider theme={theme}>
              <Box  
                sx={{
                //   margin: '1em' ,
                  display: 'inline-block',
                }}> 
                <Typography variant="h2" > <ErrorTwoToneIcon color="red" fontSize="Large"/>500  </Typography>
                <Typography variant="h3"  gutterBottom > Internal Server Error  </Typography>

              </Box>
            </ThemeProvider>
          </Box>


          <Box className="row" 
            sx={{ 
              display: 'inline-block',
            }}>
            <List dense sx={{
              display: 'inline-block',
              maxWidth: "360px",
            }}>
              <ListItem key={"Messgae"} >
                <ListItemText  
                  primary={<strong>Message:</strong>} 
                  secondary={<Typography sx={{color:"red", fontSize:"1.3rem"}}> {error.message}</Typography>} />
              </ListItem>
              <ListItem key={"Stack"} >
              
                <ListItemText  
                  primary={<strong>Stack Trace:</strong>} 
                  // secondary={  this.renderStackString}  
                  />


              </ListItem>
            </List>
          </Box>

          <Box
            sx={{ 
            display: 'inline-block',
            marginTop:'auto',
            width: "100%",
          }}>
            If this error persists, please contact help@hubmapconsiortium.org
          </Box>
        </Box>
      </Drawer>
        // <div>ERROR {error}</div>
      );
    } else {
      return <>{this.props.children}</>;
    }
  }
}
