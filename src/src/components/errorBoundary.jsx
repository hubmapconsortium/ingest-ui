import React, { Component } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import ErrorTwoToneIcon from '@mui/icons-material/ErrorTwoTone';
import ListAltTwoToneIcon from '@mui/icons-material/ListAltTwoTone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';


import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem from '@mui/lab/TreeItem';

import Collapse from '@mui/material/Collapse';
import StackTrace from 'stacktrace-js'

const theme = createTheme();

theme.typography.h3 = {
  fontSize: '1.2rem',
  '@media (min-width:600px)': {
    fontSize: '1.5rem',
  },
  [theme.breakpoints.up('md')]: {
    fontSize: '2rem',
  },
};

// Error BOundaries only work as classes as of React 16(.8?)
// We Get the error gere, not loaded conditonally but loading & wrapping sub-funcs

// ALSO does not handle promises. Can we pipe em?
// https://jaketrent.com/post/react-error-boundaries-event-handlers
// https://eddiewould.com/2021/28/28/handling-rejected-promises-error-boundary-react/

// key="0"
// FallbackComponent={MyFallbackComponent}
// onError={(error, errorInfo) => console.error({ error, errorInfo })}

// interface State {
//     error: any; // Could be an exception thrown in synchronous code or could be a rejection reason from a Promise, we don't care
// }

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: "",
      localStackFrames:"",
      stackCollapse:false,
    };
    
  }

  
  componentDidCatch(error, errorInfo) {
      console.debug("Bound componentDidCatch");
      console.debug(error);
      console.debug(errorInfo);
      this.setState({error: error});
      // StackTrace.fromError(error).then(this.stackTraceCallback);
  }


  renderStackTrace(){
    console.debug("renderStackTrace!!!");
    // var stackList = [];

    // for (const element of this.state.localStackFrames) {
    //   console.debug("element",element);
    //   stackList.push(
    //     // <ListItem 
    //     // key={element[0]+""+element[1][1]}
    //     // dense
    //     // disableGutters>
    //     // <ListItemText  
    //     //   primary={
    //     //     <Typography 
    //     //       > 
    //     //       <strong> {element[0]}</strong>
    //     //     </Typography>
    //     // } 
    //     //   secondary={
    //     //   <Typography > 
    //     //    at Line {element[1][1]} Column {element[1][2]} <br />
    //     //     in <em>{element[1][0]}</em>
    //     //   </Typography>} />
       
    //     // </ListItem>
       
    //       // <TreeItem nodeId="1" label={element[0]}>
    //       //   <TreeItem nodeId="2" label={ element[1][0]+":"+element[1][1] } />
    //       // </TreeItem>
    //       <React.Fragment>
    //         <Typography sx={{}}> {element[0]} </Typography>
    //         <Typography sx={{fontSize: '0.7em'}}>{ element[1][0]+":"+element[1][1] } </Typography>
    //       </React.Fragment>
    //   );
    // }

    return ("stackList");
    // return (stackList);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }


  render() {
    
    const handleClick = () => {
      this.setState({stackCollapse: !this.state.stackCollapse});
    };
    const {error} = this.state;
    // var stack = this.state.localStackFrames;
    // console.debug("stack",stack);
    if (error) {
      // console.debug("ErrorBoundary error", error);
      return (
        <Drawer
        PaperProps={{
          sx: { 
            width: "300px" 
          },
        }}
        // open={errStatus}
        open={true}
        anchor="right"
        // onClose={setErrDrawerOpen(false)}
        > 
      


      <Box 
        role="error">
        <ThemeProvider theme={theme}>
          <Box  
            sx={{
            //   margin: '1em' ,
              backgroundColor: 'red',
              color: 'white',
              padding: '1em',
            }}> 
            <Typography variant="h4" > <ErrorTwoToneIcon color="red" fontSize="Large"/>  Internal Server Error  </Typography>

          </Box>
        </ThemeProvider>
      </Box>

      <Box 
      sx={{
          padding: '1em',
        }}>  

        <Typography sx={{}}> <strong>Message:</strong></Typography>
        <Typography sx={{color:"red", fontSize:"1.3rem", marginBottom:'10px'}}> {error.message}</Typography>

        <Typography sx={{}}> <strong>Stack:</strong></Typography>
      {/* <TreeView
          aria-label="Stack navigator"
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ height: 240, flexGrow: 1, maxWidth: 200, overflowX: 'auto' }}
        > */}
          {this.renderStackTrace()}
        
        {/* </TreeView> */}

      </Box>


          

      <Box
      sx={{
        //   margin: '1em' ,
          padding: '1em',
        }}>
        If this error persists, please contact help@hubmapconsiortium.org
      </Box>
      </Drawer>
        // <div>ERROR {error}</div>
      );
    } else {
      return <>{this.props.children}</>;
    }
  }
}
