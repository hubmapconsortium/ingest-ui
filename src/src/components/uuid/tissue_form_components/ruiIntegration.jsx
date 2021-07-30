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

   updateDimensions() {
    if (window.innerWidth < 1100) {
      this.setState({ width: 1100, height: 647 });
    } else {
      const update_width = Math.min(window.innerWidth - 40, 2000);
      const update_height = Math.round(window.innerHeight - 40, 2000);
      this.setState({ width: update_width, height: update_height, margin_left: -100 });
    }
  }

   */
  updateDimensions() {
    if (window.innerWidth < 1100) {
      this.setState({ width: 1100, height: 647 });
    } else {
      const update_width = Math.min(window.innerWidth - 10, 2000);
      const update_height = Math.round(window.innerHeight - 10, 2000);
      this.setState({ width: update_width, height: update_height, margin_left: -20 });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    console.log('RUI...', this.props)

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
    this.setState({ close_rui: true });
  }

  updateRUIConfig() {
    const organ_info = ORGAN_TYPES[this.props.organ].split("(");
    const organ_name = organ_info[0].toLowerCase().trim();
    const organ_side = organ_info[1]?.replace(/\(|\)/g, "").toLowerCase();
    const sex = this.props.sex;
    const user_name = this.props.user;
    const location = this.props.location === "" ? null : JSON.parse(this.props.location);
    const self = this;

    window.ruiConfig = {
      // Custom configuration
      baseHref: process.env.REACT_APP_RUI_BASE_URL,
      embedded: true,
      tutorialMode: false,
      homeUrl: '/search',
      user: {
        firstName: user_name.split(" ")[0],
        lastName: user_name.split(" ")[1]
      },
      organ: {
        //ontologyId: xxx, // IEC TODO
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
        // IEC TODO: Fetch previous registrations for this user/organization to the same organ
        return [];
      },
      cancelRegistration: function () {
        self.handleCloseScreenClick();
      },
      editRegistration: location,
      useDownload: false,
    };
  }


  render() {
    this.updateRUIConfig();
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
                  <ccf-rui></ccf-rui>
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
