import React, { Component } from "react";
import Alert from '@mui/material/Alert';
import Divider from '@material-ui/core/Divider';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faExclamationTriangle, faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import {RenderError} from "../../utils/errorAlert";
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { validateRequired } from "../../utils/validators";
import ReactTooltip from "react-tooltip";
import { ingest_api_users_groups, ingest_api_create_upload } from '../../service/ingest_api';
import { ubkg_api_get_upload_dataset_types } from '../../service/ubkg_api';
// function Alert(props: AlertProps) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class CreateUploads extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorDetails:"",
      creatingNewUploadFolder: true,
      currentDateTime: Date().toLocaleString(),
      inputValue_title:"",
      inputValue_desc:"",
      inputValue_type:"",
      inputValue_organ:"",
      inputValue_group_uuid:"",
      organList:{},
      datasetTypes:{},
      assetError:false, 
      groups:[],
      processingUpload:false,
      successfulUploadCreation:false,
      errorMessage:" ",
      showNewUpload:true,
      formErrors: {
          title: "",
          description:"",
          organ:"",
          type:"",
          group: ""
        },
    };

  }


  componentDidMount() {
    // fill in the usergroups the user can select
    this.getUserGroups();

    // lets make sure we got the organs from local storage 
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

    // Datasets are based not on the basic ontology dataset call but on a specilized call with filters
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

      

  }

  handleSubmit = async e => {
    e.preventDefault();
    this.setState({ 
      submitting: true,
      processingUpload: true
    });

    if (!this.validateForm()) {
      if(
        (!this.state.inputValue_title || this.state.inputValue_title ==="") && 
        (!this.state.inputValue_desc || this.state.inputValue_desc ==="") && 
        (!this.state.inputValue_organ || this.state.inputValue_organ ==="") && 
        (!this.state.inputValue_type || this.state.inputValue_type ==="")
      ){ 
        this.handleError("Please fill in all required fields before submitting.");
        return;
      }else{
        this.handleError("The system has encountered an unrecognized error during validation. \
          Please try again or contact the help desk for further assistance.");
        return;
      }
    }
    const data = {
      title: this.state.inputValue_title,
      description: this.state.inputValue_desc,
      intended_organ: this.state.inputValue_organ,
      intended_dataset_type: this.state.inputValue_type,
      group_uuid: this.state.inputValue_group_uuid
    };
  
    try {
      const response = await ingest_api_create_upload(data, JSON.parse(localStorage.getItem("info")).groups_token);
      console.debug('%c◉ response ', 'color:#00ff7b', response);
      if (response.status === 200) {
        this.props.onCreated(response);
      } else {
        let err = response.error?.response?.data?.error ?? response.error?.response ?? response.error ?? response;
        console.debug('%c◉ err ', 'color:#00ff7b', err);
        this.handleError(err);
        
      }
    } catch (error) {
      console.debug('%c◉ error  ', 'color:#00ff7b', error);
      const err = error.response?.data?.error ?? error;
      this.handleError(err);
    }
  };


  handleError = (errorMessage) => {
    this.setState({
      submit_error: true,
      submitting: false,
      processingUpload: false,
      errorMessage:errorMessage
    });
  };


  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  cancelEdit = () => {
    this.setState({ 
      creatingNewSubmission: false, 
      editingSubmission: null ,
      processingUpload:false,
      submitting: false,
      creatingNewUpload:false
    });
  };

  validateForm() {
    const fields = [
      { name: 'inputValue_title', errorKey: 'title' },
      { name: 'inputValue_desc', errorKey: 'description' },
      { name: 'inputValue_type', errorKey: 'inteneded_dataset_type' },
      { name: 'inputValue_organ', errorKey: 'organ' },
      { name: 'inputValue_group_uuid', errorKey: 'group' }
    ];
    let isValid = true;
    fields.forEach(field => {
      const value = this.state[field.name];
      const errorStatus = validateRequired(value) ? 'valid' : 'invalid';
      if (errorStatus === 'invalid'){
        isValid = false;
      }
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, [field.errorKey]: errorStatus }
      }));
    });
    return isValid;
  }

  updateInputValue = (evt) => {
    console.debug('%c◉ evt ', 'color:#00ff7b', evt, evt.target);
    console.debug('%c◉ evt.target.name ', 'color:#00ff7b', evt.target.name);
    if (evt.target.name.length === 0) { // We get an empty string back from validation
      evt.target.value = null;
    } else {
      const stateUpdateMap = {
        "Submission_Title": "inputValue_title",
        "Submission_Desc": "inputValue_desc",
        "Submission_Organ": "inputValue_organ",
        "Submission_Type": "inputValue_type",
        "Submission_Group": "inputValue_group_uuid"
      };
      const stateKey = stateUpdateMap[evt.target.name];
      console.debug('%c◉ evt.target.id ', 'color:#00ff7b', evt.target.id);
      console.debug('%c◉ stateKey ', 'color:#00ff7b', stateKey);
      if (stateKey) {
        this.setState({
          [stateKey]: evt.target.value
        // });
        }, () => {
          console.debug('%c◉ STATE ', 'color:#5C3FFF',
            this.state,
          );
        });
      }else{
        console.debug('%c◉ Cant Match: ', 'color:#00ff7b', evt.target.id);
      }
  
      this.validateForm();
    }
  }

  renderDatasetTypeDropdown(){
    return (
      <Select
        fullWidth
        size="small"
        name="Submission_Type"
        className={
          "form-control " +
          this.state.formErrors["inteneded_dataset_type"]        
        }
        value={this.state.inputValue_type} 
        id="Submission_Type" 
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
        fullWidth
        size="small"
        name="Submission_Organ"
        className={
          "form-control " +
          this.state.formErrors["organ"]        
        }
        value={this.state.inputValue_organ} 
        id="Submission_Organ" 
        labelid="organ_label"
        label="Organ"
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
          {/* Cannot use errorAlert UI component until we upgrade it from a class component to function component */}
          <Alert severity="error">{this.state.errorMessage}</Alert>
        </div>
      );
  }


  getUserGroups(){
    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
      console.debug('%c◉ getUserGroup Results: ', 'color:#FF0095', results);
      if (results.status === 200) { 
      const groups = results.results.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
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
              // this.errorClass(this.state.formErrors.group)
              this.state.formErrors["group"]
            }
            onChange={(e) => this.updateInputValue(e)}
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
              disabled={this.state.submitting}
              onClick={(e) => this.handleSubmit(e)}
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
        {this.state.assetError && (
          this.renderErrorMessage()
        )}
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
                          name='Submission_Title'
                          id='Submission_Title'
                          className={
                            "form-control " +
                            // this.errorClass(this.state.formErrors.title)
                            this.state.formErrors["title"]
                          }
                          placeholder='Upload Title'
                          onChange={(e) => this.updateInputValue(e)}
                          value={this.state.inputValue_title}
                        />
                  </div>

                <div className='form-group mb-4'>
                    <label
                      htmlFor='description'>
                      Description <span className='text-danger'>*</span>
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
                          <textarea
                            type='text'
                            name='Submission_Desc'
                            id='Submission_Desc'
                            cols='30'
                            rows='5'
                            className={
                              "form-control " +
                              // this.errorClass(this.state.formErrors.description)
                              this.state.formErrors["description"]
                            
                            }
                            placeholder='Description'
                            onChange={(e) => this.updateInputValue(e)}
                            value={this.state.inputValue_description}
                          />
                    </div>

                    <div className='form-group mb-4'>
                      <label
                        htmlFor='organ'>
                        Organ <span className='text-danger'>*</span>
                      </label>
                      <span className="px-2">
                          <FontAwesomeIcon
                            icon={faQuestionCircle}
                            data-tip
                            data-for='organ_tooltip'
                          />
                          <ReactTooltip
                            id='organ_tooltip'
                            place='top'
                            type='info'
                            effect='solid'
                          >
                            <p>The Organ In Question</p>
                          </ReactTooltip>
                        </span>
                          {this.renderOrganDropdown()}
                    </div>

                    <div className='form-group mb-1'>
                      <label
                        htmlFor='datasetTypes'>
                        Dataset Type <span className='text-danger'>*</span>
                      </label>
                      <span className="px-2">
                          <FontAwesomeIcon
                            icon={faQuestionCircle}
                            data-tip
                            data-for='datasetTypes_tooltip'
                          />
                          <ReactTooltip
                            id='datasetTypes_tooltip'
                            place='top'
                            type='info'
                            effect='solid'
                          >
                            <p>The Type of Dataset In Question</p>
                          </ReactTooltip>
                        </span>
                        {this.state.datasetTypes.length > 0 && (
                          this.renderDatasetTypeDropdown()
                        )}
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
                    <div className='alert alert-danger col-sm-12 mt-4' role='alert'>
                      Oops! Something went wrong: <  br/>
                      <FontAwesomeIcon icon={faExclamationTriangle} sx={{padding:1}}/> {this.state.errorMessage.toString()} < br/>
                      If the problem persists, please contact the HuBMAP Help Desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
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
