import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faUserShield,
  faSearch, faPaperclip, faCopy
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
import IDSearchModal from "./idSearchModal";
import GroupModal from "../groupModal";
import { SAMPLE_TYPES, TISSUE_TYPES, ORGAN_TYPES } from "../../../constants";
import ImageUpload from "../donor_form_components/imageUpload";
import MetadataUpload from "../metadataUpload";
import LabIDsModal from "../labIdsModal";
import RUIModal from "./ruiModal";
import RUIIntegration from "./ruiIntegration";
import { entity_api_update_entity, entity_api_create_entity, entity_api_create_multiple_entities, entity_api_get_entity_ancestor } from '../../../service/entity_api';
import { ingest_api_get_associated_ids } from '../../../service/ingest_api';

class TissueForm extends Component {
  state = {
    lab: "",
    lab_tissue_id: "",
    // protocols: [
    //   {
    //     id: 1,
    //     ref: React.createRef()
    //   }
    // ],

//    protocol: "",
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

    new_metadatas: [],
    deleted_metas: [],
    new_images: [],
    deleted_images: [],
    groups: [],
    selected_group: "",
    error_message_detail: "",
    error_message: "Oops! Something went wrong. Please contact administrator for help.",
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
    // create a ref to store the file Input DOM element   
    //this.protocolFile = React.createRef();
    //this.protocol = React.createRef();
    // this.handleSavedLocations = this.handleSavedLocations.bind(this);
  }

