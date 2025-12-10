import React, {Component} from "react";
// import Modal from "../uuid/modal";

import Button from "@mui/material/Button";
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

// import { SESSION_TIMEOUT_IDLE_TIME } from "../../constants";
import IdleTimer from "react-idle-timer";

class Timer extends Component{
  SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
  constructor(props) {
      super(props);
      this.state = {
        activeFlag:false,
        timer:"",
        idleTimer:"",
        show:false,
        logout_in:60000,
      }
  }
  
  resetTimer = () => {
    this.setState({
        show:false,
        logout_in:60,
        activeFlag: true
    });
    this.idleTimer.reset();
  }

  onIdle = e => {
    console.debug("Idle");
    if (localStorage.getItem("isAuthenticated") === "true") {
      this.setState({
            show: true,
            logout_in: 60,
            activeFlag: false
        },() => {
          setTimeout(countDown.bind(this), 500);
          function countDown() {
              this.setState({
                  logout_in: this.state.logout_in - 1
                },() => {
                  if (this.state.logout_in > 0) {
                    // console.debug("countDown", this.state.logout_in, this.state.activeFlag);
                    this.setState({
                        timer: setTimeout(countDown.bind(this), 1000)
                    });
                }else{
                    // So for the now the timer likes to keep going regardless of attempts to kill it. 
                    // Lets check that we're still Idle, and no new activity has occured. Logged when activity or action cll resetTimer
                    if(this.state.activeFlag === true){
                        // Ignore, we'll set a new timer as-needed
                    }else{
                        // console.debug("Timer END");
                        this.props.logout();
                    }
                }
              }
            );
          }
        }
      );
    }
  };

  hideModal = () => {
    this.resetTimer();
    this.setState({ show: false });
  };

  onAction = e => {
    // console.debug("onAction");
    this.setState({show:false});
    this.resetTimer();
  }
  
  onActive = e => {
    // console.debug("onActive");
    this.resetTimer();
  };

  // Display the final output
  render() {
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
        timeout={this.SESSION_TIMEOUT_IDLE_TIME}/>
      <Dialog
        maxWidth='sm'
        aria-labelledby="idle-dialog"
        open={this.state.show}>
          <IconButton
            sx={(theme) => ({
              position: 'absolute',
              right: 8,
              top: 8,
              color: theme.palette.grey[500],
            })}
            aria-label="close"
            onClick={(e) => this.hideModal(e)}>
            <CloseIcon />
          </IconButton>
          <DialogTitle id="idle-dialog">Are you still there?</DialogTitle>
          <DialogContent dividers>
            The application will automatically log out in{" "}
            {this.state.logout_in} seconds. If you want to keep you logged
            in, please click "close" below.
          </DialogContent>
          <DialogActions>
            <Button sx={{margin:"0 10px"}} onClick={(e) => this.hideModal(e)}>
              Close
            </Button>
            {/* <Button sx={{margin:"0 10px"}} variant="contained">
              Logout
            </Button> */}
          </DialogActions>
        </Dialog>
      </div>
    )
  }
}

export default Timer;