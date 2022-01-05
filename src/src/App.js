
import * as React from "react";
import { Component } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams
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
import SearchComponent from './components/SearchComponent';

import DonorForm from "./components/donors";
import TissueForm from "./components/samples";
import DatasetForm from "./components/datasets";
import UploadsForm from "./components/uploads";

// Bulky
import BulkProcess from "./components/bulk";



function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}



class App extends Component {

  constructor(props) {
    super(props);
    const app_info = localStorage.getItem("info")
      ? JSON.parse(localStorage.getItem("info"))
      : {
        name: "",
        email: "",
        globus_id: ""
      };

 
    this.state = {
      username: app_info.name || "",
      email: app_info.email || "",
      globus_id: app_info.globus_id || "",
      system: "",
      registered: true,
      devMode: false,
      openSnack:false,
      dml:"Inactive",
      snackPriotity:"info",
      anchorElB: null,
      anchorElS:null,
      show_menu_popup: false,
      creatingNewEntity: false,
      formType: "",
      open_edit_dialog: false.valueOf,
      creatingNewUpload: false,
      editNewEntity: false,
      showSearch: false,
      creatingBulkEntity: false,
      bulkType: 'samples',
      setAnchorEl: null
    };


    this.idleTimer = null;
    if (localStorage.getItem("isAuthenticated")) {
      localStorage.setItem("isAuthenticated", false);
    }

    // Binding event handler methods to an instance
    this.handleLogout = this.handleLogout.bind(this);
  }


  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);


    // let [searchParams, setSearchParams] = useSearchParams();
    // var info = searchParams.get("info");
    var info ="";
    if(this.props.location){
      var info = new URLSearchParams(this.props.location.search).get("info")
    }
    if (this.props.match){
      info = this.props.match.params.info
      console.debug("info: ",info);
    }
    
    if (info) {
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }
    
    this.getUserInfo();
    // ALL AXIOS STUFF CAN BE HANDLED OUT HERE,
    // WE CAN PASS THE STATUS INTO THE COMPONENTS WITH PROPS vs
    // DO IT ALL AGAIN WITHIN
   this.setState({
     isAuthenticated: JSON.parse(localStorage.getItem("isAuthenticated"))
   })

    if (localStorage.getItem("info") !== null) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
          "Content-Type": "application/json"
        }
      };

      axios
        .get(
          `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
          config
        )
        .then(res => {
          this.setState({
            allowed: true
          });
          const display_names = res.data.groups
            .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
            .map(g => {
              return g.displayname;
            });
          if (display_names.length === 0) {
            this.setState({
              read_only_member: true
            });
          }
        })
        .catch(err => {
          if (err.response === undefined) {
            this.setState({
              web_services_error: true
            });
          } else if (err.response.status === 401) {
            localStorage.setItem("isAuthenticated", false);
            // window.location.reload();
          } else if (err.response.status === 403) {
            this.setState({
              allowed: false
            });
          }
        });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    // console.debug("componentDidUpdate");
    // console.debug(prevProps, this.props);
    // console.debug(prevState, this.state);
  }

  getUserInfo = () => {
    var userInfo = {
      username:this.state.username,
      email:this.state.email,
      globus_id:this.state.globus_id
    }
    // console.debug("user Info ",userInfo);
    return userInfo
  }

  

  handleLogout = e => {
    localStorage.setItem("isAuthenticated", false);
    localStorage.removeItem("info");
  };

  handleUploadsDialog = (event) => {
    console.debug("handleUploadsDialog");
    this.handleMenuDropdown();
    this.setState({
      creatingNewUpload: true,
      showDropDown: false
    });
    this.handleUrlChange("new/upload");
  }


  handleKeyDown = (event) => {
    // console.debug(event);
    // console.debug(this.state.devMode);
    if( event.ctrlKey && event.shiftKey && event.altKey && event.code==="KeyE" ) {
        console.debug("devMode "+this.state.devMode);
        this.setState(prevState => ({
          devMode: !prevState.devMode,
          openSnack: true
        }));
    }
    this.devModeSnack();
  };

  devModeSnack(){
    switch (this.state.devMode) {
      case true:
        this.setState({
          devMode: "Active",
          snackPriotity: "warning"
        });
        break;
      default:
        this.setState({
          devMode: "Inactive",
          snackPriotity: "info"
        });
        break;
    }
  };

  snackSeverity (){
    var stateUsed="";
    switch (this.state.devMode) {
      case true:
        stateUsed= "warning";
        break;
      default:
        break;
    }
    return stateUsed;
  };


  renderContent() {
    let html = <Login />;
    // const { redirect } = this.state;

    // fire http call to verify if user registerd.
    //axio.get("")

    if (this.state.isAuthenticated) {
      // Must wrap the two componments in an enclosing tag
      html = (
        <div className="dataopts">
          {this.state.web_services_error && (
            <div className="row">
              <div className="alert alert-warning col-sm-12 text-center">
                <FontAwesomeIcon icon={["far","faWindowClose"]} size="6x" />
                <br />
                The web services are currently not accessible.
              </div>
            </div>
          )}
          {this.state.registered === false && (
            <div className="row">
              <div className="alert alert-info col-sm-12 text-center">
                <FontAwesomeIcon icon={["far","faAddressCard"]} size="6x" />
                <br />
                You have not registered in HuBMAP System yet. Please click{" "}
                <a href={`${process.env.REACT_APP_PROFILE_URL}/register`}>
                  here
                </a>{" "}
                to sign up first.
              </div>
            </div>
          )}
          {this.state.registered === true && this.state.allowed === false && (
            <div className="row">
              <div className="alert alert-danger col-sm-12 text-center">
                <FontAwesomeIcon icon={["far","faExclamationTriangle"]} size="6x" />
                <br />
                You do not have access to use the HuBMAP ID System. You can
                request access by checking the "HuBMAP ID System" option in the
                HuBMAP resources section on your profile or by sending an email
                to{" "}
                <a href="mailto:help@hubmapconsortium.org">
                  help@hubmapconsortium.org
                </a>
              </div>
            </div>
          )}
         

        </div>
      );
    }

    return html;
  }

  onAction = e => { };
  onActive = e => { };
  onIdle = e => {
    if (localStorage.getItem("isAuthenticated") === "true") {
      this.setState(
        {
          logout_in: 60
        },
        () => {
          setTimeout(countDown.bind(this), 1000);

          function countDown() {
            this.setState(
              {
                logout_in: this.state.logout_in - 1
              },
              () => {
                if (this.state.logout_in > 0) {
                  this.setState({
                    timer: setTimeout(countDown.bind(this), 1000)
                  });
                }
                if (this.state.logout_in === 0) {
                  this.logoutButton.click();
                }
              }
            );
          }
          this.setState({ show: true });
        }
      );
    }
  };


  hideModal = () => {
    clearTimeout(this.state.timer);
    this.setState({ show: false });
  };


  handleCloseSnack = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({
      openSnack: false
    })
  };


  // Display the final output
  render() {
   
    //const system = this.state.system;
    return (
      <div className="">
        <IdleTimer
          ref={ref => {
            this.idleTimer = ref;
          }}
          element={document}
          onActive={this.onActive}
          onIdle={this.onIdle}
          onAction={this.onAction}
          debounce={250}
          timeout={SESSION_TIMEOUT_IDLE_TIME}
        />
        <Modal show={this.state.show} handleClose={this.hideModal}>
          <div className="row">
            <div className="col-sm-12 text-center">
              <h4>Are you still there?</h4>
              <p>
                The application will automatically log out in{" "}
                {this.state.logout_in} seconds. If you want to keep you logged
                in, please click "close" below.
              </p>
            </div>
          </div>
        </Modal>
        <Navigation 
          login={localStorage.getItem("isAuthenticated")} 
          logout={this.handleLogout}
          userInfo={this.getUserInfo()}
        />


        
        <div id="content" className="container App">

            
          <div className="col-sm-12">

         
        
            <div className="row">
            

                  <Routes>
                    

                    <Route path="/" exact element={<SearchComponent />}>
                      <Route path="/donors" element={<SearchComponent type="donors" />} >
                        <Route path=":uuid" element={<DonorForm status="view"/>} />
                      </Route>
                      <Route path="/samples" element={<SearchComponent type="samples" />} >
                        <Route path=":uuid" element={<TissueForm status="view"/>} />
                      </Route>
                      <Route path="/datasets" element={<SearchComponent type="datasets" />} >
                        <Route path=":uuid" element={<DatasetForm status="view"/>} />
                      </Route>
                      <Route path="/uploads" element={<SearchComponent type="datasets" />} >
                        <Route path=":uuid" element={<UploadsForm status="view"/>} />
                      </Route>
                      <Route path="/new" element={<SearchComponent/>}> 
                        <Route path="/donor" element={<DonorForm status="new" />} />
                        <Route path="/sample" element={<DonorForm status="new" />} />
                        <Route path="/dataset" element={<DonorForm status="new" />} />
                        <Route path="/donors" element={<BulkProcess type="donors" />} />
                        <Route path="/samples" element={<BulkProcess type="samples" />} />
                        <Route path="/data" element={<SearchComponent modal="newUpload" />} />
                      </Route>
                    </Route>

                  </Routes>
              
            
            )}

            {this.state.isAuthenticated && this.state.creatingNewUpload && (
                <Dialog 
                  open={this.state.creatingNewUpload}
                  fullWidth={true} 
                  maxWidth="lg" 
                  aria-labelledby="source-lookup-dialog" 
                  // onClose={this.handleClose} 
                  onClose={(event, reason) => {
                    if (reason !== 'backdropClick') {
                      this.handleClose()
                    }
                  }}
                >
                <DialogContent>
                  <UploadsForm
                    onCreated={this.onCreated}
                    cancelEdit={this.handleClose}
                  />
                </DialogContent>
              </Dialog>
            )}

                  
        </div>
    </div>

          
          <Snackbar open={this.state.openSnack} autoHideDuration={6000} onClose={this.handleCloseSnack}>
            
            <Alert onClose={this.handleCloseSnack} severity={this.state.snackPriotity}>
              DevMode is Currently: {this.state.devMode}
            </Alert>
          </Snackbar>

          <Paper position="fixed" hidden={!this.state.devMode} className={"fixed-bottom bg-"+this.state.snackPriotity} >
            DevMode is Currently: {this.state.devMode}
          </Paper>

     


      </div>
    );
  }
}

export default App;
