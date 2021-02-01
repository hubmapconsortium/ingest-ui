import React, { Component } from "react";
import Modal from "../uuid/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
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

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.onDismiss}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">New Dataset Information has been created</h5>
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
                        htmlFor="dataset_display_id"
                        className="col-sm-4 col-form-label text-right"
                      >
                        HuBMAP Dataset DOI
                      </label>
                      <div className="col-sm-8 col-form-label">
                        <label name="dataset_display_id">{this.props.hubmap_id}</label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label
                        htmlFor="dataset_display_id"
                        className="col-sm-4 col-form-label text-right"
                      >
                        Dataset DOI
                      </label>
                      <div className="col-sm-8 col-form-label">
                        <label name="dataset_display_id">{this.props.doi}</label>
                      </div>
                    </div>
                  </div>
                </div> */}
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
                     {/* <label
                        htmlFor="globus_directory_url_path"
                        className="col-sm-4 col-form-label text-right"
                      >
                        Dataset files:
                      </label>*/}
                      <div className="col-sm-8 col-form-label">
                        <a
                          name="globus_directory_url_path"
                          href={this.props.globus_directory_url_path}
                        >
                          <h4>Click to Upload Dataset Files</h4>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="alert alert-danger" role="alert">
                    <FontAwesomeIcon icon={faUserShield} /> - Do not upload any
                    data containing any of the{" "}
                    <span
                      style={{ cursor: "pointer" }}
                      className="text-primary"
                      onClick={this.showModal}
                    >
                      18 identifiers specified by HIPAA
                    </span>
                    .
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
