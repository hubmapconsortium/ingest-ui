import React, { Component } from "react";

// UI Menu 
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';

import { Button,Typography} from "@material-ui/core";
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';



export default class Navigation extends Component {
    constructor(props) {
        super(props);
        this.state = {
          anchorElS:false,
          anchorElB: false

        }
        console.debug(this.props);
        // Expected Props: 
          // login: boolean / Login status from App
    }


    handleBulkClick = (event) => {
      console.debug('clicked', event.currentTarget);
      this.setState({
        anchorElB: event.currentTarget,
        anchorElS: null,
        show_menu_popup: true,
        // creatingBulkEntity: true
      });
    };
    handleSingleClick = (event) => {
      console.debug('clicked', event.currentTarget);
      this.setState({
        anchorElB: null,  
        anchorElS: event.currentTarget,
        show_menu_popup: true,
        // creatingBulkEntity: true
      });
    };

  handleClose = () => {
    //console.log("App.js handleClose");
    this.setState({
      anchorElB: false,
      anchorElS: false,
    });
  };




    render() {

        const logout_url = `${process.env.REACT_APP_BACKEND_URL}/logout`;
        let logout = this.state.isAuthenticated ? (
        
        <Button
            href={logout_url}
            className=""
            onClick={this.props.logout}
            ref={a => (this.logoutButton = a)}
        >
            Logout
        </Button>
        ) : ("");

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
      
              {this.props.login && (
                <div className="d-inline">                
                <span className="menu-bar-static-label mr-3">REGISTER NEW:</span>
                



                <Button 
                  aria-controls="IndividualMenu" 
                  className="btn mr-1" 
                  aria-haspopup="true" 
                  color="primary"
                  endIcon={<ArrowDropDownIcon />}
                  onClick={this.handleSingleClick}>
                    Individual
                </Button>
                  <Menu
                    id="IndividualMenu"
                    keepMounted
                    anchorEl={this.state.anchorElS}
                    open={Boolean(this.state.anchorElS)}
                    onClose={this.handleClose}
                    getContentAnchorEl={null}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    transformOrigin={{vertical: 'top', horizontal: 'center'}}
                  >
                    <MenuItem className="nav-link" onClick={this.handleIndividualMenuSelection}>Donor</MenuItem>
                    <MenuItem className="nav-link" onClick={this.handleIndividualMenuSelection}>Sample</MenuItem>
                    <MenuItem className="nav-link" onClick={this.handleIndividualMenuSelection}>Dataset</MenuItem>
                  </Menu>


                <Button 
                  aria-controls="BulkMenu" 
                  aria-haspopup="true" 
                  color="primary"
                  endIcon={<ArrowDropDownIcon />}
                  onClick={this.handleBulkClick}>
                    Bulk
                  </Button>
                  <Menu
                    id="BulkMenu"
                    menuStyle={{width: 'auto', backgroundColor: 'red'}}
                    keepMounted
                    anchorEl={this.state.anchorElB}
                    open={Boolean(this.state.anchorElB)}
                    onClose={this.handleClose}
                    getContentAnchorEl={null}
                    anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
                    transformOrigin={{vertical: 'top', horizontal: 'center'}}
                  >
                    <MenuItem onClick={this.handleBulkSelection}>Donors</MenuItem>
                    <MenuItem onClick={this.handleBulkSelection}>Samples</MenuItem>
                    <MenuItem onClick={this.handleUploadsDialog}>Data</MenuItem>
                  </Menu>

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
}