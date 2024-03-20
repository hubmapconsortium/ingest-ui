import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import Snackbar from '@mui/material/Snackbar';

// import Snackbar from '@material-ui/core/Snackbar';
//import SnackbarContent from '@material-ui/core/SnackbarContent';
import Button from '@material-ui/core/Button';
// import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
// import IconButton from '@material-ui/core/IconButton';
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
  validateProtocolIODOI,
  validateSingleProtocolIODOI
//  validateFileType
} from "../../../utils/validators";
import { tsToDate } from "../../../utils/string_helper";
import check from './check25.jpg';
//import { getFileNameOnPath, getFileMIMEType } from "../../../utils/file_helper";
import { flattenSampleType } from "../../../utils/constants_helper";
import { parseErrorMessage } from "../../../utils/string_helper";
import ReactTooltip from "react-tooltip";
//import Protocol from "./protocol";
//import Modal from "../modal";
import SearchComponent from "../../search/SearchComponent";
//import IDSearchModal from "./idSearchModal";
import GroupModal from "../groupModal";
import { SAMPLE_TYPES, RUI_ORGAN_TYPES } from "../../../constants";
import { ubkg_api_get_organ_type_set } from "../../../service/ubkg_api";
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
import { ingest_api_allowable_edit_states, ingest_api_all_user_groups, ingest_api_get_associated_ids } from '../../../service/ingest_api';
// import { useHistory } from "react-router-dom";

