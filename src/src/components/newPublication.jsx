import React, {useEffect, useState} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {ingest_api_allowable_edit_states,ingest_api_dataset_submit,ingest_api_notify_slack,ingest_api_create_publication} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_get_these_entities,
  entity_api_update_entity,
  entity_api_create_entity,
  entity_api_get_globus_url
} from "../service/entity_api";
import {
  validateRequired,
  validateProtocolIODOI,
  validateSingleProtocolIODOI
} from "../utils/validators";
import AlertTitle from '@mui/material/AlertTitle';

import Collapse from '@mui/material/Collapse';
import LoadingButton from "@mui/lab/LoadingButton";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import InputLabel from "@mui/material/InputLabel";
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import {GridLoader} from "react-spinners";
import {toTitleCase} from "../utils/string_helper";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ClearIcon from '@mui/icons-material/Clear';
import SearchComponent from "./search/SearchComponent";

import {
  faPenToSquare,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';

import {getPublishStatusColor} from "../utils/badgeClasses";

import {FormHeader,UserGroupSelectMenuPatch} from "./ui/formParts";

export const PublicationForm = (props) => {
  let navigate = useNavigate();
  let[entityData, setEntityData] = useState();
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);

  let [bulkError, setBulkError] = useState(false);
  let [bulkWarning, setBulkWarning] = useState(false);
  let [showSearchDialog, setShowSearchDialog] = useState(false);
  let [sourceBulkStatus, setSourceBulkStatus] = useState("idle");
  let [showHIDList, setShowHIDList] = useState(false);
  
  let [selected_HIDs, setSelectedHIDs] = useState( []);
  let [selected_string, setSelectedString] = useState( "");
  let [sourcesData, setSourcesData] = useState([]);

  let[permissions,setPermissions] = useState({ 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let [buttonLoading, setButtonLoading] = useState({
    process: false,
    save: false,
    submit: false,
  })
  var[formValues, setFormValues] = useState({
    title: "",
    publication_venue: "", 
    publication_date: "", 
    publication_status: "", 
    publication_url: "", 
    publication_doi: "", 
    omap_doi: "", 
    issue: "", 
    volume: "", 
    pages_or_article_num: "", 
    description: "",
    direct_ancestor_uuids: [],
  });
  let[formErrors, setFormErrors] = useState({...formValues}); // Null out the unused vs ""
  const formFields = React.useMemo(() => [
    { 
      id: "title",
      label: "Title",
      helperText: "The title of the publication",
      required: true,
      type: "text",
    },{ 
      id: "publication_venue",
      label: "Publication Venue",
      helperText: "The date of publication",
      required: true,
      type: "text",
    },{ 
      id: "publication_date",
      label: "Publication Date",
      helperText: "The venue of the publication, journal, conference, preprint server, etc...",
      required: false,
      type: "date",
    },{ 
      id: "publication_status",
      label: "Publication Status ",
      helperText: "Has this Publication been Published?",
      required: false,
      type: "radio",
      values: ["true","false"]
    },{ 
      id: "publication_url",
      label: "Publication URL",
      helperText: "The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]",
      required: false,
      type: "text",
    },{ 
      id: "publication_doi",
      label: "Publication Doi",
      helperText: "The doi of the publication. (##.####/[alpha-numeric-string])",
      required: false,
      type: "text",
    },{ 
      id: "OMAP_doi",
      label: "OMAP Doi",
      helperText: "A DOI pointing to an Organ Mapping Antibody Panel relevant to this publication",
      required: false,
      type: "text",
    },{ 
      id: "issue",
      label: "Issue",
      helperText: "The issue number of the journal that it was published in.",
      required: false,
      type: "text",
    },{ 
      id: "volume",
      label: "Volume",
      helperText: "The volume number of a journal that it was published in.",
      required: false,
      type: "text",
    },{ 
      id: "pages_or_article_num",
      label: "Pages Or Article Number",
      helperText: 'The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.',
      required: false,
      type: "text",
    },{ 
      id: "description",
      label: "Abstract",
      helperText: "Free text description of the publication",
      required: true,
      type: "text",
      multiline: true,
      rows: 4,
    }
  ], []);
  let publication_status_tracker = "False"
  const{uuid} = useParams();

  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          if(response.status === 200){
            const entityType = response.results.entity_type;
            if(entityType !== "Publication"){
              // Are we sure we're loading a Publication?
              // @TODO: Move this sort of handling/detection to the outer app, or into component
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            }else{
              const entityData = response.results;
              setEntityData(entityData);
              console.debug('%c◉ entityData ', 'color:#00ff7b', entityData);
              setFormValues({
                title: entityData.title || "",
                publication_venue: entityData.publication_venue || "",
                publication_date: entityData.publication_date || "",
                publication_status: entityData.publication_status || "",
                publication_url: entityData.publication_url || "",
                publication_doi: entityData.publication_doi || "",
                omap_doi: entityData.omap_doi || "",
                issue: entityData.issue || "",
                volume: entityData.volume || "",
                pages_or_article_num: entityData.pages_or_article_num || "",
                description: entityData.description || "",
                direct_ancestor_uuids: entityData.direct_ancestors.map(obj => obj.uuid) || [],
              });
              // publication_status_tracker = entityData.publication_status ? toTitleCase(entityData.publication_status) : "False";
              setSourcesData(entityData.direct_ancestors || []);

              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
                  if(entityData.data_access_level === "public"){
                    setPermissions({
                      has_write_priv: false,
                    });
                  }
                  setPermissions(response.results);
                })
                .catch((error) => {
                  console.error("ingest_api_allowable_edit_states ERROR", error);
                  setPageErrors(error);
                });
            }
          }else{
            console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        })
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          setPageErrors(error);
        });
    }else{
      setPermissions({
        has_write_priv: true,
      });
    }
    setLoading(false);
  }, [uuid]);

