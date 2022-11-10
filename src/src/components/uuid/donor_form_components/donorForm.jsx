import React, { Component } from "react";
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Divider from '@material-ui/core/Divider';
import Box from '@mui/material/Box';

import '../../../App.css';
// import axios from "axios";
import ImageUpload from "./imageUpload";
//import MetadataUpload from "../metadataUpload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
 // faPlus,
  faUserShield,
  faSpinner,
  faPaperclip,
  //faLink,
  faImages
  // faTimes
} from "@fortawesome/free-solid-svg-icons";
import { tsToDate } from "../../../utils/string_helper";
//import { getFileNameOnPath, getFileMIMEType } from "../../../utils/file_helper";
import {
  validateRequired,
  validateProtocolIODOI,
  validateSingleProtocolIODOI
//  validateFileType
} from "../../../utils/validators";
import ReactTooltip from "react-tooltip";
import HIPPA from "../HIPPA";
import GroupModal from "../groupModal";
import { ingest_api_users_groups } from '../../../service/ingest_api';
import { entity_api_update_entity, entity_api_create_entity } from '../../../service/entity_api';
import { ingest_api_allowable_edit_states } from '../../../service/ingest_api';

class DonorForm extends Component {
  state = {
    // ? Why are we generating an ID here? Nothing exists in the DB yet assumedly, should be generated on db save?
    // random is exploitable, and this info doesnt actually exists till saved
    form_id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
   // visit: "",
    lab: "",
    lab_donor_id: "",
    identifying_name: "",
    protocol_url: "",
    protocol_file: "",
    description: "",
    metadata_file: "",
    show: false,
    readOnly: false,
    GroupSelectShow: false,
    images: [],
    //metadatas: [],
    // new_metadatas: [],
    // deleted_metadatas: [],
    new_images: [],
    deleted_images: [],
 //   protocol_file_name: "Choose a file",
//    metadata_file_name: "Choose a file",

    groups: [],
    groups_dataprovider: [],
    selected_group: null,

    formErrors: {
   //   visit: "",
      lab: "",
      lab_donor_id: "",
      identifying_name: "",
      protocol_url: "",
     // protocol_file: "",
      description: "",
     // metadata_file: "",
     // open_consent: false,
     // metadatas: "",
      images: "",
    },
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element
    //this.protocolFile = React.createRef();
    this.protocol_url = React.createRef();
  }

  UNSAFE_componentWillMount() {

   ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
      console.debug("ingest_api_users_groups", results);
      if (results.status === 200) { 
        console.debug("results", results);
      // const groups = results.results.filter(
      //     g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
      //   );
        // this.setState({
        //   groups: results.results
        // });
        var resultGroups = [];
        console.debug("HAVE results",results);
        
        if (results.results && results.results.length > 0) {
          resultGroups = results.results;
          console.debug("HAVE Doube results.results ",results.results);
        }else if (results.data && results.data.length > 0) {
          resultGroups = results.data.groups;
          console.debug("HAVE data with Groups ",results.data.groups);
        }else{
          resultGroups = results.groups;
          console.debug("NO data just Groups ",results.groups);
        }
        console.debug("resultGroups", resultGroups);
        const groups = resultGroups.filter(
          // It filters our read only, but what about other permissions like admin? 
          // g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
          g => g.data_provider === true
        );
        console.debug("groups",groups);
          //  We have both Data-Provider groups as well as non. 
          // The DP needs to be deliniated for the dropdown & assignments
          // the rest are for permissions
        this.setState({
          groups: groups,
          groups_dataprovider: groups,
        }, () => {
          console.debug("SET STATE TO GROUPS ", this.state.groups_dataprovider);
        });
      } else if (results.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
    });


