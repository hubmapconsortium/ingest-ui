import React, { useEffect, useState } from 'react';
import "../../App.css";
import SearchComponent from "../search/SearchComponent";
// import SourceTable from "../ui/table";
import { entity_api_get_entity} from '../../service/entity_api';

import { getPublishStatusColor } from "../../utils/badgeClasses";

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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield } from "@fortawesome/free-solid-svg-icons";


export function CollectionForm (props){
  var [selectedSource, setSelectedSource] = useState(null);
  var [sourceDatasetDetails, setSourceDatasetDetails] = useState([]);
  var [selectedSources, setSelectedSources] = useState([]);
  var [lookupShow, setLookupShow] = useState(false);
  var [formErrors, setFormErrors] = useState({
    title:"",
    description: "",
    file: "",
    dataset_uuids: [],
    creators: [],
    contacts: [],
  });
  var [formValues, setFormValues] = useState({
    title: '',
    description: '',
    file: "",
    dataset_uuids: [],
    creators: [{}],
    contacts: [{}],
  });
  let { editingCollection } = props


  useEffect(() => {
    console.debug("CollectionForm useEffect", editingCollection);
    if(editingCollection){  
      // editingCollection["dataset_uuids"] = ["9c9f27da754e677e7eeede464fd4c97d"]
      setFormValues(editingCollection)  
      // var uuids = ;
      console.debug("UUIDS",editingCollection.dataset_uuids);
      var sourceDatasetDetailsArray = []
      // Till I fix the re-rendering coming from App.js, this will keep us from loading the 
      //  same data multiple times*+8
      setSourceDatasetDetails([]) 
      if(editingCollection.dataset_uuids && editingCollection.dataset_uuids.length > 0){


        for (const entity of editingCollection.dataset_uuids) {
          console.debug("InnerFor");
          entity_api_get_entity(entity, JSON.parse(localStorage.getItem("info")).groups_token )
          .then((response) => {
            console.debug("DatasetFetch",entity,response);
            setSourceDatasetDetails((rows) => [...rows, response.results]);
          })  
          .catch((error) => {
            console.debug("fetchEntity Error", error);
          }); 
        }
      }
        
      }
    }, [editingCollection]);

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
    // slist.push(selection.row);   
    setSourceDatasetDetails((rows) => [...rows, selection.row]);
    // setSelectedSources(slist);
    setFormValues({
        ...formValues,
        ['dataset_uuids']: selectedSources
    });
    
    hideLookUpModal();
  };  
  const  sourceRemover = (row,index) => {
    var slist =selectedSources
    console.debug("sourceRemover", slist, typeof slist, row, index);
    slist = slist.filter((source) => source.uuid !== row.uuid);
    setFormValues({
        ...setFormValues,
        ['dataset_uuids']: slist
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

  // var handleUpload= () =>{
  //     const formData = new FormData()
  //     formData.append("file",formData.tsvFile)
  //     setFormValues({ ...formValues, file: formData });
     
  // }

  var handleFileGrab = (e,type) => {
    console.debug("handleFileGrab", type);
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile =  new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      setFormValues({ ...formValues, 
        ['file']: newFile
      });
      Papa.parse(newFile, {
        download: true,
        skipEmptyLines: true,
        header: true,
        complete: data => {
          console.debug("PapaParse", data, data.data);
          setFormValues({ ...formValues,
            [type]: data.data
          });
            // setRows(data.data);
        }
    });
    }else{
      console.debug("No Data??");
    }
  };

  // var renderFileGrabber = (type) =>{
  //   console.debug("renderFileGrabber", type);
  //   return (
  //     <div className="text-left"> 
  //     <label>
  //       <input
  //         accept=".tsv, .csv"
  //         type="file"
  //         id="FileUploader"
  //         name="file"
  //         onChange={(e,type) => handleFileGrab(e,type)}
  //       />
  //     </label>
  //     </div>
  //   );
  // }

  var renderTableRows = (rowDetails) => {
    if(rowDetails.length > 0){
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
      // <SourceTable
      //   headers={{
      //     name:"Name",
      //     affiliation:"Affiliation",
      //     orcid_id:"Orcid Id",
      //   }}
      //   rows={formValues.creators}
      //   cellAction={() => sourceRemover()}
      //   writeable={true}
      // />  


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
      onSubmit={() => handleSubmit()}
    >

      <div className="w-100">

        <div className="row">
          <div className="col-md-6 mb-4">
            <h3>
              {!props.newForm && (
                <span className="">
                  HuBMAP Collection ID {props.editingCollection.hubmap_id}
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

        <TableContainer 
          component={Paper} 
          style={{ maxHeight: 450 }}
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
            {sourceDatasetDetails && sourceDatasetDetails.length >0 && (
            <TableBody>
              
              {sourceDatasetDetails.map((row, index) => (
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
            )}
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
                Add {formValues.dataset_uuids && formValues.dataset_uuids.length>=1 && (
                  "Another"
                  )} Source 
                <FontAwesomeIcon
                  className='fa button-icon m-2'
                  icon={faPlus}
                />
              </Button>
            </Box>
            <Box p={1} width="100%"   >
            {/* {errorClass(formErrors.dataset_uuids) && (
                  <Alert severity="error" width="100% " >
                    {formErrors.dataset_uuids}  {formErrors.source_uuid} 
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
        <label htmlFor="file-input">
          Contributors
        </label>
        {/* {formValues.contributors && formValues.contributors.length>0  && ( */}
          {renderContribTable()}
        {/* )} */}
        {/* {renderContactTable()} */}

        <div className="text-left"> 
          <label>
            <input
              accept=".tsv, .csv"
              type="file"
              id="FileUploadCreators"
              name="Creators"
              onChange={(e) => handleFileGrab(e,"creators")}
            />
          </label>
        </div>
          
      </FormControl>

      <FormControl>
        <label htmlFor="file-input">
          Contacts
        </label>
        {/* {formValues.contributors && formValues.contributors.length>0  && ( */}
          {renderContactTable()}
        {/* )} */}
        {/* {renderContactTable()} */}

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
        Submit
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



