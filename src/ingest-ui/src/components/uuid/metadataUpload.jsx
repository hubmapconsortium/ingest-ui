import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import axios from 'axios';

class MetadataUpload extends Component {
  state = {
    metadata_file: "",
    metadata_file_name: "Choose a file",
    metaddata_file_uuid: "",
    metadataFileValid: true,
    uploadPercentage: 0,
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element
    this.metadata_file = React.createRef();
  }

  componentDidMount() {
    this.setState({
      metadata_file_name: this.props.file_name || "Choose a file"
    });
  }

  handleMetadataFileChange = ({ target: { files } }) => {
    if (files[0]) {
      const file_name = files[0].name;
      this.props.onFileChange('metadata', this.props.id)
        .then(() => {
          if (file_name !== "") {
            this.setState({
              metadata_file: files[0],
              metadata_file_name: file_name,
              metadataFileValid: true
            }, () => {
              let data = new FormData();
              data.append('file', files[0]);
              data.append('form_id', this.props.formId);
              data.append('file_type', 'metadata');

              const options = {
                headers: {
                  Authorization:
                    "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
                  MAuthorization: "MBearer " + localStorage.getItem("info"),
                  "Content-Type": "multipart/form-data"
                },
                onUploadProgress: (progressEvent) => {
                  const { loaded, total } = progressEvent;
                  let percent = Math.floor((loaded * 100) / total);
                  if (percent < 100) {
                    this.setState({ uploadPercentage: percent })
                  }
                }
              };

              axios.post(`${process.env.REACT_APP_SPECIMEN_API_URL}/files`, data, options)
                .then(res => {
                  this.setState({ uploadPercentage: 100 }, () => {
                    setTimeout(() => {
                      this.setState({ uploadPercentage: 0 })
                    }, 1000);
                  })
                })
            });
          }
        })
        .catch(() => {
          this.setState({
            metadata_file: null,
            metadata_file_name: "",
            metadataFileValid: false
          });
        })
    }
  }

  render() {
    const { uploadPercentage } = this.state;
    return (
      <div className="card mt-3 mb-3">
        <div className="card-body">
          <div className="row">
            {!this.props.readOnly && (
              <div className="col-sm-2 offset-sm-10 text-right">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => this.props.onDelete(this.props.id)}
                >
                  <FontAwesomeIcon icon={faTimes} size="1x" />
                </button>
              </div>
            )}
          </div>
          <div className="row">
            {!this.props.readOnly && (
              <div className="col-sm-9">
                <div className="input-group mb-3">
                  <div className="custom-file">
                    <input
                      type="file"
                      className={
                        "custom-file-input " +
                        (this.state.metadataFileValid ? "" : "is-invalid")
                      }
                      name={"metadata_file_" + this.props.id}
                      id={"metadata_file_" + +this.props.id}
                      onChange={this.handleMetadataFileChange}
                      ref={this.metadata_file}
                      disabled={this.state.metadata_file_name != "" &&
                                this.state.metadata_file_name != "Choose a file"}
                    />
                    <label className="custom-file-label" htmlFor="metadata">
                      {this.state.metadata_file_name}
                    </label>
                  </div>
                </div>
              </div>
            )}
            {this.props.readOnly && (
              <div className="col-sm-9 col-form-label">
                <p>{this.state.metadata_file_name}</p>
              </div>
            )}
          </div>
          {uploadPercentage > 0 &&
            (<div className="row">
              <div className="col-sm-12">
                <div className="progress w-100">
                  <div
                    className={`progress-bar progress-bar-striped progress-bar-animated`}
                    role="progressbar"
                    aria-valuenow={uploadPercentage}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    style={{ width: `${uploadPercentage}%` }}>
                    {uploadPercentage}%
                  </div>
                </div>
              </div>
            </div>)}
          <div className="row">
            <div className="col-sm-6 offset-sm-3">
              <span className="text-danger">{this.props.error || this.state.error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MetadataUpload;
