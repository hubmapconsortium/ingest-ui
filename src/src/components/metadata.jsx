import {faFileDownload} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FileOpenIcon from '@mui/icons-material/FileOpen';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import RestorePageIcon from '@mui/icons-material/RestorePage';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import {styled} from '@mui/material/styles';
import * as prettyBytes from 'pretty-bytes';
import React,{useState} from 'react';
import DataTable from 'react-data-table-component';
import {GridLoader} from "react-spinners";
import {entity_api_attach_bulk_metadata} from '../service/entity_api';
import {ingest_api_upload_bulk_metadata} from '../service/ingest_api';
import {getErrorList} from "../utils/error_helper";
import {prettyObject,toTitleCase,urlify} from "../utils/string_helper";
import {isArray} from "util";


export const RenderMetadata = (props) => {
  var [isAttaching, setAttaching] = useState(false);
  var [activeStep, setActiveStep] = React.useState(0);
  var [uploadedFile, setUploadedFile] = React.useState();
  var [warningOpen, setWarningOpen] = React.useState();
  var [failed, setFailed] = React.useState(new Set());
  var [failedStep, setFailedStep] = React.useState(null);
  var [validatedMeta, setValidatedMeta] = React.useState(null);
  var [attachedMetadata, setAttachedMetadata] = React.useState([]);
  var [path, setPath] = React.useState(null);
  var [issues, setIssues] = React.useState();
  var [table, setTable] = React.useState({data:[],columns:{}});
  const steps = ['Select','Upload', 'Validate', 'Attach', "Success"];
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

  
  var [errorHandler, setErrorHandler] = useState({
    status: '',
    message: '',
    isError: null,
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
      setUploadedFile(newFile);
      setActiveStep(1);
    } else {
      console.debug('No Data??');
    }
  };

  const attachMetadata = () => {
    setAttaching(true)
    let passes = []
    let fails = []
    let row = 0
    // setIsLoading(true)validatedMeta
    for (let item of validatedMeta[0]) {
      let thisRow = {
        metadata: item.metadata,
        protocol_url:  item.protocols_io_doi,
        // direct_ancestor_uuid: item.donor_id
      };
      thisRow.metadata['pathname'] = path
      thisRow.metadata['file_row'] = row
      entity_api_attach_bulk_metadata(validatedMeta[0][row].metadata.sample_id,thisRow,JSON.parse(localStorage.getItem('info')).groups_token)
        .then((resp) => {
          if (!resp.error){
            passes.push(resp.results.message)
            setAttachedMetadata(attachedMetadata => [...attachedMetadata, resp.results.message])
            // setAttachedMetadata(passes);
          } else {
              fails.push(resp)
              console.debug('%c◉ Val fail ', 'color:#ffe921',resp );
          }
        })
        .catch((error)=>{
          console.debug('%c⭗', 'color:#ff005d', 'Error', error);
        })
      row++ 
    }
  }
function getColNames() {
  let typeCol = 'sample_category'
  let labIdCol = 'lab_tissue_sample_id'
  return {typeCol, labIdCol}
}


  const handleUploadFile = () => {
    setActiveStep(2);
    ingest_api_upload_bulk_metadata(
      toTitleCase(type),
      uploadedFile,
      JSON.parse(localStorage.getItem('info')).groups_token,
    )
      .then((resp) => {
        if (resp.status === 200) {
          var preparedMeta =[]
          var results = resp.results.description.data;
          setPath(resp.results.description.pathname);
          if(isArray(results)){
            for (const row of results) {
              var sample = {
                sampleID: row.description.metadata.sample_id,
                sourceID: row.description.metadata.source_id,
                metadata: row.description.metadata
              }
              preparedMeta.push(sample)
            }
          }else{
            preparedMeta.push({
              sampleID: results.metadata.sample_id,
              sourceID: results.metadata.source_id,
              metadata: results.metadata
            })
          }
          setValidatedMeta([preparedMeta]);
          setActiveStep(3);
        }else{ 
          var err = resp.error.response.data
          let cleanErr;
          var outerDetails = Object.keys(resp.error.response.data.description)[0];
          if(outerDetails==="CEDAR Validation Errors" ){
            var innerDetails = Object.values(resp.error.response.data.description)[0];
            var innerVals =Object.values(innerDetails)[0];
            var errorLabel = Object.keys(innerVals)[0].toString();
            // cleanErr = innerVals[deepKeys];
            cleanErr = {
              description:innerVals
            }
          }else{
            cleanErr = err
          }

          var errorTable = getErrorList(cleanErr)
          setIssues(resp.error.response.data);
          setFailed(1);
          setFailedStep(2);
          setActiveStep(4);
          setTable(errorTable)
          // handleUploadError(valErrors)
        }
      })
      .catch((error) => {
        // console.debug('%c⭗', 'color:#ff005d', 'Error', error,error.description);
      });
  };


  const handleReset = () => {
    setActiveStep(0);
    setFailedStep(null)
    setFailed(0)
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
          <Grid container xs={2}>
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
          <Grid xs={10} container alignItems="flex-start">
            <InsertDriveFileIcon style={{ fontSize:"5em" }} />
            <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >{uploadedFile.name} <br /><em>({prettyBytes(uploadedFile.size)})</em></Typography> 
          </Grid>
        </Grid>
      )}


      {activeStep ===2 && (
        <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
          <Grid container alignItems="flex-start" xs={2}>
            <GridLoader color="#444a65" size={23} loading={true} />
            <GridLoader color="#444a65" size={23} loading={true} />
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

      
      {/* Val Success */}
      {activeStep ===3 && !isAttaching && (
        <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
          <Grid container xs={2}>
            <Button 
              sx={{
                padding:"1em",
                fontSize: '1em',
              }}
              fullWidth
              size='large'
              variant="contained" 
              startIcon={<FilePresentIcon />} 
              onClick={() => attachMetadata()}>
              Attach Metadata 
            </Button>
          </Grid>
          <Grid xs={10} container alignItems="flex-start">
            <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
            Validation Success! <br />
            Your file  <em>{uploadedFile.name} </em>is now ready to upload. <br />
            </Typography>
          </Grid>
        </Grid>
      )}
      {activeStep ===3 && isAttaching && (
        <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
          <Grid container alignItems="flex-start" xs={2}>
            <GridLoader color="#444a65" size={23} loading={true} />
            <GridLoader color="#444a65" size={23} loading={true} />
          </Grid>
          <Grid xs={10} container alignItems="flex-start">
            <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
              Attaching Metadata now <br />
              This step could take a few moments. <br />
              Please do not refresh, close, or leave the page until the process is
            </Typography>
          </Grid>
        </Grid>
      )}
         

     {activeStep ===5 && (<>
          <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>

            <Grid xs={12} container alignItems="flex-start">
              <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
              Success! <br />
              The Folowing entries have been assigned their associated Metadata. 
              </Typography>
              <DataTable
                columns={
                  [{" name": "Message",
                      "sortable": true,
                      "selector": row => row,
                    }]
                }
                className=''
                data={attachedMetadata}
                pagination />
            </Grid>
          </Grid>
          <Grid alignItems="flex-end" justifyContent="flex-end" container spacing={2}> 
            
            <Grid alignItems="flex-end" justifyContent="flex-end" >
              <Button variant="contained" onClick={()=>window.location.reload()}>Restart</Button>
            </Grid>
            <Grid alignItems="flex-end" justifyContent="flex-end" >
              <Button variant="contained" onClick={()=>handleCancel()}>Close</Button>
            </Grid>

          </Grid>
         </>
      )}


      {/* Val Fail */}
      {activeStep ===4 && (
        <>
        <Grid container spacing={2} alignItems="flex-start" sx={{margin:"10px"}}>
          <Grid container alignItems="flex-start" xs={2}>
          <Button 
              sx={{
                padding:"1.5em",
                fontSize: '1.1em',
              }}
              color="error"
              fullWidth
              size='large'
              variant="contained" 
              startIcon={<RestorePageIcon />} 
              onClick={() => handleReset()}>
              Try again
            </Button>
              
          </Grid>
          <Grid xs={10}>
              <Typography className="d-inline-block text-left" style={{ display:"inline-block", margin:"10px"  }} >
                There were some prolems with your upload. <br />
                Please review the error table below and try again. <br />
              </Typography>
          </Grid>
        </Grid>    
        
        {/* <InvalidTable type={props.type} data={issues} /> */}
        
        <DataTable
          sx={{
            border: '1px solid #ff0000',
          }}
          columns={
            [{
                "name": "Row",
                "sortable": true,
                "width": "100px",
                "style": {backgroundColor: '#fdebed',},
                "selector": row => row.row,
              },{
                "name": "Error",
                "sortable": true,
                "style": {backgroundColor: '#fdebed'},
                "selector": row => row.error,
                "format": (row) => {
                    // let err = handleErrorRow(row)
                    // When it's from Cedar it has off wrapping & comes back deeply nested
                    var d = '"'
                    var dSharp = '`'
                    const formatError = (val) => val.replaceAll(' '+d, ' <code>').replaceAll(' "', ' <code>').replaceAll(d, '</code>').replaceAll('"', '</code>')
                    const formatErrorSharp = (val) => val.replaceAll(dSharp, '\'')
                    // const formatErrorOf = (val) => val.substr()
                    if(row.error){
                      var rowErr = formatError(row.error)
                      rowErr = formatErrorSharp(rowErr)
                      // console.debug('%c◉ rowErr.indexOf("of ") ', 'color:#00ff7b', rowErr.indexOf("of "));
                      if(rowErr.indexOf("of ") === 0){
                        rowErr = rowErr.slice(3)
                      }
                      return <span dangerouslySetInnerHTML={{__html: urlify(rowErr)}} />
                    }else{
                      return <span dangerouslySetInnerHTML={{__html: urlify(row)}} />
                    }
                    
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
