import React, { Component } from "react";
import { Link } from 'react-router-dom';

class Main extends Component {
  state = {};

  render() {
    return (
      <div className="row">
        <div className="col-sm-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">HuBMAP ID System</h5>
              <p className="card-text">
                Register donors, organs and tissue
                      </p>
              <Link className="btn btn-primary"
                to="/donors-samples" onClick={this.handleEnterIngest}
              >Enter</Link>
            </div>
          </div>
        </div>
        <div className="col-sm-6">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">HuBMAP Data Ingest</h5>
              <p className="card-text">Enter and manage HuBMAP data</p>
              <Link className="btn btn-primary" to="/datasets" onClick={this.handleEnterIngest}>Enter</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Main;