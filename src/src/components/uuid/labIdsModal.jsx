import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import RUIModal from './tissue_form_components/ruiModal';
import check from './tissue_form_components/check25.jpg';
import Modal from "./modal";
import axios from "axios";
import RUIIntegration from "./tissue_form_components/ruiIntegration";
import { entity_api_update_multiple_entities } from '../../service/entity_api';

class LabIDsModal extends Component {

  state = {
    rui_json: "",
    rui_click: { name: '' },
    rui_checks: { name: '' },
    rui_view: false,
    activate_input: true,
    rui_locations: { name: '' },
    sample_name: "",
    update: false,
    metadata: this.props.metadata,
  };

  componentDidMount() {

    console.log('LabIDsModal', this.props)
    this.setState({
            metadata: {
              ...this.state.metadata.direct_ancestor,
              sex: this.getGender(this.state.metadata.direct_ancestor)
            }
          });
    console.log('state',this.state)
    // const config = {
    //   headers: {
    //     Authorization:
    //       "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
    //     "Content-Type": "multipart/form-data"
    //   }
    // };

    // axios.get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${this.props.metadata.source_uuid}`,
    //   config
    // ).then(res => {
    //   const metadata_str = res.data.entity_node?.metadata;
    //   if (metadata_str == undefined) {
    //     this.setState({
    //       metadata: {
    //         ...this.state.metadata,
    //         sex: ""
    //       }
    //     });
    //   } else {
    //     const metadata = JSON.parse(metadata_str);
    //     try {
    //       const sex = metadata.organ_donor_data.find(e => e.grouping_concept_preferred_term === "Sex").preferred_term.toLowerCase();
    //       this.setState({
    //         metadata: {
    //           ...this.state.metadata,
    //           sex: sex
    //         }
    //       });
    //     } catch {
    //       this.setState({
    //         metadata: {
    //           ...this.state.metadata,
    //           sex: ""
    //         }
    //       });
    //     }
    //   }
    // }).catch(err => {
    //   console.log(err);
    // })


  }

 getGender = (entity) => {

    const metadata = entity?.metadata;

    console.log(metadata)
    if (metadata === undefined) {
      return ""
    } else {
          //traverse the organ array for a concept that matches
          try {
            return metadata.organ_donor_data.find(e => e.grouping_concept_preferred_term === "Sex").preferred_term.toLowerCase();
          } catch {
              return "";
          }
    }
  }

  handleRUIJson = dataFromChild => {
    const { rui_locations } = { ...this.state };
    const currentState = rui_locations;
    currentState[this.state.sample_name] = dataFromChild;
    this.setState({ rui_locations: currentState });

    const { rui_checks } = { ...this.state };
    const curState = rui_checks;
    curState[this.state.sample_name] = true;
    this.setState({ rui_checks: curState });

    const { rui_click } = { ...this.state };
    const cState = rui_click;
    cState[this.state.sample_name] = false;
    this.setState({ rui_click: cState });

    this.setState({
      rui_json: dataFromChild,
      rui_view: true,
      activate_input: true
    });
  };

  handleAddRUILocation = name => {
    const { rui_click } = { ...this.state };
    const currentState = rui_click;
    currentState[name] = true;
    this.setState({ rui_click: currentState });

    const { rui_checks } = { ...this.state };
    const curState = rui_checks;
    curState[name] = false;
    this.setState({ rui_checks: curState });

    this.setState({
      activate_input: false,
      sample_name: name
    });
  };

  openRUIModalHandler = name => {
    this.setState({
      rui_show: true,
      sample_name: name
    });
  }

  closeRUIModalHandler = () => {
    this.setState({
      rui_show: false
    });
  }

  handleViewRUIClick = e => {
    this.setState({
      rui_view: true,
      rui_show: true,
      rui_hide: false
    });
  };

