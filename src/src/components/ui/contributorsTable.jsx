import React, { useState, useEffect } from 'react';
import { FormControl, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import {DataGrid} from "@mui/x-data-grid";
import Papa from 'papaparse';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import {ingest_api_validate_contributors} from '../../service/ingest_api';
// @TODO: Address with Search Upgrades & Move all this column def stuff into a managing component in the UI directory, not the search directory
import {COLUMN_DEF_CONTRIBUTORS} from '../../components/search/table_constants.jsx';

export function ContributorsTable({ contributors, onContributorsChange, permissions }) {
  let [fileDetails,setFileDetails] = useState();
  let [validatingContributorsUpload, setValidatingContributorsUpload] = useState(false);
  let [contributorValidationErrors, setContributorValidationErrors] = useState([]);
  let [contributorRows, setContributorRows] = useState([]);
  let [formErrors, setFormErrors] = useState({});
  console.debug('%c◉ permissions ', 'color:#00ff7b', permissions);

  // Sync localContributors with prop changes
  useEffect(() => {
    setContributorRows(contributors);
  }, [contributors]);

  useEffect(() => {
    if (onContributorsChange) {
      console.debug('%c◉ if onContributorsChange ', 'color:#00ff7b',contributorRows );
      onContributorsChange({data: contributorRows, errors: contributorValidationErrors});
    }
  }, [contributorRows, contributorValidationErrors]);

  // Handle file upload and parse contributors
  function handleFileGrab(e, type) {
    console.debug('%c◉ FILEGRAb ', 'color:#00ff7b', );
    setContributorValidationErrors([])
    setContributorRows([])
    setValidatingContributorsUpload(true)
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile = new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      console.debug('%c◉ HAVE FILE ', 'color:#00ff7b', newFile);
      setFormErrors((prevValues) => ({
        ...prevValues,
        'contributors': "",
      }))
      Papa.parse(newFile, {
        download: true,
        skipEmptyLines: true,
        header: true,
        complete: data => {
          setFileDetails({
            ...fileDetails,
            [type]: data.data
          });
          setContributorRows(data.data);
        }
      });
      
      ingest_api_validate_contributors(newFile)
        .then((res) => {
          
          if(res.status === 200){
            // console.debug('%c◉ Success ', 'color:#00ff7b', res);
            setContributorValidationErrors()
            setFormErrors((prevValues) => ({
              ...prevValues,
              'contributors': "",
            }))
            setValidatingContributorsUpload(false)
            // console.debug('%c◉ res.data ', 'color:#00ff7b', res.data);
          }else if(res?.res?.response?.data){
            let errorSet = res.res.response.data.description
            if(!errorSet[0].row){
              // Non Row based Response
              try{
                setContributorValidationErrors([{
                  "column": "N/A",
                  "error": errorSet.toString(),
                  "row": "N/A"
                }])
                setValidatingContributorsUpload(false)
              }catch(error){
                setValidatingContributorsUpload(false)
                console.debug('%c◉trycatch  errorPreprocessCheck', 'color:#00ff7b', error);
              }
            }else{
              //  IVT Row by Row Error Handling
              try{
                errorSet = errorSet.sort((a, b) => a.row - b.row);
                setContributorValidationErrors(errorSet);
                setValidatingContributorsUpload(false)
                highlightTableErrors(errorSet);
              }catch(error){
                setValidatingContributorsUpload(false)
                // console.debug('%c◉ parsedErrorRows trycatch  ', 'color:#00ff7b', error);
              }
            }
            setFormErrors((prevValues) => ({
              ...prevValues,
              'contributors': "Please Review the following validation errors and re-upload your file.",
            }))
          }else{
            console.error("IDK" , res);
            setValidatingContributorsUpload(false)
          }
          setValidatingContributorsUpload(false)
        })
        .catch((error) => {
          console.debug('%c◉ FAILURE ', 'color:#ff005d', error);
        });
        
    } else {
      console.debug("No Data??");
    }
  }

  function highlightTableErrors(errorSet){

    console.debug('%c◉ highlightTableErrors ', 'color:#D0FF00', errorSet);
    if(errorSet && errorSet.length > 0){
      for (const error of errorSet) {
        let errorRow = document.querySelector(`[aria-rowindex="${error.row}" ]`);
        errorRow.setAttribute('data-error','true')
        let cell = errorRow.querySelector(`[data-field="${error.column}" ]`);
        cell.setAttribute('data-error','true')
      }
    }
  }

  function renderContribTable(){
    if (contributorRows && contributorRows.length > 0) {
      const rows = contributorRows.map((contributor, i) => ({
        id: i,
        display_name: contributor.name ? contributor.name : `${contributor.first_name || ''} ${contributor.middle_name_or_initial || ''} ${contributor.last_name || ''}`.trim(),
        affiliation: contributor.affiliation,
        orcid: contributor.orcid ? contributor.orcid : contributor.orcid_id,
        email: contributor.email,
        is_contact: contributor.is_contact,
        is_principal_investigator: contributor.is_principal_investigator,
        is_operator: contributor.is_operator,
        metadata_schema_id: contributor.metadata_schema_id,
      }));
      return (
        <div className={"associationTableWrap associatedContributorsTable"} style={{ width: "100%" }}>
          <DataGrid
            className='associationTable w-100'
            rows={rows}
            columns={COLUMN_DEF_CONTRIBUTORS}
            loading={validatingContributorsUpload}
            density="compact"
            logLevel="info"
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            hideFooterSelectedRowCount
            // autoHeight
            rowCount={rows.length}
            sx={{
              border: "none",
              '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': { minHeight: '60px', overflowY: 'scroll!important', maxHeight: '350px' },
              background: "rgba(0, 0, 0, 0.04)",
              cursor: "cell!important",
            }}
          />
          {contributorValidationErrors && contributorValidationErrors.length > 0 && (<>
            <Typography sx={{ width: "100%", borderBottom: "1px solid #00000030", background: '#FF000019', color: '#3E0000', padding: '10px' }}> <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-1 red' /> {formErrors?.contributors} </Typography>
            <Box sx={{ background: '#FF000009', color: '#3E0000', padding: '10px' }}>
              {renderContributorErrors()}
            </Box>
          </>)}
        </div>
      );
    }
  }
  // Renders contributor errors as HTML list
  function renderContributorErrors() {
    console.debug('%c◉  contributorValidationErrors', 'color:#00e5ff', contributorValidationErrors);
    // const result = errorString

    return (
      <Box>
          {Array.isArray(contributorValidationErrors) && contributorValidationErrors.map((item, i) => {
            return (
              <Typography
                key={i}
                variant="caption"
                style={{
                  display: "inline-flex",
                  // justifyContent: "space-between",
                  alignItems: "left",
                  width: "100%",
                  wordBreak: "break-word",
                  borderBottom: "1px solid #444a6520"}}>
                    <strong>Row: {(item?.row)-1}&nbsp;{item?.column.toString()}</strong> :&nbsp; <span style={{float: "right"}}> {item?.error.toString().replace(/^.*value "([^"]+)"/, 'value "$1"')}</span>
              </Typography>
            );
          } )}
      </Box>
    );
  }

  return (
    <FormControl sx={{ width: '100%' }} >
      <Typography sx={{ color: 'rgba(0, 0, 0.2, 0.6)' }}>
        Contributors
      </Typography>
      {renderContribTable()}
      <div className="text-right">
        <Typography variant='caption'>
          Please refer to the <a href="https://hubmapconsortium.github.io/ingest-validation-tools/contributors/current/" target='_blank' rel="noreferrer">contributor file schema information</a>, and this <a href='https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv' target='_blank' rel="noreferrer">Example TSV File</a>
        </Typography>
      </div>
      {permissions.has_write_priv!==false && (
        <div className="text-left">
          <label>
            <input
              accept=".tsv, .csv"
              type="file"
              id="FileUploadContriubtors"
              name="Contributors"
              disabled={permissions.has_write_priv===false ? true : false}
              onChange={handleFileGrab}
            />
          </label>
        </div>
      )}
      
    </FormControl>
  );
}
