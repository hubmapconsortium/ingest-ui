import React, { Component } from "react";
import "./Home.css";



class Home extends Component {
  state = {
    show:true
  };
  

  render() {
	//const login_url = `${process.env.REACT_APP_BACKEND_URL}/login`;
    return (
      <div> 
        {/**
          <AppOptions show={this.state.show} />
        **/} 
      </div>
    );
  }
}

export default Home;