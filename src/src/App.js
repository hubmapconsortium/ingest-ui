
import * as React from "react";
import {useState, useEffect} from "react";
import {
  useNavigate,
  Navigate,
  Routes,
  Route} from "react-router-dom";
  // Login Management
  import Login from './components/ui/login';
  
  import Dialog from '@mui/material/Dialog';
  import DialogActions from '@mui/material/DialogActions';
  import DialogContent from '@mui/material/DialogContent';
  import { useGridApiRef } from "@mui/x-data-grid";
  import MuiAlert from '@material-ui/lab/Alert';
  // UI Feedback
  
  
  // Site Content
import {Navigation} from "./Nav";
import {RenderLogin} from "./components/login";
import {RenderSearchComponent} from './components/SearchComponent';
import {RenderDonor} from "./components/donors";
import { RenderDataset} from "./components/datasets";
import {RenderSample } from "./components/samples";
import {RenderUpload} from "./components/uploads";

// Bulky
import {RenderBulk} from "./components/bulk";

// The Old Stuff
import Forms from "./components/uuid/forms";
import UploadsForm from "./components/uploads/createUploads";



function SetAuth(){
  var infoJSON = ""
  if(localStorage.getItem("info")){
    infoJSON = cleanJSON(localStorage.getItem("info"));
    var JSONkeys = Object.keys(infoJSON);
    // And if it's not, wipe it clean so we dont need to manually clear
    if(JSONkeys[0]==="Error"){
      // console.debug("Malformed Info stored. Clearing...");
      localStorage.removeItem("info");
      localStorage.removeItem("isAuthenticated");
      window.location.replace(`${process.env.REACT_APP_URL}`);  
      return false    
    }else{
      // console.debug("Info JSON forund in localStorage",infoJSON);
      localStorage.setItem("isAuthenticated", true);
      return true
    }
  // And if wevve got nothing  
  }else{
    infoJSON = {
      name: "",
      email: "",
      globus_id: ""
    };
    return false
    window.location.replace(`${process.env.REACT_APP_URL}`);  
  }
}

function CheckCreds(){
  var infoJSON = localStorage.getItem("info");
  if(infoJSON){
    return true
  }
  else{
    return false
  }
}

function CheckAuth(){
  var isAuth = localStorage.getItem("isAuthenticated");
  if(isAuth){
    return isAuth;
  }
  else{
    SetAuth();
  }
}

function CheckToken(){  
  var infoJSON = localStorage.getItem("info");
  if(infoJSON){
    return infoJSON.group_token;
  }
  else{
    SetAuth();
  }
}

function cleanJSON(str){
  try {     
    return JSON.parse(str);
  }
  catch (e) {
     return {
      "Error":true,
      "String":str,
    }
  }
}





export function App (props){
  var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  const apiRef = useGridApiRef();
  let navigate = useNavigate();

  useEffect(() => {

    if(SetAuth() === false){
      console.debug("No Auth");
      setAuthStatus(false);
    }else{
      console.debug("Auth");
      setAuthStatus(true);
    }
  }, []);



  function handleCancel(){
    window.history.back()
  }
  
  function handleLogout(e) {
    localStorage.setItem("isAuthenticated", false);
    localStorage.removeItem("info");
    navigate('/');
  };


  function CallUploadsDialog(){
    console.debug("CallUploadsDialog uploadsDialogRender");
    setUploadsDialogRender(true);
  }
 
  

  console.debug("props", props);
  return (
    <div className="App">
      {/* <IdleTimer
        ref={ref => {
          idleTimer = ref;
        }}
        element={document}
        onActive={this.onActive}
        onIdle={this.onIdle}
        onAction={this.onAction}
        debounce={250}
        timeout={SESSION_TIMEOUT_IDLE_TIME}
      /> */}
      
      <Navigation 
        login={localStorage.getItem("isAuthenticated")} 
        logout={handleLogout}
        app_info={localStorage.getItem("info")}
        uploadsDialogRender={uploadsDialogRender}
      />
      <div  className="container card mb-5">
           <div className="" id="content">


           {!authStatus && (
             <Routes>
                 <Route path="/" element={ <Login />} />
             </Routes>
           )}

          {authStatus && (
          <Routes>

              <Route path="/" element={ <RenderSearchComponent entity_type=' ' />} />
>
              <Route path="/login" element={<RenderLogin />} />

              <Route path="/donors" element={<RenderSearchComponent custom_title="Search" entity_type="donors" />} ></Route>
              <Route path="/samples" element={<RenderSearchComponent entity_type="samples" />} ></Route>
              <Route path="/datasets" element={<RenderSearchComponent entity_type="datasets" />} ></Route>
              <Route path="/uploads" element={<RenderSearchComponent entity_type="uploads" />} ></Route>
            
              <Route path="/donor/:uuid" element={<RenderDonor  status="view"/>} />
              <Route path="/sample/:uuid" element={<RenderSample status="view"/>} />
              <Route path="/dataset/:uuid" element={<RenderDataset  status="view"/>} />
              <Route path="/upload/:uuid" element={<RenderUpload  status="view"/>} />
              
              <Route path="/new/donor" element={
                <Forms formType='donor' onCancel={handleCancel} /> 
              }/>
              <Route path="/new/sample" element={
                <Forms formType='sample' onCancel={handleCancel} /> 
              }/>
              <Route path="/new/dataset" element={
                <Forms formType='dataset' onCancel={handleCancel} /> 
              }/> 

              <Route path="/new/sample" element={<RenderSample status="new" />} />
              <Route path="/new/dataset" element={<RenderDataset status="new" />} />
              <Route path="/bulk/donors" exact element={<RenderBulk bulkType="donors" />} />
              <Route path="/bulk/samples" element={<RenderBulk bulkType="samples" />} />
              <Route path="/new/data" element={<RenderSearchComponent uploadsDialog="true" CallUploadsDialog={CallUploadsDialog} />} />
              {/* <Forms formType={this.state.formType} onCancel={this.handleClose} /> */}

          </Routes>
          )}
  </div>

    </div>
  </div>
  );
  // return html;
  
}




export default App