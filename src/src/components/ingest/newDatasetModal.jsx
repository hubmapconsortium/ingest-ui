import React, { Component } from "react";
import Modal from "../uuid/modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserShield } from "@fortawesome/free-solid-svg-icons";
import HIPPA from "../uuid/HIPPA.jsx";
import { flexbox } from '@material-ui/system';
import Box from '@material-ui/core/Box';


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
            <div className="card text-left">
              <div className="card-body ">
                <div className="row">
                  <div className="col-6">

                    <h5 className="card-title">New Dataset Information has been created</h5>
                    <Box display="flex" justifyContent="left"  className="py-0 my-0">
                      <Box className="newdataset-name bold" >
                      <strong>Dataset Name:</strong>
                      </Box>
                      <Box className="ml-2">
                      {this.props.entity.title}
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="left" >
                      <Box className="newdataset-uuid py-0 my-0" >
                      <strong>HuBMAP Dataset DOI: </strong>
                      </Box>
                      <Box  className="ml-2">
                        {this.props.entity.hubmap_id}
                      </Box>
                    </Box>
                  </div>
                  <div className="col-6">
                  <a
                    target="_blank"
                    name="globus_directory_url_path"
                    href={this.props.globus_directory_url_path}
                  >
                    <h4>Click to Upload Dataset Files</h4>
                  </a>
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
        </div>
      </Modal>
    );
  }
}

export default NewDatasetModal;
