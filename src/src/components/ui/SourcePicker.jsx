
import "../../App.css";
import { Alert, AlertTitle } from '@material-ui/lab';
import React, { useState } from 'react';
import Paper from '@material-ui/core/Paper';
import { TextField, Button, Box } from '@mui/material';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import { getPublishStatusColor } from "../../utils/badgeClasses";


import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";


import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';


export const SourcePicker = (props) => {
// export function searchWrapper (props){

  var source_uuid_list = props.source_uuid_list;
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    file: null,
  });

  
  const errorClass = (error, e) => {
    // errorClass( {
    console.debug("errorClass", error, e);
    if (error === "valid") return "is-valid";
    else if (error === "invalid" || error === "is-invalid") return "is-invalid";
    else if (error && error.length && error.length === 0) return "is-invalid";
    else return "";
    // return error.length === 0 ? "" : "is-invalid";
  }


  // this is used to handle the row selection from the SOURCE ID search (idSearchModal)
  const handleSelectClick = (selection) => {
    if (this.state.selectedSource !== selection.row.uuid) {
      this.setState(
        {
          selectedSource: selection.row.uuid,
        },
        () => {
          var slist = this.state.source_uuid_list;
          slist.push(selection.row);   
          this.setState((prevState) => ({
            source_uuid: selection.row.hubmap_id,
            source_uuid_list: slist,
            slist: slist,
            source_entity: selection.row, // save the entire entity to use for information
            LookUpShow: false,
            validationStatus:  { ...prevState.validationStatus, ['source_uuid_list']: "" },
            formErrors: { ...prevState.formErrors, ['source_uuid_list']: "" },  
          }));
          this.hideLookUpModal();
        }
      );
    } else {
      //
    }
  };




return (
  <div className="w-100">

    <div className='row'>
      <label htmlFor='source_uuid_list'>
        Source(s) <span className='text-danger px-2'>*</span>
      </label>
      <FontAwesomeIcon
        icon={faQuestionCircle}
        data-tip
        data-for='source_uuid_tooltip'
      />
      <ReactTooltip
        id='source_uuid_tooltip'
        className='zindex-tooltip'
        place='right'
        type='info'
        effect='solid'
      >
        <p>
          The source tissue samples or data from which this data was derived.  <br />
          At least <strong>one source </strong>is required, but multiple may be specified.
        </p>
      </ReactTooltip>

      <TableContainer 
        component={Paper} 
        style={{ maxHeight: 450 }}
        className={
          errorClass(props.source_uuid_list)
        }>
        <Table aria-label="Associated Datasets" size="small" className="table table-striped table-hover mb-0">
          <TableHead className="thead-dark font-size-sm">
            <TableRow className="   " >
              <TableCell> Source ID</TableCell>
              <TableCell component="th">Submission ID</TableCell>
              <TableCell component="th">Subtype</TableCell>
              <TableCell component="th">Group Name</TableCell>
              <TableCell component="th">Status</TableCell>
              <TableCell component="th" align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {props.source_uuid_list.map((row, index) => (
              <TableRow 
                key={(row.hubmap_id+""+index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                // onClick={() => this.handleSourceCellSelection(row)}
                className="row-selection"
                >
                <TableCell  className="clicky-cell" scope="row">{row.hubmap_id}</TableCell>
                <TableCell  className="clicky-cell" scope="row"> {row.submission_id && ( row.submission_id)} </TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.display_subtype}</TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.group_name}</TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.status && (
                    <span className={"w-100 badge " + getPublishStatusColor(row.status,row.uuid)}> {row.status}</span>   
                )}</TableCell>
                <TableCell  className="clicky-cell" align="right" scope="row"> 
                {props.writeable && (
                  <React.Fragment>
                    <FontAwesomeIcon
                      className='inline-icon interaction-icon '
                      icon={faTrash}
                      color="red"  
                      onClick={() => props.sourceRemover(row,index)}
                    />
                  </React.Fragment>
                  )}
                  {!props.writeable && (
                  <small className="text-muted">N/A</small>
                  )}
                
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box className="mt-2 w-100" width="100%"  display="flex">
          <Box p={1} className="m-0  text-right" flexShrink={0}  >
            <Button
              variant="contained"
              type='button'
              size="small"
              className='btn btn-neutral'
              onClick={() => props.handleLookUpClick()} 
              >
              Add {props.source_uuids && props.source_uuids.length>=1 && (
                "Another"
                )} Source 
              <FontAwesomeIcon
                className='fa button-icon m-2'
                icon={faPlus}
              />
            </Button>
          </Box>
          <Box p={1} width="100%"   >
          {errorClass(props.formErrors.source_uuid_list) && (
                <Alert severity="error" width="100% " >
                  {props.formErrors.source_uuid_list}  {props.formErrors.source_uuid} 
                </Alert>
            )}
          </Box>
      </Box>
    </div>

    <div className='row'>
    {props.writeable && (
      <React.Fragment>
        <Box className="mt-2 w-100" width="100%"  display="flex">
          
            <Box p={1} className="m-0  text-right" flexShrink={0}  >
              <Button
                variant="contained"
                type='button'
                size="small"
                className='btn btn-neutral'
                onClick={() => props.handleLookUpClick()} 
                >
                Add {props.source_uuids && props.source_uuids.length>=1 && (
                  "Another"
                  )} Source 
                <FontAwesomeIcon
                  className='fa button-icon m-2'
                  icon={faPlus}
                />
              </Button>
            </Box>

            <Box p={1} width="100%"   >
            {this.errorClass(props.formErrors.source_uuid_list) && (
                  <Alert severity="error" width="100% " >
                    {props.formErrors.source_uuid_list}  {props.formErrors.source_uuid} 
                  </Alert>
              )}
            </Box>
            
            {/*  */}
        </Box>
      </React.Fragment>
    )}
    </div>

  </div>
  )}
  
