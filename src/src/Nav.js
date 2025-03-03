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
  const [metaModalOpen, setMetaModalOpen] = React.useState(false);
  const [exampleLink, setExampleLink] = React.useState("block");
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
  const navigate = useNavigate();
  const userInfo = props.appInfo

  useEffect(() => {
    // @TODO: Consider moving all the User & User Group info into its own utils, 
    setUserDataGroups(props.userDataGroups);
  }, [props]);

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



  function renderMenuButtonBar(){
    // DYnamically load into thee nav box vs writing twice
    return (
      <>
        {renderMenuSection("IndividualT", handleClick_I, open_I, anchorEl_I, handleClose, [
          { to: "/new/donor", label: "Donor" },
          { to: "/new/sample", label: "Sample" },
          { to: "/new/dataset", label: "Dataset" },
          { to: "/new/publication", label: "Publication" },
          { to: "/new/collection", label: "Collection - Dataset" },
          { to: "/new/EPICollection", label: "Collection - EPIC" },
        ])}
        {renderMenuSection("Bulk", handleClick_B, open_B, anchorEl_B, handleClose, [
          { to: "/bulk/donors", label: "Donors" },
          { to: "/bulk/samples", label: "Samples" },
          { to: "/bulk/data", label: "Data", onClick: OpenUploads }
        ])}
        {renderMenuSection("Upload Sample Metadata", handleClick_S, open_S, anchorEl_S, handleClose, [
          { to: "/metadata/block", label: "Block" },
          { to: "/metadata/section", label: "Section" },
          { to: "/metadata/suspension", label: "Suspension" }
        ])}
        <span className="board">
          <Button
            target="_blank"
            href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
            className="flat-link " >
              Data Ingest Board
          </Button>
        </span>
      </>
    );
  };  

  function renderMenuSection(label, handleClick,open,anchorEl, close, items){
    let IDLabel = label.toString().replace(/\s+/g, '');
    return( 
      <>
        <Button 
          id={`${IDLabel}IndividualButton`}
          endIcon={<ArrowDropDownIcon />}
          aria-controls={open ? 'IndividualMenu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick} >
          { label.toString() }
        </Button>
        <Menu
          id="IndividualMenu"
          anchorEl={anchorEl}
          open={open}
          onClose={close}
          MenuListProps={{
            'aria-labelledby': 'IndividualButton',
          }}>
          {items.map((item, index) => {
            // @TODO: We can ditch this once Uploads gets its own page
            if(item.to === "/bulk/data"){
              return(renderUploadsButton(item.to, item.label));
            }else{
              return(renderMenuButton(item.to, item.label));
            }
          })}
        </Menu>
      </>
    )
  }
  function renderMenuButton(to, label){
    return(
      <MenuItem 
        className="nav-link"
        component={Link}
        onClick={handleClose}
        to={to} >
        {label}
      </MenuItem> 
    );
  }
  function renderUploadsButton(to, label){
    return(
      <MenuItem 
        className="nav-link"
        component={Link}
        onClick={ () => OpenUploads()} >
        {label}
      </MenuItem> 
    );
  }

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
              }}>
              <a className="navbar-brand" href="/">
                <img
                  src="https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png"
                  height="40"
                  className="d-inline-block align-top"
                  id="MenuLogo"
                  alt="HuBMAP logo"/>
              </a>
            </Typography>

            {/* This is all here as vestage from a workaround where the menu wont properly set in place on screens ~720 or narrowe */}
            {userDataGroups &&  userDataGroups.length >0 &&(
              <Box className="menu-bar"  sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}> 
                {renderMenuButtonBar()}  
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
            {userDataGroups &&  userDataGroups.length >0 &&(
              <Box className="menu-bar" sx={{  display: { xs: 'none', md: 'flex' } }}>
                {renderMenuButtonBar()}
              </Box>
            )}
    
          <Box className="menu-bar" sx={{ flexGrow: 1, justifyContent: 'flex-end'}}>
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
                  <LoadingButton 
                    loading={props.isLoggingOut} 
                    color='info' 
                    onClick={(e) => props.logout(e)}>
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
