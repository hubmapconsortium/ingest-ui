import React, { useEffect, useState,useContext } from 'react';
import { useParams } from "react-router-dom";
import {useNavigate} from "react-router-dom";
import "../../App.css";
import SearchComponent from "../search/SearchComponent";
// import SourceTable from "../ui/table";
import { entity_api_get_entity,entity_api_create_entity, entity_api_update_entity} from '../../service/entity_api';

import { getPublishStatusColor } from "../../utils/badgeClasses";
import { generateDisplaySubtypeSimple_UBKG } from "../../utils/display_subtypes";
// import { PrettyLog } from "../../utils/prettyLogs";
import SourceTable from "../ui/table.jsx";

import GroupModal from "../uuid/groupModal";
import { UserContext } from '../../service/user_service';

import Papa from 'papaparse';
import ReactTooltip from "react-tooltip";
import { TextField, Button, Box } from '@mui/material';
import Paper from '@material-ui/core/Paper';
import FormControl from '@mui/material/FormControl';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@material-ui/core/LinearProgress';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faTrash, faPlus,faFolder, faUserShield,faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import Result from "../uuid/result";
import Typography  from '@mui/material/Typography';import { styled } from "@mui/material/styles";

const StyledTextField = styled(TextField)`
  textarea {
    resize: both;
  }
`;
export function CollectionForm (props){
  let navigate = useNavigate();
  var [successDialogRender, setSuccessDialogRender] = useState(false);
  var [selectedSource, setSelectedSource] = useState(null);
  // var [selectedGroup, setSlectedGroup] = useState(props.dataGroups[0]).uuid;
  var [sourceDatasetDetails, setSourceDatasetDetails] = useState([]);
  var [selectedSources, setSelectedSources] = useState([]);
  var [fileDetails, setFileDetails] = useState();
  var [buttonState, setButtonState] = useState('');
  var [lookupShow, setLookupShow] = useState(false);
  var [loadingDatasets, setLoadingDatasets] = useState(true);
  var [hideUUIDList, setHideUUIDList] = useState(true);
  var [loadUUIDList, setLoadUUIDList] = useState(false);
  var [entityInfo, setEntityInfo] = useState();
  var [formErrors, setFormErrors] = useState({
    title:"",
    description: "",
    dataset_uuids: "",
    creators: [],
    contacts: [],
  });
  var [formValues, setFormValues] = useState({
    title: '',
    description: '',
    dataset_uuids: [],
    creators: [],
    contacts: [],
  });
  // Props
  var [isNew] = useState(props.newForm);
  var [editingCollection] = useState(props.editingCollection);
  var [datatypeList] = useState(props.dtl_all);
  // var [authToken] = useState(props.authToken);


  useEffect(() => {
    if (editingCollection) {  
      setSourceDatasetDetails([]) 
      var formVals = editingCollection; // dont try modifying prop
      var UUIDs = [];
      if (editingCollection.datasets && editingCollection.datasets.length > 0) {
        for (const entity of editingCollection.datasets) {
          //When coming from the Entity, the Datasets use data_types, from the Search UI they pass display_subtype instead
          if (entity.data_types && entity.data_types.length > 0) {
            var subtype = generateDisplaySubtypeSimple_UBKG(entity.data_types[0],props.dtl_all);
            console.debug('%c⊙', 'color:#00ff7b', "subtype", subtype);
            entity.display_subtype = subtype;
            // entity.display_subtype = entity.data_types[0];
          }else {
            
          }
          setSourceDatasetDetails((rows) => [...rows, entity]); // Populate the info for table
          setSelectedSources((UUIDs) => [...UUIDs, entity.uuid]); // UUID list for translating to form values
          UUIDs.push(entity.uuid);
        }
        formVals.dataset_uuids = UUIDs
        setFormValues(formVals);  
      }
      setLoadingDatasets(false);
    } else {
      // We must be new. No table data to load
      setLoadingDatasets(false);
    }
  }, [editingCollection]);


  const completionClose = (data) => {
    navigate("/");  
  }

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
    if (typeof value === 'string' || value instanceof String) {
      uuidArray = value.split(",")
    }
    var sourceDetailUUIDs = sourceDatasetDetails.map(({ uuid }) => uuid)
    for (var datatypeID of uuidArray) {
      let ds = datatypeID.split(' ').join('');
      console.debug(ds);
      setLoadingDatasets(true)
      entity_api_get_entity(ds, JSON.parse(localStorage.getItem("info")).groups_token)
        .then((response) => {
          // @TODO why is it not coming back as an actua catchable error though??
          if (response.status !== 200) {
            handleErrorParse(response);
          } else {
            let row = response.results;
            if (!sourceDetailUUIDs.includes(row.uuid)) {
              // New additon to the set
              if (!row.display_subtype && row.data_types && row.data_types[0].length > 0) {
                // If it comes from the selector modal it has proper Data Type rendering,
                // but this is missing when called from input
                row.display_subtype =  generateDisplaySubtypeSimple_UBKG(row.data_types[0],props.dtl_all);
                setSourceDatasetDetails((rows) => [...rows, row]);
                setLoadingDatasets(false)
              }
            } else {
              console.debug('%c⭘', 'color:#ffe921', "Already in List", selectedSources, ds);
            }
          }
        })
        .catch((error) => {
          console.debug("CATCHerror", error);
          // console.debug("error.data",error.data);
          handleErrorParse(error);
          setLoadUUIDList(false)
          setLoadingDatasets(false)
        });
   
      setHideUUIDList(true)
      setLoadUUIDList(false)
      setLoadingDatasets(false)
      // setHideUUIDList(!hideUUIDList)
    };   
  }



  function removeEmpty(obj) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v != null)
        .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
    );
  }
  function validateForm(formValues) {
    var isValid = true;
    let { title, description, creators, contacts } = formValues;
    let formValuesSubmit = {};
    // Title
    if (!title || title.length === 0) {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'title': "Title is required",
      }))
      isValid = false;
    } else {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'title': ""
      }))
      formValuesSubmit.title = formValues.title  
    }
    // Description
    if (!description || description.length === 0) {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'description': "Descripton is required",
      }))
      isValid = false;
    } else {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'description': "",
      }))
      formValuesSubmit.description = description  
    }
    // Datasets
    var datasetUUIDs = []
    sourceDatasetDetails.map((row, index) => {
      datasetUUIDs.push(row.uuid)
    })
    console.debug('%c⊙', 'color:#00ff7b', "datasetUUIDs", datasetUUIDs, datasetUUIDs.length );
    if (!datasetUUIDs || datasetUUIDs.length === 0) {
      console.debug('%c⭗', 'color:#ff005d', "No Datasets" );
      setFormErrors((prevValues) => ({
        ...prevValues,
        'dataset_uuids': "At least one Source  is required",
      }))
      isValid = false;
    } else {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'dataset_uuids': "",
      }))
      formValuesSubmit.dataset_uuids = datasetUUIDs  
    }
    //Logic Flipped here to handle check for presence of object details not lack of
    // Only include if prenent, ignore if not
    console.debug('%c⊙', 'color:#00ff7b', "Creators",creators );
    if (creators && (creators[0] && creators[0].version!==undefined)) {
      formValuesSubmit.creators = creators
    } 
    // Do not send blank contacts
    console.debug('%c⊙', 'color:#00ff7b', "Contacts",contacts );
    if (contacts && (contacts[0] && contacts[0].version!==undefined)) {
      formValuesSubmit.contacts = contacts
    }

    if (isValid) {
      return formValuesSubmit
    } else {
      return false
    }
  }

    
  const handleSubmit = () => {
    setButtonState("submit");
    var submitForm = validateForm(formValues);
    console.debug('%c⊙', 'color:#00ff7b', "submitForm", submitForm);
    if (submitForm!==false) {
      if (editingCollection) {
        console.debug('%c⊙', 'color:#00ff7b', "Updating");
        handleUpdate(submitForm);
      } else {
        console.debug('%c⊙', 'color:#00ff7b', "Creating");
        handleCreate(submitForm);
      }
    }else{
      setButtonState("");
    }
    
  };

    const handleCreate = (formSubmit) => {
      entity_api_create_entity("collection", formSubmit, props.authToken)
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

    var handleFileGrab = (e, type) => {
      var grabbedFile = e.target.files[0];
      var newName = grabbedFile.name.replace(/ /g, '_')
      var newFile = new File([grabbedFile], newName);
      if (newFile && newFile.name.length > 0) {
        Papa.parse(newFile, {
          download: true,
          skipEmptyLines: true,
          header: true,
          complete: data => {
            setFileDetails({
              ...fileDetails,
              [type]: data.data
            });
            processContacts(data,"grab")
          }

        });      
      } else {
        console.debug("No Data??");
      }
    };

    var processContacts = (data,source) => {
      var contacts = []
      var creators = []
      // We render two from one TSV if we upload a file
      if (source && source === "grab") {
        for (const row of data.data) {
          console.debug('%c⊙', 'color:#00ff7b', "row", row);
          creators.push(row)
          if (row.is_contact==="TRUE") {
            contacts.push(row)
          }
        }
        setFormValues({
          ...formValues,
          contacts: contacts,
          creators: creators
        });
      } else {
        // setFormValues({
        //   ...formValues,
        //   contacts: editingCollection.contacts,
        //   creators: editingCollection.creators
        // });
      
      }
      

    }

    var processUUIDs = (event) => {
      const { name, value, type } = event.target;
      console.debug("handleUUIDList", name, value, type);
    };

    var renderTableRows = (rowDetails) => {
  
      if (rowDetails.length > 0) {
        return rowDetails.map((row, index) => {
          return (
            <TableRow
              key={("rowName_" + index)}
              className="row-selection"
            >
              <TableCell className="clicky-cell" scope="row">{row.name}</TableCell>
              <TableCell className="clicky-cell" scope="row">{row.affiliation}</TableCell>
              <TableCell className="clicky-cell" scope="row"> {row.orcid_id} </TableCell>
            
            </TableRow>
          );
        });
      
      }
    }
  

  
    var renderContribTable = () => {
    
      return (
        //   <SourceTable
        //     headers={{
        //       name:"Name",
        //       affiliation:"Affiliation",
        //       orcid_id:"Orcid Id",
        //     }}
        //     rows={formValues.creators}
        //     cellAction={() => sourceRemover()}
        //     writeable={true}
        //   />  


        <TableContainer
          component={Paper}
          style={{ maxHeight: 450 }}
        >
          <Table aria-label="Associated Collaborators" size="small" className="table table-striped table-hover mb-0">
            <TableHead className="thead-dark font-size-sm">
              <TableRow className="   " >
                <TableCell> Name</TableCell>
                <TableCell component="th">Affiliation</TableCell>
                <TableCell component="th">Orcid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableRows(formValues.creators)}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }

    var renderContactTable = () => {
      return (
        <TableContainer
          component={Paper}
          style={{ maxHeight: 450 }}
        >
          <Table aria-label="Associated Contacts" size="small" className="table table-striped table-hover mb-0">
            <TableHead className="thead-dark font-size-sm">
              <TableRow className="   " >
                <TableCell> Name</TableCell>
                <TableCell component="th">Affiliation</TableCell>
                <TableCell component="th">Orcid</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableRows(formValues.contacts)}
            </TableBody>
          </Table>
        </TableContainer>
      )
    }


    var creationSuccess = (response) => {
      var resultInfo = {
        entity: response.results
      };
      setEntityInfo(resultInfo);
      props.onProcessed(resultInfo)
      // setSuccessDialogRender(true);
      // console.debug("resultInfo", resultInfo);
      // console.debug();
    }

  var formatDatatype = (row) => {
    console.debug('%c⊙', 'color:#00ff7b', "formatDatatype", row, row.display_subtype, row.data_types);
    return ("DT");
  }

 
 

  
    return (
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          margin: '0 0',
        }}
      >
        <div className="w-100">

          <div className="row">
            <div className="col-md-12 mb-4">
              <h3>
                {!props.newForm && editingCollection && (
                  <span className="">
                    HuBMAP Collection ID: {editingCollection.hubmap_id}
                    {" "}
                  </span>
                )}
                {(props.newForm) && (
                  <span className="mx-1">
                    Registering a Collection
                  </span>
                )}
              </h3>
              {!props.newForm && (
                <h5>{props.editingCollection.title}</h5>
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
            effect='solid'
          >
            <p>
              The source tissue samples or data from which this data was derived.  <br />
              At least <strong>one source </strong>is required, but multiple may be specified.
            </p>
          </ReactTooltip>
        
          {loadingDatasets && (
            <LinearProgress />
          )}
          
        
          {!loadingDatasets && (<>
          
            <TableContainer
              component={Paper}
              style={{ maxHeight: 450 }}
            >
              <Table aria-label="Associated Datasets" size="small" className="table table-striped table-hover mb-0">
                <TableHead className="thead-dark font-size-sm">
                  <TableRow className="   " >
                    <TableCell> Source ID</TableCell>
                    {/* <TableCell component="th">Lab Dataset ID</TableCell> */}
                    <TableCell component="th">Data Type</TableCell>
                    <TableCell component="th">Group Name</TableCell>
                    <TableCell component="th">Status</TableCell>
                    <TableCell component="th" align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                {sourceDatasetDetails && sourceDatasetDetails.length > 0 && (
                  <TableBody>
                    {sourceDatasetDetails.map((row, index) => (
                      <TableRow
                        key={(row.hubmap_id + "" + index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                        // onClick={() => this.handleSourceCellSelection(row)}
                        className="row-selection"
                      >
                        <TableCell className="clicky-cell" scope="row">{row.hubmap_id}</TableCell>
                        {/* <TableCell className="clicky-cell" scope="row"> {row.data_types ? row.data_types[0] : row.display_subtype} </TableCell> */}
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
                    display: 'inline-flex',
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
                        //   display: 'flex',
                        //   flexDirection: 'row', 
                      }}>
                      <StyledTextField
                        name="dataset_uuids"
                        id="dataset_uuids"
                        error={formErrors.dataset_uuids && formErrors.dataset_uuids.length > 0 ? true : false}
                        disabled={false}
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
                custom_title="Search for a Source ID for your Collection"
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
            label="Title"
            name="title"
            id="title"
            error={formErrors.title && formErrors.title.length > 0 ? true : false}
            disabled={false}
            helperText={formErrors.title && formErrors.title.length > 0 ? "The title of the Collection is Required" : "The title of the Collection" }
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
            multiline
            rows={4}
            error={formErrors.description && formErrors.description.length > 0 ? true : false}
            disabled={false}
            helperText={formErrors.title && formErrors.title.length > 0 ? "A description of the Collection is Required" : "A description of the Collection" }
            variant="standard"
            onChange={handleInputChange}
            value={formValues.description}
          />
        </FormControl>
        <FormControl>
          <Typography sx={{ color: 'rgba(0, 0, 0.2, 0.6)' }}>
            Contributors
          </Typography>
          {formValues.creators && formValues.creators.length > 0 && (
            <>{renderContribTable()} </>
          )}
          {/* {renderContactTable()} */}
        </FormControl>

        <FormControl>
          <Typography sx={{ color: 'rgba(0, 0, 0.2, 0.6)' }}>
            Contacts
          </Typography>
          {formValues.contacts && formValues.contacts.length > 0 && (
            <>{renderContactTable()} </>
          )}

          <div className="text-left">
            <label>
              <input
                accept=".tsv, .csv"
                type="file"
                id="FileUploadContacts"
                name="Contacts"
                onChange={(e) => handleFileGrab(e, "contacts")}
              />
            </label>
          </div>
        </FormControl>

        <div className="row">
          <div className="buttonWrapRight">
            <Button
              variant="contained"
              onClick={() => handleSubmit()}
              type="button"
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