
import * as React from "react";
import {useState, useEffect} from "react";
import {
  useNavigate,
  useLocation,
  Routes,
  Route} from "react-router-dom";

// Login Management
import Login from './components/ui/login';
import Timer from './components/ui/idle';

import LinearProgress from '@mui/material/LinearProgress';

import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faExclamationTriangle}
  from "@fortawesome/free-solid-svg-icons";

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import { ingest_api_users_groups } from './service/ingest_api';
import {search_api_get_assay_set} from "./service/search_api";
import {BuildError} from "./utils/error_helper";

// import {ErrBox} from "../utils/ui_elements";
  // Site Content
import {Navigation} from "./Nav";
// import {RenderLogin} from "./components/login";

/* Using legacy SearchComponent for now. See comments at the top of the New SearchComponent File  */
//  import {RenderSearchComponent} from './components/SearchComponent';

import {RenderDonor} from "./components/donors";
import {RenderDataset} from "./components/datasets";
import {RenderSample } from "./components/samples";
import {RenderUpload} from "./components/uploads";
import {RenderPublication} from "./components/publications";

// Bulky
import {RenderBulk} from "./components/bulk";

// The Old Stuff
import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";
import  Box  from '@mui/material/Box';
import Grid from '@mui/material/Grid';


export function App (props){
  // var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  var [regStatus, setRegStatus] = useState(false);
  var [unregStatus, setUnegStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [timerStatus, setTimerStatus] = useState(true);
  var [isLoading, setIsLoading] = useState(true);
  var [dataTypeList, setDataTypeList] = useState({});
  var [dataTypeListAll, setDataTypeListAll] = useState({});
  var [dataTypeListPrimary, setDataTypeListPrimary] = useState({});
  var [userGroups, setUserGroups] = useState({});
  var [userDataGroups, setUserDataGroups] = useState({});
  let navigate = useNavigate();


  useEffect(() => {
    
    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");
    if (info !== null) {
      // Grabs the ?info= bit
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("isHubmapUser", true);
      // Redirect to home page without query string
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }

    try {
      ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
        console.debug("ingest_api_users_groups", results);
        
        if(results && results.results.data === "User is not a member of group HuBMAP-read"){
          setAuthStatus(true);
          setRegStatus(false);
          setUnegStatus(true);
          setIsLoading(false);
        }

        if (results && results.status === 200) { 
          // console.debug("LocalStorageAuth", results);
          setUserGroups(results.results);
          if(userDataGroups && userDataGroups.length> 0){setRegStatus(true);}
          setUserDataGroups(results.results);
          setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
          setTimerStatus(false);
          setAuthStatus(true);
          search_api_get_assay_set("primary") 
          .then((response) => {
            console.debug("search_api_get_assay_set");
              let dtypes = response.data.result;
              setDataTypeList(dtypes);
              setDataTypeListPrimary(dtypes);
              // setIsLoading(false)
              search_api_get_assay_set()
                .then((response) => {
                    let dataAll = response.data.result;
                    setDataTypeListAll(dataAll);
                    setIsLoading(false)
                })
                .catch(error => {
                  console.debug("fetch DT list Response Error", error);
                  setIsLoading(false)
                });
          })
          .catch(error => {
            console.debug("fetch DT list Response Error", error);
            setIsLoading(false)
          });


      } else if (results && results.status === 401) {
        // console.debug("LocalStorageAuth", results);
        setGroupsToken(null);
        setAuthStatus(false);
        setRegStatus(false);
        setTimerStatus(false);
        setIsLoading(false);
        if(localStorage.getItem("isHubmapUser")){
          // If we were logged out and we have an old token,
          // We should promopt to sign back in
          CallLoginDialog(); 
        }
      }
        
    });
    }catch {
      setTimerStatus(false);
      setIsLoading(false)
    }


  }, [groupsToken, isLoading]);
  
  function Logout(){
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
  };

  function handleCancel(){
    window.history.back();  
  }


  const onClose = (event, reason) => {
      navigate("/");
  }


  const onCloseLogin = (event, reason) => {
      navigate("/");
      setLoginDialogRender(false);
    
  }

  function CallLoginDialog(){
    setLoginDialogRender(true);
  }
  
  function urlChange(target) {
    var lowerTarget = target.toLowerCase();
    navigate(lowerTarget,  { replace: true });
  }
  

  const app_info_storage = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")) : "";
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const queryType = queryParams.get('entityType');
  const queryKeyword = queryParams.get('keywords');
  const queryGroup = queryParams.get('group');
  var [errorShow,setErrorShow] = useState(false);
  var [errorInfo,setErrorInfo] = useState("");
  var [errorInfoShow,setErrorInfoShow] = useState(false);

  var bundledParameters = {entityType: queryType, keywords: queryKeyword, group: queryGroup};

