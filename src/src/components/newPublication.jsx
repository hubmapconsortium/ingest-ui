import React, {useEffect, useState, useContext} from "react";
import {useParams, useNavigate} from "react-router-dom";
import {ingest_api_allowable_edit_states} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
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

import ClearIcon from '@mui/icons-material/Clear';

import {
  faPenToSquare,
  faPlus,
  faQuestionCircle,
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

import {getPublishStatusColor} from "../utils/badgeClasses";

import {FormHeader,UserGroupSelectMenu,UserGroupSelectMenuPatch} from "./ui/formParts";
import {BulkSelector} from "./ui/bulkSelector";

export const PublicationForm = (props) => {
  let navigate = useNavigate();
  let[entityData, setEntityData] = useState();
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[formErrors, setFormErrors] = useState(); // Null out the unused vs ""

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
  });
  const fields = React.useMemo(() => [
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
      required: false,
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
      helperText: "If the publication has been published yet or not",
      required: false,
      type: "radio",
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
  let[fieldValues, setFieldValues] = useState(fields); 
  let[sources, setSources] = useState([]); 
  // let sources = [];
  // let sources = React.useMemo(() => [], []);
  const{uuid} = useParams();
  // const name = useContext(HuBMAPContext);
  // console.debug('%c◉ name ', 'color:#00ff7b', name);

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
              setSources(entityData.sources || []);
              const fieldsFromEntity = fields.map(field => ({
                ...field,
                value: entityData ? entityData[field.id] || "" : ""
              }));
              console.debug('%c◉ fieldsFromEntity ', 'color:#0026FF', fieldsFromEntity);
              setFieldValues(fieldsFromEntity)
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
  }, [uuid, fields]);



  function handleInputChange(e){
    const{id, value} = e.target;
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: value,
    }));
  }

  function validateDOI(protocolDOI){
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

  function validateForm(){
    let errors = 0;
    let requiredFields = ["label", "protocol_url"];
    for(let field of requiredFields){
      if(!validateRequired(formValues[field])){
        setFormErrors((prevValues) => ({
          ...prevValues,
          field: "required",
        }));
        errors++;
      }
    }
    // Formatting Validation
    errors += validateDOI(formValues['protocol_url']);
    // End Validation
    return errors === 0;
  }


  function handleUpdateIDString(e) {
    setSelectedString(selected_HIDs.join(", "));
  }

  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    if(validateForm()){
      let cleanForm ={
        lab_publication_id: formValues.lab_publication_id,
        label: formValues.label,
        protocol_url: formValues.protocol_url,
        description: formValues.description,
      }
      if(uuid){
        // We're in Edit mode
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
      }else{
        // We're in Create mode
        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");
        if(selectedGroup?.value){
          cleanForm = {...cleanForm, group_uuid: selectedGroup.value};
        }
        entity_api_create_entity("publication",JSON.stringify(cleanForm))
          .then((response) => {
            if(response.status === 200){
              props.onCreated(response.results);
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

  function wrapUp(error){
    setPageErrors(error);
    setIsProcessing(false);
  }

  function buttonEngine(){
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
            loading={isProcessing}
            className="m-2"
            type="submit">
            Generate ID
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Update
          </LoadingButton>
        )}
      </Box>
    );
  }

  // These are specific to getting data in/out of the BulkSelector 
  function sourceManager(event){
    event?.preventDefault();
    console.debug('%c⊙ sourceManager event', 'color:#00ff7b', event);
  };

  function renderBulk(){

    return (<> 
    <Box sx={{
      position: "relative",
      top: 0,
      transitionProperty: "height",
      transitionTimingFunction: "ease-in",
      transitionDuration: "1s"}}> 
      <Box clasName="sourceShade" sx={{
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
                {props.writeable && (
                  <TableCell component="th" align="right">
                    Action
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {sourcesData.map((row, index) => (
                <TableRow
                  key={row.hubmap_id + "" + index} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to
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
                  {props.writeable && (
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

    <Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
      <Box className="w-100" width="100%">
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
            onClick={(e) => props.sourceManager(e)}>
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
                  onChange={(event) => handleUpdateIDString(event)}
                  value={selected_string}
                  sx={{
                    overflow: "hidden",
                    marginTop: '10px',
                    verticalAlign: 'bottom',
                    width: "100%",
                  }}/>
                  <FormHelperText id="component-helper-text" sx={{width:"100%", marginLeft:"0px"}}>
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
      <Grid container className=''>
        <FormHeader entityData={uuid ? entityData : ["new","Publication"]} permissions={permissions} />
      </Grid>
      <form onSubmit={(e) => handleSubmit(e)}>
        <BulkSelector
          // formErrors={formErrors} 
          permissions={permissions} 
          sourceManager={(e)=>sourceManager(e)} 
          sources={sources}
          reportError={(e) => setPageErrors(e)}
        />

        {fieldValues.map(field => (
          <TextField
            InputLabelProps={{ shrink: true }}
            key={field.id}
            type={field.type}
            id={field.id}
            label={field.label}
            helperText={(field.error && field.error.length>0) ? field.helperText+" "+field.error : field.helperText}
            value={field.value ? field.value : ""}
            error={field.error ? true : false}
            required={field.required}
            onChange={(e) => handleInputChange(e)}
            disabled={!permissions.has_write_priv}
            fullWidth
            multiline={field.multiline ? field.multiline : false}
            rows={field.rows ? field.rows : 1}
            className="my-3"/>
        ))}
      
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
              value={fieldValues["group_uuid"] ? fieldValues["group_uuid"].value : JSON.parse(localStorage.getItem("userGroups"))[0].uuid}>
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