const handleInputChange = (e) => {
    const { id, value } = e.target;
    console.debug('%c◉ e ', 'color:#00ff7b', e);
    console.debug('%c◉ e.target ', 'color:#00ff7b', e.target);
    console.debug('%c◉ handleInputChange ', 'color:#00ff7b',"ID: " +id,"Value: " + value);
    // if(id. === "publication_status"){ 
    // if string containts "publication_status" then set valuesz
    console.debug(id.indexOf('publication_status'));
    if(e.target.type === "radio"){
      console.log(e.target.checked);
      // let boolVal = value.substring(id.lastIndexOf("publication_status") + 1)
      setFormValues((prevValues) => ({
        ...prevValues,
        publication_status: value,
      }));

    }else{
      setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
    }
    
    if(id === "dataset_uuids_string"){
      // This is the string of IDs, so lets update the selected_HIDs
      setSelectedString(value); 
    }
  }

const validateDOI = (protocolDOI) => {
    if (!validateProtocolIODOI(protocolDOI)) {
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': "Please enter a valid protocols.io URL"
        }));
      return 1
    } else if (!validateSingleProtocolIODOI(protocolDOI)) {
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': "Please enter only one valid protocols.io URL"
        }));
      return 1
    }else{
      setFormErrors((prevValues) => ({
        ...prevValues,
          'protocol_url': ""
        }));
      return 0
    }
  }

const validateForm = ()=> {

    let errors = 0;
    let requiredFields = ["title", "publication_venue", "publication_date", "publication_url", "description",];
    for(let field of requiredFields){
      if(!validateRequired(formValues[field])){
        console.debug("%c◉ Required Field Error ", "color:#00ff7b", field, formValues[field]);
        setFormErrors((prevValues) => ({
          ...prevValues,
          [field]: " Required",
        }));

        errors++;
      }
    }
    // Formatting Validation
    errors += validateDOI(formValues['protocol_url']);
    // End Validation
    return errors === 0;
  }

