import React, { Component } from "react";
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import ErrorIcon from '@material-ui/icons/Error';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepButton from '@material-ui/core/StepButton';
import StepLabel from '@material-ui/core/StepLabel';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Slide from '@material-ui/core/Slide';
import Collapse from '@material-ui/core/Collapse';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Icon from '@material-ui/core/Icon';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WarningIcon from '@material-ui/icons/Warning';
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons'
import DescriptionIcon from '@material-ui/icons/Description';
import LinearProgress from '@material-ui/core/LinearProgress';
import * as prettyBytes from 'pretty-bytes';
import _ from 'lodash';
import { CSVReader, readString } from 'react-papaparse'
import {  parseErrorMessage } from "../../utils/string_helper";
import {ingest_api_bulk_entities_upload, 
        ingest_api_bulk_entities_register,
        ingest_api_users_groups} from '../../service/ingest_api';


class bulkSamples extends Component<{},any> {


  constructor(props) {
    super(props);
    this.state = {
      alertStatus:"danger",
      bulkLength:0,
      activeStep:0,
      loading:false,
      steps:['Upload Your File', 'Review Validation', 'Register', 'Complete'],
      currentDateTime: Date().toLocaleString(),
      headers : [
        "Source Id",
        "Lab Id",
        "Sample Type",
        "Organ Type",
        "Sample Protocol",
        "Description",
        "Rui Location"
      ],
      error_message_detail: "",
      response_status: "",
      error_message: "",
      error_status:false,
      errorSet:[],
      success_status:false,
      success_message:"",
      validation:true,
      validated:[],
      showTable:false,
      tsvFile:"",
      uploadTimer:"",
      uploadedSources:[],
      finalTableReady:false,
      complete: false
    };
    

  }


  componentDidMount() {
    // If we just return from the group getting function and set state here,
    // State setting tries to happen before the groupset data can populate
    // var groupSet = this.getUserGroups();
    // this.setState({ 
    //   groups: groupSet.groups,
    //   inputValue_group_uuid: groupSet.inputValue_group_uuid
    // });

    console.debug("BULK MOUNTED");

    var userGroups = this.getUserGroups();
    console.debug("componentDidMount");
    console.debug("groups", userGroups); // Grabbing them on mount to populate in the state
    console.debug(this.state);
    console.debug(this.props);
    console.debug(this.props.bulkType);
    // var fileUpload = React.findDOMNode('input');
  }


