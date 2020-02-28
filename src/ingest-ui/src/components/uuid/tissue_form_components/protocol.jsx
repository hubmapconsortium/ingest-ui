import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faTimes } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
import {
  validateRequired,
  validateProtocolIODOI,
  validateFileType
} from "../../../utils/validators";
import { getFileNameOnPath } from "../../../utils/file_helper";

class Protocol extends Component {
  state = {
    protocol_doi: "",
    protocol_file: "",
    protocol_file_name: "",

    formErrors: {
      protocol_doi: "",
      protocol_file: ""
    }
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element
    this.protocol_doi = React.createRef();
    this.protocol_file = React.createRef();
  }

  componentDidMount() {
    this.setState({
      protocol_doi: this.props.protocol.protocol_doi || "",
      protocol_file_name:
        getFileNameOnPath(this.props.protocol.protocol_file) || "",
      protocol_file: ""
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.protocol !== this.props.protocol) {
      this.setState({
        protocol_doi: nextProps.protocol.protocol_doi || "",
        protocol_file_name:
          getFileNameOnPath(nextProps.protocol.protocol_file) || "",
        protocol_file: ""
      });
    }
  }

  handleProtocolDOIChange = e => {
    let value = e.target.value;
    this.setState(
      {
        protocol_doi: value
      },
      () => {
        this.validate();
      }
    );
  };

  handleProtocolFileChange = e => {
    let file = e.target.files[0];
    this.setState({ protocol_file: file }, () => {
      this.setState(
        {
          protocol_file_name: file && file.name
        },
        () => {
          this.validate();
        }
      );
    });
  };

  handleDeleteProtocolFile = () => {
    this.setState(
      {
        protocol_file_name: "",
        protocolFileKey: Date.now(),
        protocol_file: ""
      },
      () => {
        this.validate();
      }
    );
  };

  validate = () => {
    this.setState({
      formErrors: {
        protocol_doi: "",
        protocol_file: ""
      }
    });
    let isValid = true;
    if (
      !validateRequired(this.state.protocol_doi) &&
      !validateRequired(this.state.protocol_file) &&
      !validateRequired(this.state.protocol_file_name)
    ) {
      this.setState(prevState => ({
        formErrors: {
          ...prevState.formErrors,
          protocol_doi: "Required"
        }
      }));
      isValid = false;
    }
    if (
      validateRequired(this.state.protocol_doi) &&
      !validateProtocolIODOI(this.state.protocol_doi)
    ) {
      this.setState(prevState => ({
        formErrors: {
          ...prevState.formErrors,
          protocol_doi: "Please enter a valid protocols.io DOI"
        }
      }));
      isValid = false;
    }
    if (
      this.state.protocol_file &&
      !validateFileType(this.state.protocol_file.type, [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/pdf"
      ])
    ) {
      this.setState(prevState => ({
        formErrors: {
          ...prevState.formErrors,
          protocol_file: "Allowed file types: .doc, .docx, or .pdf"
        }
      }));
      isValid = false;
    }

    return isValid;
  };

  errorClass(error) {
    return error.length === 0 ? "" : "is-invalid";
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-2">
          <h4 className="mt-3 mb-3">Protocol {this.props.id}</h4>
        </div>
        <div className="col-sm-9">
          <div className="card mt-3 mb-3">
            <div className="card-body">
              <div className="row">
                {this.props.id > 1 &&
                  (!this.props.readOnly && (
                    <div className="col-sm-2 offset-sm-10 text-right">
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => this.props.remove(this.props.id)}
                      >
                        <FontAwesomeIcon icon={faTimes} size="1x" />
                      </button>
                    </div>
                  ))}
              </div>
              <div className="row">
                <div className="col-sm-12">
                  <div className="form-group row">
                    <label
                      htmlFor="protocol"
                      className="col-sm-3 col-form-label text-right"
                    >
                      protocols.io DOI <span className="text-danger">*</span>
                    </label>
                    {!this.props.readOnly && (
                      <div className="col-sm-8">
                        <input
                          type="text"
                          name="protocol"
                          id="protocol"
                          className={
                            "form-control " +
                            this.errorClass(this.state.formErrors.protocol_doi)
                          }
                          placeholder="protocols.io DOI"
                          ref={this.protocol_doi}
                          onChange={this.handleProtocolDOIChange}
                          value={this.state.protocol_doi}
                        />
                        {this.state.formErrors.protocol_doi &&
                          this.state.formErrors.protocol_doi !== "required" && (
                            <div className="invalid-feedback">
                              {this.state.formErrors.protocol_doi}
                            </div>
                          )}
                      </div>
                    )}
                    {this.props.readOnly && (
                      <div className="col-sm-8 col-form-label">
                        <p>{this.state.protocol_doi}</p>
                      </div>
                    )}
                    
                  </div>
                  <div className="form-group row">
                    <label
                      htmlFor="protocol_file"
                      className="col-sm-3 col-form-label text-right"
                    >
                      Protocol document <span className="text-danger">*</span>
                    </label>
                    {!this.props.readOnly && (
                      <React.Fragment>
                        <div className="col-sm-6">
                          <div className="custom-file">
                            <input
                              type="file"
                              name="protocol_file"
                              className={
                                "custom-file-input " +
                                this.errorClass(
                                  this.state.formErrors.protocol_file
                                )
                              }
                              key={this.protocolFileKey}
                              id="protocol_file"
                              onChange={this.handleProtocolFileChange}
                              ref={this.protocol_file}
                              accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                            />
                            <label
                              className="custom-file-label"
                              htmlFor="protocol_file"
                            >
                              {(() => {
                                if (this.state.protocol_file_name === "")
                                  return "Choose a file";
                                else return this.state.protocol_file_name;
                              })()}
                            </label>
                            {this.state.formErrors.protocol_file &&
                              this.state.formErrors.protocol_file !==
                                "required" && (
                                <div className="invalid-feedback">
                                  {this.state.formErrors.protocol_file}
                                </div>
                              )}
                          </div>
                          <small
                            id="protocol_file_help"
                            className="form-text text-muted"
                          >
                            doc, docx and pdf files only
                          </small>
                        </div>
                        <div className="col-sm-2">
                          {this.state.protocol_file_name &&
                            this.state.protocol_file_name !==
                              "Choose a file" && (
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={this.handleDeleteProtocolFile}
                              >
                                <FontAwesomeIcon
                                  className="inline-icon"
                                  icon={faTimes}
                                />
                                Delete
                              </button>
                            )}
                        </div>
                      </React.Fragment>
                    )}
                    {this.props.readOnly && (
                      <div className="col-sm-8 col-form-label">
                        <p>{this.state.protocol_file_name}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
			  
              <div className="row">
                <div className="col-sm-6 offset-sm-3">
                  <span className="text-danger">{this.props.error}</span>
                </div>
              </div>
            </div>
          </div>
		 
        </div>
		<div className="protocol-quest col-sm-1 my-auto text-center">
		  <FontAwesomeIcon
			icon={faQuestionCircle}
			data-tip
			data-for="protocol_tooltip"
		  />
		  <ReactTooltip
			id="protocol_tooltip"
			place="top"
			type="info"
			effect="solid"
		  >
			<h4>
			  The protocol used when creating the specimen. <br />
			  This can be in the form of a protocols.io DOI, <br />
			  an uploaded document or free text typed into the form.
			</h4>
		  </ReactTooltip>
		</div>
      </div>
    );
  }
}

export default Protocol;
