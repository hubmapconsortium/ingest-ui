import React, { Component } from "react";
import { ORGAN_TYPES } from "../../../constants.jsx";
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
    if (window.innerWidth < 1100) {
      this.setState({ width: 1100, height: 647 });
    } else {
      const update_width = Math.min(window.innerWidth - 40, 2000);
      const update_height = Math.round(window.innerHeight - 40, 2000);
      this.setState({ width: update_width, height: update_height, margin_left: -100 });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    console.log('RUI...', this.props)
    const runtime_script = document.createElement("script");
    runtime_script.src = `${process.env.REACT_APP_RUI_BASE_URL}/runtime.js`;
    runtime_script.async = true;
    document.body.appendChild(runtime_script);
    const polyfills_script = document.createElement("script");
    polyfills_script.src = `${process.env.REACT_APP_RUI_BASE_URL}/polyfills.js`;
    polyfills_script.async = true;
    document.body.appendChild(polyfills_script);
    const main_script = document.createElement("script");
    main_script.src = `${process.env.REACT_APP_RUI_BASE_URL}/main.js`;
    main_script.async = true;
    document.body.appendChild(main_script);


    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'UA-136932895-2');

    const organ_info = ORGAN_TYPES[this.props.organ].split("(");
    const organ_name = organ_info[0].toLowerCase().trim();
    const organ_side = organ_info[1]?.replace(/\(|\)/g, "").toLowerCase();
    const sex = this.props.sex;
    const user_name = this.props.user;
    const location = this.props.location === "" ? null : JSON.parse(this.props.location)
    var self = this;
    window.ruiConfig = {
      // Custom configuration
      baseHref: `${process.env.REACT_APP_RUI_BASE_URL}/`,
      embedded: (sex !== "" && sex !== undefined),
      tutorialMode: false,
      homeUrl: '/search',
      user: {
        firstName: user_name.split(" ")[0],
        lastName: user_name.split(" ")[1]
      },
      organ: {
        name: organ_name,
        sex: sex || "female",
        side: organ_side
      },
      register: function (str) {
        console.log(str);
        self.setState({ jsonRUI: str });
        self.props.handleJsonRUI(str);
        self.handleCloseScreenClick();
      },
      fetchPreviousRegistrations: function () {

      },
      editRegistration: location,
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
                  style={{ width: this.state.width, height: this.state.height, marginLeft: this.state.margin_left}}

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
