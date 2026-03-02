import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FormControl, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import {DataGrid} from "@mui/x-data-grid";
import {toTitleCase} from "../../utils/string_helper";
import Papa from 'papaparse';
import InputLabel from "@mui/material/InputLabel";
import MenuItem from '@mui/material/MenuItem';
import Select from "@mui/material/Select";
import Collapse from '@mui/material/Collapse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faFileCircleXmark, faUpload, faRepeat } from '@fortawesome/free-solid-svg-icons';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from "@mui/material/Alert";
import {ingest_api_upload_bulk_metadata} from '../../service/ingest_api';
import {ParsePreflightString} from '../ui/formParts.jsx';
import {genColWidth} from './tableBuilder.jsx';
import ErrorList from './ErrorList';
import {ParseRegErrorFrame, parseErrorMessage, TableErrorRowProcessing} from '../../utils/error_helper.jsx';
import LoadingButton from "@mui/lab/LoadingButton";
// @TODO: Address with Search Upgrades & Move all this column def stuff into a managing component in the UI directory, not the search directory
// import {COLUMN_DEF_CONTRIBUTORS} from '../../components/search/table_constants.jsx';
import Button from "@mui/material/Button";
// lodash removed (not used)

export function BulkMetaTable({ type,onDataChange }) {
  let [pageErrors, setPageErrors] = useState(null);
  let [file, setFile] = useState(null);
  let [fileData,setFileData] = useState({
    file: null,
    uploaded:false,
    group: JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "",
    rows:[],
  });
  let [bulkMetaValidationErrors, setBulkMetaValidationErrors] = useState([]);
  let [bulkMetaRows, setBulkMetaRows] = useState([]);
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
  let [columns, setColumns] = useState([]);
  

  // Handle file upload and parse bulkMeta
  function handleFileGrab(e) {
    dimSpotlight();
    console.debug('%c◉handleFileGrab Grabbing file ', 'color:#00ff7b');
    setBulkMetaValidationErrors([])
    highlightTableErrors("clear");
    setLoaders((prev) => ({ ...prev, uploadTable: true }));
    
    var grabbedFile = e.target.files[0];
    console.debug('%c◉ grabbedFile ', 'color:#00ff7b', grabbedFile, e.target, e.target.files);
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile = new File([grabbedFile], newName);
    
    console.debug('%c◉ newFile ', 'background:#00ff7b', newFile);
    if (newFile && newFile.name.length > 0) {
      setFileData ({
        file: newFile,
        captured:false,
        uploaded:false,
        rows:[],
        success:false,
      });
    
      Papa.parse(newFile, {
        download: true,
        skipEmptyLines: true,
        header: true,
        complete: data => {
          console.debug('%c◉PAPA COMPLESE data ', 'color:#00ff7b', data.data);
          // If none of the file fields are accounted for in expected columns, don't set the table data
          let detectedFields = data?.meta?.fields || [];
          console.debug(data?.meta?.fields, columns.map(c => c.field));
          // Map detected field names (e.g. "lab_id") into DataGrid column defs
          if (detectedFields && detectedFields.length > 0) {
            const mappedColumns = detectedFields.map((fieldName) => ({
              field: fieldName,
              headerName: toTitleCase(fieldName.replace(/_/g, ' ')),
              flex: 1,
            }));
            console.debug('%c◉ mappedColumns ', 'color:#00ff7b', mappedColumns);
            setColumns(mappedColumns);
          }
          setBulkMetaRows(data.data);
          // console.debug('%c◉ newFile ', 'color:#00ff7b', newFile);
          setFile(newFile);
          setFileData({...fileData, 
            file: newFile,
            rows: (data.data),
            captured: true,
          });
          setLoaders((prev) => ({ ...prev, uploadTable: false }));
          console.debug('%c◉ parsed fileData ', 'background:#E096FF', fileData, newFile, bulkMetaRows, data?.data);
        }
      });
      
    } else {
      //console.debug("No Data??");
      setLoaders((prev) => ({ ...prev, uploadTable: false }));
    }
  }

  useEffect(() => {
    onDataChange({data: bulkMetaRows, errors: bulkMetaValidationErrors})
    console.debug('%c◉ bulkMetaRows ', 'color:#00ff7b', bulkMetaRows);
  }, [bulkMetaRows, bulkMetaValidationErrors, onDataChange])

  // Clear any active spotlight timeout on unmount
  useEffect(() => {
    return () => {
      if (spotlightTimeoutRef.current) {
        clearTimeout(spotlightTimeoutRef.current);
        spotlightTimeoutRef.current = null;
      }
    };
  }, []);

  function handleFileUpload(){
    console.debug('%c◉ fileData ', 'color:#0033FF', fileData, file);
    setLoaders((prev) => ({ ...prev, uploadTable: true }));
    let newFile = file;
    let data = fileData.rows;
    console.debug('%c◉ handleFileUpload newFile ',  'color:#fff; background:#0033FF;', newFile, data);
    ingest_api_upload_bulk_metadata(toTitleCase(type), newFile)
      .then((res) => {
        console.debug('%c◉ res ', ' background:#0033FF;', res);
        if(res.status >= 200 && res.status < 300){
          console.debug('%c◉ RES ACCEPTED ', 'color:#0033FF');
            setFileData({
            ...fileData,
            uploaded: true,
            success: true
          });
        }else if(res?.error?.response?.data?.data || res?.error){
          let respSet = res?.error?.response?.data?.data || res?.error
          console.debug('%c◉ res?.error? Object Array ', 'background:#0033FF', respSet);
          try{
            const obj = respSet || {};
            const errorsArray = Object.keys(obj)
              .sort((a, b) => Number(a) - Number(b))
              .map(k => ({ column: "", error: obj[k], row: "" }));
            // Keep the raw array for now
            setBulkMetaValidationErrors(errorsArray)
            let errorSet = TableErrorRowProcessing(errorsArray)
            console.debug('%c◉ TableErrorRowProcessing errorSet ', 'background:#0033FF', respSet);
            // Replace validation errors with the normalized set
            setBulkMetaValidationErrors(errorSet)
            highlightTableErrors(errorSet);
            
          }catch(error){
            console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#FF006A', error);
          }
        }else if(res?.res?.response?.data){
          console.debug('%c◉ .res?.response?.data Errors ', 'background:#0033FF', );
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
              setBulkMetaValidationErrors([{
                "error": errString,
                "name": name ? name : "",
              }])
            }catch(error){
              //console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#00ff7b', error);
            }
          }else if(!errorSet[0].row){
            // Non Row based Response
            console.debug('%c◉ Nonrow ', 'background:#0033FF', );
            try{
              setBulkMetaValidationErrors([{
                "column": "",
                "error": errorSet.toString(),
                "row": ""
              }])
            }catch(error){
              console.debug('%c◉trycatch  errorPreprocessCheck', 'background:#0033FF', error);
            }
          }else{
            //  IVT Row by Row Error Handling
            try{
              errorSet = errorSet.sort((a, b) => a.row - b.row);
              setBulkMetaValidationErrors(errorSet);
              highlightTableErrors(errorSet);
            }catch(error){
              // console.debug('%c◉ parsedErrorRows trycatch  ', 'color:#00ff7b', error);
            }
          }
          console.debug('%c◉ "Please Review the following validation errors and re-upload your file." ', 'color:#00ff7b', );
          setPageErrors((prevValues) => ({
            ...prevValues,
            'bulkMeta': "Please Review the following validation errors and re-upload your file.",
          }))
        }else if(res?.error?.response?.data?.error){ // 400 / too many
          console.debug('%c◉ 400! ', 'color:#00ff7b', res?.error?.response?.data?.error );
          try{
            setBulkMetaValidationErrors([{
              "name": "Too Many",
              "error": res?.error?.response?.data?.error,
            }])
          }catch(error){
            console.debug('%c◉trycatch  errorPreprocessCheck', 'background:#0033FF', error);
          }
  
        }else if(res?.error){
          setPageErrors((prevValues) => ({
            ...prevValues,
            'bulkMeta': "Please Review the following validation errors and re-upload your file.",
          }))

            
        }else{
          setPageErrors((prevValues) => ({
            ...prevValues,
            'bulkMeta': "An error occurred during file upload. Please review the message and try again. || "+res.toString(),
          }))
          console.error("IDK" , res);
        }
        //setValidatingBulkMetaUpload(false)
        setLoaders((prev) => ({ ...prev, uploadTable: false, }));
        let showGroupCheck = calcRegDisabled();
        if(userGroups.length > 1 && showGroupCheck === true ){
          console.debug('%c◉ SHOWING ', 'color:#00ff7b', );
          // setLoaders((prev) => ({ ...prev, showGroupSelect: true }));
        } 
      })
      .catch(() => {
        //console.debug('%c◉ FAILURE ', 'color:#ff005d', error);
      });
      console.debug('%c◉ DATA CHECKIN: ', 'background:#EEA3FF', bulkMetaRows, fileData);
  }

  function handleFileWipe() {
    console.debug('%c◉ FILE WIPE ', 'color:#4000FF');
    setBulkMetaRows([]); 
    setFileData({
      file:null,
      captured:false,
      uploaded:false,
      rows:[],
      success:false,
    })
  }


  function highlightTableErrors(errorSet){
    console.debug('%c◉ highlightTableErrors ', 'color:#D0FF00', errorSet);
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
          
        }
      }
    }else{
      try{
        dimSpotlight();
      }catch(err){
        console.debug('highlightTableErrors clear error', err);
      }
    }
  }

  function spotlightCellAndRow(e, error, target){
    // Turn off Old Lights
    document.querySelector(`[data-spotlight="true" ]`)?.removeAttribute('data-spotlight');
    let olds = document.querySelectorAll(`[data-spotlight="true" ]`);
    olds.forEach(el => el.removeAttribute('data-spotlight', 'true'));
    // Attach data-spotlight to both the error list item and the cell, so both will be highlighted
    let spotlightTargets = document.querySelectorAll(`[data-target="${target}" ]`);
    const hasUndefinedErrRow = Array.from(spotlightTargets).some(
      (el) => el?.id === 'errListRow-undefined'
    );
    if (!hasUndefinedErrRow) {
      spotlightTargets.forEach(el => el.setAttribute('data-spotlight', 'true')); 
      // Add bonus row highlight on table when spotlit
      let errorRow = document.querySelector(`[aria-rowindex="${error.row+1}" ]`);
      errorRow?.setAttribute('data-spotlight', 'true');
    }
    setTimeout(() => {
      spotlightTargets.forEach(el => el.removeAttribute('data-spotlight', 'true'));
    }, 4000);

  }

  function dimSpotlight(){
    let oldDataError = document.querySelectorAll('[data-error]');
    oldDataError.forEach(el => el.removeAttribute('data-error'));
    let oldDataCellError= document.querySelectorAll('[data-cell-error]');
    oldDataCellError.forEach(el => el.removeAttribute('data-cell-error'));
  }

  function renderEntityTable(){
    return (<>
      <div className={"associationTableWrap associatedBulkMetaTable"} style={{ width: "100%" }}>
        <DataGrid
          className='HDT shortFooter w-100'
          rows={fileData?.rows.map((row, idx) => ({ id: idx, "row": idx+1, ...row }))}
          columns={columns}
          loading={loaders.uploadTable}
          density="compact"
          logLevel="info"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 40]}
          hideFooterSelectedRowCount
          rowCount={fileData?.rows && fileData?.rows.length >0 ? fileData?.rows.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
      <Box className="">
        <Typography variant='caption'>
          Please refer to the <a href={docs} target='_blank' rel="noreferrer">Bulk {type} file schema information</a>, and this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${type.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>
        </Typography>
      </Box>
    </>);
  }

  function renderSuccesTable(){
    return (<>
      {/* <Alert variant="filled" severity="info" className="mt-4 mb-0" sx={{ borderRadius: "4px 4px 0px 0px", background: "linear-gradient(180deg, #585E7A 0%, #444A65 100%) !important" }}> */}
        {/* <strong>Success:</strong> The following rows registered successfully! */}
      {/* </Alert> */}

      <Alert className="my-2 successAlert" sx={{ borderRadius: "4px 4px 0px 0px" }}>
        <Box><strong>Success:</strong> The following rows were Uploaded successfully!</Box>
      </Alert>
      <div className={"associationTableWrap associatedBulkMetaTable successWrap"} style={{ width: "100%" }}>
        <DataGrid
          className='HDT shortFooter successReg w-100'
          rows={fileData?.rows.map((row, idx) => ({ id: idx, "row": idx+1, ...row }))}
          getRowId={(row) => row.uuid || row.id}
          columns={columns.slice(0,5)}
          loading={loaders.uploadTable}
          density="compact"
          logLevel="info"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 40]}
          hideFooterSelectedRowCount
          rowCount={fileData?.success && fileData?.success.length >0 ? fileData.success.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
    </>);
  }


  function calcRegDisabled(){
    let erCheck = bulkMetaValidationErrors && bulkMetaValidationErrors?.length > 0
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
    {(!fileData?.uploaded)&&(
      <FormControl className="w-100">
          {renderEntityTable()}
      </FormControl>
    )}

    {/* Reg Success Table */}
    {(fileData?.success) && (
      <>
      <FormControl className="w-100">
        {renderSuccesTable()}  
      </FormControl>
    </>
    )}
    
    {/* Upload Field/zone */}
    
      <Box className="uploadManager" sx={{ display: "inline-block", width: "100%", mt: 2 }}>
        <Box className="w-100" sx={{display:"flex", justifyContent: "space-between"}}>
          {fileData.uploaded === false && (<>
            <Box className="" sx={{display:"flex"}} >
              <input
                accept=".tsv, .csv"
                type="file"
                id="uploadBulk"
                name="BulkMeta"
                onClick={(e)=>handleFileWipe(e)}
                onChange={(e)=>handleFileGrab(e)}
                className="bulkTSVUp"/>
            </Box>
            <Box className="" sx={{display:"flex", flexDirection:"column" }} >
              <Box sx={{display:"flex", marginBottom:"30px"}}>
                <Button
                  variant="contained"
                  size="large"
                  disabled={loaders.uploadTable || !fileData.captured}
                  color="primary"
                  fullWidth
                  onClick={() => {
                    handleFileUpload();
                  }}
                  startIcon={<FontAwesomeIcon icon={faUpload} />}>
                  Upload
                </Button>    
              </Box>
              <Box>
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
              </Box>
            </Box>
          </>)}
        </Box>

        <Box className="float-left" sx={{display:"inline-block", minWidth:"150px", mr:2, float:"right"}} > 
          {fileData.uploaded && (
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

    {/* Page Errors */}
    {pageErrors && (
      <Alert variant="filled" severity="error">
        <strong>Error:</strong> {JSON.stringify(pageErrors)}
      </Alert>
    )}
    {/* <GroupModal open={loaders.showGroupModal} selectionAction={(e,group)=>closeGroupModal(e,group)} closeGroupModal={}                                                              /> */}
    {/* <ViewDebug data={{
      uploaded: fileData.uploaded, 
      registered: fileData.registered, 
      upOnly: (fileData.uploaded && !fileData.registered), 
      bulkMetaValidationErrors: bulkMetaValidationErrors,
      Len: bulkMetaValidationErrors?.length

    }}/> */}

  </>);
}
