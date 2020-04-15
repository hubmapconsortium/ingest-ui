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
    rui_click: {name: ''} ,
	rui_check: false,
	rui_view: false,
	activate_input: true,
	rui_locations:{name: ''} ,
	sample_name: ""
  };
  
  handleRUIJson = (dataFromChild) => {
		const {rui_locations} = { ...this.state };
        const currentState = rui_locations; 
        currentState[this.state.sample_name] = dataFromChild;
        this.setState({ rui_locations: currentState });
        
        //const {rui_click} = { ...this.state };
        //const currentState = rui_click; 
        //currentState[this.state.sample_name] = false;
        //this.setState({ rui_click: currentState });

		this.setState({ 
			rui_json: dataFromChild,
			rui_check: true,
			rui_view: true,
			activate_input:true
		});
		
  };

  handleAddRUILocation = name => e => {
    const { rui_click} = { ...this.state };
    const currentState = rui_click; 
    currentState[name] = true;
    this.setState({ rui_click: currentState });
    
    this.setState({
	    activate_input:false,
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

  static getDerivedStateFromProps(props,current_state) {
	if (current_state.ids !== props.ids) {
      let assigned_ids = {};
      let rui_locations = {};
      if (props.ids) {
        props.ids.map(x => {
	      if (x.lab_tissue_id === undefined){
			assigned_ids[x.uuid] = "";
	 	  }
		  else { assigned_ids[x.uuid] = x.lab_tissue_id; }
           rui_locations[x.uuid] = "";
          return x;
        });
      }
      return { ids: props.ids, assigned_ids: assigned_ids, rui_locations: rui_locations  };
    }
    return null;
  }  

  createSampleList = () => {
	
	let labIds_locations = [];
    Object.keys(this.state.assigned_ids).map(x => { 
	  let sample = {};
	  sample["uuid"] = x;
      sample["lab_identifier"] = this.state.assigned_ids[x];
	  Object.keys(this.state.rui_locations).map(y => { 
         if (x === y) {
	        sample["rui_json"] = this.state.rui_locations[y];
         }
         return sample;
      });
      labIds_locations.push(sample);
    });
    return labIds_locations;
  };

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
        let formData = this.createSampleList();
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
                { 
				  this.state.ids &&
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
                          value={this.state.assigned_ids[id.uuid] || ''}
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
			          { this.state.rui_click[id.uuid] && (
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
                            {this.state.rui_locations[id.uuid]}  
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
