import React, { Component } from "react";
import Modal from "../uuid/modal";
import axios from "axios";
import {
  BrowserRouter as Router,
  Route,
  Link
} from "react-router-dom";

class ViewCollectionModal extends React.Component {
     
  state = {
    collection: {
      uuid: "",
      label: "",
      description: ""
    },
  };

  componentDidMount() {

  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

 errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  render () {
    return ( 
	  <Modal show= {this.props.show} handleClose={this.props.hide}>
        {this.props.collection  && (
         <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title col-title">Collection Details</h5>
                  <div className="form-group row">
                    <label
                      htmlFor="name"
                      className="col-sm-3 col-form-label text-right"
                      >
                      Name:
                    </label>
				    <div className="col-sm-9 text-left">{this.props.collection.label}
				    </div>
				   </div>
				   <div className="form-group row ">
				     <label
				       htmlFor="description"
				       className="col-sm-3 col-form-label text-right"
				       >
				       Description:
				     </label>
				     <div className="col-sm-9 text-left">{this.props.collection.description}
				     </div>
				   </div>
				   <div className="form-group row ">
				     <label
				       htmlFor="datasets"
				       className="col-sm-3 col-form-label text-right"
				       >
					   Datasets in this Collection:
				     </label>
				     <div className="col-sm-9 text-left">
				     </div>
				   </div>
			  </div>
            </div>
          </div>
        </div>
        )}
      </Modal>
	 );
	
	
	
	
	
	
	
	
	
	
	
	
  }
}

export default ViewCollectionModal