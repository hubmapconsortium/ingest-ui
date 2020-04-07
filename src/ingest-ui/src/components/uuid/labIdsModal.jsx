import React, { Component }from "react";
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

class LabIDsModal extends Component {
  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   this.setState({ ids: nextProps.ids });
  // }
  state = {
    rui_json: "",
	rui_check: false,
	rui_view: false,
	rui_location:"",
	ruiDataFromRUIIntegration: null,
	sample_name: ""
  };
  
  handleRUIJson = (dataFromChild) => {
        this.setState({ ruiDataFromRUIIntegration: dataFromChild });
  };

  handleAddRUILocation = name => e => {
	let text = {"alignment_id": "d34aea60-7a1c-4625-88ef-00946dda783f",
					"alignment_operator_first_name": "Rebecca",
					"alignment_operator_last_name": "Boes",
					"alignment_datetime": "3/16/2020 9:25:38 AM",
					"reference_organ_id": "uuid-1234-5678",
					"tissue_position_vertices": [],
					"tissue_position_mass_point": {
						"x": 22.610000610351564,
						"y": 49.72999954223633,
						"z": 16.299999237060548
					},
					"tissue_object_rotation": {
						"x": 0.0,
						"y": 0.0,
						"z": 0.0
					},
					"tissue_object_size": {
						"x": 10.0,
						"y": 10.0,
						"z": 10.0
					}
				};
	
    this.setState(prevState => {
      let rui_locations = Object.assign({}, prevState.rui_locations);
       rui_locations[name] = text;
       return { rui_locations };
    });
    
    this.setState({
		rui_check: true,
		rui_json: text,
		rui_view:true,
		rui_json: this.ruiDataFromRUIIntegration,
		sample_name: name
	});
  };

  openRUIModalHandler = name => () => {
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
  
  handleClose = e => {
	  this.setState({
            rui_show: false     
        });
  }

  static getDerivedStateFromProps(props,current_state) {
	if (current_state.ids !== props.ids) {
      let assigned_ids = {};
      let rui_locations = {};
      if (props.ids) {
        props.ids.map(x => {
          assigned_ids[x.uuid] = x.lab_tissue_id;
          rui_locations[x.uuid] = "";
          return x;
        });
      }
      return { ids: props.ids, assigned_ids: assigned_ids, rui_locations: rui_locations };
    }
    return null;
  }  

  handleInputChange = e => {
    const { name, value } = e.target;
    this.setState(prevState => {
      let assigned_ids = Object.assign({}, prevState.assigned_ids);
      assigned_ids[name] = value;
      return { assigned_ids };
    });
  };

  handleSubmit = () => {
    this.setState(
      {
        submitting: true,
        success: false
      },
      () => {
        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            MAuthorization: "MBearer " + localStorage.getItem("info"),
            "Content-Type": "application/json"
          }
        };
        let formData = this.state.assigned_ids;
        axios
          .put(
            `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens`,
            formData,
            config
          )
          .then(res => {
            this.setState(
              {
                submitting: false,
                success: true
              }
            ,() => {
              this.props.hide();
              // this.props.update(formData);
            });
          })
          .catch(error => {
            this.setState({ submitting: false, submit_error: true });
          });
      }
    );
  };

    static newMethod() {
        return {};
    }

  render() {
    return (
      <Modal
        dialogClassName="add-multi"
        show={this.props.show}
        handleClose={this.props.hide}
      >
        <div className='row'>
          <div className='col-sm-12'>
            <div className='card text-center'>
              <div className='card-body scrollbar-div'>
                <h5 className='card-title'>Assign Lab IDs and Sample Location</h5><br />
                {this.state.ids &&
                  this.state.ids.map(id => (
                    <div key={id.hubmap_identifier} className='form-group row'>
                      <label className='col-sm-2 col-form-label text-right'>
                        {id.hubmap_identifier}
                      </label>
                      <div className='col-sm-3'>
                        <input
                          type='text'
                          name={id.uuid}
                          className='form-control'
                          id={id.uuid}
                          value={this.state.assigned_ids[id.uuid]}
						  onChange={this.handleInputChange}
                        />
                      </div>
					  <div className="col-sm-2 text-center">
						<button
						  type="button"		
						  onClick={this.handleAddRUILocation(id.uuid)}
						  className="btn btn-primary"
						>
						  Register Location
						</button>
					  </div>
			          { this.state.rui_click && (
				         <RUIIntegration  jsonRUI = {this.handleRUIJson} />
				      )}
					  
					  { this.state.rui_check && 
						this.state.rui_locations[id.uuid] !== "" && (
					    <React.Fragment>
						<div className="col-sm-1 checkb">
						  <img src={check} 
							   alt="check"
							   className="check"/>
						</div>
						<div className="col-sm-1">
						   <button
							 className="btn btn-link"
							 type="button"
							 onClick={this.openRUIModalHandler(id.uuid)}
						   >
						   View 
						   </button>
						 </div>
					     <RUIModal
                            className="Modal"
                            show={this.state.rui_show}
                            handleClose={this.closeRUIModalHandler}> 
                            {JSON.stringify(this.state.rui_json, null, "   ")}  
                         </RUIModal>
						 </React.Fragment>
					  )}
					  { !this.state.rui_check && (
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
							  <h4>
							   Provide formatted location data from <br />
							   CCF Location Registration Tool for <br />
							   this sample. 
							  </h4>
							</ReactTooltip>
						  </span>
					    </div>
                  </div>
                ))}
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