  getUserGroups(){
    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).nexus_token+"").then((results) => {
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

  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  handleOnError = (err, file, inputElem, reason) => {
    console.log(err)
  }

  handleErrorCompiling = (data) =>{
    var errors = [];
    // console.debug("handleErrorCompiling",data, data.length);
    for (const [key, value] of Object.entries(data)) {
      // console.log(`${key}: ${value}`);
      var errRow = {};
      var cleanString = value.replace("Row Number: ", "");
      var cleanNum = cleanString.substr(0, cleanString.indexOf('.')); 
      var cleanErr = cleanString.substring(cleanString.indexOf('.') + 1);
      console.debug(cleanErr);
      errRow.row = cleanNum;
      errRow.message = cleanErr;
      errors.push(errRow);
      // var cleanOth = cleanString.substr(2, cleanString.indexOf('.')); 
      console.debug("errRow",errRow);
    }
    console.debug("errors",errors);
    this.setState({
      errorSet: errors
    })    
  }


    
  handleNext = () => {
    console.debug("handleNext");
    var newStep = this.state.activeStep +1
    this.setState({
      activeStep: newStep
    })    
  };

  handleBack = () => {
    console.debug("handleBack");
    var newStep = this.state.activeStep -1
    this.setState({
      activeStep: newStep,
      error_status:false,
      success_status:false
    })
  };

  handleReset = () => {
    this.setState({
      activeStep: 0
    })
  };


  handleGroupSelect = (evt) => {
    this.setState({
      group_uuid: evt.target.value
    });
  }

handleFileGrab = e => {
  if (e.target.files && e.target.files.length > 0) {
    this.setState({
      tsvFile: e.target.files[0]
    }, () => {   
      console.debug("onFileChange",this.state.tsvFile);
      console.debug(this.state.tsvFile);
      console.debug(this.state.tsvFile.name, this.state.tsvFile.size );
      this.handleNext();
    });
  }else{
    console.debug("No Data??");
  }
  
};
    

handleUpload= () =>{
  this.setState({
    loading:true,
    uploadTimer:"00:00"
  });
  if(!this.state.group_uuid || this.state.group_uuid.length <=0){
    console.debug("Using Default Group: ",this.state.groups[0].uuid);
    this.setState({
      // Grab the first one on in the select if they havent manually changed it
      group_uuid:this.state.groups[0].uuid,
    });
  }
  if( localStorage.getItem("info") !== null ){
    console.debug("this.state.tsvFile", this.state.tsvFile);
    const formData = new FormData()
    formData.append("file", this.state.tsvFile)
    console.debug("Appended Form Data: ",formData, this.state.tsvFile);
    ingest_api_bulk_entities_upload(this.props.bulkType, this.state.tsvFile, JSON.parse(localStorage.getItem("info")).nexus_token)
      .then((resp) => {
        console.debug("RESP", resp,resp.results.temp_id);
        if (resp.status === 201) {
          this.setState({
            success_status:true,
            success_message:this.props.bulkType+"Uploaded Successfully",
            loading:false,
            bulkFileID:resp.results.temp_id
          });
          this.parseUpload(); // Table of file contents builds here
          this.handleNext();
        } else {
          console.debug("ERROR", resp);
          // Let's not Hijack the Parsed Error content
          // using the Parsed naming for what papaparse handles, so,
          //  Process Error maybe?
          // and bundle up the errors here in their own data table
          var parsedError;
          if(resp.results.data){
            parsedError = parseErrorMessage(resp.results.data);
          }else{
            parsedError=resp;
          }
          console.debug("parsedError",parsedError);
          this.handleErrorCompiling(parsedError); // Error Array's set in that not here
          this.setState({ 
            error_status: true, 
            submit_error: true, 
            submitting: false
          });
          console.debug("DEBUG",this.state.error_message_detail);
          this.setState({
            loading:false,
          }, () => {   
            // this.handleNext();
          });
        } 
      })
      .catch((error) => {
        this.setState({ 
          submit_error:error,
          error_status:true,
          error_message_detail: parseErrorMessage(error),
          error_message:"Error" });
        console.debug("SUBMIT error", error)
        this.setState({
          loading:false,
        });
      });
  }else{
    this.setState({ 
      submit_error:"TokenExpired",
      error_status:true,
      error_message_detail:"Please log in again",
      error_message:"Token Expired" });
    console.debug("SUBMIT error", "Login Expired")
    this.setState({
      loading:false,
    });
  }
}


handleRegister = () =>{
  this.setState({
    loading:true,
    uploadTimer:"00:00"
  });
  if( localStorage.getItem("info") !== null ){
    console.debug("this.state.bulkFileID", this.state.bulkFileID);    
    var fileData ={
      "temp_id":this.state.bulkFileID,
      "group_uuid":this.state.group_uuid
    }
    ingest_api_bulk_entities_register(this.props.bulkType, fileData, JSON.parse(localStorage.getItem("info")).nexus_token)
      .then((resp) => {
        console.debug("handleRegister RESP", resp);
        if (resp.status === 201) {

          //There's a chance our data may pass the Entity validation, but not the Subsequent pre-insert Valudation
          // We might back back a 201 with an array of errors encountered. Let's check for that!  
          
          console.debug("results",resp);
          if(resp.results){
            var respData = resp.results.data;
            console.debug("respData",respData);
            let respInfo = _.map(respData, (value, prop) => {
              return { "prop": prop, "value": value };
            });
            if( respInfo[1].value['error']){
             console.debug("EERRRS DETECTED");
            }else{
              this.setState({
                success_status:true,
                alertStatus:"success",
                success_message:this.props.bulkType+" Registered Successfully",
                loading:false,
                uploadedBulkFile:resp.data,
                complete: true
                }, () => {   
                  // this.handleNext();
                });
            }
           
          }

          
        } else {
          console.debug("ERROR", resp);
          this.setState({ 
            error_status: true, 
            submit_error: true, 
            submitting: false, 
            loading:false,
            response_status:resp});
          console.debug("DEBUG",this.state.error_message_detail);
          // this.setState({
          // }, () => {   
          //   // this.handleNext();
          // });
        } 
      })
      .catch((error) => {
        this.setState({ 
          submit_error:error,
          error_status:true,
          error_message_detail: parseErrorMessage(error),
          error_message:"Error" });
        console.debug("SUBMIT error", error)
        this.setState({
          loading:false,
        });
      });
  }
}


parseUpload = () =>{
  console.debug("parseUpload FILE", this.state.tsvFile);
  var config = {
    header: true,
    skipEmptyLines: true,
    complete: this.parseResults,
  }
  var parsedData = readString(this.state.tsvFile,config);
}
parseResults = (results) =>{
  console.debug("results",results.data);
  this.setState({
    uploadedSources:results.data,
    finalTableReady:true
  });
}

resetSteps(){
  // setActiveStep(step);
  // Rather than send to step 1, let's refresh like the auth does,
  // so we can make sure we got a clean n clear state
  window.location.reload();
}

renderGroupSelect(){
  //Select the data provider group that this data belongs to
  return (
    <div className="col3">
      <p> Select the data provider group that this data belongs to </p>
      <select
          name="Submission_Group"
          id="Submission_Group"
          label="Group"
          onChange={this.handleGroupSelect}
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


getStepContent = (step) =>{
  switch (step) {
    case 0:
      return this.renderFileGrabber();
    case 1:
      return this.renderUploadSlide();
    case 2:
        return this.renderRegisterSlide();
    default:
      return 'Unknown step';
  }
}


showUploadedStuff(){
  this.setState({
    showTable:true
  })
}




renderFileGrabber = () =>{
    return (
      <div> 
      <label>
        <input
          accept=".tsv"
          type="file"
          id="FileUploader"
          name="file"
          onChange={this.handleFileGrab}
        />
      </label>
      </div>
    );
  }

  makeRegistered = () =>{
    this.setState({
      validation:true
    })
  }

  renderUploadSlide = () =>{
    return(
      <div className="row"> 
        <div className="col-8">
          {this.state.error_status && !this.state.loading &&(
            <div>
              {this.renderInvalidTable()}
            </div>
          )}
          {this.state.error_status === false&&(
            <div className="text-left">
              <h4> <DescriptionIcon style={{ fontSize: 40 }}  /> {this.state.tsvFile.name} <small><em>({prettyBytes(this.state.tsvFile.size)})</em></small></h4>
              {this.renderGroupSelect()}
            </div>
          )}

        </div>
        <div className="col-4">
          {!this.state.loading &&(
            <div>

              {this.renderLoadingSpinner(false)}
                {this.state.error_status === false &&(
                  <Button 
                    onClick={() => this.handleUpload()}
                    className="btn-lg btn-block m-0 align-self-end"
                    style={{ padding: "12px" }} 
                    variant="contained" 
                    color="primary" >
                    Upload
                  </Button>
                )}
                {this.state.error_status === true&&(
                  <div className="text-left">
                    There were some problems validating your document. Please review &amp; resubmit.
                    <Button 
                      onClick={() => this.handleBack()}
                      className="btn-lg btn-block m-0 align-self-end"
                      style={{ padding: "12px" }} 
                      variant="contained" 
                      color="primary" >
                      Back
                    </Button>
                  </div>
                )}
            </div>
          )}
          {this.state.loading === true &&(
              <div>
                {this.renderLoadingSpinner(true)}
                <Typography> Process may take a few minutes. Do not leave or refresh this page. </Typography>
                <Typography> <small><em> (Elapsed Time:{this.state.uploadTimer})</em></small> </Typography>
              </div>
          )}
        </div>
      </div>
    )
  }


  renderRegisterSlide = () =>{
    return(
      <div className="row"> 
        <div className="col-8">
          {this.state.finalTableReady ===  true &&(
            <div>
              {this.renderFinalTable()}
            </div>
          )}
          {this.state.finalTableReady ===  false &&(
            <div className='text-center'>
              <FontAwesomeIcon icon={faSpinner} spin size='6x' />
            </div>
              
          )}
            

        </div>
        <div className="col-4">

          {!this.state.loading && this.state.complete === false && (

            <div>
            {this.renderLoadingSpinner(false)}

              <Typography>File successfully Uploaded</Typography>
              <Button 
                onClick={() => this.handleRegister()}
                className="btn-lg btn-block m-0 align-self-end"
                style={{ padding: "12px" }} 
                variant="contained" 
                color="primary" >
                Register
              </Button>
            </div>
          )}

          {!this.state.loading && this.state.complete === true &&(
            <div>
            {this.renderLoadingSpinner(false)}
              <Typography>Data Submitted!</Typography>
              <Button 
                onClick={() => this.handleReset()}
                className="btn-lg btn-block m-0 align-self-end"
                style={{ padding: "12px" }} 
                variant="contained" 
                color="primary" >
                Upload More
              </Button>
            </div>
          )}


          {this.state.loading === true &&(
            <div>
              {this.renderLoadingSpinner(true)}
              <Typography> Process may take a few minutes. Do not leave or refresh this page. </Typography>
              <Typography> <small><em> (Elapsed Time:{this.state.uploadTimer})</em></small> </Typography>
            </div>
          )}
        </div>
      </div>
    )
  }

  renderFinalStep = () =>{
    return(
      <div className="row"> final
        {!this.state.loading &&(  
          <div className="col-9">
            {this.renderFinalTable()} 
          </div>
        )}
        <div className="col-3">
          {this.renderResponsePane()}              
        </div>
      </div>
    ) 
  }

 
  renderFinalTable = () =>{
    var headCells = [];
    if(this.state.uploadedSources.length >=0){
      headCells = [
        { id: 'source_id', disablePadding: true, label: 'Source Id ', width:"" },
        { id: 'lab_id', disablePadding: false, label: 'Lab Id ', width:"%" },
        { id: 'validation', disablePadding: false, label: 'Status ', width:"7%" },
      ];
    }else{
      headCells = [
        { id: 'error_', disablePadding: true, label: 'Error ', width:"" },
      ];
    }
    return(
      <TableContainer 
        component={Paper} 
        style={{ maxHeight: 450 }}
        >
      <Table 
        aria-label={"Uploaded "+this.props.bulkType }
        size="small"
        stickyHeader 
        className={"table table-striped table-hover mb-0 uploadedTable uploadedStuff-"+this.state.validation}>
        <TableHead 
          className="thead-dark font-size-sm"
        >
          <TableRow >
        {headCells.map((headCell, index) => (
            <TableCell 
            component="th"
            variant="head"
            width={headCell.width}
            style={{ }}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            key={(headCell.id+""+index)}>
              {headCell.label}
            </TableCell>
            ))}
          </TableRow>
        </TableHead>
          <TableBody>
            {this.state.uploadedSources.map((row, index) => (
              <TableRow 
                key={(row.source_id+""+index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                className={"tsvData pl-0 valid-"+row.validation}
                >
                <TableCell  className="" scope="row"> 
                  {row.source_id} 
                </TableCell>
                <TableCell  className="" scope="row">
                  {row.lab_id}
                </TableCell>
                <TableCell  className="" scope="row">{row.validation === true ?  <CheckCircleIcon className="valid"  /> : <CheckCircleIcon className="valid"  />}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ) 
  }




  renderInvalidTable = () =>{
    var headCells = [
      { id: 'error_' },
    ];
    return(
            <TableContainer 
              component={Paper} 
              style={{ maxHeight: 450 }}
              >
            <Table 
              aria-label={"Uploaded Errors"+this.props.bulkType }
              size="small"
              stickyHeader 
              className="table table-striped table-hover mb-0 uploadedTable ">
              <TableHead  className="thead-dark font-size-sm">
                <TableRow >
                  <TableCell  component="th" variant="head" width="7%">Row</TableCell>
                  <TableCell  component="th" variant="head">Error</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {this.state.errorSet.map((item, index) => (
                  <TableRow  key={("rowitem_"+index)} >
                    <TableCell  className="" scope="row"> 
                      {item.row}
                    </TableCell>
                    <TableCell  className="" scope="row"> 
                      {item.message}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        
    ) 
  }

  renderInvalidMark = (err) =>{
    return(
      // <span>{err}</span>
      <Tooltip title={"Error:"+err} aria-label="error message">
        <ErrorIcon className="invalid" />
      </Tooltip>
    );
  }


  renderTrimDescription = (desc) =>{
      var description = desc;
    //Thisll auto-trim descriptions & place their full content in a tooltip
    if(desc.length >= 22 ){
      return(
        <Tooltip title={desc} aria-label="Full Description">
          <span>{description}</span>
        </Tooltip>
      );
    }else{
      return( <span>{description}</span> );
    }
    
  }
  

  renderLoadingSpinner(spin) {
    //@TODO: Duped for the sake of getting it done, 
    // Dryer & Easier if we just make the val passed Spin or Hide
    // IF react/material UI can handle dynamically loading a one-word 
    if (this.state.loading) {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
        </div>
      );
    }
    if (!this.state.loading && !spin) {
      if(this.state.error_status){
        return(
          <div className='text-center'>
            <FontAwesomeIcon  icon={faExclamationTriangle} size="6x" />
          </div>
        );
      }else{
        return (
          <div className='text-center'>
            <FontAwesomeIcon icon={faSpinner} className="invisible" size='6x' />
          </div>
        );
      }
      
    }
  }

  renderLoadingBar = () => {
    if( this.state.loading  ){
      return (
        <div className="row mb-2">
          <div className="col-12">
            <LinearProgress />
          </div>
        </div>
        )
    }
  }
  renderResponsePane = () =>{
      return(
          <div className={"alert col-sm-12 text-left alert-"+this.state.alertStatus} role="alert" >
            {this.state.error_message &&(
              <div>
                <h6>{this.state.error_message_detail}</h6>
                {this.state.error_message_detail}
              </div>
            )}
            {!this.state.error_message &&(
              <div>
                <h6>{this.state.success_message}</h6>
                <Button 
                  onClick={() => this.resetSteps()}
                  className="btn-lg btn-block m-0 align-self-end"
                  style={{ padding: "12px" }} 
                  variant="contained" 
                  color="primary" >
                  Restart
                </Button>
              </div>
            )}
          </div>
      );
  }
  
  



  renderStepper = () =>{
    return (
      <div className="">
        <Stepper activeStep={this.state.activeStep}>
          {this.state.steps.map((label, index) => {
            const stepProps = {};
            const labelProps = {};
            return (
              <Step key={label} {...stepProps}>
                <StepLabel {...labelProps}>{label}</StepLabel>
              </Step>
            );
          })}
        </Stepper>
        <div className="text-center mt-3" id="stepContainer">{this.getStepContent(this.state.activeStep)}</div>
      </div>
    );
  }
  

  render = () =>{
    return (
      <Paper>
        <div className="col-sm-12 pads">
          <div className="col-sm-12 text-left"><h4>{this.props.bulkType} Information Upload</h4></div>
          <div className="px-3 my-2">
          Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book
          {this.renderStepper()}
          </div>

        </div>
      </Paper>
    );
  }
}

export default bulkSamples;
