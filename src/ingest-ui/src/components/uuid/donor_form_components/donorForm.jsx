import React, { Component } from "react";
import axios from "axios";
import ImageUpload from "./imageUpload";
import MetadataUpload from "../metadataUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faPlus,
  faUserShield,
  faSpinner,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { truncateString } from "../../../utils/string_helper";
import { getFileNameOnPath, getFileMIMEType } from "../../../utils/file_helper";
import {
  validateRequired,
  validateProtocolIODOI,
  validateFileType
} from "../../../utils/validators";
import ReactTooltip from "react-tooltip";
import HIPPA from "../HIPPA";
import GroupModal from "../groupModal";

class DonorForm extends Component {
  state = {
    visit: "",
    lab: "",
    lab_donor_id: "",
    identifying_name: "",
    protocol: "",
    protocol_file: "",
    description: "",
    metadata_file: "",

    images: [],
    metadatas: [],
    protocol_file_name: "Choose a file",
    metadata_file_name: "Choose a file",

    groups: [],
    selected_group: null,

    formErrors: {
      visit: "",
      lab: "",
      lab_donor_id: "",
      identifying_name: "",
      protocol: "",
      protocol_file: "",
      description: "",
      metadata_file: ""
    },

    show: false
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element
    this.protocolFile = React.createRef();
    this.protocol = React.createRef();
  }

