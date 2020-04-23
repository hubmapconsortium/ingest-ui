import React, { Component } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import {
  validateRequired,
  validateProtocolIODOI,
  validateFileType
} from "../../../utils/validators";
import check from './check25.jpg';
import { getFileNameOnPath } from "../../../utils/file_helper";
import { flattenSampleType } from "../../../utils/constants_helper";
import { truncateString } from "../../../utils/string_helper";
import ReactTooltip from "react-tooltip";
import Protocol from "./protocol";
import IDSearchModal from "./idSearchModal";
import GroupModal from "../groupModal";
import { SAMPLE_TYPES, ORGAN_TYPES } from "../../../constants";
import ImageUpload from "../donor_form_components/imageUpload";
import MetadataUpload from "../metadataUpload";
import LabIDsModal from "../labIdsModal";
import RUIModal from "./ruiModal";
import RUIIntegration from "./ruiIntegration";

class TissueForm extends Component {
  state = {
    lab: "",
    lab_tissue_id: "",
    protocols: [
      {
        id: 1,
        ref: React.createRef()
      }
    ],
	
    protocol: "",
    protocol_file: "",
    specimen_type: "",
    specimen_type_other: "",
    source_uuid: "",
    organ: "",
    organ_other: "",
    visit: "",
    description: "",
    metadata: "",
    metadata_file: "",
    multiple_id: false,
	rui_check: false,
	rui_view: false,
	rui_hide: true,
	rui_click: false,
	rui_location: "",
    sample_count: "",
    protocol_file_name: "Choose a file",
    metadata_file_name: "Choose a file",

    metadatas: [],
    images: [],

    groups: [],
    selected_group: "",

    formErrors: {
      lab: "",
      // lab_tissue_id: "",
      protocols: "",
      protocol: "",
      protocol_file: "",
      specimen_type: "",
      specimen_type_other: "",
      organ: "",
      organ_other: "",
      visit: "",
      source_uuid: "",
      description: "",
      metadata: "",
      metadata_file: "",
      multiple_id: "",
	  rui_check: "",
	  rui_view: "",
      sample_count: ""
    }
  };


  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element   
	this.protocolFile = React.createRef();
    this.protocol = React.createRef();
  }

  handleRUIJson = (dataFromChild) => {
        this.setState({ 
			rui_location: dataFromChild,
			rui_check: true,
			rui_view: true
		});
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
      axios
        .get(
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${this.props.editingEntity.uuid}/siblingids`,
          config
        )
        .then(res => {
          if (res.data.siblingid_list.length > 0) {
            res.data.siblingid_list.push({
              hubmap_identifier: this.props.editingEntity.hubmap_identifier,
              uuid: this.props.editingEntity.uuid,
              lab_tissue_id: this.props.editingEntity.properties.lab_tissue_id || "",
              rui_location: this.props.editingEntity.properties.rui_location || ""
            });
            res.data.siblingid_list.sort((a, b) => {
              if (
                parseInt(
                  a.hubmap_identifier.substring(
                    a.hubmap_identifier.lastIndexOf("-") + 1
                  )
                ) >
                parseInt(
                  b.hubmap_identifier.substring(
                    a.hubmap_identifier.lastIndexOf("-") + 1
                  )
                )
              ) {
                return 1;
              }
              if (
                parseInt(
                  b.hubmap_identifier.substring(
                    a.hubmap_identifier.lastIndexOf("-") + 1
                  )
                ) >
                parseInt(
                  a.hubmap_identifier.substring(
                    a.hubmap_identifier.lastIndexOf("-") + 1
                  )
                )
              ) {
                return -1;
              }
              return 0;
            });

            this.setState({
              entities: this.props.editingEntities,
              ids: res.data.siblingid_list,
			  multiple_id: this.props.editingEntities.length > 1 ? true: false
            });
            const first_lab_id = res.data.siblingid_list[0].hubmap_identifier;
            const last_lab_id =
              res.data.siblingid_list[res.data.siblingid_list.length - 1]
                .hubmap_identifier;

            if (first_lab_id !== null) {
              this.setState({
                editingMultiWarning: `Editing affects the ${
                  res.data.siblingid_list.length
                } ${
                  flattenSampleType(SAMPLE_TYPES)[
                    this.props.editingEntity.properties.specimen_type
                  ]
                } samples ${first_lab_id} through ${last_lab_id} that were created at the same time`
              });
            }
          }
        })
        .catch(err => {
          if (err.response === undefined) {
          } else if (err.response.status === 401) {
            localStorage.setItem("isAuthenticated", false);
            window.location.reload();
          }
        });

      let protocols_json = JSON.parse(
        this.props.editingEntity.properties.protocols
          .replace(/\\/g, "\\\\")
          .replace(/'/g, '"')
      );

      protocols_json.map((p, i) => {
        p["id"] = i + 1;
        p["ref"] = React.createRef();
        return p;
      });
	  
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

      this.setState(
        {
          author: this.props.editingEntity.properties.provenance_user_email,
          lab_tissue_id: this.props.editingEntity.properties.lab_tissue_id,
          rui_location: this.props.editingEntity.properties.rui_location || "",
		  protocols: protocols_json,
          protocol: this.props.editingEntity.properties.protocol,
          protocol_file_name: getFileNameOnPath(
            this.props.editingEntity.properties.protocol_file
          ),
          specimen_type: this.props.editingEntity.properties.specimen_type,
          specimen_type_other: this.props.editingEntity.properties
            .specimen_type_other,
          organ: this.props.editingEntity.properties.organ,
          visit: this.props.editingEntity.properties.visit,
          source_uuid: this.props.editingEntity.properties.source_uuid,
          description: this.props.editingEntity.properties.description,
          metadata_file_name: getFileNameOnPath(
            this.props.editingEntity.properties.metadata_file
          )
        },
        () => {
          if (this.state.source_uuid !== undefined) {
            this.validateUUID();
          }
        }
      );
    } else {
      this.setState(
        {
          specimen_type: this.props.specimenType,
          source_uuid: this.props.sourceUUID
        },
        () => {
          if (this.state.source_uuid !== undefined) {
            this.validateUUID();
          }
        }
      );
    }
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "lab":
        this.setState({ lab: value });
        if (validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab: "required" }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab: "" }
          }));
        }
        break;
      case "lab_tissue_id":
        this.setState({ lab_tissue_id: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab_tissue_id: "required" }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, lab_tissue_id: "" }
          }));
        }
        break;
	  case "rui":
        this.setState({ rui: value });
        if (
          !validateRequired(value)
        ) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              rui: "required"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              rui: ""
            }
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
              protocol: "Please enter a valid protocols.io URL"
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
      case "specimen_type":
        this.setState({ specimen_type: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, specimen_type: "required" }
          }));
        } else if (value === "other") {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              specimen_type_other: ""
            }
          }));
        } else {
          if (value !== "organ") {
            this.setState({ organ: "" });
          } else {
            this.setState({
              multiple_id: false,
              sample_count: ""
            });
          }
          this.setState(prevState => ({
            specimen_type_other: "",
            formErrors: { ...prevState.formErrors, specimen_type: "" }
          }));
        }
        break;
      case "specimen_type_other":
        this.setState({ specimen_type_other: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              specimen_type_other: "required"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, specimen_type_other: "" }
          }));
        }
        break;
      case "source_uuid":
          this.setState({ source_uuid: value });
        // // const patt = new RegExp("^[^-]{3}$|^[^-]{3}-[^-]{4}$");
        // // if (patt.test(value)) {
        // //   this.setState({ source_uuid: value + "-" });
        // // }
        // if (!validateRequired(value)) {
        //   this.setState(prevState => ({
        //     formErrors: {
        //       ...prevState.formErrors,
        //       source_uuid: "required"
        //     }
        //   }));
        // } else {
        //   this.setState(prevState => ({
        //     formErrors: { ...prevState.formErrors, source_uuid: "" }
        //   }));
        // }
        break;
      case "organ":
        this.setState({ organ: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, organ: "required" }
          }));
        } else if (value === "other") {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              organ_other: ""
            }
          }));
        } else {
          this.setState(prevState => ({
            organ_other: "",
            formErrors: { ...prevState.formErrors, organ: "" }
          }));
        }
        break;
      case "organ_other":
        this.setState({ organ_other: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              organ_other: "required"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, organ_other: "" }
          }));
        }
        break;
      case "visit":
        this.setState({ visit: value });
        break;
      case "description":
        this.setState({ description: value });
        break;
      case "metadata":
        this.setState({ metadata: value });
        break;
      case "metadata_file":
        this.setState({
          metadata_file: e.target.files[0],
          metadata_file_name: e.target.files[0] && e.target.files[0].name
        });
        break;
      case "groups":
        this.setState({
          selected_group: value
        });
        break;
      case "multipleID":
        this.setState({
          multiple_id: e.target.checked
        });
        if(!e.target.checked){
          this.setState({
            sample_count: ""
          })
        }
        break;
      case "sample_count":
        this.setState({
          sample_count: value
        });
        break;
      default:
        break;
    }
  };
  
  
  trigerAddViewState = () => {
    this.setState({
       ...this.State,
       rui_check: true,
       rui_view:true
    })
  }

  openRUIModalHandler = () => {
        this.setState({
            rui_show: true
        });
  }

  closeRUIModalHandler = () => {
        this.setState({
            rui_show: false
        });
  }

  handleAddRUILocation = e => {
    this.setState({
		rui_click:true,
	});
  };
  
  handleViewRUIClick = e => {
	  this.setState({
        rui_view: true,
 		rui_show: true,
		rui_hide: false	
      });
  };
	  
  handleClose = e => {
	this.setState({
 		rui_show: false,
		rui_hide: true
      });
  };
    
  handleSourceUUIDKeyDown = e => {
    const value = e.target.value;
    if (e.key === "Backspace") {
      const patt = new RegExp("^.{3}-$|^.{3}-.{4}-$");
      if (patt.test(value)) {
        this.setState({ source_uuid: value.substring(0, value.length - 1) });
      }
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
    this.validateForm().then(isValid => {
      if (isValid) {
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
            entitytype: "Sample",
            lab_tissue_id: this.state.lab_tissue_id,
            protocol: this.state.protocol,
            protocol_file:
              this.state.protocol_file_name === "Choose a file"
                ? ""
                : this.state.protocol_file_name,
			rui_location: this.state.rui_location,
            specimen_type: this.state.specimen_type,
            specimen_type_other: this.state.specimen_type_other,
            source_uuid: this.state.source_uuid,
            organ: this.state.organ,
            organ_other: this.state.organ_other,
            visit: this.state.visit,
            sample_count: this.state.sample_count,
            description: this.state.description,
            metadata: this.state.metadata,
            metadata_file:
              this.state.metadata_file_name === "Choose a file"
                ? ""
                : this.state.metadata_file_name,
            protocols: [],
            images: [],
            metadatas: []
          };
          if (this.state.selected_group) {
            data["user_group_uuid"] = this.state.selected_group;
          }

          var formData = new FormData();
          formData.append("protocol_file", this.state.protocol_file);
          formData.append("metadata_file", this.state.metadata_file);
		  this.state.protocols.forEach(i => {
            if (
              i.ref.current.protocol_doi.current.value ||
              i.ref.current.protocol_file.current.files[0]
            ) {
              data.protocols.push({
                id: "protocol_" + i.id,
                protocol_doi: i.ref.current.protocol_doi.current.value,
                protocol_file: i.ref.current.protocol_file.current.files[0]
                  ? i.ref.current.protocol_file.current.files[0].name
                  : ""
              });
              formData.append(
                "protocol_" + i.id,
                i.ref.current.protocol_file.current.files[0]
              );
            } else {
              data.protocols.push({
                id: "protocol_" + i.id,
                protocol_doi: i.protocol_doi,
                protocol_file: i.protocol_file
              });
            }
          });
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
                description: i.description
              });
            }
          });

          formData.append("data", JSON.stringify(data));

          const config = {
            headers: {
              Authorization:
                "Bearer " +
                JSON.parse(localStorage.getItem("info")).nexus_token,
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
                this.setState({ submit_error: true });
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
                this.setState({ submit_error: true });
              });
          }
        }
      }
    });
  };

  validateUUID = () => {
    let isValid = true;
    const uuid = this.state.source_uuid;
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
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${uuid}`,
          config
        )
        .then(res => {
          if (res.data) {
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
            <div className="col-sm-4 offset-sm-2 text-center">
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
          <div className="col-sm-4 offset-sm-2 text-center">
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

  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;

      const usedFileName = new Set();
      this.state.protocols.forEach((protocol, index) => {
        if (protocol.protocol_file !== "") {
          usedFileName.add(getFileNameOnPath(protocol.protocol_file));
        }
        if (!protocol.ref.current.validate()) {
          isValid = false;
        }

        if (protocol.ref.current.protocol_file.current.files[0]) {
          if (
            usedFileName.has(
              protocol.ref.current.protocol_file.current.files[0].name
            )
          ) {
            protocol["error"] = "Duplicated file name is not allowed.";
            isValid = false;
          }
        }
      });

      if (!validateRequired(this.state.specimen_type)) {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, specimen_type: "required" }
        }));
        isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, specimen_type: "" }
        }));
      }

      if (
        this.state.specimen_type === "other" &&
        !validateRequired(this.state.specimen_type_other)
      ) {
        this.setState(prevState => ({
          formErrors: {
            ...prevState.formErrors,
            specimen_type_other: "required"
          }
        }));
        isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, specimen_type_other: "" }
        }));
      }

      if (
        this.state.specimen_type === "organ" &&
        !validateRequired(this.state.organ)
      ) {
        this.setState(prevState => ({
          formErrors: {
            ...prevState.formErrors,
            organ: "required"
          }
        }));
        isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, organ: "" }
        }));
      }

      if (
        this.state.organ === "OT" &&
        !validateRequired(this.state.organ_other)
      ) {
        this.setState(prevState => ({
          formErrors: {
            ...prevState.formErrors,
            organ_other: "required"
          }
        }));
        isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, organ_other: "" }
        }));
      } 

      this.state.images.forEach((image, index) => {
        if (
          !validateRequired(image.file_name) &&
          !validateRequired(image.ref.current.image_file.current.value)
        ) {
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
        // Creating
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

  handleAddProtocol = () => {
    let newId = 1;
    if (this.state.protocols.length > 0) {
      newId = this.state.protocols[this.state.protocols.length - 1].id + 1;
    }
    this.setState({
      protocols: [
        ...this.state.protocols,
        { id: newId, ref: React.createRef() }
      ]
    });
  };

  handleRemoveProtocol = id => {
    const protocols = this.state.protocols.filter(i => i.id !== id);
    this.setState({
      protocols
    });
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

  hideGroupSelectModal = () => {
    this.setState({
      GroupSelectShow: false
    });
  };

  handleSelectClick = ids => {
    this.setState(
      {
        source_uuid: ids[0].hubmap_identifier,
        LookUpShow: false
      },
      () => {
        this.validateUUID();
      }
    );
  };

  handleEditLabIDs = () => {
    this.setState({ LabIDsModalShow: true });
  };

  hideLabIDsModal = () => {
    this.setState({ LabIDsModalShow: false });
  };

  handleLabIdsUpdate = e => {
    let new_ids = [];
    this.state.entities.map(id => {
      return new_ids.push({
        hubmap_identifier: id.hubmap_identifier,
        uuid: id.uuid,
        lab_tissue_id: id.properties.lab_tissue_id,
        rui_location: id.properties.rui_location,
		update: id.properties.rui_location ? true : false
      });
    });
    this.setState({
      ids: new_ids,
      LabIDsModalShow: true
    });
  };

  render() {
    return (
      <div className="row">
        {this.props.editingEntity && (
          <React.Fragment>
            <div className="col-sm-6 offset-sm-2">
              <h4 className="display-5">{this.props.displayId}</h4>
            </div>
            <div className="col-sm-4 text-right">
              Created by: {this.state.author}
            </div>
          </React.Fragment>
        )}
        {this.state.editingMultiWarning && !this.props.readOnly && (
          <div className="alert alert-danger col-sm-12" role="alert">
            {this.state.editingMultiWarning}
          </div>
        )}
        <div className="col-sm-12">
          <form onSubmit={this.handleSubmit}>
            <div className="form-group row">
              <label
                htmlFor="source_uuid"
                className="col-sm-2 col-form-label text-right"
              >
                Source HuBMAP ID <span className="text-danger">*</span>
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
                      value={this.state.source_uuid || ''}
                      onChange={this.handleInputChange}
                      onFocus={this.handleLookUpClick}
                      autoComplete='off'
                    />
                  </div>
                  <div className="col-sm-4">
                    <button
                      className="btn btn-link"
                      type="button"
                      onClick={this.handleLookUpClick}
                    >
                      Look up
                    </button>
                  </div>
                  {/* <div className="col-sm-2">
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
                                  this.state.source_entity.specimen
                                    .hubmap_identifier
                                }
                              </span>
                            </b>
                          </h4>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-sm-6">
                          <b>type:</b>{" "}
                          {this.state.source_entity.specimen.specimen_type
                            ? flattenSampleType(SAMPLE_TYPES)[
                                this.state.source_entity.specimen.specimen_type
                              ]
                            : this.state.source_entity.specimen.entitytype}
                        </div>
                        <div className="col-sm-6">
                          <b>name:</b> {this.state.source_entity.specimen.label}
                        </div>
                        {this.state.source_entity.specimen.specimen_type ===
                          "organ" && (
                          <div className="col-sm-12">
                            <b>Organ Type:</b>{" "}
                            {
                              ORGAN_TYPES[
                                this.state.source_entity.specimen.organ
                              ]
                            }
                          </div>
                        )}
                        <div className="col-sm-6">
                          <b>HuBMAP ID:</b>{" "}
                          {this.state.source_entity.specimen.display_doi}
                        </div>
                        <div className="col-sm-12">
                          <p>
                            <b>Description: </b>{" "}
                            {truncateString(
                              this.state.source_entity.specimen.description,
                              230
                            )}
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
                htmlFor="specimen_type"
                className="col-sm-2 col-form-label text-right"
              >
                Tissue Sample Type <span className="text-danger">*</span>
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className="col-sm-6">
                    <select
                      name="specimen_type"
                      id="specimen_type"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.specimen_type)
                      }
                      onChange={this.handleInputChange}
                      value={this.state.specimen_type}
                    >
                      <option value="">----</option>
                      {SAMPLE_TYPES.map((optgs, index) => {
                        return (
                          <optgroup
                            key={index}
                            label="____________________________________________________________"
                          >
                            {Object.entries(optgs).map(op => {
                              if (op[0] === "organ") {
                                if (
                                  this.state.source_entity &&
                                  this.state.source_entity.specimen
                                    .entitytype === "Donor"
                                ) {
                                  return (
                                    <option key={op[0]} value={op[0]}>
                                      {op[1]}
                                    </option>
                                  );
                                } else {
                                  return null;
                                }
                              } else {
                                return (
                                  <option key={op[0]} value={op[0]}>
                                    {op[1]}
                                  </option>
                                );
                              }
                            })}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>
                  
                  <div className="col-sm-3">
				    {this.state.specimen_type === "other" && (
                      <input
                        type="text"
                        name="specimen_type_other"
                        placeholder="Please specify"
                        className={
                          "form-control " +
                          this.errorClass(
                            this.state.formErrors.specimen_type_other
                          )
                        }
                        id="specimen_type_other"
                        onChange={this.handleInputChange}
                        value={this.state.specimen_type_other}
                      />
                    )}  
				  </div> 
                </React.Fragment>
              )}
              {this.props.readOnly && (
                <React.Fragment>
                  <div className="col-sm-9 col-form-label">
                    <p>
                      {
                        flattenSampleType(SAMPLE_TYPES)[
                          this.state.specimen_type
                        ]
                      }{" "}
                      {this.state.specimen_type_other &&
                        " - " + this.state.specimen_type_other}
                    </p>
                  </div>
                </React.Fragment>
              )}
              <div className="col-sm-1 my-auto text-center">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for="specimen_type_tooltip"
                />
                <ReactTooltip
                  id="specimen_type_tooltip"
                  place="top"
                  type="info"
                  effect="solid"
                >
                  <h4>The type of specimen.</h4>
                </ReactTooltip>
              </div>
            </div>
            {this.state.specimen_type === "organ" && (
              <div className="form-group row">
                <label
                  htmlFor="organ"
                  className="col-sm-2 col-form-label text-right"
                >
                  Organ <span className="text-danger">*</span>
                </label>
                {!this.props.readOnly && (
                  <React.Fragment>
                    <div className="col-sm-6">
                      <select
                        name="organ"
                        id="organ"
                        className={
                          "form-control " +
                          this.errorClass(this.state.formErrors.organ)
                        }
                        onChange={this.handleInputChange}
                        value={this.state.organ}
                      >
                        <option value="">----</option>
                        {Object.entries(ORGAN_TYPES).map((op, index) => {
                          return (
                            <option key={op[0]} value={op[0]}>
                              {op[1]}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    {this.state.organ === "OT" && (
                      <div className="col-sm-3">
                        <input
                          type="text"
                          name="organ_other"
                          placeholder="Please specify"
                          className={
                            "form-control " +
                            this.errorClass(this.state.formErrors.organ_other)
                          }
                          id="organ_other"
                          onChange={this.handleInputChange}
                          value={this.state.organ_other}
                        />
                      </div>
                    )}
                  </React.Fragment>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-9 col-form-label">
                    <p>
                      {this.state.organ === "OT"
                        ? this.state.organ_other
                        : ORGAN_TYPES[this.state.organ]}
                    </p>
                  </div>
                )}
              </div>
            )}
            {["organ", "biopsy"].includes(this.state.specimen_type) &&
              (!this.props.readOnly || this.state.visit !== undefined) && (
                <div className="form-group row">
                  <label
                    htmlFor="visit"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Visit
                  </label>
                  {!this.props.readOnly && (
                    <div className="col-sm-9">
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
              )}
            
			{this.state.protocols.map((protocol, index) => {
              return (
                <Protocol
                  key={protocol.id}
                  id={protocol.id}
                  ref={protocol.ref}
                  protocol={protocol}
                  error={protocol.error}
                  remove={this.handleRemoveProtocol}
                  readOnly={this.props.readOnly}
                />
              );
            })}
            {!this.props.readOnly && (
              <div className="form-group row">
                <div className="col-sm-8 offset-sm-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this.handleAddProtocol}
                  >
                    Add Protocol
                  </button>
                </div>
              </div>
            )}
            {!this.props.readOnly &&
              this.state.specimen_type !== "organ" &&
              !this.props.editingEntity && (
                <div className="form-group row">
                  <div className="col-sm-8 offset-sm-2">
                    <div className="form-group form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        name="multipleID"
                        id="multipleID"
                        onClick={this.handleInputChange}
                      />
                      <label className="form-check-label" htmlFor="multipleID">
                        Generate IDs for multiple{" "}
                        {this.state.specimen_type_other ||
                          flattenSampleType(SAMPLE_TYPES)[
                            this.state.specimen_type
                          ]}{" "}
                        samples
                      </label>
                    </div>
                  </div>
                  {this.state.multiple_id && (
                    <React.Fragment>
                      <div className="col-sm-4 offset-sm-2">
                        <input
                          type="number"
                          className={
                            "form-control " +
                            this.errorClass(this.state.formErrors.sample_count)
                          }
                          name="sample_count"
                          id="sample_count"
                          placeholder="Number of IDs to Generate"
                          min="1"
                          onChange={this.handleInputChange}
                        />
                      </div>
                      { this.state.source_entity && 
			            (this.state.source_entity.specimen.organ === "LK" ||
                        this.state.source_entity.specimen.organ === "RK") && (
	                      <div className="col-sm-4">
	                        <small>
	                          Lab IDs and Sample Locations can be assigned on the next screen after
	                          generating the HuBMAP IDs
	                        </small>
	                      </div>
	                  )}
	                  { this.state.source_entity && 
			            (this.state.source_entity.specimen.organ !== "LK" &&
                         this.state.source_entity.specimen.organ !== "RK") && (
	                      <div className="col-sm-4">
	                        <small>
	                          Lab IDs can be assigned on the next screen after
	                          generating the HuBMAP IDs
	                        </small>
	                      </div>
	                  )}
                    </React.Fragment>
                  )}
                </div>
             )}
            { !this.state.multiple_id &&
              !this.state.editingMultiWarning &&
              (!this.props.readOnly ||
                this.state.lab_tissue_id !== undefined) && (
                
				<div className="form-group row">
                  <label
                    htmlFor="lab_tissue_id"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Lab Sample Id
                  </label>
                  {!this.props.readOnly && (
                    <div className="col-sm-9">
                      <input
                        type="text"
                        name="lab_tissue_id"
                        id="lab_tissue_id"
                        className="form-control"
                        placeholder="Lab specific Alpha-numeric id"
                        onChange={this.handleInputChange}
                        value={this.state.lab_tissue_id}
                      />
                    </div>
                  )}
                  {this.props.readOnly && (
                    <div className="col-sm-9 col-form-label">
                      <p>{this.state.lab_tissue_id}</p>
                    </div>
                  )}
                  <div className="col-sm-1 my-auto text-center">
                    <FontAwesomeIcon
                      icon={faQuestionCircle}
                      data-tip
                      data-for="lab_tissue_id_tooltip"
                    />
                    <ReactTooltip
                      id="lab_tissue_id_tooltip"
                      place="top"
                      type="info"
                      effect="solid"
                    >
                      <h4>
                        An identifier used by the lab to identify the specimen,
                        this can be an identifier from the system <br />
                        used to track the specimen in the lab. This field will
                        be entered by the user.
                      </h4>
                    </ReactTooltip>
                  </div>
                </div> 
                )        
            }
          
            {this.props.editingEntity && this.props.editingEntities.length > 1 && 
              this.props.editingEntity.properties.rui_location === "" && (
              <React.Fragment>
                <div className="form-group row">
                  <label
                    htmlFor="lab_tissue_id"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Lab Sample Id
                  </label>
                  <div className="col-sm-9">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={this.handleEditLabIDs}
                      disabled={this.props.readOnly}
                    >
                      Edit Lab IDs
                    </button>
                  </div>
                </div>
                <LabIDsModal
                  show={this.state.LabIDsModalShow}
                  hide={this.hideLabIDsModal}
                  ids={this.state.ids}
                  update={this.handleLabIdsUpdate}
                />
              </React.Fragment>
            )}
            {this.props.editingEntity && this.props.editingEntities.length > 1 &&
             this.props.editingEntity.properties.rui_location !== "" && (
              <React.Fragment>
                <div className="form-group row">
                  <label
                    htmlFor="lab_tissue_id"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Lab Sample Id
                  </label>
                  <div className="col-sm-9">
                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={this.handleLabIdsUpdate}
                      disabled={this.props.readOnly}
                    >
                      Edit Sample IDs and Locations
                    </button>
                  </div>
                </div>
                <LabIDsModal
                  show={this.state.LabIDsModalShow}
                  hide={this.hideLabIDsModal}
                  ids={this.state.ids}
                  update={this.handleLabIdsUpdate}
                />
              </React.Fragment>
            )}
			{ !this.props.editingEntity &&
			  !this.state.multiple_id &&
              this.state.source_entity && 
			  (this.state.source_entity.specimen.organ === "LK" ||
               this.state.source_entity.specimen.organ === "RK" ) && 
               (
			  <div className="form-group row">    
				<label                                                                                                   
				  htmlFor="location"
				  className="col-sm-2 col-form-label text-right"
				>
				  Sample Location
				</label>
				<div className="col-sm-4 text-center">
				  <button
					type="button"
					onClick={this.handleAddRUILocation}
					className="btn btn-primary btn-block"
				  >
					Register Location
				  </button>
				</div>
				{ this.state.rui_click && (
				  <RUIIntegration handleJsonRUI= {this.handleRUIJson} />
				)}
				
				{ this.state.rui_check && (
				  <React.Fragment>
					<div className="col-sm-1 checkb">
					  <img src={check}
						   alt="check"
						   className="check"/>
					</div>
					<div className="col-sm-2">
					   <button
							 className="btn btn-link"
							 type="button"
							 onClick={this.openRUIModalHandler}
						   >
						   View Location
						   </button>
					</div>
					<RUIModal
                      className="Modal"
                      show={this.state.rui_show}
                      handleClose={this.closeRUIModalHandler}> 
                       {this.state.rui_location}  
                    </RUIModal>
					<div className="col-sm-2">
					</div>
				  </React.Fragment>
				)}
				{ !this.state.rui_check && (
				  <div className="col-sm-5">
				  </div>
				)}
				  
				<div className="col-sm-1 my-auto text-center">
				  <span>
					<FontAwesomeIcon
						icon={faQuestionCircle}
						data-tip
						data-for="rui_tooltip"
					/>
					<ReactTooltip
						id="rui_tooltip"
						place="top"
						type="info"
						effect="solid"
					>
					<h4>
						Provide formatted location data from <br />
						CCF Location Registration Tool for <br />
						this sample. 
					</h4>
					</ReactTooltip>
				  </span>
			    </div>
				
			   
			  </div>	
			)}
			 { this.props.editingEntity &&
				!this.state.multiple_id &&
              this.state.source_entity && 
			  (
			  <div className="form-group row">    
				<label                                                                                                   
				  htmlFor="location"
				  className="col-sm-2 col-form-label text-right"
				>
				  Sample Location
				</label>
				
				  <React.Fragment>
					
					<div className="col-sm-3">
					   <button
							 className="btn btn-link"
							 type="button"
							 onClick={this.openRUIModalHandler}
						   >
						   View Location
						   </button>
					</div>
					<RUIModal
                      className="Modal"
                      show={this.state.rui_show}
                      handleClose={this.closeRUIModalHandler}> 
                       { this.props.editingEntity.properties.rui_location}
                    </RUIModal>
					<div className="col-sm-2">
					</div>
				  </React.Fragment>
				
				
				<div className="col-sm-4 text-center">
				  <button
					type="button"
					onClick={this.handleAddRUILocation}
					className="btn btn-primary btn-block"
				  >
					Modify Location Information
				  </button>
				</div>
				{ this.state.rui_click && (
				   <RUIIntegration handleJsonRUI= {this.handleRUIJson} />
	            )}
				<div className="col-sm-1 my-auto text-center">
				  <span>
					<FontAwesomeIcon
						icon={faQuestionCircle}
						data-tip
						data-for="rui_tooltip"
					/>
					<ReactTooltip
						id="rui_tooltip"
						place="top"
						type="info"
						effect="solid"
					>
					<h4>
						Provide formatted location data from <br />
						CCF Location Registration Tool for <br />
						this sample. 
					</h4>
					</ReactTooltip>
				  </span>
			    </div>
				 
			  </div>	
			)}
            {(!this.props.readOnly || this.state.description !== undefined) && (
              <div className="form-group row">
                <label
                  htmlFor="description"
                  className="col-sm-2 col-form-label text-right"
                >
                  Description
                </label>
                {!this.props.readOnly && (
                  <div className="col-sm-9">
                    <textarea
                      name="description"
                      id="description"
                      cols="30"
                      rows="5"
                      className="form-control"
                      value={this.state.description}
                      onChange={this.handleInputChange}
                    />
                  </div>
                )}
                {this.props.readOnly && (
                  <div className="col-sm-9 col-form-label">
                    <p>{truncateString(this.state.description, 250)}</p>
                  </div>
                )}
                <div className="col-sm-1 my-auto text-center">
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
                    <h4>A free text description of the specimen.</h4>
                  </ReactTooltip>
                </div>
              </div>
            )}
            <div className="form-group row d-none">
              <label
                htmlFor="metadata"
                className="col-sm-2 col-form-label text-right"
              >
                Metadata
              </label>
              {!this.props.readOnly && (
                <div className="col-sm-9">
                  <textarea
                    name="metadata"
                    id="metadata"
                    cols="30"
                    rows="5"
                    className="form-control"
                    value={this.state.metadata}
                    onChange={this.handleInputChange}
                  />
                </div>
              )}
              {this.props.readOnly && (
                <div className="col-sm-9 col-form-label">
                  <p>{this.state.metadata}</p>
                </div>
              )}
              <div className="col-sm-1 my-auto text-center">
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
                    Metadata describing the specimen. <br />
                    This could be typed in (or copy/pasted) or an uploaded file
                    such as a spreadsheet.
                  </h4>
                </ReactTooltip>
              </div>
            </div>
            {(!this.props.readOnly || this.state.metadatas.length > 0) && (
              <div className="form-group row">
                <label
                  htmlFor="metadata"
                  className="col-sm-2 col-form-label text-right"
                >
                  Metadata
                </label>
                <div className="col-sm-9">
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
                  className="col-sm-2 col-form-label text-right"
                >
                  Image
                </label>
                <div className="col-sm-9">
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
        <GroupModal
          show={this.state.GroupSelectShow}
          hide={this.hideGroupSelectModal}
          groups={this.state.groups}
          submit={this.handleSubmit}
          handleInputChange={this.handleInputChange}
        />
      </div>
    );
  }
}

export default TissueForm;