function reportError (error){
  console.error("reportError", error);
  var errString = JSON.stringify(BuildError(error), Object.getOwnPropertyNames(BuildError(error)))
  console.debug("reportError", errString);
  setErrorInfo(errString);
  setErrorShow(true);
}

  return (
    <div className="App">
      
      
      <Navigation 
        login={authStatus} 
        logout={Logout}
        app_info={ app_info_storage}
        userGroups={userGroups}
        userDataGroups={userDataGroups}
        onCreatedReditect={""}
      />       
      
      <Timer logout={Logout}/>

      <div id="content" className="container">
      <Drawer 
        sx={{
          color: 'white',
          height:150   ,
          flexShrink: 0,
          '& .MuiDrawer-paper': {           
            height: 150,
            boxSizing: 'border-box',
          },
        }}
        variant="temporary"
        className="alert-danger"
        anchor='bottom'
        open={errorShow}>


        <Box  sx={{ 
          width: '100%', 
          padding: 1, 
          backgroundColor:'#dc3545', 
          color:"#fff",
            '& span, h5': {           
            display: 'inline-block',
            padding: "0 5px 0 0 ",
          }, }}>
            <Typography variant="h5" align="left"><FontAwesomeIcon icon={faExclamationTriangle} sx={{padding:1}}/>  Sorry!  </Typography><Typography align="left" variant="caption" >Something's gone wrong...</Typography>
            <IconButton
              sx={{ position: 'absolute', right: 8, top: 4, color: 'white' }}
              aria-label="close drawer"
              onClick= {()=> setErrorShow(false)}
              edge="start">
              <CloseIcon />
            </IconButton>
        </Box>

        <Box sx={{ width: '100%', height:'100%', padding: 1, backgroundColor:'white', color:"#dc3545", }}>

          <Grid container>

            <Grid item xs={7}>
              <Typography variant="body2" gutterBottom>
                There's been an error handling the current task. Please try again later. <br />
                If the problem persists, please contact the HuBMAP Help Desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
              </Typography>
            </Grid>

            <Grid item xs={5}>

              <Typography variant="body2"gutterBottom>
                Error Details: <IconButton color="error" size="small" onClick={()=>setErrorInfoShow(!errorInfoShow)}> <ExpandMoreIcon /></IconButton>
              </Typography>
              <Collapse in={errorInfoShow}>
                <Typography variant="caption">
                  {errorInfo}
                </Typography>
              </Collapse>

            </Grid>

          </Grid>
         

          
        </Box>


      </Drawer>


      {isLoading &&(
        <LinearProgress />
      )}

        { !authStatus && !isLoading && (
          <React.Fragment>
            <Routes>
                <Route path="/" element={ <Login />} />
                <Route path="/*" element={ <Login />} />
                <Route path="*" element={ <Login />} />
                <Route path="/login" element={ <Login />} />
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

     
          {unregStatus && (
            <div className="row">
              <div className="alert alert-danger col-sm-12 text-center">
                <br />
                You do not have access to the HuBMAP Ingest Registration System.  You can request access by checking the "HuBMAP Data Via Globus" system in your profile. If you continue to have issues and have selected the "HuBMAP Data Via Globus" option make sure you have accepted the invitation to the Globus Group "HuBMAP-Read" or contact the help desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
              </div>
            </div>
          )}

          {authStatus && !timerStatus && !isLoading &&(
          <Paper className="px-5 py-4">


          <Routes>
              <Route index element={<SearchComponent entity_type='' reportError={reportError} packagedQuery={bundledParameters}  urlChange={urlChange} handleCancel={handleCancel}/>} />
              <Route path="/" element={ <SearchComponent entity_type=' ' reportError={reportError} packagedQuery={bundledParameters} urlChange={urlChange} handleCancel={handleCancel}/>} />
              <Route path="/login" element={<Login />} />
              <Route path="/new">
                <Route index element={<SearchComponent />} />
                <Route path='donor' element={ <Forms reportError={reportError} formType='donor' onReturn={onClose} handleCancel={handleCancel} />}/>
                <Route path='dataset' element={<Forms reportError={reportError} formType='dataset' dataTypeList={dataTypeList} dtl_all={dataTypeListAll} dtl_primary={dataTypeListPrimary}new='true' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                <Route path='sample' element={<Forms reportError={reportError} formType='sample' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                <Route path='publication' element={<RenderPublication reportError={reportError} onReturn={onClose} handleCancel={handleCancel} /> }/> 

              </Route>
              <Route path="/donors" element={<SearchComponent reportError={reportError} filter_type="donors" urlChange={urlChange}/>} ></Route>
              <Route path="/samples" element={<SearchComponent reportError={reportError} filter_type="Sample" urlChange={urlChange} />} ></Route>
              <Route path="/datasets" element={<SearchComponent reportError={reportError} filter_type="Dataset" urlChange={urlChange} />} ></Route>
              <Route path="/uploads" element={<SearchComponent reportError={reportError} filter_type="uploads" urlChange={urlChange} />} ></Route>

              <Route path="/donor/:uuid" element={<RenderDonor  reportError={reportError} handleCancel={handleCancel} status="view"/>} />
              <Route path="/sample/:uuid" element={<RenderSample reportError={reportError} handleCancel={handleCancel} status="view"/>} />
              <Route path="/dataset/:uuid" element={<RenderDataset reportError={reportError} dataTypeList={dataTypeList} handleCancel={handleCancel} status="view"/>} />
              <Route path="/upload/:uuid" element={<RenderUpload  reportError={reportError} handleCancel={handleCancel} status="view"/>} />
              <Route path="/publication/:uuid" element={<RenderPublication  reportError={reportError} handleCancel={handleCancel} status="view"/>} />

              <Route path="/bulk/donors" reportError={reportError} exact element={<RenderBulk bulkType="donors" />} />
              <Route path="/bulk/samples" reportError={reportError} element={<RenderBulk bulkType="samples" />} />

          </Routes>

          </Paper>
          )}
  </div>
  </div>
  );
  
}
      

export default App