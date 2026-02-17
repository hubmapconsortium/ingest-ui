import {useEffect, useState, useMemo, useCallback} from "react";
import {useParams,useLocation, useNavigate, Link} from "react-router-dom";
import { humanize, toTitleCase } from "../../utils/string_helper";
import LoadingButton from "@mui/lab/LoadingButton";
import { styled } from '@mui/material/styles';
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import Grid from '@mui/material/Grid';
import {GridLoader} from "react-spinners";
import Papa from 'papaparse';
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faSpinner,faExclamationTriangle,faFileDownload,faTruckMoving} from "@fortawesome/free-solid-svg-icons";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {NewBadge,IconSelection,prefillFormValuesFromUrl,SnackbarFeedback} from "../ui/formParts";
import {AddBoxOutlined} from "@material-ui/icons";
import Collapse from '@mui/material/Collapse';
import {COLUMN_DEF_BULK_SAMPLES, COLUMN_DEF_BULK_DONORS} from '../ui/tableBuilder';
import {BulkEntitiesTable} from '../ui/bulkEntitiesTable';

export const BulkEntityForm = (props) => {
  const navigate = useNavigate();
  const location = useLocation();
  let[pageErrors, setPageErrors] = useState(null);
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "", 
    status: "info"
  });

  const [tsvFile, setTsvFile] = useState(null);
  let [TMError, setTMError] = useState(false);


  return(
    <Box>

      <Grid container className="mb-3 mt-3" >
        <Grid item xs={4} className="topHeader" > 
            {NewBadge(props.bulkType,"new")}
            <h3 style={{margin: "4px 5px", display: "inline-table",verticalAlign: "bottom"}}>{`Bulk ${toTitleCase(props.bulkType)}s`}<br/></h3>
        </Grid>
        <Grid item xs={8} className="">
          <Typography variant="caption" style={{ display:"inline-block", fontSize:""  }} >
            To bulk register multiple {props.bulkType.toLowerCase()}s at one time, upload a tsv file here in the format specified by the example file provided at the footer of the table below. Include one line per {props.bulkType.toLowerCase()} to register. <br />{toTitleCase(props.bulkType)} metadata must be provided separately. <br />
            <span  className={TMError?"rowLimitClass error":"rowLimitClass"}><strong> There is a 40 row limit on uploaded files.</strong></span><br />
          </Typography>
        </Grid>
      </Grid>
    

      {/* Wizard */}
      <BulkEntitiesTable 
        tsvfile={tsvFile}
        type={props.bulkType}
        // columns={columns}
        onDataChange ={({data, errors})=>{
          console.debug('%c◉ onDataChange ', 'background:#D000FF', data, errors);
          if(errors[0]?.name === "Too Many"){
            setTMError(true);
          }else{
            setTMError(false);
          }
        }}
      />
    
    
      {pageErrors && (
        <Alert variant="filled" severity="error" className="pageErrors">
          <strong>Error:</strong> {JSON.stringify(pageErrors)}
        </Alert>
      )}
      <SnackbarFeedback snackbarController={snackbarController} setSnackbarController={setSnackbarController}/>
    </Box>
  );
  
}