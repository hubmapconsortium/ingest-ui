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
import { styled } from '@mui/material/styles';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner,faExclamationTriangle,faFileDownload} from "@fortawesome/free-solid-svg-icons";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import * as prettyBytes from 'pretty-bytes';
import DescriptionIcon from '@material-ui/icons/Description';
import {GridLoader} from 'react-spinners';
import {ingest_api_upload_bulk_metadata} from '../service/ingest_api';
import {parseErrorMessage,toTitleCase} from "../utils/string_helper";

export const RenderMetadata = (props) => {
  var [isLoading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = React.useState(0);
  const [uploadedFile, setUploadedFile] = React.useState();
  const [failed, setFailed] = React.useState(new Set());
  const steps = ['Select','Upload', 'Validate', 'Results'];
  const type = props.type;
  const isStepFailed = (step) => {
    // return step === 1;
    return false;
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
          
        }
      })
      .catch((error) => {
        console.error(error);
        setActiveStep(-1);
        handleUploadError();
      });
  };

  const handleUploadError = () => {
    setFailed(1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const handleNext = () => {
    setActiveStep(activeStep + 1);
    console.debug('%c⊙ handleNext', 'color:#00ff7b', activeStep + 1 );
    // if (activeStep === 1 && handleUploadFile) {
    //   handleUploadFile();
    // }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const introText = () =>{
    return(
      <>
      <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
        To bulk register  {props.type.toLowerCase()} metadata, upload your tsv file here. Please reffer to the format specified in this <Button href={exampleFile} size='small' download target="_blank " >{<FontAwesomeIcon icon={faFileDownload} className="m-1" />}Example.tsv </Button> file  For further details, please see the Metadata Upload Documentation for {props.type}s. 
      </Typography> 
      {activeStep ===2 && (
        <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
          Validating... <br />
          This step could take a few moments. <br />
          Please do not refresh, close, or leave the page until the process is
          complete.
        </Typography>
      )}
      {activeStep ===3 && (
        <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
          Please feel free to INSERT COPY HERE <br />
          <Button size='small' onClick={() => handleReset()} >Upload Another File</Button>
        </Typography>
      )}
      </>
  )}


  var stepOne = () => {
    return (
        <div className=" d-flex flex-row align-content-end align-items-end mx-2 ">
          {!uploadedFile && (
            <Typography className="d-inline-block" sx={{margin:"auto"}}> 
              <Button
                variant='contained'
                component="label"
                startIcon={<CloudUploadIcon />}
                onClick={(event) => handleFileGrab(event)}>
                Browse
                <VisuallyHiddenInput 
                  type="file"
                  accept='.tsv, .csv'
                  id='FileUploader'
                  name='file'
                  onChange={(event) => handleFileGrab(event)} />
              </Button>
            </Typography>
          )}
          {/* {introText()} */}
      </div>
    );
  };

  var stepTwo = () => {
    return (
        <div className=" d-flex flex-row align-content-end align-items-end mx-2 ">
          {uploadedFile && (
            <Typography className="d-inline-block" sx={{margin:"auto"}}> 
            <Typography className="d-inline-block text-left " style={{ display:"inline-block", margin:"10px"  }} variant='caption'>{uploadedFile.name} <br /> <small><em>({prettyBytes(uploadedFile.size)})</em></small></Typography>
              <Button 
                variant="contained" 
                startIcon={<CloudUploadIcon />} 
                onClick={() => handleUploadFile()}>
                Upload
              </Button>
            </Typography>
          )}
          {/* {introText()} */}
      </div>
    );
  };
  var stepThree = () => {
    return (
        <Typography>
          Validating...
        </Typography>
    );
  };
  var stepFour = () => {
    return (
      <div>
        <Typography>Upload Success!</Typography>
      </div>
    );
  };
  var stepBad = () => {
    return (
      <div>
        <Alert variant='filled' severity='error'>
          PROBLEM
        </Alert>
      </div>
    );
  };

  const getStepContent = (step) => {
    console.debug('%c⊙ getStepContent for step: ', 'color:#00ff7b',  step);
    switch (step) {
      case 0:
        console.debug('%c⊙', 'color:#00ff7b', 'Step 0');
        return stepOne();
      case 1:
        console.debug('%c⊙', 'color:#00ff7b', 'Step 1');
        return stepTwo();
      case 2:
        console.debug('%c⊙', 'color:#00ff7b', 'Step 2');
        return stepThree();
      case 3:
        console.debug('%c⊙', 'color:#00ff7b', 'Step 3');
        return stepFour();
      default:
        console.debug('%c⊙', 'color:#00ff7b', 'Step Unknown');
        return 'Unknown step';
    }
  };

var targetBranch ="master";
var targetFile = (props.type).slice(0, -1).toLowerCase()
const exampleFile ="https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/"+targetBranch+"/src/src/assets/Documents/example-"+targetFile+"-registrations.tsv"
const docs ="https://software.docs.hubmapconsortium.org/bulk-registration/"+props.type.toLowerCase().slice(0, -1)+"-bulk-reg.html"
  return (
    <>
        <div className="row">
          <h4>{toTitleCase(props.type)} Metadata Upload</h4>
          <div  className=' col-sm-10'>
            {introText()}
          </div>
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
                    <StepContent>{getStepContent(activeStep)}</StepContent>
                  </Step>
                );
              })}
            </Stepper>             
          </div>
         
          
        </div>
      </>
  );
};
