import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormControl, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import {
  DataGrid, 
  useGridApiRef,
  GridToolbar} from "@mui/x-data-grid";
import Papa from 'papaparse';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from '@mui/material/MenuItem';
import Select from "@mui/material/Select";
import Collapse from '@mui/material/Collapse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faFileCircleXmark, faUpload, faRepeat } from '@fortawesome/free-solid-svg-icons';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from "@mui/material/Alert";
import {
  ingest_api_bulk_entities_upload,
  ingest_api_bulk_entities_register} from '../../service/ingest_api';
import {ParsePreflightString} from '../ui/formParts.jsx';
import ErrorList from './ErrorList';
import {ParseRegErrorFrame, parseErrorMessage, TableErrorRowProcessing} from '../../utils/error_helper.jsx';
import LoadingButton from "@mui/lab/LoadingButton";
// @TODO: Address with Search Upgrades & Move all this column def stuff into a managing component in the UI directory, not the search directory
import {
  COLUMN_DEF_BULK_SAMPLES, 
  COLUMN_DEF_BULK_DONORS, 
  COLUMN_DEF_BULK_ERRORS, 
  COLUMN_DEF_BULK_SAMPLES_SUCCESS,
  COLUMN_DEF_BULK_DONORS_SUCCESS } from '../ui/tableBuilder';
import Button from "@mui/material/Button";
// lodash removed (not used)

