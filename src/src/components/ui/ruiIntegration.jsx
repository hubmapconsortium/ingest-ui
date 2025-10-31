import React, { Component } from "react";
import { RUI_ORGAN_MAPPING, ubkgRUIMap} from "../../constants.jsx";
import { ubkg_api_get_organs_full } from "../../service/ubkg_api.js";
import "../../App.css";

 
// NOTE: This will be superseeding the ruiIntegration.jsx in /uuid/tissue_form_components/
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
      ruiOrganMap: {},
    };

    this.ruiRef = React.createRef();
    
  }

  setRUIOrganMap() {
    ubkg_api_get_organs_full()
      .then((data) => {
        // console.debug('%c◉ ubkg_api_get_organs_full ', 'color:#0800FF', data);
        let organMap = {};
        data.forEach((organ) => {
          organMap[organ.term] = {
            organ: organ.term,
            ruiCode: organ.rui_code,
            uberon: organ.organ_uberon,
            ruiSupported: organ.rui_supported,
          } 
          if(organ.laterality){
            organMap[organ.term]['laterality'] = organ.laterality;
          }
        });
        // console.debug('%c◉ organMap ', 'color:#9000FF', organMap);
        this.setState({ ruiOrganMap: organMap });
        localStorage.setItem("organs_full",JSON.stringify(organMap));
      }
      ).catch((error) => {
        // console.debug("RUI_ORGAN_MAP", error, error.response);
      });
  }

  /**
   * Calculate & Update state of new dimensions
   */
  updateDimensions() {
    if (window.innerWidth < 1100) {
      this.setState({ width: 1000, height: 647 });
    } else {
      const update_width = Math.min(window.innerWidth - 60, 2000);
      const update_height = Math.round(window.innerHeight - 60, 2000);
      this.setState({ width: update_width, height: update_height, margin_left: 0 });
    }
  }

  /**
   * Remove event listener
   */

  componentDidMount() {
    // console.log('RUI...', this.props)
    this.setRUIOrganMap();
    this.setState({organ_types: JSON.parse(localStorage.getItem("organs"))}, () => {
        // console.log(this.state.organ_types);
      }, () => {
        // console.log('ERROR: ubkg_api_get_organ_type_set')
      });

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
    // console.debug('%c◉ Closing,  handleCloseScreenClick', 'color:#00ff7b', );
    this.setState({ close_rui: true });
    this.props.closeRUIModal();
  }

  updateRUIConfig() {
    // console.debug('%c◉ thisPROPS RuiInt ', 'color:#00ff7b',this.props.organ, this.props.organList,this.props.organList[this.props.organ] );
    // console.debug('%c◉ thisPROPS RuiInt ', 'color:#00ff7b', this.props );

    // const organ_id = RUI_ORGAN_MAPPING[this.props.organ];
    const organ_info = this.props.organList[this.props.organ].split("(");
    const organ_name = organ_info[0].toLowerCase().trim();
    const organ_side = organ_info[1]?.replace(/\(|\)/g, "").toLowerCase();
    const sex = this.props.sex;
    const user_name = this.props.user || "";
    let location;
    if(this.props.location && this.props.location !== "") {
      // console.debug('%c◉ TYPEOF ', 'color:#00ff7b', typeof this.props.location, this.props.location);
      if(typeof this.props.location === "string"){
        location = JSON.parse(this.props.location);
      }else if(typeof this.props.location === "object") {
        location = this.props.location;
      }
    }else{
      location = null;
    }
    
    const self = this;
    const rui = this.ruiRef.current;
    rui.baseHref = process.env.REACT_APP_RUI_BASE_URL;
    rui.user = {
      firstName: user_name.split(" ")[0],
      lastName: user_name.split(" ")[1]
    };
    rui.organ = {
      // ontologyId: organ_id,
      name: organ_name,
      sex: sex || "female",
      side: organ_side
    };
    rui.register = function (str) {
      // console.log(str);
      self.setState({ jsonRUI: str });
      self.props.handleJsonRUI(str);
      self.handleCloseScreenClick();
    };
    rui.fetchPreviousRegistrations = function () {
      // IEC TODO: Fetch previous registrations for this user/organization to the same organ
      return [];
    };
    rui.cancelRegistration = function (str) {
      // console.log("cancelRegistration",str);
      self.setState({ close_rui: true });
      self.props.closeRUIModal();
    };
    rui.skipUnsavedChangesConfirmation="true"
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
                <div 
                  id='unityContainer'
                  style={{ 
                    width: this.state.width, 
                    height: this.state.height, 
                    marginLeft: this.state.margin_left}}>
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
