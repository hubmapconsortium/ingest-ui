import React, { Component } from "react";

class RUIIntegration extends Component {
  state = {
    unityInstance: {},
    jsonRUI: "",
    rui_back: false,
    close_rui: false,
  };

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
    };
  }

  handleCloseScreenClick = (e) => {
    this.state.unityInstance.Quit();
    this.setState({
      close_rui: true,
    });
  };

  render() {
    return (
      <div className='webgl-content rui'>
        {!this.state.close_rui && (
          <React.Fragment>
            <div
              id='unityContainer'
              style={{ width: 1920, height: 1080 }}
            >
            </div>
            <div className='footer'>
              <React.Fragment>
                <div className='webgl-logo'></div>
                <div
                  className='closeScreen'
                  onClick={this.handleCloseScreenClick}
                >
                  Close
                </div>
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
