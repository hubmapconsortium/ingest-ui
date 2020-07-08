import React, { Component }from 'react';
import '../App.css';
import Login from "../components/uuid/login";
import axios from "axios";

export default class AppOptions extends Component {
  
  state = {
    
  };


//Display the final output
  render() {
    return (
	  <div className="appopts">
      {this.props.show === true && (
		  <div className="row">
                <div className="col-sm-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">HuBMAP ID System</h5>
                      <p className="card-text">
                        Register donors, organs and tissue
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={this.handleEnterUUID}
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">HuBMAP Data Ingest</h5>
                      <p className="card-text">Enter and manage HuBMAP data</p>
                      <button
                        className="btn btn-primary"
                        onClick={this.handleEnterIngest}
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">HuBMAP Data Collections</h5>
                      <p className="card-text">View HuBMAP collections</p>
                      <button
                        className="btn btn-primary"
                        onClick={this.handleEnterCollection}
                      >
                        Enter
                      </button>
                    </div>
                  </div>
                </div>
			  </div>
			)}
      </div>
    );
  }
}