export function BulkEntitiesTable({ type,onDataChange }) {
  const apiRef = useGridApiRef();

  let [pageErrors, setPageErrors] = useState(null);
  let [fileData,setFileData] = useState({
    file: null,
    temp_id: null,
    uploaded:false,
    registered:false,
    group: JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "",
    rows:[],
    regValidation:{
      success:[],
      error:[],
      errorMessages:[],
    }
  });
  let [bulkEntityValidationErrors, setBulkEntityValidationErrors] = useState([]);
  let [bulkEntityRows, setBulkEntityRows] = useState([]);
  let [loaders, setLoaders] = useState({
    uploadTable: false,
    registration: false,
    showGroupSelect: false,
    RUIRender:null,
  });
  const spotlightTimeoutRef = useRef(null);
  let docs ="https://docs.hubmapconsortium.org/bulk-registration/"+type.toLowerCase()+"-bulk-reg.html"
  let userGroups = JSON.parse(localStorage.getItem("userGroups")) || [];

  // Column Management 
  const colSelection = useCallback((type) => {
    type = type.toLowerCase();
    switch (type) {
      case "sample":
        return COLUMN_DEF_BULK_SAMPLES;
      case "donor":
        return COLUMN_DEF_BULK_DONORS;
      default:
        return COLUMN_DEF_BULK_SAMPLES;
    }
  }, []);
  const columns = (type ? colSelection(type) : COLUMN_DEF_BULK_SAMPLES);
  const colSuccessSelection = useCallback((type) => {
    type = type.toLowerCase();
    switch (type) {
      case "sample":
        return COLUMN_DEF_BULK_SAMPLES_SUCCESS;
      case "donor":
        return COLUMN_DEF_BULK_DONORS_SUCCESS;
      default:
        return COLUMN_DEF_BULK_SAMPLES_SUCCESS;
    }
  }, []);
  const columnsSuccess = (type ? colSuccessSelection(type) : COLUMN_DEF_BULK_SAMPLES);
  const errCols= COLUMN_DEF_BULK_ERRORS;

  // Handle file upload and parse bulkEntity
  function handleFileGrab(e) {
    dimSpotlight();
    // - [autoSHH] console.debug('%c◉ Grabbing file ', 'color:#00ff7b');
    setBulkEntityValidationErrors([])
    highlightTableErrors("clear");
    setLoaders((prev) => ({ ...prev, uploadTable: true }));
    
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile = new File([grabbedFile], newName);
    
    if (newFile && newFile.name.length > 0) {
      setFileData ({
        file: newFile,
        temp_id: null,
        uploaded:false,
        registered:false,
        rows:[],
      });
    
      Papa.parse(newFile, {
        download: true,
        skipEmptyLines: true,
        header: true,
        complete: data => {
          // - [autoSHH] console.debug('%c◉ data ', 'color:#00ff7b', data.data);
          // If none of the file fields are accounted for in expected columns, don't set the table data
          let fileCols = data.meta.fields || [];
          let expectedCols = columns.map(col => col.field);
          let matchingCols = fileCols.filter(col => expectedCols.includes(col));

          setBulkEntityRows(matchingCols.length > 0 ? data.data : []);
          setFileData({...fileData, 
            rows: (data.data),
            uploaded: true,
            registered: false,
          });
          handleFileUpload(newFile);
          // - [autoSHH] console.debug('%c◉ fileData ', 'color:#00ff7b', fileData, fileData.rows);
        }
      });
      
    } else {
      //console.debug("No Data??");
    }
  }

  // Data Sync wuth wrapper
  // @TODO: No real need to wrap now 
  useEffect(() => {
    onDataChange({data: bulkEntityRows, errors: bulkEntityValidationErrors})
  }, [bulkEntityRows, bulkEntityValidationErrors, onDataChange])

  // Clear any active spotlight timeout on unmount
  useEffect(() => {
    return () => {
      if (spotlightTimeoutRef.current) {
        clearTimeout(spotlightTimeoutRef.current);
        spotlightTimeoutRef.current = null;
      }
    };
  }, []);

  function handleFileUpload(newFile){
    ingest_api_bulk_entities_upload(type+"s", newFile)
      .then((res) => {
        // console.debug('%c◉ ingest_api_bulk_entities_upload res ', 'color:#fff; background:#0033FF;',res.status, res, res?.results?.temp_id);
        if(res.status === 200 || res.status === 201){
          setFileData({
            ...fileData,
            temp_id: res?.results?.temp_id,
            uploaded: true,
          });
        }else if(res?.error?.response?.data?.data){ 
          let respSet = res?.error?.response?.data?.data
          // - [autoSHH] console.debug('%c◉ res?.error? Object Array ', 'background:#0033FF', respSet);
          try{
            const obj = respSet || {};
            const errorsArray = Object.keys(obj)
              .sort((a, b) => Number(a) - Number(b))
              .map(k => ({ column: "", error: obj[k], row: "" }));
            // Keep the raw array for now
            setBulkEntityValidationErrors(errorsArray)
            let errorSet = TableErrorRowProcessing(errorsArray)
            // Replace validation errors with the normalized set
            setBulkEntityValidationErrors(errorSet)
            highlightTableErrors(errorSet);
          }catch(error){
            // - [autoSHH] console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#FF006A', error);
          }
        }else if(res?.res?.response?.data){
          // - [autoSHH] console.debug('%c◉ .res?.response?.data Errors ', 'background:#0033FF', );
          let errorSet = res.res.response.data.description
          if(res?.res?.response?.data?.code === 406 && typeof res?.res?.response?.data?.description?.description === 'string'){
            // THis might just be a metadata issue
            let parsedPreflight = ParsePreflightString(decodeURI(errorSet?.description));
            let errString;
            let name = res?.res?.response?.data?.description?.name ? res?.res?.response?.data?.description?.name : null;
            for (let i = 0; i < parsedPreflight.length; i++) {
              const item = parsedPreflight[i];
              const itemStr = (item && typeof item === 'object') ? JSON.stringify(item) : String(item);
              errString = itemStr;
              if (item && typeof item === 'object') {
                for (const [key, value] of Object.entries(item)) {
                  if (item && typeof item === 'object') {
                    for (const [k, v] of Object.entries(value)) {
                        errString = `${key}: \n ${k} |  ${v}`;
                    }
                  }else{
                    errString = `${key}: ${value}`;
                  }
                }
              }
            }
            try{
              setBulkEntityValidationErrors([{
                // "column": "N/A",
                "error": errString,
                "name": name ? name : "",
              }])
              //setValidatingBulkEntityUpload(false)
            }catch(error){
              //setValidatingBulkEntityUpload(false)
              //console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#00ff7b', error);
            }
          }else if(!errorSet[0].row){
            // Non Row based Response
            // - [autoSHH] console.debug('%c◉ Nonrow ', 'background:#0033FF', );
            try{
              setBulkEntityValidationErrors([{
                "column": "",
                "error": errorSet.toString(),
                "row": ""
              }])
            }catch(error){
              // - [autoSHH] console.debug('%c◉trycatch  errorPreprocessCheck', 'background:#0033FF', error);
            }
          }else{
            //  IVT Row by Row Error Handling
            try{
              errorSet = errorSet.sort((a, b) => a.row - b.row);
              setBulkEntityValidationErrors(errorSet);
              highlightTableErrors(errorSet);
            }catch(error){
              //setValidatingBulkEntityUpload(false)
              // console.debug('%c◉ parsedErrorRows trycatch  ', 'color:#00ff7b', error);
            }
          }
          // - [autoSHH] console.debug('%c◉ "Please Review the following validation errors and re-upload your file." ', 'color:#00ff7b', );
          setPageErrors((prevValues) => ({
            ...prevValues,
            'bulkEntity': "Please Review the following validation errors and re-upload your file.",
          }))
        }else if(res?.error?.response?.data?.error){ // 400 / too many
          // - [autoSHH] console.debug('%c◉ 400! ', 'color:#00ff7b', res?.error?.response?.data?.error );
          try{
            setBulkEntityValidationErrors([{
              "name": "Too Many",
              "error": res?.error?.response?.data?.error,
            }])
          }catch(error){
            // - [autoSHH] console.debug('%c◉trycatch  errorPreprocessCheck', 'background:#0033FF', error);
          }
          
        }else{
          setPageErrors((prevValues) => ({
            ...prevValues,
            'bulkEntity': "An error occurred during file upload. Please review the message and try again. || "+res.toString(),
          }))
          
          console.error("IDK" , res);
          //setValidatingBulkEntityUpload(false)
        }
        //setValidatingBulkEntityUpload(false)
        setLoaders((prev) => ({ ...prev, uploadTable: false, }));
        let showGroupCheck = calcRegDisabled();
        if(userGroups.length > 1 && showGroupCheck === true ){
          // - [autoSHH] console.debug('%c◉ SHOWING ', 'color:#00ff7b', );
          setLoaders((prev) => ({ ...prev, showGroupSelect: true }));
        } 
        
        let fullTableContent = document.getElementsByClassName("MuiDataGrid-virtualScrollerRenderZone");
        let newHeight = fullTableContent[0].clientHeight
        let outerTable = document.getElementsByClassName("HDTdynamic")
        if(newHeight > 350){ newHeight = 300; console.log("2Big")}
        outerTable[0].setAttribute("style", `height: ${newHeight+100}px!important;`);
        // console.debug('%c◉ outerTable.style.height ', 'color:#00ff7b', outerTable[0]);
      })          
      
      .catch(() => {
        //console.debug('%c◉ FAILURE ', 'color:#ff005d', error);
      });
  }

  function handleTriggerUpload() {
    // - [autoSHH] console.debug('%c◉ handleTriggerUpload', 'color:#4000FF');
    document.getElementById('uploadBulk').click();
  }

  function handleFileWipe() {
    // - [autoSHH] console.debug('%c◉ FILE WIPE ', 'color:#4000FF');
    setBulkEntityRows([]);
    setFileData({
      file:null,
      temp_id:null,
      registered:false,
      uploaded:false,
      rows:[],
    })
  }

  function handleRegister(){
    // - [autoSHH] console.debug('%c◉ HANDLE REGISTER ', 'color:#00ff7b', fileData );

    setLoaders((prev) => ({ ...prev, registration: true }));
    let fileRef = {"temp_id":fileData.temp_id,"group_uuid":fileData.group ? fileData.group : (JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "")}
    // - [autoSHH] console.debug('%c◉ fileRef ', 'color:#00ff7b', fileRef);
    try{
      ingest_api_bulk_entities_register(type, fileRef)
      .then((resp) => {
        setFileData((prev) => ({ ...prev, registered: true, temp_id: null }));
        var serverResp;
        if(resp.response ){
          serverResp = resp.response
        }else if(resp.error && resp.error.response){
          serverResp = resp.error.response
        }else{
          serverResp = resp;
        }
        // - [autoSHH] console.debug('%c◉ serverResp ', 'color:#00ff7b', serverResp);
        if(resp.status && resp.status === 201 && resp.results){
          var respData = resp.results.data;
          // - [autoSHH] console.debug("respData",respData);
          var dataRows = [];
          for (var [, value] of Object.entries(respData)) {
            // - [autoSHH] console.debug("value",value);
            dataRows.push(value);
          }
          setBulkEntityRows(dataRows.length > 0 ? dataRows : [])
          setFileData({
            ...fileData,
            registered: true,
            regValidation:{
              success: dataRows,
              error: [],
              errorMessages: [],
            },
          });
            
          setPageErrors(null);

        } else if (
          (resp.response && resp.response.status && resp.response.status === 504) ||
          (resp.error && resp.error.response && resp.error.response.status === 504)) {
          // - [autoSHH] console.debug('%c⊙504', 'color:#ff005d' );
          ParseRegErrorFrame(resp);
        } else if (
          (resp.response && resp.response.status && resp.response.status === 500) ||
          (resp.error && resp.error.response && resp.error.response.status === 500)) {
          // - [autoSHH] console.debug('%c⊙500', 'color:#ff005d' );
          // We'll also get a 500 if all rows are bad, so check for that first 
          if(serverResp.data.status === "Failure - None of the Entities Created Successfully"){
            let rawErrorSet = serverResp.data.data || {};
            // - [autoSHH] console.debug('%c◉ errorSet ', 'color:#00ff7b', rawErrorSet);
            // Convert the keyed error object into a normalized array of error rows
            const entries = Object.entries(rawErrorSet || {}).sort((a, b) => Number(a[0]) - Number(b[0]));
            const errorArray = entries.map(([key, val], i) => {
              const rowIndex = Number(key);
              return {
                row: rowIndex,
                error: val?.error,
                listIndex: rowIndex - 1,
                id: `err-${i}`,
              };
            });
            // - [autoSHH] console.debug('%c◉ errorArray ', 'color:#00ff7b', errorArray);
            setBulkEntityValidationErrors(errorArray);
            setFileData({
              ...fileData,
              registered: true,
              regValidation:{
                success: [],
                error: errorArray,
                errorMessages: errorArray.map(e => e.error),
              },
            });

          }else{
            var grabFullError = {status:serverResp.data.status,data:serverResp.data.data}
            setPageErrors({ status: 'server', message: 'Registration Failure', detail: grabFullError });
            // - [autoSHH] console.debug('handleErrorCompiling', grabFullError);
          }
        }else if (resp.results && resp.results.data && resp.status === 207) {
        // Partial Success
          // - [autoSHH] console.debug('%c⊙207', 'color:#f4d006' );
          const entries = Object.entries(resp.results.data || {});
          let redoEntries = [];
          const errRows = entries
            .filter(([, val]) => val && val.error)
            .map(([key, val], i) => {
              const rowIndex = Number(key);
              redoEntries.push(bulkEntityRows[rowIndex-1]);
              const originalRow = bulkEntityRows[rowIndex-1] ? bulkEntityRows[rowIndex-1] : {}
              const respMeta = { ...originalRow, ...val };
              delete respMeta.error;
              return {
                row: Number(key),
                id: `err-${i}`,
                ...originalRow,
                ...respMeta,
                error: val.error,
                listIndex: rowIndex-1,
              };
            });
            // - [autoSHH] console.debug('%c◉ errRows ', 'color:#00ff7b', errRows);
          // Keep success rows intact (original response objects)
          const successRows = entries
            .filter(([, val]) => !(val && val.error))
            .map(([, val]) => val);
          // - [autoSHH] console.debug('%c◉ errRows ', 'background:#00ff7b', errRows);
          // - [autoSHH] console.debug('%c◉ successRows ', 'background:#00ff7b', successRows);
          setBulkEntityRows(successRows.length > 0 ? successRows : [])
          setFileData({
            ...fileData,
            registered: true,
            regValidation:{
              success: successRows,
              error: errRows,
              errorMessages: errRows.map(e => e.error),
            },
          });

          // setBulkEntityValidationErrors(errRows);
          setPageErrors(null);

        } else {
          reportError(resp);
        } 

        setLoaders((prev) => ({ ...prev, registration: false }));
        
      })
      .catch((error) => {
        console.error( error.stack );
        setPageErrors({ submit_error: error, error_status: true, error_message_detail: parseErrorMessage(error), error_message: 'Error' });
        setLoaders(prev => ({ ...prev, registration: false }));
      });       
    }catch(error){
      setPageErrors({ submit_error: error, error_status: true, error_message_detail: parseErrorMessage(error), error_message: 'Error' });
      // - [autoSHH] console.debug("SUBMIT error", error)
      setLoaders(prev => ({ ...prev, registration: false }));
    }
    
  }

  function highlightTableErrors(errorSet){
    // - [autoSHH] console.debug('%c◉ highlightTableErrors ', 'color:#D0FF00', errorSet);
    if(errorSet && errorSet.length > 0 && errorSet!== "clear"){
      dimSpotlight();
      for (const error of errorSet) {
        let errorRow = document.querySelector(`[aria-rowindex="${error.row}" ]`);
        const col = error.column === "organ_type" ? "organ" : error.column;
        let cell = errorRow.querySelector(`[data-field="${col}" ]`);
        if(cell){
          // We only want to set up the hover listeners and data attributes 
          // if there is a cell to attach them to.
          errorRow.setAttribute('data-error','true')
          cell.setAttribute('data-error','true')
          cell.setAttribute('data-cell-error','true')
          cell.setAttribute('data-target',`${error?.row-1}_${col}`)
          cell.addEventListener("mouseenter", function (e) {
            spotlightCellAndRow(e, error, `${error?.row-1}_${col}`); 
          });
          errorRow.addEventListener("click", function (e) {
            setSelectionListRow(e, error, `${error?.row}`); 
          });
        }
      }
    }else{
      try{
        dimSpotlight();
      }catch(err){
        // - [autoSHH] console.debug('highlightTableErrors clear error', err);
      }
    }
  }

  function spotlightCellAndRow(e, error, target){
    // Turn off Old Lights
    document.querySelector(`[data-spotlight="true" ]`)?.removeAttribute('data-spotlight');
    let olds = document.querySelectorAll(`[data-spotlight="true" ]`);
    olds.forEach(el => el.removeAttribute('data-spotlight', 'true'));
    // Attach data-spotlight to both the error list item and the cell, so both will be highlighted
    // Exclude any elements that are currently selected (`data-selected="true"`).
    let spotlightTargets = Array.from(document.querySelectorAll(`[data-target="${target}" ]`))
      .filter((el) => (el?.getAttribute('data-selected') !== 'true' || !el.getAttribute('data-selected')));
      let cleanTargets = []
      if(spotlightTargets[0]?.attributes["data-target"]?.value === spotlightTargets[1]?.attributes["data-target"]?.value){
        cleanTargets.push(spotlightTargets[0],spotlightTargets[1]);
      }

    const hasUndefinedErrRow = cleanTargets.some((el) => el?.id === 'errListRow-undefined');
    
    if (!hasUndefinedErrRow) {
      cleanTargets.forEach(el => el?.setAttribute('data-spotlight', 'true')); 
      // Add bonus row highlight on table when spotlit
      let errorRow = document.querySelector(`[aria-rowindex="${error.row+1}" ]`);
      errorRow?.setAttribute('data-spotlight', 'true');
    }
    setTimeout(() => {
      cleanTargets.forEach(el => el?.removeAttribute('data-spotlight', 'true'));
    }, 4000);

  }

  function dimSpotlight(){
    let oldDataError = document.querySelectorAll('[data-error]');
    oldDataError.forEach(el => el.removeAttribute('data-error'));
    let oldDataCellError= document.querySelectorAll('[data-cell-error]');
    oldDataCellError.forEach(el => el.removeAttribute('data-cell-error'));
  }

  function setSelectionTableRow(e, item, target){
    // - [autoSHH] console.debug('%c◉ setSelectionTableRow ', 'color:#00ff7b', setSelectionTableRow);
    let oldSelected = document.querySelectorAll('[data-selected]'); 
    oldSelected.forEach(el => el.removeAttribute('data-selected')); 
    oldSelected.forEach(el => el.classList.remove('Mui-selected')); 
    let oldByClass = document.getElementsByClassName("Mui-selected");
    Array.from(oldByClass).forEach(el => el.classList.remove('Mui-selected'));

    let dataGridContainer = document.querySelector('.associatedBulkEntityTable');
    let selectedRow = dataGridContainer.querySelector(`[aria-rowindex="${target}" ]`);
    if(selectedRow){
      selectedRow?.setAttribute('data-selected', 'true').classList.add('Mui-selected');
    }
    e.target.setAttribute('data-selected', 'true');
    // console.debug('%c◉ selectedRow ', 'color:#00ff7b', selectedRow);
  }

  function setSelectionListRow(e, item, target){
    // - [autoSHH] console.debug('%c◉ setSelectionListRow ', 'color:#00ff7b', e, item, target );
    let oldSelected = document.querySelectorAll('[data-selected]'); 
    oldSelected.forEach(el => el.removeAttribute('data-selected')); 
    oldSelected.forEach(el => el.classList.remove('Mui-selected')); 
    // we only wanna run this if we're not being selected by the row already, check event
    // - [autoSHH] console.debug('%c◉ setSelectionListRow e ', 'color:#00ff7b', e);
    let selectedRow = document.getElementById(`errListRow-${target}`);
    selectedRow?.setAttribute('data-selected', 'true');
  }

  function renderErrorFrame(){
    return (
      <Box className="HDT errorFrame mt-4" >
        <Box className="errorFrameDetail" >
          {!fileData.registered && (<>
            <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-2 errIcon red'/>
            <Typography className='preamble' variant='overline'> 
              The following errors were encountered when trying to upload your data. Please review the messages below and try again.
            </Typography>
          </>)}
          {bulkEntityRows && bulkEntityRows.length <= 0 &&(
            <Typography className='preamble' variant='caption' component={"p"} sx={{ width: "100%", borderBottom: "1px solid #00000030", background: '#ffe6e6', color: '#3E0000', padding: '5px 10px' }}> 
              <FontAwesomeIcon icon={faFileCircleXmark} color="red" className='mr-2 red' /> Additionally, no valid columns were found in the uploaded file, so no data can be displayed. Please ensure your file matches the expected format.  
            </Typography>
          )}
          {fileData.registered && (
            <Typography className='preamble' variant='caption' > 
              <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-2 red' />
              &nbsp;The following rows were not accepted; Please review validation messages and try again. 
            </Typography>
          )}
        </Box>
        <Box className="errorListWrap">
          <ErrorList
            errors={bulkEntityValidationErrors}
            onHover={(e, item) => {
              const col = item?.column === 'organ_type' ? 'organ' : item?.column;
              spotlightCellAndRow(
                e,
                { row: (item?.row) - 1, column: col },
                `${item?.row - 1}_${col}`
              );
            }}
            onRowClick={(e, item) => {
              const col = item?.column === 'organ_type' ? 'organ' : item?.column;
              setSelectionTableRow(
                e,
                { row: (item?.row), column: col },
                `${item?.row}`
              )
            }}
          />
        </Box>
      </Box>
    );
  }

  function CustomFooterStatusComponent(props) {
    return (
      <Box className="pagelessFooter">
        <Typography variant='caption'> <strong>Total Rows:</strong>  {props.rowCount.toString()}</Typography>
      </Box>
    );
  }

  function renderEntityTable(){
    return (<>
      <div className={"associationTableWrap associatedBulkEntityTable"} style={{ width: "100%" }}>
        <DataGrid
          apiRef={apiRef}
          className='HDT HDTdynamic condensed shortFooter w-100'
          rows={(bulkEntityRows && bulkEntityRows.length > 0) ? bulkEntityRows.map((row, idx) => ({ id: idx, "row": idx+1, ...row })) : [] }
          columns={columns}
          loading={loaders.uploadTable}
          disableVirtualization
          logLevel="info"
          slots={{
            footer: CustomFooterStatusComponent,
          }}
          slotProps={{
            footer: {rowCount: bulkEntityRows.length},
          }}
          hideFooterSelectedRowCount
          rowCount={bulkEntityRows && bulkEntityRows.length >0 ? bulkEntityRows.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
      
      {(fileData?.uploaded && !fileData.registered) && bulkEntityValidationErrors && bulkEntityValidationErrors.length > 0 && ( <>
        {renderErrorFrame()}
      </>)}
      <Box className="">
        <Typography variant='caption'>
          Please refer to the <a href={docs} target='_blank' rel="noreferrer">Bulk {type} file schema information</a>, and this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${type.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>
        </Typography>
      </Box>
    </>);
  }

  function renderSuccesTable(){
    let successRows = fileData?.regValidation?.success || [];
    return (<Box>
      <Box className="successAlertWrap">
      {/* <Alert  severity="info" className="mt-4 mb-0  " sx={{ borderRadius: "4px", background: "linear-gradient(180deg, #24F759 0%, #3B8C4F 100%) !important", color:"#D3FFD9", border:"3px solid #444a65" }}> */}
        <Alert className="mt-4 mb-0 successAlert" sx={{ borderRadius: "4px 4px 0px 0px" }}>
          <Box><strong>Success:</strong> The following rows registered successfully!</Box>
        </Alert>
      </Box>
      <div className={"associationTableWrap associatedBulkEntityTable successWrap"} style={{ width: "100%" }}>
        <DataGrid
          className='HDT shortFooter borderless noPage successReg w-100'
          rows={successRows}
          getRowId={(row) => row.uuid || row.id}
          columns={columnsSuccess}
          loading={loaders.uploadTable}
          slots={{ toolbar: GridToolbar }} 
          density="compact"
          logLevel="info"
          hideFooterSelectedRowCount
          rowCount={successRows && successRows.length >0 ? successRows.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
    </Box>);
  }

  function renderRegErrorTable(){
    let errorRows = fileData?.regValidation?.error || [];
    return (<>
      <Alert variant="filled" severity="error"className="mt-4 mb-0" sx={{borderRadius: "4px 4px 0px 0px" }}>
        <strong>Errors:</strong> The following rows were not registered. Please review the provided error messaging and try again.
      </Alert>
      <div className={"associationTableWrap associatedBulkEntityTable errorSetWrap regErrorTable mt-0 w-100"} >
          <DataGrid
            className='HDT errorSetTable shortFooter w-100'
          rows={errorRows}
          columns={errCols}
          loading={loaders.registration}
          density="compact"
          logLevel="info"
          initialState={{
            // pagination: {
            //   paginationModel: { pageSize: 10, page: 0 },
            // },
          }}
          // pageSizeOptions={[5, 10, 25, 40]}
          hideFooterSelectedRowCount
          rowCount={errorRows && errorRows.length >0 ? errorRows.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
      {(fileData?.uploaded && !fileData?.registered) && bulkEntityValidationErrors && bulkEntityValidationErrors.length > 0 && (
          <>{renderErrorFrame()}</>
        )}
    </>)
  }

  function calcRegDisabled(){
    let erCheck = bulkEntityValidationErrors && bulkEntityValidationErrors?.length > 0
    let upCheck = fileData.uploaded
    let ldCheck = loaders.uploadTable
    let calc = (erCheck === false && upCheck === true && ldCheck === false)
    if(calc){
      return false
    }else{
      return true
    }
     
  }

  return (<>

    {/* Main Upload Table */}
    {(!fileData?.registered)&&(
      <FormControl className="w-100">
          {renderEntityTable()}
      </FormControl>
    )}

    {/* Reg Success Table */}
    {(fileData?.uploaded && fileData?.registered && fileData?.regValidation?.success && fileData?.regValidation?.success.length > 0) && (
      <>
      <FormControl className="w-100">
        {renderSuccesTable()}  
      </FormControl>
    </>
    )}
    
    {/* Reg Error Table */}
    {/* {(fileData?.regValidation?.error && fileData?.regValidatio?.error.length)?.toString} */}
    {(fileData?.uploaded && fileData?.registered) && fileData?.regValidation?.error && fileData?.regValidation?.error.length > 0 && (
      <FormControl className="w-100">
        {renderRegErrorTable()}  
      </FormControl>
    )}

    {/* Upload Field/zone */}
  
    <Box className="uploadManager" sx={{ display: "inline-block", width: "100%", mt: 2 }}>
      {fileData.registered === false && (
        <Box className="text-left" onClick={(e)=>handleTriggerUpload(e)}>
          <input
            accept=".tsv, .csv"
            type="file"
            id="uploadBulk"
            name="BulkEntity"
            onClick={(e)=>handleFileWipe(e)}
            onChange={(e)=>handleFileGrab(e)}
            className="bulkTSVUp"/>
        </Box>
      )}
      <Box className="w-100">
        <Box className="float-left" sx={{display:"inline-block", minWidth:"150px", mr:2, float:"left"}}>
          <Collapse in={loaders.showGroupSelect}>
            <FormControl size="small">
              <InputLabel sx={{ color: "rgba(0, 0, 0, 0.38)" }} htmlFor="group_uuid">
                Group
              </InputLabel>
              <Select
                id="group_uuid"
                label="Group"
                onChange={(e)=>setFileData(prev => ({ ...prev, group: e.target.value }))}
                sx={{ borderTopLeftRadius: "4px", borderTopRightRadius: "4px", fontSize:"0.8em" }}
                value={fileData.group || (JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "")}>
                {userGroups && userGroups.map((group, index) => (
                  <MenuItem sx={{fontSize:"0.7em"}} key={(group.uuid)+"-i"+index} value={group.uuid}>{group.shortname}</MenuItem>
                ))}
              </Select> 
              <Typography variant="caption" color={"#444a65"}>
                You are a member of multiple Data Provider groups. <br /> 
                Please Select which one to apply.
              </Typography>
            </FormControl>
          </Collapse>
        </Box>
        <Box className="float-right" sx={{display:"inline-block", minWidth:"150px", mr:2, float:"right"}} > 
          {!fileData.registered && (
            <LoadingButton
              disabled={calcRegDisabled()}
              variant="outlined"
              sx={{float:"right"}}
              size="large" 
              loadingIndicator={<CircularProgress color="inherit" size={16} />}
              color="primary"
              loading={loaders.registration}
              onClick={handleRegister}
              loadingPosition="start"
              startIcon={<FontAwesomeIcon icon={faUpload} />}
              rel="noreferrer">
              Register
            </LoadingButton>
          )}
          {fileData.registered && (
            <Button
              variant="contained"
              size="large"
              color="primary"
              onClick={() => {
                window.location.reload();
              }}
              startIcon={<FontAwesomeIcon icon={faRepeat} />}>
              Restart
            </Button>
          )}
        </Box>
      </Box>      
    </Box>

    {/* Page Errors */}
    {pageErrors && (
      <Alert variant="filled" severity="error">
        <strong>Error:</strong> {JSON.stringify(pageErrors)}
      </Alert>
    )}

  </>);
}
