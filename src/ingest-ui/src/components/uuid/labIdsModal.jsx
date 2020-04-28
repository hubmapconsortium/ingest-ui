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
    rui_checks: {name: ''} ,
    rui_view: false,
    activate_input: true,
    rui_locations:{name: ''} ,
    sample_name: ""
  };

  handleRUIJson = dataFromChild => {
		const {rui_locations} = { ...this.state };
        const currentState = rui_locations; 
        currentState[this.state.sample_name] = dataFromChild;
        this.setState({ rui_locations: currentState });

		const {rui_checks} = { ...this.state };
        const curState = rui_checks; 
        curState[this.state.sample_name] = true;
        this.setState({ rui_checks: curState });
        
        //const {rui_click} = { ...this.state };
        //const currentState = rui_click; 
        //currentState[this.state.sample_name] = false;
        //this.setState({ rui_click: currentState });

		this.setState({ 
			rui_json: dataFromChild,
			rui_view: true,
			activate_input:true
		});
  };

  handleAddRUILocation = name => {
    const { rui_click} = { ...this.state };
    const currentState = rui_click; 
    currentState[name] = true;
    this.setState({ rui_click: currentState });

    const { rui_checks} = { ...this.state };
    const curState = rui_checks; 
    curState[name] = false;
    this.setState({ rui_checks: curState });
    
    this.setState({
	    activate_input:false,
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

  static getDerivedStateFromProps(props,current_state) {
	if (current_state.ids !== props.ids) {
      let assigned_ids = {};
      let rui_locations = {};
	  let rui_checks = {};
	      if (props.ids) {
	        props.ids.map(x => {
		      if (x.lab_tissue_id === undefined){
				assigned_ids[x.uuid] = "";
		 	  }
			  else { assigned_ids[x.uuid] = x.lab_tissue_id; }
	          if (x.rui_location === undefined){
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
	let labIds_locations = [];
    Object.keys(this.state.assigned_ids).map(x => { 
      let sample = {};
      sample["uuid"] = x;
      sample["lab_identifier"] = this.state.assigned_ids[x];
      Object.keys(this.state.rui_locations).map(y => { 
        if (x === y) {
          sample["rui_location"] = this.state.rui_locations[y];
        }
        return sample;
      });
      labIds_locations.push(sample);
      return;
    });
    return labIds_locations;
  };

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

  render() {
    return (
      <Modal
        dialogClassName="add-multi"
        show={this.props.show}
        handleClose={this.props.hide}
        organ={this.props.show &&  
	           this.props.ids && 
               (this.props.organ === "LK" || this.props.organ === "RK"? true : false)}
      >
      <div className='row'>
        <div className='col-sm-12'>
          <div className='card text-center'>
            <div className='card-body scrollbar-div'>
             {this.props.show === true && 
              (this.props.organ === "LK"||
			   this.props.organ === "RK") && (
                <React.Fragment>
                <h5 className='card-title'>Assign Lab IDs and Sample Location</h5><br />
                {this.state.ids && (
	              <div className="form-group row">
				    <span className='col-sm-5 col-form-label text-right mod-id'>Lab Sample Id</span>
                    {this.state.ids.some(e => e.update === true) && (
					  <React.Fragment>
			            <span className='col-sm-1 col-form-label text-right mod-view1'>View JSON</span>
					    <span className='col-sm-1 col-form-label text-right mod-check1'>Success</span>
					    <span className='col-sm-2 col-form-label text-right mod-reg1'>Register Location</span>
					  </React.Fragment>
                    )}
					{this.state.ids.some(e => e.update === undefined) && (
					  <React.Fragment>
				        <span className='col-sm-2 col-form-label text-right mod-reg2'>Register Location</span>
					    <span className='col-form-label text-right mod-check2'>Success</span>
			            <span className='col-form-label text-right mod-view2'>View JSON</span>
					  </React.Fragment>
                    )}
				    </div>
		          )}
				  { this.state.ids &&
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
                            onChange={this.handleInputChange}
                            value={this.state.assigned_ids[id.uuid] || ''}
                          />
                        </div>
                        {id.update && (
	                      <React.Fragment>
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
						    <div className="col-sm-1 checkb">
						      <img src={check} 
							     alt="check"
							     className="check"/>
						   </div>
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
					         <React.Fragment>
					           <RUIIntegration handleJsonRUI={this.handleRUIJson} />
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
							   <h4>Provide formatted location data from <br />
								   CCF Location Registration Tool for <br />
								   this sample. 
							   </h4>
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
	                       <React.Fragment>
				               <RUIIntegration handleJsonRUI={this.handleRUIJson} />
						   </React.Fragment>
				         )}
					     {this.state.rui_checks[id.uuid] && 
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
					     {!this.state.rui_checks[id.uuid] && (
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
	                   </React.Fragment>
				     )}
                   </div>
                 ))}
			     </React.Fragment>
               )}
			   {this.props.show === true &&
				 (this.props.organ !== "LK" &&
				  this.props.organ !== "RK") && (
				    <React.Fragment>
					<h5 className='card-title'>Assign Lab IDs</h5>
					<br />
					<div className="form-group row">
				      <span className='col-sm-10 col-form-label text-right mod-id'>Lab Sample Id</span> 
                    </div> 
					
			      {this.state.ids &&
                   this.state.ids.map(id => ( 
                       <div key={id.hubmap_identifier} className='form-group row'>
                         <label className='col-sm-4 col-form-label text-right'>
                            {id.hubmap_identifier}
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
 