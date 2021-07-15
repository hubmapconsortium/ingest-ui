import React, { Component } from 'react';
import './App.css';
//import Navigation from './components/Navbar.js';
import Routes from './Routes';
import Login from './components/uuid/login';
import IdleTimer from "react-idle-timer";
import { SESSION_TIMEOUT_IDLE_TIME } from "./constants";
import SearchComponent from './components/search/SearchComponent';
import Forms from "./components/uuid/forms";
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faExclamationTriangle,
  faAddressCard,
  faWindowClose
} from "@fortawesome/free-solid-svg-icons";
import {
  Button,
  Typography
} from "@material-ui/core";
import Modal from "./components/uuid/modal";
//import { BrowserRouter as Router } from 'react-router-dom';


import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import UploadsForm from "./components/uploads/createUploads";


class App extends Component {
  state = {
    anchorEl: null,
    show_menu_popup: false,
    creatingNewEntity: false,
    formType: "",
    open_edit_dialog: false.valueOf,
    creatingNewUpload: false,
    editNewEntity: null,
  }
  // The constructor is primarily used in React to set initial state or to bind methods
  // The constructor is the only place that you should assign the local state directly like that.
  // Any place else in our component, you should rely on setState() instead.
  
  constructor(props) {
    super(props);

    this.idleTimer = null;
    // Testing, set local storage flag
    // Note: many browsers local storage can only store string
    if (localStorage.getItem("isAuthenticated") === null) {
      localStorage.setItem("isAuthenticated", false);
    }

    //set the system state if the URL includes 'collections'
    if (window.location.href.includes("/collections/")) {
      this.setState({
        system: "collection"
      });
    }


    // IE doesn't support the URL api
    let url = new URL(window.location.href);
    let info = url.searchParams.get("info");


    if (info !== null) {
      localStorage.setItem("info", info);
      localStorage.setItem("isAuthenticated", true);

      // Redirect to home page without query string
      window.location.replace(`${process.env.REACT_APP_URL}`);
    }

    const app_info = localStorage.getItem("info")
      ? JSON.parse(localStorage.getItem("info"))
      : {
        name: "",
        email: "",
        globus_id: ""
      };
    this.state = {
      // Using JSON.parse() to get the boolean value
      isAuthenticated: JSON.parse(localStorage.getItem("isAuthenticated")),
      username: app_info.name || "",
      email: app_info.email || "",
      globus_id: app_info.globus_id || "",
      creatingNewEntity: false,
      creatingNewUpload: false,
      system: "",
      registered: true,
      devMode: false
    };

    //console.debug('isAuthenticated', JSON.parse(localStorage.getItem("isAuthenticated")))

    // Binding event handler methods to an instance
    this.handleLogout = this.handleLogout.bind(this);

  }

  

  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown);
    if (localStorage.getItem("info") !== null) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
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


  handleLogout = e => {
    localStorage.setItem("isAuthenticated", false);
    localStorage.removeItem("info");
  };

  handleMenuSelection = (event) => {

    var formtype = event.currentTarget.innerText.trim();

    this.setState({
        anchorEl: null,
        show_menu_popup: false,
        creatingNewEntity: true,
        formType: formtype.toLowerCase(),
        open_edit_dialog: true
      })
  }
  

  handleUploadsDialog = (event) => {
    this.setState({
      creatingNewUpload: true,
    })
  }

  handleClick = (event) => {
    //console.debug('clicked', event.currentTarget);
    this.setState({
      anchorEl: event.currentTarget,
      show_menu_popup: true
    })
  };

  handleClose = () => {
    //console.log("App.js handleClose");
    this.setState({
      creatingNewUpload: false,
      anchorEl: null,
      show_menu_popup: false,
      open_edit_dialog: false, 
      creatingNewEntity: false
    })
  };

  onCreated = data => {
    //console.debug(data);
    //console.debug(data.entity_type);
    this.setState({
      show_menu_popup: false,
      createSuccess: true,
      creatingNewEntity: false,
      creatingNewUpload: false,
      editNewEntity: data,
      formType: data.entity_type.toLowerCase(),
      preSearch: "uploads"
    });
  };

  showDropDwn = () => {
    this.setState(prevState => ({
      showDropDown: !prevState.showDropDown
    }));
  };

  renderHeader() {
  const logout_url = `${process.env.REACT_APP_BACKEND_URL}/logout`;
    let logout = this.state.isAuthenticated ? (
      
      <Button
        href={logout_url}
        className=""
        onClick={this.handleLogout}
        ref={a => (this.logoutButton = a)}
      >
        Logout
      </Button>
    ) : (
        ""
      );


   

    // Must wrap the componments in an enclosing tag
    return (
        <header id="header" className="navbar navbar-light">
        <nav className="container menu-bar" id="navMenu">
          <div id="MenuLeft">
            <a className="navbar-brand" href="/">
              <img
                //src="https://hubmapconsortium.org/wp-content/uploads/2019/01/HuBMAP-Retina-Logo-Color-300x110.png"
                src="https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png"
                //width="300"
                height="40"
                className="d-inline-block align-top"
                id="MenuLogo"
                alt="HuBMAP logo"
              />
            </a>
      
              {this.state.isAuthenticated && (
                <div className="d-inline">                
                <span className="menu-bar-static-label">REGISTER NEW:</span>
                
                <Button className="nav-link" onClick={this.handleMenuSelection}>Donor</Button>
                <Button className="nav-link" onClick={this.handleMenuSelection}>Sample</Button>
                <Button className="nav-link" onClick={this.handleMenuSelection}>Dataset</Button>
                {this.state.devMode && (
                <Button className="nav-link" onClick={this.handleUploadsDialog}>Uploads</Button>
                )}
                </div>
              )}
            </div>
        <div id="MenuRight">
          {this.state.isAuthenticated && (
            <div className="float-right">
              <span className="username">
                <Typography variant="button" className="username-menu">
                  {this.state.email}{" "}
                </Typography>
                <Button
                href={`${process.env.REACT_APP_PROFILE_URL}/profile`}
                className="nav-link" >
                  Edit Profile
                </Button>
              </span>
              {logout}
            </div>
          
          )}
          </div>
        </nav>
      </header>
   );
  }

  handleEnterUUID = () => {
    this.setState({
      system: "uuid"
    });
  };

  handleEnterIngest = () => {
    this.setState({
      system: "ingest"
    });
  };

  handleEnterCollection = () => {
    this.setState({
      system: "collection"
    });
  };
  
  handleKeyDown = (event) => {
    if( event.ctrlKey && event.shiftKey && event.code==="KeyD" ) {
        console.debug("devMode "+this.state.devMode);
        this.setState(prevState => ({
          devMode: !prevState.devMode
        }));
    }
  };


  renderContent() {
    let html = <Login />;
    

    // fire http call to verify if user registerd.
    //axio.get("")

    if (this.state.isAuthenticated) {
      // Must wrap the two componments in an enclosing tag
      html = (
        <div className="dataopts">
          {this.state.web_services_error && (
            <div className="row">
              <div className="alert alert-warning col-sm-12 text-center">
                <FontAwesomeIcon icon={faWindowClose} size="6x" />
                <br />
                The web services are currently not accessible.
              </div>
            </div>
          )}
          {this.state.registered === false && (
            <div className="row">
              <div className="alert alert-info col-sm-12 text-center">
                <FontAwesomeIcon icon={faAddressCard} size="6x" />
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
                <FontAwesomeIcon icon={faExclamationTriangle} size="6x" />
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
        {/* THIS CAN MOVE TO ROUTES.JS 
          <Router>
            <Switch>
              <Route path="/" exact component={Main} />
              <Route path="/donors-samples" exact component={UUIDEntrance} />
              <Route path="/datasets" exact component={IngestEntrance} />
            </Switch>
          </Router>
        */}

          {/* {this.state.system === "uuid" && 
              <UUIDEntrance  />}
          {this.state.system === "ingest" && 
              <IngestEntrance  />} */}
          {/**  {this.state.system === "collection" && 
              <CollectionsEntrance  />} */}

        </div>
      );
    }

    return html;
  }

  onAction = e => { };

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

  onActive = e => { };

  hideModal = () => {
    clearTimeout(this.state.timer);
    this.setState({ show: false });
  };
  getSystem = (system) => {
    // This is the system data from Navigation
    this.setState(
      {
        system: system
      })
  }


  // Display the final output
  render() {
    const collections = window.location.href.includes("/collections") ? true : false;
    //const system = this.state.system;
    return (
      <div>
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
        {this.renderHeader()}
        <div id="content" className="container">
          {!collections && (
            this.renderContent()
          )}
          <div className="App">
            {/**  <Navigation /> */}
            <Routes />
          </div>

        </div>
            
        
        {this.state.isAuthenticated && !this.state.creatingNewEntity && (
          <div className="col-sm-12">
            <SearchComponent editNewEntity={this.state.editNewEntity} />
          </div>
          )}
          <div className="col-sm-12">
            {this.state.isAuthenticated && this.state.creatingNewEntity && (
              <Forms formType={this.state.formType} onCancel={this.handleClose} />
              )}
          </div>
          
          {this.state.isAuthenticated && this.state.creatingNewUpload && (
          <div className="col-sm-12">
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
          </div>
          )}
          

          
          
      </div>
    );
  }
}

export default App;
