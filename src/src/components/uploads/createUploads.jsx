import React, { Component } from "react";
import axios from "axios";
import Divider from '@material-ui/core/Divider';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

import { validateRequired } from "../../utils/validators";
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
      inputValue_desc:"",
      inputValue_title:"",
      groups:[],
      processingUpload:false,
      successfulUploadCreation:false,
      errorMessage:" ",
      showNewUpload:true,
      formErrors: {
          title: "",
          group: ""
        },
    };

  }


  componentDidMount() {
    var tgl = this.getUserGroups();
    console.log(tgl);
    console.debug(this.state);
    console.debug(this.props);
  }

  


  handleSubmit = e => {
    e.preventDefault();
    console.log(this.validateForm());
    if (this.validateForm()) {
      console.log("IS VALID")
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
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
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
      }else{
        console.log("IS INVALID")
      };
  };


  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  cancelEdit = () => {
    console.debug("form js cancelEdit!!");
    this.setState({ 
      creatingNewSubmission: false, 
      editingSubmission: null ,
      processingUpload:false,
      submitting: false,
      creatingNewUpload:false
    });
  };


  // validateInput(input,label){
  //   if (!validateRequired(input)) {
  //     this.setState((prevState) => ({
  //       formErrors: { ...prevState.formErrors, label: "invalid" },
  //     }));
  //     isValid = false;
  //   } else {
  //     this.setState((prevState) => ({
  //       formErrors: { ...prevState.formErrors, label: "valid" },
  //     }));
  //   }

  // }


  validateForm() {
      let isValid = true;
      if (!validateRequired(this.state.inputValue_title)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "invalid" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, title: "valid" },
        }));
      }

      if (!validateRequired(this.state.inputValue_group_uuid)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, group: "invalid" },
        }));
        isValid = false;
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, group: "valid" },
        }));
      }
      console.log(this.state.formErrors);
      return isValid;
  }





  updateInputValue = (evt) => {
    // console.log(evt.target.id+": "+evt.target.value+" | "+evt.target.value.length);
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
    this.validateForm();

  }


  renderLoadingSpinner() {
      return (
        <div className='text-center mx-2 my-4'>
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
    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
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
    //Select the data provider group that this data belongs to
    return (
      <div className="col3">
        <select
            name="Submission_Group"
            id="Submission_Group"
            label="Group"
            className={"form-control select-css" +
              this.errorClass(this.state.formErrors.group)
            }
            onChange={this.updateInputValue}
            // size="small"
            // margin="dense"
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
          <div className="col-md-12 text-right pads" style={{"textAlign":"right"}}>
              <button
              type="submit"
              style={{marginRight: "10px", marginLeft: "10px"}}
              className="btn btn-primary  "
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
              style={{marginRight: "10px"}}
              onClick={this.props.cancelEdit}
              >
                  Cancel
              </button>
          </div>
        </div>  
      );
    
  }
  

  render() {
    return (
      <div>
      <div className="row">
        <div className="col-12">
          <h3 className='float-left'>
            Create a new Data Upload
          </h3>
        </div>
      </div>
      <div className="row">
        <div className='col-12 mb-4'>
            Register a new Data Upload which will be used to bulk upload data which will organized by the HIVE into multiple Datasets. For more information about registering and uploading data see the <a href="https://docs.google.com/document/d/1KR2TC2y-NIjbBRHTu0giSZATMUfPKxN_/edit" target="new"> Data Submission Guide.</a>
          </div>
      </div>


      <div className="row">
        <div className="col-md-12">
          
          {(this.state.processingUpload) && (
            this.renderLoadingSpinner()
          )}
          {(!this.state.processingUpload) && (
            <div>
              <form onSubmit={this.handleSubmit}>

                <div className='form-group  mb-4'>
                    <label htmlFor='title'>
                      Title <span className='text-danger'>*</span>
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
                          <p>A name for this upload. This will be used internally by Consortium members for the purposes of finding this Data Upload</p>
                        </ReactTooltip>
                      </span>
                        <input
                          type='text'
                          name='title'
                          id='Submission_Name'
                          className={
                            "form-control " +
                            this.errorClass(this.state.formErrors.title)
                          }
                          placeholder='Upload Title'
                          onChange={this.updateInputValue}
                          value={this.state.e_title}
                        />
                  </div>

                <div className='form-group mb-4'>
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
                          <p>A full description of this Data Upload which will be used internally by the Consortium (not displayed publicly) for the purposes of searching for the Data Upload.</p>
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
                            className={
                              "form-control "
                            }
                            placeholder='Description'
                            onChange={this.updateInputValue}
                            value={this.state.e_desc}
                          />
                        </div>
                      </React.Fragment>
                    </div>

                    <div className='form-group mb-1'>
                      <label
                        htmlFor='Submission_Group'>
                        Select the data provider group that this data belongs to 
                      </label>
                      <span className="px-1">
                        <FontAwesomeIcon
                          icon={faQuestionCircle}
                          data-tip
                          data-for='group_tooltip'
                        />
                        <ReactTooltip
                          id='group_tooltip'
                          place='top'
                          type='info'
                          effect='solid'
                        >
                          <p>Choose the Data Provider group which the data included in this Data Upload will be associated with/is being uploaded by.</p>
                        </ReactTooltip>
                      </span>
                      {this.renderGroupSelect()}
                
                  {this.state.submit_error && (
                    <div className='alert alert-danger col-sm-12' role='alert'>
                      Oops! Something went wrong. Please contact administrator for help.
                    </div>
                  )}
                  </div>
                {this.renderActionButtons()}
              </form>
            </div>
          )}

        </div>
        
      </div>
      </div>
      );
  }
}

export default CreateUploads;
