
import * as React from "react";
import {useState, useEffect} from "react";
import {
  useNavigate,
  Routes,
  Route} from "react-router-dom";
  
  // Login Management
  import Login from './components/ui/login';
  import Timer from './components/ui/idle';
  
import Paper from '@mui/material/Paper';
  import { ingest_api_users_groups } from './service/ingest_api';

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











      // Check auth from both URL and LocalStorGE, THEN check token
      // console.debug("Info JSON forund in localStorage",infoJSON);
      
//     }
//   // And if wevve got nothing  
//   }else{
//     infoJSON = {
//       name: "",
//       email: "",
//       globus_id: ""
//     };
//     return false
//     // window.location.replace(`${process.env.REACT_APP_URL}`);  
//   }
// }




export function App (props){
  var [uploadsDialogRender, setUploadsDialogRender] = useState(false);
  var [authStatus, setAuthStatus] = useState(false);
  var [groupsToken, setGroupsToken] = useState(null);
  let navigate = useNavigate();

    

  function LocalStorageAuth(){

  try {
    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
    if (results.status === 200) { 
      console.debug("LocalStorageAuth", results);
      setGroupsToken(JSON.parse(localStorage.getItem("info")).groups_token);
      setAuthStatus(true);
      console.debug("groupsToken",groupsToken);
    } else if (results.status === 401) {
      console.debug("LocalStorageAuth", results);
      setGroupsToken(null);
      setAuthStatus(false);
    }
      
    });
  } catch {
    console.debug("LocalStorageAuth", "CATCh No LocalStorage");
  }
}

  

  useEffect(() => {

    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");
    if (info !== null) {
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);
      // Redirect to home page without query string
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }

    LocalStorageAuth();
  }, []);





  function Logout(){
  //console.debug("Logging out");
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
  };

  
  function onChangeGlobusLink(newLink, newDataset){
    // const {name, display_doi, doi} = newDataset;
    // this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  };



  function handleCancel(){
    navigate(-1);  
  }


  function CallUploadsDialog(){
  //console.debug("CallUploadsDialog uploadsDialogRender");
    setUploadsDialogRender(true);
  }
 
  
  function urlChange(target) {
    navigate(target);
  }



  

//console.debug("props", props);
  return (
    <div className="App">
      
      
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
            <Routes>
                <Route path="/" element={ <Login />} />
            </Routes>
        )}

            
          {authStatus && (
          <Paper className="px-5 py-4">

          <Routes>

              <Route path="/" element={ <SearchComponent entity_type=' ' urlChange={urlChange} onCancel={handleCancel}/>} />

              <Route path="/login" element={<Login />} />

              <Route path="/donors" element={<SearchComponent filter_type="donors" urlChange={urlChange}/>} ></Route>
              <Route path="/samples" element={<SearchComponent filter_type="Sample" urlChange={urlChange} />} ></Route>
              <Route path="/datasets" element={<SearchComponent filter_type="Dataset" urlChange={urlChange} />} ></Route>
              <Route path="/uploads" element={<SearchComponent filter_type="uploads" urlChange={urlChange} />} ></Route>
                                    
              <Route path="/donor/:uuid" element={<RenderDonor  onCancel={handleCancel} status="view"/>} />
              <Route path="/sample/:uuid" element={<RenderSample onCancel={handleCancel} status="view"/>} />
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