    if (this.props.editingEntity) {
      //const pf = this.props.editingEntity.protocol_file;
 //     const mf = this.props.editingEntity.portal_metadata_upload_files;
      let images = this.props.editingEntity.image_files;

      this.setState({
        author: this.props.editingEntity.created_by_user_email,
        //visit: this.props.editingEntity.properties.visit,
        lab_donor_id: this.props.editingEntity.lab_donor_id,
        identifying_name: this.props.editingEntity.label,
        protocol_url: this.props.editingEntity.protocol_url,
      //  protocol_file_name: pf && getFileNameOnPath(pf),
        description: this.props.editingEntity.description,
       // metadata_file_name: mf && getFileNameOnPath(mf)

      });

      const image_list = [];
      //const metadata_list = [];
      try {
        images.forEach((image, index) => {
          image_list.push({
            id: index + 1,
            ref: React.createRef(),
            file_name: image.filename,     //getFileNameOnPath(image.filepath),
            description: image.description,
            file_uuid: image.file_uuid
          });
        });
      } catch {}
      // metadatas.forEach((metadata, index) => {
      //   metadata_list.push({
      //     id: index + 1,
      //     ref: React.createRef(),
      //     file_name: getFileNameOnPath(metadata.filepath)
      //   });
      // });
      // this.setState({ images: image_list, metadatas: metadata_list });
      this.setState({ images: image_list});
    }

