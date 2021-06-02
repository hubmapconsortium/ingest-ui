import React, { Component } from "react";
import axios from "axios";
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import FormControl from '@material-ui/core/FormControl';

import ReactTooltip from "react-tooltip";
import { ingest_api_users_groups } from '../../service/ingest_api';
// function Alert(props: AlertProps) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class CreateUploads extends Component {
  constructor(props) {
    super(props);
    this.state = {
      creatingNewUploadFolder: true,
      currentDateTime: Date().toLocaleString(),
      groups:[],
      processingUpload:false,
      successfulUploadCreation:false,
      errorMessage:" ",
      showNewUpload:true,
      formErrors: {
           title: "",
           description: ""
         },
    };

  }


  componentDidMount() {
    var tgl = this.getUserGroups();
    console.log(tgl);
    console.debug(this.state);
  }

  


  handleCreateUploadFolder(){  
      this.setState({
        processingUpload: true
      });

      let data = {
        title: this.state.inputValue_title,
        description: this.state.inputValue_desc, // Just till I can solve unexpected key error
        group_uuid:this.state.inputValue_group_uuid 
      };

      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
          MAuthorization: "MBearer " + localStorage.getItem("info"),
          "Content-Type": "application/json"
        }
      }

      axios
        .post(
          `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads`,
          JSON.stringify(data),
          config
        )
        .then(response => {
          console.debug("response: ", response);
          if (response.status === 200) {
            console.debug(response.data);
            this.props.onCreated(response.data);            
          } else {
            this.setState({ 
              submit_error: true, 
              submitting: false ,
              processingUpload:false,
              errorMessage:response,
            });
            console.debug("NON 200: "+response.status);
            console.debug(response);
          }
        })
        .catch(error => {
          console.log("Uploads FOlder Created NOT OK!");
          console.debug(error);
          var err ="";
          if(error.response){
            err = error.response.data.error;
            console.log(err);
          }else{
            err = error;
            console.log(error);
          }
          this.setState({ 
            submit_error: true, 
            submitting: false,
            errorMessage:err,
            processingUpload:false
          });
          
        });
  };


  errorClass(error) {
    // if (error === "valid") return "is-valid";
    // return error.length === 0 ? "" : "is-invalid";
  }


  cancelEdit = () => {
    this.setState({ creatingNewSubmission: false, editingSubmission: null });
  };


  updateInputValue = (evt) => {
    // console.log(evt.target.id);
    if(evt.target.id==="Submission_Name"){
      // console.log('evt.target.id==="Submission_Name"');
      this.setState({
        inputValue_title: evt.target.value
      });
    }else if(evt.target.id==="Submission_Desc"){
      // console.log('evt.target.id==="Submission_Desc"');
      this.setState({
        inputValue_desc: evt.target.value
      });
    }else if(evt.target.id==="Submission_Group"){
      // console.log('evt.target.id==="Submission_Group"');
      this.setState({
        inputValue_group_uuid: evt.target.value
      });
    }
    //console.log(this.state);
  }


  renderLoadingSpinner() {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
          <h3>Generating your new folder.</h3>
          <h6>Please do not refresh or leave this page</h6>
        </div>
      );
  }


  renderSuccessMessage() {
      return (
        <div className='m-0 '>
          renderSuccessMessage
          {/* <Alert severity="success">
            Folder Created Successfully! If you're not redirected in 999 seconds, <a href="">click here.</a> 
          </Alert> */}
        </div>

      );
  }


  renderErrorMessage() {
      return (
        <div className='m-0 '>
          {/* <Alert severity="error">{this.state.errorMessage}</Alert> */}
        </div>
      );
  }

  getUserGroups(){
    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).nexus_token).then((results) => {
      if (results.status === 200) { 
      const groups = results.results.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        // return groups;
        this.setState({ 
          groups: groups,
          inputValue_group_uuid: groups[0].uuid
        });
        
      } else if (results.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }else{
          this.setState({ groups: ["NA"] });
        }
    });
  }

  renderGroupSelect(){
    return (
      <div className="col3">
        <select
            name="Submission_Group"
            id="Submission_Group"
            label="Group"
            className="form-control mt-3"
            onChange={this.updateInputValue}
            size="small"
            margin="dense"
          >
            {this.state.groups.map(g => {
              return <option key={g.uuid} value={g.uuid}>{g.displayname}</option>;
            })}
          </select>
      </div>
    )
  }  


  renderActionButtons = () =>  {
    return (
        <div className="row">
          <div className="col-sm-12">
          <Divider />
          </div>
          <div className="col-md-12 text-right pads">
              <button
              className="btn btn-primary mr-1"
              onClick={() => this.handleCreateUploadFolder()}
              >
                  {this.state.submitting && (
                  <FontAwesomeIcon
                  className="inline-icon"
                  icon={faSpinner}
                  spin
                  />
              )}
              {!this.state.submitting && "Create"}
              </button>
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
  

  render() {
    return (
      <React.Fragment>
        {(this.state.processingUpload) && (
          this.renderLoadingSpinner()
        )}
        {(!this.state.processingUpload) && (

          
          <form>
            <div className='row mt-3 mb-3'>
              <div className='col-sm-12'>
                  <h3 className='float-left'>
                  New Upload
                </h3>
              </div>
            </div>

            <div className='form-group'>
                <label htmlFor='title'>
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
                    <input
                      type='text'
                      name='title'
                      id='Submission_Name'
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.name)
                      }
                      placeholder='Upload Title'
                      onChange={this.updateInputValue}
                      value={this.state.e_title}
                    />
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
                  <React.Fragment>
                    <div>
                      <textarea
                        type='text'
                        name='description'
                        id='Submission_Desc'
                        cols='30'
                        rows='5'
                        className='form-control'
                        placeholder='Description'
                        onChange={this.updateInputValue}
                        value={this.state.e_desc}
                      />
                    </div>
                  </React.Fragment>

                  {this.renderGroupSelect()}
                
            
              {this.state.submit_error && (
                <div className='alert alert-danger col-sm-12' role='alert'>
                  Oops! Something went wrong. Please contact administrator for help.
                </div>
              )}
              </div>
            {this.renderActionButtons()}
          </form>
          )}
        </React.Fragment>
    );
  }
}

export default CreateUploads;
