import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FormControl, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import {DataGrid} from "@mui/x-data-grid";
import Papa from 'papaparse';
import {readString} from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ValueFormatterParams, ValueGetterParams } from "@mui/x-data-grid";
import { faExclamationTriangle, faFileCircleXmark, faUpload } from '@fortawesome/free-solid-svg-icons';
// import {ingest_api_validate_bulkEntity} from '../../service/ingest_api';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import {
  ingest_api_bulk_entities_upload,
  ingest_api_bulk_entities_register,
  ingest_api_users_groups
} from '../../service/ingest_api';
import {ParsePreflightString} from '../ui/formParts.jsx';
import {ViewDebug} from '../ui/devTools.jsx';
import {ParseRegErrorFrame, parseErrorMessage} from '../../utils/error_helper.jsx';
import {toTitleCase} from "../../utils/string_helper";
import LoadingButton from "@mui/lab/LoadingButton";
// @TODO: Address with Search Upgrades & Move all this column def stuff into a managing component in the UI directory, not the search directory
// import {COLUMN_DEF_CONTRIBUTORS} from '../../components/search/table_constants.jsx';
import {
  COLUMN_DEF_BULK_SAMPLES, 
  COLUMN_DEF_BULK_DONORS, 
  COLUMN_DEF_SAMPLE, 
  COLUMN_DEF_DONOR, 
  COLUMN_DEF_BULK_ERRORS, 
  handleOpenPage } from '../ui/tableBuilder';
import Button from "@mui/material/Button";
import {fontGrid} from '@mui/material/styles/cssUtils.js';
import LinearProgress from '@material-ui/core/LinearProgress';
import * as prettyBytes from 'pretty-bytes';
import _ from 'lodash';

