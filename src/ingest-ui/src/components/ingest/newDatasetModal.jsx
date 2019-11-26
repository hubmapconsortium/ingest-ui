import React, { Component } from "react";
import Modal from "../uuid/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUserShield
} from "@fortawesome/free-solid-svg-icons";
import HIPPA from "../uuid/HIPPA.jsx";

class NewDatasetModal extends Component {
  state = {
    //globus_directory_url_path: ""
  };

  constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
  }

  componentDidMount() {
    this.setState({
      NewDatasetShow: false
    });
  }

  hideNewDatasetModal = () => {
    this.setState({
      NewDatasetShow: false
    });
  };

  handleSearchClick = () => {
    const group = this.group.current.value;
    const sample_type = this.sampleType.current.value;
    const keywords = this.keywords.current.value;
    let params = {};
    params["group"] = group;
    if (sample_type) {
      params["specimen_type"] = sample_type;
    }
    if (keywords) {
      params["search_term"] = keywords;
    }
/*
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      },
      params: params
    };

    axios
      .get(
        `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search/`,
        config
      )
      .then(res => {
        let entities = {};
        if (this.props.parent === "dataset") {
          res.data.specimens.forEach(s => {
            if (entities[s.properties.uuid]) {
              entities[s.properties.uuid].push(s);
            } else {
              entities[s.properties.uuid] = [s];
            }
          });
        } else {
          entities = res.data.specimens;
        }
        this.setState({
          HuBMAPIDResults: Object.values(entities)
        });
      })
      .catch(error => {
        console.log(error);
      });
      */
  };

  showSibling = e => {
    // e.stopPropagation();
    // this.setState({
    //   showSibling: !this.state.showSibling
    // });
  };


  render() {
    return (
      <Modal show={this.props.show} handleClose={this.hideNewDatasetModal}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">New Dataset Created</h5>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
		              <label
		                htmlFor="dataset_name"
		                className="col-sm-4 col-form-label text-right"
		              >
		                Dataset Name 
		              </label>
                      <div className="col-sm-8 col-form-label">
		                <label name="dataset_name">{this.props.name}</label> 
		              </div>
                    
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
		              <label
		                htmlFor="globus_directory_url_path"
		                className="col-sm-4 col-form-label text-right"
		              >
		                Dataset Globus URL 
		              </label>
                      <div className="col-sm-8 col-form-label">
		                <a name="globus_directory_url_path" href={this.props.globus_directory_url_path}>Click to Upload Dataset Files</a> 
		              </div>
                    
                    </div>
                  </div>
                </div>
                <div className="row">
					<div className="alert alert-danger" role="alert">
                        <FontAwesomeIcon icon={faUserShield} /> - Do not upload any data containing any of the {" "}
	                    <span
	                      style={{ cursor: "pointer" }}
	                      className="text-primary"
	                      onClick={this.showModal}
	                    >
	                      18 identifiers specified by HIPAA
	                    </span>.
	                </div>
        			  <HIPPA show={this.state.show} handleClose={this.hideModal} />
                  </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
  
}

export default NewDatasetModal;
