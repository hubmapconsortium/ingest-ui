import React,{useEffect} from "react";
import {Link} from 'react-router-dom';
import {useLocation} from "react-router-dom";
import {useNavigate} from "react-router-dom";


import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem, {menuItemClasses} from '@mui/material/MenuItem';

import UploadsForm from "./components/uploads/createUploads";



export const Navigation = (props) => {
  const [userInfo, setUserInfo] = React.useState();
  const [userGroups, setUserGroups] = React.useState();
  const [userDataGroups, setUserDataGroups] = React.useState([]);
  // const [authStatus, setAuthStatus] = React.useState(false);
  const [uploadsDialog, setUploadsDialog] = React.useState(false);
  const [anchorEl_I, setAnchorEl_I] = React.useState(null);
  const [anchorEl_B, setAnchorEl_B] = React.useState(null);
  const [anchorEl_S, setAnchorEl_S] = React.useState(null);
  const open_I = Boolean(anchorEl_I);
  const open_B = Boolean(anchorEl_B);
  const open_S = Boolean(anchorEl_S);
  const location = useLocation();
  let navigate = useNavigate();
  const [menuItems, setMenuItems] = React.useState({
    "new":[window.innerWidth<1400 ? "New" : "Individual","donor", "sample", "dataset", "publication"],
    "bulk":["Bulk","donors", "samples", "data"],
    "board":[window.innerWidth<1400 ? "Ingest" : "Data Ingest Board"],
    "metadata":[window.innerWidth<1400 ? "Metadata" : "Upload Sample Metadata","block", "section", "suspension"]
  });

  useEffect(() => {
    setUserInfo(props.app_info);
    setUserGroups(props.userGroups);
    setUserDataGroups([props.userDataGroups]);
    // @TODO: Consider moving all the User & User Group info into its own utils, 
    if(location.pathname === "/new/upload"){
      setUploadsDialog(true);
    }
  }, [props, props.app_info, location]);

  useEffect(() => {
    var wide = window.innerWidth
    console.debug('%c◉ windowWidth ', 'color:#00ff7b',wide);
  }, [menuItems.new, menuItems.metadata]);


  // @TODO: Dry this up
  const handleClick_S = (event) => {
    setAnchorEl_S(event.currentTarget);
  };
  const handleClick_I = (event) => {
    setAnchorEl_I(event.currentTarget);
  };
  const handleClick_B = (event) => {
    setAnchorEl_B(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl_I();
    setAnchorEl_B();
    setAnchorEl_S();
  };
  
  const OpenUploads = () => {
    setUploadsDialog(true);
    setAnchorEl_B();
  };

  const onClose = () => {
    setUploadsDialog(false);
  };

  const onCreated = (data) => {
    navigate("/Upload/"+data.results.uuid);
    setUploadsDialog(false);
  };  
  
  const toBoards = (data) => {
    window.open(`${process.env.REACT_APP_INGEST_BOARD_URL}`,'_blank');
  };
  const toProfile = (data) => {
    window.open(`${process.env.REACT_APP_PROFILE_URL}`,'_blank');
  };
  
  function logout(e) {
    localStorage.removeItem("info");
    localStorage.removeItem("isAuthenticated");
    window.location.replace(`${process.env.REACT_APP_URL}`);  
    
  };
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
                src="https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png"
                height="40"
                className="d-inline-block align-top"
                id="MenuLogo"
                alt="HuBMAP logo"
              />
            </a>

              {props.login &&  userDataGroups[0] &&  userDataGroups[0].length >0 &&(
                <div className="d-inline">                
                <span className="menu-bar-static-label mr-4">{window.innerWidth<1400 ? "" : "REGISTER NEW:" }</span>

                <Button 
                  id="IndividualButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_I ? 'IndividualMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_I ? 'true' : undefined}
                  onClick={handleClick_I} >
                    {menuItems.new[0]}</Button>
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
                    <MenuItem 
                      className="nav-link"
                      component={Link}
                      onClick={handleClose}
                      to="/new/publication" >
                      Publication
                    </MenuItem>
                  </Menu>

                  <Button 
                  id="BulkButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_B ? 'BulkMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_B ? 'true' : undefined}
                  onClick={handleClick_B} >
                    {menuItems.bulk[0]}</Button>
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

                  <span className="board">
                     <Button
                        target="_blank"
                        href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
                        className="flat-link " >
                          {menuItems.board[0]}
                      </Button>
                  </span>

                  <Button 
                    id="sampleMetadataButton"
                    endIcon={<ArrowDropDownIcon />}
                    aria-controls={open_I ? 'sampleMetadataMenu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open_I ? 'true' : undefined}
                    onClick={handleClick_S} >
                    {menuItems.metadata[0] }</Button>
                    <Menu
                      id="sampleMetadataMenu"
                      sx={{ width: "200px" }}
                      anchorEl={anchorEl_S}
                      variant="menu"
                      open={open_S}
                      onClose={handleClose}
                      MenuListProps={{
                        'aria-labelledby': 'IndividualButton',
                      }}>
                      <MenuItem 
                        className="nav-link" 
                        sx={{ width: "200px" }}
                        component={Link}
                        onClick={handleClose}
                        to="/metadata/block" >
                        Block
                      </MenuItem>
                      <MenuItem 
                        className="nav-link" 
                        component={Link}
                        onClick={handleClose}
                        to="/metadata/section" >
                        Section
                      </MenuItem>
                      <MenuItem 
                        className="nav-link" 
                        component={Link}
                        onClick={handleClose}
                        to="/metadata/suspension" >
                        Suspension
                      </MenuItem>
                    
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
                  target="_blank"
                  href={`${process.env.REACT_APP_PROFILE_URL}/profile`}
                  // onClick={() => toProfile()}
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
  


