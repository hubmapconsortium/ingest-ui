import React, { useEffect, useState } from 'react';
// import {useNavigate} from "react-router-dom";
import "../../App.css";
import SearchComponent from "../search/SearchComponent";
import {COLUMN_DEF_MIXED,COLUMN_DEF_MIXED_SM,COLUMN_DEF_COLLECTION} from "../search/table_constants";
import { entity_api_get_entity,entity_api_create_entity, entity_api_update_entity} from '../../service/entity_api';
import {ingest_api_publish_collection,ingest_api_user_admin,ingest_api_validate_contributors} from '../../service/ingest_api';
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { generateDisplaySubtypeSimple_UBKG } from "../../utils/display_subtypes";
import Papa from 'papaparse';
import {GridLoader} from "react-spinners";
import ReactTooltip from "react-tooltip";
import { TextField, Button, Box } from '@mui/material';
import Paper from '@material-ui/core/Paper';
import FormControl from '@mui/material/FormControl';
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import GroupModal from "../uuid/groupModal";
import LoadingButton from '@mui/lab/LoadingButton';
import {ErrBox} from "../../utils/ui_elements";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {DataGrid,GridToolbar} from "@mui/x-data-grid";

import Alert from '@mui/material/Alert';
import Collapse from '@mui/material/Collapse';
import LinearProgress from '@material-ui/core/LinearProgress';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faUpRightFromSquare, faTrash, faExclamationTriangle, faCheck, faPlus,faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from "@mui/material/styles";
const StyledTextField = styled(TextField)`
  textarea {
    resize: both;
  }
`;
export function EPICollectionForm (props){
  // let navigate = useNavigate();
  // var [selectedGroup, setSlectedGroup] = useState(props.dataGroups[0]).uuid;
  var [associatedEntities, setassociatedEntities] = useState([]);
  var [associatedEntitiesInitial, setassociatedEntitiesInitial] = useState([]);
  var [buttonState, setButtonState] = useState('');
  var [contributorValidationErrors, setContributorValidationErrors] = useState('');
  var [entityInfo, setEntityInfo] = useState();
  var [fileDetails, setFileDetails] = useState();
  var [hideUUIDList, setHideUUIDList] = useState(true);
  var [loadingDatasets, setLoadingDatasets] = useState(true);
  var [loadUUIDList, setLoadUUIDList] = useState(false);
  var [locked, setLocked] = useState(false);
  var [disableSubmit, setDisableSubmit] = useState(false);
  var [validatingContributorsUpload, setValidatingContributorsUpload] = useState(false);
  var [lookupShow, setLookupShow] = useState(false);
  var [openGroupModal, setOpenGroupModal] = useState(false );
  var [pageError, setPageError] = useState("");
  var [publishing, setPublishing] = useState(false);
  var [selectedSource, setSelectedSource] = useState(null);
  var [selectedSources, setSelectedSources] = useState([]);
  var [successDialogRender, setSuccessDialogRender] = useState(false);
  var [userAdmin, setUserAdmin] = useState(false);
  var [validatingSubmitForm, setValidatingSubmitForm] = useState(false);
  var [warningOpen, setWarningOpen] = React.useState(false);
  // var [publishError, setPublishError] = useState({
  //   status:"",
  //   message:"",
  // });
  // @TODO: See what we can globalize/memoize/notize here
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  var [formWarnings, setFormWarnings] = useState({
    bulk_dataset_uuids:""
  });
  var [formErrors, setFormErrors] = useState({
    title:"",
    description: "",
    dataset_uuids: "",
    contributors: [],
    contacts: [],
    bulk_dataset_uuids:["","",""]
  });
  var [formValues, setFormValues] = useState({
    title: '',
    description: '',
    dataset_uuids: [],
    contributors: [],
    group_uuid:"",
    contacts: [],
  });
  // Props
  var [isNew] = useState(props.newForm);
  var [dataGroups] = useState(props.dataGroups);
  var [datatypeList] = useState(props.dtl_all);
  var [editingCollection] = useState(props.editingCollection);


  useEffect(() => {
    ingest_api_user_admin(JSON.parse(localStorage.getItem("info")).groups_token)
        .then((results) => {
          console.debug('%c◉ ADMINCHECK ', 'color:#3F007b', results);
          setUserAdmin(results)
        })
        .catch((err) => {
          console.debug('%c⭗', 'color:#1f005d', "ingest_api_user_admin ERR", err );
        })
  }, []);
  
  useEffect(() => {
    if (editingCollection) {  
      setassociatedEntities([]) 
      var formVals = editingCollection; // dont try modifying prop
      var UUIDs = [];
      if (editingCollection.associations && editingCollection.associations.length > 0) {
        for (const entity of editingCollection.associations) {
          entity.id = entity.uuid;
          //When coming from the Entity, the Datasets use dataset_type, from the Search UI they pass display_subtype instead
          if (entity.dataset_type && entity.dataset_type.length > 0) {
            var subtype = "";
            if (typeof entity.dataset_type === 'string'){
              subtype = generateDisplaySubtypeSimple_UBKG(entity.dataset_type,props.dtl_all);
            }else{
              subtype = generateDisplaySubtypeSimple_UBKG(entity.dataset_type[0],props.dtl_all);
            }
            entity.display_subtype = subtype;
          }else {
            
          }
          setassociatedEntities((rows) => [...rows, entity]); // Populate the info for table
          setSelectedSources((UUIDs) => [...UUIDs, entity.uuid]); // UUID list for translating to form values
          UUIDs.push(entity.uuid);
        }
        formVals.dataset_uuids = UUIDs
        setassociatedEntitiesInitial(UUIDs)
      }
      if (editingCollection.contributors && editingCollection.contributors.length > 0) {
        formVals.contributors = editingCollection.contributors
      }
      setFormValues(formVals);  
      setLoadingDatasets(false);
      if (editingCollection.doi_url || editingCollection.registered_doi) {
        // Cant be editied further after DOI information is added
        setLocked(true);
      }
    } else {
      // We must be new. No table data to load
      setLoadingDatasets(false);
    }
  }, [editingCollection]);

  const handleSelectClick = (event) => {
    if (!selectedSources.includes(event.row.uuid)) {
      setassociatedEntities((rows) => [...rows, event.row]); 
      setSelectedSources((UUIDs) => [...UUIDs, event.row.uuid]);

      // The state might not update in time so we'll clone push and set
      var currentUUIDs = associatedEntities.map(({ uuid }) => uuid)
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


  const handleEvent: GridEventListener<'cellClick'> = (
    params, // GridRowParams
    event, // MuiEvent<React.MouseEvent<HTMLElement>>
    details, // GridCallbackDetails
  ) => {
    console.debug('%c◉ CELLCLICK params ', 'color:#eeff7b', params.row,params.field);
    if(params.field === "uuid"){
      sourceRemover(params.row)
    }
  };

  const sourceRemover = (row, index) => {
    var sourceUUIDList = selectedSources;
    let filteredUUIDs = sourceUUIDList.filter((item) => item !== row.uuid)
    setSelectedSources(filteredUUIDs);
    console.debug('%c⊙', 'color:#00ff7b', "filteredUUIDs", filteredUUIDs);
    
    var sourceDetailList = associatedEntities;
    let filteredDetailList = sourceDetailList.filter((item, i) => item.uuid !== row.uuid)
    setassociatedEntities(filteredDetailList);
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

  const hideGroupModal = (event) => {
    setOpenGroupModal(false);
  }
  

  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
    console.debug("handleInputChange", name, value, type);
    if (type === 'file') {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: event.target.files[0],
      }));
    } else {
      if(name === 'groups'){
        console.debug('%c◉ GROUPS FPOUND ', 'color:#00ff7b', value );
        setFormValues((prevValues) => ({
          ...prevValues,
          'group_uuid': value,
        }));
        setValidatingSubmitForm((prevValues) => ({
          ...prevValues,
          'group_uuid': value,
        }));
        
      }else{
        setFormValues((prevValues) => ({
          ...prevValues,
          [name]: value,
        }));
      }
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
    var errCount = 0;
    var processed = associatedEntities.map(({ uuid }) => uuid); //the state might not update fast enough sequential dupes
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
      let errFlag= 0;
      console.debug('%c⊙', 'color:#00ff7b', "ds",ds, processed.includes(ds), processed );
      setLoadingDatasets(true)
      if (ds.length !== 0 && !processed.includes(ds)) { 
        console.debug('%c⊙', 'color:#00ff7b', "ds", ds, processed.includes(ds) );
        entity_api_get_entity(ds, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((response) => {
            if ((response.status === 400 || response.status === 404) && response.data && response.data.error) {
              // Not Found / Invalid
              errFlag++;
              setFormErrors((prevValues) => ({
                ...prevValues,
                'bulk_dataset_uuids': response.data.error.split(': '),
              }))
            }
            else if (response.status !== 200 && response.status !== 400 && response.status !== 404) {
              //Not Validation Errors but AN error
              errFlag++;
              handleErrorParse(response);
            } else {
              let row = response.results;
              if (!processed.includes(row.uuid)) {  
                if (!row.display_subtype && row.dataset_type) {
                  // entity does not return display subtype, so we'll generate it
                  row.display_subtype = generateDisplaySubtypeSimple_UBKG(row.dataset_type, props.dtl_all);
                  row.id=row.uuid;
                  setassociatedEntities((rows) => [...rows, row]);
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
      errCount += errFlag;

    };   
    setLoadingDatasets(false)
    if (errCount >0) { 
      // If we've got no errors we can shrinkydink the box
      console.debug('%c⊙', 'color:#00ff7b', "No Errors" );     
      setHideUUIDList(true)
      setLoadUUIDList(false)
    }
    
  }

  function removeEmpty(obj) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v != null)
        .map(([k, v]) => [k, v === Object(v) ? removeEmpty(v) : v])
    );
  }
  function validateForm(formValues) {
    console.debug('%c◉ validateForm FormValues ', 'color:#00ff7b', );
    var isValid = true;
    let { title, description, contributors, contacts } = formValues;
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
      associatedEntities.map((row, index) => {
        datasetUUIDs.push(row.uuid)
    })
    console.debug('%c⊙', 'color:#00ff7b', "datasetUUIDs", datasetUUIDs, datasetUUIDs.length );
    if (!datasetUUIDs || datasetUUIDs.length === 0) {
      console.debug('%c⭗', 'color:#ff005d', "No Datasets" );
      setFormErrors((prevValues) => ({
        ...prevValues,
        'dataset_uuids': "At least one Member is required",
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
    // Only include if presnent, ignore if not
    console.debug('%c⊙', 'color:#00ff7b', "contributors",contributors );
    if (contributors && (contributors[0] && contributors[0].orcid!==undefined)) {
      formValuesSubmit.contributors = contributors
    }
    // Do not send blank contacts
    if (contacts && (contacts[0])) {
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
    setValidatingSubmitForm(submitForm);
    console.debug('%c⊙ setValidatingSubmitForm', 'color:#00ff7b', submitForm);

    if (submitForm!==false) {
      if (editingCollection) {
        // strip the associated UUIDs if they're the same as before 
        var startingUUIDs = associatedEntitiesInitial.sort();
        var forumUUIDs = submitForm.dataset_uuids.sort();

        console.debug('%c◉ associatedEntitiesInitial VS forumUUIDs ', 'color:#00ff7b',startingUUIDs, forumUUIDs, startingUUIDs === forumUUIDs );
        if(startingUUIDs.toString() === forumUUIDs.toString()){
          console.debug('%c⊙', 'color:#00ff7b', "SAME");
          delete submitForm.dataset_uuids
          // setValidatingSubmitForm((prevValues) => ({
          //   ...prevValues,
          //   "dataset_uuids": null 
          // }));
          var newSubmitForm = submitForm
          console.debug('%c◉  newSubmitForm', 'color:#00ff7b', newSubmitForm);
          handleUpdate(newSubmitForm);
        }else{
          handleUpdate(submitForm);
        }
        
      } else {
        console.debug('%c⊙', 'color:#00ff7b', "Creating");
        console.debug('%c⊙', 'color:#00ff7b', "Just need the group");
        console.debug('%c◉ dataGroups ', 'color:#00ff7b', dataGroups);
        if (dataGroups.length > 1){
          setValidatingSubmitForm((prevValues) => ({
            ...prevValues,
            "group_uuid": dataGroups[0].uuid //Select Loads with one selected, wont update if unchanged
          }));
          setOpenGroupModal(true);
        } else {
          // If they only have one datagroup, no need to ask
          handleCreate(submitForm);
        }
      }
    }else{
      setButtonState("");
    }
    
  };

  const handleCreate = (formSubmit) => {
    setOpenGroupModal(false);
    entity_api_create_entity("epicollection", formSubmit, props.authToken)
      .then((response) => {
        if(response.status === 200){
          props.onProcessed(response);
        }else{
          console.debug('%c⭗', 'color:#ff005d', "handleCreate NOT RIGHT", response.error, response.error.error);
          setPageError(response.error.error.toString());
          setButtonState("");
        }
        
      })
      .catch((error) => {
        console.debug('%c⭗', 'color:#ff005d', "handleCreate error", error);
        setPageError(error.toString());
        setButtonState("");

      });
  }


  const handlePublish = () => {
    setPublishing(true)
    ingest_api_publish_collection(props.authToken,editingCollection.uuid)
      .then((response) => {
        console.debug('%c◉ PUBLISHED ', 'color:#00ff7b', );
        // props.onProcessed(response);
        if(response.status === 200){
          console.debug('%c◉ Good ingest_api_publish_collection ', 'color:#00ff7b', response);
          props.onProcessed(response.results);
        }else{
          console.debug('%c◉ ingest_api_publish_collection  Bad result', 'color:#ff337b', response);
          setPublishing(false)
          let authMessage = response.status === 401 ? "User must be Authorized" : response.results.error.toString();
          setPageError(response.status + " |  " + authMessage);
        }
      })
      .catch((error) => {
        console.debug('%c⭗ handlePublishErr Broken Result', 'color:#ff005d', error);
        setPageError(error.status + " |  " + error.message);
        setPublishing(false);
      });
  }
  
  const handleUpdate = (formSubmit) => {
    // Need to only pass what's changed now
    console.debug('%c◉ formSubmit ', 'color:#00ff7b',formSubmit );
    entity_api_update_entity(formValues.uuid, formSubmit, props.authToken)
      .then((response) => {
        console.debug('%c⊙', 'color:#00ff7b', "handleUpdate response", response, response.results);
        if (response.status === 200) {
          // Only move on if we're actually good
          props.onProcessed(response.results);
        } else {
          console.debug('%c⭗', 'color:#ff005d', "handleUpdate NOT RIGHT", response.results.error);
          setPageError(response.results.error.toString());
          setButtonState("");
        }
      })
      .catch((error) => {
        console.debug('%c⭗', 'color:#ff005d', "handleUpdate error", error);
        setPageError(error.toString());
        setButtonState("");
      });
  }

  var handleFileGrab = (e, type) => {
    setValidatingContributorsUpload(true)
    setDisableSubmit(true);
    var grabbedFile = e.target.files[0];
    var newName = grabbedFile.name.replace(/ /g, '_')
    var newFile = new File([grabbedFile], newName);
    if (newFile && newFile.name.length > 0) {
      console.debug('%c◉ HAVE FILE ', 'color:#00ff7b', newFile);
      setFormErrors((prevValues) => ({
        ...prevValues,
        'contributors': "",
      }))
      ingest_api_validate_contributors(JSON.parse(localStorage.getItem("info")).groups_token, newFile)
        .then((response) => {
          if(response.status === 200){
            console.debug('%c◉ Success ', 'color:#00ff7b', response);
            setContributorValidationErrors()
            setDisableSubmit(false);
            setFormErrors((prevValues) => ({
              ...prevValues,
              'contributors': "",
            }))
            setValidatingContributorsUpload(false)
          }else{
            let errorSet = response.error.response.data.description;
            console.debug('%c◉ FAILURE ', 'color:#ff005d', errorSet)
            if (errorSet == "metadata_schema_id not found in header") {
              setContributorValidationErrors([
                {
                  "column": "N/A",
                  "error": "Metadata_schema_id not found in header",
                  "row": "N/A"
                }
              ]);
            }else if(errorSet == "This is not the latest version of the metadata specification as defined in CEDAR"){
              setContributorValidationErrors([
                {
                  "column": "N/A",
                  "error": "This is not the latest version of the metadata specification as defined in CEDAR",
                  "row": "N/A"
                }
              ])
            }else{
              setContributorValidationErrors(errorSet);
            }
            setFormErrors((prevValues) => ({
              ...prevValues,
              'contributors': "Please Review the list of errors provided",
            }))
            setValidatingContributorsUpload(false)
          }
        })
        .catch((error) => {
          console.debug('%c◉ FAILURE ', 'color:#ff005d', error);
        });
      
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

  var processContacts = (data) => {
    var contributors = []
    var contacts = []
      for (const row of data.data) {
        contributors.push(row)
        if(!row.is_contact){
          row.is_contact = "NO"
        }else if(row.is_contact && (row.is_contact === "TRUE"|| row.is_contact.toLowerCase()==="yes") ){
          contacts.push(row)
        }
        // contributors.push(row)
      }
      setFormValues ({
        ...formValues,
        contacts: contacts,
        contributors: contributors
      });
  }

  var processUUIDs = (event) => {
    const { name, value, type } = event.target;
    console.debug("handleUUIDList", name, value, type);
  };

  var renderValidatingOverlay = () => {
    return (
      <Box sx={{
        position: 'absolute',
        backgroundColor: 'rgba(25,25,25,0.8)',
        color:"white",
        display:"flex",
        width:"100%",
        height:"100%",
        zIndex: 1000
      }}>
        <GridLoader color="#fff"  style={{ margin:"auto"  }} size={23} loading={true}/>
        </Box >
    )
  }

  var renderTableRows = (rowDetails) => {
    if (rowDetails.length > 0) {
      return rowDetails.map((row, index) => {
        return (
          <TableRow
            key={("rowName_" + index)}
            className="row-selection"
          >
            <TableCell className="clicky-cell" scope="row">{row.display_name}</TableCell>
            <TableCell className="clicky-cell" scope="row">{row.affiliation}</TableCell>
            <TableCell className="clicky-cell" scope="row">{row.orcid} </TableCell>
            <TableCell className="clicky-cell" scope="row">{row.email	}</TableCell>
            <TableCell className="clicky-cell" scope="row"> { (row.is_contact && (row.is_contact==="TRUE" || row.is_contact.toLowerCase()==="yes"))  ? <FontAwesomeIcon icon={faCheck} /> : ""} </TableCell>
            <TableCell className="clicky-cell" scope="row">{row.is_principal_investigator	}</TableCell>
            <TableCell className="clicky-cell" scope="row">{row.is_operator	}</TableCell>
            <TableCell className="clicky-cell" scope="row">{row.metadata_schema_id}</TableCell>
            </TableRow>
        );
      });
    }
  }


  var renderContribTable = () => {
    return (
      <>
        {validatingContributorsUpload && (
          renderValidatingOverlay()
        )}
        <TableContainer style={{ maxHeight: 200 }}>
          <Table stickyHeader aria-label="Associated Collaborators" size="small" className="table table-striped table-hover mb-0">
            <TableHead className="thead-dark font-size-sm">
              <TableRow className="   " >
                <TableCell> Name</TableCell>
                <TableCell component="th">Affiliation</TableCell>
                <TableCell component="th">Orcid</TableCell>
                <TableCell component="th">Email</TableCell>
                <TableCell component="th">Is Contact</TableCell>
                <TableCell component="th">Is Principal Investigator</TableCell>
                <TableCell component="th">Is Operator</TableCell>
                <TableCell component="th">Metadata Schema ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTableRows(formValues.contributors)}
            </TableBody>
          </Table>
        </TableContainer>
        {contributorValidationErrors && contributorValidationErrors.length > 0 && (
          <Box> 
            Errors Found: <br />
            <div dangerouslySetInnerHTML={{ __html:renderContributorErrors() }}></div>
          </Box>
        )}
        {formErrors.contributors && formErrors.contributors.length > 0 && (
            <Box
              p={1}
              width="100%"
              sx={{
                // backgroundColor: '#FFCACA',
                color: 'red',
                padding: '10px',
              }}   >
              <FontAwesomeIcon icon={faExclamationTriangle} color="red" className='mr-1 red'/> {formErrors.contributors}
            </Box>
          )}  
      </>

    )
  }
  
  var renderContributorErrors = () => {
    let stylizedList = '<ul>';
      for (const error of contributorValidationErrors) {
        stylizedList += `<li>${error.error}</li>`;
      }
      stylizedList += '</ul>';
      return stylizedList;
  }

  var renderAssociationTable = () => {
    var hiddenFields = ["registered_doi"];
    var uniqueTypes = new Set(associatedEntities.map(obj => obj.entity_type.toLowerCase()));
    if ( (uniqueTypes.has("dataset") && uniqueTypes.size === 1) ) {
      // add submission_id to hiddenFields
      hiddenFields.push("submission_id");
    }
    function buildColumnFilter(arr) {
      let obj = {};
      arr.forEach(value => {
          obj[value] = false;
      });
      return obj;
    }
    var columnFilters = buildColumnFilter(hiddenFields)

    return (

      <div>
      {/* <div style={{ width:"100%", maxHeight: "340px",  overflowX:"auto", padding:"10px 0" }}> */}
        <DataGrid
          columnVisibilityModel={columnFilters}
          className='associationTable w-100'
          density='comfortable'
          rows={associatedEntities}
          columns={COLUMN_DEF_MIXED}
          disableColumnMenu={true}
          hideFooterPagination={true}
          hideFooterSelectedRowCount
          rowCount={associatedEntities.length}
          // rowHeight={45}
          onCellClick={handleEvent}
          loading={!associatedEntities.length > 0 && !isNew}
          
          sx={{
            // minHeight: '200px',
            // display: 'inline-block',
            // // overflow: 'auto',
            // '.MuiDataGrid-virtualScroller': {
            //   minHeight: '45px',
            //   // overflow: 'scroll',
            // },
            '.MuiDataGrid-main > .MuiDataGrid-virtualScroller': {
              minHeight: '60px',
              // overflowY: 'auto !important',
              // flex: 'unset !important',
            },
          }}
        />
      </div>
    );
  }

  var creationSuccess = (response) => {
    var resultInfo = {
      entity: response.results
    };
    setEntityInfo(resultInfo);
    props.onProcessed(resultInfo)
  }

  var formatDatatype = (row) => {
    console.debug('%c⊙', 'color:#00ff7b', "formatDatatype", row, row.display_subtype, row.dataset_type);
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
                  HuBMAP EPICollection ID: {editingCollection.hubmap_id}
                  {" "}
                </span>
              )}
              {(props.newForm) && (
                <span className="mx-1">
                  Registering an EPICollection
                </span>
              )}
            </h3>
            {!props.newForm && (
              <h5>{props.editingCollection.title}</h5>
            )}
            {editingCollection && editingCollection.doi_url  && (
              <h4 className="title_badge">
                doi: <a href={editingCollection.doi_url} target='_blank' >{editingCollection.doi_url} </a><FontAwesomeIcon icon={faUpRightFromSquare}/>
              </h4>
            )}
          </div>
        </div>

        <label htmlFor='dataset_uuids'>
          Associated Entities <span className='text-danger px-2'>*</span>
        </label>
        <FontAwesomeIcon
          icon={faQuestionCircle}
          data-tip
          data-for='associations_uuid_tooltip'
        />
        <ReactTooltip
          id='associations_uuid_tooltip'
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
        
        {renderAssociationTable()}

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
                )} Member
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
                      placeholder={"List of Dataset HuBMAP IDs or UUIDs, Comma Seperated "}
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
          aria-labelledby="association-lookup-dialog"
          open={lookupShow}>
          <DialogContent>
            <SearchComponent
              select={(e) => handleSelectClick(e)}
              custom_title="Search for an Associated Dataset for your Collection"
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
        {formValues.contributors && formValues.contributors.length > 0 && (
          <>{renderContribTable()} </>
        )}

        <div className="text-right">
          <Typography variant='caption'>Please refer to the <a href="https://hubmapconsortium.github.io/ingest-validation-tools/contributors/current/" target='_blank'>contributor file schema information</a>, and this <a href='https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/contributors/latest/contributors.tsv' target='_blank'>Example TSV File</a> </Typography>
        </div>
        <div className="text-left">
          <label>
            <input
              accept=".tsv, .csv"
              type="file"
              id="FileUploadContriubtors"
              name="Contributors"
              onChange={(e) => handleFileGrab(e, "contributors")}
            />
          </label>
        </div>
      </FormControl>

      {pageError.length > 0 && (
        <div className="row">
            <Alert variant="filled" severity="error">
              <strong>Error:</strong> {pageError}
            </Alert>
        </div>
      )}

      <div className="row">
        <div className="buttonWrapRight">
          {userAdmin === true && (editingCollection && !editingCollection.doi_url) && (          
            <LoadingButton 
              loading={publishing}
              onClick={() => handlePublish()}
              variant="contained">
              Publish
            </LoadingButton>  
          )}
          <Button
            variant="contained"
            onClick={() => handleSubmit()}
            type="button"
            disabled={locked || disableSubmit}
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

      <GroupModal
        show={openGroupModal}
        groups={dataGroups}
        submit={() => handleCreate(validatingSubmitForm)}
        hide={hideGroupModal}
        handleInputChange={(event) => handleInputChange(event)}
      />
      
    </Box>
  );
}