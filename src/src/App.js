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
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {faExclamationTriangle,faTimes} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
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
import {Search} from "./components/Search";
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
  var[showFullError, setShowFullError] = useState(false);
  
  var[userDev, setUserDev] = useState(true);
  var[adminStatus, setAdminStatus] = useState(false);
  var[APIErrQueue, setAPIErrQueue] = useState([]);

  var[isLoggingOut, setIsLoggingOut] = useState(false);
  var[isLoading, setIsLoading] = useState(true);
  var[bannerTitle,setBannerTitle] = useState();
  var[bannerDetails,setBannerDetails] = useState();
  var[bannerShow,setBannerShow] = useState(false);

  // Error Query Bits
  var[errorShow,setErrorShow] = useState(false);
  var[errorInfo,setErrorInfo] = useState("");
  var[errorInfoShow,setErrorInfoShow] = useState(false);
  var[errorDetail, setErrorDetail] = useState({});

  // API Error Bits 
  var[showFullError, setShowFullError] = useState(false);

  const APIErrorTip = "Please refresh the page or try logging out and back in. If this error persists, contact help@hubmapconsortium.org"

  window.onstorage = (event) => {
    console.log("onstorage Storage Event!", event);
  };

  useEffect(() => {
    // in your react app useEffect hook call the following
    const t = Math.floor(Date.now()/1000); // current UTC time in seconds
    const bannerUrl = `${process.env.REACT_APP_URL}` + '/assets/liveBanner.json?v='+t;
    console.debug('%c◉ bannerUrl ', 'color:#00ff7b', bannerUrl);
    fetch(bannerUrl) 
      .then(response => { 
        if (!response.ok) { 
          return {}
        }
        return response.json(); 
      })
      .then(result => { 
        if (result.title || result.details) {
          setBannerTitle(result.title)
          setBannerDetails(result.details)
          setBannerShow(true)
        }
    
      })
      .catch(error => { 
        console.error('There was a problem with the fetch operation:', error);
      })

    gateway_api_status()
      .then((response) => {
        // If any monitored services are false, surface a friendly APIErr
        console.debug('%c◉ gateway_api_status response ', 'color:#00ff7b', response, response.results);
        if (response && response.results) {
          // Collect the keys whose value is explicitly false
          const downServices = Object.keys(response.results).filter((k) => response.results[k] === false);
          // Format labels: split underscores, Title-Case words, keep "API" uppercase
          const downServiceLabels = downServices.map((service) =>
            service
              .split('_')
              .map((word) =>
                word.toLowerCase() === 'api'
                  ? 'API'
                  : word.charAt(0).toUpperCase() + word.slice(1)
              )
              .join(' ')
          );
          if (downServices.length > 0) {
            setAPIErrQueue((prev) => [...prev,[
                `Service Disruption: ${downServiceLabels.join(', ')}`,
                `There might be an ongoing service disruption for: ${downServiceLabels.join(', ')} If you encounter instability, please try again later, or contact help@hubmapconsortium.org if the problem persists`,
                
              ],
            ]);
          }
        }
      })
      .catch((error) => {
        console.error('gateway_api_status ERROR', error);
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
          if(res !== undefined){
            localStorage.setItem("organs",JSON.stringify(res));
            localStorage.setItem("organ_icons", JSON.stringify(OrganDetails()));
          }else{
            console.debug('%c◉ Undefined Caught! ', 'color:#00ff7b', );
            setAPIErrQueue((prev) => [...prev,["API Error - UBKG: Organs", ` No local ORGAN data was found. ${APIErrorTip}`, res],
            ]);
          } 
        })
        .catch((error) => {
          console.debug('%c◉ Get organs ubkg_api_get_organ_type_set ERROR ','color:#E7EEFF;background: #C800FF;padding:200', error);
          setAPIErrQueue((prev) => [...prev,[
              "API Error - UBKG: Organ Type Set",
              `No local ORGAN data was found, and there was an error repopulating the data. ${APIErrorTip}`,
              error,
            ],
          ])
        })
    }else{
      // we already have organs
      loadCount()
    }

    // The Full RUI details for Organs
    if(!localStorage.getItem("organs_full")){
      let tip = "Please refresh the page or try logging out and back in. If this error persists, contact help@hubmapconsortium.org"
      ubkg_api_get_organs_full()
        .then((res) => {
          if (res === undefined){
            setAPIErrQueue((prev) => [...prev,[`API Error - UBKG: Organ Details`, `Unable to load Organ Detail res from UBKG. ${APIErrorTip}`],
            ]);
          }else{
            localStorage.setItem("organs_full", JSON.stringify(res));
            let RUIOrgans = res  
              .filter(org => org.rui_supported)
              .map(org => org.rui_code);
            localStorage.setItem("RUIOrgans", JSON.stringify(RUIOrgans));
          }

        })
        .catch((error) => {
          console.debug('%c◉ Get FULL organs ubkg_api_get_organs_full ERROR ','color:#E7EEFF;background: #C800FF;padding:200', error);
          setAPIErrQueue((prev) => [...prev,[
              "API Error - UBKG: Organ Details",
              `Error when populating Organ Detail data from UBKG. ${APIErrorTip}`,
              error,
            ],
          ]);
        });
    }

    if(!localStorage.getItem("dataset_types")){
      ubkg_api_get_dataset_type_set()
        .then((res) => {
          loadCount() // the dataset_types step
          if(res !== undefined){
            localStorage.setItem("dataset_types",JSON.stringify(res));
          }else{
            setAPIErrQueue((prev) => [...prev,[
                "API Error - UBKG: Dataset Types",
                `No local Dataset Type data could be found and none could be fetched. ${APIErrorTip}`,
                res,
              ],
            ]);
          }
        })
        .catch((error) => {
          console.debug('%c◉  Caught error ubkg_api_get_dataset_type_set ', 'color:#E7EEFF;background: #C800FF;padding:200', );
          setAPIErrQueue((prev) => [...prev,[
              "API Error - UBKG: Dataset Types",
              `No local DATASET TYPE definitions were found and none could be fetched. ${APIErrorTip}`,
              error,
            ],
          ])
        })
      loadCount() // the dataset_types step
    }else{
      // we already have Dataset Types but they are not good
      if (!ValidateLocalStoreValue(JSON.parse(localStorage.getItem("dataset_types")))) {
        localStorage.removeItem("dataset_types");
        console.debug("%c◉  Malformed DT","color:#E7EEFF;background: #C800FF;padding:200",JSON.parse(localStorage.getItem("dataset_types")));
        setAPIErrQueue((prev) => [...prev,[
            "API Error - UBKG: Dataset Types",
            `Local Dataset Type value storage malformed, Please refresh the page to repopulate the data. If this error persists, contact help@hubmapconsortium.org`,
          ],
        ]);
      }
      loadCount() // the dataset_types step
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
    
    // User Loading Bits Now
    try{
      if(localStorage.getItem("info")){ // Cant depend on this, might get wiped on a purge call?
        // Validate our Token
        api_validate_token(JSON.parse(localStorage.getItem("info")).groups_token)
          .then((results) => {
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
                        setAPIErrQueue((prev) => [...prev,[
                            'User Group Data Error',
                            'No local User Group data could be found and attempts to fetch this data have failed. Please try logging out and back in, or trying again later. If this error persists, contact help@hubmapconsortium.org',
                            res
                          ],
                        ]);
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
      setAPIErrQueue((prev) => [...prev,[
          "User Group Data Error",
          `No local User Group data could be found and attempts to fetch this data have failed. ${APIErrorTip}`,
          error,
        ],
      ])
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

  // API Error bits
  function renderAPIError(){
    let baseChevronStyle = {
      cursor: "pointer",
      color: "#fff",
      transition: "transform 200ms ease-in-out",
      height: "0.6em",
      marginLeft: "-3px",
      paddingBottom: "2px",
    };

    const APIErrorItem = ({ err, idx }) => {
      const [open, setOpen] = useState(false);
      const title = err && err[0] ? err[0] : "API Error";
      const details = err && err[1] ? err[1] : "";
      const extra = err && err[2] ? err[2] : null;
      const hidePrefix = err && err[3] ? err[3] : false;

      const closeThisAlert = () => {
        setAPIErrQueue((prev) => prev.filter((_, i) => i !== idx));
      };

      return (
        <Alert
          key={idx}
          className="APIAlertCell"
          variant="filled"
          severity="error"
          icon={<SyncProblemIcon />}
          sx={{ mb: 1 }}
          action={
            <IconButton
              size="small"
              aria-label={`close-alert-${idx}`}
              color="inherit"
              onClick={closeThisAlert}>
              <FontAwesomeIcon icon={faTimes} />
            </IconButton>
          }>
          {!hidePrefix && <>{title}</>}
          {extra && <>&nbsp; {extra}</>}
          &nbsp;| Render full error details?
          <ArrowForwardIosIcon
            onClick={() => setOpen(!open)}
            sx={
              open
                ? { ...baseChevronStyle, transform: "rotate(90deg)" }
                : baseChevronStyle
            }
          />
          <Collapse in={open}>{details}</Collapse>
        </Alert>
      );
    };

    return (
      <Box
        className="ErrorPanel mb-2"
        sx={() => ({
          '& .APIAlertCell': 
          APIErrQueue.length > 1 ? {
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
          }:{},
          '& .APIAlertCell:first-of-type': 
            APIErrQueue.length > 1 ? {
              borderTopLeftRadius: "0.375rem",
              borderTopRightRadius: "0.375rem",
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }:{},
          '& .APIAlertCell:not(:last-of-type)': 
          APIErrQueue.length > 1 ? {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          } : {},
        })}
      >
        {APIErrQueue.map((err, idx) => (
          <APIErrorItem err={err} idx={idx} key={idx} />
        ))}
      </Box>
    );
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
        <Timer logout={Logout}/>
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
          
            {APIErrQueue.length > 0 && (
              <>
                {renderAPIError()}
              </>
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
                      
                    <Route index element={<Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route index element={<Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route path="/" element={ <Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                    <Route path="/login" element={<Login />} />
                    <Route path='/newSearch' element={ <Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>

                    <Route path="/new">
                      <Route index element={<Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
                      <Route path='donor' element={ <DonorForm onCreated={(response) => creationSuccess(response)}/>}/>
                      <Route path='sample' element={<SampleForm onCreated={(response) => creationSuccess(response)} /> }/> 
                      <Route path='publication' element={<PublicationForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path='collection' element={<CollectionForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path='epicollection' element={<EPICollectionForm onCreated={(response) => creationSuccess(response)}/>} /> 
                      <Route path="dataset" element={<Search urlChange={(event, params, details) => urlChange(event, params, details)}/>}/>
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