const handleInputUUIDs = (e) => {
    console.debug('%c◉ e ', 'color:#00ff7b', e);  
    e.preventDefault();
    if(!showHIDList){
      setShowHIDList(true);
      setSelectedString(selected_HIDs.join(", "))
      setSourceBulkStatus("Waiting for Input...");
    }else{
      // Lets clear out the previous errors first
      setFormErrors()
      setShowHIDList(false);
      setSourceBulkStatus("loading");
      setFormErrors((prevValues) => ({
        ...prevValues,
        'source_uuid_list': ""
      }));

      // Ok, we want to Save what's Stored for data in the Table
      let datasetTableRows = selected_HIDs
      console.log("datasetTableRows", datasetTableRows);
      let cleanList = selected_string.trim().split(", ")

      entity_api_get_these_entities(cleanList)
        .then((response) => {
          console.debug('%c◉ entity_api_get_these_entities response ', 'color:#00ff7b', response);
          let entities = response.results
          let entityDetails = entities.map(obj => obj.results)
          let entityHIDs = entityDetails.map(obj => obj.hubmap_id)
          let errors = (response.badList && response.badList.length > 0) ? response.badList.join(", ") : "";  
          setBulkError(errors ? errors : "");
          setBulkWarning(response.message ? response.message : "");
          setSelectedHIDs(entityHIDs);
          setSelectedString(entityHIDs.join(", "));
          setSourcesData(entityDetails);
          setShowHIDList(false);
          setSourceBulkStatus("complete");

          setFormValues((prevValues) => ({
            ...prevValues,
            'direct_ancestor_uuids': entityDetails.map(obj => obj.uuid),
          }));
        })
        .catch((error) => {
          console.debug('%c◉ ⚠️ CAUGHT ERROR ', 'background-color:#ff005d', error);
          props.reportError(error);
        });
    }
  }

const handleSubmit = (e) => {
    e.preventDefault()
    console.log(e.target.name)    
    setIsProcessing(true);
    console.log(formValues)
    if(validateForm()){
      let cleanForm ={
        title: formValues.title,
        publication_venue: formValues.publication_venue,
        publication_date: formValues.publication_date,
        publication_status: formValues.publication_status === "true" ? true : false,
        publication_url: formValues.publication_url,
        publication_doi: formValues.publication_doi,
        omap_doi: formValues.omap_doi,
        // issue: formValues.issue,
        ...((formValues.issue) && {issue: formValues.issue} ),
        ...((formValues.volume) && {volume: formValues.volume} ),
        pages_or_article_num: formValues.pages_or_article_num,
        description: formValues.description,
        direct_ancestor_uuids: selected_HIDs,
        contains_human_genetic_sequences: false // Holdover From Dataset Days
      }

      if(uuid){ // We're in Edit Mode
        if(e.target.name === "process"){ // Process
          setButtonLoading((prev) => ({
            ...prev,
            process: true,
          }));
          ingest_api_dataset_submit(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if (response.status < 300) {
                props.onUpdated(response.results);
              } else {
                setPageErrors(response);
                setButtonLoading((prev) => ({
                  ...prev,
                  process: false,
                }));
              }
          })
          .catch((error) => {
            props.reportError(error);
            setPageErrors(error);
          });
        }else if(e.target.name === "submit"){ // Submit
          entity_api_update_entity(uuid, JSON.stringify(cleanForm))
            .then((response) => {
                if (response.status < 300 ) {
                var ingestURL= process.env.REACT_APP_URL+"/publication/"+this.props.editingPublication.uuid
                var slackMessage = {"message": "Publication has been submitted ("+ingestURL+")"}
                ingest_api_notify_slack(slackMessage)
                  .then(() => {
                    if (response.status < 300) {
                        props.onUpdated(response.results);
                    } else {
                      props.reportError(response);
                    }
                  })
              } else { 
                setPageErrors(response);
                setButtonLoading((prev) => ({
                  ...prev,
                  process: false,
                }));
              }
          })
        }else if(e.target.name === "save"){ // Save
          entity_api_update_entity(uuid,JSON.stringify(cleanForm))
            .then((response) => {
              if(response.status === 200){
                props.onUpdated(response.results);
              }else{
                wrapUp(response)
              }
            })
            .catch((error) => {
              wrapUp(error)
            });
        }
      }else{ // We're in Create mode
        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");
        if(selectedGroup?.value){
          cleanForm = {...cleanForm, group_uuid: selectedGroup.value};
        }
        ingest_api_create_publication(JSON.stringify(cleanForm))
          .then((response) => {
            if(response.status === 200){
              entity_api_get_globus_url(response.results.uuid)
                .then((res) => {
                  let globus_path = res.results;
                  props.onCreated({entity: response.results, globus_path: res.results});
                })
            }else{
              wrapUp(response.error ? response.error : response)
            }
          })
          .catch((error) => {
            wrapUp(error)
          });
      }
    }else{
      setIsProcessing(false);
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }

const wrapUp = (error) => {
  setPageErrors(error);
  setIsProcessing(false);
}

