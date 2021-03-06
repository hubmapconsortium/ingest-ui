import React, { Component } from "react";
import { Link } from 'react-router-dom';
import '../App.css';

class Main extends Component {
  state = {};

  render() {
    return (
     
      <div className="row portal-jss40 sc-fzoydu ctZjfV portal-jss46">
      <h2 className="portal-jss114 sc-fzoYHE PUpWM portal-jss122">What is the HuBMAP Data Ingest Portal?</h2>
       <p className="portal-jss116">
            The HuBMAP Data Ingest Portal is the central resource for registering, 
            managing and ingesting data generated by the consortium. A standardized 
            data curation and processing workflow ensure that only high quality is released.
      </p>
  
      
        <div className="col">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title"><svg className="portal-jss64 sc-fzqNJr cPhlSY portal-jss65" width="36px" height="36px" focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z"></path></svg> Register donors and samples
        </h5>
              <p className="card-text portal-jss116">
                      Register/manage information for donors and samples</p> 
              <Link className="btn btn-primary"
                to="/donors-samples" onClick={this.handleEnterIngest}
              >Go</Link>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title"><svg className="portal-jss64 sc-fzoLag gqDFwO portal-jss65" width="36px" height="36px" focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation">
              <path d="M10 10.02h5V21h-5V10.02zM17 21h3c1.1 0 2-.9 2-2v-9h-5v11zm3-18H5c-1.1 0-2 .9-2 2v3h19V5c0-1.1-.9-2-2-2zM3 19c0 1.1.9 2 2 2h3V10H3v9z"></path></svg> Dataset submission</h5>
              <p className="card-text portal-jss116">Ingest datasets for the associated donors or samples</p>
              <Link className="btn btn-primary" to="/datasets" onClick={this.handleEnterIngest}>Go</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default Main;