import {faFileDownload} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import FileOpenIcon from '@mui/icons-material/FileOpen';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import {styled} from '@mui/material/styles';
import React from 'react';
import {GridLoader} from "react-spinners";
import {ingest_api_upload_bulk_metadata} from '../service/ingest_api';
import {toTitleCase} from "../utils/string_helper";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";

export const RenderMetadata = (props) => {
  var [activeStep, setActiveStep] = React.useState(0);
  var [errorRows, setErrorRows] = React.useState([]);
  var [errorList, setErrorList ] = React.useState([]);
  var [failedStep, setFailedStep] = React.useState(null);
  var [results, setResults] = React.useState(null);
  const steps = ['Upload','Processing', 'Results'];
  const type = props.type;
  var isStepFailed = (step) => {
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
  
  var handleCancel = (e) => {
    window.history.pushState( null,"", "/");
    window.location.reload()
  }

  var handleFileGrab = (e) => {
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_');
    var newFile = new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      handleUploadFile(newFile);
    } else {
      console.debug('No Data??');
    }
  };


function renderResults() {

  return (
    <div>
      <h3>Results:</h3>
      {results === "Succeeding" && (
        <Alert className="mb-2" severity="success">
          <AlertTitle>Success</AlertTitle>
          No Errors or Failures Detected. Your Data has been accepted and import is in progress. Depending on how much metadata was provided, this could take several minutes to several hours to import.
        </Alert>
      )}
      {results === "Success" && (
        <Alert className="mb-2" severity="success">
          <AlertTitle>Success</AlertTitle>
          No Errors or Failures Detected. Your Data has been accepted and imported successfully! <br/>
        </Alert>
      )}
      {results === "Failure" && (
        <Box className="mb-2" severity="error" >
          <FontAwesomeIcon icon={faExclamationTriangle} color="red" className="mr-1" /> There were errors encountered when Validating your File:
          {/* Do non IVT, non row error handling first */}
          {errorList.length >0 && (
            <Alert  className="mb-2 p-1"  variant="filled" severity="error" >
              <AlertTitle>Error:</AlertTitle>
              {errorList.toString()}
            </Alert>
          )}
          {errorRows.length >0 && ( 
            errorRows.map((row, index) => {
              return (
                <Alert  className="mb-2 p-1" key={index + 1} variant="filled" severity="error" >
                  <AlertTitle>Error: Row {row.row.toString()} Column {row.column.toString()}</AlertTitle>
                  {row.error.toString()}
                </Alert>
              );
            })
          )}
        </Box>
      )}
  </div>
  )
}

function parseErrorJSON(error) {
  let regex = /\[.*\]/;
  let match = error.match(regex);
  let jsonArrayStringContained = match[0].replace(/"/g, '`'); // Replace Double quotes with Tick quotes for nested value management
  let jsonArrayString = jsonArrayStringContained.replace(/'/g, '"'); // Replace single quotes with double quotes for valid JSON
  let unwrappedJson = jsonArrayString.replace(/[\[\]']+/g,''); // Removes the nested brackets
  let splitMatch = unwrappedJson.split('},');
  let combinedSplit = [];
  for (var i = 0; i < splitMatch.length; i++) {
    if (i+1 < splitMatch.length) {
      splitMatch[i] = splitMatch[i] + "}";
    }
    let cleanedJson = splitMatch[i].replace(/`/g, "");
    let jsonParse = JSON.parse(cleanedJson);
    combinedSplit.push(jsonParse);
  }
  let sortedData = combinedSplit.sort((a, b) => a.row - b.row);
  return sortedData;
}

  const handleUploadFile = (newFile) => {
    setActiveStep(1);
    try {
      ingest_api_upload_bulk_metadata(
        toTitleCase(type),
        newFile,
        JSON.parse(localStorage.getItem('info')).groups_token,
      )
        .then((resp) => {
          console.debug('%c◉ resp ', 'color:#00ff7b', resp);
          if (resp.status === 202) {
            setResults("Succeeding");
          }else if (resp.status === 200) {
            setResults("Success");
          }else{ 
            setResults("Failure");
            setFailedStep(2);
            var err = resp.error.response.data.error ? resp.error.response.data.error : resp
            if(!err.includes("row")){
              // Non Row Error Handling first
              try{
                setErrorList(err.toString());
              }catch(error){
                console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#00ff7b', error);
              }
            }else{
              //  IVT Row by Row Error Handling
              try{
                var parsedErrorRows = parseErrorJSON(err);
                setErrorRows(parsedErrorRows);
              }catch(error){
                console.debug('%c◉ parsedErrorRows trycatch  ', 'color:#00ff7b', error);
              }
            }
          }
          // Always enter the final step regardless of results
          setActiveStep(2);
        })
        .catch((error) => {
          setActiveStep(2);
          setResults("Error");
        });
    } catch (error) {
      setFailedStep(2);
      if (error.response){
        throw new Error(error.response);
      }else{
        throw new Error(error);
      }
    }
};


const introText = () =>{
  return(
    <>
    <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
      To bulk register  {props.type.toLowerCase()} metadata, upload your tsv file here. Please reffer to the format specified in this <Button href={exampleFile} size='small' download target="_blank " >{<FontAwesomeIcon icon={faFileDownload} className="m-1" />}Example.tsv </Button> file  For further details, please see the Metadata Upload Documentation for {props.type}s. 
    </Typography> 
    
    {/* Gimmie the file */}
    {activeStep ===0 && (
      <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
        <Grid container xs={2}>
          <Button
            sx={{
              padding:"1.5em",
              fontSize: '1.1em',
            }}
            fullWidth
            size='large'
            variant='contained'
            component="label"
            startIcon={<FileOpenIcon />}
            >
            Select
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
      <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}} > 
        <Grid container alignItems="flex-start" xs={2}>
          <GridLoader color="#444a65" size={23} loading={true} />
          <GridLoader color="#444a65" size={23} loading={true} />
        </Grid>
        <Grid xs={10} container alignItems="flex-start">
          <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
            Uploading to Validation <br />
            This step could take a few moments. <br />
            Please do not refresh, close, or leave the page until the process is complete.
          </Typography>
        </Grid>
      </Grid>
    )}

    {/* // Results */}
    {activeStep ===2 && (
      <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
          <Grid xs={12}>
            <div className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
              {renderResults()}
            </div>
          </Grid>
          <Grid xs={12} alignItems="flex-end" justifyContent="flex-end" container > 
              <Button variant="contained" className="m-2" onClick={()=>window.location.reload()}>Restart</Button>
              <Button variant="contained" className="m-2" onClick={()=>handleCancel()}>Close</Button>
          </Grid>
      </Grid>
    )}

  </>)}


var targetFile = (props.type).toLowerCase()
const exampleFile ="https://hubmapconsortium.github.io/ingest-validation-tools/sample-"+targetFile+"/current/"

  return (
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
              <Step key={label} onClick={()=>setActiveStep(index)} sx={{cursor: "pointer"}}>
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
  );
};
