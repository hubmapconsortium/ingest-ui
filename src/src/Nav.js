import React, {useEffect} from 'react'
import {Link} from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Alert from "@mui/material/Alert";
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import LoadingButton from '@mui/lab/LoadingButton'
import {ingest_api_users_groups} from './service/ingest_api';
import useMediaQuery from '@mui/material/useMediaQuery'
import AddBoxIcon from '@mui/icons-material/AddBox'
import LibraryAddIcon from '@mui/icons-material/LibraryAdd'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import DashboardIcon from '@mui/icons-material/Dashboard'

const MENU_SECTIONS = [
  {
    key: 'I',
    label: 'Individual',
    items: [
      {to: '/new/donor', label: 'Donor'},
      {to: '/new/sample', label: 'Sample'},
      {to: '/new/publication', label: 'Publication'},
      {to: '/new/collection', label: 'Collection - Dataset'},
      {to: '/new/EPICollection', label: 'Collection - EPIC'}
    ]
  },
  {
    key: 'B',
    label: 'Bulk',
    items: [
      {to: '/bulk/donors', label: 'Donors'},
      {to: '/bulk/samples', label: 'Samples'},
      {to: '/new/upload', label: 'Data'}
    ]
  },
  {
    key: 'S',
    label: 'Upload Sample Metadata',
    items: [
      {to: '/metadata/block', label: 'Block'},
      {to: '/metadata/section', label: 'Section'},
      {to: '/metadata/suspension', label: 'Suspension'}
    ]
  }
]

const MENU_LOGO = 'https://hubmapconsortium.org/wp-content/uploads/2020/09/hubmap-type-white250.png'

