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

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import {toTitleCase} from '../utils/string_helper'  // Site Content



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




function getStackTrace () {
    let stack = new Error().stack || '';
    stack = stack.split('\n').map(function (line) { return line.trim(); });
      return stack.splice(stack[0] == 'Error' ? 2 : 1);
  } 


 export const RenderError = (props) => {
//   var [stackTrace, setStackTrace] = useState();
//   var [errNavigator, setErrNavigator] = useState();
//   var [errDetails, setErrDetails] = useState([]);
//   var [errStatus, setErrStatus] = useState([]);
//   var [errRenderArray, setErrRenderArray] = useState();
  var [errObject, setErrObject] = useState([]);
var [listArray, setListArray] = useState([]);
let navigate = useNavigate();
setErrObject(props.errObject);

console.debug("props", props);


    function HandleCancel(){
        navigate(-1);  
    };

    var ST = getStackTrace()[1]+"";
    console.debug("ST", ST);


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
                <Typography variant="h3"  gutterBottom > IIInternal Server Error  </Typography>

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
                  secondary={<Typography sx={{color:"red", fontSize:"1.3rem"}}> Details</Typography>} />
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
      )
    
    
  }
  

