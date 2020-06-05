import React, { Component } from "react";
import "../../../App.css";


class RUIIntegration extends Component {
  
  constructor(){
    super();

    this.state = {
      unityInstance: {},
      jsonRUI: "",
      rui_back: false,
      close_rui: false,
      close_link: true,
      width:1820,
      height:1012,
      mounted:false,
      }
  }
  /**
   * Calculate & Update state of new dimensions
   */
  updateDimensions() {
    if(window.innerWidth < 500) {
      this.setState({ width: 1100, height: 647 });
    } else {
      let update_width  = window.innerWidth-100;
      let update_height = Math.round(update_width/1.8);
      this.setState({ width: update_width, height: update_height });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    
    window.hideSignupScreen = true;
    const unityInstance = window.UnityLoader.instantiate(
      "unityContainer",
      "https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-3d-registration@staging/Build/output.json",
      { onProgress: window.UnityProgress }
    );
    this.setState({
      unityInstance: unityInstance,
    });
    
    // Callback when a user submits their RUI data;
    // str is a JSON-encoded string.
    var self = this;
    window.ruiRegistrationCallback = function (str) {
      self.setState({ jsonRUI: str });
      self.props.handleJsonRUI(str);
      self.handleCloseScreenClick();
      //self.setState({close_rui:false});
    };
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));
    this.setState({
      mounted: true,
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }


  handleCloseScreenClick = (e) => {
    
    this.setState({
      close_rui: true,
      
    });
    this.state.unityInstance.Quit();
  };


  render() {
    return (
      <div className='webgl-content rui' >
       {!this.state.close_rui   &&
         (
          <React.Fragment>
            <div
              id='unityContainer'
              style={{ width: this.state.width, height: this.state.height }}
              
            >
            </div>
            <div className='footer'>
              <React.Fragment>
                <div className='webgl-logo'></div>
                {/**<div
                  className='closeScreen'
                  onClick={this.handleCloseScreenClick}
                >
                  Close
                </div> **/}
                <div>{this.state.jsonRUI}</div>
                <div className='title'>RUI-Web</div>
              </React.Fragment>
            </div>
          </React.Fragment>
         )}
      </div>
    );
  }
}

export default RUIIntegration;

//{/** width = {this.state.width} height= {this.state.height} **/}
