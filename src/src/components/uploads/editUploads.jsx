import React, { Component } from "react";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import { DataGrid } from '@material-ui/data-grid';  
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
import TablePagination from '@material-ui/core/TablePagination';
import { ingest_api_get_globus_url, 
  ingest_api_validate_upload } from '../../service/ingest_api';
import { COLUMN_DEF_DATASET} from '../search/table_constants';

class EditUploads extends Component {

  
  state = {
    editingEntity: "entity_data",
    title:"title",
    description:"desc",
    author:"created_by_user_displayname",
    created:"created_timestamp",
    group:"group",
    hid:"hubmap_id",
    uuid:"uuid",
    datasets:{},
    status:"status",
    creatingNewUploadFolder: true,
    confirmModal: false,
    writeable: false,
    pageSize:10
  }

  

  componentDidMount() {

    console.debug(this.props.editingUpload);
    // let history = this.props.history;
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json",
      },
    };
    let entity_data = this.props.editingUpload;
    
    
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
      group:entity_data.group_name,
      datasets:entity_data.datasets,
      status:entity_data.status,
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
          name: ""        },
      },
      () => {
        switch (this.state.status.toUpperCase()) {
          case "NEW":
            console.debug("WRITEABLE");
            this.setState({
              validation_message_style:null,
              badge_class: "badge-purple",
              writeable: true
            });
          break;
          case "ERROR":
            console.debug("WRITEABLE");
            this.setState({
              validation_message_style:"error",
              badge_class: "badge-danger",
              writeable: true
            });
          break;
          case "INVALID":
            console.debug("WRITEABLE");
            this.setState({
              validation_message_style:"warning",
              badge_class: "badge-danger",
              writeable: true
            });
          break;
          case "VALID":
            console.debug("NOT WRITEABLE");
            this.setState({
              validation_message_style:null,
              badge_class: "badge-success",
              writeable: false
            });
          break;
          case "PROCESSING":
            console.debug("NOT WRITEABLE");
            this.setState({
              validation_message_style:null,
              badge_class: "badge-secondary",
              writeable: false
            });
            break;
          case "REORGANIZED":
            console.debug("NOT WRITEABLE");
            this.setState({
              validation_message_style:null,
              badge_class: "badge-info",
              globusLinkText: "Open data repository ",
              writeable: false
            });
            break;
          case "DEPRECATED":
            break;
          default:
            break;
        }

        //validation_message

        axios
          .get(
            `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${this.props.editingUpload.uuid}`,
            config
          )
          .then((res) => {
            this.setState({
              globus_path: res.data,
            });
          })
          .catch((err) => {
            this.setState({
              globus_path: "",
              globus_path_tips: "Globus URL Unavailable",
            });
            if (err.response && err.response.status === 401) {
              localStorage.setItem("isAuthenticated", false);
              window.location.reload();
            }
          });
      });

      this.setState({
          datarows: this.state.datasets, // Object.values(response.results)
          results_total:  this.state.datasets.length,
          column_def: COLUMN_DEF_DATASET})

    
    console.debug(this.state);
    console.debug(this.props.editingUpload);
    
    

  };

    handleCancel = () => {
      if (this.props.history) {
        this.props.history.goBack();
      } else {
        this.props.handleCancel();
      }
    }


  showConfirmModal = () => {
    this.setState({ confirmModal: true });
    // console.debug(this.state)
  };

  hideConfirmModal = () => {
    this.setState({ confirmModal: false });
  };

  handleValidateUpload = (i) => {
    this.validateForm().then((isValid) => {
      if (isValid) {
        if (
          !this.props.editingUpload &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
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

            console.debug(JSON.stringify(data));
            console.debug(JSON.parse(localStorage.getItem("info")));
            // if user selected Publish
            ingest_api_validate_upload(this.props.editingUpload.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
              .then((response) => {
                console.debug(response.results);
                  if (response.status === 200) {
                    this.props.onUpdated(response.results);
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
            });
          } 
        }
      }
    });
  };


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
      console.log("highlightInvalidDatasets");
      var matches = document.querySelectorAll("div[data-value='invalid']");
      console.log(matches);
      matches.forEach(function(item) {
          item.parentElement.classList.add("invalidDatset");
          console.log("INVALID item");
          console.log(item);
      });
      console.log("END highlightInvalidDatasets");
  } 



  renderButtonBar(){
      return (
        <div className='row'>
          <div className="col-sm-12">
          <Divider />
          </div>
          <div className='col-md-12 text-right pads'>
            {this.renderActionButton()}
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
  } 


  renderActionButton() {
    if (["NEW", "INVALID", "ERROR"].includes(
      this.state.status.toUpperCase()
    )){
    return ( 
      <button
        type='button'
        className='btn btn-info mr-1'
        disabled={this.state.submitting}
        onClick={() => this.handleButtonClick(this.state.status.toLowerCase()) }
        data-status={this.state.status.toLowerCase()}
      >
        {this.state.submitting && (
        <FontAwesomeIcon
          className='inline-icon'
          icon={faSpinner}
          spin
        />
      )}
      {!this.state.submitting && "Validate & Save"}
    </button>
    );
  } else if (["VALID"].includes(this.state.status.toUpperCase())){
    return (
      <button
        type='button'
        className='btn btn-info mr-1'
        disabled={this.state.submitting}
        onClick={() => this.handleButtonClick(this.state.status.toLowerCase()) }
        data-status={this.state.status.toLowerCase()}
      >
        {this.state.submitting && (
        <FontAwesomeIcon
          className='inline-icon'
          icon={faSpinner}
          spin
        />
      )}
      {!this.state.submitting && "Create Datasets"}
    </button>
    );
  }else if (
    ["REORGANIZED"].includes(
      this.state.status.toUpperCase()
    )){
    return ("");
  } else {
    return ("");
  }
  };
    
  
  componentDidUpdate(prevProps) { 
    // console.log("componentDidUpdate");
    // console.log(prevProps);
    // Typical usage (don't forget to compare props):
    // console.debug(this.props.editingUpload.datasets);
    if (this.props.targetUUID !== prevProps.targetUUID) {
      // this.getUpload(this.props.targetUUID);
    }
  }

  handleUrlChange = (targetPath) =>{
    console.debug("handleUrlChange "+targetPath)
      window.history.replaceState(
        null,
        "", 
        "/"+targetPath);
  }

  handleButtonClick = (i) => {
    this.setState({
      new_status: i
    }, () => {
      this.handleValidateUpload(i);
    })
  };

  fetchGlobusURL = (uploads_uuid) => {  


    ingest_api_get_globus_url(uploads_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
      .then((resp) => {
        console.debug('ingest_api_get_globus_url', resp)
      if (resp.status === 200) {
        window.open(resp.results, "_blank");
      }
    });

  };




  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;
      console.debug(validateRequired(this.state.title), validateRequired(this.state.description));

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

  handleDatasetCellSelection (row,column,event) {
    console.log("handleDatasetCellSelection");
    console.debug(row,column,event);
}


  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  updateInputValue = (evt) => {
    console.debug(evt.target.id, evt.target.value);
    if(evt.target.id==="title"){
      this.setState({
        title: evt.target.value
      });
    }else if(evt.target.id==="description"){
      this.setState({
        description: evt.target.value
      });
    }
    
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
        console.debug(datasetCollection[i].lab_dataset_id)
        console.debug("/uploads/"+datasetCollection[i].uuid)
        compiledCollection.push({
          hubmap_id: datasetCollection[i].hubmap_id,
          lab_dataset_id:  datasetCollection[i].lab_dataset_id,
          group_name: datasetCollection[i].group_name,
          status: datasetCollection[i].status
        });
      }
      return (
        <div>
           <label>
            Datsets 
          </label>
        <TableContainer component={Paper} style={{ maxHeight: 150 }}>
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
                onClick={this.handleDatasetCellSelection(row)}
                >
                <TableCell align="left" scope="row">{row.hubmap_id}</TableCell>
                <TableCell align="left" scope="row">{row.lab_dataset_id}</TableCell>
                <TableCell align="left" scope="row">{row.group_name}</TableCell>
                <TableCell align="left" scope="row">
                  <span
                    className={"w-100 badge " + getPublishStatusColor(row.status)}>
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
    return (
      <React.Fragment>
      <Paper className="paper-container">
      <form>
        <div>
            <div className='row mt-3 mb-3'>
                
              <div className='col-sm-12'>
                <h3 className='float-left'>
                    <span
                      className={"mr-1 badge " + this.state.badge_class}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        this.showErrorMsgModal(
                          this.props.editingUpload.pipeline_message
                        )
                      }
                    >
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
                <div className="col-sm-12 portal-label">
                Group Name: {this.props.editingUpload.group_name}
                </div>
                  <div className="col-sm-12 portal-label">
                    Entered by: {this.props.editingUpload.created_by_user_email}
                </div>
                <div className="col-sm-12 portal-label">
                    Entry Date: {tsToDate(this.props.editingUpload.created_timestamp)}
                </div>
              </div>
              <div className="col-sm-6">
              <p>
                    <strong>
                      <big>

                        {this.state.globus_path && (

                          <a
                            href={this.state.globus_path}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                              <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip' className="mr-2"/>
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
                    this.errorClass(this.state.formErrors.name)
                  }
                  placeholder='Upload Title'
                  onChange={this.updateInputValue}
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
            <label
              htmlFor='description'>
              Description 
            </label>
            <span className="px-2">
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
                    className='form-control'
                    placeholder='Description'
                    onChange={this.updateInputValue}
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
         
          <div className='col-sm-9 col-form-label'>
            {this.renderDatasets(this.state.datasets)}
          </div>  
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
      </Paper>
    </React.Fragment>

    );
  }
}

export default EditUploads;
