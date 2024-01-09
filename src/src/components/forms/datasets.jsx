import React, { useEffect, useState } from 'react';
import {useNavigate} from "react-router-dom";
import { entity_api_get_entity,entity_api_create_entity, entity_api_update_entity} from '../../service/entity_api';
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { generateDisplaySubtypeSimple_UBKG } from "../../utils/display_subtypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faTrash, faPlus,faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { TextField, Button, Box } from '@mui/material';

import ReactTooltip from "react-tooltip";
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@material-ui/core/LinearProgress';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import FormControl from '@mui/material/FormControl';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import "../../App.css";
import SearchComponent from "../search/SearchComponent";
import {ValidateDataset} from "../../utils/validators"


import { styled } from "@mui/material/styles";
const StyledTextField = styled(TextField)`
  textarea {
    resize: both;
  }
`;
export function DatasetForm (props){
  let navigate = useNavigate();
  var [locked, setLocked] = useState(false);

  var [successDialogRender, setSuccessDialogRender] = useState(false);
  var [selectedSource, setSelectedSource] = useState(null);
  var [sourceDatasetDetails, setSourceDatasetDetails] = useState([]);
  var [selectedSources, setSelectedSources] = useState([]);
  
  var [lookupShow, setLookupShow] = useState(false);
  var [loadingDatasets, setLoadingDatasets] = useState(true);
  var [hideUUIDList, setHideUUIDList] = useState(true);
  var [loadUUIDList, setLoadUUIDList] = useState(false);
  
  var [buttonState, setButtonState] = useState('');
  var [warningOpen, setWarningOpen] = React.useState(true);
  
  // var [entityInfo, setEntityInfo] = useState();
  var [formWarnings, setFormWarnings] = useState({bulk_dataset_uuids:""});
  var [formErrors, setFormErrors] = useState({
        lab_dataset_id:"",
        description: "",
        dataset_info: "",
        contains_human_genetic_sequences:true,
        dataset_type:"",
        direct_ancestor_uuids: "",
        bulk_dataset_uuids:["","",""]
  });
  var [formValues, setFormValues] = useState({
    lab_dataset_id:"",
    description: "",
    dataset_info: "",
    contains_human_genetic_sequences:true,
    dataset_type:"",
    direct_ancestor_uuids: "",
    bulk_dataset_uuids:["","",""]
  });
  // Props
  var [isNew] = useState(props.newForm);
  var [editingDataset] = useState(props.editingDataset);
  var [dataTypeList] = useState(props.dataTypeList ? props.dataTypeList : []);

 
  useEffect(() => {
    if (editingDataset) {  
      setSourceDatasetDetails([]) 
      var formVals = editingDataset; // dont try modifying prop
      var UUIDs = [];
      if (editingDataset.datasets && editingDataset.datasets.length > 0) {
        for (const entity of editingDataset.datasets) {
          if (entity.dataset_types && entity.dataset_types.length > 0) {
            var subtype = generateDisplaySubtypeSimple_UBKG(entity.dataset_types[0],dataTypeList);
            entity.display_subtype = subtype;
          }
          setSourceDatasetDetails((rows) => [...rows, entity]); // Populate the info for table
          setSelectedSources((UUIDs) => [...UUIDs, entity.uuid]); // UUID list for translating to form values
          UUIDs.push(entity.uuid);
        }
        formVals.dataset_uuids = UUIDs
        setFormValues(formVals);  
      }
      setLoadingDatasets(false);
      if (editingDataset.doi_url || editingDataset.registered_doi) {
        // Cant be editied further after DOI information is added
        setLocked(true);
      }
    } else {
      // We must be new. No table data to load
      setLoadingDatasets(false);
    }
  }, [editingDataset,dataTypeList]);

  const handleSelectClick = (event) => {
    if (!selectedSources.includes(event.row.uuid)) {
      setSourceDatasetDetails((rows) => [...rows, event.row]); 
      setSelectedSources((UUIDs) => [...UUIDs, event.row.uuid]);

      // The state might not update in time so we'll clone push and set
      var currentUUIDs = sourceDatasetDetails.map(({ uuid }) => uuid)
      currentUUIDs.push(event.row.uuid);
      console.debug("handleSelectClick SelctedSOurces", event.row, event.row.uuid);
      setFormValues((prevValues) => ({
        ...prevValues,
        'dataset_uuids':currentUUIDs,
      }))
      setLookupShow(false); 
    } else {
      // maybe alert them theyre selecting one they already picked?
    }
  };

  const sourceRemover = (row, index) => {
    var sourceUUIDList = selectedSources;
    let filteredUUIDs = sourceUUIDList.filter((item) => item !== row.uuid)
    setSelectedSources(filteredUUIDs);
    console.debug('%c⊙', 'color:#00ff7b', "filteredUUIDs", filteredUUIDs);
    
    var sourceDetailList = sourceDatasetDetails;
    let filteredDetailList = sourceDetailList.filter((item, i) => item.uuid !== row.uuid)
    setSourceDatasetDetails(filteredDetailList);
    console.debug('%c⊙', 'color:#00ff7b', "filtered Details", filteredDetailList );

    setFormValues((prevValues) => ({
        ...prevValues,
        'dataset_uuids': filteredUUIDs,
    }))
  };

  const handleErrorParse = (response) => {
    let errMsg = {};
    if (response.data && response.data.error) {
      console.debug("response.data.error", response.data.error);
      errMsg.message = response.data.error;
    } else {
      console.debug("response", response);
      // errMsg.message = response.toString();
    }
    console.debug("ERRMSG", errMsg);
    props.reportError(response,);
  
  }
  

  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
    // console.debug("handleInputChange", name, value, type);
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

  const handleInputUUIDs = (event) => {
    event.preventDefault();
    console.debug('%c⊙', 'color:#00ff7b', "FORM VALS", formValues.dataset_uuids );
    // const { name, value, type } = event.target;
    if (!hideUUIDList) {
      handleUUIDListLoad()
    } else {
      setHideUUIDList(!hideUUIDList)
    }
  };

  const handleUUIDListLoad = () => {
    var value = formValues.dataset_uuids
    var uuidArray = value;
    // var errCount = 0;
    var processed = sourceDatasetDetails.map(({ uuid }) => uuid); //the state might not update fast enough sequential dupes
    setFormErrors((prevValues) => ({
      ...prevValues,
      'bulk_dataset_uuids': ["","",""],
    }))
    setWarningOpen(false)
    if (typeof value === 'string' || value instanceof String) {
      uuidArray = value.split(",")
    }

    for (var datatypeID of uuidArray) {
      let ds = datatypeID.split(' ').join('');
      console.debug('%c⊙', 'color:#00ff7b', "ds",ds, processed.includes(ds), processed );
      setLoadingDatasets(true)
      if (ds.length !== 0 && !processed.includes(ds)) { 
        console.debug('%c⊙', 'color:#00ff7b', "ds", ds, processed.includes(ds) );
        entity_api_get_entity(ds, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((response) => {
            if ((response.status === 400 || response.status === 404) && response.data && response.data.error) {
              // Not Found / Invalid
              setFormErrors((prevValues) => ({
                ...prevValues,
                'bulk_dataset_uuids': response.data.error.split(': '),
              }))
            }
            else if (response.status !== 200 && response.status !== 400 && response.status !== 404) {
              //Not Validation Errors but AN error
              handleErrorParse(response);
            } else {
              let row = response.results;
              if (!processed.includes(row.uuid)) { 
                if (!row.display_subtype && row.data_types && row.data_types[0].length > 0) {
                  // entity does not return display subtype, so we'll generate it
                  row.display_subtype = generateDisplaySubtypeSimple_UBKG(row.data_types[0], props.dtl_all);
                  setSourceDatasetDetails((rows) => [...rows, row]);
                  processed.push(row.uuid.toString());
                }
              } else {
                setWarningOpen(true)
                setFormWarnings((prevValues) => ({
                  ...prevValues,
                  'bulk_dataset_uuids': "UUID " + ds + " is already in the list",
                }))
              }
            }
          })
          .catch((error) => {
            handleErrorParse(error);
            setLoadUUIDList(false)
            setLoadingDatasets(false)
          });
      } else if (processed.includes(ds)) {
        setWarningOpen(true)
        setFormWarnings((prevValues) => ({
          ...prevValues,
          'bulk_dataset_uuids': "UUID " + ds + " is already in the list",
        }))
      }
    };   
    setLoadingDatasets(false)
    // if (errCount >0) { 
      // If we've got no errors we can shrinkydink the box
      console.debug('%c⊙', 'color:#00ff7b', "No Errors" );     
      setHideUUIDList(true)
      setLoadUUIDList(false)
    // }
    
  }

    
  const handleSubmit = () => {
    setButtonState("submit");
    var submitForm = ValidateDataset(formValues);
    console.debug('%c⊙', 'color:#00ff7b', "submitForm", submitForm);
    if (submitForm!==false) {
      if (editingDataset) {
        console.debug('%c⊙', 'color:#00ff7b', "Updating");
        handleUpdate(submitForm);
      } else {
        console.debug('%c⊙', 'color:#00ff7b', "Creating");
        handleCreate(submitForm);
      }
    }else{
      console.debug('%c⭗ Validation Fail', 'color:#ff005d'  );
      setButtonState("");
    }
    
  };

  const handleCreate = (formSubmit) => {
    entity_api_create_entity("Dataset", formSubmit, props.authToken)
      .then((response) => {
        props.onProcessed(response);
      })
      .catch((error) => {
        console.debug('%c⭗', 'color:#ff005d', "handleCreate error", error);
      });
  }
  
  const handleUpdate = (formSubmit) => {
      // Need to strip out all blank values
    entity_api_update_entity(formValues.uuid, formSubmit, props.authToken)
      .then((response) => {
        console.debug('%c⊙', 'color:#00ff7b', "handleUpdate response", response, response.results);
        if (response.status === 200) {
          // Only move on if we're actually good
          props.onProcessed(response.results);
        } else {
          console.debug('%c⭗', 'color:#ff005d', "handleUpdate NOT RIGHT", response);
        }
      })
      .catch((error) => {
        console.debug('%c⭗', 'color:#ff005d', "handleUpdate error", error);
      });
    
  }


  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        margin: '0 0'}}>
      <div className="w-100">

        <div className="row">
          <div className="col-md-12 mb-4">
            <h3>
              {!props.newForm && editingDataset && (
                <span className="">
                  HuBMAP Dataset ID: {editingDataset.hubmap_id}
                  {" "}
                </span>
              )}
              {(props.newForm) && (
                <span className="mx-1">
                  Registering a Dataset
                </span>
              )}
            </h3>
            {!props.newForm && (
              <h5>{props.editingDataset.title}</h5>
            )}
          </div>
        </div>



        <label htmlFor='dataset_uuids'>
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
          effect='solid'>
          <p>
            The source tissue samples or data from which this data was derived.  <br />
            At least <strong>one source </strong>is required, but multiple may be specified.
          </p>
        </ReactTooltip>
      
        {loadingDatasets && (
          <LinearProgress />
        )}
        
      
        {!loadingDatasets && (<>
        {/* @TODO: Set this up in its own im */}

          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="Associated Datasets" size="small" className="table table-striped table-hover mb-0">
              <TableHead className="thead-dark font-size-sm">
                <TableRow className="   " >
                  <TableCell> Source</TableCell>
                  <TableCell component="th">Data Type</TableCell>
                  <TableCell component="th">Group Name</TableCell>
                  <TableCell component="th">Status</TableCell>
                  <TableCell component="th" align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              {sourceDatasetDetails && sourceDatasetDetails.length > 0 && (
                <TableBody >
                  {sourceDatasetDetails.map((row, index) => (
                    <TableRow
                      key={(row.hubmap_id + "" + index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                      // onClick={() => this.handleSourceCellSelection(row)}
                      className="row-selection"
                    >
                      <TableCell className="clicky-cell" scope="row">{row.hubmap_id}</TableCell>
                      <TableCell className="clicky-cell" scope="row"> {row.display_subtype && (row.display_subtype)} </TableCell>
                      <TableCell className="clicky-cell" scope="row">{row.group_name}</TableCell>
                      <TableCell className="clicky-cell" scope="row">{row.status && (
                        <span className={"w-100 badge " + getPublishStatusColor(row.status, row.uuid)}> {row.status}</span>
                      )}</TableCell>
                      <TableCell className="clicky-cell" align="right" scope="row">
                          <React.Fragment>
                            <FontAwesomeIcon
                              className='inline-icon interaction-icon '
                              icon={faTrash}
                              color="red"
                              onClick={() => sourceRemover(row, index)}
                            />
                          </React.Fragment>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            </TableContainer>
          {formErrors.bulk_dataset_uuids[0].length > 0 && (
            <Alert variant="filled" severity="error">
              <strong>Error:</strong> {formErrors.bulk_dataset_uuids[1]}: {formErrors.bulk_dataset_uuids[2]} ({formErrors.bulk_dataset_uuids[2]})
            </Alert>
          )}
          {formWarnings.bulk_dataset_uuids.length > 0 && (
            <Collapse in={warningOpen}>
              <Alert
                severity='warning' variant='filled' sx={{ mt: 2 }}
                action={
                  <IconButton aria-label="close" color="inherit" size="small"onClick={() => {setWarningOpen(false)}}>
                    <CloseIcon fontSize="inherit" />
                  </IconButton>}>
                <strong>Notice: </strong>{formWarnings.bulk_dataset_uuids}
              </Alert>
            </Collapse>
            
          )}

          <Box className="mt-2 w-100" width="100%" display="flex">
            <Box p={1} className="m-0  text-right" flexShrink={0} flexDirection="row"  >
              <Button
                variant="contained"
                type='button'
                size="small"
                className='btn btn-neutral'
                onClick={() => setLookupShow(true)}
              >
                Add {formValues.dataset_uuids && formValues.dataset_uuids.length >= 1 && (
                  "Another"
                )} Source
                <FontAwesomeIcon
                  className='fa button-icon m-2'
                  icon={faPlus}
                />
              </Button>
              
              <Button
                variant="text"
                type='link'
                size="small"
                className='mx-2'
                onClick={(event) => handleInputUUIDs(event)}
              >
                {hideUUIDList && (<>Bulk</>)}
                {!hideUUIDList && (<>Add</>)}
                <FontAwesomeIcon
                  className='fa button-icon m-2'
                  icon={faPenToSquare}
                />
              </Button>
            </Box>
            
            <Box>
              <Collapse
                in={!hideUUIDList}
                orientation="horizontal"
                sx={{
                  overflow: 'hidden',
                  display: 'inline-box',
                }}>
                {loadUUIDList && (
                  <LinearProgress> </LinearProgress>
                )}
                {!loadUUIDList && (
                  <FormControl
                    // className='mb-0'
                    sx={{
                      verticalAlign: 'bottom',
                      minWidth: "400px",
                      overflow: 'hidden',
                      //   display: 'flex',
                      //   flexDirection: 'row', 
                    }}>
                    <StyledTextField
                      name="dataset_uuids"
                      id="dataset_uuids"
                      error={formErrors.dataset_uuids && formErrors.dataset_uuids.length > 0 ? true : false}
                      disabled={locked}
                      multiline
                      rows={2}
                      inputProps={{ 'aria-label': 'description' }}
                      placeholder={"List of Dataset Hubmap IDs or UUIDs,  Comma Seperated "}
                      variant="standard"
                      size="small"
                      fullWidth={true}
                      onChange={(event) => handleInputChange(event)}
                      value={formValues.dataset_uuids}
                      sx={{
                        marginTop: '10px',
                        width: '100%',
                        verticalAlign: 'bottom',
                      }}
                    />
                  </FormControl>
                )}
              </Collapse>
            </Box>

            {!hideUUIDList && (
              <Box p={1} className="m-0  text-left" flexShrink={0} flexDirection="row"  >
                <IconButton aria-label="cancel" size="small" sx={{verticalAlign:"middle!important"}} onClick={() => {setHideUUIDList(true)}}><CancelPresentationIcon/></IconButton>
              </Box>
            )}
          
          </Box>
          {formErrors.dataset_uuids && formErrors.dataset_uuids.length > 0 && (
            <Box
              p={1}
              width="100%"
              sx={{
                backgroundColor: 'rgb(253, 237, 237)',
                padding: '10px',
              }}   >
              {formErrors.dataset_uuids}
            </Box>
          )}
      
        </>)}
        <Dialog
          fullWidth={true}
          maxWidth="lg"
          onClose={() => setLookupShow(false)}
          aria-labelledby="source-lookup-dialog"
          open={lookupShow}>
          <DialogContent>
            <SearchComponent
              select={(e) => handleSelectClick(e)}
              custom_title="Search for a Source ID for your Dataset"
              // filter_type="Publication"
              modecheck="Source"
              restrictions={{
                entityType: "dataset"
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setLookupShow(false)}
              variant="contained"
              color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <FormControl>
        <TextField
          label="Lab Name or ID"
          name="lab_dataset_id"
          id="lab_dataset_id"
          error={formErrors.lab_dataset_id && formErrors.lab_dataset_id.length > 0 ? true : false}
          disabled={false}
          helperText={formErrors.lab_dataset_id && formErrors.lab_dataset_id.length > 0 ? "Error" : "Lab Name or ID" }
          variant="standard"
          onChange={handleInputChange}
          value={formValues.lab_dataset_id}
        />
      </FormControl>

      <FormControl>
        <TextField
          label="Description"
          name="description"
          id="description"
          multiline
          rows={4}
          error={formErrors.description && formErrors.description.length > 0 ? true : false}
          disabled={false}
          helperText={formErrors.description && formErrors.description.length > 0 ? "Error" : "A description of the Dataset" }
          variant="standard"
          onChange={handleInputChange}
          value={formValues.description}
        />
      </FormControl>

      <FormControl>
        <TextField
          label="Additional Information"
          name="dataset_info"
          id="dataset_info"
          multiline
          rows={4}
          error={formErrors.dataset_info && formErrors.dataset_info.length > 0 ? true : false}
          disabled={false}
          helperText={formErrors.dataset_info && formErrors.dataset_info.length > 0 ? "Error" : "A description of the Dataset" }
          variant="standard"
          onChange={handleInputChange}
          value={formValues.dataset_info}
        />
      </FormControl>

      <FormControl>
        <FormLabel id="demo-row-radio-buttons-group-label">Will this data contain any human genomic sequence data?</FormLabel>
        <RadioGroup
          row
          aria-labelledby="contains_human_genetic_sequences"
          name="contains_human_genetic_sequences"
          value={formValues.contains_human_genetic_sequences}
          onChange={handleInputChange}>
          <FormControlLabel value="yes" control={<Radio />} label="Yes" />
          <FormControlLabel value="no" control={<Radio />} label="No" />
        </RadioGroup>
      </FormControl>

      <FormControl>
          <InputLabel htmlFor="dataset_type" id="dataset_type">Dataset Type</InputLabel>
          <Select
              native 
              fullWidth
              labelid="dataset_type_lable"
              name="dataset_type"
              id="dataset_type"
              label="Dataset Type"
              value={formValues.dataset_type}
              onChange={(e) => handleInputChange(e)}
              disabled={props.restrictions && props.restrictions.entityType?true:false}>
              <option value="---"></option>
              {dataTypeList.map((type, index) => { 
                return ( <option key={index} value={type.term}>{type.term}</option>)
              })}
          </Select>            
      </FormControl>

      <div className="row">
        <div className="buttonWrapRight">
          <Button
            variant="contained"
            onClick={() => handleSubmit()}
            type="button"
            disabled={locked}
            className='float-right'>
            {buttonState === "submit" && (
              <FontAwesomeIcon
                className='inline-icon'
                icon={faSpinner}
                spin
              />
            )}
            {buttonState !== "submit" && (
              "Submit"
            )}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={() => props.handleCancel()}>
            Cancel
          </Button>
        </div>
      </div>
      
    </Box>
  );
}