import React, { Component } from "react";
// import { Button } from 'react-bootstrap';
import history from './../history';
//import "./Home.css";

export default class Samples extends Component {
  render() {
    return (
      <div className="Samples">
        <div className="lander">
          <h1>Samples page</h1>
          <p>A simple app showing react button click navigation</p>
          <form>
            <Button variant="btn btn-success" onClick={() => history.push('/Datasets')}>Click button to view datasets</Button>
          </form>
        </div>
      </div>
    );
  }
}