const buttonEngine = () => {
  return(
    <Box sx={{textAlign: "right"}}>
      <Button
        variant="contained"
        className="m-2"
        onClick={() => navigate("/")}>
        Cancel
      </Button>
      {/* @TODO use next form to help work this in to its own UI component? */}
      {!uuid && (
        <LoadingButton
          variant="contained"
          name="generate"
          loading={isProcessing}
          className="m-2"
          onClick={(e) => handleSubmit(e)}
          type="submit">
          Generate ID
        </LoadingButton>
      )}
      {/* Process */}
      {uuid && uuid.length > 0 && permissions.has_admin_priv && (
        <LoadingButton 
          loading={buttonLoading['process']} 
          name="process"
          onClick={(e) => handleSubmit(e)}
          variant="contained" 
          className="m-2">
          Process
        </LoadingButton>
      )}
      {/* Save */}
      {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status!=="published" && (
        <LoadingButton 
          loading={buttonLoading['save']} 
          name="save"
          variant="contained" 
          className="m-2">
          Save
        </LoadingButton>
      )}
      {/* Submit */}
      {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status!=="new" && (
        <LoadingButton 
          loading={buttonLoading['submit']} 
          name="submit"
          variant="contained" 
          className="m-2">
          Submit
        </LoadingButton>
      )}

    </Box>
  );
}
  //Click on row from Search
  const handleSelectClick = (event) => {

    if (!selected_HIDs.includes(event.row.hubmap_id)) {
      setSourcesData((rows) => [...rows, event.row]);
      setSelectedHIDs((ids) => [...ids, event.row.hubmap_id]);
      setSelectedString((str) => str + (str ? ", " : "") + event.row.hubmap_id);
      console.debug("handleSelectClick SelctedSOurces", event.row, event.row.uuid);
      setFormValues((prevValues) => ({
        ...prevValues,
        'dataset_uuids': selected_HIDs,
      }))
      setShowSearchDialog(false); 
    } else {
      // maybe alert them theyre selecting one they already picked?
    }
  };
  const renderForum = () => {

    return (
      <>
        {formFields.map((field) => {
          if (["text", "date"].includes(field.type)) {
            return (
              <TextField
                InputLabelProps={{ shrink: true }}
                key={field.id}
                required={field.required}
                type={field.type}
                id={field.id}
                label={field.label}
                helperText={
                  formErrors[field.id] && formErrors[field.id].length > 0
                    ? field.helperText + " " + formErrors[field.id]
                    : field.helperText
                }
                sx={{
                  width: field.type === "date" ? "250px" : "100%",
                }}
                value={formValues[field.id] ? formValues[field.id] : ""}
                error={formErrors[field.id] && formErrors[field.id].length > 0 ? true : false}
                onChange={(e) => handleInputChange(e)}
                disabled={!permissions.has_write_priv}
                fullWidth = {field.type === "date" ? false : true }
                size={field.type === "date" ? "small" : "medium" }
                multiline={field.multiline || false}
                rows={field.rows || 1}
                className={"my-3 "+(formErrors[field.id] && formErrors[field.id].length > 0 ? "error" : "")}/>
            );
          }
          if (field.type === "radio") {
            return (
              <FormControl
                id={field.id}
                key={field.id}
                component="fieldset"
                variant="standard"
                size="small"  
                required={field.required}
                error={formErrors[field.id] && formErrors[field.id].length > 0 ? true : false}
                className="mb-3"
                // helperText={formErrors[field.id].length > 0 ? formErrors[field.id] : field.helperText}
                fullWidth>
                <FormLabel component="legend">{field.label}</FormLabel> 
                <FormHelperText>
                  {formErrors[field.id] ? field.helperText + " " + formErrors[field.id] : field.helperText}
                </FormHelperText>
                <RadioGroup row aria-labelledby="publication_status" name="publication_status">
                  {field.values && field.values.map((val) => (
                    <FormControlLabel 
                      value={val}
                      id={field.id + "_" + val} 
                      onChange={(e) => handleInputChange(e)}
                      // error={this.state.validationStatus.publication_status} 
                      disabled={!permissions.has_write_priv} 
                      checked={formValues[field.id] === val ? true : false}
                      control={<Radio />} 
                      inputProps={{ 'aria-label': toTitleCase(val), id: field.id + "_" + val }}
                      label={val==="true" ? "Yes" : "No"} />
                  ))}
                </RadioGroup>
              </FormControl>
            );
          }
          // Fallback: Render a div for unknown field types
          return (
            <div key={field.id} className="my-3">
              {field.label}: {field.value}
            </div>
          );
        })}
      </>
    );
  } 

  const renderBulk = ()=> {

    return (<> 
      <Dialog
        fullWidth={true}
        maxWidth="lg"
        onClose={() => showSearchDialog(false)}
        aria-labelledby="source-lookup-dialog"
        open={showSearchDialog === true ? true : false}>
        <DialogContent>
        <SearchComponent
          select={(e) => handleSelectClick(e)}
          custom_title="Search for a Source ID for your Publication"
          modecheck="Source"
          restrictions={{
            entityType: "dataset"
          }}
        />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowSearchDialog(false)}
            variant="contained"
            color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      <Box sx={{
        position: "relative",
        top: 0,
        transitionProperty: "height",
        transitionTimingFunction: "ease-in",
        transitionDuration: "1s"}}> 
        <Box className="sourceShade" sx={{
          opacity: sourceBulkStatus==="loading"?1:0, 
          background: "#444a65", 
          width: "100%", 
          height: "45px", 
          position: "absolute", 
          color: "white", 
          zIndex: 999, 
          padding: "10px", 
          boxSizing: "border-box" ,
          borderRadius: "0.375rem",
          transitionProperty: "opacity",
          transitionTimingFunction: "ease-in",
          transitionDuration: "0.5s"}}>
          <GridLoader size="2px" color="white" width="30px"/> Loading ... 
        </Box> 
        <Box>
          <TableContainer
            // sx={formErrors.source_uuid_list ? {border: "1px solid red",} : {}}
            // component={Paper}
            style={{ maxHeight: 450 }}>
            <Table
              aria-label="Associated Publications"
              size="small"
              className="table table-striped table-hover mb-0">
              <TableHead className="thead-dark font-size-sm">
                <TableRow className="   ">
                  <TableCell> Source ID</TableCell>
                  <TableCell component="th">Subtype</TableCell>
                  <TableCell component="th">Group Name</TableCell>
                  <TableCell component="th">Status</TableCell>
                  {permissions.has_write_priv && (
                    <TableCell component="th" align="right">
                      Action
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {sourcesData.map((row, index) => (
                  <TableRow
                    key={row.hubmap_id + "" + index} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data
                    // onClick={() => handleSourceCellSelection(row)}
                    className="row-selection">
                    <TableCell className="clicky-cell" scope="row">
                      {row.hubmap_id}
                    </TableCell>
                    <TableCell className="clicky-cell" scope="row">
                      {row.dataset_type ? row.dataset_type : row.display_subtype}
                    </TableCell>
                    <TableCell className="clicky-cell" scope="row">
                      {row.group_name}
                    </TableCell>
                    <TableCell className="clicky-cell" scope="row">
                      {row.status && (
                        <span className={"w-100 badge " +getPublishStatusColor(row.status, row.uuid)}>
                          {" "}{row.status}
                        </span>
                      )}
                    </TableCell>
                    {permissions.has_write_priv && (
                      <TableCell
                        className="clicky-cell"
                        align="right"
                        name="source_delete"
                        scope="row">
                          <React.Fragment>
                            <FontAwesomeIcon
                              className="inline-icon interaction-icon "
                              icon={faTrash}
                              color="red"
                              onClick={(e) => props.sourceManager(e, {row, index})}
                            />
                          </React.Fragment>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer> 
        </Box> 
      </Box>

      <Box className="mt-2" display="inline-flex" flexDirection={"column"} >
        <Box className="w-100" width="100%" flexDirection="row" display="inline-flex" >
          <Collapse
            in={(bulkError && bulkError.length > 0)}
            orientation="vertical">
            <Alert 
              className="m-0"
              severity="error" 
              onClose={() => {setBulkError("")}}>
              <AlertTitle>Source Selection Error:</AlertTitle>
              {bulkError? bulkError: ""} 
            </Alert>
          </Collapse>
          <Collapse
            in={(bulkWarning && bulkWarning.length>0)}
            orientation="vertical">
            <Alert severity="warning" className="m-0" onClose={() => {setBulkWarning("")}}>
              <AlertTitle>Source Selection Warning:</AlertTitle>
              {(bulkWarning && bulkWarning.length > 0)? bulkWarning.split('\n').map(warn => <p>{warn}</p>): ""} 
            </Alert>
          </Collapse>
        </Box>
        <Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
          <Box p={1} className="m-0 text-right" id="bulkButtons" display="inline-flex" flexDirection="row" >
            <Button
              sx={{maxHeight: "35px",verticalAlign: 'bottom',}}
              variant="contained"
              type="button"
              size="small"
              className="btn btn-neutral"
              onClick={() => setShowSearchDialog(true)}>
              Add
              <FontAwesomeIcon
                className="fa button-icon m-2"
                icon={faPlus}
              />
            </Button>
            <Button
              sx={{maxHeight: "35px",verticalAlign: 'bottom'}}
              variant="text"
              type='link'
              size="small"
              className='mx-2'
              onClick={(e) => handleInputUUIDs(e)}>
              {!showHIDList && (<>Bulk</>)}
              {showHIDList && (<>UPDATE</>)}
              <FontAwesomeIcon className='fa button-icon m-2' icon={faPenToSquare}/>
            </Button>
          </Box>
          <Box
            display="flex" 
            flexDirection="row"
            className="m-0 col-9 row"
            sx={{
              overflowX: "visible",
              overflowY: "visible",
              padding: "0px",  
              maxHeight: "45px",}}>
            <Collapse 
              in={showHIDList} 
              orientation="horizontal" 
              className="row"
              width="100%">
              <Box
                display="inline-flex"
                flexDirection="row"
                sx={{ 
                  overflow: "hidden",
                  width: "650px"}}>
                <FormControl >
                  {/* <StyledTextField */}
                  <TextField
                    name="dataset_uuids_string"
                    display="flex"
                    id="dataset_uuids_string"
                    // error={props?.fields?dataset_uuids_string?.error && props?.dataset_uuids_string?.error.length > 0 ? true : false}
                    multiline
                    inputProps={{ 'aria-label': 'description' }}
                    placeholder="HBM123.ABC.456, HBM789.DEF.789, ..."
                    variant="standard"
                    size="small"
                    fullWidth={true}
                    onChange={(event) => handleInputChange(event)}
                    value={selected_string}
                    sx={{
                      overflow: "hidden",
                      marginTop: '10px',
                      verticalAlign: 'bottom',
                      width: "100%",
                    }}/>
                    <FormHelperText id="component-helper-text" sx={{width: "100%", marginLeft: "0px"}}>
                      {"List of Dataset HuBMAP IDs or UUIDs, Comma Seperated " }
                    </FormHelperText>
                </FormControl>
                <Button
                  variant="text"
                  type='link'
                  size="small"
                  onClick={() => setShowHIDList(false) }>
                  <ClearIcon size="small"/>
                </Button>
              </Box>
            </Collapse>
          </Box>
        </Box>
      </Box> 
    </>)
  }

  // MAIN RENDER

  if(isLoading ||((!entityData || !formValues) && uuid) ){
    return(<LinearProgress />);
  }else{
    return(<>
      <Grid container className='mb-2'>
        <FormHeader entityData={uuid ? entityData : ["new","Publication"]} permissions={permissions} />
      </Grid>
      <form onSubmit={(e) => handleSubmit(e)}>
        {renderBulk()}
        {renderForum()} 
        {/* Group */}
        {/* Data is viewable in form header & cannot be changed, so only show on Creation */}
        {!uuid && (
          <Box className="my-3">           
            <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
              Group
            </InputLabel>
            <NativeSelect
              id="group_uuid"
              label="Group"
              onChange={(e) => handleInputChange(e)}
              fullWidth
              className="p-2"
              sx={{
                BorderTopLeftRadius: "4px",
                BorderTopRightRadius: "4px",
              }}
              disabled={uuid?true:false}
              value={formValues["group_uuid"] ? formValues["group_uuid"].value : JSON.parse(localStorage.getItem("userGroups"))[0].uuid}>
              <UserGroupSelectMenuPatch />
            </NativeSelect>
          </Box>
        )}
        {buttonEngine()}
      </form>
    
      {pageErrors && (
        <Alert variant="filled" severity="error">
          <strong>Error:</strong> {JSON.stringify(pageErrors)}
        </Alert>
      )}
    </>);
  }
}
