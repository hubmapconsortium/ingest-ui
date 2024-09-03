import * as React from "react";
import {useEffect,useState} from "react";
import {Route,Routes,useLocation,useNavigate} from "react-router-dom";
import {HuBMAPContext} from "./components/hubmapContext";
import Login from './components/ui/login';
import ErrorPage from "./utils/errorPage";
import StandardErrorBoundary from "./utils/errorWrap";

import LinearProgress from '@mui/material/LinearProgress';

import {Alert} from '@material-ui/lab';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {faExclamationTriangle,faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import {ingest_api_all_groups,ingest_api_users_groups} from './service/ingest_api';
import {ubkg_api_get_dataset_type_set,ubkg_api_get_organ_type_set} from "./service/ubkg_api";
import {sortGroupsByDisplay} from "./service/user_service";
import {BuildError} from "./utils/error_helper";
// import {htmlDecode} from "./utils/string_helper";
import {Navigation} from "./Nav";
import Timer from './components/ui/idle'

/* Using legacy SearchComponent for now. See comments at the top of the New SearchComponent File  */

import Result from "./components/uuid/result";

import {RenderCollection} from "./components/collections";
import {RenderEPICollection} from "./components/epicollections";
import {RenderDataset} from "./components/datasets";
import {RenderDonor} from "./components/donors";
import {RenderMetadata} from "./components/metadata";
import {RenderPublication} from "./components/publications";
import {RenderSample} from "./components/samples";
import {RenderUpload} from "./components/uploads";

import {RenderBulk} from "./components/bulk";

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";


export function App (props){
  let navigate = useNavigate();
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [successDialogRender, setSuccessDialogRender] = useState(false);
  var [snackMessage, setSnackMessage] = useState("");
  var [showSnack, setShowSnack] = useState(false);
  var [newEntity, setNewEntity] = useState(null);
  var [authStatus, setAuthStatus] = useState(false);
  var [unregStatus, setUnregStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [allGroups, setAllGroups] = useState(null);
  var [timerStatus, setTimerStatus] = useState(true);
  var [dataTypeList, setDataTypeList] = useState({});
  var [dataTypeListAll, setDataTypeListAll] = useState({});
  // var [organList, setOrganList] = useState();
  var [userGroups, setUserGroups] = useState({});
  var [userDataGroups, setUserDataGroups] = useState({});
  var [userDev, setUserDev] = useState(false);
  // var [regStatus, setUnregStatus] = useState(false);
  var [isLoggingOut, setIsLoggingOut] = useState(false);
  var [APIErr, setAPIErr] = useState([]);
  var [isLoading, setIsLoading] = useState(true);
  var [dtloading, setDTLoading] = useState(true);
  var [orgloading, setORGLoading] = useState(true);
  var [bannerTitle,setBannerTitle] = useState();
  var [bannerDetails,setBannerDetails] = useState();
  var [bannerShow,setBannerShow] = useState(false);
  // var [groupsLoading, setGroupsLoading] = useState(true);
  var [routingMessage] = useState({
    Datasets:["Registering individual datasets is currently disabled.","/new/upload"],
  });

  
  useEffect(() => {
    console.debug("useEffect URL/Info");
    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");
    if (info !== null) {
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("isHubmapUser", true);
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }

    if(localStorage.getItem("info")  ){
      console.debug('%c◉ localStorage.getItem("info") ', 'color:#00ff7b', localStorage.getItem("info"));
      var token = JSON.parse(localStorage.getItem("info")).groups_token;
      console.debug('%c◉ Groups Token: ', 'color:#00ff7b', token );
      ingest_api_all_groups(token)
      .then((res) => {
        setAllGroups(sortGroupsByDisplay(res.results));
      })
      .catch((err) => {
        console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
      })

      ingest_api_users_groups(token)
        .then((results) => {
          setIsLoading(false);
          setTimerStatus(false);
          if (results && results.status === 200) {
            setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
            setUserDataGroups(results.results);
            setUserGroups(results.results);
            setAuthStatus(true);
          } else if (results && results.status === 401) {
            console.debug('%c◉ FAIL WITH 410 ', 'color:#00ff7b', results);
            setAuthStatus(false);
            // setUnregStatus(true);
            clearAuths();
          } else if (results && results.status === 403 && results.results === "User is not a member of group HuBMAP-read") {
            console.debug('%c◉ UNREG ', 'color:#00ff7b', results );
            setAuthStatus(true);
            setUnregStatus(true);
        }
      });
    }else{
      setTimerStatus(false);
      setIsLoading(false)
      setAuthStatus(false);
    }
  }, [ ]);


  useEffect(() => {
    //  No need to load the Organs and Datasets in unless we're logged in
    if(localStorage.getItem("info")){
      
      // Load organs into LocalStorage if need be
      // if(!localStorage.getItem("organs")){
        ubkg_api_get_organ_type_set()
            .then((res) => {
              console.debug('%c◉ RES ', 'color:#00ff7b', res);
              if(res !== undefined){
                console.debug('%c◉ ORGAN RES ', 'color:#00ff7b', res);
                localStorage.setItem("organs",JSON.stringify(res));
                setORGLoading(false)
              }else{
                if(localStorage.getItem("organs")){
                  // We have a cached copy, phew
                  setAPIErr(["UBKG API : Organ","Previously loaded ORGAN data will be used until the issue is resolved.",res])
                  setORGLoading(false)
                }else{
                  // Not cached, we cant really go on
                  setAPIErr(["UBKG API : Organ",'No local ORGAN data was found. Please try again later, or contact help@hubmapconsortium.org',res])
                }
              }
            })
            .catch((err) => {
              // We wana let let this error slide.... inform something is Up 
              // but use whats already in local storage if its not blank
              if(localStorage.getItem("organs")){
                // We have a cached copy, phew
                setAPIErr("UBKG API Error: Organ Type Set","Previously loaded ORGAN definitions will be used until the issue is resolved.",err)
                setORGLoading(false)
              }else{
                // Not cached, we cant really go on
                setAPIErr("UBKG API Error: Organ Type Set",'No local ORGAN data was found. Please try again later, or contact help@hubmapconsortium.org',err)
              }
          })
      // }

      //  Load datatypes into LocalStorage if need be
      // if(!localStorage.getItem("datatypes")){
        ubkg_api_get_dataset_type_set()
          .then((res) => {
              if(res !== undefined){
                localStorage.setItem("datasetTypes",JSON.stringify(res));
                setDTLoading(false)
                // TODO: Eventually remove these & use localstorage 
                setDataTypeList(res);
                setDataTypeListAll(res);
              }else{
                if(localStorage.getItem("datasetTypes")){
                  setAPIErr(["UBKG API : Dataset Types","Previously loaded DATASET TYPE definitions will be used until the issue is resolved.",res])
                  setDTLoading(false)
                }else{
                  setAPIErr(["UBKG API : Dataset Types",'No local DATASET TYPE data were found. Please try again later, or contact help@hubmapconsortium.org',res])
                  reportError(res)
                }
              }
            })
            .catch((err) => {
              // We wana let let this error slide.... inform something is Up 
              // but use whats already in local storage if its not blank
              if(localStorage.getItem("datasetTypes")){
                // We have a cached copy, phew
                setAPIErr("UBKG API Error: Dataset Types","Previously loaded DATASET TYPE definitions will be used until the issue is resolved.",err)
                setDTLoading(false)
              }else{
                // Not cached, we cant really go on
                setAPIErr("UBKG API Error: Dataset Types",'No local DATASET TYPE definitions were found. Please try again later, or contact help@hubmapconsortium.org ',err)
                reportError(err)
              }
          })
          //         ubkg_api_get_dataset_type_set()
          // .then((res) => {
          //   localStorage.setItem("datasetTypes",JSON.stringify(res));
          //   setDTLoading(false)
          //   // TODO: Eventually remove these & use localstorage 
          //   setDataTypeList(res);
          //   setDataTypeListAll(res);
          // })
          // .catch(error => {
          //   console.debug('%c⭗', 'color:#ff005d', "APP ubkg_api_get_dataset_type_set ERROR", error);
          //   reportError(error)
          // });
      // }

    }
 }, [ ]);
  
  
  useEffect(() => {
    // Banner Setting
    // We'll sometimes have details & no title, 
    // but ALWAYS have details
    if( window.hasOwnProperty('REACT_APP_BANNER_DETAILS') && window.REACT_APP_BANNER_DETAILS!==""){
      console.log("REACT_APP_BANNER_TITLE", window.REACT_APP_BANNER_TITLE)
      console.log("REACT_APP_BANNER_DETAILS", window.REACT_APP_BANNER_DETAILS)
      setBannerTitle(window.REACT_APP_BANNER_TITLE ? window.REACT_APP_BANNER_TITLE : "" );
      setBannerDetails(window.REACT_APP_BANNER_DETAILS);
      setBannerShow(true)
    }
  },[])
    
  useEffect(() => {
    // Expose server context
    // easy way to apply the occasional QoL / Dev features &
    // selectively apply css as needed without additional js processing
    if(userDev){
      setTimerStatus(true);
    }
  },[userDev])
  
  
  function clearAuths() {  
    // console.debug('%c◉ CLEAR AUTHS ', 'color:#00ff7b' );
    if(process.env.REACT_APP_URL === "http://localhost:8585"){
      // console.debug('%c◉ clearAuths start ', 'color:#00ff7b' );
      return new Promise((resolve) => {
        setTimeout(() => { // Give it a chance to cleaer the local storage
          localStorage.removeItem("info");
          localStorage.removeItem("isAuthenticated");
          // Clearing Organs and Dataset Types too
          // So logging out and back in will reload them
          resolve();
        }, 2000);
      });
    }
  }

  function Logout(e){
    setIsLoggingOut(true);
    clearAuths(e).then((response) => {
        console.debug('%c◉  response', 'color:#00ff7b',response );
        window.location.replace(`${process.env.REACT_APP_DATAINGEST_API_URL}/logout`)
      })
  };
  
  function handleCancel(){
    window.history.back();  
  }
  const onClose = (event, reason) => {
      navigate("/");
  }

  const onCloseLogin = (event, reason) => {
    setLoginDialogRender(false);
    onClose();
  }
  const onCloseSuccess = (event, reason) => {
    setSuccessDialogRender(false);
    onClose();
  }
  function CallLoginDialog(){
    setLoginDialogRender(true);
  }
  
  function urlChange(target) {
    if(target && target!==undefined){
      var lowerTarget = target.toLowerCase();
      navigate(lowerTarget,  { replace: true });
    }
  }



  function renderAPIError() {
    return (
      <Alert variant="filled" severity="error">
        There was an error populating from datasource {APIErr[0]}  <br />
        {APIErr[1]} <br />
        {APIErr[2]} 
      </Alert>
    );
  }


  function creationSuccess(entity) {
    console.debug('%c⊙', 'color:#00ff7b', "APP creationSuccess", entity );
    setNewEntity(entity.results)
    setSuccessDialogRender(true);
  }


  function updateSuccess(entity) {
    console.debug('%c⊙', 'color:#00ff7b', "APP creationSuccess", entity);
    setSnackMessage("Entity Updated Successfully!");
    setShowSnack(true)
    onClose();
  }


  
  const app_info_storage = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")) : "";
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const queryEntity = queryParams.has("entity_type")?queryParams.get("entity_type"):null  
  const queryKeyword = queryParams.has("keywords")?queryParams.get("keywords"):null  
  const queryGroup = queryParams.has("group_uuid")?queryParams.get("group_uuid"):null  

  var [bundledParameters] = useState({entity_type:queryEntity, keywords:queryKeyword, group_uuid:queryGroup});
  var [errorShow,setErrorShow] = useState(false);
  var [errorInfo,setErrorInfo] = useState("");
  var [errorInfoShow,setErrorInfoShow] = useState(false);
  var [errorDetail, setErrorDetail] = useState({});
  // var [keySet, setKeySet] = useState([]);

  function reportError(error, details) {
    console.debug('%c⭗', 'color:#ff005d',  "APP reportError", error, details);
    if(details){
      setErrorDetail(details);
    }
    typeof error === "string" ? setErrorInfo(error) : setErrorInfo(JSON.stringify(error));
    var errString = JSON.stringify(BuildError(error), Object.getOwnPropertyNames(BuildError(error)))
    if(error.results){
      errString = JSON.stringify(BuildError(error.results), Object.getOwnPropertyNames(BuildError(error.results)))
    }
    setErrorInfo(errString);
    setErrorShow(true);
    throw (error)
  }

  return (
    <div className={"App "+"env-"+process.env.REACT_APP_NODE_ENV}>
      
      <Navigation 
        login={authStatus} 
        logout={Logout}
        isLoggingOut={isLoggingOut}
        app_info={ app_info_storage}
        userGroups={userGroups}
        userDataGroups={userDataGroups}
        onCreatedReditect={""}
      />             
      <Timer logout={Logout}/>
      <div id="content" className="container">
      <Drawer 
        sx={{
          color:'white',
          height:150   ,
          flexShrink:0,
          '& .MuiDrawer-paper':{height:   150,
            boxSizing:'border-box',},
        }}
        variant="temporary"
        className="alert-danger"
        anchor='bottom'
        open={errorShow}>


        <Box  sx={{ 
          width:          '100%', 
          padding:        1, 
          backgroundColor:'#dc3545', 
          color:          "#fff",
            '& span, h5':   {display:'inline-block',
            padding:"0 5px 0 0 ",}, }}>
            <Typography variant="h5" align="left"><FontAwesomeIcon icon={faExclamationTriangle} sx={{padding:1}}/>  Sorry!  </Typography><Typography align="left" variant="caption" >Something's gone wrong...</Typography>
            <IconButton
              sx={{
                position:'absolute', right:8, top:4, color:'white' 
              }}
              aria-label="close drawer"
              onClick= {()=> setErrorShow(false)}
              edge="start">
              <CloseIcon />
            </IconButton>
        </Box>

        <Box sx={{
            width:'100%', height:'100%', padding:1, backgroundColor:'white', color:"#dc3545", 
          }}>
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
              { errorDetail && errorDetail.length>0 && (
                <Typography variant="caption">ERR{errorDetail}</Typography>
              )}
              <Collapse in={errorInfoShow}>
                <Typography variant="caption">
                  {errorInfo}
                </Typography>
              </Collapse>
            </Grid>
          </Grid>

        </Box>


      </Drawer>
      { !isLoading && bannerShow && (
          <div className="alert alert-info" role="alert">
            <h2>{bannerTitle}</h2>
            <div dangerouslySetInnerHTML={{ __html: bannerDetails}} />
          </div>
      )}
      {isLoading || dtloading || orgloading || (groupsToken && (!allGroups || allGroups.length<=0)) && (
        <LinearProgress />
      )}

      { !authStatus && (
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

      {APIErr.length > 0  && (
        renderAPIError()
      )}
      

      {unregStatus && (
        <Routes>
          <Route index element={ 
              <Alert 
                variant="filled"
                severity="error">
                You do not have access to the HuBMAP Ingest Registration System.  You can request access by checking the "HuBMAP Data Via Globus" system in your profile. If you continue to have issues and have selected the "HuBMAP Data Via Globus" option make sure you have accepted the invitation to the Globus Group "HuBMAP-Read" or contact the help desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
              </Alert>
            }/>
        </Routes>
      )}

      {authStatus && !timerStatus && !isLoading && !dtloading && !unregStatus &&(
        <StandardErrorBoundary
          FallbackComponent={ErrorPage}
          onError={(error, errorInfo) => {
            console.log("Error caught!");  
            console.error(error);
            console.error(errorInfo);
          }}>
          <HuBMAPContext.Provider value={{allGroups }}> 
          
            <Paper className="px-5 py-4">
              <Routes>
                
                {/* <Route index element={<SearchComponent organList={organList} entity_type='' reportError={reportError} packagedQuery={bundledParameters}  urlChange={urlChange} handleCancel={handleCancel}/>} /> */}
                <Route index element={<SearchComponent  entity_type='' reportError={reportError} packagedQuery={bundledParameters}  urlChange={urlChange} handleCancel={handleCancel}/>} />
                <Route path="/" element={ <SearchComponent entity_type=' ' reportError={reportError} packagedQuery={bundledParameters} urlChange={urlChange} handleCancel={handleCancel}/>} />
                <Route path="/login" element={<Login />} />
                
                {authStatus && (!userDataGroups || userDataGroups.length === 0) && !isLoading && (
                  <Route path="/new/*" element={ 
                    <Alert 
                      variant="filled"
                      severity="error"
                      action={
                        <Button 
                          color="inherit"
                          size="large"
                          onClick={() => {window.history.back()}}>
                          Cancel
                        </Button>
                      }>
                      You do not have privileges to create registrations in this system. Please contact the help desk at help@hubmapconsortium.org and ask to be added to your HuBMAP Component's access group
                    </Alert>
                    }/>

                    
                )}
                
                {authStatus && (userDataGroups && userDataGroups.length > 0) && !isLoading && (allGroups && allGroups.length > 0) && (
                  <Route path="/new">
                    <Route index element={<SearchComponent reportError={reportError} />} />
                    <Route path='donor' element={ <Forms reportError={reportError} formType='donor' onReturn={onClose} handleCancel={handleCancel} />}/>
                    <Route path='sample' element={<Forms reportError={reportError} formType='sample' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                    <Route path='publication' element={<Forms formType='publication' reportError={reportError} onReturn={onClose} handleCancel={handleCancel} />} /> 
                    <Route path='collection' element={<RenderCollection dataGroups={userDataGroups}  dtl_all={dataTypeList} newForm={true} reportError={reportError}  groupsToken={groupsToken}  onCreated={(response) => creationSuccess(response)} onReturn={() => onClose()} handleCancel={() => handleCancel()} /> }/>
                    <Route path='epicollection' element={<RenderEPICollection dataGroups={userDataGroups}  dtl_all={dataTypeList} newForm={true} reportError={reportError}  groupsToken={groupsToken}  onCreated={(response) => creationSuccess(response)} onReturn={() => onClose()} handleCancel={() => handleCancel()} /> }/>
                    <Route path="dataset" element={<SearchComponent reportError={reportError} filter_type="Dataset" urlChange={urlChange} routingMessage={routingMessage.Datasets} />} ></Route>
                    <Route path='datasetAdmin' element={<Forms reportError={reportError} formType='dataset' dataTypeList={dataTypeList} dtl_all={dataTypeList} dtl_primary={dataTypeList}new='true' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                    <Route path='upload' element={ <SearchComponent reportError={reportError} />}/> {/*Will make sure the search load under the modal */}
                    
                    {/* {userDev && (
                      <Route path='dataset' element={<Forms reportError={reportError} formType='dataset' dataTypeList={dataTypeList} dtl_all={dataTypeListAll} dtl_primary={dataTypeListPrimary}new='true' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                    )}
                    {!userDev && (
                      <Route path="dataset" element={<SearchComponent reportError={reportError} filter_type="Dataset" urlChange={urlChange} routingMessage={routingMessage.Datasets} />} ></Route>
                    )} */}
                  </Route>
                )}
                <Route path="/donors" element={<SearchComponent reportError={reportError} filter_type="donors" urlChange={urlChange}/>} ></Route>
                <Route path="/samples" element={<SearchComponent reportError={reportError} filter_type="Sample" urlChange={urlChange} />} ></Route>
                <Route path="/datasets" element={<SearchComponent reportError={reportError} filter_type="Dataset" urlChange={urlChange} />} ></Route>
                <Route path="/uploads" element={<SearchComponent reportError={reportError} filter_type="uploads" urlChange={urlChange}  />} ></Route>
                <Route path="/collections" element={<SearchComponent reportError={reportError} filter_type="collections" urlChange={urlChange} />} ></Route>
                
                <Route path="/donor/:uuid" element={<RenderDonor  reportError={reportError} handleCancel={handleCancel} status="view"/>} />
                <Route path="/sample/:uuid" element={<RenderSample reportError={reportError} handleCancel={handleCancel} status="view"/>} />
                <Route path="/dataset/:uuid" element={<RenderDataset reportError={reportError} dataTypeList={dataTypeList} handleCancel={handleCancel}  allGroups={allGroups} status="view"/>} />
                <Route path="/upload/:uuid" element={<RenderUpload  reportError={reportError} handleCancel={handleCancel} status="view" allGroups={allGroups}/>} />
                <Route path="/publication/:uuid" element={<RenderPublication reportError={reportError} handleCancel={handleCancel} status="view" />} />
                <Route path="/collection/:uuid" element={<RenderCollection groupsToken={groupsToken}  dataGroups={userDataGroups} dtl_all={dataTypeListAll} onUpdated={(response) => updateSuccess(response)}  reportError={reportError} handleCancel={handleCancel} status="view" />} />
                <Route path="/epicollection/:uuid" element={<RenderEPICollection groupsToken={groupsToken}  dataGroups={userDataGroups} dtl_all={dataTypeListAll} onUpdated={(response) => updateSuccess(response)}  reportError={reportError} handleCancel={handleCancel} status="view" />} />

                <Route path="/bulk/donors" exact element={<RenderBulk reportError={reportError} bulkType="donors" />} />
                <Route path="/bulk/samples" exact element={<RenderBulk reportError={reportError} bulkType="samples" />} />
                <Route path="/metadata">
                  <Route index element={<RenderMetadata reportError={reportError} type="block" />} />
                  <Route path='block' element={ <RenderMetadata reportError={reportError} type='block'/>}/>
                  <Route path='section' element={ <RenderMetadata reportError={reportError} type='section'/>}/>
                  <Route path='suspension' element={ <RenderMetadata reportError={reportError} type='suspension'/>}/>
                </Route>
              </Routes>

              <Dialog aria-labelledby="result-dialog" open={successDialogRender} maxWidth={'800px'}>
                <DialogContent> 
                {newEntity && (
                    <Result
                      result={{entity:newEntity}}
                      onReturn={onCloseSuccess}
                      onCreateNext={null}
                      entity={newEntity}
                    />
                  )}
                </DialogContent>
              </Dialog>
              <Snackbar 
                open={showSnack} 
                onClose={() => setShowSnack(false)}
                anchorOrigin={{vertical:  'bottom',
                  horizontal:'right',}}
                autoHideDuration={6000} 
                action={
                  <IconButton size="small" aria-label="close" color="inherit" onClick={() => setShowSnack(false)}>
                      <FontAwesomeIcon icon={faTimes} size="1x" />
                  </IconButton>
                }>
                  <Alert severity={"success"}>{snackMessage}</Alert>
              </Snackbar>  

            </Paper>
          </HuBMAPContext.Provider>
        </StandardErrorBoundary>
      )}
    </div>
  </div>
  );
  
}
      

export default App