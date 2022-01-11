
import * as React from "react";
import { Component } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
  useNavigate,
  Navigate
} from "react-router-dom";

//import Navigation from './components/Navbar.js';


// Login Management
import axios from 'axios';
import Login from './components/ui/login';
import IdleTimer from "react-idle-timer";
import { SESSION_TIMEOUT_IDLE_TIME } from "./constants";

// UI Bases
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import Modal from "./components/ui/modal";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import Navigation from "./Nav";

// UI Feedback
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

// Site Content
import {SearchComponent, RenderSearch} from './components/SearchComponent';

import DonorForm from "./components/donors";
import {RenderSample } from "./components/samples";
import {DatasetEdit, FetchDataset} from "./components/datasets";
import UploadsForm from "./components/uploads";

// Bulky
import BulkProcess from "./components/bulk";



function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}


function checkAuth(){

  var infoJSON = ""
  if(localStorage.getItem("info")){
    infoJSON = cleanJSON(localStorage.getItem("info"));
    var JSONkeys = Object.keys(infoJSON);
    // And if it's not, wipe it clean so we dont need to manually clear
    if(JSONkeys[0]==="Error"){
      // console.debug("Malformed Info stored. Clearing...");
      localStorage.setItem("HAIL", "DISCORDIA");
      localStorage.removeItem("info");
      localStorage.removeItem("isAuthenticated");
      window.location.replace(`${process.env.REACT_APP_URL}`);      
    }else{
      // console.debug("Info JSON forund in localStorage",infoJSON);
      localStorage.setItem("isAuthenticated", true);
      localStorage.setItem("HAIL", "ERIS");
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
                    <Route path="/" element={<SearchComponent blank_search='true'/>} />

                    <Route path="/donors" index element={<RenderSearch sample_type="donors" filter_type="Donors"/>} ></Route>
                      <Route path="/donors/:uuid" element={<DonorForm status="view"/>} />
                    
                    {/* <Route path="/samples" element={<SearchComponent sample_type="samples" />} ></Route> */}
                    <Route path="/samples/:uuid" element={<RenderSample status="view"/>} />
                    <Route path="/datasets" element={<SearchComponent sample_type="datasets" />} ></Route>
                      <Route path="/datasets/:uuid" element={<FetchDataset status="view"/>} />
                    <Route path="/uploads" element={<SearchComponent sample_type="datasets" />} ></Route>
                      <Route path="/uploads/:uuid" element={<UploadsForm status="view"/>} />
                    <Route path="/new/donor" element={<DonorForm status="new" />} />
                    <Route path="/new/sample" element={<RenderSample status="new" />} />
                    <Route path="/new/dataset" element={<DatasetEdit status="new" />} />
                    <Route path="/new/donors" exact element={<BulkProcess bulkType="donors" />} />
                    <Route path="/new/samples" element={<BulkProcess bulkType="samples" />} />
                    <Route path="/new/data" element={<SearchComponent modal="newUpload" />} />

                </Routes>


         
                
      </div>
  </div>

     

   


    </div>
  </div>
  );
  // return html;
  
}




export default App