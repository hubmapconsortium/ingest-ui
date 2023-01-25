
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

import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import { ingest_api_users_groups } from './service/ingest_api';
import {search_api_get_assay_list, search_api_get_assay_set} from "./service/search_api";
import {DataProviders} from "./utils/userInfo";

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

// Bulky
import {RenderBulk} from "./components/bulk";

// The Old Stuff
import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";


export function App (props){
  // var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  var [regStatus, setRegStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [timerStatus, setTimerStatus] = useState(true);
  var [isLoading, setIsLoading] = useState(true);
  var [dataTypeList, setDataTypeList] = useState({});
  var [dataTypeListAll, setDataTypeListAll] = useState({});
  var [dataTypeListPrimary, setDataTypeListPrimary] = useState({});
  var [userGroups, setUserGroups] = useState({});
  var [userDataGroups, setUserDataGroups] = useState({});
  let navigate = useNavigate();
  // const { sampleType, keywords } = useParams();

  
    

//   function LocalStorageAuth(){

    
// }

  

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
          setIsLoading(false);
        }

        if (results && results.status === 200) { 
          // console.debug("LocalStorageAuth", results);
          setUserGroups(results.results);
          var dataGroups = DataProviders(userGroups);
          setUserDataGroups(results.results);
          setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
          setTimerStatus(false);
          setAuthStatus(true);

          if(!userDataGroups || userDataGroups.length === 0){
            setRegStatus(false);
            setIsLoading(false);
          }else{
            setRegStatus(true);
          }
          

        // console.debug("groupsToken",groupsToken);
        search_api_get_assay_set("primary") // @TODO: Apply to dataset wrapper too? 
        .then((response) => {
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

        // The Dataset Form for New entites loads through the Form
       
        // return dt_dict;


      } else if (results && results.status === 401) {
        // console.debug("LocalStorageAuth", results);
        setGroupsToken(null);
        setAuthStatus(false);
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
      // console.debug("LocalStorageAuth", "CATCh No LocalStorage");
      setTimerStatus(false);
      setIsLoading(false)
    }


  }, [groupsToken, isLoading]);
  

  // A custom hook that builds on useLocation to parse
// the query string for you.
// function useQuery() {
//   const { search } = useLocation();
//   return React.useMemo(() => new URLSearchParams(search), [search]);
// }


  function Logout(){
  //console.debug("Logging out");
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
  };

  
  // function onChangeGlobusLink(newLink, newDataset){
  //   // const {name, display_doi, doi} = newDataset;
  //   // this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  // };



  function handleCancel(){
    window.history.back();  
  }



  const onClose = (event, reason) => {
      // setLoginDialogRender(true)
      // console.debug("onClose ", event, reason);
      navigate("/");
      // setLoginDialogRender(false);
    
  }


  const onCloseLogin = (event, reason) => {
      // setLoginDialogRender(true)
      // console.debug("onCloseLogin ", event, reason);
      navigate("/");
      setLoginDialogRender(false);
    
  }

  function CallLoginDialog(){
    // console.debug("CallLoginDialog Open");
    setLoginDialogRender(true);
  }

  // function CallUploadsDialog(){
  // //console.debug("CallUploadsDialog uploadsDialogRender");
  //   setUploadsDialogRender(true);
  // }
 

 
  
  function urlChange(target) {
    var lowerTarget = target.toLowerCase();
    // console.debug("urlChange", target, lowerTarget);
    navigate(lowerTarget,  { replace: true });
  }

  const app_info_storage = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")) : "";
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const queryType = queryParams.get('entityType');
  const queryKeyword = queryParams.get('keywords');
  const queryGroup = queryParams.get('group');

  var bundledParameters = {entityType: queryType, keywords: queryKeyword, group: queryGroup};


//console.debug("props", props);
  return (
    <div className="App">
      
      
      <Navigation 
        login={authStatus} 
        logout={Logout}
        app_info={ app_info_storage}
        userGroups={userGroups}
        userDataGroups={userDataGroups}
        // uploadsDialogRender={uploadsDialogRender}
        onCreatedReditect={""}
      />       
      <Timer logout={Logout}/>
      <div id="content" className="container">
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

     
          {authStatus && !regStatus && (
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
              <Route index element={<SearchComponent entity_type='' packagedQuery={bundledParameters}  urlChange={urlChange} handleCancel={handleCancel}/>} />
              <Route path="/" element={ <SearchComponent entity_type=' ' packagedQuery={bundledParameters} urlChange={urlChange} handleCancel={handleCancel}/>} />
              <Route path="/login" element={<Login />} />
              <Route path="/new">
                <Route index element={<SearchComponent />} />
                <Route path='donor' element={ <Forms formType='donor' onReturn={onClose} handleCancel={handleCancel} />}/>
                <Route path='dataset' element={<Forms formType='dataset' dataTypeList={dataTypeList} dtl_all={dataTypeListAll} dtl_primary={dataTypeListPrimary}new='true' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                <Route path='sample' element={<Forms formType='sample' onReturn={onClose} handleCancel={handleCancel} /> }/> 

{/* 
                  <Route path="/new/donor" element={ <Forms formType='donor' onReturn={onClose} handleCancel={handleCancel} />}/>
                  <Route path="/new/dataset" element={<Forms formType='dataset' dataTypeList={dataTypeList} new='true' onReturn={onClose} handleCancel={handleCancel} /> }/> 
                  <Route path="/new/sample" element={<Forms formType='sample' onReturn={onClose} handleCancel={handleCancel} /> }/> */}

              </Route>
              <Route path="/donors" element={<SearchComponent filter_type="donors" urlChange={urlChange}/>} ></Route>
              <Route path="/samples" element={<SearchComponent filter_type="Sample" urlChange={urlChange} />} ></Route>
              <Route path="/datasets" element={<SearchComponent filter_type="Dataset" urlChange={urlChange} />} ></Route>
              <Route path="/uploads" element={<SearchComponent filter_type="uploads" urlChange={urlChange} />} ></Route>

              <Route path="/donor/:uuid" element={<RenderDonor  handleCancel={handleCancel} status="view"/>} />
              <Route path="/sample/:uuid" element={<RenderSample handleCancel={handleCancel} status="view"/>} />
              <Route path="/dataset/:uuid" element={<RenderDataset dataTypeList={dataTypeList} handleCancel={handleCancel} status="view"/>} />
              <Route path="/upload/:uuid" element={<RenderUpload  handleCancel={handleCancel} status="view"/>} />

              {/* <Route path="/new/sample" element={<RenderSample status="new" />} /> */}
              {/* <Route path="/new/dataset" element={<RenderDataset status="new" />} /> */}
              <Route path="/bulk/donors" exact element={<RenderBulk bulkType="donors" />} />
              <Route path="/bulk/samples" element={<RenderBulk bulkType="samples" />} />
              {/* <Route path="/new/data" element={<SearchComponent uploadsDialog="true" CallUploadsDialog={CallUploadsDialog} changeLink={onChangeGlobusLink} />} /> */}
              {/* <Route path="/new/data" element={<SearchComponent uploadsDialog="true" CallUploadsDialog={CallUploadsDialog} changeLink={onChangeGlobusLink} />} /> */}
              {/* <Forms formType={this.state.formType} handleCancel={this.handleClose} /> */}
             
          </Routes>


          </Paper>
          )}
  </div>
  </div>
  );
  // return html;
  
}
      

export default App