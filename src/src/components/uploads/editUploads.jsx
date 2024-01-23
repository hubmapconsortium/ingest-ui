import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import { Link } from 'react-router-dom';
import Select from '@mui/material/Select'; 
import { validateRequired } from "../../utils/validators";
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faExternalLinkAlt, faFolder}
  from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";
import ReactTooltip from "react-tooltip";
import { tsToDate } from "../../utils/string_helper";
import { Alert, AlertTitle } from '@material-ui/lab';

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { ingest_api_get_globus_url, 
  ingest_api_validate_upload,
  ingest_api_submit_upload,
  ingest_api_reorganize_upload,
  ingest_api_all_user_groups,
  ingest_api_notify_slack } from '../../service/ingest_api';
import {
    entity_api_update_entity,
    entity_api_get_globus_url
} from '../../service/entity_api';
import { COLUMN_DEF_DATASET} from '../search/table_constants';

// import { DATA_ADMIN, DATA_CURATOR } from '../../service/user_service'
class EditUploads extends Component{


  
  state = {
    editingEntity: "entity_data",
    title:"title",
    description:"desc",
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
    
  }

  

  componentDidMount() {

    
    const groupsAuth = JSON.parse(localStorage.getItem("info")).groups_token;
    const config = { // Nix this and use the one in the service
      headers: {
        Authorization:
          "Bearer " + groupsAuth,
        "Content-Type": "application/json",
      },
    };
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
    

    this.setState({
      // groups: this.props.groups,
      updateSuccess: null,
      show:true,
      editingEntity:entity_data,
      title:entity_data.title,
      hid:entity_data.hubmap_id,
      uuid:entity_data.uuid,
      description:entity_data.description,
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
        formErrors: {
          title: ""        ,
          description: ""        },
      },
      () => {

        // gets fine permissions
        this.allowablePermissions(this.state.group)

        //@TODO: Decouple Badge class from this switch that sets writeable state & Validation Messge Style
        // Unless these are a different Badge not RE status but another state? 
        switch (this.state.status.toUpperCase()) {
          case "NEW":
            
            this.setState({
              validation_message_style:null,
              badge_class: "badge-purple",
              writeable: true
            });
          break;
          case "ERROR":
            
            this.setState({
              validation_message_style:"error",
              badge_class: "badge-danger",
              writeable: true
            });
          break;
          case "INVALID":
            
            this.setState({
              validation_message_style:"warning",
              badge_class: "badge-danger",
              writeable: true
            });
          break;
          case "VALID":
            
            this.setState({
              validation_message_style:null,
              badge_class: "badge-success",
              writeable: false
            });
          break;
          case "PROCESSING":
            
            this.setState({
              validation_message_style:null,
              badge_class: "badge-secondary",
              writeable: false
            });
            break;
          case "REORGANIZED":
            
            this.setState({
              validation_message_style:null,
              badge_class: "badge-info",
              globusLinkText: "Open data repository ",
              writeable: false
            });
            break;
          case "SUBMITTED":
            
            this.setState({
              validation_message_style:null,
              badge_class: "badge-info",
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
          let data = {
            title: this.state.title,
            description: this.state.description,
            assigned_to_group_name:this.state.assigned_to_group_name ? this.state.assigned_to_group_name : null,
            ingest_task:this.state.ingest_task ? this.state.ingest_task : null, 
          };
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
            assigned_to_group_name:this.state.assigned_to_group_name ? this.state.assigned_to_group_name : null,
            ingest_task:this.state.ingest_task ? this.state.ingest_task : null, 
          };
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
    switch (name) {
      case "title":
        this.setState({
          title: value,
        });
        break;
      case "description":
        this.setState({
          description: value,
        });
        break;
      case "status":
        this.setState({
          new_status: value,
        });
        break;
      default:
        break;
    }
    
  };

  


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
    if (["VALID","INVALID", "ERROR", "NEW"].includes(
      this.state.status.toUpperCase()
      ) && (this.state.data_admin || this.state.data_curator || this.state.data_group_editor)) {
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
    if(this.state.writeable){
      return(
        <div className="helper-text p-2 m-2 align-right w-100 text-right">
          <p className="text-small text-end p-0 m-0">Use the <strong>Submit</strong> button when all data has been uploaded and is ready for HIVE review.</p>
          <p className="text-small text-end p-0 
          m-0">Use the <strong>Save</strong> button to save any updates to the Title or Description.</p>
        </div>
      )
    }
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
    if (error && error === "valid" ) return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  updateInputValue = (evt) => {
    console.debug('%c⊙ EVT', 'color:#00ff7b', evt.target, evt.target.id, evt );
    var inputID = evt.target.id;
    this.setState({
      [inputID]:evt.target.value
    });
  }

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


  
    // dev int
  render() {
    console.debug('%c⊙ ALLGROUPS', 'color:#00ff7b', this.props.allGroups );
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
            {this.props.allGroups && this.state.data_admin && (
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
