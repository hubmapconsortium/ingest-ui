import * as React from "react";
import {useState,useEffect} from "react";
import {useNavigate,Routes,Route,Link,useLocation,} from "react-router-dom";

import StandardErrorBoundary from "./utils/errorWrap";
import ErrorPage from "./utils/errorPage";
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
import {Alert} from '@material-ui/lab';
import Snackbar from '@mui/material/Snackbar';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';

import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle,faTimes} from "@fortawesome/free-solid-svg-icons";

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import {ingest_api_users_groups,ingest_api_all_groups} from './service/ingest_api';
import {ubkg_api_get_dataset_type_set,ubkg_api_get_organ_type_set} from "./service/ubkg_api";
import {sortGroupsByDisplay} from "./service/user_service";
import {BuildError} from "./utils/error_helper";
// import {htmlDecode} from "./utils/string_helper";
import {Navigation} from "./Nav";

/* Using legacy SearchComponent for now. See comments at the top of the New SearchComponent File  */

import Result from "./components/uuid/result";

import {RenderDonor} from "./components/donors";
import {RenderDataset} from "./components/datasets";
import {RenderSample} from "./components/samples";
import {RenderUpload} from "./components/uploads";
import {RenderPublication} from "./components/publications";
import {RenderCollection} from "./components/collections";
import {RenderMetadata} from "./components/metadata";

import {RenderBulk} from "./components/bulk";

import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';


export function App (props){
  let navigate = useNavigate();
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [successDialogRender, setSuccessDialogRender] = useState(false);
  var [snackMessage, setSnackMessage] = useState("");
  var [showSnack, setShowSnack] = useState(false);
  var [newEntity, setNewEntity] = useState(null);
  var [authStatus, setAuthStatus] = useState(false);
  var [unregStatus, setUnegStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [allGroups, setAllGroups] = useState(null);
  var [timerStatus, setTimerStatus] = useState(true);
  var [dataTypeList, setDataTypeList] = useState({});
  var [dataTypeListAll, setDataTypeListAll] = useState({});
  var [organList, setOrganList] = useState();
  var [userGroups, setUserGroups] = useState({});
  var [userDataGroups, setUserDataGroups] = useState({});
  var [userDev, setUserDev] = useState(false);
  var [regStatus, setRegStatus] = useState(false);
  var [isLoading, setIsLoading] = useState(true);
  var [dtloading, setDTLoading] = useState(true);
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
      try {
        ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
          // console.debug("LocalStorageAuth", results);

          if (results && results.status === 200) {
            // console.debug("LocalStorageAuth", results);
            setUserGroups(results.results);
            setUserDataGroups(results.results);
            if (results.results.length > 0) { 
              setRegStatus(true); 
              for (let group in results.results) {
                if(results.results[group].displayname.includes("IEC")){
                  setUserDev(true)
                }
              }
            }
            setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
            setTimerStatus(false);
            setIsLoading(false);
            setAuthStatus(true);
          } else if (results && results.status === 401) {
            console.debug('%c◉ FAIL WITH 410 ', 'color:#00ff7b', );
            setGroupsToken(null);
            setAuthStatus(false);
            setRegStatus(false);
            setTimerStatus(false);
            setIsLoading(false);
            if (localStorage.getItem("isHubmapUser")) {
              // If we were logged out and we have an old token,
              // We should promopt to sign back in
              CallLoginDialog();
            }
          } else if (results && results.status === 403 && results.results === "User is not a member of group HuBMAP-read") {
            // console.debug("HERE results", results, results.results);
            setAuthStatus(true);
            setRegStatus(false);
            setUnegStatus(true);
            setIsLoading(false);  
        }
      });
      }catch(error){
        console.debug('%c◉ FAIL WITH ERROR 410 ', 'color:#ff0000', );
        setTimerStatus(false);
        setIsLoading(false)
        throw new Error(error);
      }
    }else{
      setTimerStatus(false);
      setIsLoading(false)
      setAuthStatus(false);
    }
  }, [ ]);

  useEffect(() => {
    console.debug("useEffect ubkg")
    ubkg_api_get_dataset_type_set()
      .then((response) => {
        console.debug('%c⊙', 'color:#00ff7b', "DATSETTYPES", response );
        let dtypes = response;
        setDataTypeList(dtypes);
        setDataTypeListAll(dtypes);
        ubkg_api_get_organ_type_set()
          .then((res) => {
            setOrganList(res);
            setDTLoading(false)
          })
          .catch((err) => {
            reportError(err)
        })
      })
      .catch(error => {
        if (unregStatus) {
          setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
          setTimerStatus(false);
          CallLoginDialog();
        } else {
          console.debug('%c⭗', 'color:#ff005d', "APP ubkg_api_get_assay_type_set ERROR", error);
            reportError(error)
        } 
      });
  }, [unregStatus ]);

  useEffect(() => {
    if(localStorage.getItem("info")){
      try {
        ingest_api_all_groups(JSON.parse(localStorage.getItem("info")).groups_token)
        .then((res) => {
          var allGroups = sortGroupsByDisplay(res.results);
          console.debug('%c⊙ allGroups!!', 'color:#00ff7b', allGroups );
          setAllGroups(allGroups);
        })
        .catch((err) => {
          console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
        })
      } catch (error) {
        console.debug("%c⭗", "color:#ff005d",error);
      }
    }

  },[])
  
  
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
  
  
  function clearAuths() {  
    if(process.env.REACT_APP_URL == "http://localhost:8585"){
      console.debug('%c◉ clearAuths start ', 'color:#00ff7b' );
      return new Promise((resolve) => {
        setTimeout(() => { // Give it a chance to cleaer the local storage
          localStorage.removeItem("info");
          localStorage.removeItem("isAuthenticated");
          resolve();
        }, 2000);
      });
    }
  }

  function Logout(){
    clearAuths().then((response) => {
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
      {isLoading || dtloading || (groupsToken && (!allGroups || allGroups.length<=0)) && (
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
            <Paper className="px-5 py-4">



            <Routes>

              
              
              <Route index element={<SearchComponent organList={organList} entity_type='' reportError={reportError} packagedQuery={bundledParameters}  urlChange={urlChange} handleCancel={handleCancel}/>} />
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
        </StandardErrorBoundary>
      )}
  </div>
  </div>
  );
  
}
      

export default App