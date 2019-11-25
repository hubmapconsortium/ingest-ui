import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

class ImageUpload extends Component {
  state = {
    image_file: "",
    image_file_description: "",
    image_file_name: "Choose a file",
    imageFileValid: true,
    imageFileDescriptionValid: true
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element
    this.image_file = React.createRef();
    this.image_file_description = React.createRef();
  }

  componentDidMount() {
    this.setState({
      image_file_name: this.props.file_name || "Choose a file",
      image_file_description: this.props.description || "",
      image_file: ""
    });
  }

  handleImageFileChange = e => {
    let arr = e.target.value.split("\\");
    let file_name = arr[arr.length - 1];
    if (file_name !== "") {
      this.setState({
        image_file: e.target.value,
        image_file_name: file_name,
        imageFileValid: true
      });
    } else {
      this.setState({
        image_file: e.target.value,
        image_file_name: file_name,
        imageFileValid: false
      });
    }
  };

  handleImageFileDescriptionChange = e => {
    let value = e.target.value;
    if (value.trim() !== "") {
      this.setState({
        image_file_description: value,
        imageFileDescriptionValid: true
      });
    } else {
      this.setState({
        image_file_description: value,
        imageFileDescriptionValid: false
      });
    }
  };

  validate = () => {
    if (this.state.image_file === "") {
      this.setState({
        imageFileValid: false
      });
    }
    if (this.state.image_file_description === "") {
      this.setState({
        imageFileDescriptionValid: false
      });
    }
  };

  render() {
    return (
      <div className="card mt-3 mb-3">
        <div className="card-body">
          <div className="row">
            <div className="col-sm-3">
              <h4>Image {this.props.id}</h4>
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
                        (this.state.imageFileValid ? "" : "is-invalid")
                      }
                      name={"image_file_" + this.props.id}
                      id={"image_file_" + +this.props.id}
                      onChange={this.handleImageFileChange}
                      ref={this.image_file}
                    />
                    <label className="custom-file-label" htmlFor="metadata">
                      {this.state.image_file_name}
                    </label>
                  </div>
                </div>
              </div>
            )}
            {this.props.readOnly && (
              <div className="col-sm-9 col-form-label">
                <p>{this.state.image_file_name}</p>
              </div>
            )}
            {!this.props.readOnly && (
              <div className="col-sm-12">
                <textarea
                  type="text"
                  cols="30"
                  rows="5"
                  name={"image_file_description_" + this.props.id}
                  id={"image_file_description_" + this.props.id}
                  className={
                    "form-control " +
                    (this.state.imageFileDescriptionValid ? "" : "is-invalid")
                  }
                  placeholder="Image description"
                  onChange={this.handleImageFileDescriptionChange}
                  ref={this.image_file_description}
                  value={this.state.image_file_description}
                />
              </div>
            )}
            {this.props.readOnly && (
              <div className="col-sm-9 col-form-label">
                <p>{this.state.image_file_description}</p>
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

export default ImageUpload;
