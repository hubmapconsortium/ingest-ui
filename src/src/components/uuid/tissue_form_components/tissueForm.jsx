import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Snackbar from '@material-ui/core/Snackbar';
//import SnackbarContent from '@material-ui/core/SnackbarContent';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faUserShield,
  faTimes,
  faSearch, faPaperclip, faAngleDown
} from "@fortawesome/free-solid-svg-icons";
import {
  validateRequired,
  validateProtocolIODOI
//  validateFileType
} from "../../../utils/validators";
import { tsToDate } from "../../../utils/string_helper";
import check from './check25.jpg';
//import { getFileNameOnPath, getFileMIMEType } from "../../../utils/file_helper";
import { flattenSampleType } from "../../../utils/constants_helper";
import { truncateString, parseErrorMessage } from "../../../utils/string_helper";
import ReactTooltip from "react-tooltip";
//import Protocol from "./protocol";
import Modal from "../modal";
import SearchComponent from "../../search/SearchComponent";
//import IDSearchModal from "./idSearchModal";
import GroupModal from "../groupModal";
import { SAMPLE_TYPES, TISSUE_TYPES, ORGAN_TYPES } from "../../../constants";
import ImageUpload from "../donor_form_components/imageUpload";
import MetadataUpload from "../metadataUpload";
//import LabIDsModa7l from "../labIdsModal";
import RUIModal from "./ruiModal";
import RUIIntegration from "./ruiIntegration";
import { entity_api_get_entity, 
    entity_api_update_entity, 
    entity_api_create_entity,
    entity_api_create_multiple_entities, 
    entity_api_get_entity_ancestor 
} from '../../../service/entity_api';
import { ingest_api_allowable_edit_states } from '../../../service/ingest_api';
// import { useHistory } from "react-router-dom";

class TissueForm extends Component {
  state = {
    lab: "",
    lab_tissue_id: "",
    back_btn_hide: false,
    param_uuid: "",
    protocol_url: "",
    entity_type: "",
    source_entity_type: "Donor",
    specimen_type: "",
    specimen_type_other: "",
    source_uuid: "",
    source_uuid_list: "",
    ancestor_organ: "",
    organ: "",
    organ_other: "",
    visit: "",
    description: "",
    metadata: "",
    metadata_file: "",
    LookUpShow: false,
    lookUpCancelled: false,
    multiple_id: false,
    rui_check: false,
    rui_view: false,
    rui_hide: true,
    rui_click: false,
    rui_show: false,
    rui_location: "",
    sample_count: "",
    protocol_file_name: "Choose a file",
    metadata_file_name: "Choose a file",

    metadatas: [],
    images: [],
    related_group_ids: [],

    new_metadatas: [],
    deleted_metas: [],
    new_images: [],
    deleted_images: [],
    groups: [],
    selected_group: "",
    error_message_detail: "",
    error_message: "Oops! Something went wrong. Please contact administrator for help.",
    setOpen: false,
    show_snack: false,
    show_dirty_warning: false,
    snackmessage: "", 
    isDirty: false,
    formErrors: {
      lab: "",
      // lab_tissue_id: "",
      // protocols: "",
      protocol_url: "",
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
  //   // create a ref to store the file Input DOM element   
  //   //this.protocolFile = React.createRef();
  //   //this.protocol = React.createRef();
  //   // this.handleSavedLocations = this.handleSavedLocations.bind(this);

  }

  handleRUIJson = (dataFromChild) => {
    this.setState({
      rui_location: dataFromChild,
      rui_check: true,
      rui_view: true,
      rui_click: false
    });
  };

  closeSnack = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState ({
      show_snack: false,
      show_dirty_warning: false,
      snackmessage: ""
    });
  };

