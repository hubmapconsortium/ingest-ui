
import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';


import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import SearchComponent from "../search/SearchComponent";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Paper from '@material-ui/core/Paper';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getPublishStatusColor } from "../../utils/badgeClasses";


import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";

import "../../App.css";
import { Alert, AlertTitle } from '@material-ui/lab';
import {SourcePicker} from "../ui/SourcePicker";

export function CollectionForm (props){
  var [selectedSource, setSelectedSource] = useState(null);
  var [selectedSources, setSelectedSources] = useState([]);
  var [lookupShow, setLookupShow] = useState(false);
  var [formErrors, setFormErrors] = useState({
    title:null,
    description: null,
    file: null,
    source_uuid_list: [],
  });
  var [formValues, setFormValues] = useState({
    title: '',
    description: '',
    file: null,
    source_uuid_list: [],
  });

  const errorClass = (error, e) => {
    // errorClass( {
    // console.debug("errorClass", error, e);
    if (error === "valid") return "is-valid";
    else if (error === "invalid" || error === "is-invalid") return "is-invalid";
    else if (error && error.length && error.length === 0) return "is-invalid";
    else return "";
    // return error.length === 0 ? "" : "is-invalid";
  }



  const handleLookUpClick = () => {
    console.debug("handleLookUpClick" );
    setLookupShow(true);  
  };

  const hideLookUpModal = () => {
    setLookupShow(false);  
  };

  const cancelLookUpModal = () => {
    setLookupShow(false);  
  };

  const  handleSelectClick = (selection) => {
    var slist = selectedSources
    console.debug("SelctedSOurces", slist, typeof slist, selection);
    slist.push(selection.row);   
    setSelectedSources(slist);
    setFormValues({
        ...setFormValues,
        ['source_uuid_list']: selectedSources
    });
    hideLookUpModal();
  };  
  const  sourceRemover = (row,index) => {
    var slist =selectedSources
    console.debug("sourceRemover", slist, typeof slist, row, index);
    slist = slist.filter((source) => source.uuid !== row.uuid);
    setFormValues({
        ...setFormValues,
        ['source_uuid_list']: slist
    });
  };



  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
    console.debug("handleInputChange", name, value, type);
    if (type === 'file') {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: event.target.files[0],
      }));
    } else {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Do something with the form values
    console.log(formValues);
  };

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        // maxWidth: '400 px',
        margin: '0 0',
      }}
      onSubmit={handleSubmit}
    >


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
    // className={
    //   // errorClass(formValues.source_uuid_list)
    // }
    >
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
        {formValues.source_uuid_list.map((row, index) => (
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
                  onClick={() => sourceRemover(row,index)}
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
          onClick={() => handleLookUpClick()} 
          >
          Add {formValues.source_uuids && formValues.source_uuids.length>=1 && (
            "Another"
            )} Source 
          <FontAwesomeIcon
            className='fa button-icon m-2'
            icon={faPlus}
          />
        </Button>
      </Box>
      <Box p={1} width="100%"   >
      {/* {errorClass(formErrors.source_uuid_list) && (
            <Alert severity="error" width="100% " >
              {formErrors.source_uuid_list}  {formErrors.source_uuid} 
            </Alert>
        )} */}
      </Box>
  </Box>

  <Dialog
    fullWidth={true}
    maxWidth="lg"
    onClose={hideLookUpModal}
    aria-labelledby="source-lookup-dialog"
    open={lookupShow}>
    <DialogContent>
      <SearchComponent
        select={handleSelectClick}
        custom_title="Search for a Source ID for your Collection"
        // filter_type="Publication"
        modecheck="Source"
        // restrictions={{
        //   entityType : "dataset"
        // }}
      />
    </DialogContent>
    <DialogActions>
      <Button
        onClick={cancelLookUpModal}
        variant="contained"
        color="primary">
        Close
      </Button>
    </DialogActions>
  </Dialog>
</div>

</div>

      <FormControl>
        <TextField
          label="Title"
          name="title"
          id="title"
          error={false}
          disabled={false}
          helperText={"Test"}
          variant="standard"
          onChange={handleInputChange}
          value={formValues.title}
        />
      </FormControl>
      <FormControl>
        <TextField
          label="Description"
          name="description"
          id="description"
          error={false}
          disabled={false}
          helperText={"Test"}
          variant="standard"
          onChange={handleInputChange}
          value={formValues.description}
        />
      </FormControl>

      <label htmlFor="file-input">
        <Button variant="contained" component="span">
          Upload File
        </Button>
      </label>
      <Button variant="contained" type="submit">
        Submit
      </Button>
    </Box>
  );
}