  handleRUIJson = (dataFromChild) => {
    this.setState({
      rui_location: dataFromChild,
      rui_check: true,
      rui_view: true,
      rui_click: false
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
        console.debug('groups', groups)
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

      // get associated entity IDS
        ingest_api_get_associated_ids(this.props.editingEntity.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
          .then((resp) => {
            console.debug('ingest_api_get_associated_ids', resp)
          if (resp.status === 200) {
          
          //console.debug("ASSOC IDS", resp.results);
            if (resp.results.length > 1) {
              const first_lab_id = resp.results[0].submission_id;
              const last_lab_id = resp.results[resp.results.length-1].submission_id;
              
              this.setState({
                  editingMultiWarning: `This sample was originally created in a group of ${resp.results.length} 
                      other samples, with ids in the range of ${first_lab_id} through ${last_lab_id}`
              });
            }
            //console.debug('MULTI MESSAGE', this.state.editingMultiWarning)
          }
        });
     

      let images = this.props.editingEntity.image_files;
      let metadatas = this.props.editingEntity.metadata_files;
  
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

      // convert the rui from a json to string, if there
      try {
        let r = JSON.stringify(this.props.editingEntity.rui_location, null, 3)
        
        if (r) {
          this.setState({
            rui_location: r,
            rui_check: true
          })
        } else {
          this.setState({
          rui_location: "",
          rui_check: false
        })
      }
      } catch {
        this.setState({
          rui_location: "",
          rui_check: false
        })
      }

      console.debug('state', this.state)



      this.setState(
        {
          source_uuid: this.getID(),
          source_entity: this.props.editingEntity.direct_ancestor,
          source_entity_type: this.props.editingEntity.direct_ancestor.entity_type,
          author: this.props.editingEntity.created_by_user_email,
          lab_tissue_id: this.props.editingEntity.lab_tissue_sample_id,
          //rui_location: this.props.editingEntity.rui_location || "",
          // protocols: protocols_json,
          protocol_url: this.props.editingEntity.protocol_url,
          // protocol_file_name: getFileNameOnPath(
          //   this.props.editingEntity.properties.protocol_file
          // ),
          entity_type: this.props.editingEntity.entity_type,
          specimen_type: this.determineSpecimenType(),
          specimen_type_other: this.props.editingEntity.specimen_type_other,
          organ: this.props.editingEntity.organ ? this.props.editingEntity.organ : this.props.editingEntity.direct_ancestor.organ,
          visit: this.props.editingEntity.visit ? this.props.editingEntity.visit : "",
          description: this.props.editingEntity.description,
          images: image_list,
          metadatas: metadata_list
          
        }
        // ,

        // () => {
        //   if (this.state.source_uuid !== undefined) {
        //     this.validateUUID();
        //   }
        // }
      );

    } else {
      this.setState(
        {
          specimen_type: this.props.specimenType,
          source_uuid: this.props.sourceUUID,   // this is the hubmap_id, not the uuid
          source_uuid_list: this.props.uuid  // true uuid
        }

        // ,
        // () => {
        //   if (this.state.source_uuid !== undefined) {
        //     this.validateUUID();
        //   }idz
        // }
      );
    }
  }

  determineSpecimenType = () => {
    if (this.props.editingEntity.direct_ancestor.entity_type === 'Sample') {
      if (this.props.editingEntity.direct_ancestor.specimen_type !== 'organ') {
        return this.props.editingEntity.direct_ancestor.specimen_type;
      }
    }
    return this.props.editingEntity.specimen_type;
  }

  getID = () => {
    console.debug("in getting id...", this.props.editingEntity)
    try {
       return this.props.editingEntity.donor.display_doi
     } catch {}

     try {
      return this.props.editingEntity.direct_ancestor.hubmap_id
    } catch {}

    console.debug('something is wrong..')
    return "<Error Unavailable>"
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    console.debug('handleInputChange', name, value)
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
      console.debug('im at the protocol_url', value)
        this.setState({ protocol_url: value });
        if (!validateRequired(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "required"
            }
          }));
          console.debug("protocol_url is INVALID")
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


  trigerAddViewState = () => {
    this.setState({
      ...this.State,
      rui_check: true,
      rui_view: true
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

  // handleDeleteProtocolFile = () => {
  //   this.setState({
  //     protocol_file_name: "Choose a file",
  //     protocolFileKey: Date.now(),
  //     protocol_file: ""
  //   });
  // };

  // handleDeleteMetadataFile = () => {
  //   this.setState({
  //     metadata_file_name: "Choose a file",
  //     metadataFileKey: Date.now(),
  //     metadata_file: ""
  //   });
  // };

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
        break;
      }
      case "image": {
        const i = this.state.images.findIndex(i => i.id === id);
        console.debug('image', id)
        let images = [...this.state.images];
        console.debug('images', images)
        images[i].file_name = images[i].ref.current.image_file.current.files[0].name;
        console.debug('images file data', images[i].ref.current.image_file.current.files)
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
        break;
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

  // handleDeleteImage = imageId => {
  //   const images = this.state.images.filter(i => i.id !== imageId);
  //   this.setState({
  //     images
  //   });
  // };

  // handleDeleteMetadata = metadataId => {
  //   const metadatas = this.state.metadatas.filter(i => i.id !== metadataId);
  //   this.setState({
  //     metadatas
  //   });
  // };

  handleDeleteMetadata = metadataId => {

    //  console.debug('before metadata', this.state.metadatas)
    const remove_meta = this.state.metadatas.find(i => i.id === metadataId); // find our metadata file in the existing
    const metadatas = this.state.metadatas.filter(i => i.id !== metadataId)  // recreate the metadata w/o the deleted
    const new_metadatas = this.state.new_metadatas.filter(dm => dm !== remove_meta.uuid);
    let deleted_metas = [...this.state.deleted_metas];

    //console.debug('add remove meta', remove_meta)
    deleted_metas.push(remove_meta.file_uuid);

    //console.debug('after metadata', metadatas)
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

    console.debug('deleted image', deleted_image)
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

    console.debug(metadata)
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
  // // get the organ type which depends on if a source entity was specified or 
  // // if it's an edit just used the designated organ
  // getOrgan = () => {
  //   if (this.state.specimen_type !== 'organ') {
  //     return 'organ';
  //   }
  //   return this.state.organ;  // returns organ of ancestor
  // }

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
            lab_tissue_sample_id: this.state.lab_tissue_id,
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

          if ( this.state.rui_location && this.state.rui_location.length !== "") {
            data["rui_location"] = JSON.parse(this.state.rui_location);
          }

          console.debug('submit metadatas', this.state.metadatas);
          if (this.state.metadatas.length > 0) {
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
         console.debug(this.state.deleted_metas)
         if (this.state.deleted_metas.length > 0)  { 
           data['metadata_files_to_remove'] = this.state.deleted_metas;
         }

          if (this.state.images.length > 0) {
            let image_files_to_add = [];
            let existing_image_files_to_update = [];
            console.debug('submit images', this.state.images)
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
            if (image_files_to_add.length > 0 ) {
              data['image_files_to_add'] = image_files_to_add;
            }
            // send any updates to the existing descriptions, there is no check for changes
            if (existing_image_files_to_update.length > 0) {
              data["image_files"] = existing_image_files_to_update;
            }
          }
        
          // check for any removed images
          if (this.state.deleted_images.length > 0) {
            data['image_files_to_remove'] = this.state.deleted_images
          }

        console.debug("SUBMMITED data")
        console.debug(data)
      

        if (this.props.editingEntity && !this.state.LocationSaved) {
          console.debug("Updating Entity....")
          entity_api_update_entity(this.props.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status === 200) {
                    console.debug('Update Entity...');
                    console.debug(response.results);
                    this.props.onUpdated(response.results);
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
      
              });
        } else {
              console.debug('selected group', this.state.selected_group);

              if (this.state.selected_group && this.state.selected_group.length > 0) {
                  data["group_uuid"] = this.state.selected_group;
              } else {
                  data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
              }

          
              if (this.state.sample_count < 1) {
                  console.debug("Create a new Entity....", this.state.sample_count)
                entity_api_create_entity("sample", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                    .then((response) => {
                      if (response.status === 200) {
                        console.debug('create Entity...');
                        console.debug(response.results);

                        this.props.onCreated({new_samples: [], entity: response.results});
                        this.setState({ submit_error: true, submitting: false});
                        
                      } else if (response.status === 400) {
                         this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(response.results) });
                      } 
                  });
                } else if (this.state.sample_count > 0) {
                  console.debug("Create a MULTIPLES Entity....", this.state.sample_count)
                    // now generate some multiples
                    entity_api_create_multiple_entities(this.state.sample_count, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                        .then((resp) => {
                            if (resp.status === 200) {
                                 //this.props.onCreated({new_samples: resp.results, entity: response.results});
                                 this.props.onCreated({new_samples: resp.results, entity: data});   // fro multiples send the 'starter' data used to create the multiples
                                 this.setState({ submit_error: true, submitting: false});
                            }  else if (resp.status === 400) {
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
    if (this.props.editingEntity) {
      if (this.props.readOnly) {
        return (
          <div className="row"><div className="col-sm-12">
          <Divider />
          </div>
            <div className="col-sm-12 text-right pads">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => this.props.handleCancel()}
              >
                Back to Search
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
              <button
                type="button"
                className="btn btn-link"
                onClick={() => this.props.handleCancel()}
              >
                Back to Search
              </button>
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
              className="btn btn-link"
              onClick={() => this.props.handleCancel()}
            >
              Back to Search
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

      // validate the images
      this.state.images.forEach((image, index) => {
      if (!image.file_name && !validateRequired(image.ref.current.image_file.current.value)) {
       // console.debug('image invalid', image.file_name)
        isValid = false;
        image.ref.current.validate();
      }
      if (!validateRequired(image.ref.current.image_file_description.current.value)) {
         //console.debug('descr missing')
        isValid = false;
        image.ref.current.validate();
      }
    });
    // }

    const hasImageDuplicates = new Set(this.state.images).size !== this.state.images.length
    if (hasImageDuplicates) {
       // image["error"] = "Duplicated file name is not allowed.";
        isValid = false;
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

  // Callback for the SOURCE for table selection 
  handleSelectClick = ids => {
    let ancestor_organ = ""

    if (ids) {
      // check to see if we have an "top-level" ancestor 
      entity_api_get_entity_ancestor( ids[0].source_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        .then((response) => {
          if (response.status === 200) {
              // console.debug('Entity ancestors...', response.results);
              // console.debug(response.results);
              if (response.results.length > 0) {
                  ancestor_organ = response.results[0].organ;   // use "top" ancestor organ
              }
          } else {
              ancestor_organ = ids[0].entity.organ;  // use the direct ancestor
          }
          this.setState({
            source_uuid: ids[0].hubmap_id,
            source_entity: ids[0].entity,
            source_uuid_list: ids[0].source_uuid,   // just add the single for now
            source_entity_type: ids[0].entity.entity_type,
            organ: ancestor_organ,
            ancestor_organ: ancestor_organ, // save the acestor organ for the RUI check
            sex: this.getGender(ids[0].entity),
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

  handleSavedLocations = (e) => {
    this.setState({ LocationSaved: true });
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
        lab_tissue_id: id.lab_tissue_id,
        rui_location: id.rui_location,
        update: (id.rui_location === undefined || id.rui_location === "") ? false : true,
        organ: this.state.organ || ""
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
        
      
        <div className="col-sm-12 pads">
          <div className="col-sm-12 text-center"><h4>Sample Information</h4></div>
          <div
            className="alert alert-danger col-sm-9 offset-sm-2"
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
          {this.state.editingMultiWarning && !this.props.readOnly && (
          <div className="alert alert-info col-sm-12" role="alert">
            <FontAwesomeIcon icon={faCopy} /> {this.state.editingMultiWarning}
          </div>
          )}
           {this.props.editingEntity && (
            <React.Fragment>
            <div className="row">
              <div className="col-sm-5 offset-sm-2 portal-label">
                  HuBMAP ID: {this.props.editingEntity.hubmap_id}
              </div>
              <div className="col-sm-4 text-right portal-label">
              Submission ID: {this.props.editingEntity.submission_id}
              </div>
                <div className="col-sm-5 offset-sm-2 portal-label">
                  Entered by: {this.props.editingEntity.created_by_user_email}
              </div>
              <div className="col-sm-4 text-right portal-label">
                  Entry Date: {tsToDate(this.props.editingEntity.created_timestamp)}
              </div>
              </div>
            </React.Fragment>
          )}
    
          <Paper className="paper-container">
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
                  <IDSearchModal
                    show={this.state.LookUpShow}
                    hide={this.hideLookUpModal}
                    select={this.handleSelectClick}
                  />
                </React.Fragment>
              )}
              {this.props.readOnly && (
                <React.Fragment>
                 <div>
                    <input type="text" readOnly className="form-control" id="static_source_uuid" value={this.state.source_uuid}></input>
                  </div>
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
              !this.props.editingEntity && (
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
                            <small>
                              Lab IDs and Sample Locations can be assigned on the next screen after
                              generating the HuBMAP IDs
	                        </small>
                          </div>
                        )}
                      { this.state.source_entity &&
                        (this.isNotSpecialOrganType(this.state.organ)) && (
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
              
            

            {/*  ALLOWED EDITING OF MULTIPLE IDS at once

            this.state.ids &&
              (this.props.editingEntity && this.props.editingEntities.length > 1 &&
               (!["LK", "RK", "HT", "SP", "LI"].includes(this.state.organ))) && (
                <React.Fragment>
                  <div className="form-group">
                    <label
                      htmlFor="lab_tissue_id">
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
                    metadata={this.props.editingEntity}
                    ancestor_organ={this.state.ancestor_organ}
                    onSaveLocation={this.handleSavedLocations}
                  />
                </React.Fragment>
              )*/}
            {/*this.props.editingEntity &&
              this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             (["LK", "RK", "HT", "SP", "LI"].includes(this.state.ancestor_organ)) && (
                <React.Fragment>
                  <div className="form-group">
                    <label
                      htmlFor="lab_tissue_id">
                      Lab Sample Id
                  </label>
                    <div>
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
                    metadata={this.props.editingEntity}
                    ancestor_organ={this.state.ancestor_organ}
                    onSaveLocation={this.handleSavedLocations}
                  />
                </React.Fragment>
              )*/}
            {!this.props.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.ancestor_organ) &&
              (
                <div className="form-group">
                  <label
                    htmlFor="location">
                    Sample Location <span>
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
                    <RUIIntegration handleJsonRUI={this.handleRUIJson}
                      organ={this.state.organ}
                      sex={this.state.source_entity.sex}
                      user={this.state.source_entity.created_by_user_displayname}
                      location={this.state.rui_location}
                      parent="TissueForm" />
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
            {this.props.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.source_entity.organ) &&
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
                      {this.state.rui_location}
                    </RUIModal>
                    <div className="col-sm-2">
                    </div>
                  </React.Fragment>

                  { !this.props.readOnly &&
                    this.state.rui_check && (
                      <React.Fragment>
                        <div className="col-sm-1 checkb">
                          <img src={check}
                            alt="check"
                            className="check" />
                        </div>
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
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organ={this.state.source_entity.organ}
                            sex={this.state.source_entity.sex}
                            user={this.state.source_entity.created_by_user_displayname}
                            location={this.state.rui_location}
                            parent="TissueForm" />
                        )}
                      </React.Fragment>
                    )}

                  { !this.props.readOnly &&
                    !this.state.rui_check && (
                      <React.Fragment>
                        <div className="col-sm-4 text-center">
                          <button
                            type="button"
                            onClick={this.handleAddRUILocation}
                            className="btn btn-primary btn-block"
                          >
                            Add Location Information
				         </button>
                        </div>
                        { this.state.rui_click && (
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organ={this.state.source_entity.organ}
                            sex={this.state.source_entity.sex}
                            user={this.state.source_entity.created_by_user_displayname}
                            location={this.state.rui_location}
                            parent="TissueForm" />
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
                        <p>
                          Provide formatted location data from <br />
						 CCF Location Registration Tool for <br />
						 this sample.
					   </p>
                      </ReactTooltip>
                    </span>
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
              
            {(!this.props.readOnly || this.state.metadatas.length > 0) && 
              !this.state.multiple_id &&(
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
            {(!this.props.readOnly || this.state.images.length > 0) && 
               !this.state.multiple_id && (
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
          </Paper>
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
