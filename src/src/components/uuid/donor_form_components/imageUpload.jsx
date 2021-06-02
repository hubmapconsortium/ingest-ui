import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faImage } from "@fortawesome/free-solid-svg-icons";
import axios from 'axios';

class ImageUpload extends Component {
  state = {
    image_file: "",
    image_file_description: "",
    image_file_name: "Choose a file",
    imageFileValid: true,
    imageFileDescriptionValid: true,
    uploadPercentage: 0,
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
      image_file: "",
      temp_file_id: ""
    });
  }

  handleImageFileChange = ({ target: { files } }) => {
    if (files[0]) {
      let file_name = files[0].name;
      this.props.onFileChange('image', this.props.id)
        .then(() => {
          if (file_name !== "") {
            this.setState({
              image_file: files[0],
              image_file_name: file_name,
              imageFileValid: true
            }, () => {
              let data = new FormData();
              data.append('file', files[0]);
              // data.append('form_id', this.props.formId);
              // data.append('file_type', 'image');

              const options = {
                headers: {
                  Authorization:
                    "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
                  //MAuthorization: "MBearer " + localStorage.getItem("info"),
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

              axios.post(`${process.env.REACT_APP_DATAINGEST_API_URL}/file-upload`, data, options)
                .then(res => {
                  console.log('handleImageFileChange', res.data)
                  this.setState({ uploadPercentage: 100 }, () => {
                    setTimeout(() => {
                      this.setState({ uploadPercentage: 0 })
                    }, 1000);
                  })
                  this.setState({
                    temp_file_id: res.data.temp_file_id
                  })
                })
            });
          }
        }).catch(() => {
          this.setState({
            image_file: files[0],
            image_file_name: file_name,
            imageFileValid: false,
            temp_file_id: ""
          });
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
    const { uploadPercentage } = this.state;
    return (
      <div className="card">
        <div className="card-body">
          <div className="row">
           {!this.props.readOnly && (
            <div className="col-sm-3">
              <h5><FontAwesomeIcon icon={faImage} /> Image {this.props.id}</h5>
            </div>
            )}
            {!this.props.readOnly && (
              <div className="col-sm-2 offset-sm-7 text-right">
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => this.props.onDelete(this.props.id)}
                  data-tip
                  data-for="remove_image_tooltip"
                >
                  <FontAwesomeIcon icon={faTimes} size="1x" />
                </button>
                 <ReactTooltip
                      id="remove_image_tooltip"
                      place="top"
                      type="info"
                      effect="solid"
                    >
                      <p>
                        Click here to remove this image
                      </p>
                    </ReactTooltip>
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
                      disabled={this.state.image_file_name !== "" &&
                                this.state.image_file_name !== "Choose a file"}
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
            </div>
            {uploadPercentage > 0 &&
              (<div className="row">
                <div className="col-sm-12 pb-5">
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
                <FontAwesomeIcon icon={faImage} size="2x" /> {this.state.image_file_name}
                <p><small>{this.state.image_file_description}</small></p>
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
