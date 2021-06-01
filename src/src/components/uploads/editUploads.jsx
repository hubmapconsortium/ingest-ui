import React, { Component } from "react";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { validateRequired } from "../../utils/validators";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faUserShield,
  faTimes,
  faSearch, faPaperclip, faAngleDown,
  faExternalLinkAlt, faFolder
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";
import GroupModal from "../uuid/groupModal";
import ReactTooltip from "react-tooltip";
import Icon from '@material-ui/core/Icon';
import Box from '@material-ui/core/Box';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import { tsToDate } from "../../utils/string_helper";

// import GroupModal from "../../groupModal";
import { entity_api_get_entity, 
  entity_api_update_entity, 
  entity_api_create_entity,
  entity_api_create_multiple_entities, 
  entity_api_get_entity_ancestor 
} from '../../service/entity_api';
import { ingest_api_allowable_edit_states } from '../../service/ingest_api';
import FormControl from '@material-ui/core/FormControl';  
import { ingest_api_get_globus_url, 
  ingest_api_create_upload,
  ingest_api_validate_upload } from '../../service/ingest_api';
import { FiberManualRecordTwoTone } from "@material-ui/icons";



class EditUploads extends Component {

  
  state = {
    editingEntity: "entity_data",
    e_title:"title",
    e_desc:"desc",
    e_author:"created_by_user_displayname",
    e_created:"created_timestamp",
    e_group:"group",
    e_HID:"hubmap_id",
    e_UUID:"uuid",
    e_datasets:"datasets",
    e_status:"status",
    creatingNewUploadFolder: true,
    confirmModal: false
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
      groups: this.props.groups,
      updateSuccess: null,
      show:true,
      editingEntity:entity_data,
      e_title:entity_data.title,
      e_hid:entity_data.hubmap_id,
      e_uuid:entity_data.uuid,
      e_desc:entity_data.description,
      e_author:entity_data.created_by_user_displayname,
      e_created:entity_data.created_timestamp,
      e_group:entity_data.group_name,
      e_datasets:entity_data.datasets,
      e_GURL:"",
      e_status:entity_data.status,
      editForm: true,
      show_modal: true,
      show_search: false,
      new_entity: false,  
      creatingNewUploadFolder:true,
      writeable:true,
      groups: [],
        formErrors: {
          name: "",
          source_uuid: "",
        },
      },
      () => {
        switch (this.state.e_status.toUpperCase()) {
          case "NEW":
            this.setState({
              badge_class: "badge-purple",
            });
            break;
          case "REOPENED":
            this.setState({
              badge_class: "badge-purple",
            });
            break;
          case "INVALID":
            this.setState({
              badge_class: "badge-warning",
            });
            break;
          case "QA":
            this.setState({
              badge_class: "badge-info",
            });
            break;
          case "LOCKED":
            this.setState({
              badge_class: "badge-secondary",
            });
            break;
          case "ERROR":
            this.setState({
              badge_class: "badge-danger",
            });
            break;
          case "PUBLISHED":
            this.setState({
              badge_class: "badge-success",
            });
            break;
          case "UNPUBLISHED":
            this.setState({
              badge_class: "badge-light",
            });
            break;
          case "DEPRECATED":
            break;
          default:
            break;
        }

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


    
    console.debug(this.state);
    
    

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
            title: this.state.e_title,
            description: this.state.e_desc
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
    const { id, name, value } = e.target;
    switch (name) {
      case "title":
        this.setState({
          e_title: value,
        });
        break;
      case "description":
        this.setState({
          e_desc: value,
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


  renderButtons() {
    if (this.props.editingUpload) {
      if (this.state.writeable === false) {
        ////console.log("editing but not writeable",  this.state.writeable)
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
        ////console.log("checking Has submit rights",  this.state.has_submit_privs)
        if (this.state.has_submit_privs) {
            
          if (this.state.e_status.toUpperCase() === "QA") {
            return (
              <div className='row'>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.e_status.toLowerCase())
                    }
                    data-status={this.state.e_status.toLowerCase()}
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
                    data-status={this.state.e_status.toLowerCase()}
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
            } else if (this.state.e_status.toUpperCase() === "PUBLISHED") {  // not QA if statement
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
            } else if (this.state.e_status.toUpperCase() === "UNPUBLISHED") {  // not PUBLISHED if stmt
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
            } else {  // not UNPUBLISHED
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
              this.state.e_status.toUpperCase()
            )
          ) {
          
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block mr-1'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.e_status.toLowerCase())
                    }
                    data-status={this.state.e_status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Validate"}
                  </button>
                </div>
                <div className='col-sm-4 text-center'>
                  {this.state.has_submit && (
                    <button
                      type='button'
                      className='btn btn-primary btn-block'
                      disabled={this.state.submitting}
                      onClick={() => this.handleButtonClick("processing")}
                      data-status={this.state.e_status.toLowerCase()}
                    >
                      {this.state.submitting && (
                        <FontAwesomeIcon
                          className='inline-icon mr-1'
                          icon={faSpinner}
                          spin
                        />
                      )}
                      {!this.state.submitting && "Submit"}
                    </button>
                  )}
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
                    Cancel
                  </button>
                </div>
              </div>
            );
          }
        }
      }
    } else {  // buttons for a new record
    
      return (

        <div className='row'>
          <div className="col-sm-12">
          <Divider />
          </div>
          <div className='col-md-12 text-right pads'>
            <button
              type='button'
              className='btn btn-primary mr-1'
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
  }

  
  
  // componentDidMount() { 
  //     console.log("componentDidMount");
  //     console.log(this.props.targetUUID);
  //     this.getUpload(this.props.targetUUID);
  // }

  // componentDidUpdate(prevProps, prevState) {
  //   if (prevProps.targetUUID !== this.props.targetUUID) {
  //     this.getUpload(targetUUID);
  //     console.log('targetUUID state has changed.')
  //   }
  // }

  componentDidUpdate(prevProps) { 
    console.log("componentDidUpdate");
    console.log(prevProps);
    // Typical usage (don't forget to compare props):
    if (this.props.targetUUID !== prevProps.targetUUID) {
      // this.getUpload(this.props.targetUUID);
    }
  }

  //ingest-api/uploads/<uuid>/validate
  //ingest-api/uploads/<uuid>/reorganize-into-datasets


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
      console.debug(validateRequired(this.state.e_title), validateRequired(this.state.e_desc));

      if (!validateRequired(this.state.e_title)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "required" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "" },
        }));
      }

      if (!validateRequired(this.state.e_desc)) {
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



  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  updateInputValue = (evt) => {
    console.debug(evt.target.id, evt.target.value);
    if(evt.target.id==="title"){
      this.setState({
        e_title: evt.target.value
      });
    }else if(evt.target.id==="description"){
      this.setState({
        e_desc: evt.target.value
      });
    }
    
  }


  renderLoadingSpinner() {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
        </div>
      );
    // }
  }




  renderActionButtons() {
    return (
      <div className="row">
      <div className="col-sm-12">
        <Divider />
      </div>
        <div className="col-sm-12 text-right pads">
          <button
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
            {!this.state.submitting && "Validate"}
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
                      {this.props.editingUpload.e_status}
                    </span> 
                    {this.props.editingUpload &&
                      "HuBMAP Upload ID " +
                      this.props.editingUpload.uuid}
                  </h3>
                </div>
              </div>

            <div className='row mt-3 mb-3'>
               <div className="col-sm-12">
                  <p>
                    <strong>
                      <big>
                       
                        {this.state.globus_path && (

                          <a
                            href={this.state.globus_path}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                              <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/> To add or modify data files go to the data repository{" "}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                        )}
                       
                      </big>
                    </strong>
                  </p>
            </div>
          </div>
          <div className='form-group'>
            <label htmlFor='name'>
              Upload Name <span className='text-danger'>*</span>
            </label>
              <span className="px-2">
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
                  <p>Upload Name Tips</p>
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
                  placeholder='Dataset name'
                  onChange={this.updateInputValue}
                  value={this.state.e_title}
                />
              
            )}
            {!this.state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.e_title}</p>
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
                    value={this.state.e_desc}
                  />
                </div>
              </React.Fragment>
            )}
            {!this.state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.e_desc}</p>
              </div>
            )}
            
        
          {this.state.submit_error && (
            <div className='alert alert-danger col-sm-12' role='alert'>
              Oops! Something went wrong. Please contact administrator for help.
            </div>
          )}
          </div>
          </div>

        {this.renderButtons()}
      </form>

      <GroupModal
        show={this.state.GroupSelectShow}
        hide={this.hideGroupSelectModal}
        groups={this.state.groups}
        submit={this.handleValidateUpload}
        handleInputChange={this.handleInputChange}
      />
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
              dangerouslySetInnerHTML={{ __html: this.state.e_statusErrorMsg }}
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
