
import * as React from "react";
import {useState, useEffect} from "react";
import {
  useNavigate,
  Routes,
  Route} from "react-router-dom";
  
  // Login Management
  import Login from './components/ui/login';
  import Timer from './components/ui/idle';


import { createTheme, ThemeProvider } from '@mui/material/styles';

import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';

import Collapse from '@mui/material/Collapse';

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import { ingest_api_users_groups } from './service/ingest_api';
import {toTitleCase} from './utils/string_helper'  // Site Content
import {Navigation} from "./Nav";
// import {RenderLogin} from "./components/login";

/* Using legacy SearchComponent for now. See comments at the top of the New SearchComponent File  */
//  import {RenderSearchComponent} from './components/SearchComponent';

import {RenderDonor} from "./components/donors";
import {RenderDataset} from "./components/datasets";
import {RenderSample } from "./components/samples";
import {RenderUpload} from "./components/uploads";

// Bulky
import {RenderBulk} from "./components/bulk";

// The Old Stuff
import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";
import ErrorBoundary from './components/errorBoundary';


export function App (props){
  var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [errStatus, setErrStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [errArray, setErrArray] = useState();
  var [stackTrace, setStackTrace] = useState();
  var [errNavigator, setErrNavigator] = useState();
  var [errMessage, setErrMessage] = useState();
  let navigate = useNavigate();

    
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



  // When it bubbles up from within, 
  // get it packaged up all nice n neat
  function packageError(err){
    console.debug("packageError", err);
    
    let errorPackage;
    if(err.results){
      errorPackage = (err.results);
    }else{
      errorPackage = {"err":err};      
    }
    // setErrMessage(errorPackage);
    console.debug("errorPackage", errorPackage);
    var errArray =  Object.entries(errorPackage);
    setErrStatus(true);

  
    function getStackTrace () {
      let stack = new Error().stack || '';
      stack = stack.split('\n').map(function (line) { return line.trim(); });
        return stack.splice(stack[0] == 'Error' ? 2 : 1);
    } 
    var deets = getStackTrace()[1]+""; // get stack trace info 1 levels-deep
    console.debug("deets", deets);
    

    var errorDetails = [];
    if(errArray[0][1].err.lineNumber){
      var errLocation = "File: "+errArray[0][1].err.fileName+" \n"+"Line: "+errArray[0][1].err.lineNumber+" Column:"+ errArray[0][1].err.columnNumber
      
      // errLocation = errLocation+"\n"+<Typography variant="subtitle"> "test"</Typography>;

// Were in TypeError format
      errorDetails.push({
        where: errLocation,
        type: errArray[0][1].err.results,
        message: errArray[0][1].err.message,
        stack: errArray[0][1].err.stack,
      });
    }



    var stack = errArray[0][1].err.stack.split('\n').map(function (line) { return line.trim(); });
    var splicedStack = stack.splice(stack[0] == 'Error' ? 2 : 1);
    console.debug("splicedStack", splicedStack);
    console.debug("stack", stack);

    console.log("errorDetails",errorDetails);
    console.debug("errMessage",errMessage);

    var errNavArray = [
      navigator.appCodeName,
      navigator.appName,
      navigator.appVersion,
      navigator.cookieEnabled,
      navigator.language,
      navigator.userAgent,
      navigator.platform,
      navigator.onLine,
    ];

    setErrNavigator(errNavArray)
    console.debug("errNavArray",errNavArray);

    var ua = <Typography>{navigator.userAgent}</Typography>;
    var cookieEnabled = <Typography>{navigator.cookieEnabled}</Typography>;
    var networkInformation = <Typography>{navigator.networkInformation}</Typography>;

    
    setErrMessage(errorDetails[0].message);
    // var listArray = [];
    
    var listArray = [
      <ListItem key={"Messgae"} >
        <ListItemText  
          primary={<strong>Message:</strong>} 
          secondary={<Typography sx={{color:"red", fontSize:"1.3rem"}}> {errorDetails[0].message }</Typography>} />
      </ListItem>,

      <ListItem key={"Location"} >
        <ListItemText  
          primary="Where:" 
          secondary={errorDetails[0].where}  />
      </ListItem>,
      <ListItem key={"Deets"} >
        <ListItemText  
          primary="" 
          secondary={deets}  />
      </ListItem>,
      <ListItem key={"Time"}>
        <ListItemText 
          primary={"Error time:"}  
          secondary={new Date().toLocaleString() + ""}/>
      </ListItem>,
      <ListItem key={"Cookies"}>
        <ListItemText 
          primary={"Cookies:"}  
          secondary={cookieEnabled}/>
      </ListItem>,
      <ListItem key={"UAS"}>
        <ListItemText 
        primary={"User agent string:"}  
        secondary={ua}/>
      </ListItem>,
      // <ListItem>
      //   <ListItemText 
      //   primary={"Network Information:"}  
      //   secondary={networkInformation}/>
      // </ListItem>
    ];
    setErrArray(listArray);

    setStackTrace(
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="stackTrace-content"
          id="stackTrace-header"
        >
          <Typography>Stack Trace</Typography>
        </AccordionSummary>
        <AccordionDetails>
        <Typography variant="caption" >{errorDetails[0].stack}</Typography>
        </AccordionDetails>
      </Accordion>
    );


  }

  

  // window.onerror = (message, file, line, column, errorObject) => {
  //   column = column || (window.event && window.event.errorCharacter);
  //   var stack = errorObject ? errorObject.stack : null;

  //   //trying to get stack from IE
  //   if (!stack) {
  //     var stack = [];
  //     var f = arguments.callee.caller;
  //     while (f) {
  //       stack.push(f.name);
  //       f = f.caller;
  //     }
  //     errorObject['stack'] = stack;
  //   }

  //   var data = {
  //     message: message,
  //     file: file,
  //     line: line,
  //     column: column,
  //     errorStack: stack
  //   };
  //   console.debug("startErrorLog", data);
  // }

  useEffect(() => {

    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");
    if (info !== null) {
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);
      // Redirect to home page without query string
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }

    try {
      ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
      if (results && results.status === 200) { 
        console.debug("LocalStorageAuth", results);
        setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
        setAuthStatus(true);
        console.debug("groupsToken",groupsToken);
      } else if (results && results.status === 401) {
        console.debug("LocalStorageAuth", results);
        setGroupsToken(null);
        setAuthStatus(false);
        if(localStorage.getItem("info")){
          // If we were logged out and we have an old token,
          // We should promopt to sign back in
          CallLoginDialog(); 
        }
      }
        
    });
    }catch {
      console.debug("LocalStorageAuth", "CATCh No LocalStorage");
    }
  }, [groupsToken]);





  function Logout(){
  //console.debug("Logging out");
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
  };

  
  function onChangeGlobusLink(newLink, newDataset){
    // const {name, display_doi, doi} = newDataset;
    // this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  };



  function handleCancel(){
    navigate(-1);  
  }





  const onCloseLogin = (event, reason) => {
      // setLoginDialogRender(true)
      console.debug("onCloseLogin ", event, reason);
      navigate("/");
      setLoginDialogRender(false);
    
  }

  function CallLoginDialog(){
    console.debug("CallLoginDialog Open");
    setLoginDialogRender(true);
  }

  function CallUploadsDialog(){
  //console.debug("CallUploadsDialog uploadsDialogRender");
    setUploadsDialogRender(true);
  }
 

 
  
  function urlChange(target) {
    navigate(target);
  }
 

  function buildItem(item, index) {
  }


  

//console.debug("props", props);
  return (
    <div className="App">
      
      
      <Navigation 
        login={authStatus} 
        logout={Logout}
        app_info={ JSON.parse(localStorage.getItem("info"))}
        uploadsDialogRender={uploadsDialogRender}
        onCreatedReditect={""}
      />       
      <Timer logout={Logout}/>

      {errStatus && (
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
                  margin: '1em' ,
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
              {errArray}
            </List>
          </Box>


          <Box
            sx={{ 
            display: 'inline-block',
            marginTop:'auto',
            width: "100%",
          }}>
            <Button 
              fullWidth
              variant="contained"
              color="error"
              size="large">
                Contact Support
            </Button>
          </Box>
        </Box>



      </Drawer>
 
      )};



      <div id="content" className="container">
        
        {!authStatus && (
          <React.Fragment>
            <Routes>
                <Route path="/" element={ <Login />} />
            </Routes>


          <Dialog
            open={loginDialogRender}
            onClose={onCloseLogin}
            disableEscapeKeyDown={false}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            onBackdropClick={onCloseLogin}
          >
            <DialogTitle 
              color="white"
              backgroundColor="red"
              id="alert-dialog-title"
            >

            <React.Fragment>
            <AnnouncementTwoToneIcon /> Session Has Ended
            </React.Fragment>
            </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
                <br />
                It looks like your login session has ended. Please log in again to continue
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={onCloseLogin} autoFocus>
                Log In
              </Button>
            </DialogActions>
          </Dialog>
          </React.Fragment>

        )}

            
          {authStatus && (
          <Paper className="px-5 py-4">

    <ErrorBoundary>
          <Routes>

              <Route path="/" element={ <SearchComponent packageError={packageError} entity_type=' ' urlChange={urlChange} onCancel={handleCancel}/>} />

              <Route path="/login" element={<Login />} />

              <Route path="/donors" element={<SearchComponent packageError={packageError} filter_type="donors" urlChange={urlChange}/>} ></Route>
              <Route path="/samples" element={<SearchComponent packageError={packageError} filter_type="Sample" urlChange={urlChange} />} ></Route>
              <Route path="/datasets" element={<SearchComponent packageError={packageError} filter_type="Dataset" urlChange={urlChange} />} ></Route>
              <Route path="/uploads" element={<SearchComponent packageError={packageError} filter_type="uploads" urlChange={urlChange} />} ></Route>
                                    
              <Route path="/donor/:uuid" element={<RenderDonor  onCancel={handleCancel} status="view"/>} />
              <Route path="/sample/:uuid" element={<RenderSample onCancel={handleCancel} status="view"/>} />
              <Route path="/dataset/:uuid" element={<RenderDataset  onCancel={handleCancel} status="view"/>} />
              <Route path="/upload/:uuid" element={<RenderUpload  onCancel={handleCancel} status="view"/>} />
              
              <Route path="/new/donor" element={ <Forms formType='donor' onCancel={handleCancel} />}/>
              <Route path="/new/sample" element={<Forms formType='sample' onCancel={handleCancel} /> }/>
              <Route path="/new/dataset" element={<Forms formType='dataset' onCancel={handleCancel} /> }/> 

              <Route path="/new/sample" element={<RenderSample status="new" />} />
              <Route path="/new/dataset" element={<RenderDataset status="new" />} />
              <Route path="/bulk/donors" exact element={<RenderBulk bulkType="donors" />} />
              <Route path="/bulk/samples" element={<RenderBulk bulkType="samples" />} />
              <Route path="/new/data" element={<SearchComponent uploadsDialog="true" CallUploadsDialog={CallUploadsDialog} changeLink={onChangeGlobusLink} />} />
              {/* <Forms formType={this.state.formType} onCancel={this.handleClose} /> */}

          </Routes>

    </ErrorBoundary>

          </Paper>
          )}
  </div>
  </div>
  );
  // return html;
  
}
      

export default App