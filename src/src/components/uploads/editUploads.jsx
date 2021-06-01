import React, { Component } from "react";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Icon from '@material-ui/core/Icon';
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import Box from '@material-ui/core/Box';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import { entity_api_get_entity } from '../../service/entity_api';

import FormControl from '@material-ui/core/FormControl';  
import { ingest_api_get_globus_url } from '../../service/ingest_api';
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


  // constructor(props) {
  //   super(props);
  //   // this.group = React.createRef();
    confirmModal
  // }

  getUpload = (uuid) =>{
    // console.log("START GET UPLOAD");
    entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      // console.log("GETUPLOAD");
      // console.log(uuid);
      // console.log(response);
      if (response.status === 200) {
        let entity_data = response.results;
        this.setState({
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
        });
        // this.fetchGlobusURL(entity_data.uuid)
        // this.fetchGlobusURL(entity_data.uuid);
        console.debug(this.state);

        // check to see if user can edit
        // ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        //   .then((resp) => {
        //     console.debug('ingest_api_allowable_edit_states done', resp)
        //   if (resp.status === 200) {
        //     let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
        //     this.setState({
        //       updateSuccess: null,
        //       show:true,
        //       editingEntity: entity_data,
        //       //editingDisplayId: display_id,
        //       readOnly: read_only_state,   // used for hidding UI components
        //       editForm: true,
        //       show_modal: true,
        //       show_search: false,
        //       new_entity: false
        //       });
        //       console.debug(this.state);
        //   }
        // });

      }
    });
  }


  showConfirmModal = () => {
    this.setState({ confirmModal: true });
    // console.debug(this.state)
  };

  hideConfirmModal = () => {
    this.setState({ confirmModal: false });
  };

  onCreated = data => {
    this.setState({
      entity: data.entity,
      result: data,
      formType: "----",
      createSuccess: true
    });
  };

  onSaved = data => {
    console.log("Data Saved: ");
    console.log(data);
  };

  handleClose = () => {
    console.debug('CLOSED');
  }


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
  
  
  componentDidMount() { 
      console.log("componentDidMount");
      console.log(this.props.targetUUID);
      this.getUpload(this.props.targetUUID);
  }

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
      this.getUpload(this.props.targetUUID);
    }
  }

  //ingest-api/uploads/<uuid>/validate
  //ingest-api/uploads/<uuid>/reorganize-into-datasets



  fetchGlobusURL = (uploads_uuid) => {  


    ingest_api_get_globus_url(uploads_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
      .then((resp) => {
        console.debug('ingest_api_get_globus_url', resp)
      if (resp.status === 200) {
        window.open(resp.results, "_blank");
      }
    });

  };


  validateUploadContent(){  
    return true;
    // this.setState({
    //   processingValidate: true
    // });

    // // let data = {
    // //   uuid:this.state.e_UUID 
    // // };

    // const config = {
    //   headers: {
    //     Authorization:
    //       "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
    //     "Content-Type": "multipart/form-data",
    //   },
    // };

    // axios
    //   .post(`${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/`+thisuuid+'/validate', config)
      
    //   .then(response => {
    //     if (response.status === 200) {
    //       console.debug(response.data);
    //       this.setState({ 
    //         submit_error: false, 
    //         submitting: false,
    //         successfulUploadCreation:true,
    //         processingUpload: false,
    //       });

    //       console.debug(this.props);
    //       this.props.onCreated({
    //         entity: response.data,
    //         uuid:"TESTUUID"
    //       });
          
    //     }else {
    //       this.setState({ 
    //         submit_error: true, 
    //         submitting: false ,
    //         processingUpload:false,
    //         errorMessage:response,
    //       });
    //       console.debug("NON 200: "+response.status);
    //       console.debug(response);
    //     }
    //   })
    //   .catch(error => {
    //     console.log("Uploads FOlder Created NOT OK!");
    //     var err ="";
    //     if(error.response){
    //       err = error.response.data.error;
    //       console.log(err);
    //     }else{
    //       err = error;
    //       console.log(error);
    //     }
    //     this.setState({ 
    //       submit_error: true, 
    //       submitting: false,
    //       errorMessage:err,
    //       processingUpload:false
    //     });
        
    //   });
};


  isFormValid() {
    let isValid = true;
    // if (!validateRequired(this.state.title)) {
    //   this.setState(prevState => ({
    //     formErrors: { ...prevState.formErrors, title: "required" }
    //   }));
    //   isValid = false;
    // } else {
    //   this.setState(prevState => ({
    //     formErrors: { ...prevState.formErrors, title: "" }
    //   }));
    // }

    return isValid;
  }

  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }


  cancelEdit = () => {
    this.setState({ creatingNewSubmission: false, editingSubmission: null });
    if (this.props.history) {
        this.props.history.goBack();
    }
  };


  getInitialState = () => {
    return {
      inputValue_title: ''
    };
  }

  updateInputValue = (evt) => {
    console.log(evt.target.id);
    if(evt.target.id==="Submission_Name"){
      this.setState({
        inputValue_title: evt.target.value
      });
    }else if(evt.target.id==="Submission_Desc"){
      this.setState({
        inputValue_desc: evt.target.value
      });
    }
    
  }


  getUploadUUID = () => {
    console.log("getUploadUUID "+this.state.newUpload );
    return this.state.newUpload;
  }

  
  renderLoadingSpinner() {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
        </div>
      );
    // }
  }


  renderStatusBadge (){
    // console.debug(this.state);
    let status = this.state.e_status.toUpperCase();
    // let status = this.state.e_status.toUpperCase();
    let badge_class = "";
    // let btn_text = dataset.writeable ? "Edit" : "View";
    switch (status) {
      case "NEW":
        badge_class = "badge-purple";
        break;
      case "INVALID":
        badge_class = "badge-warning";
        break;
      case "ERROR":
        badge_class = "badge-red";
        break;
      case "VALID":
        badge_class = "badge-primary";
        break;
      case "PUBLISHED":
        badge_class = "badge-default";
        break;
      default:
        break;
    }    
    return (
      <span className={"badge " + badge_class +" upload-status"}>
        <Typography className="status-text" >{status}</Typography>
      </span>
    )
  }

  renderTitleInput() {
      return (
        <div>
            <TextField 
              id="Submission_Name" 
              name="submissionName" 
              label="Title"
              type="text"
              value={this.state.e_title} 
              onChange={this.updateInputValue}
              size="small"
              margin="dense"
              />
        </div>
      );
    // }
  }


  renderCreatedDate() {
      let date = new Date(this.state.e_created);
      // console.log("renderCreatedDate");
      // console.log(date);
      // console.log(this.state.e_created);
      var formatted = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      return formatted;
  }

  handleEditContentDialog = () => {
    this.setState({ 
      open_edit_content_dialog: true 
    });
  }

  handleEditCotentClose = () => {
    this.setState({ 
      open_edit_content_dialog: false 
    });
  }

  handleUpdate(){
    return "OK"
  }

  // renderConfirmModal(){
  //   return(
      
  //   )
  // }


  // renderConfirmButtons() {
  //     return (
  //       <div className="submission-item row mb-1">
  //         <div className="col-3" ></div>
  //         <div  className="col-9 m-0 p-0">
  //           <Button size="large" color="primary" onClick={() => } >Yes</Button> 
  //           <Button size="large" onClick={() => this.hideConfirmModal()}> Cancel</Button>
  //         </div>
  //       </div>
  //     );
  // }

  renderActionButtons() {
      return (
        <div className="submission-item row mb-1">
          <div className="col-3" ></div>
          <div  className="col-9 m-0 p-0">
            <Button size="large" color="primary" onClick={() => this.showConfirmModal()} >Validate</Button> 
            <Button size="large" onClick={() => this.handleCancel()}> Cancel</Button>
          </div>
        </div>
      );
  }
  
  renderValidateDialog() {
      return (
        <div>FNORD</div>
        );
  }
  
  
  renderEditInputForm = (e) => {
      return (
        <div className='w-100'>
          <FormControl className="newUploadForm">
           <TextField 
            id="field" 
            name="submissionName" 
            label="Title"
            type="text"
            value={this.state.inputValue_title} 
            onChange={this.updateInputValue}
            fullWidth={true}
            size="small"
            margin="dense"
            />
  </FormControl>
      </div>
      );
  }
  
  
  handleEditContentDialog = (e) => {
      return (
        <div className='w-100'>
          <FormControl className="newUploadForm"> EDITME
           <TextField 
            id="field" 
            name="submissionName" 
            label="Title"
            type="text"
            value={this.state.inputValue_title} 
            onChange={this.updateInputValue}
            fullWidth={true}
            size="small"
            margin="dense"
            />
  </FormControl>
      </div>
      );
  }
  

  
    // dev int
  render() {
    return (
      <React.Fragment>
        <Dialog 
          onClose={this.handleEditClose} 
          open={this.state.open_edit_content_dialog} >
            <DialogTitle id="simple-dialog-title">Editing </DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
              {this.renderEditInputForm}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.validateUploadContent} color="primary">
                Update
              </Button>
              <Button onClick={this.hideConfirmModal} color="primary" autoFocus>
                Cancle
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog 
            open={this.state.confirmModal} 
            onClose={this.hideConfirmModal} >
          <DialogTitle id="simple-dialog-title">Run the validation?</DialogTitle>
            <DialogContent>
              <DialogContentText id="alert-dialog-description">
              Has all data been uploaded to the Globus directory?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={this.validateUploadContent} color="primary">
                Yes
              </Button>
              <Button onClick={this.hideConfirmModal} color="primary" autoFocus>
                Cancle
              </Button>
            </DialogActions>
        </Dialog>

        {(this.state.creatingNewUploadFolder ) && (

        <Card>
        CARD
        <CardContent>
          <div id="SubmissionForm">
          <div className="row container-fluid mb-3">
            <div className="col-12">


            <Typography variant="h4" className="d-inline-block"> 
              {this.state.e_title} 
            </Typography> 

            <Button 
                onClick={this.handleEditContentDialog}
                > 
              <Icon className="mr-1">
                  edit_icon_two_tone
                </Icon> 
            </Button>
          

            {this.renderStatusBadge()} 


            <Typography variant="caption" color="textSecondary" className="w-100 d-block"> Created {this.renderCreatedDate()} </Typography>
          </div>
          </div>

          <div className="row container-fluid">


            <div className="col-3 submission-column submission-cell" >

              <Box className="nextstep ">
                Author: <Typography color="textSecondary"> {this.state.e_author} </Typography><br />
                Group: <Typography color="textSecondary"> {this.state.e_group} </Typography><br />
                Globus: <Typography color="textSecondary"> {this.state.e_GURL} </Typography><br />
              </Box>


            </div>


            <div className="col-9 submission-column submission-cell" >

            <div>
              Description: <Typography color="textSecondary"> {this.state.e_desc} </Typography><br />
            </div>

              Data Sets: 
            </div>

          </div>
          </div>

          {this.renderActionButtons()}
          </CardContent>
        </Card>
        )}
      </React.Fragment>
    );
  }
}

export default EditUploads;
