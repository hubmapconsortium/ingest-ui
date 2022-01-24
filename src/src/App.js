
import * as React from "react";
import {
  useNavigate,
  Navigate,
  Routes,
  Route} from "react-router-dom";

//import Navigation from './components/Navbar.js';
import { useGridApiRef } from "@mui/x-data-grid";


// Login Management
import Login from './components/ui/login';

// UI Bases

import Navigation from "./Nav";

// UI Feedback
import MuiAlert from '@material-ui/lab/Alert';

// Site Content
import {RenderSearchComponent} from './components/SearchComponent';

import {RenderDonor} from "./components/donors";
import { RenderDataset} from "./components/datasets";
import {RenderSample } from "./components/samples";
import UploadsForm from "./components/uploads";

// Bulky
import BulkProcess from "./components/bulk";

// The Old Stuff
import Forms from "./components/uuid/forms";



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
    }else{
      // console.debug("Info JSON forund in localStorage",infoJSON);
      localStorage.setItem("isAuthenticated", true);
    }
  // And if wevve got nothing  
  }else{
    infoJSON = {
      name: "",
      email: "",
      globus_id: ""
    };
  }
}

function CheckCreds(){
  var infoJSON = localStorage.getItem("info");
  if(infoJSON){
    return infoJSON;
  }
  else{
    SetAuth();
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





function renderContent() {
  var loginStatus = CheckAuth
  let html;
  console.debug("Login Status: " + loginStatus);
  if(loginStatus === true){
    html = <Login />;
  }
  return html;
}




export function App (props){
  const apiRef = useGridApiRef();



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
        // logout={handleLogout}
        // userInfo={this.getUserInfo()}
      />
      <div  className="container card mb-5">
           <div className="" id="content">
            {renderContent()}
                <Routes>
                    <Route path="/" element={
                    <RenderSearchComponent 
                      entity_type=' ' 
                    />} />

                    <Route path="/donors" index element={<RenderSearchComponent custom_title="Search" entity_type="donors" />} ></Route>
                    <Route path="/samples" element={<RenderSearchComponent entity_type="samples" />} ></Route>
                    <Route path="/datasets" element={<RenderSearchComponent entity_type="datasets" />} ></Route>
                    <Route path="/uploads" element={<RenderSearchComponent entity_type="uploads" />} ></Route>
                    
                    
                    <Route path="/donor/:uuid" element={<RenderDonor  status="view"/>} />
                    <Route path="/sample/:uuid" element={<RenderSample status="view"/>} />
                    <Route path="/dataset/:uuid" element={<RenderDataset  status="view"/>} />
                    <Route path="/upload/:uuid" element={<UploadsForm  status="view"/>} />
                    
                    
                    <Route path="/new/donor" element={<RenderDonor status="new" />} />
                    <Route path="/new/sample" element={<RenderSample status="new" />} />
                    <Route path="/new/dataset" element={<RenderDataset status="new" />} />
                    <Route path="/new/donors" exact element={<BulkProcess bulkType="donors" />} />
                    <Route path="/new/samples" element={<BulkProcess bulkType="samples" />} />
                    <Route path="/new/data" element={<RenderSearchComponent modal="newUpload" />} />

                </Routes>
  </div>

    </div>
  </div>
  );
  // return html;
  
}




export default App