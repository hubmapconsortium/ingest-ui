import React, { Component } from "react";
import "../../../App.css";


class RUIIntegration extends Component {

  constructor() {
    super();

    this.state = {
      // unityInstance: {},
      jsonRUI: "",
      rui_back: false,
      close_rui: false,
      close_link: true,
      width: 1820,
      height: 1012,
      mounted: false,
    }
  }
  /**
   * Calculate & Update state of new dimensions
   */
  updateDimensions() {
    if (window.innerWidth < 500) {
      this.setState({ width: 1100, height: 647 });
    } else {
      let update_width = window.innerWidth - 100;
      let update_height = Math.round(update_width / 1.8);
      this.setState({ width: update_width, height: update_height });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    const runtime_script = document.createElement("script");
    runtime_script.src = "https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@staging/rui/runtime.js";
    runtime_script.async = true;
    document.body.appendChild(runtime_script);
    const polyfills_script = document.createElement("script");
    polyfills_script.src = "https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@staging/rui/polyfills.js";
    polyfills_script.async = true;
    document.body.appendChild(polyfills_script);
    const main_script = document.createElement("script");
    main_script.src = "https://cdn.jsdelivr.net/gh/hubmapconsortium/ccf-ui@staging/rui/main.js";
    main_script.async = true;
    document.body.appendChild(main_script);


    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'UA-136932895-2');

    var self = this;
    window.ruiConfig = {
      // Custom configuration
      embedded: true,
      tutorialMode: false,
      homeUrl: '/donors-samples',
      organ: {
        name: 'kidney',
        sex: 'female',
        side: 'left'
      },
      register: function (str) {
        console.log(str);
        self.setState({ jsonRUI: str });
        self.props.handleJsonRUI(str);
        self.handleCloseScreenClick();
      },
      useDownload: false,
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
    // this.state.unityInstance.Quit();
  };


  render() {
    return (
      <React.Fragment>
        <div className='webgl-content rui mat-typography' >
          {!this.state.close_rui &&
            (
              <React.Fragment>
                <div
                  id='unityContainer'
                  style={{ width: this.state.width, height: this.state.height }}

                >
                  <ccf-root></ccf-root>
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
      </React.Fragment>
    );
  }
}

export default RUIIntegration;

//{/** width = {this.state.width} height= {this.state.height} **/}
