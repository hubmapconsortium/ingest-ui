import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faPlus,
  faUserShield,
  faSearch, faPaperclip
} from "@fortawesome/free-solid-svg-icons";
import {
  validateRequired,
  validateProtocolIODOI,
  validateFileType
} from "../../../utils/validators";
import check from './check25.jpg';
import { getFileNameOnPath, getFileMIMEType } from "../../../utils/file_helper";
import { flattenSampleType } from "../../../utils/constants_helper";
import { truncateString } from "../../../utils/string_helper";
import ReactTooltip from "react-tooltip";
import Protocol from "./protocol";
import IDSearchModal from "./idSearchModal";
import GroupModal from "../groupModal";
import { SAMPLE_TYPES, TISSUE_TYPES, ORGAN_TYPES } from "../../../constants";
import ImageUpload from "../donor_form_components/imageUpload";
import MetadataUpload from "../metadataUpload";
import LabIDsModal from "../labIdsModal";
import RUIModal from "./ruiModal";
import RUIIntegration from "./ruiIntegration";
import { entity_api_update_entity, entity_api_create_entity, entity_api_create_multiple_entities, entity_api_get_entity_ancestor } from '../../../service/entity_api';

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

    protocol: "",
    protocol_file: "",
    entity_type: "",
    source_entity_type: "Donor",
    specimen_type: "",
    specimen_type_other: "",
    source_uuid: "",
    source_uuid_list: "",
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

    error_message: "Oops! Something went wrong. Please contact administrator for help.",
    formErrors: {
      lab: "",
      // lab_tissue_id: "",
      // protocols: "",
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
        console.log('groups', groups)
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
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${this.props.editingEntity.uuid}/ingest-group-ids`,
          config
        )
        .then(res => {
          if (res.data.siblingid_list.length > 0) {
            res.data.siblingid_list.push({
              hubmap_identifier: this.props.editingEntity.hubmap_id,
              uuid: this.props.editingEntity.uuid,
              lab_tissue_id: this.props.editingEntity.lab_tissue_sample_id || "",
              rui_location: this.props.editingEntity.rui_location || ""
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
              multiple_id: this.props.editingEntities.length > 1 ? true : false
            });
            const first_lab_id = this.props.editingEntities[0].hubmap_id;
            const last_lab_id =
              this.props.editingEntities[this.props.editingEntities.length - 1]
                .hubmap_id;

            if (this.props.editingEntities.length > 1) {
              this.setState({
                editingMultiWarning: `Editing affects the ${this.props.editingEntities.length
                  } ${flattenSampleType(SAMPLE_TYPES)[
                  this.props.editingEntity.specimen_type
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

      // let protocols_json = JSON.parse(
      //   this.props.editingEntity.properties.protocols
      //     .replace(/\\/g, "\\\\")
      //     .replace(/'/g, '"')
      // );

      // protocols_json.map((p, i) => {
      //   p["id"] = i + 1;
      //   p["ref"] = React.createRef();
      //   return p;
      // });

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

      this.setState(
        {
          source_uuid: this.getID(),
          source_entity: this.props.editingEntity.direct_ancestor,
          author: this.props.editingEntity.created_by_user_email,
          lab_tissue_id: this.props.editingEntity.lab_tissue_sample_id,
          rui_location: this.props.editingEntity.rui_location || "",
          // protocols: protocols_json,
          protocol: this.props.editingEntity.protocol_url,
          // protocol_file_name: getFileNameOnPath(
          //   this.props.editingEntity.properties.protocol_file
          // ),
          entity_type: this.props.editingEntity.entity_type,
          specimen_type: this.props.editingEntity.specimen_type,
          specimen_type_other: this.props.editingEntity.specimen_type_other,
          organ: this.props.editingEntity.organ ? this.props.editingEntity.organ : "",
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

  console.log('AFTER DONOR: ', this.props);
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

  getID = () => {
    console.log("in getting id...", this.props.editingEntity)
    try {
       return this.props.editingEntity.donor.display_doi
     } catch {}

     try {
      return this.props.editingEntity.direct_ancestor.hubmap_id
    } catch {}

    console.log('something is wrong..')
    return "<Error Unavailable>"
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    console.log('handleInputChange', name, value)
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
          !validateRequired(value)
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

  handleDeleteProtocolFile = () => {
    this.setState({
      protocol_file_name: "Choose a file",
      protocolFileKey: Date.now(),
      protocol_file: ""
    });
  };

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
        console.log('image', id)
        let images = [...this.state.images];
        console.log('images', images)
        images[i].file_name = images[i].ref.current.image_file.current.files[0].name;
        console.log('images file data', images[i].ref.current.image_file.current.files)
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

  handleDeleteMetadata = id => {
    const deleted_meta = this.state.metadatas.find(i => i.id === id);
    const new_metadatas = this.state.new_metadatas.filter(dm => dm !== deleted_meta.file_name);
    let deleted_metas = [...this.state.deleted_metas];

    console.log('deleted meta', deleted_meta)
    if (new_metadatas.length === this.state.metadatas.length){
      deleted_metas.push(deleted_meta.file_uuid);
    }
    const metas = this.state.metadatas.filter(i => i.id !== id);
    this.setState({
      metas,
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

    console.log('deleted image', deleted_image)
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

    console.log(metadata)
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
  // get the organ type which depends on if a source entity was specified or 
  // if it's an edit just used the designated organ
  // getOrgan = () => {
  //   try {
  //     return this.state.source_entity.organ;
  //   } catch {
  //     try {
  //       return this.state.organ;
  //     } catch {}
  //   }
  //   return "";
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
            protocol_url: this.state.protocol,
           // rui_location: this.state.rui_location,
            specimen_type: this.state.specimen_type,
            specimen_type_other: this.state.specimen_type_other,
            //source_uuid: this.state.source_uuid,
            direct_ancestor_uuid: this.state.source_uuid_list,
            organ: this.state.organ,
            organ_other: this.state.organ_other,
            visit: this.state.visit,
            //sample_count: this.state.sample_count,
            description: this.state.description,
            // metadata: this.state.metadata,
            // metadata_file:
            //   this.state.metadata_file_name === "Choose a file"
            //     ? ""
            //     : this.state.metadata_file_name,
            // // protocols: [],
            //images: [],
            //metadatas: []
          };

          // hack for blood as an organ
          // if (this.state.specimen_type === 'blood') {
          //   data['specimen_type'] = 'organ';
          //   data['organ'] = 'BD';
          // 

          if ( this.state.rui_location && this.state.rui_location.length !== "") {
            data["rui_location"] = JSON.parse(this.state.rui_location);
          }

          console.log('submit metadatas', this.state.metadatas);
          if (this.state.metadatas.length > 0) {
            let metadata_files_to_add = [];
            let existing_meta_files_to_update = [];
 
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

         if (this.state.deleted_metas.length > 0)  { 
           data['metadata_files_to_remove'] = this.state.deleted_metas;
         }

          if (this.state.images.length > 0) {
            let image_files_to_add = [];
            let existing_image_files_to_update = [];
            console.log('submit images', this.state.images)
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

        console.log("SUBMMITED data")
        console.log(data)
      

        if (this.props.editingEntity && !this.state.LocationSaved) {
          console.log("Updating Entity....")
          entity_api_update_entity(this.props.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status == 200) {
                    console.log('Update Entity...');
                    console.log(response.results);
                    this.props.onUpdated(response.results);
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
      
              });
        } else {
          console.log('selected group', this.state.selected_group);

          if (this.state.selected_group && this.state.selected_group.length > 0) {
              data["group_uuid"] = this.state.selected_group;
          } else {
              data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
          }

          console.log("Create a new Entity....")
           entity_api_create_entity("sample", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status == 200) {
                    console.log('create Entity...');
                    console.log(response.results);

                    if (this.state.sample_count > 0) {
                      // now generate some multiples
                      entity_api_create_multiple_entities(this.state.sample_count, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                        .then((resp) => {
                          if (resp.status == 200) {
                             this.props.onCreated({new_samples: resp.results, entity: response.results});
                          }
                      });
                   } else {
                      this.props.onCreated({new_samples: [], entity: response.results});
                   }
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
              });
          }
        }
      }
    });
  };

  // validateUUID = () => {
  //   let isValid = true;
  //   const uuid = this.state.source_uuid;
  //   // const patt = new RegExp("^.{3}-.{4}-.{3}$");
  //   // if (patt.test(uuid)) {
  //   this.setState({
  //     validatingUUID: true
  //   });
  //   if (true) {
  //     const config = {
  //       headers: {
  //         Authorization:
  //           "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
  //         "Content-Type": "multipart/form-data"
  //       }
  //     };

  //     return axios
  //       .get(
  //         `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${uuid}`,
  //         config
  //       )
  //       .then(res => {
  //         if (res.data) {
  //           this.setState(prevState => ({
  //             source_entity: res.data,
  //             formErrors: { ...prevState.formErrors, source_uuid: "valid" }
  //           }), () => {
  //             // Get sex info
  //             axios.get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${this.state.source_entity.source_uuid}`,
  //               config
  //             ).then(res => {
  //               const metadata_str = res.data.entity_node?.metadata;
  //               if (metadata_str === undefined) {
  //                 this.setState({
  //                   source_entity: {
  //                     specimen: {
  //                       ...this.state.source_entity.specimen,
  //                       sex: ""
  //                     }
  //                   }
  //                 });
  //               } else {
  //                 const metadata = JSON.parse(metadata_str);
  //                 try {
  //                   const sex = metadata.organ_donor_data.find(e => e.grouping_concept_preferred_term === "Sex").preferred_term.toLowerCase();
  //                   this.setState({
  //                     source_entity: {
  //                       specimen: {
  //                         ...this.state.source_entity.specimen,
  //                         sex: sex
  //                       }
  //                     }
  //                   });
  //                 } catch {
  //                   this.setState({
  //                     source_entity: {
  //                       specimen: {
  //                         ...this.state.source_entity.specimen,
  //                         sex: ""
  //                       }
  //                     }
  //                   });
  //                 }
  //               }
  //             }).catch(err => {
  //               console.log(err);
  //             })
  //           });
  //           return isValid;
  //         } else {
  //           this.setState(prevState => ({
  //             source_entity: null,
  //             formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
  //           }));
  //           isValid = false;
  //           alert("The Source UUID does not exist.");
  //           return isValid;
  //         }
  //       })
  //       .catch(err => {
  //         this.setState(prevState => ({
  //           source_entity: null,
  //           formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
  //         }));
  //         isValid = false;
  //         alert("The Source UUID does not exist.");
  //         return isValid;
  //       })
  //       .then(() => {
  //         this.setState({
  //           validatingUUID: false
  //         });
  //         return isValid;
  //       });
  //   } else {
  //     this.setState(prevState => ({
  //       formErrors: { ...prevState.formErrors, source_uuid: "invalid" }
  //     }));
  //     isValid = false;
  //     alert("The Source UUID is invalid.");
  //     return new Promise((resolve, reject) => {
  //       resolve(false);
  //     });
  //   }
  // };

  

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

      const usedFileName = new Set();
      // this.state.protocols.forEach((protocol, index) => {
      //   if (protocol.protocol_file !== "") {
      //     usedFileName.add(getFileNameOnPath(protocol.protocol_file));
      //   }
      //   if (!protocol.ref.current.validate()) {
      //     isValid = false;
      //   }

      //   if (protocol.ref.current.protocol_file.current.files[0]) {
      //     if (
      //       usedFileName.has(
      //         protocol.ref.current.protocol_file.current.files[0].name
      //       )
      //     ) {
      //       protocol["error"] = "Duplicated file name is not allowed.";
      //       isValid = false;
      //     }
      //   }
      // });

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

      if (!validateProtocolIODOI(this.state.protocol_url)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter a valid protocols.io DOI"
            }
          }));
          isValid = false;

      }

      console.log('validate images')

      // validate the images
      this.state.images.forEach((image, index) => {
      if (!image.file_name && !validateRequired(image.ref.current.image_file.current.value)) {
       // console.log('image invalid', image.file_name)
        isValid = false;
        image.ref.current.validate();
      }
      if (!validateRequired(image.ref.current.image_file_description.current.value)) {
         //console.log('descr missing')
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

      // this.state.images.forEach((image, index) => {
      //   if (
      //     !validateRequired(image.file_name) &&
      //     !validateRequired(image.ref.current.image_file.current.value)
      //   ) {
      //     isValid = false;
      //     image.ref.current.validate();
      //   }
      //   if (
      //     !validateRequired(
      //       image.ref.current.image_file_description.current.value
      //     )
      //   ) {
      //     isValid = false;
      //     image.ref.current.validate();
      //   }
      // });

      // this.state.images.forEach((image, index) => {
      //   usedFileName.add(image.file_name);

      //   if (image.ref.current.image_file.current.files[0]) {
      //     if (
      //       usedFileName.has(image.ref.current.image_file.current.files[0].name)
      //     ) {
      //       image["error"] = "Duplicated file name is not allowed.";
      //       isValid = false;
      //     }
      //   }
      // });

      // if (!this.props.editingEntity) {
      //   // Creating
      //   this.state.metadatas.forEach((metadata, index) => {
      //     if (
      //       !validateRequired(metadata.ref.current.metadata_file.current.value)
      //     ) {
      //       isValid = false;
      //       metadata.ref.current.validate();
      //     }
      //   });
      // }

      // this.state.metadatas.forEach((metadata, index) => {
      //   usedFileName.add(metadata.file_name);

      //   if (metadata.ref.current.metadata_file.current.files[0]) {
      //     if (
      //       usedFileName.has(
      //         metadata.ref.current.metadata_file.current.files[0].name
      //       )
      //     ) {
      //       metadata["error"] = "Duplicated file name is not allowed.";
      //       isValid = false;
      //     }
      //   }
      // });

      console.log('validate SOURCE UUID')
      if (!validateRequired(this.state.source_uuid)) {
        console.log('not valid uuid')
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, source_uuid: "required" }
        }));
        isValid = false;
        resolve(isValid);
      } else {

      console.log('validate SOURCE UUID valid')
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
    console.log('SOURCE UUID', ids)

    if (ids) {
        entity_api_get_entity_ancestor( ids[0].source_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status == 200) {
                    console.log('Entity ancestors...', response.results);
                    console.log(response.results);
                    if (response.results.length > 0) {
                      this.setState({
                        organ: response.results[0].organ
                      });
                  } 
                }
              });
    }

    this.setState(
      {
        source_uuid: ids[0].hubmap_id,
        source_entity: ids[0].entity,
        source_uuid_list: ids[0].source_uuid,   // just add the single for now
        source_entity_type: ids[0].entity.entity_type,
        sex: this.getGender(ids[0].entity),
        LookUpShow: false
      }
    
      // ,
      // () => {
      //   this.validateUUID();
      // }
    );
      console.log('source results', ids[0])
  };

 // only handles one selection at this time
  getSourceAncestor(source_uuids){
    let id = ""; 
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
    }
    return ""
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    let id = ""; 
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
        
        {this.state.editingMultiWarning && !this.props.readOnly && (
          <div className="alert alert-danger col-sm-12" role="alert">
            {this.state.editingMultiWarning}
          </div>
        )}
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
                    <div>
                    <input type="text" readOnly className="form-control" id="static_visit" value={this.state.visit}></input>
                    </div>
                  )}
                </div>
              )}
            <div className="form-group">
              <label
                htmlFor="protocol">
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
                <div>
                    <input type="text" readOnly className="form-control" id="static_protocol" value={this.state.protocol}></input>
                </div>
              )}
            
            </div>
            {/* {this.state.protocols.map((protocol, index) => {
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
            )} */}
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
            {!this.state.multiple_id &&
              !this.state.editingMultiWarning &&
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

            {this.state.ids &&
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
                    onSaveLocation={this.handleSavedLocations}
                  />
                </React.Fragment>
              )}
            {this.props.editingEntity &&
              this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             (["LK", "RK", "HT", "SP", "LI"].includes(this.state.organ)) && (
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
                    onSaveLocation={this.handleSavedLocations}
                  />
                </React.Fragment>
              )}
            {!this.props.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.organ) &&
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
             ["LK", "RK", "HT", "SP", "LI"].includes(this.state.organ) &&
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
                            organ={this.state.organ}
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
                            Modify Location Information
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
            {(!this.props.readOnly || this.state.metadatas.length > 0) && (
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
	                          Attach Metadata
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
            {(!this.props.readOnly || this.state.images.length > 0) && (
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
	                          Attach Image(s)
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
