import {useState} from "react";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faExclamationTriangle} from "@fortawesome/free-solid-svg-icons";
import Collapse from '@mui/material/Collapse';

import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import IconButton from '@mui/material/IconButton';

export default function ErrorPage(props) {
    var [errorInfoShow, setErrorInfoShow] = useState(false);
    // var {message,stack,fileName,lineNumber,columnNumber} = props.errorValue;
    console.debug('%c⊙ErrorPage Props: ', 'color:#00ff7b', props );
    var errorObject = {}
    if(props.errorValue && props.errorValue !== undefined){
        errorObject.message = props.errorValue.message ?  props.errorValue.message : "Error: No Message Included"
        errorObject.stack = props.errorValue.stack ?  props.errorValue.stack : "No Stack Trace Available"
        errorObject.fileName = props.errorValue.fileName ?  props.errorValue.fileName : "No File Name Available"
        errorObject.lineNumber = props.errorValue.lineNumber ?  props.errorValue.lineNumber : "No Line Number Available"
        errorObject.columnNumber = props.errorValue.columnNumber ?  props.errorValue.columnNumber : "No Column Number Available"
    }else {
        errorObject.message = "Information Not Provided. Possible Asynchronous Error"
        errorObject.stack = ""
        errorObject.fileName = ""
        errorObject.lineNumber = ""
        errorObject.columnNumber = ""
    }
    // var jsonERR = toJSON(errorObject);
    // var mapDerails = new Map(JSON.parse(jsonERR));
    return (
        <div className={"error-page p-1"}>

            <Box  sx={{ 
                backgroundColor: 'white',
                width:          '100%', 
                '& span, h2':   {display:'inline-block',
                padding:"5px",} }}>
                
                <Grid container className='p-2'>
                    <Grid item xs={12} className="mb-4" sx={{backgroundColor:'#dc3545',color:          "#fff",width:'100%',padding:1, }}>
                        <Typography variant="h2" align="left"><FontAwesomeIcon icon={faExclamationTriangle} sx={{padding:1}}/>  Sorry!  </Typography><Typography align="left" variant="body" >Something's gone wrong...</Typography>
                    </Grid>
                    <Grid item xs={7} className="mb-4">
                        <Typography variant="body">There's been an error handling the current task. Please try again later. <br />
                            If the problem persists, please contact the HuBMAP Help Desk at <a href="mailto:help@hubmapconsortium.org">help@hubmapconsortium.org</a>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{
                        backgroundColor:'#fcfad9',
                        padding:"4px 8px",
                        color:"#dc3545",
                    }}>
                        <Typography variant='h5' gutterBottom>Error: </Typography>
                        {errorObject.message && errorObject.message.length>0 && (
                            <Box sx={{width:'100%', fontSize:'1.8em',  padding:1,marginBottom:2, backgroundColor:'white', color:"#dc3545"}}>
                                {errorObject.message} <br/>
                                {!props.errorValue && (
                                    <Typography ><strong>Please See Error Overlay for Further Information:</strong> </Typography> 
                                )}
                                {props.errorValue && (
                                    <>
                                    <Typography ><strong>File:</strong> {errorObject.fileName}  </Typography> 
                                    <Typography ><strong>Line Number:</strong> {errorObject.lineNumber} | <strong>Column Number:</strong> {errorObject.columnNumber} |</Typography> 
                                    </>
                                )}
                            </Box>
                        )}
                        <Typography variant='h5'gutterBottom>View Stack Trace:<IconButton color="error" size="small" onClick={()=>setErrorInfoShow(!errorInfoShow)}> <ChevronRightIcon /></IconButton> </Typography>
                        <Collapse in={errorInfoShow} sx={{backgroundColor:'white', color:"#dc3545", padding:"3em"}}>
                            <Typography variant="subtitle1">
                            {errorObject.stack}
                            </Typography>
                        </Collapse>
                    </Grid>
                </Grid>
            </Box>
        </div>
    );
}