import React, {useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import Stepper from '@mui/material/Stepper';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import {GridLoader} from "react-spinners";
import { styled } from '@mui/material/styles';
import { DataGrid } from '@mui/x-data-grid';
import DataTable from 'react-data-table-component';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2

import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import CloseIcon from '@mui/icons-material/Close';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner,faExclamationTriangle,faFileDownload} from "@fortawesome/free-solid-svg-icons";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as prettyBytes from 'pretty-bytes';
import DescriptionIcon from '@material-ui/icons/Description';
import {ingest_api_upload_bulk_metadata} from '../service/ingest_api';
import {parseErrorMessage,toTitleCase,prettyObject,string_helper,urlify} from "../utils/string_helper";
import {getErrorList} from "../utils/error_helper";
import {InvalidTable} from './ui/table';


export const RenderMetadata = (props) => {
  var [isLoading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = React.useState(0);
  const [uploadedFile, setUploadedFile] = React.useState();
  const [warningOpen, setWarningOpen] = React.useState();
  const [failed, setFailed] = React.useState(new Set());
  const [failedStep, setFailedStep] = React.useState(null);
  const [issues, setIssues] = React.useState();
  var [table, setTable] = React.useState({data:[],columns:{}});
  const steps = ['Select','Upload', 'Validate', 'Results'];
  const type = props.type;
  const isStepFailed = (step) => {
    return step === failedStep;
    // return false;
  };
  const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
  });

  
  var [errorHandler, setErrorHandler] = useState({
    status: '',
    message: '',
    isError: null,
  });

  var handleFileGrab = (e) => {
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_');
    var newFile = new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      setUploadedFile(newFile);
      setActiveStep(1);
    } else {
      console.debug('No Data??');
    }
  };

  const handleUploadFile = () => {
    setActiveStep(2);
    ingest_api_upload_bulk_metadata(
      type,
      uploadedFile,
      JSON.parse(localStorage.getItem('info')).groups_token,
    )
      .then((resp) => {
        if (resp.status === 200) {
          console.debug('%c⊙', 'color:#00ff7b', 'Success', activeStep);
          // handleNext();
          // Force a timeout for really short uploads to look like theyre doing something
          setTimeout(() => {
            setActiveStep(3);
          }, 6000);
        }else{ 
          console.debug('%c⭗ ERROR: ', 'color:#ff005d', resp.error.response.data);
          var innerDetails = Object.values(resp.error.response.data.description)[0];
          var deepInnerDetails = Object.values(innerDetails)[0];
          var packagedValError = {
            code:resp.error.response.data.code,
            description: deepInnerDetails,
            name:resp.error.response.data.name
          }
          var errorTable = getErrorList(packagedValError)
          setIssues(resp.error.response.data);


          setFailed(1);
          setFailedStep(2);
          setActiveStep(4);
          setTable(errorTable)
          // handleUploadError(valErrors)
        }
      })
      .catch((error) => {
        console.debug('%c⭗', 'color:#ff005d', 'Error', error,error.description);
        // setActiveStep(-1);
        // handleUploadError(error);
      });
  };


  const handleReset = () => {
    // setActiveStep(0);
    window.location.reload();
  };


