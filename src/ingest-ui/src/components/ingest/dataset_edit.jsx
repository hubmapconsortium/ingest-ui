import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "../uuid/HIPPA.jsx";
import { truncateString } from "../../utils/string_helper";
import { SAMPLE_TYPES, ORGAN_TYPES, DATA_TYPES } from "../../constants";
import { flattenSampleType } from "../../utils/constants_helper";
import axios from "axios";
import { validateRequired } from "../../utils/validators";
import {
  faUserShield,
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";

class DatasetEdit extends Component {
  state = {
    status: "",
    display_doi: "",
    doi: "",
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
    data_types: new Set(),
    other_datatype: false,
    other_dt: "",
	is_protected: false,

    formErrors: {
      name: "",
      collection: "",
      source_uuid: "",
      data_types: "",
      other_dt: ""
    }
  };

  componentDidMount() {
    document.addEventListener("click", this.handleClickOutside);
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
          groups: display_names
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
      let data_types = null;
      let other_dt = undefined;
      if (this.props.editingDataset.properties.data_types) {
        data_types = JSON.parse(
          this.props.editingDataset.properties.data_types
            .replace(/'/g, '"')
            .replace(/\\"/g, "'")
        );
        const data_type_options = new Set(DATA_TYPES);
        other_dt = data_types.filter(dt => !data_type_options.has(dt))[0];
        data_types = data_types.filter(dt => data_type_options.has(dt));
      }
	  this.setState({
		is_protected: false
      });
	  if (this.props.editingDataset.properties.is_protected) {
		  this.setState({
		  	is_protected: this.props.editingDataset.properties.is_protected.toLowerCase() === "true" ? true: false
		  });
	  }
      this.setState(
        {
          status: this.props.editingDataset.properties.status.toUpperCase(),
          display_doi: this.props.editingDataset.entity_display_doi,
          doi: this.props.editingDataset.entity_doi,
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
          data_types: new Set(data_types),
          other_datatype: other_dt !== undefined,
          other_dt: other_dt,
          description: this.props.editingDataset.properties.description,
          errorMsgShow: this.props.editingDataset.properties.status.toLowerCase() === "error" && this.props.editingDataset.properties.message ? true : false,
          statusErrorMsg: this.props.editingDataset.properties.message
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
            case "ERROR":
              this.setState({
                badge_class: "badge-danger"
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

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
  }

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  showErrorMsgModal = msg => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow: false });
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

  handler = e => {
    if(e.key === 'Tab'){
      e.preventDefault();
      if(this.state.collection_candidates.length > 0){
        this.setState({
          collection: this.state.collection_candidates[0],
          showCollectionsDropDown: false
        });
      }
    }
  }

  handleInputChange = e => {
    const { id, name, value } = e.target;
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
          showCollectionsDropDown: value !== "",
          collection_candidates: ret
        });
        break;
      case "source_uuid":
        this.setState({
          source_uuid: value
        });
        break;
      case "phi":
        this.setState({
          phi: value
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
	  case "is_protected":
		this.setState({
		  is_protected: e.target.checked
		});
		break;
      case "other_dt":
        this.setState({ other_dt: value });
        break;
      default:
        break;
    }
    if (id.startsWith("dt")) {
      if (id === "dt_other") {
        this.setState({
          other_datatype: e.target.checked
        });
        if (!e.target.checked) {
          this.setState({
            other_dt: ''
          });
        }
      }
      else {
        if (e.target.checked) {
          const data_types = this.state.data_types;
          data_types.add(name);
          this.setState({
            data_types: data_types
          });
        } else {
          const data_types = this.state.data_types;
          data_types.delete(name);
          this.setState({
            data_types: data_types
          });
        }
      }
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

  getUuidList = (new_uuid_list) => {
    //this.setState({uuid_list: new_uuid_list}); 
    this.setState(
      {
        source_uuid: this.generateDisplaySourceId(new_uuid_list),
        source_uuid_list: new_uuid_list,

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

  handleClickOutside = e => {
    this.setState({
      showCollectionsDropDown: false
    });
  };

  validateUUID = () => {
    let isValid = true;
    const uuid = this.state.source_uuid_list[0].hubmap_identifier
      ? this.state.source_uuid_list[0].hubmap_identifier
      : this.state.source_uuid_list[0];
    const uuid_type = this.state.source_uuid_list[0].datatype
      ? this.state.source_uuid_list[0].datatype
      : "";
    //const uuid_type = "Not dataset";
    const url_path = uuid_type === "Dataset" ? "datasets" : "specimens";
    const url_server =
      uuid_type === "Dataset"
        ? process.env.REACT_APP_DATAINGEST_API_URL
        : process.env.REACT_APP_SPECIMEN_API_URL;

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
        .get(`${url_server}/${url_path}/${uuid}`, config)
        .then(res => {
          if (res.data) {
            if (
              res.data.specimen &&
              res.data.specimen.entitytype === "Dataset"
            ) {
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
        this.setState({ submitting: true });
        let data_types = [...this.state.data_types];
        if (this.state.other_dt !== undefined && this.state.other_dt !== "") {
          data_types = [
            ...data_types,
            this.state.other_dt.replace(/'/g, "\\'")
          ];
        }

        let data = {
          name: this.state.name,
          collection_uuid: this.state.collection.uuid,
          source_uuid: this.state.source_uuid_list.map(su => {
              if(typeof su ==='string' || su instanceof String){
                return su
              } else {
                return su.hubmap_identifier
              }
            }
          ),
          phi: this.state.phi,
          data_types: data_types,
          description: this.state.description,
          status: i,
		  is_protected: this.state.is_protected
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
                globus_path: res.data.globus_directory_url_path,
                display_doi: res.data.display_doi,
                doi: res.data.doi
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

      if (this.state.collection !== "" && this.state.collection.label === undefined) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, collection: "required" }
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, collection: "" }
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

      if (this.state.data_types.size === 0) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, data_types: "required" }
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, data_types: "" }
        }));
      }

      if (
        this.state.other_datatype &&
        !validateRequired(this.state.other_dt)
      ) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, other_dt: "required" }
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, other_dt: "" }
        }));
      }
    });
  }

  //note: this code assumes that source_uuids is a sorted list or a single value
  generateDisplaySourceId(source_uuids) {
    //check if the source_uuids represents a list or a single value
    if (source_uuids.length > 1) {
      //is_subset is a flag indicating if the source_uuid list is
      //a consecutive set of values (ex: 1-5) or a subset of values (ex: 1,3,5)
      var is_subset = "";
      //first, determine if the numbers are a complete sequence or a subset
      //loop through all the values and extract the last number from the label (ex: TEST0001-RK-3)
	  for (var i = 1; i < source_uuids.length; i++) {
	      //assume the label is just a string
	      var first_lab_id_subset_string = source_uuids[i-1];
	      //in some instances, the label is not a string but an object
	      //in this case, use the hubmap_identifier as the string
	      if (typeof source_uuids[i-1] != "string") {
	      	first_lab_id_subset_string = source_uuids[i-1].hubmap_identifier
	      }
	      //extract the last digit from the string
	      var first_lab_id_subset = first_lab_id_subset_string.substring(
	        first_lab_id_subset_string.lastIndexOf("-") + 1,
	        first_lab_id_subset_string.length
	      );
	
	      //in some instances, the label is not a string but an object
	      //in this case, use the hubmap_identifier as the string
	      var next_lab_id_subset_string = source_uuids[i];
	      if (typeof source_uuids[i] != "string") {
	      	next_lab_id_subset_string = source_uuids[i].hubmap_identifier
	      }
	      //extract the last digit from the string
	      var next_lab_id_subset = next_lab_id_subset_string.substring(
	        next_lab_id_subset_string.lastIndexOf("-") + 1,
	        next_lab_id_subset_string.length
	      );
	    //finally, compare the digits.  If any consecutive digits are more than
	    //one number apart, then these values represent a subset
	    if(next_lab_id_subset - first_lab_id_subset !== 1) {
			is_subset = "subset";
			break;
	    }
	  }
	  //extract the first and last values
      let first_lab_id = source_uuids[0].hubmap_identifier
        ? source_uuids[0].hubmap_identifier
        : source_uuids[0];
      let last_lab_id = source_uuids[source_uuids.length - 1].hubmap_identifier
        ? source_uuids[source_uuids.length - 1].hubmap_identifier
        : source_uuids[source_uuids.length - 1];
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
      if (is_subset === "subset") {
        display_source_id = `a subset of ${id_common_part}[ between ${first_lab_id_num} and ${last_lab_id_num}]`;
      }
      return display_source_id;
    //in this case there is only one value
    } else {
      if (source_uuids && source_uuids[0] && source_uuids[0].hubmap_identifier) {
        return source_uuids[0].hubmap_identifier;
      } else {
        return source_uuids[0];
      }
    }
  }

  renderButtons() {
    if (this.props.editingDataset) {
      if (!this.state.groups || !this.props.editingDataset.writeable) {
        return (
          <div className='row'>
            <div className='col-sm-2 offset-sm-10'>
              <button
                type='button'
                className='btn btn-secondary'
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
              <div className='row'>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.status.toLowerCase())
                    }
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Save"}
                  </button>
                </div>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status='published'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("reopened")}
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reopen"}
                  </button>
                </div>
                <div className='col-sm-3 text-center'>
                  <button
                    type='button'
                    className='btn btn-dark btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("hold")}
                    data-status='invalid'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Hold"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else if (this.state.status.toUpperCase() === "PUBLISHED") {
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("reopened")}
                    data-status='reopened'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reopen"}
                  </button>
                </div>
                <div className='col-sm-4 text-center'>
                  <button
                    type='button'
                    className='btn btn-danger btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("unpublished")}
                    data-status='unpublished'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Unpublish"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else if (this.state.status.toUpperCase() === "UNPUBLISHED") {
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'></div>
                <div className='col-sm-4 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status='published'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          } else {
            return (
              <div className='row'>
                <div className='col-sm-2 offset-sm-10'>
                  <button
                    type='button'
                    className='btn btn-secondary'
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
            ["NEW", "INVALID", "REOPENED", "ERROR"].includes(
              this.state.status.toUpperCase()
            )
          ) {
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.status.toLowerCase())
                    }
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Save"}
                  </button>
                </div>
                <div className='col-sm-4 text-center'>
                  {this.state.groups.includes(process.env.REACT_APP_HUBMAP_DATA_ADMIN_GROUP) && (<button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("processing")}
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Submit"}
                  </button>)}
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          } else {
            return (
              <div className='row'>
                <div className='col-sm-2 offset-sm-10'>
                  <button
                    type='button'
                    className='btn btn-secondary'
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
        <div className='row'>
          <div className='col-sm-3 offset-sm-2 text-center'>
            <button
              type='button'
              className='btn btn-info btn-block'
              disabled={this.state.submitting}
              onClick={() => this.handleButtonClick("new")}
              data-status='new'
            >
              {this.state.submitting && (
                <FontAwesomeIcon
                  className='inline-icon'
                  icon={faSpinner}
                  spin
                />
              )}
              {!this.state.submitting && "Create"}
            </button>
          </div>
          <div className='col-sm-4 text-center'>
            <button
              type='button'
              className='btn btn-secondary btn-block'
              onClick={() => this.props.handleCancel()}
            >
              Close
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
    this.props.changeLink(this.state.globus_path, {name: this.state.name, display_doi: this.state.display_doi, doi: this.state.doi});
  }

  // renderCollection() {
  //   if(this.state.collection)
  // }

  render() {
    return (
      <React.Fragment>
        <form>
          <div>
            <div className='row mt-3 mb-3'>
              <div className='col-sm-2'>
                <h3 className='float-right'>
                  <span className={"badge " + this.state.badge_class} style={{ cursor: "pointer" }} onClick={() => this.showErrorMsgModal(this.props.editingDataset.properties.message)}>
                    {this.state.status}
                  </span>
                </h3>
              </div>
              <div className='col-sm-10'>
                <p>
                  {this.props.editingDataset && "Dataset Display id: " + this.state.display_doi + " | " + "DOI: " + this.state.doi} 
                </p>
                {this.state.globus_path && (
                  <div>
                    <p>
                      <strong>
                        <big>
                          To add or modify data files go to the{" "}
                          <a
                            href={this.state.globus_path}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            data repository{" "}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                          .
                        </big>
                      </strong>
                    </p>

                    <div className='alert alert-danger' role='alert'>
                      <FontAwesomeIcon icon={faUserShield} /> - Do not upload
                      any data containing any of the{" "}
                      <span
                        style={{ cursor: "pointer" }}
                        className='text-primary'
                        onClick={this.showModal}
                      >
                        18 identifiers specified by HIPAA
                      </span>
                      .
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className='form-group row'>
              <label
                htmlFor='name'
                className='col-sm-2 col-form-label text-right'
              >
                Dataset Name <span className='text-danger'>*</span>
              </label>
              {!this.props.readOnly && (
                <div className='col-sm-9'>
                  <input
                    type='text'
                    name='name'
                    id='name'
                    className={
                      "form-control " +
                      this.errorClass(this.state.formErrors.name)
                    }
                    placeholder='Dataset name'
                    onChange={this.handleInputChange}
                    value={this.state.name}
                  />
                </div>
              )}
              {this.props.readOnly && (
                <div className='col-sm-9 col-form-label'>
                  <p>{this.state.name}</p>
                </div>
              )}
              <div className='col-sm-1 my-auto text-center'>
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for='name_tooltip'
                  />
                  <ReactTooltip
                    id='name_tooltip'
                    place='top'
                    type='info'
                    effect='solid'
                  >
                    <h4>Dataset Name Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>
            <div className='form-group row'>
              <label
                htmlFor='name'
                className='col-sm-2 col-form-label text-right'
              >
                Collection
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className='col-sm-7'>
                    <input
                      type='text'
                      name='collection'
                      id='collection'
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.collection)
                      }
                      placeholder='Collection'
                      onChange={this.handleInputChange}
                      onKeyDown={this.handler}
                      value={this.state.collection.label}
                      autoComplete='off'
                    />
                    {this.state.showCollectionsDropDown && (
                      <div
                        className='dropdown-menu display-block ml-2'
                        aria-labelledby='dropdownMenuButton'
                      >
                        {this.state.collection_candidates.map(collection => {
                          return (
                            <div
                              key={collection.uuid}
                              className='card-body'
                              onClick={() =>
                                this.handleCollectionClick(collection)
                              }
                            >
                              <h5 className='card-title'>{collection.label}</h5>
                              <p className='card-text'>
                                {truncateString(collection.description, 230)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className='col-sm-2 my-auto text-right'>
                    {this.state.groups && (
                      <button
                        className='btn btn-primary'
                        type='button'
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
                <div className='col-sm-9 col-form-label'>
                  <p>{this.state.collection}</p>
                </div>
              )}
              <div className='col-sm-1 my-auto text-center'>
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for='collection_tooltip'
                  />
                  <ReactTooltip
                    id='collection_tooltip'
                    place='top'
                    type='info'
                    effect='solid'
                  >
                    <h4>Collection Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>
            <div className='form-group row'>
              <label
                htmlFor='source_uuid'
                className='col-sm-2 col-form-label text-right'
              >
                Source ID <span className='text-danger'>*</span>
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className='col-sm-5'>
                    <input
                      type='text'
                      name='source_uuid'
                      id='source_uuid'
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.source_uuid)
                      }
                      value={this.state.source_uuid}
                      onChange={this.handleInputChange}
                      onFocus={this.handleLookUpClick}
                      autoComplete='off'
                    />
                  </div>
                  <div className='col-sm-4'>
                    <button
                      className='btn btn-link'
                      type='button'
                      onClick={this.handleLookUpClick}
                    >
                      Look up
                    </button>
                  </div>
                  {/* <div className="col-sm-2 text-right">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={this.validateUUID}
                      disabled={this.state.validatingUUID}
                    >
                      {this.state.validatingUUID ? "..." : "Validate"}
                    </button>
                  </div> */}
                  <IDSearchModal
                    show={this.state.LookUpShow}
                    hide={this.hideLookUpModal}
                    select={this.handleSelectClick}
                    parent='dataset'
                    parentCallback = {this.getUuidList}
                    currentSourceIds = {this.state.source_uuid_list}
                  />
                </React.Fragment>
              )}
              {this.props.readOnly && (
                <React.Fragment>
                  <div className='col-sm-9 col-form-label'>
                    <p>{this.state.source_uuid}</p>
                  </div>{" "}
                </React.Fragment>
              )}
              <div className='col-sm-1 my-auto text-center'>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='source_uuid_tooltip'
                />
                <ReactTooltip
                  id='source_uuid_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
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
              <div className='form-group row'>
                <div className='col-sm-7 offset-sm-2'>
                  <div className='card'>
                    <div className='card-body'>
                      <div className='row'>
                        <div className='col-sm-12'>
                          <h4 className='card-title'>
                            HuBMAP display id:{" "}
                            <b>
                              <span>
                                {this.state.source_entity.specimen
                                  ? this.state.source_entity.specimen
                                      .hubmap_identifier
                                  : this.state.source_entity.dataset
                                  ? this.state.source_entity.dataset.display_doi
                                  : ""}
                              </span>
                            </b>
                          </h4>
                        </div>
                      </div>
                      <div className='row'>
                        <div className='col-sm-6'>
                          <b>type:</b>{" "}
                          {this.state.source_entity.specimen
                            ? this.state.source_entity.specimen.specimen_type
                              ? flattenSampleType(SAMPLE_TYPES)[
                                  this.state.source_entity.specimen
                                    .specimen_type
                                ]
                              : this.state.source_entity.specimen.entitytype
                            : this.state.source_entity.dataset
                            ? this.state.source_entity.dataset.entitytype
                            : ""}
                        </div>
                        <div className='col-sm-6'>
                          <b>name:</b>{" "}
                          {this.state.source_entity.specimen
                            ? this.state.source_entity.specimen.label
                            : this.state.source_entity.dataset
                            ? this.state.source_entity.dataset.name
                            : ""}
                        </div>
                        {this.state.source_entity.specimen &&
                          this.state.source_entity.specimen.specimen_type ===
                            "organ" && (
                            <div className='col-sm-12'>
                              <b>Organ Type:</b>{" "}
                              {this.state.source_entity.specimen &&
                                ORGAN_TYPES[
                                  this.state.source_entity.specimen.organ
                                ]}
                            </div>
                          )}
                        <div className='col-sm-6'>
                          <b>HuBMAP ID:</b>{" "}
                          {this.state.source_entity.specimen
                            ? this.state.source_entity.specimen
                                .hubmap_identifier
                            : this.state.source_entity.dataset
                            ? this.state.source_entity.dataset.display_doi
                            : ""}
                        </div>
                        <div className='col-sm-12'>
                          <p>
                            <b>Description: </b>{" "}
                            {this.state.source_entity.specimen
                              ? truncateString(
                                  this.state.source_entity.specimen.description,
                                  230
                                )
                              : this.state.source_entity.dataset
                              ? truncateString(
                                  this.state.source_entity.dataset.description,
                                  230
                                )
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className='form-group row'>
              <label
                htmlFor='phi'
                className='col-sm-2 col-form-label text-right'
              >
                Gene Sequences <span className='text-danger'>*</span>
              </label>
              {!this.props.readOnly && (
                <div className='col-sm-9'>
                  <div className='form-check form-check-inline'>
                    <input
                      className='form-check-input'
                      type='radio'
                      name='phi'
                      id='phi_no'
                      value='no'
                      defaultChecked={true}
                      checked={this.state.phi === "no"}
                      onChange={this.handleInputChange}
                    />
                    <label className='form-check-label' htmlFor='phi_no'>
                      No
                    </label>
                  </div>
                  <div className='form-check form-check-inline'>
                    <input
                      className='form-check-input'
                      type='radio'
                      name='phi'
                      id='phi_yes'
                      value='yes'
                      checked={this.state.phi === "yes"}
                      onChange={this.handleInputChange}
                    />
                    <label className='form-check-label' htmlFor='phi_yes'>
                      Yes
                    </label>
                  </div>
                  <small id='PHIHelpBlock' className='form-text text-muted'>
                    Will this data contain any human genomic sequence data?
                  </small>
                </div>
              )}
              {this.props.readOnly && (
                <div className='col-sm-9 col-form-label'>
                  <p>{this.state.phi}</p>
                </div>
              )}
              <div className='col-sm-1 my-auto text-center'>
                <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for='phi_tooltip'
                  />
                  <ReactTooltip
                    id='phi_tooltip'
                    place='top'
                    type='info'
                    effect='solid'
                  >
                    <h4>Gene Sequences Tips</h4>
                  </ReactTooltip>
                </span>
              </div>
            </div>

            <div className='form-group row'>
              <label
                htmlFor='is_protected'
                className='col-sm-2 col-form-label text-right'
              >
                Protected Access
              </label>
              {!this.props.readOnly && (
                <div className='col-sm-9'>
                  <div className='form-check form-check-inline'>
                    <input
                      className='form-check-input'
                      type='checkbox'
                      name='is_protected'
                      id='is_protected'
                      checked={this.state.is_protected}
                      onChange={this.handleInputChange}
                    />
                    <label className='form-check-label' htmlFor='is_protected'>
                      This dataset is currently granted <strong>protected</strong> status.  <br/>In order to access the data in this dataset you must contact: <a href='mailto:[placeholder]@hubmapconsortium.org'>[placeholder]@hubmapconsortium.org</a>  
                    </label>
                  </div>
                </div>
              )}
              {this.props.readOnly && (
                <div className='col-sm-9 col-form-label'>
                  <p>{this.state.is_protected}</p>
                </div>
              )}
			</div>

          </div>
          <div className='form-group row'>
            <label
              htmlFor='description'
              className='col-sm-2 col-form-label text-right'
            >
              Data Type <span className='text-danger'>*</span>
            </label>
            {!this.props.readOnly && (
              <React.Fragment>
                <div className='col-sm-9'>
                  <div className='row'>
                    <div className='col-sm-4'>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='AF'
                          id='dt_af'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("AF")}
                        />
                        <label className='form-check-label' htmlFor='dt_af'>
                          Autofluorescence Microscopy
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='ATACseq-bulk'
                          id='dt_atacseqbulk'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("ATACseq-bulk")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_atacseqbulk'
                        >
                          ATACseq(Bulk)
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='MxIF'
                          id='dt_mxif'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has(
                            "MxIF"
                          )}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_mxif'
                        >
                          Multiplexex Immunofluorescence Microscopy
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='CODEX'
                          id='dt_codex'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("CODEX")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_codex'
                        >
                          CODEX
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='IMC'
                          id='dt_imc'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("IMC")}
                        />
                        <label className='form-check-label' htmlFor='dt_imc'>
                            Imaging Mass Cytomtry
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='MALDI-IMS-neg'
                          id='dt_maldiimsneg'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("MALDI-IMS-neg")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_maldiimsneg'
                        >
                          MALDI IMS neg
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='MALDI-IMS-pos'
                          id='dt_maldiimspos'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("MALDI-IMS-pos")}
                        />
                        <label className='form-check-label' htmlFor='dt_maldiimspos'>
                          MALDI IMS pos
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='PAS'
                          id='dt_pas'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("PAS")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_nanopots'
                        >
                          PAS Stained Microscopy
                        </label>
                      </div>
                    </div>
                    <div className='col-sm-4'>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='bulk-RNA'
                          id='dt_bulkrna'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("bulk-RNA")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_bulkrna'
                        >
                          bulk-RNA
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='SNAREseq'
                          id='dt_snareseq'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("SNAREseq")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_snareseq'
                        >
                          SNAREseq
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='TMT-LC-MS'
                          id='dt_tmtlcms'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("TMT-LC-MS")}
                        />
                        <label className='form-check-label' htmlFor='dt_tmtlcms'>
                          TMT LC-MS
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='Targeted-Shotgun-LC-MS'
                          id='dt_targetedshotgunlcms'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("Targeted-Shotgun-LC-MS")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_targetedshotgunlcms'
                        >
                          Targeted Shotgun / Flow-injection LC-MS
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='LC-MS-untargeted'
                          id='dt_lcmsuntargeted'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("LC-MS-untargeted")}
                        />
                        <label className='form-check-label' htmlFor='dt_lcmsuntargeted'>
                          Untargeted LC-MS
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='WGS'
                          id='dt_wgs'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("WGS")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_wgs'
                        >
                          Whole Genome Sequencing
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='scRNA-Seq-10x'
                          id='dt_scrnaseq10x'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("scRNA-Seq-10x")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_scrnaseq10x'
                        >
                          scRNA-Seq(10xGenomics)
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='sciATACseq'
                          id='dt_sciatacseq'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("sciATACseq")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_sciatacseq'
                        >
                          sciATAseq
                        </label>
                      </div>
                    </div>
                    <div className='col-sm-4'>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='sciRNAseq'
                          id='dt_scirnaseq'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("sciRNAseq")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_scirnaseq'
                        >
                          sciRNAseq
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='seqFish'
                          id='dt_seqfish'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("seqFish")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_seqfish'
                        >
                          seqFish
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='snATACseq'
                          id='dt_snatacseq'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("snATACseq")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_snatacseq'
                        >
                          snATACseq
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='snRNAseq'
                          id='dt_snranseq'
                          onClick={this.handleInputChange}
                          checked={this.state.data_types.has("snRNAseq")}
                        />
                        <label
                          className='form-check-label'
                          htmlFor='dt_snrnaseq'
                        >
                          snRNAseq
                        </label>
                      </div>
                      <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='dt_other'
                          id='dt_other'
                          onClick={this.handleInputChange}
                          checked={this.state.other_datatype}
                        />
                        <label className='form-check-label' htmlFor='dt_other'>
                          Other
                        </label>
                      </div>
                      {this.state.other_datatype && (
                        <div className='form-group'>
                          <input
                            type='text'
                            name='other_dt'
                            id='other_dt'
                            className={
                              "form-control " +
                              this.errorClass(this.state.formErrors.other_dt)
                            }
                            placeholder='Other Data Type'
                            value={this.state.other_dt}
                            onChange={this.handleInputChange}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='col-sm-12'>
                    {this.state.formErrors.data_types && (
                      <p className='text-danger'>
                        At least select one data type
                      </p>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )}
            {this.props.readOnly && (
              <div className='col-sm-9 col-form-label'>
                <p>Readonly</p>
              </div>
            )}
            <div className='col-sm-1 my-auto text-center'>
              <span>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='datatype_tooltip'
                />
                <ReactTooltip
                  id='datatype_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <h4>Data Type Tips</h4>
                </ReactTooltip>
              </span>
            </div>
          </div>
          <div className='form-group row'>
            <label
              htmlFor='description'
              className='col-sm-2 col-form-label text-right'
            >
              Description
            </label>
            {!this.props.readOnly && (
              <React.Fragment>
                <div className='col-sm-9'>
                  <textarea
                    type='text'
                    name='description'
                    id='description'
                    cols='30'
                    rows='5'
                    className='form-control'
                    placeholder='Description'
                    onChange={this.handleInputChange}
                    value={this.state.description}
                  />
                </div>
              </React.Fragment>
            )}
            {this.props.readOnly && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.description}</p>
              </div>
            )}
            <div className='col-sm-1 my-auto text-center'>
              <span>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='description_tooltip'
                />
                <ReactTooltip
                  id='description_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <h4>Description Tips</h4>
                </ReactTooltip>
              </span>
            </div>
          </div>
          {this.state.submit_error && (
            <div className='alert alert-danger col-sm-12' role='alert'>
              Oops! Something went wrong. Please contact administrator for help.
            </div>
          )}
          {this.state.is_curator !== null && this.renderButtons()}
        </form>
        <HIPPA show={this.state.show} handleClose={this.hideModal} />
        <Modal
          show={this.state.errorMsgShow}
          handleClose={this.hideErrorMsgModal}
        >
          <div className="row">
            <div className="col-sm-12 text-center alert">
              <h4>{(this.props.editingDataset && this.props.editingDataset.properties.status.toUpperCase()) || "STATUS"}</h4>
              <div dangerouslySetInnerHTML={{__html: this.state.statusErrorMsg}}></div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default DatasetEdit;