  componentDidMount() {

    // let history = this.props.history;
    // //////console.debug('HISTORY', history)

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json"
      }
    };

    // THIS NEEDS MOVED TO CAPTURE AT THE START OF THE SESSION
    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then(res => {
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        ////////console.debug('groups', groups)
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


      ////////console.debug('PARAM', this.props)
      try {
          // if a parameter uuid was passed directly to the screen, then look it up and fill in data
        const param_uuid = this.props.match.params.uuid;
        //console.debug('PARAM WAS PASSED', param_uuid)
        entity_api_get_entity(param_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
          .then((response) => {
              if (response.status === 200) {
                let entity_data = response.results;
                // check to see if user can edit
                ingest_api_allowable_edit_states(param_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
                    .then((resp) => {
                        if (resp.status === 200) {
                          ////////console.debug('api_allowable_edit_states...');
                          ////////console.debug(resp.results);
                          let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
                          this.setState({
                            editingEntity: entity_data,
                            readOnly: read_only_state,   // used for hidding UI components
                            param_uuid: param_uuid 
                          }, () => {
                            this.checkForRelatedGroupIds(entity_data);
                            this.initialize();
                         
                            ////console.debug('PARAM ROUTINE', this.state);
                          }

                          );
                         
                        }         
                });
              }
        });

      } catch {  // no params were detected
        //console.debug('NO PARAM', this.props.editingEntity)
         this.setState({
          editingEntity: this.props.editingEntity
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.initialize();
            if (this.props.editingEntity) {
              this.checkForRelatedGroupIds(this.props.editingEntity);
            }
            //////console.debug('STATE', this.state)
        });
      }
    }

    initialize() {

      if (this.props.hideBackButton) { 
        this.hideBackButton();
      }

      if (this.state.editingEntity) {
        //console.debug('editingEntity', this.state.editingEntity)
        let images = this.state.editingEntity.image_files;
        let metadatas = this.state.editingEntity.metadata_files;
    
        const image_list = [];
        const metadata_list = [];

        // get any images that exist
        try {
          images.forEach((image, index) => {
            image_list.push({
              id: index + 1,
              ref: React.createRef(),
              file_name: image.filename,     
              description: image.description,
              file_uuid: image.file_uuid
            });
          });
        } catch {}

        try {
          // get the metadata files
          metadatas.forEach((metadata, index) => {
            metadata_list.push({
              id: index + 1,
              ref: React.createRef(),
              file_name: metadata.filename,
              file_uuid: metadata.file_uuid
            });
          });
        } catch {}

        this.setState(
          {
            source_uuid: this.getID(),
            source_entity: this.state.editingEntity.direct_ancestor,
            source_entity_type: this.state.editingEntity.direct_ancestor.entity_type,
            author: this.state.editingEntity.created_by_user_email,
            lab_tissue_id: this.state.editingEntity.lab_tissue_sample_id ? this.state.editingEntity.lab_tissue_sample_id : "",
            rui_location: JSON.stringify(this.state.editingEntity.rui_location, null, 3) || "",
            rui_check: JSON.stringify(this.state.editingEntity.rui_location, null, 3) ? true : false,
            // protocols: protocols_json,
            protocol_url: this.state.editingEntity.protocol_url,
            // protocol_file_name: getFileNameOnPath(
            //   this.state.editingEntity.properties.protocol_file
            // ),
            entity_type: this.state.editingEntity.entity_type,
            specimen_type: this.state.editingEntity.specimen_type, // this.determineSpecimenType(),
            specimen_type_other: this.state.editingEntity.specimen_type_other,
            organ: this.state.editingEntity.organ ? this.state.editingEntity.organ : this.state.editingEntity.direct_ancestor.organ,
            visit: this.state.editingEntity.visit ? this.state.editingEntity.visit : "",
            description: this.state.editingEntity.description ? this.state.editingEntity.description : "",
            images: image_list,
            metadatas: metadata_list
            
          } );

        this.getSourceAncestorOrgan(this.state.editingEntity);


      } else {
          this.setState(
            {
              specimen_type: this.props.specimenType,
              source_entity_type: this.props.source_entity_type ? this.props.source_entity_type : 'Donor',
              source_entity: this.props.direct_ancestor ? this.props.direct_ancestor : "",
              source_uuid: this.props.sourceUUID,   // this is the hubmap_id, not the uuid
              ancestor_organ: this.props.direct_ancestor ? this.props.direct_ancestor.organ : "",
              organ: this.props.direct_ancestor ? this.props.direct_ancestor.organ : "",
              source_uuid_list: this.props.uuid  // true uuid
            }
          // ,
          // () => {
          //   if (this.state.source_uuid !== undefined) {
          //     this.validateUUID();
          //   }idz
          // }
        );
          // if (this.props.ancestor_entity) {
          //     this.getSourceAncestorOrgan(this.props.ancestor_entity);
          // }
      }

  }

  checkForRelatedGroupIds(entity) {
         const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            "Content-Type": "application/json"
          }
      };

        axios
          .get(
            `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${entity.uuid}/ingest-group-ids`,
            config
          )
          .then(res => {
            if (res.data.ingest_group_ids.length > 0) {
              //////console.debug("pre siblingid_list", res.data.ingest_group_ids);
              
              res.data.ingest_group_ids.sort((a, b) => {
                if (
                  parseInt(
                    a.submission_id.substring(
                      a.submission_id.lastIndexOf("-") + 1
                    )
                  ) >
                  parseInt(
                    b.submission_id.substring(
                      a.submission_id.lastIndexOf("-") + 1
                    )
                  )
                ) {
                  return 1;
                }
                if (
                  parseInt(
                    b.submission_id.substring(
                      a.submission_id.lastIndexOf("-") + 1
                    )
                  ) >
                  parseInt(
                    a.submission_id.substring(
                      a.submission_id.lastIndexOf("-") + 1
                    )
                  )
                ) {
                  return -1;
                }
                return 0;
              });
                
              const first_lab_id = res.data.ingest_group_ids[0].submission_id; //this.props.editingEntities[0].submission_id;
              const last_lab_id = res.data.ingest_group_ids[res.data.ingest_group_ids.length-1].submission_id;  // this.props.editingEntities[this.props.editingEntities.length - 1].submission_id;
              //////console.debug('ingest_group_ids', res.data.ingest_group_ids);

              this.setState({
                  editingMultiWarning: `This sample is part of a group of ${res.data.ingest_group_ids.length} other 
                   ${flattenSampleType(SAMPLE_TYPES)[
                    entity.specimen_type
                    ]
                  } samples, ranging from ${first_lab_id} through ${last_lab_id}`,
                  //entities: this.props.editingEntities,
                  related_group_ids: res.data.ingest_group_ids
                  //multiple_id: true
              });
      

            //////console.debug("this.props.editingEntities.length", this.props.editingEntities.length);
            

            }
          })
          .catch(err => {
            if (err.response === undefined) {
            } else if (err.response.status === 401) {
              localStorage.setItem("isAuthenticated", false);
              window.location.reload();
            }
          });
  }

  handleMultiEdit(param_uuid) {
    if (this.state.isDirty) {

      this.setState({ 
          show_dirty_warning: true,
        });
   
    } else {
      entity_api_get_entity(param_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        .then((response) => {
            if (response.status === 200) {
              let entity_data = response.results;
              this.setState({
                  editingEntity: entity_data
              });
              // check to see if user can edit
              ingest_api_allowable_edit_states(param_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
                  .then((resp) => {
                      if (resp.status === 200) {
                        ////////console.debug('api_allowable_edit_states...');
                        ////////console.debug(resp.results);
                        let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
                        this.setState({
                          readOnly: read_only_state,   // used for hidding UI components
                          param_uuid: param_uuid , 
                          show_snack: true,
                          snackmessage: "Sample data was loaded",
                          show_dirty_warning: false,
                        }, () => {
                          this.checkForRelatedGroupIds(entity_data);
                          this.initialize();
                        }

                        );
                       
                      }         
              });
            }
      });
    }
  }
  // getEntity = (uuid) => {
      
  //     entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
  //     .then((response) => {
  //       if (response.status === 200) {
  //         let entity_data = response.results;

  //         // check to see if user can edit
  //         ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
  //           .then((resp) => {
  //           if (resp.status === 200) {
  //             let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
  //             this.setState({
  //               editingEntity: entity_data,
  //               readOnly: read_only_state   // used for hidding UI components
  //               });
  //           }
  //         });
  //       }
  //     });
  //   };

  getSourceAncestorOrgan(entity) {
    //var ancestor_organ = ""
    // check to see if we have an "top-level" ancestor 
      entity_api_get_entity_ancestor( entity.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        .then((response) => {
          if (response.status === 200) {
               //////console.debug('Entity ancestors...', response.results);
              if (response.results.length > 0) {
                  
                  ////////console.debug('Entity ancestors...ORGAN', ancestor_organ);
                  this.setState({
                    source_entity: response.results[0],
                    ancestor_organ: response.results[0].organ   // use "top" ancestor organ
                  })
              }
          } 
        });
  }


  getID = () => {
  
    try {
       return this.state.editingEntity.donor.display_doi
     } catch {}

     try {
      return this.state.editingEntity.direct_ancestor.hubmap_id
    } catch {}
    return "<Error Unavailable>"
  }

  handleCancel = () => {
     if (this.props.history) {
       this.props.history.goBack();
    } else {
      this.props.handleCancel();
    }
  }

  setDirty = (dirty) => {
    this.setState( {isDirty: dirty});  // users changed something

    try {
      this.props.handleDirty(dirty);  // if there's a handler in the parent set that
    } catch {}
  }

  snackCancel = () => {
     this.setState( {
        isDirty: false,
        show_dirty_warning: false
     });  
  }

  handleInputChange = e => {
    const { name, value } = e.target;
  
    this.setDirty(true);

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
      case "protocol_url":
        this.setState({ protocol_url: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "required"
            }
          }));
        
        } else if (!validateProtocolIODOI(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter a valid protocols.io URL"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: ""
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
            //this.setState({ organ: "" });
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
      // case "metadata":
      //   this.setState({ metadata: value });
      //   break;
      // case "metadata_file":
      //   this.setState({
      //     metadata_file: e.target.files[0],
      //     metadata_file_name: e.target.files[0] && e.target.files[0].name
      //   });
      //   break;
      case "groups":
        this.setState({
          selected_group: value
        });
        break;
      case "multipleID":
        this.setState({
          multiple_id: e.target.checked
        });
        if (!e.target.checked) {
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


  // trigerAddViewState = () => {
  //   this.setState({
  //     ...this.State,
  //     rui_check: true,
  //     rui_view: true
  //   })
  // }

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
      rui_click: true,
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

 onFileChange = (type, id) => {
    switch (type) {
      case "metadata": {
        const i = this.state.metadatas.findIndex(i => i.id === id);
        let metadatas = [...this.state.metadatas];
        metadatas[i].file_name = metadatas[i].ref.current.metadata_file.current.files[0].name;
        let new_metadatas = [...this.state.new_metadatas];
        new_metadatas.push(metadatas[i].file_name);
        return new Promise((resolve, reject) => {
          this.setState({
            metadatas
          }, () => {
            if (!this.validateMetadataFiles(id)) {
              metadatas[i].file_name = "";
              this.setState({
                metadatas
              })
              reject();
            } else {
              this.setState({
                new_metadatas
              })
              resolve();
            }
          });
        });
        //break;
      }
      case "image": {
        const i = this.state.images.findIndex(i => i.id === id);
        // //////console.debug('image', id)
        let images = [...this.state.images];
        //////console.debug('images', images)
        images[i].file_name = images[i].ref.current.image_file.current.files[0].name;
        //////console.debug('images file data', images[i].ref.current.image_file.current.files)
        let new_images = [...this.state.new_images];
        new_images.push(images[i].file_name);
        return new Promise((resolve, reject) => {
          this.setState({
            images,
            new_images
          }, () => {
            if (!this.validateImagesFiles(id)) {
              images[i].file_name = "";
              this.setState({
                images
              })
              reject();
            } else {
              this.setState({
                new_images
              })
              resolve();
            }
          });
        });
        //break;
      }
      default:
        break;
    }
  }

  validateMetadataFiles = id => {
    const file_names = this.state.metadatas.map(m => {
      return m.file_name;
    })

    // Check if duplicated file name
    if (file_names.length > new Set(file_names).size) {
      const i = this.state.metadatas.findIndex(i => i.id === id);
      let metadatas = [...this.state.metadatas];
      metadatas[i].error = "Duplicate file name is not allowed."
      this.setState({ metadatas })
      return false;
    }
    const i = this.state.metadatas.findIndex(i => i.id === id);
    let metadatas = [...this.state.metadatas];
    metadatas[i].error = ""
    this.setState({ metadatas })

    return true;
  }

  validateImagesFiles = id => {
    const file_names = this.state.images.map(i => {
      return i.file_name;
    })

    // Check if duplicated file name
    if (file_names.length > new Set(file_names).size) {
      const i = this.state.images.findIndex(i => i.id === id);
      let images = [...this.state.images];
      images[i].error = "Duplicate file name is not allowed."
      this.setState({ images })
      return false;
    }

    return true;
  }

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


  handleDeleteMetadata = metadataId => {

    //  //////console.debug('before metadata', this.state.metadatas)
    const remove_meta = this.state.metadatas.find(i => i.id === metadataId); // find our metadata file in the existing
    const metadatas = this.state.metadatas.filter(i => i.id !== metadataId)  // recreate the metadata w/o the deleted
    const new_metadatas = this.state.new_metadatas.filter(dm => dm !== remove_meta.uuid);
    let deleted_metas = [...this.state.deleted_metas];

    ////////console.debug('add remove meta', remove_meta)
    deleted_metas.push(remove_meta.file_uuid);

    ////////console.debug('after metadata', metadatas)
    this.setState({
      metadatas,
      new_metadatas,
      deleted_metas
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

  handleDeleteImage = id => {
    const deleted_image = this.state.images.find(i => i.id === id);
    const new_images = this.state.new_images.filter(dm => dm !== deleted_image.file_name);
    let deleted_images = [...this.state.deleted_images];

    //////console.debug('deleted image', deleted_image)
    if (new_images.length === this.state.new_images.length){
      //deleted_images.push(deleted_image.file_name);
      deleted_images.push(deleted_image.file_uuid);
    }
    const images = this.state.images.filter(i => i.id !== id);
    this.setState({
      images,
      new_images,
      deleted_images
    });
  };

  isSpecialOrganType = otype => {
    return otype === "LK" ||
          otype === "HT" ||
          otype === "SP" ||
          otype === "LI" ||
          otype === "RK";
  }

  isNotSpecialOrganType = otype => {
     return otype !== "LK" &&
        otype !== "HT" &&
        otype !== "SP" &&
        otype !== "LI" &&
        otype !== "RK";
  }

  // special case for donors
  isOrganBloodType = sptype => {
    return sptype === "organ" ||
          sptype === "blood";
  }
 
 getGender = (entity) => {

    const metadata = entity?.metadata;

    //////console.debug(metadata)
    if (metadata === undefined) {
      return ""
    } else {
          //traverse the organ array for a concept that matches
          try {
            return metadata.organ_donor_data.find(e => e.grouping_concept_preferred_term === "Sex").preferred_term.toLowerCase();
          } catch {
              return "";
          }
    }
  }
 
  handleSubmit = e => {
    e.preventDefault();
    this.validateForm().then(isValid => {
      if (isValid) {
        if (
          !this.state.editingEntity &&
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
  
            protocol_url: this.state.protocol_url,
            specimen_type: this.state.specimen_type,
            specimen_type_other: this.state.specimen_type_other,
            direct_ancestor_uuid: this.state.source_uuid_list,
            organ_other: this.state.organ_other,
            visit: this.state.visit,
            description: this.state.description,
          };

          if (this.state.specimen_type === 'organ') {
            data["organ"] = this.state.organ;
          }

          // only add these fields if user didn't check multiples
          if (this.state.sample_count < 1) {

            data["lab_tissue_sample_id"] = this.state.lab_tissue_id;

            if (this.state.rui_location && this.state.rui_location.length !== "") 
            {
              data["rui_location"] = JSON.parse(this.state.rui_location);
            }

            //////console.debug('submit metadatas', this.state.metadatas);
            if (this.state.metadatas.length > 0 ) {
              let metadata_files_to_add = [];
   
              this.state.metadatas.forEach(i => {
                if (i.ref.current.state.temp_file_id !== "") {
                  metadata_files_to_add.push({
                    temp_file_id: i.ref.current.state.temp_file_id,
                    file_name: i.ref.current.metadata_file.current.files[0].name
                  });
                } 
              });
            // check to see if we really did add any new images 
              if (metadata_files_to_add.length > 0 ) {
                data['metadata_files_to_add'] = metadata_files_to_add;
              }
          
           }
           //////console.debug(this.state.deleted_metas)
           if (this.state.deleted_metas.length > 0)  { 
             data['metadata_files_to_remove'] = this.state.deleted_metas;
           }

            if (this.state.images.length > 0) {
              let image_files_to_add = [];
              let existing_image_files_to_update = [];
              //////console.debug('submit images', this.state.images)
              this.state.images.forEach(i => {

              // if a file has a non-blank temp_file_id then assume it a new image 
                if (i.ref.current.state.temp_file_id !== "") {
                  image_files_to_add.push({
                    temp_file_id: i.ref.current.state.temp_file_id,
                    description: i.ref.current.image_file_description.current.value.replace(
                      /"/g,
                      '\\"'
                    )
                  });
                } else {  // this will send image data that may have been updated
                  existing_image_files_to_update.push({
                     file_uuid: i.file_uuid,
                     description: i.ref.current.image_file_description.current.value.replace(
                      /"/g,
                      '\\"'
                    )
                  })

                }
              });

              // check to see if we really did add any new images 
              if (image_files_to_add.length > 0) {
                data['image_files_to_add'] = image_files_to_add;
              }
              // send any updates to the existing descriptions, there is no check for changes
              if (existing_image_files_to_update.length > 0 ) {
                data["image_files"] = existing_image_files_to_update;
              }
          }
        
          // check for any removed images
          if (this.state.deleted_images.length > 0) {
            data['image_files_to_remove'] = this.state.deleted_images
          }
        }

        //////console.debug("SUBMMITED data")
        //////console.debug(data)
      

        if (this.state.editingEntity && !this.state.LocationSaved) {
          //////console.debug("Updating Entity....")
          entity_api_update_entity(this.state.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status === 200) {
                    //////console.debug('Update Entity...');
                    //////console.debug(response.results);
                    this.setState({ submit_error: false, 
                      submitting: false, 
                      show_snack: true,
                      show_dirty_warning: false,
                      snackmessage: "Save was succesful",
                      isDirty: false });

                    ////console.debug('handleSubmit - related count', this.state.related_group_ids.length)
                    if (this.state.related_group_ids.length === 1) {  // if we have multiples just stay on the page
                      
                      this.props.onUpdated(response.results);
                    } 
                    // else {
                    //   this.props.history.goBack();
                    // }
                  } else {
                    this.setState({ submit_error: true, submitting: false, isDirty: false });
                    this.setDirty(false);

                  }
      
              });
        } else {
            //////console.debug('selected group', this.state.selected_group);

            if (this.state.selected_group && this.state.selected_group.length > 0) {
                data["group_uuid"] = this.state.selected_group;
            } else {
                data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
            }
            if (this.state.sample_count < 1) {
                //console.debug("Create a new Entity....", this.state.sample_count)
                entity_api_create_entity("sample", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                    .then((response) => {
                      if (response.status === 200) {
                        //////console.debug('create Entity...');
                        //////console.debug(response.results);

                        this.props.onCreated({new_samples: [], entity: response.results});
                        this.setState({ submit_error: true, submitting: false});
                        
                      } else if (response.status === 400) {
                         this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(response.results) });
                      } 
                  });
                } else if (this.state.sample_count > 0) {
                    //console.debug("Create a MULTIPLES Entity....", this.state.sample_count)
                    // now generate some multiples
                    entity_api_create_multiple_entities(this.state.sample_count, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                      .then((resp) => {
                        if (resp.status === 200) {
                          //console.debug('MULTIPLES DATA', data)
                                 //this.props.onCreated({new_samples: resp.results, entity: response.results});
                          this.props.onCreated({new_samples: resp.results, entity: data});   // fro multiples send the 'starter' data used to create the multiples
                          this.setState({ submit_error: true, submitting: false});
                        } else if (resp.status === 400) {
                            this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(resp.results) });
                            } 
                        });
                }
          }
        }
      }
    });
  };

  renderButtons() {
    if (this.state.editingEntity) {
      if (this.props.readOnly) {
        return (
          <div className="row"><div className="col-sm-12">
          <Divider />
          </div>
            <div className="col-sm-12 text-right pads">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => this.handleCancel()}
              >
                Cancel
              </button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="row">
          <div className="col-sm-12">
            <Divider />
          </div>
            <div className="col-sm-12 text-right pads">
              <button
                type="submit"
                className="btn btn-primary"
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
            {!this.state.back_btn_hide && (
              <button
                id="editBackBtn"
                type="button"
                className="btn btn-secondary"
                onClick={() => this.handleCancel()}
              >
                Cancel
              </button>
              )}
            </div>
          </div>
        );
      }
    } else {
      return (

        <div className="row"> 
          <div className="col-sm-12">
              <Divider />
            </div>
            <div className="col-md-12 text-right pads">
            <button
              type="submit"
              className="btn btn-primary"
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
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => this.handleCancel()}
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

      if (!validateRequired(this.state.protocol_url)) {
        this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "required"
            }
          }));
          isValid = false;
      } else if (!validateProtocolIODOI(this.state.protocol_url)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter a valid protocols.io DOI"
            }
          }));
          isValid = false;

      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, protocol_url: "" }
        }));
      }
      
      if (this.state.sample_count < 1) { // only validate if we are not doing multiples
      // validate the images
        this.state.images.forEach((image, index) => {
          if (!image.file_name && !validateRequired(image.ref.current.image_file.current.value)) {
           // //////console.debug('image invalid', image.file_name)
            isValid = false;
            image.ref.current.validate();
          }
          if (!validateRequired(image.ref.current.image_file_description.current.value)) {
             ////////console.debug('descr missing')
            isValid = false;
            image.ref.current.validate();
          }
        });

        const hasImageDuplicates = new Set(this.state.images).size !== this.state.images.length
        if (hasImageDuplicates) {
           // image["error"] = "Duplicated file name is not allowed.";
            isValid = false;
        }
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
        resolve(isValid);
      // this.validateUUID().then(res => {
      //   resolve(isValid && res);
      // });
    }      
    });
  }

  handleLookUpClick = () => {
    if (this.state.source_uuid === undefined && !this.state.lookUpCancelled) {
      this.setState({
        LookUpShow: true
      });
    }
     this.setState({
        lookUpCancelled: false
      });
  };

  hideLookUpModal = () => {
  
    this.setState({
      LookUpShow: false
    });
  };

  cancelLookUpModal = () => {
   
    this.setState({
      LookUpShow: false,
      lookUpCancelled: true
    });
  };

  hideGroupSelectModal = () => {
    this.setState({
      GroupSelectShow: false
    });
  };

  // Callback for the SOURCE for table selection 
  handleSelectClick = selection => {
    let ancestor_organ = ""

    ////console.debug('tissueForm Selection', selection);

    if (selection) {
      // check to see if we have an "top-level" ancestor 
      //entity_api_get_entity_ancestor( ids[0].source_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
      entity_api_get_entity_ancestor( selection.row.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        .then((response) => {
          if (response.status === 200) {
              // //////console.debug('Entity ancestors...', response.results);
              // //////console.debug(response.results);
              if (response.results.length > 0) {
                  ancestor_organ = response.results[0].organ;   // use "top" ancestor organ
              }
          } else {
              ancestor_organ = selection.row.organ;  // use the direct ancestor
          }
          this.setState({
            source_uuid: selection.row.hubmap_id,
            source_entity: selection.row,
            source_uuid_list: selection.row.uuid,   // just add the single for now
            source_entity_type: selection.row.entity_type,
            organ: ancestor_organ,
            ancestor_organ: ancestor_organ, // save the acestor organ for the RUI check
            sex: this.getGender(selection.row),
            LookUpShow: false
          });
        });
    }
  };

 // only handles one selection at this time
  getSourceAncestor(source_uuids){
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
    }
    return ""
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    try {
      return source_uuids[0];  // just get the first one
    } catch {
    }
    return ""
  }

  hideBackButton = () => {
    this.setState({
      back_btn_hide: true
    });
  }

  handleSavedLocations = (e) => {
    this.setState({ LocationSaved: true });
  };


  render() {
    return (
      <div className="row">
       <Paper className="paper-container">
        {this.state.related_group_ids.length > 1
          && (
          <div className="alert alert-primary col-sm-12" role="alert">
            {this.state.editingMultiWarning}{" "}
            <p>Click below to expand and view the groups list. Then select an Sample ID to edit the sample data.  Press the update button to save your changes.</p>
            <Accordion>
                <AccordionSummary
                  expandIcon={<FontAwesomeIcon icon={faAngleDown} />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >Sample Group List
              </AccordionSummary>
              <AccordionDetails>
              <div className="row">
               <div className='idlist'>
                
                  <ul>
                    { this.state.related_group_ids.length > 0 && this.state.related_group_ids.map((item, index) => {
                      if (item.uuid === this.state.editingEntity.uuid) {
                        return (
                          <li key={item.submission_id}>
                             <button type="button" className="btn btn-link disabled">{`${item.submission_id}`}</button>
                          </li>
                          );
                      } else {
                        return (
                          <li key={item.submission_id}>
                          <button type="button" className="btn btn-link" onClick={(e) => this.handleMultiEdit(item.uuid, e)}>{`${item.submission_id}`}</button>
                          </li>
                         );
                      }
        
                      })
                    }
                    </ul>
                </div>
                </div>
              </AccordionDetails>
            </Accordion>
          </div>   
        )}
        <div className="col-sm-12 pads">
          <div className="col-sm-12 text-center"><h4>Sample Information</h4></div>
          <div
            className="alert alert-danger col-sm-10 offset-sm-1"
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
           {this.state.editingEntity && (
            <React.Fragment>
            <div className="row">
              <div className="col-sm-5 offset-sm-1 portal-label">
                  HuBMAP ID: {this.state.editingEntity.hubmap_id}
              </div>
              <div className="col-sm-5 text-right portal-label">
              Submission ID: {this.state.editingEntity.submission_id}
              </div>
                <div className="col-sm-5 offset-sm-1 portal-label">
                  Entered by: {this.state.editingEntity.created_by_user_email}
              </div>
              <div className="col-sm-5 text-right portal-label">
                  Entry Date: {tsToDate(this.state.editingEntity.created_timestamp)}
              </div>
              </div>
            </React.Fragment>
          )}
     
          <form onSubmit={this.handleSubmit}>
            <div className="form-group">
              <label htmlFor="source_uuid">
                Source ID <span className="text-danger">*</span>  <FontAwesomeIcon
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
                  <p>
                    The HuBMAP Unique identifier of the direct origin entity,
                    <br />
                    other sample or donor, where this sample came from.
                  </p>
                </ReactTooltip>
              </label>
            
              {!this.props.readOnly && (
                <React.Fragment>
                  <div className="input-group">
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
                     <button
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={this.handleLookUpClick}
                    >
                      <FontAwesomeIcon
                          icon={faSearch}
                          data-tip
                          data-for="source_uuid_tooltip"
                      />
                    </button>
                  </div>
                  {/*<div className="col-sm-1">
                    <button
                      className="btn btn-light"
                      type="button"
                      onClick={this.handleLookUpClick}
                    >
                      <FontAwesomeIcon
                          icon={faSearch}
                          data-tip
                          data-for="source_uuid_tooltip"
                      />
                    </button>
                  </div> */}
                  {/* <div className="col-sm-2">
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
                  />

                   <Modal show={this.state.LookUpShow} handleClose={this.hideLookUpModal} scrollable={true}>
                  */}
                  
                    <Dialog fullWidth={true} maxWidth="lg" onClose={this.hideLookUpModal} aria-labelledby="source-lookup-dialog" open={this.state.LookUpShow}>
                     <DialogContent>
                    <SearchComponent
                      select={this.handleSelectClick}
                      custom_title="Search for a Source ID for your Sample"
                      filter_type="Sample"
                    />
                    </DialogContent>
                     <DialogActions>
                      <Button onClick={this.cancelLookUpModal} color="primary">
                        Close
                     </Button>
                    </DialogActions>
                   </Dialog>

                </React.Fragment>
              )}
              {this.props.readOnly && (
                <React.Fragment>
                 <div>
                    <input type="text" readOnly className="form-control" id="static_source_uuid" value={this.state.source_uuid}></input>
                  </div>
                  {/*<div className="col-sm-9 col-form-label">
                    <p>{this.state.source_uuid}</p>
                  </div>{" "}
                */}
                </React.Fragment>
              )}
            
            </div>
            {this.state.source_entity && (
              <div className="form-group row">
                <div className="col-sm-7 offset-sm-2">
                  <div className="card">
                    <div className="card-body">
        
                      <div className="row">
                        <div className="col-sm-6">
                          <b>Source Type:</b>{" "}
                          {this.state.source_entity.specimen_type
                            ? flattenSampleType(SAMPLE_TYPES)[
                            this.state.source_entity.specimen_type
                            ]
                            : this.state.source_entity.entity_type}
                        </div>
              
                        {this.isOrganBloodType(this.state.source_entity.specimen_type) && (
                            <div className="col-sm-12">
                              <b>Organ Type:</b>{" "}
                              {
                                ORGAN_TYPES[
                                this.state.source_entity.organ
                                ]
                              }
                            </div>
                          )}
                        {this.state.source_entity.submission_id && (
                            <div className="col-sm-12">
                              <b>Submission ID:</b>{" "}{this.state.source_entity.submission_id}
                            </div>
                        )}
                        {this.state.source_entity.lab_donor_id && (
                            <div className="col-sm-12">
                                <b>Lab ID: </b>{" "}
                                {this.state.source_entity.lab_donor_id}     
                            </div>
                          )}
                        
                            {this.state.source_entity.group_name && (
                            <div className="col-sm-12">
                                <b>Group Name: </b>{" "}
                                {this.state.source_entity.group_name}
                            </div>
                          )}
                          {this.state.source_entity.description && (
                            <div className="col-sm-12">
                              <p>
                                <b>Description: </b>{" "}
                                {truncateString(this.state.source_entity.description, 230)}
                              </p>
                            </div>
                          )}

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label
                htmlFor="specimen_type">
                Tissue Sample Type <span className="text-danger">*</span>  <FontAwesomeIcon
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
                  <p>The type of specimen.</p>
                </ReactTooltip>
              </label>
              {!this.props.readOnly && (
                <React.Fragment>
                  <div>
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
                      {TISSUE_TYPES[this.state.source_entity_type].map((optgs, index) => {
                        return (
                          <optgroup
                            key={index}
                            label="____________________________________________________________"
                          >
                            {Object.entries(optgs).map(op => {
                                return (
                                  <option key={op[0]} value={op[0]}>
                                    {op[1]}
                                  </option>
                                );
                              
                            })}
                          </optgroup>
                        );
                      })}

                       {/*TISSUE_TYPES[this.state.editingEntity.entity_type].map((optgs, index) => {
                        return (
                          <optgroup
                            key={index}
                            label="____________________________________________________________"
                          >
                            {Object.entries(optgs).map(op => {
                              if (op[0] === "organ") {
                                if (
                                  this.state.source_entity &&
                                  this.state.source_entity.entity_type === "Donor"
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
                      })*/}
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
            
                  <div className="col-sm-3">
                   <input type="text" readOnly className="form-control" id="_readonly_specimen_type" 
                   value={flattenSampleType(SAMPLE_TYPES)[this.state.specimen_type]}></input>
                    <p>
                      {this.state.specimen_type_other &&
                        " - " + this.state.specimen_type_other}
                    </p>
                    </div>
                  
                </React.Fragment>
              )}
            
            </div>
            {this.state.specimen_type === "organ" && (
              <div className="form-group row">
                <label
                  htmlFor="organ"
                  className="col-sm-2 col-form-label text-right"
                >
                  Organ Type<span className="text-danger">*</span>
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
                  <div>
                   <input type="text" readOnly className="form-control" id="static_organ" value={this.state.organ === "OT" ? this.state.organ_other : ORGAN_TYPES[this.state.organ]}></input>

                    {/*<p>
                      {this.state.organ === "OT"
                        ? this.state.organ_other
                        : ORGAN_TYPES[this.state.organ]}
                    </p>
                  */}
                  </div>
                )}
              </div>
            )}
            {["organ", "biopsy", "blood"].includes(this.state.specimen_type) &&
              (!this.props.readOnly || this.state.visit !== undefined) && (
                <div className="form-group">
                  <label
                    htmlFor="visit"
                  >
                    Visit
                  </label>
                  {!this.props.readOnly && (
                   
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
                  
                  )}
                  {this.props.readOnly && (
                    <div>
                    <input type="text" readOnly className="form-control" id="static_visit" value={this.state.visit}></input>
                    </div>
                  )}
                </div>
              )}
            <div className="form-group">
              <label
                htmlFor="protocol_url">
                Case Selection Protocol <span className="text-danger">*</span> <span className="text-danger inline-icon">
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
                    <p>
                      The protocol used when procuring or preparing the tissue.
                      This must be provided as a protocols.io DOI URL
                      </p>
                  </ReactTooltip>
                </span>
              </label>
              {!this.props.readOnly && (
                <div>
                  <input
                    ref={this.protocol_url}
                    type="text"
                    name="protocol_url"
                    id="protocol_url"
                    className={
                      "form-control " +
                      this.errorClass(this.state.formErrors.protocol_url)
                    }
                    onChange={this.handleInputChange}
                    value={this.state.protocol_url}
                    placeholder="protocols.io DOI"
                  />
                 
                </div>
              )}
              {this.props.readOnly && (
                <div>
                    <input type="text" readOnly className="form-control" id="static_protocol" value={this.state.protocol_url}></input>
                </div>
              )}
            
            </div>
            {
            !this.props.readOnly &&
              this.state.specimen_type !== "organ" &&
              !this.state.editingEntity && (
                <div className="form-group row">
                  <div className="col-sm-8">
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
                      <div className="col-sm-4 offset-sm-1">
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
                          (this.isSpecialOrganType(this.state.organ)) && (
                          <div className="col-sm-4">
                            <small className='portal-label'>
                              Lab IDs, Sample Locations and files/images can be assigned on the next screen after
                              generating the HuBMAP IDs
                          </small>
                          </div>
                        )}
                      { this.state.source_entity &&
                        (this.isNotSpecialOrganType(this.state.organ)) && (
                          <div className="col-sm-4">
                            <small className='portal-label'>
                              Lab IDs and files/images can be assigned on the next screen after
                              generating the HuBMAP IDs
                          </small>
                          </div>
                        )}
                    </React.Fragment>
                  )}
                </div>
              )}
            {!this.state.multiple_id &&
              //!this.state.editingMultiWarning &&
              (!this.props.readOnly ||
                this.state.lab_tissue_id !== undefined) && (

                <div className="form-group">
                  <label
                    htmlFor="lab_tissue_id">
                    Lab Sample Id  <FontAwesomeIcon
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
                      <p>
                        An identifier used by the lab to identify the specimen,
                        this can be an identifier from the system <br />
                        used to track the specimen in the lab. This field will
                        be entered by the user.
                      </p>
                    </ReactTooltip>
                  </label>
                  {!this.props.readOnly && (
                    <div>
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
                      <div>
                    <input type="text" readOnly className="form-control" id="static_lab_tissue_id" value={this.state.lab_tissue_id}></input>
                </div>
                   
                  )}
                
                </div>
              )
            }

            {!this.state.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.ancestor_organ) &&
              (
                <div className="form-group">
                  <label
                    htmlFor="location">
                    Sample Location {" "}<span>
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
                        <p>
                          Provide formatted location data from <br />
                          CCF Location Registration Tool for <br />
            this sample.
          </p>
                      </ReactTooltip>
                    </span>
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
                  <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                    <RUIIntegration handleJsonRUI={this.handleRUIJson}
                      organ={this.state.organ}
                      sex={this.state.source_entity.sex}
                      user={this.state.source_entity.created_by_user_displayname}
                      location={this.state.rui_location}
                      parent="TissueForm" />
                      </Dialog>
                  )}

                  { this.state.rui_check && (
                    <React.Fragment>
            
                      <div className="col-sm-2">
                      <img src={check}
                          alt="check"
                          className="check" />
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
                 
                </div>
              )}
            {this.state.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.ancestor_organ) &&    //source_entity.organ
              (
                <div className="form-group">
                  <label
                    htmlFor="location"
                    className="col-sm-2 col-form-label"
                  >Sample Location {" "}
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
                        <p>
                          Provide formatted location data from <br />
                          CCF Location Registration Tool for <br />
                          this sample.
                      </p>
                      </ReactTooltip>
                  </label>
                 
                  { !this.props.readOnly &&
                    this.state.rui_check && (
                      <React.Fragment>
                       
                        <div className="col-sm-3 text-center">
                          <button
                            type="button"
                            onClick={this.handleAddRUILocation}
                            className="btn btn-primary btn-block"
                          >
                            Modify Location Information
                          </button>
                        </div>
                        { this.state.rui_click && (
                           <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organ={this.state.source_entity.organ}
                            sex={this.state.source_entity.sex}
                            user={this.state.source_entity.created_by_user_displayname}
                            location={this.state.rui_location}
                            parent="TissueForm" />
                            </Dialog>
                        )}
                      </React.Fragment>
                    )}
                     {this.state.rui_check && (

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
                      {this.state.rui_location}
                    </RUIModal>
                    <div className="col-sm-2">
                    </div>
                  </React.Fragment>
                  )}

                  { !this.props.readOnly &&
                    !this.state.multiple_id &&
                    !this.state.rui_check && (
                      <React.Fragment>
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
                          <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organ={this.state.source_entity.organ}
                            sex={this.state.source_entity.sex}
                            user={this.state.source_entity.created_by_user_displayname}
                            location={this.state.rui_location}
                            parent="TissueForm" />
                          </Dialog>
                        )}
                      </React.Fragment>
                    )}
                  {/**  {  !this.props.readOnly && 
            this.state.rui_click && (
                <RUIIntegration handleJsonRUI= {this.handleRUIJson} />
                   )} **/}
                  { this.props.readOnly && (
                    <div className="col-sm-4">
                    </div>
                  )}
                  <div className="col-sm-1 my-auto text-center">
                    
                  </div>
                </div>
              )}
            {(!this.props.readOnly || this.state.description !== undefined) && (
              <div className="form-group">
                <label
                  htmlFor="description">
                  Description  <FontAwesomeIcon
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
                    <p>A free text description of the specimen.</p>
                  </ReactTooltip>
                  </label>
                {!this.props.readOnly && (
                  <div>
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
                    <div>
                      {/*<p>{truncateString(this.state.description, 400)}</p>*/}
                       <input type="text" readOnly className="form-control" id="static_description" value={this.state.description}></input>
                    </div>
                )}
                
              </div>
            )}
            <div className="form-group">
              <label
                htmlFor="sample_metadata_status">
                Sample Metadata Status
                  </label>
              <div className="col-sm-9 my-auto">
                {this.state.sample_metadata_status || (
                  <span className="badge badge-secondary">No value set</span>
                )}
                {this.state.sample_metadata_status === 0 && (
                  <span className="badge badge-secondary">No metadata</span>
                )}
                {this.state.sample_metadata_status === 1 && (
                  <span className="badge badge-primary">Metadata provided</span>
                )}
                {this.state.sample_metadata_status === 2 && (
                  <span className="badge badge-primary">Metadata curated</span>
                )}
              </div>
            </div>
            {/*}
            <div className="form-group">
              <label
                htmlFor="metadata">
                Metadata <FontAwesomeIcon
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
                  <p>
                    Metadata describing the specimen. <br />
                      This could be typed in (or copy/pasted) or an uploaded file
                      such as a spreadsheet.
                    </p>
                </ReactTooltip>
                </label>
              {!this.props.readOnly && (
                <div>
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
            </div>
          */}
            {((!this.props.readOnly || this.state.metadatas.length > 0) && 
              !this.state.multiple_id) && (
              <div className="form-group">
                
                <div>
                  {!this.props.readOnly && (
                    <div>
                      <div>
                        <button
                          type="button"
                          onClick={this.handleAddMetadata}
                          className="btn btn-secondary btn-block"
                          data-tip
                          data-for="add_meta_tooltip"
                        >
                          <FontAwesomeIcon
                            className="inline-icon"
                            icon={faPaperclip}
                            title="Uploaded meta data"
                          />
                            Add a Metadata File
                          </button>
                           <ReactTooltip
                              id="add_meta_tooltip"
                              place="top"
                              type="info"
                              effect="solid"
                          >
                            <p>
                                Click here to attach a single or multiple metadata file(s)
                            </p>
                            </ReactTooltip>
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
                      formId={this.state.form_id}
                      onFileChange={this.onFileChange}
                      validate={this.validateMetadataFiles}
                      onDelete={this.handleDeleteMetadata}
                    />
                  ))}
                </div>
                
              </div>
            )}
            {((!this.props.readOnly || this.state.images.length > 0) &&
              !this.state.multiple_id) && (
              <div className="form-group">
               
                <div>
                  {!this.props.readOnly && (
                    <div>
                      <div>
                        <button
                          type="button"
                          onClick={this.handleAddImage}
                          className="btn btn-secondary btn-block"
                          data-tip
                          data-for="add_image_tooltip"
                        >
                          <FontAwesomeIcon
                            className="inline-icon"
                            icon={faPaperclip}
                            title="Uploaded images (multiple allowed)."
                          />
                            Add an Image file
                          </button> 
                          <small id="emailHelp" className="form-text text-muted"> 
                          <span className="text-danger inline-icon">
                            <FontAwesomeIcon icon={faUserShield} />
                          </span> Upload de-identified images only</small>
                           <ReactTooltip
                              id="add_image_tooltip"
                              place="top"
                              type="info"
                              effect="solid"
                          >
                            <p>
                                Click here to attach a single or multiple image(s)
                            </p>
                            </ReactTooltip>
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
                      formId={this.state.form_id}
                      onFileChange={this.onFileChange}
                      validate={this.validateImagesFiles}
                      onDelete={this.handleDeleteImage}
                    />
                  ))}
                </div>
              
              </div>
            )}
            {this.state.submit_error && (
              <div className="alert alert-danger col-sm-12" role="alert">
                <p>
                {this.state.error_message_detail}
                </p>
                {this.state.error_message}
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
        </Paper>
         <Snackbar open={this.state.show_snack} 
                      onClose={this.closeSnack}
                      anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                      }}
                      autoHideDuration={6000} 
                      message={this.state.snackmessage}
                      action={
                            <React.Fragment>
                              <IconButton size="small" aria-label="close" color="inherit" onClick={this.closeSnack}>
                                 <FontAwesomeIcon icon={faTimes} size="1x" />
                              </IconButton>
                            </React.Fragment>
                          }
            /> 

            <Snackbar open={this.state.show_dirty_warning} 
                      //onClose={this.closeSnack}
                      anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'center',
                      }}
                      //autoHideDuration={6000} 
                      severity="warning"
                      message={<span id="client-snackbar">You have made changes, please UPDATE to save.</span>}
                      action={
                        <React.Fragment>
                         <Button color="inherit" size="small" onClick={this.snackCancel}>
                            Cancel Changes
                          </Button>
                          </React.Fragment>
                      }
                  >

            </Snackbar> 
      </div>
    );
  }
}

export default TissueForm;