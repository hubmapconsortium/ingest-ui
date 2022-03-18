
import * as React from "react";
import {useState, useEffect,} from "react";
import {
  useNavigate,
  Routes,
  Route} from "react-router-dom";
  
  // Login Management
  import Login from './components/ui/login';
  import Timer from './components/ui/idle';


import { createTheme } from '@mui/material/styles';

import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';




import AnnouncementTwoToneIcon from '@mui/icons-material/AnnouncementTwoTone';
import { ingest_api_users_groups } from './service/ingest_api';
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
//import {ErrorBoundary} from 'react-error-boundary'




export function App (props){
  var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [loginDialogRender, setLoginDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  var [errStatus, setErrStatus] = useState(false);
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
        console.debug("LocalStorageAuth", JSON.parse(localStorage.getItem("info")).groups_token);
        localStorage.setItem("bearer", JSON.parse(localStorage.getItem("info")).groups_token);
        setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token)
        setAuthStatus(true);

      } else if (results && results.status === 401) {
        console.error("LocalStorageAuth 401!!", results);
        setGroupsToken(null);
        setAuthStatus(false);
        if(localStorage.getItem("info")){
          console.debug("login timed out");
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
    localStorage.removeItem("bearer");
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

  
  function packageError(err) {
    console.debug("packageError", err);
    setErrStatus(true)
  }
 
  
  function urlChange(target) {
    navigate(target);
  }
 

//console.debug("props", props);
  return (
    <div className={"App blur-"+errStatus} >
      
      
      <Navigation 
        login={authStatus} 
        logout={Logout}
        app_info={ JSON.parse(localStorage.getItem("info"))}
        uploadsDialogRender={uploadsDialogRender}
        onCreatedReditect={""}
      />       
      <Timer logout={Logout}/>

     


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

    
          <Routes>
              <Route path="/" element={ 

              <ErrorBoundary>
                <SearchComponent  
                  packageError={packageError} 
                  entity_type=' ' 
                  urlChange={urlChange} 
                  onCancel={handleCancel}/>
              </ErrorBoundary>
              
              } />

              <Route path="/login" element={<Login />} />

              <Route path="/donors" element={<SearchComponent packageError={packageError} filter_type="donors" urlChange={urlChange}/>} ></Route>
              <Route path="/samples" element={<SearchComponent packageError={packageError} filter_type="Sample" urlChange={urlChange} />} ></Route>
              <Route path="/datasets" element={<SearchComponent packageError={packageError} filter_type="Dataset" urlChange={urlChange} />} ></Route>
              <Route path="/uploads" element={<SearchComponent packageError={packageError} filter_type="uploads" urlChange={urlChange} />} ></Route>
                                    
              <Route path="/donor/:uuid" element={<RenderDonor  onCancel={handleCancel} status="view"/>} />
              <Route path="/sample/:uuid" element={
                
                <RenderSample onCancel={handleCancel} status="view"/>
                
              } />
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


          </Paper>
          )}
  </div>
  </div>
  );
  // return html;
  
}
      

export default App