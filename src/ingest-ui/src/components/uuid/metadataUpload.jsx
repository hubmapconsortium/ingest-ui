import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

class MetadataUpload extends Component {
  state = {
    metadata_file: "",
    metadata_file_name: "Choose a file",
    metadataFileValid: true
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

  handleMetadataFileChange = e => {
    let arr = e.target.value.split("\\");
    let file_name = arr[arr.length - 1];
    if (file_name !== "") {
      this.setState({
        metadata_file: e.target.value,
        metadata_file_name: file_name,
        metadataFileValid: true
      });
    } else {
      this.setState({
        metadata_file: e.target.value,
        metadata_file_name: file_name,
        metadataFileValid: false
      });
    }
  };

  validate = () => {
    if (this.state.metadata_file === "") {
      this.setState({
        metadataFileValid: false
      });
    }
  };

  render() {
    return (
      <div className="card mt-3 mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-sm-3">
              <h4>Metadata {this.props.id}</h4>
            </div>
            {!this.props.readOnly && (
              <div className="col-sm-2 offset-sm-7 text-right">
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
          <div className="form-group row">
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
          <div className="row">
            <div className="col-sm-6 offset-sm-3">
              <span className="text-danger">{this.props.error}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default MetadataUpload;
