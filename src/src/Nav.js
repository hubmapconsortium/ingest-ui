import React, {useEffect} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import LoadingButton from '@mui/lab/LoadingButton'
import UploadsForm from './components/uploads/createUploads'
import {ingest_api_users_groups} from './service/ingest_api';

export const Navigation = (props) => {
  const[userDataGroups, setUserDataGroups] = React.useState(props.userDataGroups ? props.userDataGroups : null)

  const[uploadsDialog, setUploadsDialog] = React.useState(false)
  const[anchorEl, setAnchorEl] = React.useState({
    I: null,
    B: null,
    S: null
  })
  const open_I = Boolean(anchorEl.I)
  const open_B = Boolean(anchorEl.B)
  const open_S = Boolean(anchorEl.S)

  const navigate = useNavigate()
  const userInfo = props.appInfo

  useEffect(() => {
    console.debug('%c◉ userGroup UseEffect ', 'color:#00ff7b', );
    try{
      let userGroups = JSON.parse(localStorage.getItem("userGroups") ? localStorage.getItem("userGroups") : null)
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
    setAnchorEl(prevState => ({...prevState, [menu]: event.currentTarget}))
  }

  const handleClose = () => {
    setAnchorEl({I: null, B: null, S: null})
  }

  const OpenUploads = () => {
    setUploadsDialog(true)
  }

  const onClose = () => {
    setUploadsDialog(false)
  }

  const onCreated = (data) => {
    navigate('/Upload/' + data.results.uuid)
    setUploadsDialog(false)
  }

  function renderMenuButtonBar(){
    return(
      <React.Fragment>
        {renderMenuSection('Individual', handleClick('I'), open_I, anchorEl.I, [
          {to: '/new/donor', label: 'Donor'},
          {to: '/new/sample', label: 'Sample'},
          {to: '/new/dataset', label: 'Dataset'},
          {to: '/new/publication', label: 'Publication'},
          {to: '/new/collection', label: 'Collection - Dataset'},
          {to: '/new/EPICollection', label: 'Collection - EPIC'}
        ])}
        {renderMenuSection('Bulk', handleClick('B'), open_B, anchorEl.B, [
          {to: '/bulk/donors', label: 'Donors'},
          {to: '/bulk/samples', label: 'Samples'},
          {to: '/bulk/data', label: 'Data', onClick: OpenUploads}
        ])}
        {renderMenuSection('Upload Sample Metadata', handleClick('S'), open_S, anchorEl.S, [
          {to: '/metadata/block', label: 'Block'},
          {to: '/metadata/section', label: 'Section'},
          {to: '/metadata/suspension', label: 'Suspension'}
        ])}
        <span className="board">
          <Button
            target="_blank"
            href={`${process.env.REACT_APP_INGEST_BOARD_URL}`}
            className="flat-link " >
              Data Ingest Board
          </Button>
        </span>
      </React.Fragment>
    )
  };

  function renderMenuSection(label, handleClick, open, anchorEl, items){
    const IDLabel = label.toString().replace(/\s+/g, '')
    // @TODO: Investigate High Rerender around this
    // console.debug('%c◉ anchorEl ', 'color:#00ff7b', anchorEl);
    return(
      <React.Fragment>
        <Button
          id={`${IDLabel}IndividualButton`}
          // key={`${IDLabel}IndividualButton` + Math.random()}
          endIcon={<ArrowDropDownIcon />}
          aria-controls={open ? 'IndividualMenu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}>
          { label.toString() }
        </Button>
        <Menu
          id="IndividualMenu"
          anchorEl={anchorEl}
          open={open}
          onClose={() => handleClose()}
          MenuListProps={{
            'aria-labelledby': 'IndividualButton'
          }}>
          {items.map((item, index) => {
            // @TODO: We can ditch this once Uploads gets its own page
            if(item.to === '/bulk/data'){
              return(renderUploadsButton(item.to, item.label))
            }else{
              return(renderMenuButton(item.to, item.label))
            }
          })}
        </Menu>
      </React.Fragment>
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
    )
  }
  function renderUploadsButton(to, label){
    return(
      <MenuItem
        className="nav-link"
        component={Link}
        onClick={ () => OpenUploads()} >
        {label}
      </MenuItem>
    )
  }

  return(
    <AppBar position="static" id="header">
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
              display: {xs: 'flex', md: 'none'},
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none'
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

          {userDataGroups && userDataGroups.length > 0 && userDataGroups !=="Non-active login" && (
            <Box className="menu-bar" sx={{flexGrow: 1, display: {xs: 'flex', md: 'none'}}}>
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
              display: {xs: 'none', md: 'flex'},
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none'
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
          {userDataGroups && userDataGroups.length > 0 && userDataGroups !=="Non-active login" && (
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
  )
}
