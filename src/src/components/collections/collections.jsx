import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom";
import "../../App.css";
import SearchComponent from "../search/SearchComponent";
// import SourceTable from "../ui/table";
import { entity_api_get_entity,entity_api_create_entity} from '../../service/entity_api';

import { getPublishStatusColor } from "../../utils/badgeClasses";
import SourceTable from "../ui/table.jsx";

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
import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield,faPenToSquare } from "@fortawesome/free-solid-svg-icons";

import Typography  from '@mui/material/Typography';

export function CollectionForm (props){
  var [isNew] = useState(props.newForm);
  var [selectedSource, setSelectedSource] = useState(null);
  var [sourceDatasetDetails, setSourceDatasetDetails] = useState([]);
  var [selectedSources, setSelectedSources] = useState([]);
  var [fileDetails, setFileDetails] = useState();
  var [buttonState, setButtonState] = useState('');
  var [lookupShow, setLookupShow] = useState(false);
  var [loadingDatasets, setLoadingDatasets] = useState(true);
  var [hideUUIDList, setHideUUIDList] = useState(true);
  var [loadUUIDList, setLoadUUIDList] = useState(false);
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
    creators: [{}],
    contacts: [{}],
  });

  var [editingCollection] = useState(props.editingCollection);
  // let { editingCollection } = props
  const ariaLabel = { 'aria-label': 'description' };


  useEffect(() => {
    if (editingCollection) {  
      setSourceDatasetDetails([]) 
      if (editingCollection.datasets && editingCollection.datasets.length > 0) {        
        for (const entity of editingCollection.datasets) {
          setSourceDatasetDetails((rows) => [...rows, entity]); // Populate the info for table
          setSelectedSources((UUIDs) => [...UUIDs, entity.uuid]); // UUID list for translating to form values
        }
        
      }
    }
  }, [editingCollection]);

  useEffect(() => {
    // if we;ve got em all
    if (!isNew && selectedSources && editingCollection.datasets.length === selectedSources.length) {
      var formVals = editingCollection; // dont try modifying prop
      formVals.dataset_uuids = selectedSources
      setFormValues(formVals);
      setLoadingDatasets(false);
    } else {
      setLoadingDatasets(false);
    }
  }, [editingCollection,selectedSources,isNew]);

  

  // const errorClass = (error, e) => {
  //   // errorClass( {
  //   // console.debug("errorClass", error, e);
  //   if (error === "valid") return "is-valid";
  //   else if (error === "invalid" || error === "is-invalid") return "is-invalid";
  //   else if (error && error.length && error.length === 0) return "is-invalid";
  //   else return "";
  //   // return error.length === 0 ? "" : "is-invalid";
  // }

 
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



  const handleSelectClick = (event) => {
    // var selection = event.row;
    console.debug("handleSelectClick SelctedSOurces", event.row, event.row.uuid);

    // The update to the selectedSources state isn't immediate,
    // so we'll copy it into a var, push, and use THAT
    // to update the form values instead
    // var slist = formValues.dataset_uuids;
    // console.debug("SLIST", slist,  typeof slist, event.row.uuid);
    // // slist = slist.push('asdasd27fd8c958f4478ab60df2555174c6e92');
    // // slist = slist.push(event.row.uuid);
    // console.debug("SLIST Update", slist);

    // setFormValues((prevValues) => ({
    //   ...prevValues,
    //   'dataset_uuids': slist,
    // }));
    setSourceDatasetDetails((rows) => [...rows, event.row]); 
    setSelectedSources((UUIDs) => [...UUIDs, event.row.uuid]);
    
    hideLookUpModal();
  };  


  const sourceRemover = (row, index) => {
    var sourceUUIDList = selectedSources;
    var sourceDetailList = sourceDatasetDetails;
    // var newUUIDLIST = sourceUUIDList.filter((item, i) => i !== row);
    // var newDetailList = sourceDetailList.filter((item) => item.uuid !== row.uuid);
    // console.debug("sourceRemover",  row.uuid, newUUIDLIST, newDetailList);
    setSelectedSources(sourceUUIDList.filter((item, i) => i !== row));
    setSourceDatasetDetails(sourceDetailList.filter((item) => item.uuid !== row.uuid)); 
    setFormValues((prevValues) => ({
      ...prevValues,
      'dataset_uuids': selectedSources,
    }))
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

  const handleInputUUIDs = (event) => {
    event.preventDefault();
    // const { name, value, type } = event.target;
    if (!hideUUIDList && formValues.dataset_uuids.length > 0) {
      // Already open, we're saving now
      // if (formErrors.dataset_uuids && formErrors.dataset_uuids.length > 0){
        handleUUIDListLoad()
      // }
    } else {
      setHideUUIDList(!hideUUIDList)
    }
    
  };

  const handleUUIDListLoad = () => {
    var value = formValues.dataset_uuids
    var uuidArray = value;
    // setLoadUUIDList(true)
    if (typeof value === 'string' || value instanceof String) {
      uuidArray  = value.split(",")
    } 
      
    
    // console.debug("uuidArray",uuidArray);
    for (const ds of uuidArray) {
      entity_api_get_entity(ds, JSON.parse(localStorage.getItem("info")).groups_token )
      .then((response) => {
        // @TODO why is it not coming back as an actua catchable error though??
        if (response.status !== 200) {
          setFormErrors((prevValues) => ({
            ...prevValues,
            'dataset_uuids': response.results.error,
          }))
        } else {   
          setSourceDatasetDetails((rows) => [...rows, response.results]);
        }
      })  
      .catch((error) => {
        setLoadUUIDList(false)
      }); 
    }
    setHideUUIDList(true)
    setLoadUUIDList(false)
    // setHideUUIDList(!hideUUIDList)
    
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    setButtonState("submit");
   
    var datasetUUIDs = []
    sourceDatasetDetails.map((row, index) => {
      console.debug("Row", row, index)
      datasetUUIDs.push(row.uuid)
    })
    var formSubmit = formValues;
    formSubmit["dataset_uuids"] = datasetUUIDs;
    console.debug("handleSubmit", formSubmit);

    entity_api_create_entity("collection", formSubmit, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        console.debug("handleSubmit",response.results.uuid, response);
        // props.onCreated(response.results.uuid);
        props.onCreated(response.results.uuid);
        window.history.pushState(
          null,
          "", 
          "/collection/"+response.results.uuid);
          window.location.reload();
      })
      .catch((error) => {
        console.debug("handleSubmit Error", error);
      });

  };


  var handleFileGrab = (e,type) => {
    console.debug("handleFileGrab", type,e);
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile =  new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      // setFormValues({ ...formValues, 
      //   ['file']: newFile
      // });
      Papa.parse(newFile, {
        download: true,
        skipEmptyLines: true,
        header: true,
        complete: data => {
          console.debug("PapaParse", data, data.data);
          setFileDetails({ ...fileDetails,
            [type]: data.data
          });
          processContacts(data)
        }

    });

      
    }else{
      console.debug("No Data??");
    }
  };

  var processContacts = (data) => {
    var result = data.data.reduce((r, o) => {
        r[o.is_contact==="TRUE" ? 'contacts' : 'creators'].push(o);
        return r;
    }, { contacts: [], creators: [] });

    console.log(result, result.contacts, result.creators);
    var contacts = result.contacts
    var creators = result.creators

    // console.debug("FileDetails", fileDetails);
    setFormValues({ ...formValues,
      contacts:contacts,
      creators:creators
    });

  }

  var processUUIDs = (event) => {
    const { name, value, type } = event.target;
    console.debug("handleUUIDList", name, value, type);
  };



  var renderTableRows = (rowDetails) => {
    if (rowDetails.length > 0) {

      // <SourceTable
      //   headers={}
      //   rows={}
      //   cellAction={}
      //   writeable={}
      // />
      return rowDetails.map((row, index) => {
        return (
          <TableRow 
            key={("rowName_"+index)}
            className="row-selection"
            >
            <TableCell  className="clicky-cell" scope="row">{row.name}</TableCell>
            <TableCell  className="clicky-cell" scope="row">{row.affiliation}</TableCell>
            <TableCell  className="clicky-cell" scope="row"> {row.orcid_id} </TableCell>
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
            <TableCell component="th">Action</TableCell>
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
            <TableCell component="th">Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {renderTableRows(formValues.contacts)}
        </TableBody>
      </Table>
    </TableContainer> 
    )
  }

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
      onSubmit={(e) => handleSubmit(e)}
    >

      <div className="w-100">

        <div className="row">
          <div className="col-md-6 mb-4">
            <h3>
              {!props.newForm && editingCollection && (
                <span className="">
                  HuBMAP Collection ID {editingCollection.hubmap_id}
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
          <LinearProgress/>
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
              {sourceDatasetDetails && sourceDatasetDetails.length >0 && (
              <TableBody>
                {sourceDatasetDetails.map((row, index) => (
                  <TableRow 
                    key={(row.hubmap_id+""+index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                    // onClick={() => this.handleSourceCellSelection(row)}
                    className="row-selection"
                    >
                    <TableCell  className="clicky-cell" scope="row">{row.hubmap_id}</TableCell>
                    <TableCell  className="clicky-cell" scope="row"> {row.display_subtype && ( row.display_subtype)} </TableCell>
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
              )}
            </Table>
          </TableContainer>
          <Box className="mt-2 w-100" width="100%"  display="flex">
              <Box p={1} className="m-0  text-right" flexShrink={0} flexDirection="row"  >
                <Button
                  variant="contained"
                  type='button'
                  size="small"
                  className='btn btn-neutral'
                  onClick={() => handleLookUpClick()} 
                  >
                  Add {formValues.dataset_uuids && formValues.dataset_uuids.length>=1 && (
                    "Another"
                    )} Source 
                  <FontAwesomeIcon
                    className='fa button-icon m-2'
                    icon={faPlus}
                  />
                </Button>
                
                {/* <Button
                  variant="text"
                  type='link'
                  size="small"
                  className='mx-2'
                  onClick={(event) => handleInputUUIDs(event)} 
                  >
                  {hideUUIDList && (<>Bulk</> )}
                  {!hideUUIDList && (<>Save</> )}
                  <FontAwesomeIcon
                    className='fa button-icon m-2'
                    icon={faPenToSquare}
                  />
                </Button> */}
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
                    <TextField
                      name="dataset_uuids"
                      id="dataset_uuids"
                      error={formErrors.dataset_uuids && formErrors.dataset_uuids.length>0 ? true : false}
                      disabled={false}
                      inputProps={ariaLabel}
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
          {formErrors.dataset_uuids && formErrors.dataset_uuids.length >0 && (
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
          onClose={hideLookUpModal}
          aria-labelledby="source-lookup-dialog"
          open={lookupShow}>
          <DialogContent>
            <SearchComponent
              select={(e) => handleSelectClick(e)}
              custom_title="Search for a Source ID for your Collection"
              // filter_type="Publication"
              modecheck="Source"
              restrictions={{
                entityType : "dataset"
              }}
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
      <FormControl>
        <TextField
          label="Title"
          name="title"
          id="title"
          error={false}
          disabled={false}
          helperText={"The title of the COllection"}
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
          error={false}
          disabled={false}
          helperText={"A description of the Collection"}
          variant="standard"
          onChange={handleInputChange}
          value={formValues.description}
        />
      </FormControl>
       
              
      <FormControl>
        <Typography sx={{color: 'rgba(0, 0, 0.2, 0.6)'}}>
          Contributors
        </Typography>
        {formValues.creators && formValues.creators.length>0  && (
          <>{renderContribTable()} </>
        )}
        {/* {renderContactTable()} */}
      </FormControl>

      <FormControl>
        <Typography sx={{color: 'rgba(0, 0, 0.2, 0.6)'}}>
          Contacts
        </Typography>
        {formValues.contacts && formValues.contacts.length>0  && (
          <>{renderContactTable()} </>
        )}

        <div className="text-left"> 
          <label>
            <input
              accept=".tsv, .csv"
              type="file"
              id="FileUploadContacts"
              name="Contacts"
              onChange={(e) => handleFileGrab(e,"contacts")}
            />
          </label>
        </div>
      </FormControl>

      <div className="row">
      <div className="buttonWrapRight">
          <Button variant="contained" type="submit" className='float-right'>
            {buttonState==="submit" && (
              <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {buttonState !=="submit" && (   
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