export const Navigation = (props) => {
  const isMid = useMediaQuery('(max-width:1199px)');
  // const isMid = useMediaQuery('(max-width:1170px)');
  const isSmall = useMediaQuery('(max-width:1080px)');
  // If we're here because we tried making a new Dataset from the old url, show the warning popup 
  let[routingMessage, setRoutingMessage] = React.useState(window.location.pathname === "/new/dataset" ? ["Registering individual datasets is currently disabled.","/new/upload"] : null);
  let[userDataGroups, setUserDataGroups] = React.useState(JSON.parse(localStorage.getItem("userGroups")) ? JSON.parse(localStorage.getItem("userGroups")) : null)
  const showMenus = Array.isArray(userDataGroups) && userDataGroups.length > 0 && userDataGroups !== "Non-active login";
  const [activeMenu, setActiveMenu] = React.useState(null)
  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null)

  const userInfo = JSON.parse(localStorage.getItem("info")) ? JSON.parse(localStorage.getItem("info")) : null

  useEffect(() => {
    // console.debug('%c◉ userGroup UseEffect ', 'color:#00ff7b', );
    try{
      let userGroups = JSON.parse(localStorage.getItem("userGroups")) ? JSON.parse(localStorage.getItem("userGroups")) : null
      if(!userGroups || userGroups === null){
        ingest_api_users_groups()
        .then((res) => {
          if( typeof res.Response === 'string'){
            // Must be a message not set of groups
            throw new Error(res.results)
          }else{
            setUserDataGroups(res.results)
          }
        })
        .catch((err) => {
          throw new Error(err)
        })
      }
    }catch(err){
      throw new Error(err)
    }
  }, [])

  const handleClick = (menu) => (event) => {
    setActiveMenu(menu)
    setMenuAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setActiveMenu(null)
    setMenuAnchorEl(null)
  }

  function renderMenuButtonBar(){
    return(
      <React.Fragment>
        {MENU_SECTIONS.map((section) => (
          <React.Fragment key={section.key}>
            {renderMenuSection(section, activeMenu === section.key, menuAnchorEl)}
          </React.Fragment>
        ))}
        <span className="board">
          <Button
            target="_blank"
            sx={isMid ? {fontSize:"0.7em"} : {}}
            href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
            className="flat-link "
            aria-label="Data Ingest Board">
              { isSmall ? <DashboardIcon /> : 'Data Ingest Board' }
          </Button>
        </span>
      </React.Fragment>
    )
  };

  function renderMenuSection(section, open, anchorEl){
    const IDLabel = section.label.toString().replace(/\s+/g, '')
    return(
      <React.Fragment>
        <Button
          id={`${IDLabel}IndividualButton`}
          sx={isMid ? {fontSize:"0.7em"} : {}}
          aria-controls={open ? `${IDLabel}Menu` : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick(section.key)}
          aria-label={section.label}>
          { isSmall ? renderSectionIcon(section.label) : section.label.toString() }
        </Button>
        <Menu
          id={`${IDLabel}Menu`}
          className='navMenu'
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': `${IDLabel}IndividualButton`
          }}>
          {section.items.map((item, index) => {
            return(renderMenuButton(item.to, item.label, index))
          })}
        </Menu>
      </React.Fragment>
    )
  }

  function renderSectionIcon(label){
    const key = (label || '').toString().toLowerCase()
    if(key.includes('individual')) return <AddBoxIcon />
    if(key.includes('bulk')) return <LibraryAddIcon />
    if(key.includes('upload') || key.includes('metadata') || key.includes('sample')) return <UploadFileIcon />
    return <AddBoxIcon />
  }
  
  function renderMenuButton(to, label, index){
    return(
      <MenuItem
        key={index}
        className="nav-link"
        component={Link}
        to={to}
        onClick={handleClose} >
        {label} 
      </MenuItem>
    )
  }

  const [logoutHover, setLogoutHover] = React.useState(false);
  const [ctrlPressed, setCtrlPressed] = React.useState(false);

  function clearLocalStorage(){
    try{
      window.localStorage.clear();
      console.debug('Local storage cleared via Logout+modifier');
    }catch(err){
      console.error('Error clearing localStorage', err);
    }
  }

  const handleLogoutKeyDown = (e) => {
    if (e.key === 'Control' || e.ctrlKey || e.key === 'Meta' || e.metaKey) setCtrlPressed(true);
  };
  const handleLogoutKeyUp = (e) => {
    if (!(e.ctrlKey || e.metaKey)) setCtrlPressed(false);
  };

  function handleLogout(e){
    // Prefer the explicit event flags, fall back to our tracked state
    const modifierHeld = !!(e && (e.ctrlKey || e.metaKey)) || ctrlPressed;
    if(modifierHeld){
      let savedInfo = localStorage.getItem("info");
      clearLocalStorage();
      localStorage.setItem("info", savedInfo);
    }else if (props && typeof props.logout === 'function'){
      props.logout(e);
    }else{
      // nah
    }
  }

  return(
    <AppBar position="static" id="header">
      {routingMessage && routingMessage.length >0 && (
          <Alert variant="filled" severity="error" onClose={(e) => {setRoutingMessage(null)}}>
            <strong>Sorry</strong> {routingMessage[0]+" "} 
            Please use <Link to={routingMessage[1]} className="text-white">Uploads</Link> instead.
          </Alert>
        )}
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {renderLogo({display: {xs: 'flex', md: 'none'}})}

          {showMenus && (
            <Box className="menu-bar" sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
              {renderMenuButtonBar()}
            </Box>
          )}
          {renderLogo({textAlign: 'left', display: {xs: 'none', md: 'flex'}})}
          {showMenus && (
            <Box className="menu-bar" sx={{display: {xs: 'none', md: 'flex'}}}>
              {renderMenuButtonBar()}
            </Box>
          )}

          <Box className="menu-bar" sx={{flexGrow: 1, justifyContent: 'flex-end'}}>
            <div id="MenuRight">
              {(userInfo) && userInfo.email && (
                <div className="float-right">
                  <span className="username">
                    <Typography variant="button" className="username-menu">
                      {userInfo.email}
                    </Typography>
                    <Button
                      sx={(isMid || isSmall) ? {fontSize:"0.7em"} : {}}
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
                      sx={[
                        (isMid || isSmall) && { fontSize: '0.7em' },
                        logoutHover && ctrlPressed && { border: '2px solid red' }
                      ]}
                      onClick={(e) => handleLogout(e)}
                      onMouseEnter={(e) => { setLogoutHover(true); setCtrlPressed(!!(e.ctrlKey || e.metaKey)); window.addEventListener('keydown', handleLogoutKeyDown); window.addEventListener('keyup', handleLogoutKeyUp); }}
                      onMouseLeave={() => { setLogoutHover(false); setCtrlPressed(false); window.removeEventListener('keydown', handleLogoutKeyDown); window.removeEventListener('keyup', handleLogoutKeyUp); }}>
                      { (logoutHover && ctrlPressed) ? 'Clear Local Storage' : 'Log Out' }
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
  )
}

function renderLogo(extraSx){
  return(
    <Typography
      component={Link}
      to="/"
      variant={extraSx?.display?.md === 'flex' ? 'h5' : 'h6'}
      noWrap
      sx={{
        mr: 2,
        fontFamily: 'monospace',
        fontWeight: 700,
        letterSpacing: '.3rem',
        color: 'inherit',
        textDecoration: 'none',
        ...extraSx
      }}>
      <img
        src={MENU_LOGO}
        height="40"
        className="d-inline-block align-top navbar-brand"
        id="MenuLogo"
        alt="HuBMAP logo"/>
    </Typography>
  )
}
