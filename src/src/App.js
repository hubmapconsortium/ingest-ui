
import * as React from "react";
import {
  Routes,
  Route} from "react-router-dom";

//import Navigation from './components/Navbar.js';


// Login Management
import Login from './components/ui/login';

// UI Bases

import Navigation from "./Nav";

// UI Feedback
import MuiAlert from '@material-ui/lab/Alert';

// Site Content
import {RenderSearchComponent} from './components/SearchComponent';

import DonorForm from "./components/donors";
import {RenderSample } from "./components/samples";
import {DatasetEdit, FetchDataset} from "./components/datasets";
import UploadsForm from "./components/uploads";

// Bulky
import BulkProcess from "./components/bulk";




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

function CheckAuth(){
  var infoJSON = localStorage.getItem("info");
  if(infoJSON){
    return infoJSON;
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
  let html = <Login />;
  // const { redirect } = this.state;
  return html;
}

export function App (){
  return (
    <div className="">
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
      
      <div id="content" className="container App">
        <div className="col-sm-12">
          <div className="row">
            {renderContent()}

                <Routes>
                    <Route path="/" element={<RenderSearchComponent entity_type=' ' />} />

                    <Route path="/donors" index element={<RenderSearchComponent custom_title="Search" entity_type="donors" loadOdefaultOptionValueptions="Donors"/>} ></Route>
                      <Route path="/donors/:uuid" element={<DonorForm status="view"/>} />
                    
                    <Route path="/samples" element={<RenderSearchComponent entity_type="samples" 
                    loadOdefaultOptionValueptions="samples"/>} ></Route>
                    <Route path="/samples/:uuid" element={<RenderSample status="view"/>} />
                    <Route path="/datasets" element={<RenderSearchComponent entity_type="datasets" />} ></Route>
                      <Route path="/datasets/:uuid" element={<FetchDataset status="view"/>} />
                    <Route path="/uploads" element={<RenderSearchComponent entity_type="datasets" />} ></Route>
                      <Route path="/uploads/:uuid" element={<UploadsForm status="view"/>} />
                    <Route path="/new/donor" element={<DonorForm status="new" />} />
                    <Route path="/new/sample" element={<RenderSample status="new" />} />
                    <Route path="/new/dataset" element={<DatasetEdit status="new" />} />
                    <Route path="/new/donors" exact element={<BulkProcess bulkType="donors" />} />
                    <Route path="/new/samples" element={<BulkProcess bulkType="samples" />} />
                    <Route path="/new/data" element={<RenderSearchComponent modal="newUpload" />} />

                </Routes>


         
                
      </div>
  </div>

     

   


    </div>
  </div>
  );
  // return html;
  
}




export default App