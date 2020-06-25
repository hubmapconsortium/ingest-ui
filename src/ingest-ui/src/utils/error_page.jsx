import React from 'react';
import { Link } from 'react-router-dom';
import queryString from 'query-string'
import '../App.css';

class ErrorPage extends React.Component{
    
    state = {
	  description:null,
      details: null
    };   

    componentDidMount() {
       console.log(this.props.location.search) // '?description=""&details=""'
       let values = queryString.parse(this.props.location.search)
       console.log(values.description) // error message description
       console.log(values.details) // error message details
       this.setState({
          description: values.description,
          details: values.details
        });
    };


    render(){
      return 
		<div className="errHeader"><h3>You have encountered a HuBMAP Error:</h3>
          <div className="errBody">
         	{this.state.description}
         	{this.state.details !== null && (
             <span>: {this.state.details}</span>
		 	)} 
         	<br /><br />
            <Link to="/Home">Home </Link>
         </div>
       </div>
    }
}export default ErrorPage;