export function BulkEntitiesTable({ temp_id,type,onDataChange }) {
  let [pageErrors, setPageErrors] = useState(null);
  let [fileData,setFileData] = useState({
    file: null,
    temp_id: null,
    uploaded:false,
    registered:false,
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
    showRUIModal: false,
    RUIRender:null,
  });
  let docs ="https://docs.hubmapconsortium.org/bulk-registration/"+type.toLowerCase()+"-bulk-reg.html"
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
  const colSelectionComplete = useCallback((type) => {
    type = type.toLowerCase();
    switch (type) {
      case "sample":
        return COLUMN_DEF_SAMPLE;
      case "donor":
        return COLUMN_DEF_DONOR;
      default:
        return COLUMN_DEF_SAMPLE;
    }
  }, []); 
  const columnsSuccess = (type ? colSelectionComplete(type) : COLUMN_DEF_SAMPLE);
  console.debug('%c◉ columnsSuccess ', 'color:#00ff7b', columnsSuccess);
  // Format success columns: remove created_by fields and make hubmap_id a clickable Button
  const columnsSuccessFormatted = columnsSuccess
    .filter(col => col.field !== 'created_by_user_displayname' && col.field !== 'created_by_user_email')
    .map((col) => {
      if (col.field === 'hubmap_id') {
        return {
          ...col,
          renderCell: (params: ValueFormatterParams) => (
            <Button
              fullWidth
              variant="contained"
              size="small"
              className="m-2"
              onClick={(e) => handleOpenPage(e, params.value)}>
              {params.value}
            </Button>
          ),
        };
      }
      return col;
    });
  const errCols = columns.map((col) => {
    console.debug('%c◉ col ', 'color:#00ff7b', col);
    if (col.field === 'hubmap_id') {
      return {
        ...col,
        renderCell: (params: ValueFormatterParams) => (
          <Button
            fullWidth
            variant="contained"
            className="m-2"
            onClick={(e) => handleOpenPage(e, params.value)}>
            {params.value}
          </Button>
        ),
      };
    }
    return col;
  });
  const hiddenFields = useMemo(() => {
    const base = [
      "created_by_user_displayname",
      "lab_tissue_sample_id",
      "lab_donor_id",
      "specimen_type",
      "organ",
      "registered_doi",
    ];
    const hf = [...base];
    return hf;
  }, []);

  const columnFieldFilter = useMemo(() => {
    const obj = {};
    hiddenFields.forEach((value) => {
      obj[value] = false;
    });
    return obj;
  }, [hiddenFields]);


  // Sync local BulkEntity with prop changes
  // useEffect(() => {
  //   setBulkEntityRows(temp_id);
  // }, [temp_id]);

  useEffect(() => {
    if (onDataChange) {
      //console.debug('%c◉ if onDataChange ', 'color:#00ff7b',bulkEntityRows );
      onDataChange({data: bulkEntityRows, errors: bulkEntityValidationErrors});
    }
  }, [bulkEntityRows, bulkEntityValidationErrors]);

  // Handle file upload and parse bulkEntity
  function handleFileGrab(e) {
    console.debug('%c◉ Grabbing file ', 'color:#00ff7b');
    setBulkEntityValidationErrors([])
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
          console.debug('%c◉ data ', 'color:#00ff7b', data);
          // If none of the file fields are accounted for in expected columns, don't set the table data
          let fileCols = data.meta.fields || [];
          let expectedCols = columns.map(col => col.field);
          let matchingCols = fileCols.filter(col => expectedCols.includes(col));

          setBulkEntityRows(matchingCols.length > 0 ? data.data : []);
          setFileData({...fileData, 
            rows: (matchingCols.length > 0 ? data.data : []),
            uploaded: true,
            registered: false,
          });
          setLoaders((prev) => ({ ...prev, uploadTable: false, }));
          handleFileUpload(newFile);
        }
      });
      
    } else {
      //console.debug("No Data??");
    }
  }

  function handleFileUpload(newFile){
    ingest_api_bulk_entities_upload(type+"s", newFile)
      .then((res) => {
        console.debug('%c◉ ingest_api_bulk_entities_upload res ', 'color:#fff; background:#0033FF;',res.status, res, res?.results?.temp_id);
        if(res.status === 200 || res.status === 201){
          setFileData({
            ...fileData,
            temp_id: res?.results?.temp_id,
            uploaded: true,
          });
          setBulkEntityValidationErrors([])
          highlightTableErrors([]);
        }else if(res?.error?.response?.data?.data){ 
          let respSet = res?.error?.response?.data?.data
          console.debug('%c◉ res?.error? Object Array ', 'color:#00ff7b', respSet);
          try{
            const obj = respSet || {};
            const errorsArray = Object.keys(obj)
              .sort((a, b) => Number(a) - Number(b))
              .map(k => ({ column: "", error: obj[k], row: "" }));
            // Keep the raw array for now
            setBulkEntityValidationErrors(errorsArray)

            // Build a normalized error set: ensure we operate on strings
            const errorSet = errorsArray.map((item) => {
              const message = (typeof item === 'string') ? item : (item && item.error ? item.error : '');
              const msgStr = String(message || '');
              const lower = msgStr.toLowerCase();
              // If message indicates a missing required header, capture the column name
              const requiredMatch = msgStr.match(/\b([A-Za-z0-9_]+)\s+is\s+a\s+required\s+header\b/i);
              if (requiredMatch) {
                console.dir('%c◉ requiredMatch ', 'color:#00ff7b', requiredMatch);
                return {
                  column: requiredMatch[1],
                  error: msgStr,
                  row: "",
                };
              }
              // If message indicates an unaccepted field, capture the column name
              const notAcceptedMatch = msgStr.match(/\b([A-Za-z0-9_]+)\s+is\s+not\s+an\s+accepted\s+field\b/i);
              if (notAcceptedMatch) {
                console.dir('%c◉ notAcceptedMatch ', 'color:#00ff7b', notAcceptedMatch);
                return {
                  column: notAcceptedMatch[1],
                  error: msgStr,
                  row: "",
                };
              }
              const rowMatch = msgStr.match(/Row Number:\s*(\d+)\./i);
              const row = (rowMatch ? parseInt(rowMatch[1], 10) : null) + 1;
              const colMatch = msgStr.match(/\b([A-Za-z0-9_]+)\s+field\b/i);
              const column = colMatch ? colMatch[1] : "";
              return {
                column,
                error: msgStr,
                row,
              };
            });
            console.log(errorSet)
            // Replace validation errors with the normalized set
            setBulkEntityValidationErrors(errorSet)
            highlightTableErrors(errorSet);
          }catch(error){
            console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#FF006A', error);
          }
        }else if(res?.res?.response?.data){
          console.debug('%c◉ .res?.response?.data Errors ', 'color:#00ff7b', );
          let errorSet = res.res.response.data.description
          // console.debug('%c◉ typeof res?.res?.response?.data?.description ', 'color:#00ff7b',typeof res?.res?.response?.data?.description );
          if(res?.res?.response?.data?.code === 406 && typeof res?.res?.response?.data?.description?.description === 'string'){
            let parsedPreflight = ParsePreflightString(decodeURI(errorSet?.description));
            // console.debug('%c◉ parsedPreflight ', 'color:#00ff7b',parsedPreflight );
            let errString;
            let name = res?.res?.response?.data?.description?.name ? res?.res?.response?.data?.description?.name : null;
            for (let i = 0; i < parsedPreflight.length; i++) {
              // console.debug('%c◉ parsedPreflight[i] ', 'color:#00ff7b', parsedPreflight[i]);
              const item = parsedPreflight[i];
              const itemStr = (item && typeof item === 'object') ? JSON.stringify(item) : String(item);
              errString = itemStr;
              // console.debug('%c◉ errString ', 'color:#00ff7b', errString);
              if (item && typeof item === 'object') {
                // console.debug('%c◉ item ', 'color:#00ff7b', item);
                for (const [key, value] of Object.entries(item)) {
                  // name = key;
                  // console.debug('%c◉ key,value ', 'color:#00ff7b', key, value);
                  // console.debug('%c◉ val ', 'color:#00ff7b', value);
                  if (item && typeof item === 'object') {
                    for (const [k, v] of Object.entries(value)) {
                        // console.debug('%c◉ kv ', 'color:#00ff7b', k,v);
                        errString = `${key}: \n ${k} |  ${v}`;
                    }
                    // console.debug('%c◉ errString ', 'color:#00ff7b', errString);
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
            console.debug('%c◉ Nonrow ', 'color:#00ff7b', );
            try{
              setBulkEntityValidationErrors([{
                "column": "",
                "error": errorSet.toString(),
                "row": ""
              }])
              //setValidatingBulkEntityUpload(false)
            }catch(error){
              //setValidatingBulkEntityUpload(false)
              //console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#00ff7b', error);
            }
          }else{
            //  IVT Row by Row Error Handling
            try{
              errorSet = errorSet.sort((a, b) => a.row - b.row);
              setBulkEntityValidationErrors(errorSet);
              //setValidatingBulkEntityUpload(false)
              highlightTableErrors(errorSet);
            }catch(error){
              //setValidatingBulkEntityUpload(false)
              // console.debug('%c◉ parsedErrorRows trycatch  ', 'color:#00ff7b', error);
            }
          }
          console.debug('%c◉ "Please Review the following validation errors and re-upload your file." ', 'color:#00ff7b', );
          // setFormErrors((prevValues) => ({
          //   ...prevValues,
          //   'bulkEntity': "Please Review the following validation errors and re-upload your file.",
          // }))
        }else{
          console.error("IDK" , res);
          //setValidatingBulkEntityUpload(false)
        }
        //setValidatingBulkEntityUpload(false)
      })
      .catch((error) => {
        //console.debug('%c◉ FAILURE ', 'color:#ff005d', error);
      });
  }

  function handleFileWipe(e) {
    console.debug('%c◉ FILE WIPE ', 'color:#4000FF', );
    setFileData({
      file:null,
      temp_id:null,
      registered:false,
      uploaded:false,
    })

  }

  
  function handleRegister(e){
    console.debug('%c◉ HANDLE REGISTER ', 'color:#4000FF',fileData );
    setLoaders((prev) => ({ ...prev, registration: true }));
    let fileRef = {"temp_id":fileData.temp_id,"group_uuid":"5bd084c8-edc2-11e8-802f-0e368f3075e8"}
    try{ // this.props.bulkType, fileData, JSON.parse(localStorage.getItem("info")).groups_token
      ingest_api_bulk_entities_register(type, fileRef)
      .then((resp) => {
        setFileData((prev) => ({ ...prev, registered: true }));
        var serverResp;
        if(resp.response ){
          serverResp = resp.response
        }else if(resp.error && resp.error.response){
          serverResp = resp.error.response
        }else{
          serverResp = resp;
        }
        console.debug('%c◉ serverResp ', 'color:#00ff7b', serverResp);
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
          setFileData({
            ...fileData,
            rows: dataRows,
          });
          setBulkEntityRows(dataRows);
            
          setPageErrors(null);

        }else if( 
          (resp.response && resp.response.status && resp.response.status === 504) || 
          (resp.error  && resp.error.response  && resp.error.response.status === 504) ){
          console.debug('%c⊙504', 'color:#ff005d' );
          ParseRegErrorFrame(resp);
        }else if(
          (resp.response && resp.response.status && resp.response.status === 500) || 
          (resp.error  && resp.error.response && resp.error.response.status === 500)){
          console.debug('%c⊙500', 'color:#ff005d' );
          var grabFullError = {status:serverResp.data.status,data:serverResp.data.data}
          setPageErrors({ status: 'server', message: 'Registration Failure', detail: grabFullError });
          console.debug('handleErrorCompiling', grabFullError);
        }else if (resp.results && resp.results.data && resp.status === 207) {
        // Partial Success
          console.debug('%c⊙207', 'color:#f4d006' );

          // Preserve original ordering from the response and retain the original keys
          const entries = Object.entries(resp.results.data || {});
          // Build error rows with a unique id and a 1-based `row` value equal to the original key
          var errRows = entries
            .filter(([key, val]) => val && val.error)
            .map(([key, val], i) => ({ id: `err-${i}`, row: Number(key), error: val.error }));
          // Keep success rows intact (original response objects)
          var successRows = entries
            .filter(([key, val]) => !(val && val.error))
            .map(([key, val]) => (val));
          console.debug('%c◉ errRows ', 'background:#00ff7b', errRows);
          console.debug('%c◉ successRows ', 'background:#00ff7b', successRows);

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
        console.debug( error.stack );
        setPageErrors({ submit_error: error, error_status: true, error_message_detail: parseErrorMessage(error), error_message: 'Error' });
        setLoaders(prev => ({ ...prev, registration: false }));
      });       
    }catch(error){
      setPageErrors({ submit_error: error, error_status: true, error_message_detail: parseErrorMessage(error), error_message: 'Error' });
      console.debug("SUBMIT error", error)
      setLoaders(prev => ({ ...prev, registration: false }));
    }
    
  }

  function highlightTableErrors(errorSet){
    console.debug('%c◉ highlightTableErrors ', 'color:#D0FF00', errorSet);
    if(errorSet && errorSet.length > 0){
      for (const error of errorSet) {
        let errorRow = document.querySelector(`[aria-rowindex="${error.row}" ]`);
        console.debug('%c◉ errorRow ', 'color:#00ff7b', );
        errorRow.setAttribute('data-error','true')
        let cell = errorRow.querySelector(`[data-field="${error.column}" ]`);
        console.debug('%c◉ cell ', 'color:#00ff7b', );
        cell.setAttribute('data-error','true')
      }
    }else{
      try{
        const oldErrorEls = document.querySelectorAll('[data-error]');
        console.debug('%c◉ clearing out old errs: ', 'color:#00ff7b', oldErrorEls);
        oldErrorEls.forEach(el => el.removeAttribute('data-error'));

      }catch(err){
        console.debug('highlightTableErrors clear error', err);
      }
    }
  }



    // if(errorSet && errorSet.length > 0){
    //   for (const error of errorSet) {
    //     const errorRow = document.querySelector(`[aria-rowindex="${error.row}" ]`);
    //     if (!errorRow) continue;
    //     errorRow.setAttribute('data-error','true');
    //     const cell = errorRow.querySelector(`[data-field="${error.column}" ]`);
    //     if (cell) cell.setAttribute('data-error','true');
    //   }
    // }else{
    //   // Remove any previously-set data-error attributes
      
    // }
  // }

  
  // Renders bulkEntity errors as HTML list
  function renderBulkEntityErrors() {
    return (
      <Box>
        {Array.isArray(bulkEntityValidationErrors) && bulkEntityValidationErrors.map((item, i) => {
          let rowStart 
          if(item?.row){
            rowStart = (<strong>Row: {(item?.row)-1} &nbsp;{item?.column?.toString()} | </strong>)
          }else if(item?.name){
            rowStart = (<strong>{item?.name.toString()} | </strong> )
          }else if(item?.column){
            rowStart = (<strong>{item?.column.toString()} | </strong> )
          }else{

          }
          return (
            <Typography
              key={i}
              variant="caption"
              style={{
                display: "inline-flex",
                // justifyContent: "space-between",
                alignItems: "left",
                width: "100%",
                wordBreak: "break-word",}}>
                  {rowStart} &nbsp; <span style={{float: "right"}}> {item?.error.toString().replace(/^.*value "([^"]+)"/, 'value "$1"')}</span>
            </Typography>
          );
        } )}
      </Box>
    );
  }

  function renderErrorFrame(){
    return (
      <Box className="HDT errorFrame mt-4" >
        {!fileData.registered && (
          <Typography className='preamble'> 
            <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-2 red' />
            The following errors were encountered when trying to process your data. Please review the messages below and try again.
          </Typography>
        )}
        {bulkEntityRows && bulkEntityRows.length <= 0 &&(
          <Typography className='preamble' variant='caption' component={"p"} sx={{ width: "100%", borderBottom: "1px solid #00000030", background: '#ffe6e6', color: '#3E0000', padding: '5px 10px' }}> 
            <FontAwesomeIcon icon={faFileCircleXmark} color="red" className='mr-2 red' /> Additionally, no valid columns were found in the uploaded file, so no data can be displayed. Please ensure your file matches the expected format.  
          </Typography>
        )}
        {fileData.registered && (
          <Typography className='preamble'> 
            <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-2 red' />
            The following rows were not accepted; Please review validation messages and try again. 
          </Typography>
        )}
        <Box>
          {renderBulkEntityErrors()}
        </Box>
      </Box>
    )
  }

  function renderEntityTable(){
    return (<>
      <div className={"associationTableWrap associatedBulkEntityTable"} style={{ width: "100%" }}>
        MUP <DataGrid
          className='HDT shortFooter w-100'
          rows={(bulkEntityRows && bulkEntityRows.length > 0) ? bulkEntityRows.map((row, idx) => ({ id: idx, ...row })) : []  }
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
          rowCount={bulkEntityRows && bulkEntityRows.length >0 ? bulkEntityRows.length : 0}
          sx={{
            fontSize:"0.75em",
            border: "none",
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
            background: "rgba(0, 0, 0, 0.04)",
          }} 
        />
      </div>
      
      {(fileData?.uploaded && !fileData.registered ) && bulkEntityValidationErrors && bulkEntityValidationErrors.length > 0 &&(<>
        {renderErrorFrame()}
      </>)}
      <Box className="">
        <Typography variant='caption'>
          Please refer to the <a href={docs} target='_blank' rel="noreferrer">Bulk {type} file schema information</a>, and this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${type.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>
        </Typography>
      </Box>
    </>);
  }

  // function renderInvaldEntityTable(){
  //   return (<>
  //     <div className={"associationTableWrap associatedBulkEntityTable errorSetWrap mt-4"} style={{ width: "100%" }}>
  //       IET <DataGrid
  //         className='HDT errorSetTable shortFooter w-100'
  //         rows={(bulkEntityRows && bulkEntityRows.length > 0) ? bulkEntityRows.map((row, idx) => ({ id: idx, ...row })) : []  }
  //         columns={columns}
  //         loading={loaders.registration}
  //         density="compact"
  //         logLevel="info"
  //         initialState={{
  //           pagination: {
  //             paginationModel: { pageSize: 10, page: 0 },
  //           },
  //         }}
  //         pageSizeOptions={[5, 10, 25, 40]}
  //         hideFooterSelectedRowCount
  //         rowCount={bulkEntityRows && bulkEntityRows.length >0 ? bulkEntityRows.length : 0}
  //         sx={{
  //           fontSize:"0.75em",
  //           border: "none",
  //           '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
  //           background: "rgba(0, 0, 0, 0.04)",
  //         }} 
  //       />
  //     </div>
  //     {(fileData?.uploaded && fileData?.registered ) && bulkEntityValidationErrors && bulkEntityValidationErrors.length > 0 &&(
  //       <>{renderErrorFrame()}</>
  //     )}
  //   </>)
  // }


  function renderSuccesTable(){
    let successRows = fileData?.regValidation?.success || [];
    return (<>
      <Alert variant="filled" severity="info" className="mt-4 mb-0" sx={{borderRadius: "4px 4px 0px 0px",  background: "linear-gradient(180deg, #585E7A 0%,  #444A65 100%) !important" }}>
        <strong>Success:</strong> The following rows registered successfully!
      </Alert>
      <div className={"associationTableWrap associatedBulkEntityTable successWrap"} style={{ width: "100%" }}>
        <DataGrid
          className='HDT shortFooter successReg w-100'
          rows={successRows}
          getRowId={(row) => row.uuid || row.id}
          columns={columnsSuccessFormatted}
          columnVisibilityModel={columnFieldFilter}
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
          rowCount={successRows && successRows.length >0 ? successRows.length : 0}
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

  function renderRegErrorTable(){
    let errorRows = fileData?.regValidation?.error || [];
    return (<>
      <Alert variant="filled" severity="error"className="mt-4 mb-0" sx={{borderRadius: "4px 4px 0px 0px" }}>
        <strong>Errors:</strong> The following rows were not registered. Please review the provided error messaging and try again.
      </Alert>
      <div className={"associationTableWrap associatedBulkEntityTable errorSetWrap regErrorTable mt-0 w-100"} >
        <DataGrid
          className='HDT errorSetTable  shortFooter w-100'
          rows={errorRows}
          columns={COLUMN_DEF_BULK_ERRORS}
          loading={loaders.registration}
          density="compact"
          logLevel="info"
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
          }}
          pageSizeOptions={[5, 10, 25, 40]}
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
      {(fileData?.uploaded && fileData?.registered ) && bulkEntityValidationErrors && bulkEntityValidationErrors.length > 0 &&(
        <>{renderErrorFrame()}</>
      )}
    </>)
  }



  return (<>

    {/* Main Upload Table */}
    {(!fileData?.registered)&&(
      <FormControl className="w-100">
          {renderEntityTable()}
      </FormControl>
    )}

    {/* Reg Success Table */}
    {(fileData?.uploaded && fileData?.registered )&&( <>
      <FormControl className="w-100">
        {renderSuccesTable()}  
      </FormControl>
    </>)}
    
    {/* Reg Error Table */}
    {/* {(fileData?.regValidation?.error && fileData?.regValidatio?.error.length)?.toString} */}
    {(fileData?.uploaded && fileData?.registered ) && fileData?.regValidation?.error && fileData?.regValidation?.error.length > 0 &&( <>
      <FormControl className="w-100">
        {renderRegErrorTable()}  
      </FormControl>
    </>)}

    {/* Upload Field/zone */}
    <Box className="uploadManager" sx={{display:"inline-block", width:"100%", mt:2}}>
      <Box className="text-left">
        <input
          accept=".tsv, .csv"
          type="file"
          id="FileUploadContriubtors"
          name="BulkEntity"
          onClick={(e)=>handleFileWipe(e)}
          onChange={(e)=>handleFileGrab(e)}
          className="bulkTSVUp"/>
      </Box>

      <Box sx={{float:"right", display:"inline-block", }}>
        <LoadingButton
          disabled={!fileData.temp_id}
          variant="outlined"
          size="large"
          loadingIndicator={<CircularProgress color="inherit" size={16} />}
          color="primary"
          loading={loaders.registration}
          onClick={(e)=>handleRegister(e)}
          loadingPosition="start"
          startIcon={<FontAwesomeIcon icon={faUpload} />}
          rel="noreferrer">
          Register
        </LoadingButton>
      </Box>      
    </Box>
    
    {/* Page Errors */}
    {pageErrors && (
      <Alert variant="filled" severity="error">
        <strong>Error:</strong> {JSON.stringify(pageErrors)}
      </Alert>
    )}
    <ViewDebug data={{
      uploaded: fileData.uploaded, 
      registered: fileData.registered, 
      upOnly: (fileData.uploaded && !fileData.registered), 
      regValidationError: fileData?.regValidation?.error, 
    }}/>

  </>);
}
