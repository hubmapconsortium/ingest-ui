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
import {faSpinner,faExclamationTriangle,faFileDownload} from "@fortawesome/free-solid-svg-icons";
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
  const [bulkRows, setBulkRows] = useState([]);
  const [activeStep, setActiveStep] = useState(0);
  const [validatingUpload, setValidatingUpload] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  useEffect(() => {
    let pathName = location.pathname
    console.debug('%c◉ pathName ', 'color:#00ff7b',pathName );
    // setLoading(false);
  }, []);


// Move VisuallyHiddenInput outside component to avoid recreation
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


  // Memoize file handlers to avoid recreation
  const handleFileUpload = useCallback((file) => {
    setValidatingUpload(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setBulkRows(results.data.map((row, idx) => ({ id: idx, ...row })));
        setValidatingUpload(false);
        setActiveStep(1);
      },
      error: () => {
        setValidatingUpload(false);
      }
    });
  }, []);

  const handleFileGrab = useCallback((e) => {
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_');
    var newFile = new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      setTsvFile(newFile);
      handleFileUpload(newFile);
    } else {
      console.debug("No Data??");
    }
  }, [handleFileUpload]);



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
            <span className={"rowLimitClass"}><strong> There is a 40 row limit on uploaded files.</strong></span><br />
          </Typography>
        </Grid>
      </Grid>
    

      {/* Wizard */}
      <BulkEntitiesTable 
        tsvfile={tsvFile}
        type={props.bulkType}
        // columns={columns}
        onDataChange ={({data, errors})=>{
          // setBulkRows(data);
          console.debug('%c◉ onDataChange ', 'color:#00ff7b', data, errors);
          setValidationErrors(errors);
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