    try {
          const param_uuid = this.props.editingEntity.uuid;
          // check to see if user can edit
          ingest_api_allowable_edit_states(param_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
              .then((resp) => {
                  if (resp.status === 200) {
                    console.debug('api_allowable_edit_states...', resp.results);
                    ////////console.debug(resp.results);
                    const read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
                    console.debug('HAS has_write_priv', read_only_state)
                    this.setState({
                      readOnly: read_only_state,   // used for hidding UI components
                    }
                    // , () => {
                    //   this.checkForRelatedGroupIds(entity_data);
                    //   this.initialize();
                   
                    //   //console.debug('readOnly', this.state.readOnly);
                    // }

                    );
                   
                  }         
          });
        } catch {
        }


  }

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
      case "protocol_url":
        this.setState({ protocol_url: value });
        if (!validateProtocolIODOI(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter a valid protocols.io DOI"
            }
          }));
        } else if (!validateSingleProtocolIODOI(value)) {
          this.setState(prevState => ({
            formErrors: {
              ...prevState.formErrors,
              protocol_url: "Please enter only one valid protocols.io DOI"
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
      case "description":
        this.setState({ description: value });
        break;
      // case "metadata_file":
      //   this.setState({ metadata_file: e.target.files[0] });
      //   this.setState({
      //     metadata_file_name: e.target.files[0] && e.target.files[0].name
      //   });
      //   break;
      // case "visit":
      //   this.setState({ visit: value });
      //   break;
      case "groups":
        this.setState({
          selected_group: value
        });
        break;
	 //  case "open_consent":
		// this.setState({
		//   open_consent: e.target.checked
		// });
		// break;
      default:
        break;
    }
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

    //console.debug('deleted image', deleted_image)
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

  onFileChange = (type, id) => {
    switch (type) {
      case "image": {
        const i = this.state.images.findIndex(i => i.id === id);
        //console.debug('image', id)
        let images = [...this.state.images];
        //console.debug('images', images)
        images[i].file_name = images[i].ref.current.image_file.current.files[0].name;
        //console.debug('images file data', images[i].ref.current.image_file.current.files)
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
       // break;
      }
      default:
        break;
    }
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
    
          lab_donor_id: this.state.lab_donor_id,
          label: this.state.identifying_name,
          protocol_url: this.state.protocol_url,
          description: this.state.description,
        };
    
        // the following handles all the image add/remove/updates
        if (this.state.images.length > 0) {
          let image_files_to_add = [];
          let existing_image_files_to_update = [];
        ////console.debug('submit images', this.state.images)
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

        // "image_files_to_add": [{"temp_file_id":"5hcg4ksj6cxkw2cgpmp5", "description":"this is a test file"}]}
        //formData.append("data", JSON.stringify(data));

        //console.debug("SUBMMITED data")
        //console.debug(data)
      

        if (this.props.editingEntity) {
          //console.debug("Updating Entity....")
          entity_api_update_entity(this.props.editingEntity.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status === 200) {
                    //console.debug('Update Entity...');
                    //console.debug(response.results);
                    this.props.onUpdated(response.results);
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
      
              });
        } else {

          console.log("Creating Entity....", data);;
            // if (this.state.selected_group && this.state.selected_group.length > 0) {
            //   data["group_uuid"] = this.state.selected_group;
            // } else {
            //   data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
            // }
          if (this.state.selected_group && this.state.selected_group.length > 0) {
              console.debug("Selected_group", this.state.selected_group);
              data["group_uuid"] = this.state.selected_group; 
          } else {
            // If none selected, we need to pick a default BUT
            // It must be from the data provviders, not permissions
            console.debug("UN Selected_group", this.state.selected_group);              
            data["group_uuid"] = this.state.groups_dataprovider[0].uuid; // consider the first users group        
          }
          console.debug("data[\"group_uuid\"]",data["group_uuid"]);

            //console.debug("Create a new Entity....group uuid", data["group_uuid"])
            entity_api_create_entity("donor", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                 .then((response) => {
                  if (response.status === 200) {
                    //console.debug('create Entity...');
                    //console.debug(response.results);
                    this.props.onCreated({new_samples: [], entity: response.results});
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
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
      if (this.state.readOnly) {
        return (
         
            <div className="col-sm-12 text-right pads">
              <Button
                type="button"
               variant="outlined"
                onClick={() => this.props.handleCancel()}
              >
                Cancel
              </Button>
            </div>
        );
      } else {
        return (
         
            <div className="col-md-12 text-right pads">
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
                {!this.state.submitting && "Update"}
              </Button>
            
              <Button
                type="button"
               variant="outlined"
                onClick={() => this.props.handleCancel()}
              >
                 Cancel
              </Button>
          </div>
        );
      }
    } else {
      return (
          <div className="col-md-12 text-right pads">
            <Button
              type="submit"
              className="btn btn-primary mr-1"
              variant="contained"
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
              onClick={() => this.props.handleCancel()}
            >
              Cancel
            </Button>
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


    // if (!validateProtocolIODOI(this.state.protocol_url)) {
      //       this.setState(prevState => ({
        //         formErrors: {
    //           ...prevState.formErrors,
    //           protocol_url: "Please enter a valid protocols.io DOI"
    //         }
    //       }));
    //       isValid = false;
    //     } else {
    //       this.setState(prevState => ({
    //         formErrors: { ...prevState.formErrors, protocol_url: "" }
    //       }));
    //     }
    
    // if (!validateRequired(this.state.protocol_url)) {
      //     this.setState(prevState => ({
    //       formErrors: { ...prevState.formErrors, protocol_url: "required" }
    //     }));
    //     isValid = false;
    //   } else {
    //     this.setState(prevState => ({
    //       formErrors: { ...prevState.formErrors, protocol_url: "" }
    //     }));
    //   }
    
    
    
    console.debug("protocol_url",this.state.protocol_url,validateProtocolIODOI(this.state.protocol_url));
    if (!validateRequired(this.state.protocol_url)) {
      console.debug(" ======= validateRequired");
      isValid = false;
      this.setState(prevState => ({
        formErrors: {
          ...prevState.formErrors,
          protocol_url: "required"
        }
      }));
    } else if (!validateProtocolIODOI(this.state.protocol_url)) {
      console.debug(" ======= validateProtocolIODOI");
      isValid = false;
      this.setState(prevState => ({
        formErrors: {
          ...prevState.formErrors,
          protocol_url: "Please enter a valid protocols.io URL"
        }
      }));
    } else if (!validateSingleProtocolIODOI(this.state.protocol_url)) {
      console.debug(" ======= validateSingleProtocolIODOI");
      isValid = false;
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
          protocol_url: ""
        }
      }));
    }





    // if (!this.props.editingEntity) {

    this.state.images.forEach((image, index) => {
      if (!image.file_name && !validateRequired(image.ref.current.image_file.current.value)) {
        //console.debug('image invalid', image.file_name)
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


    // const usedFileName = new Set();
    // this.state.images.forEach((image, index) => {
    //   usedFileName.add(image.file_name);
    //   //console.debug('image check for dups', image)
    //   if (image.ref.current.image_file.current.files[0]) {
    //     if (usedFileName.has(image.ref.current.image_file.current.files[0].name)) {
    //       image["error"] = "Duplicated file name is not allowed.";
    //       isValid = false;
    //     }
    //   }
    // });

    // if (!this.props.editingEntity) {
    //   // Creating Donor
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


  renderButtonBar(){
    return (
      <div> 
        <div className="col-sm-12 align-right">
        <Divider />
        </div>

        <Box
          sx={{
            width: "100%",
            justifyContent: 'flex-end',
          display: 'flex',
          '& > *': {
              m: 1,
            },
          button:{
            m:1,
            align:'right',
            float:'right',
          },
          
          }}
        >
          <ButtonGroup 
            component={Box} 
            display="block !important"
            orientation="horizontal">

            {this.renderButtons()}
           
          </ButtonGroup>
        </Box>
      </div>
    );
} 


  render() {
    return (
      <React.Fragment>
       {this.props.editingEntity && 
            this.props.editingEntity.data_access_level === 'public' && (

            <React.Fragment>
              <div className="alert alert-warning text-center" role="alert">This entity is no longer editable. It was locked when it became publicly 
              accessible when data associated with it was published.</div>
            </React.Fragment>
          )}
        {!this.props.editingEntity && (
          <div className="row">
            <div className="col-sm-12 text-center">
              <h4>Registering a Donor</h4>
            </div>
          </div>
        )}
        {this.props.editingEntity && (
          <div className="row">
            <div className="col-sm-12 text-center">
              <h4>Donor Information</h4>
            </div>
          </div>
        )}
        
         <div className="alert alert-danger col-sm-10 offset-sm-1"  role="alert"  >
            <FontAwesomeIcon icon={faUserShield} /> - Do not provide any
            Protected Health Information. This includes the{" "}
            <span
              style={{ cursor: "pointer" }}
              className="text-primary"
              onClick={this.showModal}>
              18 identifiers specified by HIPAA
            </span>
          </div>
            
          {this.props.editingEntity && (


          <React.Fragment>
          <div className="row">
            <div className="col-sm-5 offset-sm-1 portal-label">
                HuBMAP ID: {this.props.editingEntity.hubmap_id}
            </div>
            <div className="col-sm-5 text-right portal-label">
            Submission ID: {this.props.editingEntity.submission_id}
            </div>
              <div className="col-sm-5 offset-sm-1 portal-label">
                Entered by: {this.state.author}
            </div>
            <div className="col-sm-5 text-right portal-label">
                Entry Date: {tsToDate(this.props.editingEntity.created_timestamp)}
            </div>
            </div>
          </React.Fragment>

            
          )}
         
         
            <form onSubmit={this.handleSubmit} className="expanded-form">
             
              <div className="text-danger">
                <p>
                * required
                </p>
              </div>
              <div className="form-group">
                <label
                  htmlFor="lab_donor_id">
                  Lab's Donor Non-PHI ID 
                </label>
                 <span className="px-2">
                    <FontAwesomeIcon className="text-danger" icon={faUserShield} />
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
                      <p>
                        An identifier used by the lab to identify the donor.{" "}
                        <br /> This field will be entered by the user.
                      </p>
                    </ReactTooltip>
                  </span>     
                {!this.state.readOnly && (
                  <div>
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
                {this.state.readOnly && (
                  <div>
                   <input type="text" readOnly className="form-control" id="static_lab_donor_id" value={this.state.lab_donor_id}></input>
                   
                  </div>
                )}
               
              </div>
              <div className="form-group">
                <label
                  htmlFor="identifying_name">
                  Deidentified Name <span className="text-danger">*</span>
                </label>
  
                   <span className="text-danger px-2">
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
                      <p>
                        A name used by the lab to identify the donor (e.g.
                        HuBMAP donor 1).
                      </p>
                    </ReactTooltip>
                  </span>
               
                {!this.state.readOnly && (
                  <div>
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
                {this.state.readOnly && (
                  <div>
                    <input type="text" readOnly className="form-control" id="static_identifying_name" value={this.state.identifying_name}></input>
                  </div>
                )}
               
              </div>
              <div className="form-group">
                <label
                  htmlFor="protocol_url">
                  Case Selection Protocol <span className="text-danger">*</span>
                  </label>
                  <span className="text-danger px-2">
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
                        The protocol used when choosing and acquiring the donor.
                        <br />
                        This can be supplied a DOI from http://protocols.io
                      </p>
                    </ReactTooltip>
                  </span>
                
                {!this.state.readOnly && (
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
                    {this.state.formErrors.protocol_url &&
                      this.state.formErrors.protocol_url !== "required" && (
                        <div className="invalid-feedback">
                          {this.state.formErrors.protocol_url}
                        </div>
                      )}
                  </div>
                )}
                {this.state.readOnly && (
                  <div>
                    <input type="text" readOnly className="form-control" id="static_protocol" value={this.state.protocol_url}></input>

                  </div>
                )}
               
              </div>
              {(!this.state.readOnly ||
                this.state.description !== undefined) && (
                <div className="form-group">
                  <label
                    htmlFor="description">
                    Description
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
                        <p>
                          Free text field to enter a description of the donor
                        </p>
                      </ReactTooltip>
                    </span>
                  </label>
                  {!this.state.readOnly && (
                    <div>
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
                  {this.state.readOnly && (
                    <div>
                      {/*<p>{truncateString(this.state.description, 400)}</p>*/}
                       <input type="text" readOnly className="form-control" id="static_description" value={this.state.description}></input>

                    </div>
                  )}
                 
                </div>
              )}
              <div className="form-group">
                <label
                    htmlFor="donor_metadata_status"
                    className="col-form-label text-right"
                  >
                    Donor Metadata Status
                  </label>
                  <div className="col-sm-8 my-auto">
                    {this.state.donor_metadata_status || (
                      <span className="badge badge-neutral">No value set</span>
                    )}
                    {this.state.donor_metadata_status === 0 && (
                      <span className="badge badge-secondary">No metadata</span>
                    )}
                    {this.state.donor_metadata_status === 1 && (
                      <span className="badge badge-primary">Metadata provided</span>
                    )}
                    {this.state.donor_metadata_status === 2 && (
                      <span className="badge badge-primary">Metadata curated</span>
                    )}
                  </div>
              </div>
             
              {(!this.state.readOnly || this.state.images.length > 0) && (
                <div className="form-group">
                  {/*<label
                    htmlFor="image">
                    Image
                  </label>
                */}
                {(this.state.images.length > 0 ) && (this.props.editingEntity) && (
                      <div className="m-1">
                        <FontAwesomeIcon icon={faImages} /> Attached Image(s)
                        </div>
                      )}
                  <div>
                    
                    {!this.state.readOnly && (
                      <div>
                       
                          <Button
                            type="button"
                            onClick={this.handleAddImage}
                            variant="outlined"                            
                            data-tip
                            data-for="add_image_tooltip"
                            sx={{ mr: 1 }}
                          >
                            <FontAwesomeIcon
                              className="inline-icon"
                              icon={faPaperclip}
                              title="Uploaded images (multiple allowed)."
                            /> 
                            Add an Image File
                          </Button>
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
              {this.state.submit_error && (
                <div className="alert alert-danger col-sm-12" role="alert">
                  Oops! Something went wrong. Please contact administrator for
                  help.
                </div>
              )}

            <div className="row">
              {this.renderButtonBar()}
            </div>

               {this.props.editingEntity && 
                this.props.editingEntity.data_access_level === 'public' && (

                <React.Fragment>
                  <div className="alert alert-warning text-center" role="alert">This entity is no longer editable. It was locked when it became publicly 
                    accessible when data associated with it was published.</div>
                </React.Fragment>
              )}
            </form>

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
