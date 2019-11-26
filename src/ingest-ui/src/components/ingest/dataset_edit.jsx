import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "../uuid/HIPPA.jsx";
import { truncateString } from "../../utils/string_helper";
import { SAMPLE_TYPES, ORGAN_TYPES } from "../../constants";
import { flattenSampleType } from "../../utils/constants_helper";
import axios from "axios";
import { validateRequired } from "../../utils/validators";
import {
  faUserShield,
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";

class DatasetEdit extends Component {
  state = {
    status: "",
    id: "",
    name: "",
    collection: {
      uuid: "",
      label: "",
      description: ""
    },
    source_uuid: "",
    phi: "no",
    description: "",
    source_uuids: [],
    globus_path: "",

    is_curator: null,
    source_uuid_type: "",
    
    formErrors: {
      name: "",
      collection: "",
      source_uuid: ""
    }
  };

  componentDidMount() {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json"
      }
    };

    axios
      .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections`, config)
      .then(res => {
        this.setState({
          collections: res.data.collections
        });
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/userroles`,
        config
      )
      .then(res => {
        res.data.roles.map(r => {
          if (r.name === "hubmap-data-curator") {
            this.setState({ is_curator: true });
          }
          return r;
        });

        if (this.state.is_curator === null) {
          this.setState({ is_curator: false });
        }
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then(res => {
        const display_names = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g.displayname;
          });
        this.setState({
          group: display_names[0]
        });
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    if (this.props.editingDataset) {
      let source_uuids;
      try {
        source_uuids = JSON.parse(
          this.props.editingDataset.properties.source_uuid.replace(/'/g, '"')
        );
      } catch {
        source_uuids = [this.props.editingDataset.properties.source_uuid];
      }

      this.setState(
        {
          status: this.props.editingDataset.properties.status.toUpperCase(),
          id: this.props.editingDataset.entity_display_doi,
          name: this.props.editingDataset.properties.name,
          globus_path: this.props.editingDataset.properties
            .globus_directory_url_path,
          collection: this.props.editingDataset.properties.collection
            ? this.props.editingDataset.properties.collection
            : {
                uuid: "",
                label: "",
                description: ""
              },
          source_uuid: this.generateDisplaySourceId(source_uuids),
          source_uuid_list: source_uuids,
          source_uuid_type: this.props.editingDataset.properties.specimen_type,
          phi: this.props.editingDataset.properties.phi,
          description: this.props.editingDataset.properties.description
        },
        () => {
          switch (this.state.status.toUpperCase()) {
            case "NEW":
              this.setState({
                badge_class: "badge-purple"
              });
              break;
            case "REOPENED":
              this.setState({
                badge_class: "badge-purple"
              });
              break;
            case "INVALID":
              this.setState({
                badge_class: "badge-warning"
              });
              break;
            case "QA":
              this.setState({
                badge_class: "badge-info"
              });
              break;
            case "LOCKED":
              this.setState({
                badge_class: "badge-secondary"
              });
              break;
            case "PUBLISHED":
              this.setState({
                badge_class: "badge-success"
              });
              break;
            case "UNPUBLISHED":
              this.setState({
                badge_class: "badge-light"
              });
              break;
            case "DEPRECATED":
              break;
            default:
              break;
          }
        }
      );
    }
  }

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  handleLookUpClick = () => {
    this.setState({
      LookUpShow: true
    });
  };

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

  handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "name":
        this.setState({
          name: value
        });
        break;
      case "collection":
        let ret = this.state.collections.filter(c => {
          return c.label.toLowerCase().includes(value.toLowerCase());
        });
        this.setState({
          collection: value,
          showCollectionsDropDown: true,
          collection_candidates: ret
        });
        break;
      case "source_uuid":
        this.setState({
          source_uuid: value
        });
        break;
      case "description":
        this.setState({
          description: value
        });
        break;
      case "status":
        this.setState({
          new_status: value
        });
        break;
      default:
        break;
    }
  };

  handleInputFocus = e => {
    const { name, value } = e.target;
    switch (name) {
      case "collection":
        let ret = this.state.collections.filter(c => {
          return c.name.toLowerCase().includes(value.toLowerCase());
        });
        this.setState({
          collection: value,
          showCollectionsDropDown: true,
          collection_candidates: ret
        });
        break;
      default:
        break;
    }
  };

  handleInputBlur = e => {
    const { name } = e.target;
    switch (name) {
      case "collection":
        this.setState({
          showCollectionsDropDown: false
        });
        break;
      default:
        break;
    }
  };

  handleCollectionClick = collection => {
    this.setState({
      collection: collection,
      showCollectionsDropDown: false
    });
  };

  handleSelectClick = ids => {
    this.setState(
      {
        source_uuid: this.generateDisplaySourceId(ids),
        source_uuid_list: ids,
        
        LookUpShow: false
      },
      () => {
        this.validateUUID();
      }
    );
  };

  handleAddNewCollection = () => {
    this.setState({
      AddCollectionShow: true
    });
  };

  hideAddCollectionModal = collection => {
    this.setState({
      AddCollectionShow: false
    });

    if (collection.label) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
          "Content-Type": "application/json"
        }
      };

      axios
        .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections`, config)
        .then(res => {
          this.setState(
            {
              collections: res.data.collections
            },
            () => {
              const ret = this.state.collections.filter(c => {
                return c.label
                  .toLowerCase()
                  .includes(collection.label.toLowerCase());
              });
              this.setState({ collection: ret[0] });
            }
          );
        })
        .catch(err => {
          if (err.response === undefined) {
          } else if (err.response.status === 401) {
            localStorage.setItem("isAuthenticated", false);
            window.location.reload();
          }
        });
    }
  };

  validateUUID = () => {
    let isValid = true;
    const uuid = this.state.source_uuid_list[0].hubmap_identifier ? this.state.source_uuid_list[0].hubmap_identifier : this.state.source_uuid_list[0];
    const uuid_type = this.state.source_uuid_list[0].datatype ? this.state.source_uuid_list[0].datatype : "";
    //const uuid_type = "Not dataset";
    const url_path = uuid_type === "Dataset" ? "datasets" : "specimens";
    const url_server = uuid_type === "Dataset" ? process.env.REACT_APP_DATAINGEST_API_URL : process.env.REACT_APP_SPECIMEN_API_URL;
    
    // const patt = new RegExp("^.{3}-.{4}-.{3}$");
    // if (patt.test(uuid)) {
    this.setState({
      validatingUUID: true
    });
    if (true) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
          "Content-Type": "multipart/form-data"
        }
      };

      return axios
        .get(
          `${url_server}/${url_path}/${uuid}`,
          config
        )
        .then(res => {
          if (res.data) {
            if (res.data.specimen && res.data.specimen.entitytype === "Dataset") {
              res.data.dataset = res.data.specimen;
              res.data.specimen = null;
            }
            this.setState(prevState => ({
              source_entity: res.data,
              formErrors: { ...prevState.formErrors, source_uuid: "valid" }
            }));
            return isValid;
          } else {
            this.setState(prevState => ({
              source_entity: null,
              formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
            }));
            isValid = false;
            alert("The Source UUID does not exist.");
            return isValid;
          }
        })
        .catch(err => {
          this.setState(prevState => ({
            source_entity: null,
            formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
          }));
          isValid = false;
          alert("The Source UUID does not exist.");
          return isValid;
        })
        .then(() => {
          this.setState({
            validatingUUID: false
          });
          return isValid;
        });
    } else {
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
      }));
      isValid = false;
      alert("The Source UUID is invalid.");
      return new Promise((resolve, reject) => {
        resolve(false);
      });
    }
  };

  handleButtonClick = i => {
    this.handleSubmit(i);
  };

  handleSubmit = i => {
    this.validateForm().then(isValid => {
      if (isValid) {
        let data = {
          name: this.state.name,
          collection_uuid: this.state.collection.uuid,
          source_uuid: this.state.source_uuid_list[0].hubmap_identifier,
          phi: this.state.phi,
          description: this.state.description,
          status: i
        };

        var formData = new FormData();
        formData.append("data", JSON.stringify(data));
        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            MAuthorization: "MBearer " + localStorage.getItem("info"),
            "Content-Type": "multipart/form-data"
          }
        };

        if (this.props.editingDataset) {
          let uri = "";
          if (i === "published") {
            uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${this.props.editingDataset.uuid}/publish`;
          } else if (i === "unpublished") {
            uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${this.props.editingDataset.uuid}/unpublish`;
          } else {
            uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${this.props.editingDataset.uuid}`;
          }
          axios
            .put(uri, formData, config)
            .then(res => {
              this.props.onUpdated(res.data);
            })
            .catch(error => {
              this.setState({ submit_error: true, submitting: false });
            });
        } else {
          axios
            .post(
              `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`,
              formData,
              config
            )
            .then(res => {
              this.setState({
                 globus_path : res.data.globus_directory_url_path
              });
              this.props.onCreated();
              this.onChangeGlobusURL();
            })
            .catch(error => {
              this.setState({ submit_error: true, submitting: false });
            });
        }
      }
    });
  };

  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;

      if (!validateRequired(this.state.name)) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, name: "required" }
        }));
        isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, name: "" }
        }));
      }

      if (!validateRequired(this.state.source_uuid)) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, source_uuid: "required" }
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, source_uuid: "" }
        }));
        this.validateUUID().then(res => {
          resolve(isValid && res);
        });
      }
    });
  }

  generateDisplaySourceId(source_uuids) {
    if (source_uuids.length > 1) {
      let first_lab_id = source_uuids[0].hubmap_identifier ? source_uuids[0].hubmap_identifier : source_uuids[0];
      let last_lab_id = source_uuids[source_uuids.length - 1].hubmap_identifier ? source_uuids[source_uuids.length - 1].hubmap_identifier : source_uuids[source_uuids.length - 1];
      //let first_lab_id = source_uuids[0];
      //let last_lab_id = source_uuids[source_uuids.length - 1];
      let id_common_part = first_lab_id.substring(
        0,
        first_lab_id.lastIndexOf("-") + 1
      );
      let first_lab_id_num = "";
      let last_lab_id_num = "";
      let display_source_id = first_lab_id;

      first_lab_id_num = first_lab_id.substring(
        first_lab_id.lastIndexOf("-") + 1,
        first_lab_id.length
      );

      last_lab_id_num = last_lab_id.substring(
        last_lab_id.lastIndexOf("-") + 1,
        last_lab_id.length
      );

      display_source_id = `${id_common_part}[${first_lab_id_num} through ${last_lab_id_num}]`;
      return display_source_id;
    } else {
      if (source_uuids[0].hubmap_identifier) {
      	return source_uuids[0].hubmap_identifier;
      } else {
      	return source_uuids[0];
      }
    }
  }

  renderButtons() {
    if (this.props.editingDataset) {
      if (!this.state.group) {
        return (
          <div className="row">
            <div className="col-sm-2 offset-sm-10">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.props.handleCancel()}
              >
                Close
              </button>
            </div>
          </div>
        );
      } else {
        if (this.state.is_curator) {
          if (this.state.status.toUpperCase() === "QA") {
            return (
              <div className="row">
                <div className="col-sm-3 offset-sm-2 text-center">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status="published"
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className="col-sm-4 text-center">
                  <button
                    type="button"
                    className="btn btn-danger btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("invalid")}
                    data-status="invalid"
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reject"}
                  </button>
                </div>
                <div className="col-sm-2 text-right">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else if (this.state.status.toUpperCase() === "PUBLISHED") {
            return (
              <div className="row">
                <div className="col-sm-3 offset-sm-2 text-center"></div>
                <div className="col-sm-4 text-center">
                  <button
                    type="button"
                    className="btn btn-danger btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("unpublished")}
                    data-status="unpublished"
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Unpublish"}
                  </button>
                </div>
                <div className="col-sm-2 text-right">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else if (this.state.status.toUpperCase() === "UNPUBLISHED") {
            return (
              <div className="row">
                <div className="col-sm-3 offset-sm-2 text-center"></div>
                <div className="col-sm-4 text-center">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status="published"
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className="col-sm-2 text-right">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else {
            return (
              <div className="row">
                <div className="col-sm-4 offset-sm-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          }
        } else {
          if (
            ["NEW", "INVALID", "REOPENED"].includes(
              this.state.status.toUpperCase()
            )
          ) {
            return (
              <div className="row">
                <div className="col-sm-3 offset-sm-2 text-center">
                  <button
                    type="button"
                    className="btn btn-info btn-block"
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.status.toLowerCase())
                    }
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Save"}
                  </button>
                </div>
                <div className="col-sm-4 text-center">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("qa")}
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Submit"}
                  </button>
                </div>
                <div className="col-sm-2 text-right">
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
          } else if (this.state.status.toUpperCase() === "PUBLISHED") {
            return (
              <div className="row">
                <div className="col-sm-3 offset-sm-2 text-center">
                  <button
                    type="button"
                    className="btn btn-primary btn-block"
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("reopened")}
                    data-status="reopened"
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className="inline-icon"
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reopen"}
                  </button>
                </div>
                <div className="col-sm-4 text-center"></div>
                <div className="col-sm-2 text-right">
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
          } else {
            return (
              <div className="row">
                <div className="col-sm-2 offset-sm-10">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          }
        }
      }
    } else {
      return (
        <div className="row">
          <div className="col-sm-3 offset-sm-2 text-center">
            <button
              type="button"
              className="btn btn-info btn-block"
              disabled={this.state.submitting}
              onClick={() => this.handleButtonClick("new")}
              data-status="new"
            >
              {this.state.submitting && (
                <FontAwesomeIcon
                  className="inline-icon"
                  icon={faSpinner}
                  spin
                />
              )}
              {!this.state.submitting && "Create"}
            </button>
          </div>
          <div className="col-sm-4 text-center">
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => this.props.handleCancel()}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
  }

  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }
  
  onChangeGlobusURL() {
  	this.props.changeLink(this.state.globus_path, this.state.name);
  }

  render() {
    return (
      <React.Fragment>
        <form>
          <div>
            <div className="row mt-3 mb-3">
              <div className="col-sm-2">
                 <h3 className="float-right">
                  <span className={"badge " + this.state.badge_class}>
                    {this.state.status}
                  </span>
                </h3>
              </div>
              <div className="col-sm-10">
                <p>{this.props.editingDataset && "Dataset id: " + this.state.id}</p>
                {this.state.globus_path && (
	              <div>
	                <p><strong><big>To add or modify data files go to the <a href={this.state.globus_path} target="_blank">data repository <FontAwesomeIcon icon={faExternalLinkAlt} /></a>.</big></strong>
	                </p>

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
	              </div> )}
              </div>
              
            </div>
            <div className="form-group row">
              <label
                htmlFor="name"
                className="col-sm-2 col-form-label text-right"
              >
                Dataset Name <span className="text-danger">*</span>
              </label>
              {!this.props.readOnly && (
                <div className="col-sm-9">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className={
                      "form-control " +
                      this.errorClass(this.state.formErrors.name)
                    }
                    placeholder="Dataset name"
                    onChange={this.handleInputChange}
                    value={this.state.name}
                  />
                </div>
              )}
              {this.props.readOnly && (
                <div className="col-sm-9 col-form-label">
                  <p>{this.state.name}</p>
                </div>
              )}
              <div className="col-sm-1 my-auto text-center">
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for="name_tooltip"
                  />
                  <ReactTooltip
                    id="name_tooltip"
                    place="top"
                    type="info"
                    effect="solid"
                  >
                    <h4>Dataset Name Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="name"
                className="col-sm-2 col-form-label text-right"
              >
                Collection
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className="col-sm-7">
                    <input
                      type="text"
                      name="collection"
                      id="collection"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.collection)
                      }
                      placeholder="Collection"
                      onChange={this.handleInputChange}
                      value={this.state.collection.label}
                      autoComplete="off"
                    />
                    {this.state.showCollectionsDropDown && (
                      <div
                        className="dropdown-menu display-block ml-2"
                        aria-labelledby="dropdownMenuButton"
                      >
                        {this.state.collection_candidates.map(collection => {
                          return (
                            <div
                              key={collection.uuid}
                              className="card-body"
                              onClick={() =>
                                this.handleCollectionClick(collection)
                              }
                            >
                              <h5 className="card-title">{collection.label}</h5>
                              <p className="card-text">
                                {truncateString(collection.description, 230)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="col-sm-2 my-auto text-right">
                    {this.state.group && (
                      <button
                        className="btn btn-primary"
                        type="button"
                        onClick={this.handleAddNewCollection}
                      >
                        Add New
                      </button>
                    )}
                  </div>
                  <CreateCollectionModal
                    show={this.state.AddCollectionShow}
                    hide={this.hideAddCollectionModal}
                  />
                </React.Fragment>
              )}
              {this.props.readOnly && (
                <div className="col-sm-9 col-form-label">
                  <p>{this.state.collection}</p>
                </div>
              )}
              <div className="col-sm-1 my-auto text-center">
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for="collection_tooltip"
                  />
                  <ReactTooltip
                    id="collection_tooltip"
                    place="top"
                    type="info"
                    effect="solid"
                  >
                    <h4>Collection Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>
            <div className="form-group row">
              <label
                htmlFor="source_uuid"
                className="col-sm-2 col-form-label text-right"
              >
                Source ID <span className="text-danger">*</span>
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className="col-sm-5">
                    <input
                      type="text"
                      name="source_uuid"
                      id="source_uuid"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.source_uuid)
                      }
                      value={this.state.source_uuid}
                      onChange={this.handleInputChange}
                    />
                  </div>
                  <div className="col-sm-2">
                    <button
                      className="btn btn-link"
                      type="button"
                      onClick={this.handleLookUpClick}
                    >
                      Look up
                    </button>
                  </div>
                  <div className="col-sm-2 text-right">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={this.validateUUID}
                      disabled={this.state.validatingUUID}
                    >
                      {this.state.validatingUUID ? "..." : "Validate"}
                    </button>
                  </div>
                  <IDSearchModal
                    show={this.state.LookUpShow}
                    hide={this.hideLookUpModal}
                    select={this.handleSelectClick}
                    parent="dataset"
                  />
                </React.Fragment>
              )}
              {this.props.readOnly && (
                <React.Fragment>
                  <div className="col-sm-9 col-form-label">
                    <p>{this.state.source_uuid}</p>
                  </div>{" "}
                </React.Fragment>
              )}
              <div className="col-sm-1 my-auto text-center">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for="source_uuid_tooltip"
                />
                <ReactTooltip
                  id="source_uuid_tooltip"
                  place="top"
                  type="info"
                  effect="solid"
                >
                  <h4>
                    The HuBMAP Unique identifier of the direct origin entity,
                    <br />
                    other sample or doner, where this sample came from.
                  </h4>
                </ReactTooltip>
              </div>
            </div>
            {this.state.source_entity && (
              <div className="form-group row">
                <div className="col-sm-7 offset-sm-2">
                  <div className="card">
                    <div className="card-body">
                      <div className="row">
                        <div className="col-sm-12">
                          <h4 className="card-title">
                            HuBMAP display id:{" "}
                            <b>
                              <span>
                                {
                                  this.state.source_entity.specimen ? this.state.source_entity.specimen.hubmap_identifier : (
                                      this.state.source_entity.dataset ? this.state.source_entity.dataset.display_doi : ""
                                  )
                                }
                              </span>
                            </b>
                          </h4>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-6">
                          <b>type:</b>{" "}
                          {this.state.source_entity.specimen ? (this.state.source_entity.specimen.specimen_type
                            ? flattenSampleType(SAMPLE_TYPES)[
                                this.state.source_entity.specimen.specimen_type
                              ]
                            : this.state.source_entity.specimen.entitytype) : this.state.source_entity.dataset ? this.state.source_entity.dataset.entitytype : ""}
                        </div>
                        <div className="col-sm-6">
                          <b>name:</b> {this.state.source_entity.specimen ? (this.state.source_entity.specimen.label) :
                                            this.state.source_entity.dataset ? this.state.source_entity.dataset.name : ""}
                        </div>
                        {this.state.source_entity.specimen && (this.state.source_entity.specimen.specimen_type ===
                          "organ" && (
                          <div className="col-sm-12">
                            <b>Organ Type:</b>{" "}
                            {this.state.source_entity.specimen && (
                              ORGAN_TYPES[
                                this.state.source_entity.specimen.organ
                              ])
                            }
                          </div>
                        ) )}
                        <div className="col-sm-6">
                          <b>HuBMAP ID:</b>{" "}
                          {this.state.source_entity.specimen ? this.state.source_entity.specimen.hubmap_identifier : (
                                      this.state.source_entity.dataset ? this.state.source_entity.dataset.display_doi : "")}
                        </div>
                        <div className="col-sm-12">
                          <p>
                            <b>Description: </b>{" "}
                            {this.state.source_entity.specimen ? (truncateString(
                              this.state.source_entity.specimen.description,
                              230
                            ) ) : this.state.source_entity.dataset ? (truncateString(
                              this.state.source_entity.dataset.description,
                              230
                            ) ) : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-group row">
              <label
                htmlFor="phi"
                className="col-sm-2 col-form-label text-right"
              >
                Gene Sequences <span className="text-danger">*</span>
              </label>
              {!this.props.readOnly && (
                <div className="col-sm-9">
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="phi"
                      id="phi_no"
                      value="no"
                      defaultChecked={true}
                    />
                    <label className="form-check-label" htmlFor="phi_no">
                      No
                    </label>
                  </div>
                  <div className="form-check form-check-inline">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="phi"
                      id="phi_yes"
                      value="Yes"
                    />
                    <label className="form-check-label" htmlFor="phi_yes">
                      Yes
                    </label>
                  </div>
                  <small id="PHIHelpBlock" className="form-text text-muted">
                    Will this data contain any human genomic sequence data?
                  </small>
                </div>
              )}
              {this.props.readOnly && (
                <div className="col-sm-9 col-form-label">
                  <p>{this.state.phi}</p>
                </div>
              )}
              <div className="col-sm-1 my-auto text-center">
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for="phi_tooltip"
                  />
                  <ReactTooltip
                    id="phi_tooltip"
                    place="top"
                    type="info"
                    effect="solid"
                  >
                    <h4>Gene Sequences Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>
          </div>
          <div className="form-group row">
            <label
              htmlFor="description"
              className="col-sm-2 col-form-label text-right"
            >
              Description
            </label>
            {!this.props.readOnly && (
              <React.Fragment>
                <div className="col-sm-9">
                  <textarea
                    type="text"
                    name="description"
                    id="description"
                    cols="30"
                    rows="5"
                    className="form-control"
                    placeholder="Description"
                    onChange={this.handleInputChange}
                    value={this.state.description}
                  />
                </div>
              </React.Fragment>
            )}
            {this.props.readOnly && (
              <div className="col-sm-9 col-form-label">
                <p>{this.state.description}</p>
              </div>
            )}
            <div className="col-sm-1 my-auto text-center">
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
                  <h4>Description Tips</h4>
                </ReactTooltip>
              </span>
            </div>
          </div>
          {this.state.submit_error && (
            <div className="alert alert-danger col-sm-12" role="alert">
              Oops! Something went wrong. Please contact administrator for help.
            </div>
          )}
          {this.state.is_curator !== null && this.renderButtons()}
        </form>
        <HIPPA show={this.state.show} handleClose={this.hideModal} />
      </React.Fragment>
    );
  }
}

export default DatasetEdit;
