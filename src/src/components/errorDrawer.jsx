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


export const RenderErrDrawer = (props) => {
  var [stackTrace, setStackTrace] = useState();
  var [errNavigator, setErrNavigator] = useState();
  var [errDetails, setErrDetails] = useState([]);
  var [errRenderArray, setErrRenderArray] = useState();
  var [errObject, setErrObject] = useState([]);
  var [listArray, setListArray] = useState([]);
  let navigate = useNavigate();
  
  
  useEffect(() => {
        let err = props.err;
        let errorPackage;
        

        console.debug("packageError props err", err);
        console.debug("Rescheck", err.err.lineNumber);

        if(err.results){
            errorPackage = (err.results);
        }else{
            errorPackage = err.err;      
        }
        // setErrMessage(errorPackage);
        // console.debug("errorPackage",errorPackage);
        let errArray = [];
        if(errorPackage && errorPackage.lineNumber){
            // Were in TypeError format
            var errLocation = "File: "+errorPackage.fileName+" \n"+"Line: "+errorPackage.lineNumber+" Column:"+ errorPackage.columnNumber
            errArray = ({
            where: errLocation,
            type: errorPackage.results,
            message: errorPackage.message,
            stackSM: getStackTrace()[1]+"", // get stack trace info 1 levels-deep
            stack: errorPackage.stack,
            ua: navigator.userAgent
            });
        }
        console.debug("errArray", errArray);

        listArray.push(
        <ListItem key={"Messgae"} >
          <ListItemText  
            primary={<strong>Message:</strong>} 
            secondary={<Typography sx={{color:"red", fontSize:"1.3rem"}}> {errDetails.message }</Typography>} />
        </ListItem>,
        <ListItem key={"Location"} >
          <ListItemText  
            primary="Where:" 
            secondary={errDetails.where}  />
        </ListItem>,
        <ListItem key={"Deets"} >
          <ListItemText  
            primary="" 
            secondary={errDetails.stackSM}  />
        </ListItem>,
        <ListItem key={"Time"}>
          <ListItemText 
            primary={"Error time:"}  
            secondary={new Date().toLocaleString() + ""}/>
        </ListItem>,
        <ListItem key={"UAS"}>
          <ListItemText 
          primary={"User agent string:"}  
          secondary={errDetails.ua}/>
        </ListItem>
      );
      console.debug("listArray", listArray);

  }, [errObject]);

  



    console.debug("props.err", props.err);

//   var stack = props.err.stack.split('\n').map(function (line) { return line.trim(); });
//   var splicedStack = stack.splice(stack[0] == 'Error' ? 2 : 1);
//   console.debug("splicedStack", splicedStack);
//   console.debug("stack", stack);

  

 



    function HandleCancel(){
        navigate(-1);  
    };

      return (
        <Drawer
        // open={errDrawerOpen}
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
              {listArray}
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
  

