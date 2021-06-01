import React, { Component } from "react";
import { ingest_api_users_groups } from '../../service/ingest_api';
import axios from "axios";
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent';
import Box from '@material-ui/core/Box';

// import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
// import GroupSelector from '../uuid/selectGroup.jsx'
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import FormControl from '@material-ui/core/FormControl';

// function Alert(props: AlertProps) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class CreateUplods extends Component {
  constructor(props) {
    super(props);
    this.state = {
      creatingNewUploadFolder: true,
      currentDateTime: Date().toLocaleString(),
      groups:[],
      processingUpload:false,
      successfulUploadCreation:false,
      errorMessage:" "
    };

  }


  componentDidMount() {
    var tgl = this.getUserGroups();
    console.log(tgl);
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
      };


      axios
        .post(
          `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads`,
          JSON.stringify(data),
          config
        )
        .then(response => {
          if (response.status === 200) {
            console.debug(response.data);
            this.setState({ 
              submit_error: false, 
              submitting: false,
              successfulUploadCreation:true,
              processingUpload: false,
            });

            console.debug(this.props);
            this.props.onCreated({
              entity: response.data,
              uuid:"TESTUUID"
            });
            
          }else {
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
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
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

  renderTitleInput() {
    return (
      <div className='w-100'>
          <TextField 
            id="Submission_Name" 
            name="submissionName" 
            label="Title"
            type="text"
            value={this.state.inputValue_title} 
            onChange={this.updateInputValue}
            fullWidth={true}
            size="small"
            margin="dense"
            />
      </div>
    );
  }

  renderDesc() {
    return (
      <div className="">
          <TextField 
            id="Submission_Desc" 
            name="submissionDesc" 
            rows="4"  
            label="Description"
            value={this.state.inputValue_desc} 
            onChange={this.updateInputValue}
            helperText="Optional"
            fullWidth={true}
            margin="dense"
          />
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


  renderActionButtons() {
      return (
        <div className="submission-item row mb-1 mt-2">
          <div className="col-3" ></div>
          <div  className="col-9 m-0 p-0">
            <Button size="large" color="primary" onClick={() => this.handleCreateUploadFolder()} >Create</Button> 
            <Button size="large" variant="text" onClick={() => this.props.handleCancel()}> Cancel</Button>
          </div>
        </div>
      );
  }
  

  render() {
    return (
      <React.Fragment>
        {(this.state.creatingNewUploadFolder ) && (
        <Card >
          <CardHeader 
            className="newHeader"
            title="Creating"
            subheader="You're creating a new folder  "
          /> 
          <CardContent>

        {(this.state.processingUpload) && (
          this.renderLoadingSpinner()
        )}
        {(!this.state.processingUpload) && (
          <div id="SubmissionForm">
            <div className="row container-fluid">
            <div className="col-3 submission-column submission-cell" >
                <Box className="nextstep ">
                  <Typography variant="subtitle1" color="textSecondary"> What's Next? </Typography>
                  <p><small>This line of text is meant to be treated as fine print.</small></p>
                </Box>
            </div>
              <div className="col-9 submission-column submission-cell" >
                {(this.state.errorMessage.length>=2) && (
                  this.renderErrorMessage()
                )}
                {(this.state.successfulUploadCreation) && (
                  this.renderSuccessMessage()
                )}
                <FormControl className="newUploadForm">
                  <div className='submission-item  d-inline-block'>
                    {this.renderTitleInput()} 
                  </div>
                  <div className='submission-item  d-inline-block'>
                    {this.renderDesc()} 
                  </div>
                  {!this.state.groups.length <=1 && (
                    <div className='submission-item mt-2 d-inline-block' >
                      {this.renderGroupSelect()}
                    </div>
                  )}
                  </FormControl > 
                </div>
              </div>
              {this.renderActionButtons()}
            </div>
          )}


          </CardContent>
          </Card>
        )}
        </React.Fragment>
    );
  }
}

export default CreateUplods;