  handleClose = e => {
    this.setState({
      rui_show: false,
      rui_hide: true
    });
  };

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.ids !== props.ids) {
      let assigned_ids = {};
      let rui_locations = {};
      let rui_checks = {};
      if (props.ids) {
        props.ids.map(x => {
          if (x.lab_tissue_id === undefined) {
            assigned_ids[x.uuid] = "";
          }
          else { assigned_ids[x.uuid] = x.lab_tissue_id; }
          if (x.rui_location === undefined) {
            rui_locations[x.uuid] = "";
            rui_checks[x.uuid] = false;
          }
          else {
            rui_locations[x.uuid] = x.rui_location;
            rui_checks[x.uuid] = true;
          }
          return x;
        });
      }

      return { ids: props.ids, assigned_ids: assigned_ids, rui_locations: rui_locations, rui_checks: rui_checks };
    }
    return null;
  }

  createSampleList = () => {
    let labIds_locations = {};
    Object.keys(this.state.assigned_ids).map(x => {
  
      let sample = {};
      //sample["uuid"] = x;

      sample["lab_tissue_sample_id"] = this.state.assigned_ids[x];
      Object.keys(this.state.rui_locations).map(y => {
        if (x === y) {
          if (this.state.rui_locations[y] && this.state.rui_locations[y].length > 0) {
            sample["rui_location"] = JSON.parse(this.state.rui_locations[y]);
          }
        }
        return sample;
      });
      //labIds_locations.push({[x]: sample});
      labIds_locations[x] = sample;
      return;
    });
    return labIds_locations;
  };

  //  old_createSampleList = () => {
  //   let labIds_locations = [];
  //   Object.keys(this.state.assigned_ids).map(x => {
  //     let sample = {};
  //     sample["uuid"] = x;
  //     sample["lab_identifier"] = this.state.assigned_ids[x];
  //     Object.keys(this.state.rui_locations).map(y => {
  //       if (x === y) {
  //         sample["rui_location"] = this.state.rui_locations[y];
  //       }
  //       return sample;
  //     });
  //     labIds_locations.push(sample);
  //     return;
  //   });
  //   return labIds_locations;
  // };

  handleInputChange = e => {
    const { name, value } = e.target;
    console.log(name);
    console.log(value);
    this.setState(prevState => {
      let assigned_ids = Object.assign({}, prevState.assigned_ids);
      assigned_ids[name] = value;
      return { assigned_ids };
    });
  };

  handleInputKeyPress = () => {
    console.log("Press");
  }

  handleSubmit = () => {
    this.setState(
      {
        submitting: true,
        success: false
      },
      () => {
        // const config = {
        //   headers: {
        //     Authorization:
        //       "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
        //     MAuthorization: "MBearer " + localStorage.getItem("info"),
        //     "Content-Type": "application/json"
        //   }
        // };
        //let formData = this.createSampleList();
        // axios
        //   .put(
        //     `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens`,
        //     formData,
        //     config
        //   )
        //   .then(res => {
        //     this.setState(
        //       {
        //         submitting: false,
        //         success: true
        //       }
        //       , () => {
        //         if (this.props.onSaveLocation) {
        //           this.props.onSaveLocation(true);
        //         }
        //         this.props.hide();
        //       });
        //   })
        //   .catch(error => {
        //     this.setState({ submitting: false, submit_error: true });
        //   });

          // prepare the data
          let data = this.createSampleList();
          console.log('LabIDsModal', data);
            // now update multiple lab id entities
              entity_api_update_multiple_entities(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((resp) => {
                    if (resp.status == 200) {
                        this.setState(
                    {
                      submitting: false,
                      success: true
                    }, () => {
                      if (this.props.onSaveLocation) {
                          this.props.onSaveLocation(true);
                      }
                        this.props.hide();
                      });
                    } else {
                      this.setState({ submitting: false, submit_error: true });
                    }
              });
      }
    );
  };

  render() {
    return (
      <Modal
        dialogClassName="add-multi"
        show={this.props.show}
        handleClose={this.props.hide}
        organ={this.props.show &&
          this.props.ids &&
          (["LK", "RK", "HT", "SP"].includes(this.state.metadata.organ) ? true : false)}
      >
        <div className='row'>
          <div className='col-sm-12'>
            <div className='card text-center'>
              <div className='card-body scrollbar-div'>
                {this.props.show === true &&
                  (["LK", "RK", "HT", "SP"].includes(this.state.metadata.organ)) && (
                    <React.Fragment>
                      <h5 className='card-title'>Assign Lab IDs and Sample Location</h5><br />
                      {this.props.ids && (
                        <div className="form-group row">
                          <span className='col-sm-5 col-form-label text-right mod-id'>Lab Sample Id</span>
                          <React.Fragment>
                            <span className='col-sm-2 col-form-label text-right mod-reg2'>Register Location</span>
                            <span className='col-form-label text-right mod-check2'>Success</span>
                            <span className='col-form-label text-right mod-view2'>View JSON</span>
                          </React.Fragment>
                        </div>
                      )}
                      {this.props.ids &&
                        this.props.ids.map(id => (
                          <div key={id.submission_id} className='form-group row'>
                            <label className='col-sm-2 col-form-label text-right'>
                              {id.submission_id}
                            </label>
                            <div className='col-sm-3'>
                              <input
                                type='text'
                                name={id.uuid}
                                className='form-control'
                                id={id.uuid}
                                onChange={this.handleInputChange}
                                value={this.state.assigned_ids[id.uuid] || ''}
                              />
                            </div>
                            {id.update && (
                              <React.Fragment>
                                <div className="col-sm-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => this.handleAddRUILocation(id.uuid)}
                                    className="btn btn-primary"
                                  >
                                    Modify Location Information
                          </button>
                                </div>
                                {this.state.rui_click[id.uuid] && (
                                  <RUIIntegration handleJsonRUI={this.handleRUIJson}
                                    organ={this.state.metadata.organ}
                                    sex={this.state.metadata.sex}
                                    user={this.state.metadata.created_by_user_displayname}
                                    location={this.state.rui_locations[id.uuid] || ""} />
                                )}
                                <div className="col-sm-1 checkb">
                                  <img src={check}
                                    alt="check"
                                    className="check" />
                                </div>
                                <div className="col-sm-1">
                                  <button
                                    className="btn btn-link"
                                    type="button"
                                    onClick={() => this.openRUIModalHandler(id.uuid)}
                                  >
                                    View
                            </button>
                                </div>
                                {this.state.sample_name === id.uuid && (
                                  <React.Fragment>
                                    <RUIModal
                                      className="Modal"
                                      show={this.state.rui_show}
                                      handleClose={this.closeRUIModalHandler}>
                                      {this.state.rui_locations[id.uuid]}
                                    </RUIModal>
                                  </React.Fragment>
                                )}


                                <div className="col-sm-1 my-auto text-center">
                                  <span>
                                    <FontAwesomeIcon
                                      icon={faQuestionCircle}
                                      data-tip
                                      data-for="rui_tooltip"
                                    />
                                    <ReactTooltip
                                      id="rui_tooltip"
                                      place="top"
                                      type="info"
                                      effect="solid"
                                    >
                                      <p>Provide formatted location data from <br />
                              CCF Location Registration Tool for <br />
                              this sample.
                            </p>
                                    </ReactTooltip>
                                  </span>
                                </div>
                              </React.Fragment>
                            )}
                            {!id.update && (
                              <React.Fragment>
                                <div className="col-sm-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => this.handleAddRUILocation(id.uuid)}
                                    className="btn btn-primary"
                                  >
                                    Register Location
                            </button>
                                </div>
                                {this.state.rui_click[id.uuid] && (
                                  <RUIIntegration handleJsonRUI={this.handleRUIJson}
                                    organ={this.state.metadata.organ}
                                    sex={this.state.metadata.sex}
                                    user={this.state.metadata.created_by_user_displayname}
                                    location={this.state.rui_locations[id.uuid] || ""} />
                                )}
                                {this.state.rui_checks[id.uuid] &&
                                  this.state.rui_locations[id.uuid] !== "" && (
                                    <React.Fragment>
                                      <div className="col-sm-1 checkb">
                                        <img src={check}
                                          alt="check"
                                          className="check" />
                                      </div>
                                      <div className="col-sm-1">
                                        <button
                                          className="btn btn-link"
                                          type="button"
                                          onClick={() => this.openRUIModalHandler(id.uuid)}
                                        >
                                          View
                                </button>
                                      </div>
                                      <RUIModal
                                        className="Modal"
                                        show={this.state.rui_show}
                                        handleClose={this.closeRUIModalHandler}>
                                        {this.state.rui_locations[id.uuid]}
                                      </RUIModal>
                                    </React.Fragment>
                                  )}

                                {(!this.state.rui_checks[id.uuid] ||
                                  this.state.rui_locations[id.uuid] === "") && (

                                    <div className="col-sm-2 nocheckb">
                                    </div>
                                  )}
                                <div className="col-sm-1 my-auto text-center">
                                  <span>
                                    <FontAwesomeIcon
                                      icon={faQuestionCircle}
                                      data-tip
                                      data-for="rui_tooltip"
                                    />
                                    <ReactTooltip
                                      id="rui_tooltip"
                                      place="top"
                                      type="info"
                                      effect="solid"
                                    >
                                      <p>
                                        Provide formatted location data from <br />
                            CCF Location Registration Tool for <br />
                            this sample.
                            </p>
                                    </ReactTooltip>
                                  </span>
                                </div>
                              </React.Fragment>
                            )}
                          </div>
                        ))}
                    </React.Fragment>
                  )}
                {this.props.show === true &&
                  (!["LK", "RK", "HT", "SP"].includes(this.state.metadata.organ)) && (
                    <React.Fragment>
                      <h5 className='card-title'>Assign Lab IDs</h5>
                      <br />
                      <div className="form-group row">
                        <span className='col-sm-10 col-form-label text-right mod-id'>Lab Sample Id</span>
                      </div>
                      {this.props.ids &&
                        this.props.ids.map(id => (
                          <div key={id.submission_id} className='form-group row'>
                            <label className='col-sm-4 col-form-label text-right'>
                              {id.submission_id}
                            </label>
                            <div className='col-sm-6'>
                              <input
                                type='text'
                                name={id.uuid}
                                className='form-control'
                                id={id.uuid}
                                onChange={this.handleInputChange}
                                value={this.state.assigned_ids[id.uuid] || ''}
                              />
                            </div>
                          </div>
                        ))}
                    </React.Fragment>
                  )}
                {this.state.submit_error && (
                  <div className='row'>
                    <div className='col-sm-12 text-center'>
                      <p className='text-danger'>Error</p>
                    </div>
                  </div>
                )}
              </div>
              <hr />
              {this.state.success && (
                <div className='row'>
                  <div className='col-sm-12 text-center'>
                    <p className='text-success'>Lab IDs updated!</p>
                  </div>
                </div>
              )}
              <div className='form-group row'>
                <div className='col-sm-12 text-center'>
                  <button
                    className='btn btn-primary'
                    onClick={this.handleSubmit}
                    disabled={this.state.submitting}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default LabIDsModal;