class TissueForm extends Component {
  state = {
    lab: "",
    lab_tissue_id: "",
    back_btn_hide: false,
    param_uuid: "",
    protocol_url: "",
    entity_type: "",
    source_entity_type: "",
    specimen_type: "",
    specimen_type_other: "",
    source_uuid: "",
    source_uuid_list: "",
    sample_category:[],
    sample_category_library:SAMPLE_TYPES,
    ancestor_organ: "",
    LocationSaved:false,
    organ: "",
    organ_other: "",
    visit: "",
    description: "",
    metadata: "",
    metadata_file: "",
    LookUpShow: false,
    lookUpCancelled: false,
    multiple_id: false,
    RUI_ACTIVE: true,   // this controls whether the RUI buttons will be active (true) or not overall
    rui_check: false,
    rui_view: false,
    rui_hide: true,
    rui_click: false,
    rui_show: false,
    rui_show_btn: false,
    rui_location: "",
    sample_count: "",
    protocol_file_name: "Choose a file",
    metadata_file_name: "Choose a file",

    title:"",
    publication_date:"",
    publication_doi:"",
    publication_url:"",
    publication_venue:"",
    volume:"",
    issue:"",
    pages_or_article_num:"",
    publication_status:"",

    metadatas: [],
    images: [],
    thumbnail: [],
    related_group_ids: [],

    new_metadatas: [],
    deleted_metas: [],
    new_images: [],
    deleted_images: [],
    new_thumbnail: [],
    deleted_thumbnail: [],
    groups: [],
    groups_dataprovider:[],
    groups_access:[],
    selected_group: "",
    error_message_detail: "",
    error_message: "Oops! Something went wrong. Please contact administrator for help.",
    readOnly: false,
    setOpen: false,
    show_snack: false,
    show_dirty_warning: false,
    submitting: false,
    GroupSelectShow: false,
    snackmessage: "", 
    isDirty: false,
    formErrors: {
      lab: "",
      // lab_tissue_id: "",
      // protocols: "",
      title: "",
      title_DOI: "",
      protocol_url: "",
      protocol_url_DOI: "",
      specimen_type: "",
      specimen_type_other: "",
      sample_category:"",
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

  handleChangeSample = (uuid) => {
    this.setState({ loadWithin: true });
    this.props.handleChangeSamplePage(uuid);  
    
  }

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.editingEntity !== this.props.editingEntity){
      this.setState({
        editingEntity: this.props.editingEntity,
        loadWithin:false
      })
    }else{
      // console.debug("SAME PROP");
    }
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

    ubkg_api_get_organ_type_set()
    .then((res) => {
      this.setState({organ_types: res}, () => {
        console.log(this.state.organ_types);
      }, () => {
        console.log('ERROR: ubkg_api_get_organ_type_set')
      });
    });

    ingest_api_all_user_groups(JSON.parse(localStorage.getItem("info")).groups_token) // @TODO Multiple places that use this do filtering after, just grab "ingest_api_users_groups" instead? 
      .then(res => {
        
        
        const groups = res.results.filter(
          // It filters our read only, but what about other permissions like admin? 
          g => g.data_provider === true

        );
        
        //  We have both Data-Provider groups as well as non. 
        // The DP needs to be deliniated for the dropdown & assignments
        // the rest are for permissions
        this.setState({
          groups: groups,
          groups_dataprovider: groups,
        });
      })
      .catch(err => {
        
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

      try {
          let param_uuid = ""
          try {
            param_uuid = this.props.match.params.uuid
          } catch {
            param_uuid = this.props.editingEntity.uuid;
          }
          entity_api_get_entity(param_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
            .then((response) => {
                if (response.status === 200) {
                  let entity_data = response.results;
                
                  // check to see if user can edit
                  ingest_api_allowable_edit_states(param_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                      .then((resp) => {
                          // let read_only_state = false
                          if (resp.status === 200) {
                            let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
                            // OVERRIDE: UNCOMMENT THE LINE BELOW TO ALWAYS ALLOW THE SCREEN TO BE EDITED. TEMPORARY SOLUTION 
                            // read_only_state = false  //  editing on: 7/7/23  
                            // Commented: 7/7/23
                            // Uncommented:6/26/23  
                            this.setState({
                              editingEntity: entity_data,
                              readOnly: read_only_state,   // used for hidding UI components
                              param_uuid: param_uuid 
                            }, () => {
                              this.checkForRelatedGroupIds(entity_data);
                              this.initialize();
                           
                              
                            });
                          }  else {   // need to do this if the response fails, or it won't load the entity data
                             this.setState({
                              editingEntity: entity_data,
                              readOnly: false, 
                              param_uuid: param_uuid 
                            }, () => {
                              this.checkForRelatedGroupIds(entity_data);
                              this.initialize();
                           
                            });
                          }           
                  });
                }
          });
      } catch {
        

        if (this.props) {
        // run load props from  createnext previous call
          this.setState(
            {
              editingEntityProp:this.props.editingEntity,
              specimen_type: this.props.specimenType,
              source_entity_type: this.props.source_entity_type ? this.props.source_entity_type : 'Donor',
              source_entity: this.props.direct_ancestor ? this.props.direct_ancestor : "",
              source_uuid: this.props.sourceUUID,   // this is the hubmap_id, not the uuid
              ancestor_organ: this.props.direct_ancestor ? this.props.direct_ancestor.organ : "",
              organ: this.props.direct_ancestor ? this.props.direct_ancestor.organ : "",
              source_uuid_list: this.props.uuid  // true uuid
            });
        }
      }

    }

    initialize() {

      if (this.props.hideBackButton) { 
        this.hideBackButton();
      }

      if (this.state.editingEntity) {
        
        let images = this.state.editingEntity.image_files;
        let metadatas = this.state.editingEntity.metadata_files;
        let thumbnail_file = this.state.editingEntity.thumbnail_file;
    
        const image_list = [];
        const metadata_list = [];
        const thumbnail_list = [];

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

        try {
         
            thumbnail_list.push({
              id: 1,
              ref: React.createRef(),
              file_name: thumbnail_file.filename,
              file_uuid: thumbnail_file.file_uuid
            });         
        } catch {}

        this.setState(
          {
            author: this.state.editingEntity.created_by_user_email,
            organ: this.props.editingEntity.organ ? this.props.editingEntity.organ : this.props.editingEntity.direct_ancestor.organ,
            visit: this.state.editingEntity.visit ? this.state.editingEntity.visit : "",
            lab_tissue_id: this.state.editingEntity.lab_tissue_sample_id ? this.state.editingEntity.lab_tissue_sample_id : "",
            description:(this.state.editingEntity.description ? this.state.editingEntity.description : ""),
            protocol_url: this.state.editingEntity.protocol_url,
            entity_type: this.state.editingEntity.entity_type,
            specimen_type: this.state.editingEntity.specimen_type, // this.determineSpecimenType(),
            specimen_type_other: this.state.editingEntity.specimen_type_other,
            sample_category:this.state.editingEntity.sample_category,
            rui_location: JSON.stringify(this.state.editingEntity.rui_location, null, 3) || "",
            rui_check: JSON.stringify(this.state.editingEntity.rui_location, null, 3) ? true : false,
            images: image_list,
            metadatas: metadata_list,
            thumbnail: thumbnail_list,
            source_uuid: this.getID(),
            source_entity: this.state.editingEntity.direct_ancestor,
            source_entity_type: this.state.editingEntity.direct_ancestor.entity_type,
          }, () => {
            console.debug("ORGANCHECK",this.props.editingEntity.organ, this.isSpecialOrganType(this.props.editingEntity.organ),this.props.editingEntity.sample_category );
            if(this.isSpecialOrganType(this.props.editingEntity.organ) && this.props.editingEntity.sample_category !== "organ" ){
              this.setState({
                rui_show_btn: true
              }, () => {
                console.debug('%c◉ RUISHOW ', 'color:#00ff7b');
                })
            }
          })

          if(this.state.editingEntity.direct_ancestor.entity_type === "Donor" || this.state.editingEntity.direct_ancestor.entity_type === "Organ"){
            this.getSourceAncestorOrgan(this.state.editingEntity);
          }
          


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

        );

      }

  }

  fetchOrganTypes(){
    ubkg_api_get_organ_type_set()
      .then((res) => {
        console.debug("fetchOrganTypes", res);
        return res
      })
      .catch((err) =>{
        console.debug("ERR fetchOrganTypes",err);
      })
  }

  checkForRelatedGroupIds(entity) {
         const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
            "Content-Type": "application/json"
          }
      };

        ingest_api_get_associated_ids(entity.uuid,  JSON.parse(localStorage.getItem("info")).groups_token)
          .then(res => {
            console.debug("LENGTH .data.ingest_group_ids.length", res.results.length);
            console.debug("ingest_api_get_associated_ids", res.results);
            if (res.results.length > 0) {
              this.setState({
                related_group_ids:res.results
              }, () => {
                console.debug("RELATED IDS:", this.state.related_group_ids);
              })
              res.results.sort((a, b) => {
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

              this.setState({
                  editingMultiWarning: `This sample is part of a group of ${res.data.ingest_group_ids.length} other 
                   ${ entity.sample_category } samples, ranging from ${first_lab_id} through ${last_lab_id}`,
                  related_group_ids: res.data.ingest_group_ids
              });
      
            }
          })
          .catch(err => {
            if (err.response === undefined) {
            } else if (err.response.status === 401) { // @TODO: Try moving all the auth checkins out of the forms
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
      // We're not reloading the view anymore, we want to pass the UUID up
      // to our parent
      // By not reloading, we should be Going to the Page fresh as if it were selected from the main search. 
      //  Window reloadign and all
      this.handleChangeSample(param_uuid); 
     
    }
  }
  

  getSourceAncestorOrgan(entity) {
    //var ancestor_organ = ""
    // check to see if we have an "top-level" ancestor 
      entity_api_get_entity_ancestor( entity.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
        .then((response) => {
          if (response.status === 200) {
               ////
              if (response.results.length > 0) {
                  
                
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
    // window.history.back();
    if(this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
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

    console.debug("handleInputChange", name, value);
    console.debug(this.state.source_entity.display_subtype, this.isSpecialOrganType(this.state.organ));
    
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
        } else if (!validateSingleProtocolIODOI(value)) {
        
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter only one valid protocols.io URL"
            }
          }));
        } else {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "required"
            }
          }));
        }
        break;

      case "sample_category":
        this.setState({ sample_category: value });
        // Need to manually fire a change to RUI rendering
        if(value==="block" && this.isSpecialOrganType(this.state.organ)){
          this.setState({ 
            rui_show_btn: true 
          }, () => {
            console.debug('%c◉ Showin RUI Button! ', 'color:#00ff7b');
          })
        }
        if (!validateRequired(value)) {
          
          this.setState(prevState => ({
            formErrors: { 
              ...prevState.formErrors, 
              sample_category: "required" }
          }));
        
        } else {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, sample_category: "" }
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
        break;
      case "visit":
        this.setState({ visit: value });
        break;
      case "description":
        this.setState({ description: value });
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
    console.debug('%c◉ this.props.organ ', 'color:#00ff7b', this.props.organ);
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
        let images = [...this.state.images];
        images[i].file_name = images[i].ref.current.image_file.current.files[0].name;
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
      case "thumbnail": {
        const i = this.state.thumbnail.findIndex(i => i.id === id);
        let thumbnail = [...this.state.thumbnail];
        thumbnail[i].file_name = thumbnail[i].ref.current.image_file.current.files[0].name;
        let new_thumbnail = [...this.state.new_thumbnail];
        new_thumbnail.push(thumbnail[i].file_name);
        return new Promise((resolve, reject) => {
          this.setState({
            thumbnail,
            new_thumbnail
          }, () => {
              this.setState({
                new_thumbnail
              })
              resolve();
          });
        });
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

  validateThumbnailFile = id => {
       return true;
   }



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

  handleAddThumbnail = () => {
    // only allow one thumbnail
    if (this.state.thumbnail.length > 0) {
      return
    }
    this.setState({
      thumbnail: [
      ...this.state.thumbnail,
      { id: 1, ref: React.createRef() }
      ]
    })
  }

  handleDeleteThumbnail = id => {
    const deleted_thumb = this.state.thumbnail.find(i => i.id === id);
    const new_thumbnail = this.state.new_thumbnail.filter(dm => dm !== deleted_thumb.file_name);
    let deleted_thumbnail = [...this.state.deleted_thumbnail];

    ////
    if (new_thumbnail.length === this.state.new_thumbnail.length){
      deleted_thumbnail.push(deleted_thumb.file_uuid);
    }
    const thumbnail = this.state.thumbnail.filter(i => i.id !== id);
    this.setState({
      thumbnail,
      new_thumbnail,
      deleted_thumbnail
    });

  };

  handleDeleteMetadata = metadataId => {

    //  ////
    const remove_meta = this.state.metadatas.find(i => i.id === metadataId); // find our metadata file in the existing
    const metadatas = this.state.metadatas.filter(i => i.id !== metadataId)  // recreate the metadata w/o the deleted
    const new_metadatas = this.state.new_metadatas.filter(dm => dm !== remove_meta.uuid);
    let deleted_metas = [...this.state.deleted_metas];
    deleted_metas.push(remove_meta.file_uuid);
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
    return RUI_ORGAN_TYPES.includes(otype);
  }

  // special case for donors
  isOrganBloodType = sptype => {
    return sptype === "organ" ||
          sptype === "blood";
  }
 
 getGender = (entity) => {
    const metadata = entity?.metadata;
    if (metadata === undefined) {
      return ""
    } else {
          //traverse the organ array for a concept that matches
          //@TODO: Why are we getting this? Do we need to infer this data? If it was needed, itd be in the metadata
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
            sample_category: this.state.sample_category,
            direct_ancestor_uuid: this.state.source_uuid_list,
            organ_other: this.state.organ_other,
            visit: this.state.visit,
            description: this.state.description,
          };

          if (this.state.sample_category === 'organ') {
            data["organ"] = this.state.organ;

          }

          // only add these fields if user didn't check multiples
          if (this.state.sample_count < 1) {
            data["lab_tissue_sample_id"] = this.state.lab_tissue_id;
            if (this.state.rui_location && this.state.rui_location.length !== "") 
            {
              data["rui_location"] = JSON.parse(this.state.rui_location);
            }

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
           if (this.state.deleted_metas.length > 0)  { 
             data['metadata_files_to_remove'] = this.state.deleted_metas;
           }

          if (this.state.images.length > 0) {
              let image_files_to_add = [];
              let existing_image_files_to_update = [];
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

          if (this.state.thumbnail.length > 0) {
              let thumb_files_to_add = [];
              let existing_thumb_files_to_update = [];
              this.state.thumbnail.forEach(i => {

              // if a file has a non-blank temp_file_id then assume it a new image 
                if (i.ref.current.state.temp_file_id !== "") {
                  thumb_files_to_add.push({
                    temp_file_id: i.ref.current.state.temp_file_id
                  });
                } else {  // this will send image data that may have been updated
                  existing_thumb_files_to_update.push({
                     file_uuid: i.file_uuid
                  })
                }
              });  

               // check to see if we really did add any new images 
              if (thumb_files_to_add.length > 0) {
                data['thumbnail_file_to_add'] = thumb_files_to_add[0];
              }
              // send any updates to the existing descriptions, there is no check for changes
              if (existing_thumb_files_to_update.length > 0 ) {
                data["thumbnail_file"] = existing_thumb_files_to_update[0];
              }
          }

          // check for any removed thumbnails
          if (this.state.deleted_thumbnail.length > 0) {
            // 
            data['thumbnail_file_to_remove'] = this.state.deleted_thumbnail[0]
          }
        }  // end of:  if (this.state.sample_count < 1)


        // if (this.state.editingEntity && !this.state.LocationSaved) {
        if (this.state.editingEntity) {
          entity_api_update_entity(this.state.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status === 200) {
                    this.setState({ submit_error: false, 
                      submitting: false, 
                      show_snack: true,
                      show_dirty_warning: false,
                      snackmessage: "Save was succesful",
                      isDirty: false });

                    // if they are NOT editing a multiples just do normal update and closed the page,
                    // if will just show an Save snackmessage so they can edit other samples
                    if (this.state.related_group_ids.length < 2) {  
                      this.props.onUpdated(response.results);
                    }
                    this.setState({ submit_error: false, submitting: false, isDirty: false });
                  } else {
                    this.setState({ submit_error: true, submitting: false, isDirty: false });
                    this.setDirty(false);
                    entity_api_update_entity(this.state.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  }
          });
        } else {
            if (this.state.selected_group && this.state.selected_group.length > 0) {
                data["group_uuid"] = this.state.selected_group; 
            } else {
              data["group_uuid"] = this.state.groups_dataprovider[0].uuid; // consider the first users group        
            }
            if (this.state.sample_count < 1) {
                
                entity_api_create_entity("sample", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                    .then((response) => {
                      if (response.status === 200) {
                        this.props.onCreated({new_samples: [], entity: response.results});
                        this.setState({ submit_error: false, submitting: false});
                        
                      } else if (response.status === 400) {
                         this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(response.results) });
                      } 
                  });
                } else if (this.state.sample_count > 0) {
                    
                    // now generate some multiples
                    entity_api_create_multiple_entities(this.state.sample_count, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                      .then((resp) => {
                        console.debug("entity_api_create_multiple_entities",resp);
                        if (resp.status === 200) {
                          
                                 //this.props.onCreated({new_samples: resp.results, entity: response.results});
                          this.props.onCreated({new_samples: resp.results, entity: data});   // fro multiples send the 'starter' data used to create the multiples
                          this.setState({ submit_error: false, submitting: false});
                        } else if (resp.status === 400) {
                            this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(resp.results) });
                            } 
                        });
                }
          }
        }
      }else{
      
      }
    });
  };

  renderButtons() {
    if (this.state.editingEntity) {
      if (this.state.readOnly) {
        return (
          <div className="row"><div className="col-sm-12  m-2">
          <Divider />
          </div>
            <div className="col-sm-12 text-right pads">
              <Button
                type="button"
                variant="outlined"
                onClick={() => this.handleCancel()}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
      } else {
        return (
          <div className="row">
          <div className="col-sm-12 m-2">
            <Divider />
          </div>
            <div className="buttonWrapRight">
              <Button
                type="submit"
                color="primary"
                variant="contained"
                className="btn btn-primary mr-1"
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
              </Button> 
            {!this.state.back_btn_hide && (
              <Button
                id="editBackBtn"
                type="button"
                variant="outlined"
                onClick={() => this.props.handleCancel()}
              >
                Cancel
              </Button>
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
            <div className="buttonWrapRight">
            <Button
              type="submit"
              className="btn btn-primary mr-1"
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
            </Button>
            <Button
              type="button"
             variant="outlined"
              onClick={() => this.handleCancel()}
            >
              Cancel
            </Button>
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

      if (
        this.state.sample_category === "organ" &&
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
            formErrors: { ...prevState.formErrors, protocol_url: "required" }
          }));
          isValid = false;
        } else if (!validateProtocolIODOI(this.state.protocol_url) ||
        !validateSingleProtocolIODOI(this.state.protocol_url)) {
            this.setState(prevState => ({
              formErrors: {
                ...prevState.formErrors,
                protocol_url_DOI: "Please enter one valid protocols.io DOI"
              }
            }));
            isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, protocol_url: "" }
        }));
      }
      if (!validateRequired(this.state.sample_category)) {
          this.setState(prevState => ({
            formErrors: { ...prevState.formErrors, sample_category: "required" }
          }));
          isValid = false;
      } else {
        this.setState(prevState => ({
          formErrors: { ...prevState.formErrors, sample_category: "" }
        }));
      }

  
      
      if (this.state.sample_count < 1) { // only validate if we are not doing multiples
      // validate the images
        this.state.images.forEach((image, index) => {
          if (!image.file_name && !validateRequired(image.ref.current.image_file.current.value)) {
           // ////
            isValid = false;
            image.ref.current.validate();
          }
          if (!validateRequired(image.ref.current.image_file_description.current.value)) {
             //////
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
     
    }      
    });
  }

  handleLookUpClick = () => {
//  
    

    if (!this.state.lookUpCancelled) {
      this.setState({
        LookUpShow: true
      });
    } else {
      this.setState({
        LookUpShow: false
      });
    }
     this.setState({
        lookUpCancelled: false
      }); 
  }

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

    

    if (selection) {
      // check to see if we have an "top-level" ancestor 

      // Organ added to the Column results for Samples, can pluck it from row.organ now!
      // For Ancestry-reasons, we should still check for the top-level ancestor
      entity_api_get_entity_ancestor( selection.row.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        // console.debug("selection", selection);
        // console.debug("handleSelectClick: selection.row.uuid: " + selection.row.uuid, selection.row.organ);
        // console.debug("handleSelectClick: response.status: " + response.status);
        if (response.status === 200) {
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
            sex: this.getGender(selection.row)
          }, () => {
            
          });
          
          this.cancelLookUpModal();
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

        {this.state.related_group_ids.length > 1
          && (
            <div severity="info" className="alert alert-primary col-sm-12 " role="alert">
            {this.state.editingMultiWarning}{" "}
            <p>Click below to expand and view the groups list. Then select an Sample ID to edit the sample data.  Press the update button to save your changes.</p>
            <Accordion>
                <AccordionSummary
                  expandIcon={<FontAwesomeIcon icon={faAngleDown} />}
                  aria-controls="panel1a-content"
                  id="panel1a-header"
                >Sample Group List
              </AccordionSummary>
              <AccordionDetails className="idlist">
                
                  <ul className="">
                    { this.state.related_group_ids.length > 0 && this.state.related_group_ids.map((item, index) => {
                      if (item.uuid === this.state.editingEntity.uuid) {
                        return (
                          <li key={item.submission_id} className="active">
                             <Button 
                              type="button"
                              className="btn btn-link">
                                {`${item.submission_id}`}
                            </Button>
                          </li>
                          );
                      } else {
                        return (
                          <>
                          <li key={item.submission_id}>
                          <Button 
                            type="button"
                            className="btn btn-link" 
                            onClick={(e) => this.handleMultiEdit(item.uuid, e)}>
                              {`${item.submission_id}`}
                            </Button>
                          </li>
                          </>
                         );
                      }
        
                      })
                    }
                    </ul>
              </AccordionDetails>
            </Accordion>
          </div>   
        )}
        

        {this.state.loadWithin && (
          <LinearProgress />
        )}
     

        <div className="col-sm-12 pads">
          {this.state.editingEntity && 
            this.state.editingEntity.data_access_level === 'public' && 
              this.state.read_only_state && (

            <React.Fragment>
              <div className="alert alert-warning text-center" role="alert">This entity is no longer editable. It was locked when it became publicly 
              accessible when data associated with it was published.</div>
            </React.Fragment>
          )}
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
     
          <form className="formSpacer expanded-form" onSubmit={this.handleSubmit}>
            
            
            <div className="form-group">
              <label htmlFor="source_uuid">
                Source ID <span className="text-danger">*</span>  <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for="source_uuid_tooltip"
                />
                <ReactTooltip
                  id="source_uuid_tooltip"
                  className={"tooltip"}
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
            
              {!this.state.readOnly && (
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
                     <Button
                      variant="outlined"
                      className="btn btn-outline-secondary"
                      type="button"
                      onClick={this.handleLookUpClick}
                    >
                      <FontAwesomeIcon
                          icon={faSearch}
                          data-tip
                          data-for="source_uuid_tooltip"
                      />
                    </Button>
                  </div>
                  
                    <Dialog fullWidth={true} maxWidth="lg" onClose={this.hideLookUpModal} aria-labelledby="source-lookup-dialog" open={this.state.LookUpShow}>
                     <DialogContent>
                    <SearchComponent
                      select={this.handleSelectClick}
                      custom_title="Search for a Source ID for your Sample"
                      filter_type="Sample"
                      blacklist={['collection']}
                      modecheck="Source"
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
              {this.state.readOnly && (
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
                          <b>Source Category:</b>{" "}
                          {this.state.source_entity.sample_category
                            ? flattenSampleType(SAMPLE_TYPES)[
                            this.state.source_entity.sample_category
                            ]
                            : this.state.source_entity.entity_type}
                        </div>
              
                        {this.isOrganBloodType(this.state.source_entity.sample_category) && (
                            <div className="col-sm-12">
                              <b>Organ Type:</b>{" "}
                              {
                                this.state.organ_types[
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
                          

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <label
                htmlFor="sample_category">
                Sample Category <span className="text-danger">*</span>  
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for="sample_category_tooltip"
                />
                <ReactTooltip
                  id="sample_category_tooltip"
                  className={"tooltip"}
                  place="top"
                  type="info"
                  effect="solid"
                >
                  <p>The category of sample.</p>
                </ReactTooltip>
              </label>
              {!this.state.readOnly && (
                <React.Fragment>
                  <div>
                    <select
                      name="sample_category"
                      id="sample_category"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.sample_category)
                      }
                      onChange={this.handleInputChange}
                      value={this.state.sample_category}
                    >
                      {
                      //@TODO Cant seem to programatically list the options?
                    }
                      <option value="">Select Category</option>
                      {this.state.source_entity_type==="Donor" && (
                        <option value="organ" id="organ">Organ</option>
                      )}
                      {this.state.source_entity_type!="Donor" && (
                        <>
                        <option value="block" id="block">Block</option>
                        <option value="section" id="section">Section</option>
                        <option value="suspension" id="suspension">Suspension</option>
                        </>
                      )}

                    
                    </select>
                  </div>

                </React.Fragment>
              )}
              {this.state.readOnly && (
                <React.Fragment>
            
                  <div className="col-sm-3">
                   <input 
                    readOnly 
                    type="text" 
                    className="form-control" 
                    id="_readonly_sample_category"
                   value={(this.state.sample_category)}>
                   </input>
                    {/* <p>
                      {(this.state.sample_category)}
                    </p> */}
                    </div>
                  
                </React.Fragment>
              )}
            
            </div>
            {this.state.sample_category === "organ" && (
              <div className="form-group row">
                <label
                  htmlFor="organ"
                  className="col-sm-2 col-form-label text-right"
                >
                  Organ Type<span className="text-danger">*</span>
                </label>
                {!this.state.readOnly && (
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
                        {Object.entries(this.state.organ_types).map((op, index) => {
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
                {this.state.readOnly && (
                  <div>
                   <input type="text"
                          readOnly
                          className="form-control"
                          id="static_organ"
                          value={this.state.organ === "OT" ? this.state.organ_other : this.state.organ_types[this.state.organ]}>
                   </input>
                  </div>
                )}
              </div>
            )}
            {["organ", "biopsy", "blood"].includes(this.state.sample_category) &&
              (!this.state.readOnly || this.state.visit !== undefined) && (
                <div className="form-group">
                  <label
                    htmlFor="visit"
                  >
                    Visit <span className="text-danger inline-icon"><FontAwesomeIcon icon={faUserShield} /></span>
                    <span>
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for="visit_tooltip"
                  />
                  <ReactTooltip
                    id="visit_tooltip"
                    className={"tooltip"}
                    place="top"
                    type="info"
                    effect="solid"
                  >
                    <p>
                      Associated visit in which sample was acquired (Non-PHI number). e.g., baseline
                      </p>
                  </ReactTooltip>
                </span>
                  </label>
                  {!this.state.readOnly && (
                   
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
                  {this.state.readOnly && (
                    <div>
                    <input type="text" readOnly className="form-control" id="static_visit" value={this.state.visit}></input>
                    </div>
                  )}
                </div>
              )}


            <div className="form-group">
              <label htmlFor="protocol_url">   Preparation Protocol <span className="text-danger">*</span> 
              <span className="text-danger inline-icon"> <FontAwesomeIcon icon={faUserShield} /></span>
                <span>
                  <FontAwesomeIcon icon={faQuestionCircle} data-tip data-for="protocol_tooltip"/>
                  <ReactTooltip
                    id="protocol_tooltip"
                    className={"tooltip"}
                    place="top"
                    type="info"
                    effect="solid">
                    <p>The protocol used when procuring or 
                      preparing the tissue.
                      This must be provided as a 
                      protocols.io DOI URL
                      see https://www.protocols.io/</p>
                  </ReactTooltip>
                </span>
              </label>
              {!this.state.readOnly && (
                <div>
                  <input
                    ref={this.protocol_url}
                    type="text"
                    name="protocol_url"
                    id="protocol_url"
                    className={
                      "form-control " +
                      this.errorClass(this.state.formErrors.protocol_url) +" "+
                      this.errorClass(this.state.formErrors.protocol_url_DOI)
                    }
                    onChange={this.handleInputChange}
                    value={this.state.protocol_url}
                    placeholder="protocols.io DOI"
                  />
                </div>
              )}
              {this.state.readOnly && (
                <div><input type="text" readOnly className="form-control" id="static_protocol" value={this.state.protocol_url}></input></div>
              )}
            </div>

            

            {
            !this.state.readOnly &&
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
                      {this.state.source_entity &&
                          (this.isSpecialOrganType(this.state.organ)) && (
                          <div className="col-sm-4">
                            <small className='portal-label'>
                              Lab IDs, Sample Locations and files/images can be assigned on the next screen after
                              generating the HuBMAP IDs
                          </small>
                          </div>
                        )}
                      {this.state.source_entity &&
                        (this.isSpecialOrganType(this.state.organ) !== true) && (
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
              (!this.state.readOnly ||
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
                      className={"tooltip"}
                      place="top"
                      type="info"
                      effect="solid"
                    >
                      <p>
                        An identifier used by the lab to identify ,
                        this can be an identifier from the system <br />
                        used to track the specimen in the lab. This field will
                        be entered by the user.
                      </p>
                    </ReactTooltip>
                  </label>
                  {!this.state.readOnly && (
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
                  {this.state.readOnly && (
                      <div>
                    <input type="text" readOnly className="form-control" id="static_lab_tissue_id" value={this.state.lab_tissue_id}></input>
                </div>
                   
                  )}
                
                </div>
              )
            }
            {(!this.state.readOnly || this.state.description !== undefined) && (
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
                    className={"tooltip"}
                    place="top"
                    type="info"
                    effect="solid"
                  >
                    <p>A free text description of the specimen.</p>
                  </ReactTooltip>
                  </label>
                {!this.state.readOnly && (
                  <div>
                    <textarea
                      name="description"
                      id="description"
                      className="form-control"
                      value={this.state.description}
                      onChange={this.handleInputChange}
                    />
                  </div>
                )}
                {this.state.readOnly && (
                    <div>
                       <input type="text" readOnly className="form-control" id="static_description" value={this.state.description}></input>
                    </div>
                )}
                
              </div>
            )}


            {!this.state.editingEntity &&
              !this.state.multiple_id &&
              this.state.source_entity !== undefined &&
              this.state.rui_show_btn &&
              // this.isSpecialOrganType(this.state.ancestor_organ) && 
              // this.state.RUI_ACTIVE && 
              (
                <div className="form-group">
                  <label
                    htmlFor="location"
                    sx={{
                      display: "inline-block",
                    }}>
                    Sample Location {" "}<span>
                      <FontAwesomeIcon
                        icon={faQuestionCircle}
                        data-tip
                        data-for="rui_tooltip"
                      />
                      <ReactTooltip
                        id="rui_tooltip"
                        className={"tooltip"}
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
                  <div className="">
                    <Button
                      onClick={this.handleAddRUILocation}
                      variant="contained"
                      className="btn btn-primary mr-1"
                      color="primary"
                      // className="btn btn-primary "
                      // sx={{
                      //   display: "inline-block"
                      // }}
                    >
                      Register Location
                  </Button>
                  </div>
                  { this.state.rui_click && this.state.RUI_ACTIVE && (
                  <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                    <RUIIntegration handleJsonRUI={this.handleRUIJson}
                      organList={this.state.organ_types}
                      // organList={this.fetchOrganTypes}
                      organ={this.props.editingEntity.organ}
                      sex={this.state.source_entity.sex}
                      user={this.state.source_entity.created_by_user_displayname}
                      location={this.state.rui_location}
                      parent="TissueForm" />
                  </Dialog>
                  )}

                  { this.state.rui_check && (
                    <React.Fragment>
            
                      <div className="col-sm-2 text-left">
                      <img src={check}
                          alt="check"
                          className="check" />
                        <Button
                          variant="text"
                          className="btn btn-link"
                          type="button"
                          onClick={this.openRUIModalHandler}
                        >
                          View Location
                        </Button>
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
              this.props.editingEntity.sample_category !=="organ"  &&
              this.isSpecialOrganType(this.state.organ) && 
              this.state.RUI_ACTIVE &&  
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
                        className={"tooltip"}
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
                 
                  {!this.state.readOnly &&
                    this.state.rui_check && this.state.RUI_ACTIVE &&(
                      <React.Fragment>
                       
                        <div className="col-sm-3 text-left">
                          <Button
                            onClick={this.handleAddRUILocation}
                            variant="contained"
                            color="primary"
                            className="btn btn-primary "
                          >
                            Modify Location Information
                          </Button>
                        </div>
                        { this.state.rui_click && (
                           <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organList={this.state.organ_types}
                            organ={this.props.editingEntity.organ}
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
                      <Button
                        variant="contained"
                        color="primary"
                        className="btn btn-primary mt-2"
                        onClick={this.openRUIModalHandler}
                      >
                        View Location
                    </Button>
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

                  { !this.state.readOnly &&
                    !this.state.multiple_id &&
                    !this.state.rui_check && this.state.RUI_ACTIVE && (
                      <React.Fragment>
                        <div className="">
                          <Button
                            type="button"
                            onClick={this.handleAddRUILocation}
                            variant="contained"
                            className="btn btn-primary mr-1"
                            color="primary"
                          >
                            Register Location
                        </Button>
                
                        </div>
                    
                        { this.state.rui_click && (
                          <Dialog fullScreen aria-labelledby="rui-dialog" open={this.state.rui_click}>
                          <RUIIntegration handleJsonRUI={this.handleRUIJson}
                            organList={this.state.organ_types}
                            organ={this.props.editingEntity.organ}
                            sex={this.state.source_entity.sex}
                            user={this.state.source_entity.created_by_user_displayname}
                            location={this.state.rui_location}
                            parent="TissueForm" />
                          </Dialog>
                        )}
                      </React.Fragment>
                    )}

                  { this.state.readOnly && (
                    <div className="col-sm-4">
                    </div>
                  )}
                  <div className="col-sm-1 my-auto text-center">
                    
                  </div>
                </div>
              )}
            {this.state.readOnly || this.state.abstract !== undefined && (
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
          )}


          <div className="buttonWrapLeft">
            
          {((!this.state.readOnly || this.state.metadatas.length > 0) && 
              !this.state.multiple_id) && (
              <div className="form-group">
                <div>
                  {this.state.metadatas.map(metadata => (
                    <MetadataUpload
                      key={metadata.id}
                      id={metadata.id}
                      file_name={metadata.file_name}
                      ref={metadata.ref}
                      error={metadata.error}
                      readOnly={this.state.readOnly}
                      formId={this.state.form_id}
                      onFileChange={this.onFileChange}
                      validate={this.validateMetadataFiles}
                      onDelete={this.handleDeleteMetadata}
                    />
                  ))}
                </div>
              </div>
            )}
            {((!this.state.readOnly || this.state.images.length > 0) &&
              !this.state.multiple_id) && (
              <div className="form-group">
                <div>
                  {!this.state.readOnly && (
                    <div>
                      <div className="">
                        <Button
                          className="mr-2"
                          type="button"
                          onClick={this.handleAddImage}
                          variant="outlined"
                          data-tip
                          data-for="add_image_tooltip"
                        >
                          <FontAwesomeIcon
                            className="inline-icon"
                            icon={faPaperclip}
                            title="Uploaded images (multiple allowed)."
                          />
                            Add an Image file
                          </Button> 
                          <small id="emailHelp" className="form-text text-muted m-3"> 
                          <span className="text-danger inline-icon">
                            <FontAwesomeIcon icon={faUserShield} />
                          </span> Upload de-identified images only</small>
                           <ReactTooltip
                              id="add_image_tooltip"
                              className={"tooltip"}
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
                      readOnly={this.state.readOnly}
                      formId={this.state.form_id}
                      onFileChange={this.onFileChange}
                      validate={this.validateImagesFiles}
                      onDelete={this.handleDeleteImage}
                      imageType="image"
                      show_description={true}
                    />
                  ))}
                </div>
              
              </div>
            )}
            {((!this.state.readOnly) && !this.state.multiple_id) && (

              <div className="form-group">

                <div>
                  {!this.state.readOnly && (
                    <div>
                      <div>
                        <Button 
                          type="button"
                          onClick={this.handleAddThumbnail}
                          variant="outlined"                          
                          data-tip
                          data-for="add_thumbimage_tooltip"
                        >
                          <FontAwesomeIcon
                            className="inline-icon"
                            icon={faPaperclip}
                            title="Uploaded images (multiple allowed)."
                          />
                            Add a Thumbnail file
                          </Button> 
                          <small id="emailHelp" className="form-text text-muted m-3"> 
                          <span className="text-danger inline-icon">
                            <FontAwesomeIcon icon={faUserShield} />
                          </span> Upload de-identified images only</small>
                           <ReactTooltip
                              id="add_thumbimage_tooltip"
                              className={"tooltip"}
                              place="top"
                              type="info"
                              effect="solid"
                          >
                            <p>
                                Click here to attach a single thumbnail image.
                            </p>
                            </ReactTooltip>
                      </div>
                    </div>
                    )}
                    {this.state.thumbnail.map(image => (
                      <ImageUpload
                        key={image.id}
                        id={image.id}
                        file_name={image.file_name}
                        description={image.description}
                        ref={image.ref}
                        error={image.error}
                        readOnly={this.state.readOnly}
                        formId={this.state.form_id}
                        onFileChange={this.onFileChange}
                        validate={this.validateThumbnailFile}
                        onDelete={this.handleDeleteThumbnail}
                        imageType="thumbnail"
                        show_description={false}
                      />
                    ))}
                    </div>
                    </div>

              )}
            </div>
            {this.state.submit_error && (
              <div className="alert alert-danger col-sm-12" role="alert">
                <p>
                {this.state.error_message_detail}
                </p>
                {this.state.error_message}
              </div>
            )}
            {this.renderButtons()}
            {this.state.editingEntity && 
            this.state.editingEntity.data_access_level === 'public' &&
            this.state.read_only_state && (

            <React.Fragment>
              <div className="alert alert-warning text-center" role="alert">This entity is no longer editable. It was locked when it became publicly 
              accessible when data associated with it was published.</div>
            </React.Fragment>
          )}
          </form>
          
        </div>
        <GroupModal
          show={this.state.GroupSelectShow}
          hide={this.hideGroupSelectModal}
          groups={this.state.groups}
          submit={this.handleSubmit}
          handleInputChange={this.handleInputChange}
        />


        <Snackbar open={this.state.show_snack} 
          // sx={{marginTop:"20px"}}
          onClose={this.closeSnack}
          anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
          }}
          autoHideDuration={6000} 
          message={this.state.snackmessage}
          action={
                <React.Fragment>
                  <IconButton size="small" aria-label="close" color="inherit" onClick={this.closeSnack}>
                      <FontAwesomeIcon icon={faTimes} size="2x" />
                  </IconButton>
                </React.Fragment>
        }/> 

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
                      <Button 
                      variant="contained"
                      color="inherit" 
                      size="small" 
                      onClick={this.snackCancel}>
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
