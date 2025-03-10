import React,{useEffect} from "react";
import {Link} from 'react-router-dom';
import {useLocation} from "react-router-dom";
import {useNavigate} from "react-router-dom";
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LoadingButton from '@mui/lab/LoadingButton';
import MUIDialog from "./components/ui/dialog";
import UploadsForm from "./components/uploads/createUploads";

export const Navigation = (props) => {
  const [userInfo, setUserInfo] = React.useState();
  const [metaModalOpen, setMetaModalOpen] = React.useState(false);
  const [exampleLink, setExampleLink] = React.useState("block");
  // const [userGroups, setUserGroups] = React.useState();
  const [userDataGroups, setUserDataGroups] = React.useState([]);
  const [uploadsDialog, setUploadsDialog] = React.useState(false);
  const [anchorEl_I, setAnchorEl_I] = React.useState(null);
  const [anchorEl_B, setAnchorEl_B] = React.useState(null);
  const [anchorEl_S, setAnchorEl_S] = React.useState(null);
  const open_I = Boolean(anchorEl_I);
  const open_B = Boolean(anchorEl_B);
  const open_S = Boolean(anchorEl_S);
  var dialogMetadataTitle = 'Metadata Bulk Uploading Temporarily Unavailable';
  var dialogMetadataMessage = "Upload of Sample metadata is currently disabled. Please submit your metadata files to the help desk at <a href=\"mailto:help@hubmapconsortium.org\">help@hubmapconsortium.org</a>. <hr/>\
  <strong>Please prepare any new data submissions using the new next-generation metadata and directory schemas</strong>, which are linked from <a href=\""+exampleLink+"\"  target=\"_blank\">this page</a>. The schemas you should use are marked <strong>\"use this one\"</strong> on the schema pages. You can validate <strong>next-gen metadata schemas</strong> using the <a href=\"https://docs.google.com/document/d/1lfgiDGbyO4K4Hz1FMsJjmJd9RdwjShtJqFYNwKpbcZY/edit#heading=h.d6xf2xeysl78\" target=\"_blank\">process outlined here</a>. <strong>Please also <a href=\"https://docs.google.com/spreadsheets/d/19ZJx_EVyBGKNeW0xxQlOsMdt1DVNZYWmuG014rXsQP4/edit#gid=0\" target=\"_blank\">update this data pulse check spreadsheet</a></strong> so we know what data is coming from your team. We\'re looking forward to your submissions!<br/> \
  Please contact <a href=\"mailto:help@hubmapconsortium.org\">help@hubmapconsortium.org</a> if you have questions.";
  const location = useLocation();
  let navigate = useNavigate();
  useEffect(() => {
    setUserInfo(props.app_info);
    // setUserGroups(props.userGroups);
    setUserDataGroups([props.userDataGroups]);
    // @TODO: Consider moving all the User & User Group info into its own utils, 

    if(location.pathname === "/new/upload"){
      setUploadsDialog(true);
    }
  }, [props, props.app_info, location]);

  const handleCancel = () => {
    setMetaModalOpen(false);
  }  
  const handleOpenModal = (type) => {
    let sampleType = type.toString();
    console.debug('%c◉ type ', 'color:#00ff7b', type, sampleType, typeof sampleType);
    setExampleLink("https://hubmapconsortium.github.io/ingest-validation-tools/sample-"+sampleType.toLowerCase()+"/current/")
    console.debug('%c◉ link ', 'color:#00ff7b', exampleLink);
    setMetaModalOpen(true);
  }

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

  return (
      <AppBar position="static" id="header">
         <MUIDialog 
          open={metaModalOpen} 
          handleClose={handleCancel} 
          title={dialogMetadataTitle}
          message={dialogMetadataMessage}
          // dialogHelpLink={dialogHelpLinkURL}
          bgcol = "Red" />
        <Dialog open={uploadsDialog}>
          <DialogContent> 
          <UploadsForm
              onCreated={onCreated}
              cancelEdit={onClose}
            />
          </DialogContent>
        </Dialog>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Typography
              variant="h6"
              noWrap
              // component="a"
              href="/"
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              <a className="navbar-brand" href="/">
               <img
                src="https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png"
                height="40"
                className="d-inline-block align-top"
                id="MenuLogo"
                alt="HuBMAP logo"
              />
            </a>
            </Typography>
            {props.login &&  userDataGroups[0] &&  userDataGroups[0].length >0 &&(
              <Box className="menu-bar"  sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                <Button 
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
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/publication" >
                    Publication
                  </MenuItem>
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/collection" >
                    Collection - Dataset
                  </MenuItem>
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/EPICollection" >
                    Collection - EPIC
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
                <Button 
                  id="sampleMetadataButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_I ? 'sampleMetadataMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_I ? 'true' : undefined}
                  onClick={handleClick_S} >
                  Upload Sample Metadata</Button>
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
                    to="/metadata/block" >
                    {/* // onClick={() => handleOpenModal("Block")}> */}
                    Block
                  </MenuItem>
                  <MenuItem 
                    className="nav-link" 
                    component={Link}
                    to="/metadata/section" >
                    {/* onClick={() => handleOpenModal("Section")}> */}
                    Section
                  </MenuItem>
                  <MenuItem 
                    className="nav-link" 
                    component={Link}
                    to="/metadata/suspension" >
                    {/* // onClick={() => handleOpenModal("Suspension")}> */}
                    Suspension
                  </MenuItem>
                </Menu>
                <span className="board">
                    <Button
                      target="_blank"
                      href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
                      className="flat-link " >
                        Data Ingest Board
                    </Button>
                </span>
              </Box>
            )}
            <Typography
              variant="h5"
              noWrap
              // component="a"
              href="#app-bar-with-responsive-menu"
              sx={{
                textAlign: 'left',
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}>
              <a className="navbar-brand" href="/">
                <img
                  src="https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png"
                  height="40"
                  className="d-inline-block align-top"
                  id="MenuLogo"
                  alt="HuBMAP logo"
                />
              </a>
            </Typography>
            {props.login &&  userDataGroups[0] &&  userDataGroups[0].length >0 &&(
              <Box className="menu-bar" sx={{  display: { xs: 'none', md: 'flex' } }}>
                <Button 
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
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/publication" >
                    Publication
                  </MenuItem>
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/collection" >
                    Collection - Dataset
                  </MenuItem>
                  <MenuItem 
                    className="nav-link"
                    component={Link}
                    onClick={handleClose}
                    to="/new/EPICollection" >
                    Collection - EPIC
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
                <Button 
                  id="sampleMetadataButton"
                  endIcon={<ArrowDropDownIcon />}
                  aria-controls={open_I ? 'sampleMetadataMenu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={open_I ? 'true' : undefined}
                  onClick={handleClick_S} >
                  Upload Sample Metadata</Button>
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
                    to="/metadata/block" >
                    {/* onClick={() => handleOpenModal("Block")}> */}
                    Block
                  </MenuItem>
                  <MenuItem 
                    className="nav-link" 
                    component={Link}
                    to="/metadata/section" >
                    {/* // onClick={() => handleOpenModal("Section")}> */}
                    Section
                  </MenuItem>
                  <MenuItem 
                    className="nav-link" 
                    component={Link}
                    to="/metadata/suspension">
                    {/* onClick={() => handleOpenModal("Suspension")} > */}
                    Suspension
                  </MenuItem>
                </Menu>
                <span className="board">
                    <Button
                      target="_blank"
                      href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
                      className="flat-link " >
                        Data Ingest Board
                    </Button>
                </span>


              </Box>
            )}
    
          <Box  className="menu-bar" sx={{ flexGrow: 1, justifyContent: 'flex-end'}}>
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
              <span className="logout" >
                <LoadingButton loading={props.isLoggingOut} color='info' onClick={(e) => props.logout(e)}>
                  Log Out 
                </LoadingButton>
              </span>
              {}
            </div>
            )}
          </div>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
