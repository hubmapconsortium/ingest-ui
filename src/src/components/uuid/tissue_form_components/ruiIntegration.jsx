import React, { Component } from "react";
import { RUI_ORGAN_MAPPING } from "../../../constants.jsx";
// import { ubkg_api_get_organ_type_set } from "../../../service/ubkg_api";
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
    };

    this.ruiRef = React.createRef();
  }

  /**
   * Calculate & Update state of new dimensions
   */
  updateDimensions() {
    if (window.innerWidth < 1100) {
      this.setState({ width: 1000, height: 647 });
    } else {
      const update_width = Math.min(window.innerWidth - 50, 2000);
      const update_height = Math.round(window.innerHeight - 50, 2000);
      this.setState({ width: update_width, height: update_height, margin_left: 25 });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    console.log('RUI...', this.props)
    this.setState({organ_types: JSON.parse(localStorage.getItem("organs"))}, () => {
      console.log(this.state.organ_types);
    }, () => {
      // console.log('ERROR: ubkg_api_get_organ_type_set')
    });

    // ubkg_api_get_organ_type_set()
    //   .then((res) => {
    //     this.setState({organ_types: res}, () => {
    //       console.log(this.state.organ_types);
    //     }, () => {
    //       console.log('ERROR: ubkg_api_get_organ_type_set')
    //     });
    //   });

    this.updateRUIConfig();
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions.bind(this));

    this.setState({
      mounted: true,
    });
  }

  componentDidUpdate() {
    if (this.ruiRef.current) {
      this.updateRUIConfig();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions.bind(this));
  }


  handleCloseScreenClick = (e) => {
    this.setState({ close_rui: true });
  }

  updateRUIConfig() {
    // console.debug('%c◉ thisPROPS RuiInt ', 'color:#00ff7b',this.props.organ, this.props.organList,this.props.organList[this.props.organ] );
    // console.debug('%c◉ thisPROPS RuiInt ', 'color:#00ff7b', this.props );
    const organ_id = RUI_ORGAN_MAPPING[this.props.organ];
    const organ_info = this.props.organList[this.props.organ].split("(");
    const organ_name = organ_info[0].toLowerCase().trim();
    const organ_side = organ_info[1]?.replace(/\(|\)/g, "").toLowerCase();
    const sex = this.props.sex;
    const user_name = this.props.user || "";
    const location = this.props.location === "" ? null : JSON.parse(this.props.location);
    const self = this;

    const rui = this.ruiRef.current;
    rui.baseHref = process.env.REACT_APP_RUI_BASE_URL;
    rui.user = {
      firstName: user_name.split(" ")[0],
      lastName: user_name.split(" ")[1]
    };
    rui.organ = {
      ontologyId: organ_id,
      name: organ_name,
      sex: sex || "female",
      side: organ_side
    };
    rui.register = function (str) {
      console.log(str);
      self.setState({ jsonRUI: str });
      self.props.handleJsonRUI(str);
      self.handleCloseScreenClick();
    };
    rui.fetchPreviousRegistrations = function () {
      // IEC TODO: Fetch previous registrations for this user/organization to the same organ
      return [];
    };
    rui.cancelRegistration = function () {
      rui.register(self.props.location);
    };
    if (location &&
        // Don't re-set the registration if it's the same as before
        (!rui.editRegistration || location['@id'] !== rui.editRegistration['@id'])) {
      rui.editRegistration = location;
    }
    rui.useDownload = false;
  }

  render() {
    return (
      <React.Fragment>
        <div className='webgl-content rui mat-typography'>
          {!this.state.close_rui &&
            (
              <React.Fragment>
                <div id='unityContainer'
                  style={{ width: this.state.width, height: this.state.height, marginLeft: this.state.margin_left}}
                >
                  <ccf-rui ref={this.ruiRef}></ccf-rui>
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
