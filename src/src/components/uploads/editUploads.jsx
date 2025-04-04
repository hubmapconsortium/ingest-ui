import {
  faExternalLinkAlt,
  faQuestionCircle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {Typography} from "@material-ui/core";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import {Alert,AlertTitle} from '@material-ui/lab';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import React,{Component} from "react";
import {Link} from 'react-router-dom';
import ReactTooltip from "react-tooltip";
import { ubkg_api_get_upload_dataset_types } from '../../service/ubkg_api';
import {
  entity_api_get_globus_url,
  entity_api_update_entity
} from '../../service/entity_api';
import {
  ingest_api_all_user_groups,
  ingest_api_get_globus_url,
  ingest_api_notify_slack,
  ingest_api_reorganize_upload,
  ingest_api_submit_upload,
  ingest_api_validate_upload
} from '../../service/ingest_api';
import {getPublishStatusColor} from "../../utils/badgeClasses";
import {RevertFeature} from "../../utils/revertModal";
import {tsToDate} from "../../utils/string_helper";
import {validateRequired} from "../../utils/validators";
import {COLUMN_DEF_DATASET} from '../search/table_constants';
import Modal from "../uuid/modal";

// import { DATA_ADMIN, DATA_CURATOR } from '../../service/user_service'
class EditUploads extends Component{


  
  state = {
    editingEntity: "entity_data",
    title:"title",
    description:"desc",
    intended_organ:"intended_organ", 
    intended_dataset_type:"intended_dataset_type", 
    author:"created_by_user_displayname",
    created:"created_timestamp",
    group:"group",
    groups:[],
    hid:"hubmap_id",
    uuid:"uuid",
    datasets:{},
    status:"status",
    creatingNewUploadFolder: true,
    confirmModal: false,
    writeable: false,
    pageSize:10,
    data_admin: false,
    data_curator: false,
    data_group_editor: false,
    validation_message:"",
    badge_class:"",
    submitting:false,
    // Button State Classes
    button_submit:false,
    button_validate:false,
    button_save:false,
    button_reorganize:false,
    organList:["organ"],
    datasetTypes:["types"],
    formErrors: {
      title: "",
      description: "",
      intended_organ:"",
      intended_dataset_type:""
    },
  }

  

  componentDidMount() {
    const groupsAuth = JSON.parse(localStorage.getItem("info")).groups_token;
    
    let entity_data = this.props.editingUpload;
    entity_api_get_globus_url(this.props.editingUpload.uuid, groupsAuth)
      .then((res) => {
        
        this.setState({
          globus_path: res.results,
        }); 
      })
      .catch((err) => {
        this.setState({
          globus_path: " ",
          globus_path_tips: "Globus URL Unavailable",
        });
        if (err.response && err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
      
      ubkg_api_get_upload_dataset_types()
      .then((results) => {
        console.debug('%c◉ UPLOAD DTYPES  ', 'color:#00ff7b', results);
        const filteredArray = results.filter(item => item.term !== "UNKNOWN");
        const sortedArray = filteredArray.sort((a, b) => a.term.localeCompare(b.term));
        this.setState({ 
          datasetTypes: sortedArray,
        });
      })
      .catch((error) => {
        console.debug('%c◉ UPLOAD DTYPES ERROR  ', 'color:#00e5ff',  error);
        this.setState({ 
          assetError: true,
          errorMessage:"Error: Missing Assets: There is an issue loading required assets. \n Please try again in a moment, or contact the help desk for further assistance."
        })
      });


    this.setState({
      // groups: this.props.groups,
      updateSuccess: null,
      show:true,
      editingEntity:entity_data,
      title:entity_data.title,
      hid:entity_data.hubmap_id,
      uuid:entity_data.uuid,
      description:entity_data.description,
      intended_organ:entity_data.intended_organ ? entity_data.intended_organ : "", 
      intended_dataset_type:entity_data.intended_dataset_type ? entity_data.intended_dataset_type : "", 
      author:entity_data.created_by_user_displayname,
      created:entity_data.created_timestamp,
      group:entity_data.group_uuid,
      datasets:entity_data.datasets,
      status:entity_data.status,
      assigned_to_group_name:entity_data.assigned_to_group_name ? entity_data.assigned_to_group_name : "",
      ingest_task:entity_data.ingest_task ? entity_data.ingest_task : "", 
      editForm: true,
      show_modal: true,
      show_search: false,
      new_entity: false,  
      creatingNewUploadFolder:true,
      validation_message: entity_data.validation_message,
      writeable:false,
      globusLinkText: "To add or modify data files go to the data repository ",
      groups: [],
    },
      () => {

        // gets fine permissions
        this.allowablePermissions(this.state.group)

        //@TODO: Decouple Badge class from this switch that sets writeable state & Validation Messge Style
        // Unless these are a different Badge not RE status but another state? 
        // BADGE CLASS no longer being defined here, utilizing getPublishStatusColor instead. 
        switch (entity_data.status.toUpperCase()) {
          case "NEW":
            
            this.setState({
              validation_message_style:null,
              writeable: true
            });
          break;
          case "ERROR":
            
            this.setState({
              validation_message_style:"error",
              writeable: true
            });
          break;
          case "INVALID":
          case "INCOMPLETE":
            this.setState({
              validation_message_style:"warning",
              writeable: true
            });
          break;
          case "VALID":
            
            this.setState({
              validation_message_style:null,
              writeable: false
            });
          break;
          case "PROCESSING":
            
            this.setState({
              validation_message_style:null,
              writeable: false
            });
            break;
          case "REORGANIZED":
            
            this.setState({
              validation_message_style:null,
              globusLinkText: "Open data repository ",
              writeable: false
            });
            break;
          case "SUBMITTED":
            
            this.setState({
              validation_message_style:null,
              globusLinkText: "Open data repository ",
              writeable: true
            });
            break;
          case "DEPRECATED":
            break;
          default:
            break;
        }
        
      });

      if (localStorage.getItem("organs") && localStorage.getItem("datasetTypes")) {
        const organs = Object.entries(JSON.parse(localStorage.getItem("organs")));
        const sortedOrgans = organs.sort((a, b) => a[1].localeCompare(b[1]));
        console.debug('%c◉ sortedOrgans ', 'color:#00ff7b', sortedOrgans );
        this.setState({ 
          organList: sortedOrgans,
        }, () => {
          console.debug('%c◉ ORGANSANDDATA ', 'color:#5C3FFF',
            this.state.organList,
          );
        });
      }else{
        // if app.js has none, it'll fetch em
        // Maybe till we handle this in bespoke service we'll simply trigger
        // an alert & refresg button? 
        console.debug('%c◉ Missing Organ Assets ', 'color:#00ff7b', localStorage.getItem("organs"));
        this.setState({ 
          assetError: true,
          errorMessage:"Error: Missing Assets: Please refresh the page to reload the missing assets."
        })
      }

      console.debug('%c◉ this.state.status.toUpperCase() ', 'color:#00ff7b', entity_data.status);
      this.setState({badge_class:getPublishStatusColor(entity_data.status)});
      this.setState({
          datarows: this.state.datasets, // Object.values(response.results)
          results_total:  this.state.datasets.length,
          column_def: COLUMN_DEF_DATASET})
    
  };
  
  allowablePermissions = (data_group_uuid) => {
    // I think we've moved on from this specific perission structure
    // (Currators are now Providers, and Group Editors are not in use)
    // This will likely need to be updated based on current Submit/Save permission goals
    const DATA_ADMIN = process.env.REACT_APP_DATA_ADMIN;
    const DATA_CURATOR = process.env.REACT_APP_DATA_CURATOR; 
    var local = JSON.parse(localStorage.getItem("info"));
    
    // get the users groups
    ingest_api_all_user_groups(local.groups_token).then((results) => {
      if (results.status === 200) {
        var users_groups = results.results
        var admin = false
        var curator = false
        var group_editor = false

        users_groups.forEach(function(result) {
          if (DATA_ADMIN === result.uuid) {
            admin = true
          }
          if (DATA_CURATOR === result.uuid) {
            curator = true
          }
          if (data_group_uuid === result.uuid) {
            group_editor = true
          }
        });
        this.setState({
          data_admin: admin,
          data_curator: curator,
          data_group_editor: group_editor
        });
      }
    })

  }


  handleCancel = () => {
    if (this.props.history) {
      this.props.history.goBack();
    } else {
      this.props.handleCancel();
    }
  }


  showConfirmModal = () => {
    this.setState({ confirmModal: true });
    // 
  };

  hideConfirmModal = () => {
    this.setState({ confirmModal: false });
  };

  handleSave = (i) => {
    this.setState({ button_save: true });
    this.validateForm().then((isValid) => {
      if (isValid) {
        if (
          !this.props.editingUpload &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ){
          this.setState({ GroupSelectShow: true });
        } else {
          this.setState({
            GroupSelectShow: false,
            submitting: false,
          });
          this.setState({ submitting: true });
          // package the data up
          let data = {};
          if (this.props.editingUpload.title !== this.state.title){
            data["title"]=this.state.title;
          }
          if (this.props.editingUpload.intended_organ !== this.state.intended_organ){
            data["intended_organ"]=this.state.intended_organ;
          }
          if (this.props.editingUpload.intended_dataset_type !== this.state.intended_dataset_type){
            data["intended_dataset_type"]=this.state.intended_dataset_type;
          }
          if (this.props.editingUpload.description !== this.state.description){
            data["description"]=this.state.description;
          }

          if(this.state.data_admin){
            if (this.state.assigned_to_group_name && this.props.editingUpload.assigned_to_group_name !== this.state.assigned_to_group_name){
              data["assigned_to_group_name"]=this.state.assigned_to_group_name;
            }
            if (this.state.ingest_task && this.props.editingUpload.ingest_task !== this.state.ingest_task){
              data["ingest_task"]=this.state.ingest_task;
            }
          }

          if (this.props.editingUpload) {
            entity_api_update_entity(this.props.editingUpload.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status === 200) {
                     this.props.onUpdated(response.results);
                  } else {
                    this.setState({ submit_error: true, submitting: false, submitting_submission:false, button_save: false });
                    this.handleSpinnerClear();
                  }
                }).catch((error) => {
                  this.setState({ submit_error: true, submitting: false, submitting_submission:false, button_save: false, });
                  this.handleSpinnerClear();
                  
                });
          } 
        }
      }else{
        
        this.handleSpinnerClear();
      }
    });
  }

  handleSubmitUpload = (data) =>{
    this.setState({
      submitting_submission:true,
      submitting: true,
      button_submit: true,
    })
    ingest_api_submit_upload(this.props.editingUpload.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        
        if (response.status === 200) {
          this.props.onUpdated(response.results);
        } else {
          this.setState({ submit_error: true, submitting: false, submitting_submission:false,button_submit: false, });
          this.handleSpinnerClear();
        }
      })
      .catch((error) => {
        this.setState({ submit_error: true, submitting: false, submitting_submission:false,button_submit: false, });
        
        this.handleSpinnerClear();
      });
      
  }
  
  handleReorganize = () => {
    this.setState({
      submitting_submission:true,
      submitting: true,
      button_reorganize: true,
    })
    ingest_api_reorganize_upload(this.props.editingUpload.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        
        if (response.status === 200) {
          this.props.onUpdated(response.results);
        } else {
          this.setState({ submit_error: true, submitting: false, submitting_submission:false,button_reorganize: false, });
        }
      })
      .catch((error) => {
        this.setState({ submit_error: true, submitting: false, submitting_submission:false,button_reorganize: false, });
        
        this.handleSpinnerClear();
      });
      

  }
  

  handleValidateUpload = (i) => {
    this.setState({ button_validate: true, submitting: true });
    this.validateForm().then((isValid) => {
      
      if (isValid) {
        if (
          !this.props.editingUpload &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ){
          this.setState({ GroupSelectShow: true });
        } else {
          this.setState({
            GroupSelectShow: false,
            submitting: true,
          });
          this.setState({ submitting: true });

          // package the data up
          let data = {
            title: this.state.title,
            description: this.state.description
          };
  

          if (this.props.editingUpload) {
            
            // if user selected Publish
            ingest_api_validate_upload(this.props.editingUpload.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
              .then((response) => {
                
                  if (response.status === 200) {
                    this.props.onUpdated(response.results);
                    this.handleSpinnerClear();
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                    this.handleSpinnerClear();
                  }
            });
          } 
        }
      }else{
        this.handleSpinnerClear();
      }
    });
  };

  //@TODO: DRY this out 
  handleValidateUploadSubmission = (i) => {
    console.debug('%c⊙ handleValidateUploadSubmission', 'color:#00ff7b',  );
    this.setState({ 
      submitting_submission: true,
      button_submit: true,  
    });
    
    this.validateForm().then((isValid) => {
      if (isValid) {
        if (
          !this.props.editingUpload &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ){
          this.setState({ GroupSelectShow: true });
        } else {
          this.setState({
            GroupSelectShow: false,
            submitting_submission: true,
          });

          // package the data up
          let data = {
            title: this.state.title,
            description: this.state.description,
          };
          if(this.state.data_admin){
						if (this.state.assigned_to_group_name){
              data["assigned_to_group_name"]=this.state.assigned_to_group_name;
            }
            if (this.state.ingest_task){
              data["ingest_task"]=this.state.ingest_task;
            }
          }
          console.debug('%c⊙ DATA', 'color:#00ff7b', data );

          if (this.props.editingUpload) {
            // if user selected Publish
            ingest_api_submit_upload(this.props.editingUpload.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
              .then((response) => {
                  this.handleSpinnerClear();
                  if (response.status === 200) {
                    var ingestURL= process.env.REACT_APP_URL+"/upload/"+this.props.editingUpload.uuid
                    var slackMessage = {
                      "message": "Upload has been submitted ("+ingestURL+")"
                    }
                    ingest_api_notify_slack(JSON.parse(localStorage.getItem("info")).groups_token, slackMessage)
                      .then((slackRes) => {
                        console.debug("slackRes", slackRes);
                        if (response.status < 300) {
                          this.setState({ 
                            submit_error: false, 
                            submitting: false, 
                            });
                            this.props.onUpdated(response.results);
                        } else {
                          this.uncapError(response);
                        }
                      })
                      .catch((error) => {
                        this.setState({ 
                          submit_error: true, 
                          submitting: false, 
                          submitErrorResponse:error.result.data,
                          buttonSpinnerTarget:"", });
                      });
                    this.handleSpinnerClear();
                  } else {
                    this.setState({ submit_error: true, submitting: false, submitting_submission:false  });
                    this.handleSpinnerClear();
                  }
                })
                .catch((error) => {
              this.handleSpinnerClear();
            });
          } 
        }
      }else{
        this.handleSpinnerClear();
      }
    });
  };

  handleSpinnerClear = () =>{
    
    this.setState({
      button_submit: false,
      button_reorganize: false,
      button_save: false,
      button_validate: false,
      submitting: false,
      submitting_submission: false,
    })
  }
  

  handleInputChange = (e) => {
    const { name, value } = e.target;
    this.setState(prev => ({
      [name]: value
    }));
  }

  
  highlightInvalidDatasets(){      
      var matches = document.querySelectorAll("div[data-value='invalid']");
      matches.forEach(function(item) {
        item.parentElement.classList.add("invalidDatset");
      });
      
  } 

  renderButtonBar(){
    return (
      <div>
        <div className="col-sm-12 align-right">
          <Divider />
        </div>
        {this.renderHelperText()}
        <Box
          sx={{
            width: "50%",
            display: 'inline-block',
          }}>
          {this.state.data_admin && (
            <RevertFeature 
              uuid={this.props.editingUpload ? this.props.editingUpload.uuid : null}
              type={this.props.editingUpload ? this.props.editingUpload.entity_type : 'entity'}
            />
          )}
          {/* {this.state.data_admin &&(
            <BlameFeature
              admin={this.state.data_admin}
              group={this.props.editingUpload.assigned_to_group_name}
              task={this.props.editingUpload.ingest_task}
              uuid={this.props.editingUpload ? this.props.editingUpload.uuid : null}
              type={this.props.editingUpload ? this.props.editingUpload.entity_type : 'entity'}
            />
          )} */}
        </Box>
        <Box
          sx={{
            width: "50%",
            float: 'right',
            display: 'inline-block',
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
            <Button
              variant="contained"
              type='button'
              disabled={this.state.submitting || this.state.submitting_submission}
              onClick={() => this.props.handleCancel()}>
              Cancel
            </Button>
            {this.renderSaveButton()}
            {this.renderReorganizeButton()}
            {this.renderSubmitButton()}
            {this.renderValidateButton()}
          </ButtonGroup>
        </Box>

      </div>
    );
  } 

  renderValidateButton() {
   
    if (["SUBMITTED", "VALID", "INVALID", "ERROR", "NEW"].includes(
      this.state.status.toUpperCase() 
      // ) && (this.state.data_admin || this.state.data_curator || this.state.data_group_editor)) {
      ) && (this.state.data_admin)) {
      return (
              <Button
              variant="contained" 
                  type='button'
                  className = 'btn btn-info mr-1 badge-info'
                  onClick = {() => this.handleButtonClick(this.state.status.toLowerCase(), "validate") }
                >
                {this.state.button_validate && (
                <FontAwesomeIcon
                  className='inline-icon'
                  icon={faSpinner}
                  spin
                />
              )}
              {!this.state.button_validate && "Validate"}
                </Button>
              )
    }   
  }

  renderSubmitButton() {
  
    if (["VALID"].includes(
      this.state.status.toUpperCase()
      ) && (this.state.data_admin || this.state.data_group_editor)) {
      return (
            <Button
            variant="contained"
              type='button'
              className='btn btn-info mr-1 badge-success'
              disabled={this.state.submitting_submission}
              onClick={() => this.handleButtonClick(this.state.status.toLowerCase(),"submit") }
              data-status={this.state.status.toLowerCase()}>
              {this.state.button_submit && (
                  <FontAwesomeIcon
                    className='inline-icon'
                    icon={faSpinner}
                    spin
                  />
                )}
                {!this.state.button_submit && "Submit"}
          </Button>
      )
    }   
  }

 renderSaveButton() {
    if (["VALID","INVALID", "ERROR", "NEW", "INCOMPLETE"].includes(this.state.status.toUpperCase()) &&
      (this.state.data_admin || this.state.data_curator || this.state.data_group_editor)){
      return (
            <Button
            variant="contained"
              type='button'
              className='btn btn-primary mr-1'
              disabled={this.state.submitting}
              onClick={() => this.handleButtonClick(this.state.status.toLowerCase(),"save") }
              data-status={this.state.status.toLowerCase()}
            >
              {this.state.button_save && (
              <FontAwesomeIcon
                className='inline-icon'
                icon={faSpinner}
                spin
              />
            )}
            {!this.state.button_save && "Save"}
          </Button>
      )
    }   
  }

renderReorganizeButton() {
    if (["SUBMITTED"].includes(
      this.state.status.toUpperCase()
      ) && (this.state.data_admin)) {
      return (
           <Button
           variant="contained"
            type='button'
            className='btn btn-info mr-1'
            disabled={this.state.submitting}
            onClick={() => this.handleButtonClick(this.state.status.toLowerCase(),"reorganize") }
            data-status={this.state.status.toLowerCase()}
          >
            {this.state.submitting && (
            <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {!this.state.submitting && "Reorganize"}
        </Button>
        )
    }   
  }

  tempAlert() {
    window.alert("This function has not yet been implemented.");
  }
  showErrorMsgModal = (msg) => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };


  renderHelperText = () => {
      return(
        <div className="helper-text p-2 m-2 align-right w-100 text-right">
          {["VALID","INVALID", "ERROR", "NEW"].includes(this.state.status.toUpperCase()) && (this.state.data_admin || this.state.data_curator || this.state.data_group_editor) && (
            <p className="text-small text-end p-0 m-0">Use the <strong>Save</strong> button to save any updates to the Title or Description.</p>
          )}
          {["VALID"].includes(this.state.status.toUpperCase()) && (this.state.data_admin || this.state.data_group_editor) && (
            <p className="text-small text-end p-0 m-0">Use the <strong>Submit</strong> button when all data has been uploaded and is ready for HIVE review.</p>
          )}
        </div>
      )
    
  }
  
  componentDidUpdate(prevProps) { 
    if (this.props.targetUUID !== prevProps.targetUUID) {
    }
  }

  handleUrlChange = (targetPath) =>{
    
      window.history.replaceState(
        null,
        "", 
        "/"+targetPath);
  }

  handleButtonClick = (i,action) => {
    this.setState({
      new_status: i
    }, () => {
      
      if(action){
        if(action === "save") {
          this.handleSave(i)
        } else 
        if (action === "create" || action === "validate"){
          this.setState({
            button_validate: true,
            submitting: true,
          }, () => {
            
          });
          this.handleValidateUpload(i);
        }else if(action==="submit"){
          this.handleValidateUploadSubmission(i);
        } else if (action === "reorganize") {
          this.handleReorganize();
        }
      }
     

    })
  };

  fetchGlobusURL = (uploads_uuid) => {  
    ingest_api_get_globus_url(uploads_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((resp) => {
        
      if (resp.status === 200) {
        window.open(resp.results, "_blank");
      }
    });

  };

  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;
      

      if (!validateRequired(this.state.title)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "required" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "" },
        }));
      }
    
      if (!validateRequired(this.state.intended_dataset_type)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, intended_dataset_type: "required" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, intended_dataset_type: "" },
        }));
      }
   
      if (!validateRequired(this.state.intended_organ)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, intended_organ: "required" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, intended_organ: "" },
        }));
      }

      if (!validateRequired(this.state.description)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, description: "required" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, description: "" },
        }));
      }
    
      resolve(isValid);
    });
  }

  handlePageChange = (params) => {
    this.setState({
          page: params.page,
          pageSize: params.pageSize
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  }
  handleDatasetCellSelection = (row,column,event) =>{ 
      window.history.pushState(
        null,
        "", 
        "/dataset/"+row.uuid);
      window.location.reload()
}


  errorClass(error) {
    console.debug('%c◉ error ', 'color:#00ff7b', error);
    if (error && error === "valid" ) return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  updateInputValue = (evt) => {
    if (evt.target.name.length === 0) { // We get an empty string back from validation
      evt.target.value = null;
    } else {
      const stateUpdateMap = {
        "title": "title",
        "description": "description",
        "intended_organ": "intended_organ",
        "intended_dataset_type": "intended_dataset_type",
        "ingest_task": "ingest_task",
        "assigned_to_group_name": "assigned_to_group_name"
      };
      const stateKey = stateUpdateMap[evt.target.name];
      if (stateKey) {
        this.setState({
          [stateKey]: evt.target.value
        })
      }else{
        console.debug('%c◉ Cant Match: ', 'color:#00ff7b', evt.target.id);
      }
      this.validateForm();
    }
  }

  // updateInputValue = (evt) => {
  //   console.debug('%c⊙ EVT', 'color:#00ff7b', evt.target, evt.target.id, evt );
  //   var inputID = evt.target.id;
  //   this.setState({
  //     [inputID]:evt.target.value
  //   }, () => {
  //     console.debug('%c◉ updateInputValue UPDATED ', 'color:#5C3FFF',
  //       this.state[inputID],
  //     );
  //   });
  // }

  renderGroupAssignment = () => {
      return (
        <Select
          native 
          fullWidth
          labelid="group_label"
          id="assigned_to_group_name"
          name="assigned_to_group_name"
          label="Assigned to Group Name"
          value={this.state.assigned_to_group_name}
          onChange={(event) => this.updateInputValue(event)}>
          <option value=""></option>
          {this.props.allGroups.map((group, index) => {
            return (
              <option key={index + 1} value={Object.values(group)[0]}>
                {Object.values(group)[0]}
              </option>
            );
          })}
        </Select>
      )
  }

  renderDatasetTypeDropdown(){
    return (
      <Select
        // fullWidth
        size="small"
        name="intended_dataset_type"
        className={
          "form-control " +
          this.errorClass(this.state.formErrors.intended_dataset_type)
        }
        sx={{
          margin:"10px auto"
        }}
        value={this.state.intended_dataset_type} 
        id="intended_dataset_type" 
        labelid="type_label"
        label="Dataset Type"
        onChange={(e) => this.updateInputValue(e)}>
        <MenuItem value="" key={0} index={0}></MenuItem>
        {this.state.datasetTypes.map((type, index) => {
          return (
            <MenuItem key={index + 1} value={type.term}>
              {type.term} 
            </MenuItem>
          );
        })}
      </Select>
    )
  }

  
  renderOrganDropdown(){
    // console.debug('%c◉ organList ', 'color:#0033ff', this.state.organList);
    return (
      <Select
        // fullWidth
        size="small"
        name="intended_organ"
        className={
          "form-control " +
          this.errorClass(this.state.formErrors.intended_organ)
        }
        sx={{
          margin:"10px auto"
        }}
        value={this.state.intended_organ} 
        id="intended_organ" 
        labelid="organ_label"
        label="Intended Organ Type"
        onChange={(e) => this.updateInputValue(e)}>
        <MenuItem key={0}  ></MenuItem>
        {Object.entries(this.state.organList).map(([key, value], index) => {
          return (
            <MenuItem key={index + 1} value={value[0]}>
              {value[1]}
            </MenuItem>
          );
        })}
      </Select>
    )
  }

  renderLoadingSpinner() {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
        </div>
      );
  }


  renderDatasets = (datasetCollection) => {

    if(this.state.datasets && this.state.datasets.length > 0 ){

      // @TODO: use the Datatables used elsewhere across the site 
      var compiledCollection = [];
      for (var i in datasetCollection){
        
        
        compiledCollection.push({
          hubmap_id: datasetCollection[i].hubmap_id,
          lab_dataset_id:  datasetCollection[i].lab_dataset_id,
          group_name: datasetCollection[i].group_name,
          status: datasetCollection[i].status,
          uuid: datasetCollection[i].uuid
        });
      }
      return (
        <div>
           <label>
            Datsets 
          </label>
        <TableContainer component={Paper} style={{ maxHeight: 350 }}>
        <Table aria-label="Associated Datasets" size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>HuBMAP ID</TableCell>
              <TableCell component="th" align="left">Lab Name/ID</TableCell>
              <TableCell component="th" align="left">Group name</TableCell>
              <TableCell component="th" align="left">Submission Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {compiledCollection.map((row) => (
              <TableRow 
                key={row.hubmap_id}
                onClick={() => this.handleDatasetCellSelection(row)}
                >
                <TableCell align="left" scope="row">

                <Link className="btn btn-primary"
                to='/datasets/{row.uuid}' onClick={this.handleEnterIngest}>  
                  {row.hubmap_id}
                </Link>
                </TableCell>
                <TableCell align="left" scope="row">{row.lab_dataset_id}</TableCell>
                <TableCell align="left" scope="row">{row.group_name}</TableCell>
                <TableCell align="left" scope="row">
                  <span
                    className={"w-100 badge " + getPublishStatusColor(row.status, row.uuid)}>
                      {row.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </div>
      );
    }
  }

  renderValidationMessage (){
    if(this.state.validation_message){
      if(this.state.status === "Error"|| this.state.status === "Invalid" ){
        return (
          <Alert severity={this.state.validation_message_style}>
            <AlertTitle>{this.state.status}</AlertTitle>
            {this.state.validation_message}
          </Alert>
        )
      }
    }
  }
  
  render() {
    // console.debug('%c⊙ ALLGROUPS', 'color:#00ff7b', this.props.allGroups );
    return (
      <React.Fragment>
        <form>
          <div>
            <div className='row mt-3 mb-3'>
              <div className='col-sm-12'>
                <h3 className='float-left'>
                  <span
                    className={"mr-1 badge " + this.state.badge_class}
                    style={{ cursor: "pointer", marginRight: "10px" }}
                    onClick={() =>
                      this.showErrorMsgModal(
                        this.props.editingUpload.pipeline_message
                      )
                    }>
                    {this.props.editingUpload.status}
                  </span> 
                  {this.props.editingUpload &&
                    "HuBMAP Upload ID " +
                    this.props.editingUpload.hubmap_id}
                </h3>
              </div>
            </div>
            <React.Fragment>
              <div className="row  mb-3 ">
                <div className="col-sm-6">
                  <div className="col-sm-12 portal-label">Group Name: {this.props.editingUpload.group_name}</div>
                  <div className="col-sm-12 portal-label">Entered by: {this.props.editingUpload.created_by_user_email}</div>
                <div className="col-sm-12 portal-label">Entry Date: {tsToDate(this.props.editingUpload.created_timestamp)}</div>
              </div>
              <div className="col-sm-6">
                <p>
                  <strong>
                    <big>
                      {this.state.globus_path && (
                        <a
                          href={this.state.globus_path}
                          target='_blank'
                          rel='noopener noreferrer'>   
                              {this.state.globusLinkText}{" "}
                              <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                      )}
                    </big>
                  </strong>
                  </p>
              </div>
              </div>
            </React.Fragment>
          <div className='form-group'>
          {this.renderValidationMessage()}
            <label htmlFor='title'  className="mt-3">
              Upload Title <span className='text-danger'>*</span>
            </label>
              <span className="px-2">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='title_tooltip'
                />
                <ReactTooltip
                  id='title_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Upload Title Tips</p>
                </ReactTooltip>
                </span>

            {this.state.writeable && (
                <input
                  type='text'
                  name='title'
                  id='title'
                  className={
                    "form-control " +
                    this.errorClass(this.state.formErrors.title)
                  }
                  placeholder='Upload Title'
                  onChange={(event) => this.updateInputValue(event)}
                  value={this.state.title}
                />
              
            )}
            {!this.state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.title}</p>
              </div>
            )}
            
          </div>

          <div className='form-group'>
            <label htmlFor='description'> Description <span className='text-danger'>*</span></label>
            <span className="px-2">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='description_tooltip'/>
                <ReactTooltip
                  id='description_tooltip'
                  place='top'
                  type='info'
                  effect='solid'>
                  <p>Description Tips</p>
                </ReactTooltip>
              </span>
            {this.state.writeable && (
              <React.Fragment>
                <div>
                  <textarea
                    type='text'
                    name='description'
                    id='description'
                    cols='30'
                    rows='5'
                    className={"form-control " +this.errorClass(this.state.formErrors.description)}
                    placeholder='Description'
                    onChange={(event) => this.updateInputValue(event)}
                    value={this.state.description}
                  />
                </div>
              </React.Fragment>
            )}
            {!this.state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.description}</p>
              </div>
            )}
            <div>
            <div className=''>
              {this.renderDatasets(this.state.datasets)}
            </div>  
              

              {/* Make this check admin when finished */}
            {this.props.allGroups && this.state.data_admin && this.state.writeable && (
              <div className="row mt-4  ">
                <div className='form-group col-6'> 
                  <label htmlFor='assigned_to_group_name'>Assigned to Group Name </label>
                  {this.renderGroupAssignment()}
                  <FormHelperText>The group responsible for the next step in the data ingest process.</FormHelperText>
                </div>
                <div className='form-group col-6'> 
                  <label htmlFor='ingest_task'>Ingest Task </label>
                  <TextField
                    labelid="ingest_task_label"
                    name="ingest_task"
                    id="ingest_task"
                    helperText="The next task in the data ingest process."
                    // placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                    fullWidth
                    value={this.state.ingest_task}
                    onChange={(event) => this.updateInputValue(event)}/>
              
                </div>
              </div>
            )}
            <div className="row mt-4  ">
              <div className='form-group col-6'> 
                <label htmlFor='Organ'>Intended Organ Type <span className='text-danger'>*</span></label>
                <span className="px-2">
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for='Organ_tooltip'/>
                  <ReactTooltip
                    id='Organ_tooltip'
                    place='top'
                    type='info'
                    effect='solid'>
                    <p>Select the organ type that the data in this Upload is intended to be derived from.</p>
                  </ReactTooltip>
                </span>
                {this.renderOrganDropdown()}
              </div>
              <div className='form-group col-6'> 
                <label htmlFor='Dataset Type'>Intended Dataset Type <span className='text-danger'>*</span></label>
                <span className="px-2">
                  <FontAwesomeIcon
                    icon={faQuestionCircle}
                    data-tip
                    data-for='Dataset Type_tooltip'/>
                  <ReactTooltip
                    id='Dataset Type_tooltip'
                    place='top'
                    type='info'
                    effect='solid'>
                    <p>Select the data type that this Upload will contain.</p>
                  </ReactTooltip>
                </span>
                {this.renderDatasetTypeDropdown()}  
              </div>
            </div>


            
            {!this.state.data_admin && this.state.assigned_to_group_name && this.state.ingest_task && (
              <div className="row mt-4  ">
                <div className='form-group col-6'> 
                  <label htmlFor='assigned_to_group_name'>Assigned to Group Name </label>
                  <Typography >{this.state.assigned_to_group_name}</Typography>
                </div>
                <div className='form-group col-6'> 
                  <label htmlFor='ingest_task'>Ingest Task </label>
                  <Typography >{this.state.ingest_task}</Typography>
                </div>
              </div>
            )}
            
          </div>
        

          {this.state.submit_error && (
            <div className='alert alert-danger col-sm-12' role='alert'>
              Oops! Something went wrong. Please contact administrator for help.
            </div>
          )}

          </div>
          </div>

        {this.renderButtonBar()}
      </form>

      <Modal
        show={this.state.errorMsgShow}
        handleClose={this.hideErrorMsgModal}
      >
        <div className='row'>
          <div className='col-sm-12 text-center alert'>
            <h4>
              {(this.props.editingUpload &&
                this.props.editingUpload.status.toUpperCase()) ||
                "STATUS"}
            </h4>
            <div
              dangerouslySetInnerHTML={{ __html: this.state.statusErrorMsg }}
            ></div>
          </div>
        </div>
      </Modal>
    </React.Fragment>

    );
  }
}

export default EditUploads;