const handleErrorRow = (row) => {
  let err = row.error
  if (typeof row.error === 'object') {
      err = err.msg
      if (row.error.data) {
          const jsonStr = JSON.stringify(row.error.data);
          err += ' http://local/api/json?view='+(jsonStr)
      }
  }
  return err
}

  const introText = () =>{
    return(
      <>
      <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
        To bulk register  {props.type.toLowerCase()} metadata, upload your tsv file here. Please reffer to the format specified in this <Button href={exampleFile} size='small' download target="_blank " >{<FontAwesomeIcon icon={faFileDownload} className="m-1" />}Example.tsv </Button> file  For further details, please see the Metadata Upload Documentation for {props.type}s. 
      </Typography> 
      
      {activeStep ===0 && (
        <Grid container spacing={2}>
          <Grid xs="auto">
            <Button
              sx={{
                padding:"1.5em",
                fontSize: '1.1em',
              }}
              fullWidth
              size='large'
              variant='contained'
              component="label"
              startIcon={<CloudUploadIcon />}
              >
              Browse
              <VisuallyHiddenInput 
                type="file"
                accept='.tsv, .csv'
                id='FileUploader'
                name='file'
                onChange={(event) => handleFileGrab(event)} />
            </Button>
          </Grid>
          <Grid xs={10}>
              <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
                Please select which file you'd like to process
              </Typography>
          </Grid>
        </Grid>
      )}
      
      {activeStep ===1 && (
        <Grid container spacing={2}>
          <Grid xs="auto">
            <Button 
              sx={{
                padding:"1.5em",
                fontSize: '1.1em',
              }}
              fullWidth
              size='large'
              variant="contained" 
              startIcon={<CloudUploadIcon />} 
              onClick={() => handleUploadFile()}>
              Upload
            </Button>
          </Grid>
          <Grid xs={10}>
            <Typography className="d-inline-block text-left " style={{ display:"inline-block", margin:"10px"  }} variant='caption'>{uploadedFile.name} <br /> <small><em>({prettyBytes(uploadedFile.size)})</em></small></Typography> 
          </Grid>
        </Grid>
      )}


      {activeStep ===2 && (
        <Grid container spacing={2}>
          <Grid xs="auto">
              <GridLoader
                color="#444a65"
                size={20}
                loading={true}
                cssOverride={{
                  margin: '0, auto'
                }}
              />
          </Grid>
          <Grid xs={10}>
              <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
                Validating... <br />
                This step could take a few moments. <br />
                Please do not refresh, close, or leave the page until the process is
                complete.
              </Typography>
          </Grid>
        </Grid>
      )}

      
      {/* Success */}
      {activeStep ===3 && (
        <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
          Please feel free to INSERT COPY HERE <br />
          <Button size='small' onClick={() => handleReset()} >Upload Another File</Button>
        </Typography>
      )}

      {/* Val Fail */}
      {activeStep ===4 && (
        <>
        <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
          There were some prolems with your upload. <br />
          Please review the error table below and try again. <br />
          <Button size='small' onClick={() => handleReset()} >Upload Another File</Button>
        </Typography>

        
        {/* <InvalidTable type={props.type} data={issues} /> */}
        
        <DataTable
        sx={{
          border: '1px solid #ff0000',
        }}
          columns={
            [
              {
                "name": "Row",
                "sortable": true,
                "width": "100px","style": {
                  backgroundColor: '#fdebed',
                },
                "selector": row => row.row,
              },
              {
                "name": "Error",
                "sortable": true,
                "style": {
                  backgroundColor: '#fdebed',
                },
                "selector": row => row.error,
                "format": (row) => {
                  var d = '"'
                  const formatError = (val) => val.replaceAll(' '+d, ' <code>').replaceAll(' "', ' <code>').replaceAll(d, '</code>').replaceAll('"', '</code>')
                  // const formatError = (val);
                  let err = handleErrorRow(row)
                  err = formatError(err)
                  // return err
                  return <span dangerouslySetInnerHTML={{__html: urlify(err)}} />
                }
              }
            ]
          }
          className='metadataHasError'
          data={table.data}
          pagination />
        <Alert variant='filled' severity='error'>
        <Button size='small' variant='link' onClick={() => {setWarningOpen(!warningOpen)}} >View Full Error Response &gt;&gt; </Button>
          <Collapse in={warningOpen}>
              {prettyObject(issues)}
          </Collapse>
            
        </Alert>
        </>
      )}


      </>
  )}


var targetBranch ="master";
var targetFile = (props.type).slice(0, -1).toLowerCase()
const exampleFile ="https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/"+targetBranch+"/src/src/assets/Documents/example-"+targetFile+"-registrations.tsv"
  return (
    <>
        <div className="row">
          <h4>{toTitleCase(props.type)} Metadata Upload</h4>
          
          <div className=' col-sm-2' id='stepContainer'>
            <Stepper activeStep={activeStep} orientation="vertical">
              {steps.map((label, index) => {
                const labelProps = {};
                if (isStepFailed(index)) {
                  labelProps.optional = (<Typography variant='caption' color='error'>Error</Typography>);
                  labelProps.error = true;
                }
                return (
                  <Step key={label}>
                    <StepLabel {...labelProps}>{label}</StepLabel>
                    {/* <StepContent>{getStepContent(activeStep)}</StepContent> */}
                  </Step>
                );
              })}
            </Stepper>             
          </div>
         
          <div  className=' col-sm-10'>
            {introText()}
          </div>
          
        </div>
      </>
  );
};
