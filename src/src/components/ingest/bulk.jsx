import {Component} from "react";
import Paper from '@material-ui/core/Paper';
import Button from '@mui/material/Button';
import DownloadIcon from '@mui/icons-material/Download';
import ErrorIcon from '@material-ui/icons/Error';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';
import Typography from '@material-ui/core/Typography';
import Tooltip from '@material-ui/core/Tooltip';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
  faSpinner,faExclamationTriangle,faFileDownload
} from "@fortawesome/free-solid-svg-icons";
import DescriptionIcon from '@material-ui/icons/Description';
import LinearProgress from '@material-ui/core/LinearProgress';
import * as prettyBytes from 'pretty-bytes';
import _ from 'lodash';
import {parseErrorMessage,toTitleCase} from "../../utils/string_helper";
import {readString} from 'react-papaparse';
import {CSVLink} from "react-csv";

import {
  ingest_api_bulk_entities_upload,
  ingest_api_bulk_entities_register,
  ingest_api_users_groups
} from '../../service/ingest_api';
import {Box} from "@mui/system";
import {Link} from "@material-ui/core";


class bulkCreation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      alertStatus:    "danger",
      bulkLength:     0,
      activeStep:     0,
      loading:        false,
      steps:          ['Upload Your File', 'Review Validation', 'Register', 'Complete'],
      currentDateTime:Date().toLocaleString(),
      headers:        [
        "Source Id",
        "Lab Id",
        "Sample Type",
        "Organ Type",
        "Sample Protocol",
        "Description",
        "Rui Location"
      ],
      error_message_detail:  "",
      response_status:       "",
      error_status:          false,
      mixed_status:          false,
      error_message:         "",
      error_message_extended:"",
      errorSet:              [],
      rowLimitClass:         "",
      success_status:        false,
      success_message:       "",
      validation:            true,
      validated:             [],
      showTable:             false,
      tsvFile:               "",
      registeredStatus:      false,
      uploadTimer:           "",
      uploadedSources:       [],
      finalTableReady:       false,
      complete:              false
    };
  
    
  }


  componentDidMount() {
    // If we just return from the group getting function and set state here,
    // State setting tries to happen before the groupset data can populate
    console.debug("BULK MOUNTED");
    var userGroups = this.getUserGroups();
  }


  getUserGroups(){
    var GT = localStorage.getItem("info");
    console.debug("GT", GT);

    ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token+"").then((results) => {
      if (results.status === 200) { 
      const groups = results.results.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        // return groups;
        this.setState({groups:               groups,
          inputValue_group_uuid:groups[0].uuid});
        
      } else if (results.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }else{
          this.setState({ groups:["NA"] });
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
    //  If the error regards the first / fundamental structure of file,
    //  it'll come back like this
    var coreError;
    if (data.error && data.error.response && data.error.response.data) {
      coreError = data.error.response.data.data;
    }else if(data.data){
      coreError = data.data;
    }else{
      coreError = data;
    }
    if(coreError){
      for (var [key, value] of Object.entries(coreError)) {
        if(value.error){
          value=value.error;
        }
        console.log("ROW __________________",`${key}: ${value}`);
        var parsedVal = value.toString();   
        var errRow = {};

        if(parsedVal.includes("Row Number")){
          var cleanString = parsedVal.replace("Row Number: ", "");
          var cleanNum = cleanString.substr(0, cleanString.indexOf('.')); 
          errRow.row = cleanNum;
          var errStr = parsedVal.slice(parsedVal.indexOf('.') + 1);
          errRow.message = errStr;
          errors.push(errRow);
        }else{
          errRow.row = "N/A";
          errRow.message = value;
          errors.push(errRow);
        }
      }
    }
      console.debug("errors",errors);
      this.setState({errorSet:errors})    
    }


    
  handleNext = () => {
    var newStep = this.state.activeStep +1
    this.setState({activeStep:newStep})    
  };

  handleBack = () => {
    var newStep = this.state.activeStep -1
    this.setState({
      activeStep:    newStep,
      error_status:  false,
      success_status:false
    })
  };

  handleReset = () => {
    window.location.reload();
  };


  handleGroupSelect = (evt) => {
    this.setState({group_uuid:evt.target.value});
  }


  handleFileMake = e => {
    var headers = [];
    // ["hubmap_id", "lab_tissue_sample_id","entity_type","sample_category","protocol_url","description"]
    if(this.props.bulkType.toLowerCase() === "samples"){
      headers=["hubmap_id","lab_tissue_sample_id","sample_category","organ_type","protocol_url","description"]
    }else if(this.props.bulkType.toLowerCase() === "donors"){
      headers=["hubmap_id","label","lab_donor_id","protocol_url","description"]
    }
    
    return (
      <CSVLink 
        style={{float:  "right",
          padding:"12px",}}
        headers={headers}
        data={this.state.uploadedSources}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}>
           Download These Results
        </Button>       
      </CSVLink>
    );
  };

handleFileGrab = e => {
  var grabbedFile = e.target.files[0];
  var newName = grabbedFile.name.replace(/ /g, '_')
  var newFile =  new File([grabbedFile], newName);
  if (newFile && newFile.name.length > 0) {
    this.setState({tsvFile:newFile}, () => {   
      this.handleNext();
    });
  }else{
    console.debug("No Data??");
  }
};

handleUpload= () =>{
  this.setState({loading:    true,
    uploadTimer:"00:00"});
  if(!this.state.group_uuid || this.state.group_uuid.length <=0){
    this.setState({
      // Grab the first one on in the select if they havent manually changed it
      group_uuid:this.state.groups[0].uuid,});
  }
  if( localStorage.getItem("info") !== null ){
    const formData = new FormData()
    formData.append("file", this.state.tsvFile)    
    ingest_api_bulk_entities_upload(this.props.bulkType, this.state.tsvFile, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((resp) => {
        if(resp.results && resp.results.temp_id){
        }
        if (resp.status === 201) {
          this.setState({
            success_status: true,
            success_message:this.props.bulkType+"Uploaded Successfully",
            loading:        false,
            bulkFileID:     resp.results.temp_id
          });
          this.parseUpload(); // Table of file contents builds here
          this.handleNext();
        } else {
          // Let's not Hijack the Parsed Error content
          // using the Parsed naming for what papaparse handles, so,
          //  Process Error maybe?
          // and bundle up the errors here in their own data table
          var parsedError;
          if(resp.results && resp.results.data){
            parsedError = parseErrorMessage(resp.results.data);
          }else{
            parsedError=resp;
          }
          this.handleErrorCompiling(parsedError); // Error Array's set in that not here
          this.setState({ 
            error_status:true, 
            submit_error:true, 
            submitting:  false
          });
          this.setState({loading:false,}, () => {   
          });
        } 
      })
      .catch((error) => {
        console.debug("handleUpload ERROR", error);
        this.setState({ 
          submit_error:        error,
          error_status:        true,
          error_message_detail:parseErrorMessage(error),
          error_message:       "Error" 
        });
        console.debug("SUBMIT error", error)
        this.setState({loading:false,});
      });
  }else{
    this.setState({ 
      submit_error:        "TokenExpired",
      error_status:        true,
      error_message_detail:"Please log in again",
      error_message:       "Token Expired" 
    });
    console.debug("SUBMIT error", "Login Expired")
    this.setState({loading:false,});
  }
}


handleRegister = () =>{
  this.setState({loading:    true,
    uploadTimer:"00:00"});
  if( localStorage.getItem("info") !== null ){
    var fileData ={"temp_id":this.state.bulkFileID,"group_uuid":this.state.group_uuid}
    try{
      ingest_api_bulk_entities_register(this.props.bulkType, fileData, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((resp) => {
       var serverResp;
        if(resp.response ){
          serverResp = resp.response
        }else if(resp.error && resp.error.response){
          serverResp = resp.error.response
        }else{
          serverResp = resp;
        }
        //There's a chance our data may pass the Entity validation, but not the Subsequent pre-insert Valudation
        // We might back back a 201 with an array of errors encountered. Let's check for that!  
        if(resp.status && resp.status === 201 && resp.results){
          var respData = resp.results.data;
          console.debug("respData",respData);
          var dataRows = [];
          for (var [key, value] of Object.entries(respData)) {
            console.debug("value",value);
            dataRows.push(value);
          }
          let respInfo = _.map(respData, (value, prop) => {
            return { "prop":prop, "value":value };
          });
          this.setState({
            error_status:        false,
            loading:             false,
            uploadedSources:     dataRows,
            complete:            true,
            registeredStatus:    true
            }, () => {   
              console.debug("%c⊙Shoukd be good to map?: ", "color:#00ff7b", respInfo);
              // this.handleErrorCompiling(grabFullError);
          });
        }else if( 
          (resp.response && resp.response.status && resp.response.status === 504) || 
          (resp.error  && resp.error.response  && resp.error.response.status === 504) ){
          console.debug('%c⊙504', 'color:#ff005d' );
          this.parseRegErrorFrame(resp);
        }else if(
          (resp.response && resp.response.status && resp.response.status === 500) || 
          (resp.error  && resp.error.response && resp.error.response.status === 500)){
          console.debug('%c⊙500', 'color:#ff005d' );
          var grabFullError = {status:serverResp.data.status,data:serverResp.data.data}
          this.setState({
            error_status:        true,
            alertStatus:         "error",
            error_message:       "Regsitsration Faiure",
            error_message_detail:grabFullError.status,
            loading:             false,
            uploadedSources:     grabFullError.data,
            complete:            false,
            registeredStatus:    false
            }, () => {   
              this.handleErrorCompiling(grabFullError);
            });
        } else if (resp.results && resp.results.data && resp.status === 207) { // Partial Success
          console.debug('%c⊙207', 'color:#f4d006' );
          var mixedResponseArray = Object.values(resp.results.data)
          var errRows = mixedResponseArray.filter(row => {
            return row.error
          })
          var successRows = mixedResponseArray.filter(row => {
            return !row.error;
          })
          this.setState({
            mixed_status:    true,
            alertStatus:     "mixed",
            mixed_message:   "Partial Regsitsration Success",
            loading:         false,
            uploadedSources: successRows,
            errorSet: errRows,
            complete:        true,
            registeredStatus:true
            }, () => {   
            });
        } else {
          this.props.reportError(resp);
        } 
        
      })
      .catch((error) => {
        console.debug( error.stack );
        this.setState({ 
          submit_error:        error,
          error_status:        true,
          error_message_detail:parseErrorMessage(error),
          loading:             false,
          error_message:       "Error" 
          });
      });       
    }catch(error){
      this.setState({ 
        submit_error:        error,
        error_status:        true,
        error_message_detail:parseErrorMessage(error),
        error_message:       "Error" 
      });
      console.debug("SUBMIT error", error)
      this.setState({loading:false,});
    }

  }
}


parseRegErrorFrame = (errResp) => {
  var parsedError;
  
  if(errResp.results && errResp.results.data && errResp.results.data.data){
    parsedError = parseErrorMessage(errResp.results.data.data);
  }else if(errResp.results && errResp.results.data){
    parsedError = parseErrorMessage(errResp.results.data);
  }else if(errResp.results && errResp.results.data){
    parsedError = parseErrorMessage(errResp.results.data);
  }else if(errResp.status && errResp.data){
    parsedError = parseErrorMessage(errResp.data);
  }else{
    let regErrorSet ={}
    if(errResp.err && errResp.err.response.data){
      regErrorSet = errResp.err.response.data 
    }else if(errResp.error && errResp.error.response.data){
      regErrorSet = errResp.error.response.data 
    }else if(errResp.data){
      regErrorSet = errResp 
    }else{
      regErrorSet = errResp
    }
    // var errRows = regErrorSet.data;
    var errRows = regErrorSet.map(g => {
      return g.message
    })
    var errMessage = regErrorSet.status;
    parsedError=errResp;
  }

  this.handleErrorCompiling(parsedError); // Error Array's set in that not here
  this.setState({ 
    error_status:   true, 
    submit_error:   true, 
    error_message:  errMessage,
    success_message:null,
    submitting:     false,
    response_status:errResp.Error
  });
  console.debug("DEBUG",this.state.error_message_detail);
  this.setState({loading:false,}, () => {   
  });
}


parseUpload = () =>{
  var config = {
    header:        true,
    skipEmptyLines:true,
    complete:      this.parseResults,
  }
  var parsedData = readString(this.state.tsvFile,config);
  this.setState({parsedData:parsedData});
}
parseResults = (results) =>{
  console.debug("results",results.data);

  // We should check early on that there's less than 40 rows
  var rowCount = results.data.length;
  var expectedSplit =  Math.ceil(rowCount/40);
  console.debug("rowCount",rowCount );
  if(rowCount>40){
    this.setState({
      rowLimitClass:         "rowLimitError", 
      submit_error:          "Row Limit Exceeded",
      loading:               false,
      error_status:          true,
      error_message_detail:  "Row Limit Exceeded",
      error_message:         "40 row limit exceeded (total rows:"+rowCount+"). Please split your data across multiple files (est "+expectedSplit+" files)" ,
      error_message_extended:"40 row limit exceeded (total rows:"+rowCount+"). Please split your data across multiple files (est "+expectedSplit+" files) " 
    });
  }else{
    this.setState({uploadedSources:results.data,
      finalTableReady:true});
  }
}

resetSteps(){
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
  this.setState({showTable:true})
}

renderStatusButon = (message) =>{
  if(!this.state.loading){
    return(message);
  }else{
    return(
      <FontAwesomeIcon
        icon={faSpinner}
        className="m-1"
        spin
      /> 
    );
  }
}
renderErrorNuance = () =>{
  if(this.state.mixed_status){
    return(<strong className="text-dange">Some</strong>);
  }
}



renderFileGrabber = () =>{
    return (
      <div className="text-center"> 
      <label>
        <input
          accept=".tsv, .csv"
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
    this.setState({validation:true})
  }

  renderUploadSlide = () =>{
    return(
      <div className="d-flex upload-slide-results flex-row justify-content-center"> 
        
        {this.state.error_status === false&&(
          <div className="">
            <div className="text-left">
              <h4> <DescriptionIcon style={{ fontSize:"4em" }}  /> {this.state.tsvFile.name} <small><em>({prettyBytes(this.state.tsvFile.size)})</em></small></h4>
              {this.renderGroupSelect()}
            </div>
          </div>
        )}
        {/* text */}
        {this.state.error_status && !this.state.loading &&(
          <div className="col-7">
            {this.renderInvalidTable()}
          </div>
        )}


        <div className="col-3">
          {/* Buttoons */}
          {this.state.error_status === false &&(
            <Button 
              onClick={() => this.handleUpload()}
              className="btn-lg btn-block"
              style={{ padding:"12px" }} 
              variant="contained" 
              color="primary" >
                {this.renderStatusButon("Upload")}
            </Button>
          )}
          {this.state.tsvFile.size > 0 && !this.state.error_status && !this.state.loading &&(
            <Button 
              onClick={() => this.handleBack()}
              className="btn-lg btn-block"
              style={{ padding:"12px" }} 
              variant="text" 
              color="primary" >
              Replace
            </Button>
          )}
          {this.state.loading === true && this.state.tsvFile.size > 0 &&(
            <div className="mt-1">
              <Typography> Process may take a few minutes. Do not leave or refresh this page. </Typography>
            </div>
          )}
        {/* Err on its own Stepper pane?  */}
          {this.state.error_status === true&&(
          <div className="mx-2">
            <Typography 
            // variant="h6"
            color="error">
              {this.state.error_message_detail}
            </Typography>
                         
            <Typography 
              variant="caption" 
              color="error">
              There were some problems Registering your data. <br /> 
              Please review &amp; resubmit.
            </Typography> 
            <div className="row">
              <Button 
                onClick={() => this.handleReset()}
                className="btn-lg btn-block m-0"
                style={{ padding:"12px", float:"right" }} 
                variant="contained" 
                color="error" >
                Restart
              </Button>
            </div>
          </div>
          )}
        </div>
      </div>
    )
  }


  renderRegisterSlide = () =>{
    return(
      <div>
        <div className="row">
        {this.state.error_status && !this.state.loading &&(
          <div> 
            {this.renderInvalidTable()}
          </div>
        )}
        {this.state.mixed_status && !this.state.loading &&(
          <div> 
            <div className="mb-5" > 
              <Typography variant="h5" gutterBottom><FontAwesomeIcon icon={faExclamationTriangle} sx={{padding:1}}/>  Some Rows Failed to Register!</Typography>
              <Typography variant="body1" className="" > Some rows failed to process. Please Review the table below & resubmit these entries.</Typography>
              {this.renderMixedSuccess()}
            </div>
            <div>
              <Typography variant="h5" gutterBottom>The following rows were registered successfully!</Typography>
              {this.renderPreviewTable()}
              {this.state.complete && (
                <>{this.handleFileMake() }</>
              )}
            </div>
          </div>
        )}
        {!this.state.error_status && !this.state.mixed_status && (
          <div>
            <Typography variant="h5" gutterBottom>The following rows were registered successfully!</Typography>
              {this.renderPreviewTable()}
              {this.state.complete && (
                <>{this.handleFileMake() }</>
              )}
          </div>
        )}
        </div>
        <div className="d-flex flex-row align-content-end align-items-end flex-row-reverse mt-2">

          {/* Buttons */}
            {!this.state.error_status && !this.state.complete &&(
              <span> 
                <Button 
                  onClick={() => this.handleRegister()}
                  className="btn-lg"
                  style={{ padding:"12px" }} 
                  variant="contained" 
                  color="primary" >
                  {this.renderStatusButon("Register")}
                </Button>
              </span>
            )}
            {!this.state.error_status && !this.state.loading && this.state.complete === true &&(
              <div>
                <Button 
                  onClick={() => this.handleReset()}
                  className="btn-lg mt-2 align-self-end"
                  style={{ padding:"12px" }} 
                  variant="contained" 
                  color="primary" >
                  Close
                </Button>
              </div>
            )}

          {/* Errors */}

          {this.state.error_message &&(
            <div style={{
              marginBottom:"10px", width:"100%", display:"inline-block"
              }}>
              
              <Typography 
              variant="h6"
              color="error">
                {/* {this.state.error_message_detail} */}
              </Typography>

              <Typography 
                variant="caption"
                style={{marginBottom:"10px", width:"100%", display:"inline-block"}}
                color="error">
                {this.state.error_message_extended}
              </Typography>

              <Typography 
                variant="caption" 
                color="error">
                There were some problems Registering your data. <br /> 
                Please review &amp; resubmit.
              </Typography> 

             
              <Button 
                onClick={() => this.handleReset()}
                className="btn-lg btn-block m-0"
                style={{ padding:"12px", float:"right" }} 
                variant="contained" 
                color="error" >
                Restart
              </Button>
              
            </div>
          )}

          {/* Successful */}
          {!this.state.complete && !this.state.loading && !this.state.error_status &&(
            <Typography className="text-right p-2" >File successfully Uploaded </Typography>  
          )}
          {/* Processing */}
          {!this.state.complete && this.state.loading === true && !this.state.error_status &&(
            <Typography className="text-right p-2" > Process may take a few minutes. Do not leave or refresh this page. </Typography>
            )}
          {/* Complete */}
          {this.state.complete === true && !this.state.loading && !this.state.error_status &&(
            <div>
              <Typography className="text-right p-2">{this.renderErrorNuance()} Data Submitted Successfully!</Typography>
            </div>
          )}

        </div>
        
      </div>
    )
  }


  renderTableBody = () =>{
    // console.debug("typeof", this.state.uploadedSources, typeof this.state.uploadedSources);
    if(this.props.bulkType.toLowerCase() === "samples" && this.state.uploadedSources){
      return(
        <TableBody>
          {this.state.uploadedSources && this.state.uploadedSources.map((row, index) => (
            <TableRow  key={(row.id+""+index)}>
              {/* {console.debug("row", row)} */}
              {this.state.registeredStatus === true && (
                <TableCell  className="" scope="row"> {row.hubmap_id}</TableCell>
              )}
              <TableCell  className="" scope="row"> {row.lab_id ? row.lab_id : row.lab_tissue_sample_id}</TableCell>
              <TableCell  className="" scope="row"> {row.sample_category ? row.sample_category : row.specimen_type}</TableCell>
              <TableCell  className="" scope="row"> {row.organ_type ? row.organ_type : ""}</TableCell>
              <TableCell  className="" scope="row"> {row.sample_protocol ? row.sample_protocol : row.protocol_url}</TableCell>
              <TableCell  className="" scope="row"> {this.renderTrimDescription(row.description)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        );
    }else if(this.props.bulkType.toLowerCase() === "donors" && this.state.uploadedSources){
      return(
      <TableBody>
        {this.state.uploadedSources.map((row, index) => (
          <TableRow  key={(row.hubmap_id+""+index)}>
            {this.state.registeredStatus === true && (
              <TableCell  className="" scope="row"> {row.hubmap_id}</TableCell>
            )}
            <TableCell  className="" scope="row"> {row.lab_id ? row.lab_id : row.lab_donor_id}</TableCell>
            <TableCell  className="" scope="row"> {row.lab_name ? row.lab_name : row.label}</TableCell>
            <TableCell  className="" scope="row"> {row.selection_protocol ? row.selection_protocol : row.protocol_url}</TableCell>
            <TableCell  className="" scope="row"> {this.renderTrimDescription(row.description)}</TableCell>
          </TableRow>
        ))}
      </TableBody>);
    }
    
  }


  renderPreviewTable = () =>{
    var headCells = [];
    if(this.props.bulkType.toLowerCase() === "samples"){
      headCells = [
        // { id: 'source_id',  label: 'Source Id ' },
        { id:'lab_id',  label:'Lab Id ' },
        { id:'sample_category',  label:'Type' },
        { id:'organ_type',  label:'Organ ' },
        { id:'sample_protocol',  label:'Protocol ' },
        { id:'description',  label:'Description ' },
      ];
    }else if(this.props.bulkType.toLowerCase() === "donors"){
      headCells = [
        { id:'lab_id',  label:'Lab ID ' },
        { id:'lab_name',  label:'Lab Name ' },
        {id:'selection_protocol',  label:'Protocol ', width:"40%"},
        { id:'description',  label:'Description ' },
      ];
    }
    if(this.state.registeredStatus === true){
      headCells.unshift({
        id:'hubmap_id', disablePadding:true, label:'Hubmap ID ', width:"" 
      },)
          }
    return(
      <TableContainer 
        component={Paper} 
        style={{ maxHeight:450 }}
        >
      <Table 
        aria-label={"Uploaded "+this.props.bulkType }
        size="small"
        padding="none"
        stickyHeader 
        className={"table table-striped table-hover mb-0 uploadedTable uploadedStuff-"}>    
        <TableHead className="thead-dark font-size-sm" >
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
         {this.renderTableBody()}
      </Table>
    </TableContainer>
  )
}

  


  renderInvalidTable = () =>{
    return(
      <TableContainer 
        component={Paper} 
        style={{ maxHeight:450 }}
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

  renderMixedSuccess = () =>{
    return(
      <div>
        
        <TableContainer 
          component={Paper} 
          style={{ maxHeight:450, marginBottom:4 }}
          >
          <Table 
            aria-label={"Uploaded Errors"+this.props.bulkType }
            size="small"
            stickyHeader 
            className="error-table table table-striped table-hover mb-0 uploadedTable ">
            <TableHead  className="font-size-sm">
              <TableRow className="tableRowError">
                <TableCell  component="th" variant="head" width="7%">Row</TableCell>
                <TableCell  component="th" variant="head">Error</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {this.state.errorSet.map((item, index) => (
                <TableRow  key={("rowitem_"+index)} className={item.error ? "error" : "ssuccess"} >
                  <TableCell  className="" scope="row"> 
                    {item.row}
                  </TableCell>
                  <TableCell  className="" scope="row"> 
                    {item.error ? item.error  : "Successfully Registered as "+item.hubmap_id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    ) 
  }

  renderInvalidMark = (err) =>{
    return(
      <Tooltip title={"Error:"+err} aria-label="error message">
        <ErrorIcon className="invalid" />
      </Tooltip>
    );
  }


  renderTrimDescription = (desc) =>{
    console.log("desc", desc);
      var description = desc;
    //Thisll auto-trim descriptions & place their full content in a tooltip
    if(desc && desc.length >= 22 ){
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
          <FontAwesomeIcon icon={faSpinner} spin />
        </div>
      );
    }
    if (!this.state.loading && !spin) {
      if(this.state.error_status){
        return(
          <div className='text-center'>
            <FontAwesomeIcon  icon={faExclamationTriangle}  />
          </div>
        );
      }else{
        return (
          <div className='text-center'>
            <FontAwesomeIcon icon={faSpinner} className="invisible"  />
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
                <Box 
                sx={{textAlign:"left",
                  padding:  "0.5rem",}}>

                  <h6>{this.state.error_message_detail}</h6>
                  {this.state.error_message_detail}
                </Box>
              </div>
            )}
            {!this.state.error_message &&(
              <div>
                <h6>{this.state.success_message}</h6>
                <Button 
                  onClick={() => this.resetSteps()}
                  className="btn-lg btn-block m-0 align-self-end"
                  style={{ padding:"12px" }} 
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
        <div className="p-2 mt-3" id="stepContainer">{this.getStepContent(this.state.activeStep)}</div>
      </div>
    );
  }
  

  render = () =>{
    //@NOTE: File download will only work once the file makes it to the main branch
    var targetBranch ="main";
    var targetFile = (this.props.bulkType).slice(0, -1).toLowerCase()
    const exampleFile ="https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/"+targetBranch+"/src/src/assets/Documents/example-"+targetFile+"-registrations.tsv"
    const docs ="https://docs.hubmapconsortium.org/bulk-registration/"+this.props.bulkType.toLowerCase().slice(0, -1)+"-bulk-reg.html"
    return (
      <>
        <div className="col-sm-12">
            <div className=" d-flex ">
            <Typography className="mr-3 d-inline-block"> 
              <Button 
                href={exampleFile}
                download
                target="_blank "
                className="btn-lg btn-block"
                style={{ padding:"12px", marginRight:"10px"  }} 
                variant="contained" 
                color="primary" >
               {<FontAwesomeIcon
                  icon={faFileDownload}
                  className="m-1"
                  style={{ fontSize:50 }}  
                />} 
                Example.tsv
              </Button>
              </Typography>
            <div className="">
              <h4>{toTitleCase(this.props.bulkType).slice(0, -1)} Information Upload</h4>
              <Typography className="d-inline-block " style={{ display:"inline-block"  }} >
                To bulk register multiple {this.props.bulkType.toLowerCase()} at one time, upload a tsv file here in the format specified by this example file. <br /> Include one line per {this.props.bulkType.toLowerCase().slice(0, -1)} to register. {toTitleCase(this.props.bulkType).slice(0, -1)} metadata must be provided separately. <br />
                <Typography className={this.state.rowLimitClass}> <strong> There is a 40 row limit on uploaded files.</strong> <br /></Typography>
               
                See the <Link href={docs} target="new">{toTitleCase(this.props.bulkType).slice(0, -1)} Bulk Registration</Link> page for further details.
              </Typography> 

              </div> 
            </div>
            
          {this.renderStepper()}

        </div>
      </>
    );
  }
}

export default bulkCreation;
 
