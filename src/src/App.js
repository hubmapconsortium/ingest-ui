import *as React from "react";
import {useEffect,useState} from "react";
import {Route,Routes,useLocation,useNavigate} from "react-router-dom";
import {HuBMAPContext} from "./components/hubmapContext";
import Timer from './components/ui/idle';
import Login from './components/ui/login';
import ErrorPage from "./utils/errorPage";
import StandardErrorBoundary from "./utils/errorWrap";
import LinearProgress from '@mui/material/LinearProgress';
import {Alert} from '@material-ui/lab';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import Paper from '@mui/material/Paper';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {faExclamationTriangle,faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

import {BuildError} from "./utils/error_helper";
import {Navigation} from "./Nav";
import Result from "./components/ui/result";
import {SpeedDialTooltipOpen} from './components/ui/formParts';
import {OrganDetails} from './components/ui/icons';
import {ValidateLocalStoreValue} from './utils/validators';
import {sortGroupsByDisplay,adminStatusValidation} from "./service/user_service";
import {api_validate_token} from './service/search_api';
import {ubkg_api_get_dataset_type_set,ubkg_api_get_organ_type_set, ubkg_api_get_organs_full} from "./service/ubkg_api";
import {ingest_api_all_groups,ingest_api_users_groups} from './service/ingest_api';
import { gateway_api_status } from "./service/gateway_service";

// The legacy form loaders
import {RenderMetadata} from "./components/metadata";
import {RenderBulk} from "./components/bulk";

// The New Forms
import {NewSearch} from "./components/Search";
import {DonorForm} from "./components/forms/Donors";
import {UploadForm} from "./components/forms/Uploads";
import {SampleForm} from "./components/forms/Samples";
import {PublicationForm} from "./components/forms/Publications";
import {DatasetForm} from "./components/forms/Datasets";
import {CollectionForm} from "./components/forms/Collections";
import {EPICollectionForm} from "./components/forms/Epicollections";

import NotFound from "./components/404";

export function App(){
  let navigate = useNavigate();
  // @todo: trim how many need to actually be hooks / work with the state
  var[expiredKey,setExpiredKey] = useState(false);
  var[loginError,setLoginError] = useState("");
  var[successDialogRender, setSuccessDialogRender] = useState(false);
  var[snackMessage, setSnackMessage] = useState("");
  var[showSnack, setShowSnack] = useState(false);
  var[newEntity, setNewEntity] = useState(null);
  var[authStatus, setAuthStatus] = useState(false);
  var[unregStatus, setUnregStatus] = useState(false);
  var[allGroups, setAllGroups] = useState(null);
  
  var[userDev, setUserDev] = useState(true);
  var[adminStatus, setAdminStatus] = useState(false);
  var[APIErr, setAPIErr] = useState(false);

  var[isLoggingOut, setIsLoggingOut] = useState(false);
  var[isLoading, setIsLoading] = useState(true);
  var[bannerTitle,setBannerTitle] = useState();
  var[bannerDetails,setBannerDetails] = useState();
  var[bannerShow,setBannerShow] = useState(false);

  window.onstorage = (event) => {
    console.log("onstorage Storage Event!", event);
  };

  useEffect(() => {
    gateway_api_status()
    .then((response) => {
      // If any monitored services are false, surface a friendly APIErr
      if (response && response.results) {
        const toTitle = (key) =>key
          .split('_')
          .map(w => (w.toUpperCase() === 'API' ? 'API' : w.charAt(0).toUpperCase() + w.slice(1)))
          .join(' ');
        const downServices = Object.entries(response.results)
            .filter(([key, val]) => !val) // treat falsy as "down"
            .map(([key]) => toTitle(key));
        if (downServices.length > 0) {
          setAPIErr([
            "There is currently a service disruption detected for: ",
            downServices.join(", "),
            "If you encounter instability, please try again later, or contact help@hubmapconsortium.org",
            "Service Instability"
          ]);
        }
      }
    })
    .catch((error) => {
      console.error("gateway_api_status ERROR", error);
    });

    var loadCounter = 0;
    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");
    if(info !== null){
      localStorage.setItem("info", info);
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }
    // If we're here because we tried making a new Dataset from the old url, show the warning popup 
    if(url.pathname === "/new/dataset" ){
         
    }

    // @TODO: Maybe we can shuffle all of these 'Loading' bits into their own component to clean this up?
    // Load organs into LocalStorage if need be
    // Which will be after every new login 
    if(!localStorage.getItem("organs") || !localStorage.getItem("organ_icons")){
      ubkg_api_get_organ_type_set()
        .then((res) => {
          loadCount() // the Organ step
          // lets also save the organ-image mapping
          let organIcons = OrganDetails();
          localStorage.setItem("organ_icons", JSON.stringify(organIcons));
          if(res !== undefined){
            localStorage.setItem("organs",JSON.stringify(res));
            // setOrganList(res); // TODO: Eventually remove & use localstorage
          }else{
            // Not cached, we cant really go on
            setAPIErr(["UBKG API : Organ",'No local ORGAN data was found. Please try again later, or contact help@hubmapconsortium.org',res])
            // reportError(res)
          } 
        })
        .catch((err) => {
          // Not cached, we cant really go on
          setAPIErr("UBKG API Error: Organ Type Set",'No local ORGAN data was found. Please try again later, or contact help@hubmapconsortium.org',err)
          // reportError(err)
        })
    }else{
      // we already have organs
      loadCount()
    }

    // Loads MenuMap Details
    if(!localStorage.getItem("menuMap")){
      localStorage.setItem("menuMap", JSON.stringify({
        "datasetadmin": {
          "blackList": [
            "collection",
            "epicollection"
          ]
        },
        "publication": {
          "whiteList": [
            "dataset"
          ]
        },
        "collection": {
          "whiteList": [
            "dataset"
          ]
        },
        "epicollection": {
          "whiteList": [
            "dataset"
          ]
        },
        "sample": {
          "blackList": [
            "collection",
            "epicollection",
            "dataset",
            "upload",
            "publication"
          ]
        }
      }));
    }
    
    // The Full RUI details for Organs
    if(!localStorage.getItem("organs_full")){
      ubkg_api_get_organs_full()
        .then((data) => {
          localStorage.setItem("organs_full", JSON.stringify(data));
          let RUIOrgans = data  
            .filter(org => org.rui_supported)
            .map(org => org.rui_code);
          localStorage.setItem("RUIOrgans", JSON.stringify(RUIOrgans));

        })
        .catch(() => {
          // console.debug("RUI_ORGAN_MAP", error, error.response);
        });
    }

    if(!localStorage.getItem("dataset_types")){
      ubkg_api_get_dataset_type_set()
        .then((res) => {
          loadCount() // the dataset_types step
          if(res !== undefined){
            localStorage.setItem("dataset_types",JSON.stringify(res));
            // TODO: Eventually remove these & use localstorage
            // setDataTypeList(res);
            // setDataTypeListAll(res);
          }else{
            setAPIErr(["UBKG API : Dataset Types",'No local DATASET TYPE definitions were found and none could be fetched  Please try again later, or contact help@hubmapconsortium.org',res])
          }
        })
        .catch((err) => {
          // Not cached, we cant really go on
          setAPIErr("UBKG API Error: Dataset Types",'No local DATASET TYPE definitions were found and none could be fetched. Please try again later, or contact help@hubmapconsortium.org ',err)
        })
      loadCount() // the dataset_types step
    }else{
      // we already have Dataset Types but are they good
      if (!ValidateLocalStoreValue(localStorage.getItem("datatypes"))) {
        localStorage.removeItem("datatypes");
      }
      loadCount()
    }

    // User Loading Bits Now
    try{
      if(localStorage.getItem("info")){ // Cant depend on this, might get wiped on a purge call?
        // Validate our Token
        api_validate_token(JSON.parse(localStorage.getItem("info")).groups_token)
          .then((results) => {
            // console.debug('%c◉ results  ', 'color:#b300ff', results);
            loadCount() // the API token step
            if(results.error?.response && results.error.response.status){
              setExpiredKey(true);
              if(results.error.response.status ===401 ){
                // No more message, just full cache-dump and reload

                // Need to give sotrage a chance to clear,
                setTimeout(() => {
                  purgeStorage();
                }, 10);                
                // THEN lets refresh
                setTimeout(() => {
                  window.location.replace(`${process.env.REACT_APP_DATAINGEST_API_URL}/logout`)
                }, 2000);
                
                // setLoginError("Your login credentials are invalid or have expired.  Please try logging out and and back in.");
              }else if(results.error.response.data.error && results.error.response.status !==401){
                setLoginError(results.error.response.data.error );
              }else{
                setLoginError("API Key Error");
              }
            }else if(!results.error){
              // console.debug('%c◉ API Key OK ', 'color:#00ff7b', results);
              setAuthStatus(true);
              adminStatusValidation()
                .then((adminCheck) => {
                  setAdminStatus(adminCheck);
                })
                .catch(() => {
                  // console.debug('%c◉ setAdminStatus Error ', 'color:#ff005d', err);
                })

              try{
                if( (!localStorage.getItem('userGroups') || localStorage.getItem('userGroups') === undefined || localStorage.getItem('userGroups') === "Non-active login") && localStorage.getItem("info") ){
                  ingest_api_users_groups()
                    .then((res) => {
                      if(res && res.status === 403 && res.results === "User is not a member of group HuBMAP-read"){
                        // console.log("User is not a member of group HuBMAP-read");
                        setAuthStatus(true);
                        setUnregStatus(true);
                      }else if(res.results === "Non-active login" || res.status === 401){ // 401 Capture for non-active login
                        // The API Token Validation seems to provide a 200 response even when the token is expired?
                        // Added status check if/when we begin getting 401s directly
                        // console.log("Non-active login");
                        setExpiredKey(true);
                        loadFailed(res);
                      }else if(res.status === 200){
                        // console.debug('%c◉ UserGroups from ingest_api_users_groups ', 'color:#b300ff', res.results);
                        localStorage.setItem("userGroups",JSON.stringify(res.results));
                      }else{
                        setAPIErr(["User Group Data Error",'No local User Group data could be found and attempts to fetch this data have failed. Please try again later, or contact help@hubmapconsortium.org',res])
                        // loadFailed(res)
                      }
                    })
                    .catch((err) => {
                      loadFailed(err)
                    })
                }else{
                  // we already have user groups
                }
              }
              catch(error){
                loadFailed(error);
              }
              loadCount()  // the User's Groups step

              // All Groups
              try{
                if(!localStorage.getItem("allGroups")){
                  try{
                    ingest_api_all_groups()
                      .then((res) => {
                        var allGroups = sortGroupsByDisplay(res.results);
                        localStorage.setItem("allGroups",JSON.stringify(allGroups));
                        setAllGroups(allGroups);  
                      })
                      .catch((err) => {
                        loadFailed(err)
                      })
                  }catch(error){
                    loadFailed(error)
                  }
                }else{
                  // we already have groups
                }
              }
              catch(error){  
                loadFailed(error)
              }
              loadCount()  // the All Groups step

            }else{
              setExpiredKey(true);
            }
          })
          .catch((err) => {
            console.debug('%c⭗', 'color:#ff005d', "API Key Validity ERR", err );
            reportError(err) 
          })
  
      }else{
        // No Info, No Auth, provide login screen nothing else to load
        // console.debug('%c◉ No INFO found ', 'color:#ff005d');
        setIsLoading(false)
      }   
    } 
    catch(error){
      setAPIErr(["User Group Data Error",'No local User Group data could be found and attempts to fetch this data have failed. Please try again later, or contact help@hubmapconsortium.org',error])
    }
    
    // Banner Setting
    // We'll sometimes have details & no title, 
    // but ALWAYS have details
    if( window.hasOwnProperty('REACT_APP_BANNER_DETAILS') && window.REACT_APP_BANNER_DETAILS!==""){
      setBannerTitle(window.REACT_APP_BANNER_TITLE ? window.REACT_APP_BANNER_TITLE : "" );
      setBannerDetails(window.REACT_APP_BANNER_DETAILS);
      setBannerShow(true)
    }

    function loadCount(){
      loadCounter++;
      // console.debug('%c⊙', 'color:#00ff7b', "APP loadCounter", loadCounter );
      if(loadCounter>=5){
        setIsLoading(false)
        // console.log("Loading Complete")
      }
    }
  
    function loadFailed(error){
      // console.debug('%c⭗ APP loadFailed', 'color:#ff005d', "", loadCounter, error );
      reportError(error);
    }
    
  
  }, []);

  function purgeStorage(){
    localStorage.removeItem('info');
    localStorage.removeItem('organs');
    localStorage.removeItem('organ_icons');
    localStorage.removeItem('organs_full');
    localStorage.removeItem('RUIOrgans');
    localStorage.removeItem('datatypes');
    localStorage.removeItem('allGroups');
    localStorage.removeItem('userGroups');
  };

  function Logout(e){
    setIsLoggingOut(true);
    purgeStorage();
    window.location.replace(`${process.env.REACT_APP_DATAINGEST_API_URL}/logout`)
  };  
  
  function closeExpiredSnack(){
    setExpiredKey(false)
    window.location.reload();
  };
  
  function handleCancel(){
    navigate("/");
  }
  const onClose = () => {
    navigate("/");
  }
  const onCloseSuccess = () => {
    setSuccessDialogRender(false);
    onClose();
  }
  
  function urlChange(event, target){
    console.debug('%c◉ urlChange ', 'color:#00ff7b', event, target );
    if(target && target!==undefined){
      var lowerTarget = target.toLowerCase();
      if(event.ctrlKey || event.metaKey){
        window.open(target,'_blank')
      }else{
        navigate(lowerTarget);
      }
    }
    if(event && event==="raw"){
      var lowerTarget = event.toLowerCase();
      if(event.ctrlKey || event.metaKey){
        window.open(target,'_blank')
      }else{
        navigate(lowerTarget, {replace: true});
      }
    }
  }

  // Success Modal Response
  function creationSuccess(results){
    // console.debug('%c⊙', 'color:#00ff7b', "APP creationSuccess", results );
    setNewEntity(results)
    setSuccessDialogRender(true);
  }
  function onCreateNext(source){
    // console.debug('%c⊙', 'color:#00ff7b', "APP creationSuccess", source );
    window.location.replace(
      `${process.env.REACT_APP_URL}/new/sample/?source=${JSON.stringify(source)}`
    )
  }

  // Success SNack Response
  function updateSuccess(entity){
    // console.debug('%c⊙', 'color:#00ff7b', "APP creationSuccess", entity);
    setSnackMessage(entity.message ? entity.message : "Entity Updated Successfully!");
    setShowSnack(true)
    onClose();
  }

  // console.debug('%c◉ Inf` ', 'color:#00ff7b', JSON.parse(localStorage.getItem("info")) );  
  const{search} = useLocation();
  // Search Query Bits
  // @TODO: is search itself already handling this / is this an old prop drill?


  // Error Query Bits
  var[errorShow,setErrorShow] = useState(false);
  var[errorInfo,setErrorInfo] = useState("");
  var[errorInfoShow,setErrorInfoShow] = useState(false);
  var[errorDetail, setErrorDetail] = useState({});

  function reportError(error, details){
    console.debug('%c⭗', 'color:#ff005d', "APP reportError", error, details);
    if(details){
      setErrorDetail(details);
    }
    typeof error === "string" ? setErrorInfo(error) : setErrorInfo(JSON.stringify(error));
    var errString = JSON.stringify(BuildError(error), Object.getOwnPropertyNames(BuildError(error)))
    if(error && error.results){
      errString = JSON.stringify(BuildError(error.results), Object.getOwnPropertyNames(BuildError(error.results)))
    }
    setErrorInfo(errString);
    setErrorShow(true);
    throw(error || "Unknown Error?");
  }

  return(
    <React.Fragment>
      <div className={"App pb-3 env-"+process.env.REACT_APP_NODE_ENV }>
        <Snackbar
          open={expiredKey}
          anchorOrigin={{vertical: 'top', horizontal: 'center'}}
          // autoHideDuration={6000}
          onClose={() => closeExpiredSnack()}>
          <Alert variant="filled" severity="error">{loginError}</Alert>
        </Snackbar>
        <Navigation 
          login={authStatus} 
          isLoggingOut={isLoggingOut}
          logout={Logout}
          userDataGroups={JSON.parse(localStorage.getItem("userGroups") ? localStorage.getItem("userGroups") : null)}
          appInfo={JSON.parse(localStorage.getItem("info"))}/>       
        (<Timer logout={Logout}/>
        <div id="content" className="container">
          <StandardErrorBoundary
            FallbackComponent={ErrorPage}
            onError={() => {
              // console.log("Error caught!");  
              // console.error(error);
              // console.error(errorInfo);
            }}>
            <Drawer 
              sx={{
                color: 'white',
                height: 150 ,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                  height: 150,
                  boxSizing: 'border-box'
                },
              }}
              variant="temporary"
              className="alert-danger"
              anchor='bottom'
              open={errorShow}>
                <Box 
                  sx={{
                    width: '100%', 
                    padding: 1, 
                    backgroundColor: '#dc3545', 
                    color: "#fff",'& span, h5': {display: 'inline-block',padding: "0 5px 0 0 "}
                  }}>
                  <Typography variant="h5" align="left">
                    <FontAwesomeIcon icon={faExclamationTriangle} sx={{padding: 1}}/>  Sorry!  </Typography>
                    <Typography align="left" variant="caption" >Something's gone wrong...</Typography>
                </Box>

              <Box sx={{
                width: '100%', height: '100%', padding: 1, backgroundColor: 'white', color: "#dc3545", 
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
                      <Typography variant="caption">{errorDetail}</Typography>
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
                <div dangerouslySetInnerHTML={{__html: bannerDetails}} />
              </div>
            )}
            {/* {isLoading || (groupsToken && (!allGroups || allGroups.length<=0)) && ( */}
            {isLoading && (<LinearProgress />)}

            {!authStatus && !isLoading && (
              <React.Fragment>
                <Routes>
                  <Route path="/" element={ <Login />} />
                  <Route path="/*" element={ <Login />} />
                  <Route path="*" element={ <Login />} />
                  <Route path="/login" element={ <Login />} />
                </Routes>
              </React.Fragment>
            )}
          
            {APIErr.length > 0 && (
              <Alert variant="filled" severity="error">
                
                {!APIErr[3] && (
                  <>There was an error populating from datasource {APIErr[0]}</>
                )}
                {APIErr[3] && (
                  <>{APIErr[3]}: {APIErr[0]}</>
                )}
                {APIErr[1]}&nbsp;{APIErr[2]}
              </Alert>
            )}

            {unregStatus === true && (
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

            {authStatus && !isLoading && !unregStatus &&(
              <HuBMAPContext.Provider value={{allGroups}}> 
                <Paper className={"px-4 py-3 admin-"+(adminStatus)}>
                  
                  {/* {() => renderSuccessDialog()} */}
                  <Routes>
                      
                    <Route index element={<NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route index element={<NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route path="/" element={ <NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route path="/login" element={<Login />} />
                    <Route path='/newSearch' element={ <NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>

                    <Route path="/new">
                      <Route index element={<NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                      <Route path='donor' element={ <DonorForm onCreated={(response) => creationSuccess(response)}/>}/>
                      <Route path='sample' element={<SampleForm onCreated={(response) => creationSuccess(response)} /> }/> 
                      <Route path='publication' element={<PublicationForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path='collection' element={<CollectionForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path='epicollection' element={<EPICollectionForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path="dataset" element={<NewSearch urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                      <Route path='datasetAdmin' element={<DatasetForm onCreated={(response) => creationSuccess(response)}/>}/>
                      <Route path='upload' element={ <UploadForm onCreated={(response) => creationSuccess(response)}/>}/>
                      {/* In Develpment here */}
                    </Route>
                                          
                    <Route path="/donor/:uuid" element={<DonorForm onUpdated={(response) => updateSuccess(response)}/>} />
                    <Route path="/sample/:uuid" element={<SampleForm onUpdated={(response) => updateSuccess(response)}/>} />
                    <Route path="/dataset/:uuid" element={<DatasetForm onUpdated={(response) => updateSuccess(response)}/>} />
                    <Route path="/upload/:uuid" element={ <UploadForm onUpdated={(response) => updateSuccess(response)}/>} />

                    <Route path="/publication/:uuid" element={<PublicationForm onUpdated={(response) => updateSuccess(response)} />} />
                    <Route path="/collection/:uuid" element={<CollectionForm onUpdated={(response) => updateSuccess(response)} />} />
                    <Route path="/epicollection/:uuid" element={<EPICollectionForm onUpdated={(response) => updateSuccess(response)} />} />

                    <Route path="/bulk/donors" exact element={<RenderBulk reportError={reportError} bulkType="donors" />} />
                    <Route path="/bulk/samples" exact element={<RenderBulk reportError={reportError} bulkType="samples" />} />
                    
                    <Route path="/metadata">
                      <Route index element={<RenderMetadata reportError={reportError} type="block" />} />
                      <Route path='block' element={ <RenderMetadata reportError={reportError} type='block'/>}/>
                      <Route path='section' element={ <RenderMetadata reportError={reportError} type='section'/>}/>
                      <Route path='suspension' element={ <RenderMetadata reportError={reportError} type='suspension'/>}/>
                    </Route>

                    {/* 404 */}
                    <Route path="/notFound" element={ <NotFound /> } />

                  </Routes>
 
                  <Dialog 
                    aria-labelledby="result-dialog" 
                    open={successDialogRender?true:false} 
                    sx={{margin: "auto"}}
                    fullWidth={ (newEntity && newEntity.newSamples) ? true : false}>
                    <DialogTitle sx={{background: "rgb(209, 231, 221)", marginBottom: "0.5em",}} >Success!</DialogTitle>
                      {newEntity && (
                        <DialogContent sx={newEntity.newSamples ? {maxWidth: "500px"} : {}}> 
                          {/* <DialogContent>  */}
                          <Result
                            result={{entity: newEntity}}
                            onReturn={() => onCloseSuccess()}
                            onCreateNext={() => onCreateNext(newEntity)}
                            entity={newEntity}
                          />
                        </DialogContent>
                      )}
                  </Dialog>
                  <Snackbar 
                    open={showSnack} 
                    onClose={() => setShowSnack(false)}
                    anchorOrigin={{vertical: 'bottom',horizontal: 'right',}}
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
            )}

          </StandardErrorBoundary>
        </div>
      </div>
      {localStorage.getItem("info") && JSON.parse(localStorage.getItem("info")).email === "JJW118@pitt.edu" && (
        <SpeedDialTooltipOpen />
      )}
    </React.Fragment>
  );
  
}

export default App