import React, { useEffect} from "react";
import { Link } from 'react-router-dom'
import { useLocation} from "react-router-dom";
import { useNavigate} from "react-router-dom";


import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import UploadsForm from "./components/uploads/createUploads";
import {DataProviders} from "./utils/userInfo";



export const Navigation = (props) => {
  const [userInfo, setUserInfo] = React.useState();
  const [userGroups, setUserGroups] = React.useState();
  const [userDataGroups, setUserDataGroups] = React.useState([]);
  // const [authStatus, setAuthStatus] = React.useState(false);
  const [uploadsDialog, setUploadsDialog] = React.useState(false);
  const [anchorEl_I, setAnchorEl_I] = React.useState(null);
  const [anchorEl_B, setAnchorEl_B] = React.useState(null);
  const open_I = Boolean(anchorEl_I);
  const open_B = Boolean(anchorEl_B);
  const location = useLocation();
  let navigate = useNavigate();

  useEffect(() => {
  //console.debug("props", props);
  //console.debug("props.appInfo", props.app_info);
  //console.debug("location", location);
    // setAuthStatus(props.login)
    setUserInfo(props.app_info);
    setUserGroups(props.userGroups);
    // console.debug("userInfo", userInfo);
    setUserDataGroups([props.userDataGroups]);
    // console.debug("===== props.userGroups",props.userGroups);
    // @TODO: Consider moving all the User & User Group info into its own utils, 
    //mdn Array.reduce;


    
    console.debug("userDataGroups", props.userDataGroups, props.userDataGroups.length);
    // if(userGroups && userGroups.length > 0){
    //   const dataGroups = DataProviders(userGroups);
    //   console.log(dataGroups, userDataGroups, userDataGroups.length);
    // }

    

    // props.userGroups.reduce((acc, group) => {
    //   console.debug("group", group);
    //   console.debug("acc", acc);
    //   if(group.data_provider === "true"){
    //     // setUserGroups(item);
    //     console.debug("group", group);
    //   }
    //   // return acc;
    //   console.debug("acc", acc);
    // });


    if(location.pathname === "/new/data"){
    //console.debug("Setting uploadsDialog to true");
      setUploadsDialog(true);
    }
  }, [props, props.app_info, location]);



  const handleClick_I = (event) => {
    console.debug("HandleClick", event );
    setAnchorEl_I(event.currentTarget);
    // setAnchorEl_I(!anchorEl_I);
  };

  const handleClick_B = (event) => {
  //console.debug("HandleClick", event );
    setAnchorEl_B(event.currentTarget);
  };
  
  const handleClose = () => {
  //console.debug("HandleClose", e);
    setAnchorEl_I();
    setAnchorEl_B();
  };
  
  const OpenUploads = () => {
    setUploadsDialog(true);
    setAnchorEl_B();
  };

  const onClose = () => {
    setUploadsDialog(false);
  //console.debug("onClose");
  };

  const onCreated = (data) => {
    console.debug("onCreated");
    console.debug("data", data);
    navigate("/Upload/"+data.uuid);
    setUploadsDialog(false);
  };
  
  function logout(e) {
  //console.debug("Logging out");
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
    
  };
  // const NavTo = (path, type) => {
  // //console.debug("NavTo", path, type);
  //   navigate('/'+path+'/'+type);
  // }

    return(
      <div>
      <Dialog
        open={uploadsDialog}
      >
        <DialogContent> 
        <UploadsForm
            onCreated={onCreated}
            cancelEdit={onClose}
          />
        </DialogContent>
      </Dialog>
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

              {props.login &&  userDataGroups[0] &&  userDataGroups[0].length >0 &&(
                <div className="d-inline">                
                <span className="menu-bar-static-label mr-4">REGISTER NEW:</span>
                



                <Button 
                  // className="ml-2"
                  id="IndividualButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_I ? 'IndividualMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_I ? 'true' : undefined}
                  onClick={handleClick_I} >
                    Individual</Button>
                  <Menu
                    id="IndividualMenu"
                    anchorEl={anchorEl_I}
                    open={open_I}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'IndividualButton',
                    }}>
                    <MenuItem 
                      className="nav-link" 
                      component={Link}
                      onClick={handleClose}
                      to="/new/donor" >
                      Donor
                    </MenuItem>
                    <MenuItem 
                      className="nav-link"
                      component={Link}
                      onClick={handleClose}
                      to="/new/sample" >
                      Sample
                    </MenuItem>
                    <MenuItem 
                      className="nav-link"
                      component={Link}
                      onClick={handleClose}
                      to="/new/dataset" >
                      Dataset
                    </MenuItem>
                  </Menu>

                  <Button 
                  id="BulkButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_B ? 'BulkMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_B ? 'true' : undefined}
                  onClick={handleClick_B} >
                    Bulk</Button>
                  <Menu
                    id="BulkMenu"
                    anchorEl={anchorEl_B}
                    open={open_B}
                    onClose={handleClose}
                    MenuListProps={{
                      'aria-labelledby': 'BulkButton',
                    }}>
                    <MenuItem 
                      className="nav-link"
                      onClick={handleClose}
                      component={Link}
                      to="/bulk/donors" >Donors</MenuItem>
                    <MenuItem 
                      className="nav-link"
                      onClick={handleClose}
                      component={Link}
                      to="/bulk/samples" >Samples</MenuItem>
                    <MenuItem 
                      className="nav-link"
                      onClick={() => OpenUploads()}
                      to="/bulk/data" >Data</MenuItem>
                  </Menu>


                </div>
              )}
          </div>
        
        <div id="MenuRight">
          {(userInfo) && userInfo.email && (
            <div className="float-right">
              <span className="username">
                <Typography variant="button" className="username-menu">
                   {userInfo.email} 
                </Typography>
                <Button
                href={`${process.env.REACT_APP_PROFILE_URL}/profile`}
                className="nav-link" >
                  Edit Profile
                </Button>
              </span>
              <span className="logout">
                <Button
                onClick={logout}
                className="nav-link" >
                  Log Out 
                </Button>
              </span>
              {}
            </div>
          
          )}
          </div>
        </nav>
        
      </header>
      </div>
    );

  }
  


