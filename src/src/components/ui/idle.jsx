import React, {Component} from "react";
import Modal from "../uuid/modal";
import { SESSION_TIMEOUT_IDLE_TIME } from "../../constants";
import IdleTimer from "react-idle-timer";


class Timer extends Component{

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

        </div>
    )}
}


export default Timer;