  UNSAFE_componentWillMount() {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json"
      }
    };

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then(res => {
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        this.setState({
          groups: groups
        });
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    if (this.props.editingEntity) {
      const pf = this.props.editingEntity.properties.protocol_file;
      const mf = this.props.editingEntity.properties.metadata_file;
      let images = [];
      let metadatas = [];
      try {
        images = JSON.parse(
          this.props.editingEntity.properties.image_file_metadata
            .replace(/\\/g, "\\\\")
            .replace(/'/g, '"')
        );
        metadatas = JSON.parse(
          this.props.editingEntity.properties.metadatas
            .replace(/\\/g, "\\\\")
            .replace(/'/g, '"')
        );
      } catch (e) {}
      this.setState({
        author: this.props.editingEntity.properties.provenance_user_email,
        visit: this.props.editingEntity.properties.visit,
        lab_donor_id: this.props.editingEntity.properties.lab_donor_id,
        identifying_name: this.props.editingEntity.properties.label,
        protocol: this.props.editingEntity.properties.protocol,
        protocol_file_name: pf && getFileNameOnPath(pf),
        description: this.props.editingEntity.properties.description,
        metadata_file_name: mf && getFileNameOnPath(mf)
      });

      const image_list = [];
      const metadata_list = [];
      images.forEach((image, index) => {
        image_list.push({
          id: index + 1,
          ref: React.createRef(),
          file_name: getFileNameOnPath(image.filepath),
          description: image.description
        });
      });
      metadatas.forEach((metadata, index) => {
        metadata_list.push({
          id: index + 1,
          ref: React.createRef(),
          file_name: getFileNameOnPath(metadata.filepath)
        });
      });

      this.setState({ images: image_list, metadatas: metadata_list });
    }
  }

  handleProtocolFileChange = e => {
    let arr = e.target.value.split("\\");
    let file_name = arr[arr.length - 1];
    this.setState({
      protocol_file_name: file_name
    });
  };

  handleMetadataFileChange = e => {
    let arr = e.target.value.split("\\");
    let file_name = arr[arr.length - 1];
    this.setState({
      metadata_file_name: file_name
    });
  };

  handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "lab":
        this.setState({ lab: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab: "required" }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab: "" }
          }));
        }
        break;
      case "lab_donor_id":
        this.setState({ lab_donor_id: value });
        break;
      case "identifying_name":
        this.setState({ identifying_name: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              identifying_name: "required"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, identifying_name: "" }
          }));
        }
        break;
      case "protocol":
        this.setState({ protocol: value });
        if (
          !validateRequired(value) &&
          !validateRequired(this.protocolFile.current.value) &&
          !validateRequired(this.state.protocol_file_name)
        ) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol: "required"
            }
          }));
        } else if (!validateProtocolIODOI(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol: "Please enter a valid protocols.io DOI"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol: ""
            }
          }));
        }
        break;
      case "protocol_file":
        this.setState({ protocol_file: e.target.files[0] });
        this.setState({
          protocol_file_name: e.target.files[0] && e.target.files[0].name
        });
        if (
          !validateRequired(value) &&
          !validateRequired(this.protocol.current.value)
        ) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_file: "required",
              protocol: "required"
            }
          }));
        } else if (e.target.files[0]) {
          if (
            !validateFileType(e.target.files[0].type, [
              "application/msword",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              "application/pdf"
            ])
          ) {
            this.setState(prevState => ({
              formErrors: {
                ...prevState.formErrors,
                protocol_file: "Allowed file types: .doc, .docx, or .pdf",
                protocol: ""
              }
            }));
          } else {
            this.setState(prevState => ({
              formErrors: {
                ...prevState.formErrors,
                protocol_file: "",
                protocol: ""
              }
            }));
          }
        } else {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_file: "",
              protocol: ""
            }
          }));
        }
        break;
      case "description":
        this.setState({ description: value });
        break;
      case "metadata_file":
        this.setState({ metadata_file: e.target.files[0] });
        this.setState({
          metadata_file_name: e.target.files[0] && e.target.files[0].name
        });
        break;
      case "visit":
        this.setState({ visit: value });
        break;
      case "groups":
        this.setState({
          selected_group: value
        });
        break;
      default:
        break;
    }
  };

  handleDeleteProtocolFile = () => {
    this.setState({
      protocol_file_name: "Choose a file",
      protocolFileKey: Date.now(),
      protocol_file: ""
    });
  };

  handleDeleteMetadataFile = () => {
    this.setState({
      metadata_file_name: "Choose a file",
      metadataFileKey: Date.now(),
      metadata_file: ""
    });
  };

  handleAddImage = () => {
    let newId = 1;
    if (this.state.images.length > 0) {
      newId = this.state.images[this.state.images.length - 1].id + 1;
    }
    this.setState({
      images: [...this.state.images, { id: newId, ref: React.createRef() }]
    });
  };

  handleAddMetadata = () => {
    let newId = 1;
    if (this.state.metadatas.length > 0) {
      newId = this.state.metadatas[this.state.metadatas.length - 1].id + 1;
    }
    this.setState({
      metadatas: [
        ...this.state.metadatas,
        { id: newId, ref: React.createRef() }
      ]
    });
  };

  handleDeleteImage = imageId => {
    const images = this.state.images.filter(i => i.id !== imageId);
    this.setState({
      images
    });
  };

  handleDeleteMetadata = metadataId => {
    const metadatas = this.state.metadatas.filter(i => i.id !== metadataId);
    this.setState({
      metadatas
    });
  };

  handleSubmit = e => {
    e.preventDefault();
    if (this.isFormValid()) {
      if (
        !this.props.editingEntity &&
        this.state.groups.length > 1 &&
        !this.state.GroupSelectShow
      ) {
        this.setState({ GroupSelectShow: true });
      } else {
        this.setState({
          GroupSelectShow: false,
          submitting: true
        });
        let data = {
          entitytype: "Donor",
          lab_donor_id: this.state.lab_donor_id,
          label: this.state.identifying_name,
          protocol: this.state.protocol,
          visit: this.state.visit,
          protocol_file:
            this.state.protocol_file_name === "Choose a file"
              ? ""
              : this.state.protocol_file_name,
          description: this.state.description,
          metadata_file:
            this.state.metadata_file_name === "Choose a file"
              ? ""
              : this.state.metadata_file_name,
          images: [],
          metadatas: []
        };
        if (this.state.selected_group) {
          data["user_group_uuid"] = this.state.selected_group;
        }

        var formData = new FormData();
        formData.append("protocol_file", this.state.protocol_file);
        formData.append("metadata_file", this.state.metadata_file);
        this.state.metadatas.forEach(i => {
          if (i.ref.current.metadata_file.current.files[0]) {
            data.metadatas.push({
              id: "metadata_" + i.id,
              file_name: i.ref.current.metadata_file.current.files[0].name
            });
            formData.append(
              "metadata_" + i.id,
              i.ref.current.metadata_file.current.files[0]
            );
          } else {
            data.metadatas.push({
              id: "metadata_" + i.id,
              file_name: i.file_name
            });
          }
        });
        this.state.images.forEach(i => {
          if (i.ref.current.image_file.current.files[0]) {
            data.images.push({
              id: "image_" + i.id,
              file_name: i.ref.current.image_file.current.files[0].name,
              description: i.ref.current.image_file_description.current.value.replace(
                /"/g,
                '\\"'
              )
            });
            formData.append(
              "image_" + i.id,
              i.ref.current.image_file.current.files[0]
            );
          } else {
            data.images.push({
              id: "image_" + i.id,
              file_name: i.file_name,
              description: i.ref.current.image_file_description.current.value.replace(
                /"/g,
                '\\"'
              )
            });
          }
        });
        formData.append("data", JSON.stringify(data));

        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            MAuthorization: "MBearer " + localStorage.getItem("info"),
            "Content-Type": "multipart/form-data"
          }
        };

        if (this.props.editingEntity) {
          axios
            .put(
              `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${this.props.editingEntity.uuid}`,
              formData,
              config
            )
            .then(res => {
              this.props.onUpdated(res.data);
            })
            .catch(error => {
              this.setState({ submit_error: true, submitting: false });
            });
        } else {
          axios
            .post(
              `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens`,
              formData,
              config
            )
            .then(res => {
              this.props.onCreated(res.data);
            })
            .catch(error => {
              this.setState({ submit_error: true, submitting: false });
            });
        }
      }
    }
  };

  errorClass(error) {
    return error.length === 0 ? "" : "is-invalid";
  }

  renderButtons() {
    if (this.props.editingEntity) {
      if (this.props.readOnly) {
        return (
          <div className="row">
            <div className="col-sm-4 offset-sm-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.props.handleCancel()}
              >
                Back
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="row">
            <div className="col-sm-4 offset-sm-3 text-center">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={this.state.submitting}
              >
                {this.state.submitting && (
                  <FontAwesomeIcon
                    className="inline-icon"
                    icon={faSpinner}
                    spin
                  />
                )}
                {!this.state.submitting && "Update"}
              </button>
            </div>
            <div className="col-sm-4">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.props.handleCancel()}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      }
    } else {
      return (
        <div className="row">
          <div className="col-sm-4 offset-sm-3 text-center">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={this.state.submitting}
            >
              {this.state.submitting && (
                <FontAwesomeIcon
                  className="inline-icon"
                  icon={faSpinner}
                  spin
                />
              )}
              {!this.state.submitting && "Generate ID"}
            </button>
          </div>
          <div className="col-sm-4">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => this.props.handleCancel()}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
  }

  isFormValid() {
    let isValid = true;
    if (!validateRequired(this.state.identifying_name)) {
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, identifying_name: "required" }
      }));
      isValid = false;
    } else {
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, identifying_name: "" }
      }));
    }
    if (
      !(
        (validateRequired(this.state.protocol) ||
          validateRequired(this.state.protocol_file) ||
          validateRequired(
            this.state.protocol_file_name === "Choose a file"
              ? ""
              : this.state.protocol_file_name
          )) &&
        validateProtocolIODOI(this.state.protocol) &&
        validateFileType(this.state.protocol_file.type, [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/pdf"
        ]) &&
        validateFileType(getFileMIMEType(this.state.protocol_file_name), [
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/pdf"
        ])
      )
    ) {
      if (
        !validateRequired(this.state.protocol_file) &&
        !validateRequired(this.state.protocol) &&
        !validateRequired(
          this.state.protocol_file_name === "Choose a file"
            ? ""
            : this.state.protocol_file_name
        )
      ) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, protocol: "required" }
        }));
        isValid = false;
      } else {
        if (!validateProtocolIODOI(this.state.protocol)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol: "Please enter a valid protocols.io DOI"
            }
          }));
          isValid = false;
        }
        if (
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
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, protocol_file: "" }
          }));
        }
        if (
          !validateFileType(getFileMIMEType(this.state.protocol_file_name), [
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
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, protocol_file: "" }
          }));
        }
      }
    }

    if (!this.props.editingEntity) {
      // Creating Donor
      this.state.images.forEach((image, index) => {
        if (!validateRequired(image.ref.current.image_file.current.value)) {
          isValid = false;
          image.ref.current.validate();
        }
        if (
          !validateRequired(
            image.ref.current.image_file_description.current.value
          )
        ) {
          isValid = false;
          image.ref.current.validate();
        }
      });
    }

    const usedFileName = new Set();
    this.state.images.forEach((image, index) => {
      usedFileName.add(image.file_name);

      if (image.ref.current.image_file.current.files[0]) {
        if (
          usedFileName.has(image.ref.current.image_file.current.files[0].name)
        ) {
          image["error"] = "Duplicated file name is not allowed.";
          isValid = false;
        }
      }
    });

    if (!this.props.editingEntity) {
      // Creating Donor
      this.state.metadatas.forEach((metadata, index) => {
        if (
          !validateRequired(metadata.ref.current.metadata_file.current.value)
        ) {
          isValid = false;
          metadata.ref.current.validate();
        }
      });
    }

    this.state.metadatas.forEach((metadata, index) => {
      usedFileName.add(metadata.file_name);

      if (metadata.ref.current.metadata_file.current.files[0]) {
        if (
          usedFileName.has(
            metadata.ref.current.metadata_file.current.files[0].name
          )
        ) {
          metadata["error"] = "Duplicated file name is not allowed.";
          isValid = false;
        }
      }
    });

    return isValid;
  }

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  hideGroupSelectModal = () => {
    this.setState({
      GroupSelectShow: false
    });
  };

  render() {
    return (
      <React.Fragment>
        {!this.props.editingEntity && (
          <div className="row">
            <div className="col-sm-12 text-center">
              <h4>Registering a HuBMAP Donor</h4>
            </div>
          </div>
        )}
        <div className="row">
          {this.props.editingEntity && (
            <React.Fragment>
              <div className="col-sm-5 offset-sm-3">
                <h4 className="display-5">
                  {this.props.editingEntity.hubmap_identifier}
                </h4>
              </div>
              <div className="col-sm-4 text-right">
                Created by: {this.state.author}
              </div>
            </React.Fragment>
          )}
          <div className="col-sm-12">
            <div
              className="alert alert-danger col-sm-9 offset-sm-3"
              role="alert"
            >
              <FontAwesomeIcon icon={faUserShield} /> - Do not provide any
              Protected Health Information. This includes the{" "}
              <span
                style={{ cursor: "pointer" }}
                className="text-primary"
                onClick={this.showModal}
              >
                18 identifiers specified by HIPAA
              </span>
            </div>
            <form onSubmit={this.handleSubmit}>
              <div className="form-group row d-none">
                <label
                  htmlFor="visit"
                  className="col-sm-3 col-form-label text-right"
                >
                  Visit
                </label>
                {!this.props.readOnly && (
                  <div className="col-sm-8">
                    <input
                      type="text"
                      name="visit"
                      id="visit"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.visit)
                      }
                      placeholder="Visit"
                      onChange={this.handleInputChange}
                      value={this.state.visit}
                    />
                  </div>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-9 col-form-label">
                    <p>{this.state.visit}</p>
                  </div>
                )}
              </div>
              <div className="form-group row">
                <label
                  htmlFor="lab_donor_id"
                  className="col-sm-3 col-form-label text-right"
                >
                  Lab's Donor Non-PHI ID
                </label>
                {!this.props.readOnly && (
                  <div className="col-sm-8">
                    <input
                      type="text"
                      name="lab_donor_id"
                      id="lab_donor_id"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.lab_donor_id)
                      }
                      onChange={this.handleInputChange}
                      value={this.state.lab_donor_id}
                      placeholder="An non-PHI id used by the lab when referring to the donor."
                    />
                  </div>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-8 col-form-label">
                    <p>{this.state.lab_donor_id}</p>
                  </div>
                )}
                <div className="col-sm-1 my-auto text-center">
                  <span className="text-danger inline-icon">
                    <FontAwesomeIcon icon={faUserShield} />
                  </span>
                  <span>
                    <FontAwesomeIcon
                      icon={faQuestionCircle}
                      data-tip
                      data-for="lab_donor_id_tooltip"
                    />
                    <ReactTooltip
                      id="lab_donor_id_tooltip"
                      place="top"
                      type="info"
                      effect="solid"
                    >
                      <h4>
                        An identifier used by the lab to identify the donor.{" "}
                        <br /> This field will be entered by the user.
                      </h4>
                    </ReactTooltip>
                  </span>
                </div>
              </div>
              <div className="form-group row">
                <label
                  htmlFor="identifying_name"
                  className="col-sm-3 col-form-label text-right"
                >
                  Deidentified Name <span className="text-danger">*</span>
                </label>
                {!this.props.readOnly && (
                  <div className="col-sm-8">
                    <input
                      type="text"
                      name="identifying_name"
                      id="identifying_name"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.identifying_name)
                      }
                      onChange={this.handleInputChange}
                      value={this.state.identifying_name}
                      placeholder="A deidentified name used by the lab to identify the donor (e.g. HuBMAP Donor 1)"
                    />
                  </div>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-8 col-form-label">
                    <p>{this.state.identifying_name}</p>
                  </div>
                )}
                <div className="col-sm-1 my-auto text-center">
                  <span className="text-danger inline-icon">
                    <FontAwesomeIcon icon={faUserShield} />
                  </span>
                  <span>
                    <FontAwesomeIcon
                      icon={faQuestionCircle}
                      data-tip
                      data-for="identifying_name_tooltip"
                    />
                    <ReactTooltip
                      id="identifying_name_tooltip"
                      place="top"
                      type="info"
                      effect="solid"
                    >
                      <h4>
                        A name used by the lab to identify the donor (e.g.
                        HuBMAP donor 1).
                      </h4>
                    </ReactTooltip>
                  </span>
                </div>
              </div>
              <div className="form-group row">
                <label
                  htmlFor="protocol"
                  className="col-sm-3 col-form-label text-right"
                >
                  Case Selection Protocol <span className="text-danger">*</span>
                </label>
                {!this.props.readOnly && (
                  <div className="col-sm-8">
                    <input
                      ref={this.protocol}
                      type="text"
                      name="protocol"
                      id="protocol"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.protocol)
                      }
                      onChange={this.handleInputChange}
                      value={this.state.protocol}
                      placeholder="protocols.io DOI"
                    />
                    {this.state.formErrors.protocol &&
                      this.state.formErrors.protocol !== "required" && (
                        <div className="invalid-feedback">
                          {this.state.formErrors.protocol}
                        </div>
                      )}
                  </div>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-8 col-form-label">
                    <p>{this.state.protocol}</p>
                  </div>
                )}
                <div className="col-sm-1 my-auto text-center">
                  <span className="text-danger inline-icon">
                    <FontAwesomeIcon icon={faUserShield} />
                  </span>
                  <span>
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
                        The protocol used when choosing and acquiring the donor.
                        <br />
                        This can be supplied as either a protocols.io DOI or{" "}
                        <br /> an uploaded document
                      </h4>
                    </ReactTooltip>
                  </span>
                </div>
              </div>
              {(!this.props.readOnly ||
                this.state.protocol_file_name !== undefined) && (
                <div className="form-group row">
                  <label
                    htmlFor="protocol"
                    className="col-sm-3 col-form-label text-right"
                  >
                    Protocol document <span className="text-danger">*</span>
                  </label>
                  {!this.props.readOnly && (
                    <React.Fragment>
                      <div className="col-sm-6">
                        <div className="custom-file">
                          <input
                            ref={this.protocolFile}
                            type="file"
                            name="protocol_file"
                            key={this.protocolFileKey}
                            className={
                              "custom-file-input " +
                              this.errorClass(
                                this.state.formErrors.protocol_file
                              )
                            }
                            id="protocol_file"
                            onChange={this.handleInputChange}
                            placeholder="A brief description of the donor"
                            accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                          />
                          <label
                            className="custom-file-label"
                            htmlFor="protocol_file"
                          >
                            {this.state.protocol_file_name}
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
                          this.state.protocol_file_name !== "Choose a file" && (
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
                    <div className="col-sm-9 col-form-label">
                      <p>{this.state.protocol_file_name}</p>
                    </div>
                  )}
                </div>
              )}
              {(!this.props.readOnly ||
                this.state.description !== undefined) && (
                <div className="form-group row">
                  <label
                    htmlFor="description"
                    className="col-sm-3 col-form-label text-right"
                  >
                    Description
                  </label>
                  {!this.props.readOnly && (
                    <div className="col-sm-8">
                      <textarea
                        type="text"
                        name="description"
                        id="description"
                        className="form-control"
                        onChange={this.handleInputChange}
                        value={this.state.description}
                      />
                    </div>
                  )}
                  {this.props.readOnly && (
                    <div className="col-sm-8 col-form-label">
                      <p>{truncateString(this.state.description, 400)}</p>
                    </div>
                  )}
                  <div className="col-sm-1 my-auto text-center">
                    <span className="invisible text-danger inline-icon">
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </span>
                    <span>
                      <FontAwesomeIcon
                        icon={faQuestionCircle}
                        data-tip
                        data-for="description_tooltip"
                      />
                      <ReactTooltip
                        id="description_tooltip"
                        place="top"
                        type="info"
                        effect="solid"
                      >
                        <h4>
                          Free text field to enter a description of the donor
                        </h4>
                      </ReactTooltip>
                    </span>
                  </div>
                </div>
              )}
              {(!this.props.readOnly || this.state.metadatas.length > 0) && (
                <div className="form-group row">
                  <label
                    htmlFor="metadata"
                    className="col-sm-3 col-form-label text-right"
                  >
                    Metadata
                  </label>
                  <div className="col-sm-8">
                    {!this.props.readOnly && (
                      <div className="row">
                        <div className="col-sm-4">
                          <button
                            type="button"
                            onClick={this.handleAddMetadata}
                            className="btn btn-primary"
                          >
                            <FontAwesomeIcon
                              className="inline-icon"
                              icon={faPlus}
                              title="Uploaded images (multiple allowed)."
                            />
                            Add Metadata
                          </button>
                        </div>
                      </div>
                    )}
                    {this.state.metadatas.map(metadata => (
                      <MetadataUpload
                        key={metadata.id}
                        id={metadata.id}
                        file_name={metadata.file_name}
                        ref={metadata.ref}
                        error={metadata.error}
                        readOnly={this.props.readOnly}
                        onDelete={this.handleDeleteMetadata}
                      />
                    ))}
                  </div>
                  <div className="col-sm-1 my-auto text-center">
                    <span className="invisible text-danger inline-icon">
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </span>
                    <span>
                      <FontAwesomeIcon
                        icon={faQuestionCircle}
                        data-tip
                        data-for="metadata_tooltip"
                      />
                      <ReactTooltip
                        id="metadata_tooltip"
                        place="top"
                        type="info"
                        effect="solid"
                      >
                        <h4>
                          Metadata describing the specimen. <br /> This could be
                          typed in (or copy/pasted) or <br /> an uploaded file
                          such as a spreadsheet.
                        </h4>
                      </ReactTooltip>
                    </span>
                  </div>
                </div>
              )}
              {(!this.props.readOnly || this.state.images.length > 0) && (
                <div className="form-group row">
                  <label
                    htmlFor="image"
                    className="col-sm-3 col-form-label text-right"
                  >
                    Image
                  </label>
                  <div className="col-sm-8">
                    {!this.props.readOnly && (
                      <div className="row">
                        <div className="col-sm-4">
                          <button
                            type="button"
                            onClick={this.handleAddImage}
                            className="btn btn-primary"
                          >
                            <FontAwesomeIcon
                              className="inline-icon"
                              icon={faPlus}
                              title="Uploaded images (multiple allowed)."
                            />
                            Add Image
                          </button>
                        </div>
                        <div className="col-sm-8">
                          <div className="alert alert-danger">
                            Make sure any uploaded images are de-identified
                          </div>
                        </div>
                      </div>
                    )}
                    {this.state.images.map(image => (
                      <ImageUpload
                        key={image.id}
                        id={image.id}
                        file_name={image.file_name}
                        description={image.description}
                        ref={image.ref}
                        error={image.error}
                        readOnly={this.props.readOnly}
                        onDelete={this.handleDeleteImage}
                      />
                    ))}
                  </div>
                  <div className="col-sm-1 my-auto text-center">
                    <span className="invisible text-danger inline-icon">
                      <FontAwesomeIcon icon={faQuestionCircle} />
                    </span>
                    <span>
                      <FontAwesomeIcon
                        icon={faQuestionCircle}
                        data-tip
                        data-for="image_tooltip"
                      />
                      <ReactTooltip
                        id="image_tooltip"
                        place="top"
                        type="info"
                        effect="solid"
                      >
                        <h4>Uploaded images (multiple allowed)</h4>
                      </ReactTooltip>
                    </span>
                  </div>
                </div>
              )}
              {this.state.submit_error && (
                <div className="alert alert-danger col-sm-12" role="alert">
                  Oops! Something went wrong. Please contact administrator for
                  help.
                </div>
              )}
              {this.renderButtons()}
            </form>
          </div>
        </div>
        <HIPPA show={this.state.show} handleClose={this.hideModal} />
        <GroupModal
          show={this.state.GroupSelectShow}
          hide={this.hideGroupSelectModal}
          groups={this.state.groups}
          submit={this.handleSubmit}
          handleInputChange={this.handleInputChange}
        />
      </React.Fragment>
    );
  }
}

export default DonorForm;
