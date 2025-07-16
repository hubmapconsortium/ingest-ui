import LoadingButton from "@mui/lab/LoadingButton";
import {Typography} from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Grid from '@mui/material/Grid';
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import TextField from "@mui/material/TextField";
import React,{useEffect,useState} from "react";

import {useNavigate,useParams} from "react-router-dom";
import {
	entity_api_get_entity,
	entity_api_get_globus_url,
	entity_api_update_entity
} from "../service/entity_api";
import {
  ingest_api_allowable_edit_states,
  ingest_api_create_publication,
  ingest_api_dataset_submit,
  ingest_api_notify_slack} from "../service/ingest_api";
import {search_api_es_query_ids} from "../service/search_api";
import {humanize} from "../utils/string_helper";
import {
	validateProtocolIODOI,
	validateRequired,
	validateSingleProtocolIODOI
} from "../utils/validators";
import {BulkSelector} from "./ui/bulkSelector";
import {FormHeader,UserGroupSelectMenuPatch} from "./ui/formParts";

export const PublicationForm = (props) => {
  let navigate = useNavigate();
  let[entityData, setEntityData] = useState();
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[valErrorMessages, setValErrorMessages] = useState([]);
  let[pageErrors, setPageErrors] = useState(null);

  let [bulkError, setBulkError] = useState(false);
  let [bulkWarning, setBulkWarning] = useState(false);
  let [showBulkError, setShowBulkError] = useState(false);
  let [showBulkWarning, setShowBulkWarning] = useState(false);

  let [showSearchDialog, setShowSearchDialog] = useState(false);
  let [sourceBulkStatus, setSourceBulkStatus] = useState("idle");
  let [showHIDList, setShowHIDList] = useState(false);
  
  let [selected_HIDs, setSelectedHIDs] = useState([]);
  let [selected_UUIDs, setSelectedUUIDs] = useState([]);
  let [selected_string, setSelectedString] = useState("");
  let [sourcesData, setSourcesData] = useState([]);
  let [sourceTableError, setSourceTableError] = useState(false);

  let[permissions,setPermissions] = useState( { 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  } );
  let [buttonLoading, setButtonLoading] = useState( {
    process: false,
    save: false,
    submit: false,
  } )
  var[formValues, setFormValues] = useState( {
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
  } );
  let[formErrors, setFormErrors] = useState( {...formValues} ); // Null out the unused vs ""
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
      helperText: "The venue of the publication, journal, conference, preprint server, etc...",
      required: true,
      type: "text",
    },{ 
      id: "publication_date",
      label: "Publication Date",
      helperText: "The date of publication",
      required: false,
      type: "date",
    },{ 
      id: "publication_status",
      label: "Publication Status ",
      helperText: "Has this Publication been Published?",
      required: true,
      type: "radio",
      values: ["true","false"]
    },{ 
      id: "publication_url",
      label: "Publication URL",
      helperText: "The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]",
      required: true,
      type: "text",
    },{ 
      id: "publication_doi",
      label: "Publication DOI",
      helperText: "The DOI of the publication. (##.####/[alpha-numeric-string])",
      required: false,
      type: "text",
    },{ 
      id: "OMAP_doi",
      label: "OMAP DOI",
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

  const{uuid} = useParams();

	const memoizedFormHeader = React.useMemo(
		() => <FormHeader entityData={uuid ? entityData : ["new", "Publication"]} permissions={permissions} />,
		[uuid, entityData, permissions]
	);
	const memoizedUserGroupSelectMenuPatch = React.useMemo(
		() => <UserGroupSelectMenuPatch />,
		[]
	);
	
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
              setFormValues( {
                title: entityData.title || "",
                publication_venue: entityData.publication_venue || "",
                publication_date: entityData.publication_date || "",
                publication_status: entityData.publication_status ? entityData.publication_status.toString() : "false", 
                publication_url: entityData.publication_url || "",
                publication_doi: entityData.publication_doi || "",
                omap_doi: entityData.omap_doi || "",
                issue: entityData.issue || "",
                volume: entityData.volume || "",
                pages_or_article_num: entityData.pages_or_article_num || "",
                description: entityData.description || "",
                direct_ancestor_uuids: entityData.direct_ancestors.map(obj => obj.uuid) || [],
              } );
              // publication_status_tracker = entityData.publication_status ? toTitleCase(entityData.publication_status) : "False";
              setSourcesData(entityData.direct_ancestors || []);

              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
                  if(entityData.data_access_level === "public"){
                    setPermissions( {
                      has_write_priv: false,
                    } );
                  }
                  setPermissions(response.results);
                } )
                .catch((error) => {
                  console.error("ingest_api_allowable_edit_states ERROR", error);
                  setPageErrors(error);
                } );
            }
          }else{
            console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        } )
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          setPageErrors(error);
        } );
    }else{
      setPermissions( {
        has_write_priv: true,
      } );
    }
    setLoading(false);
  }, [uuid]);

  const handleInputChange = (e) => {
		console.log('%c◉ handleInputChange ', 'color:#00ff7b', e);
    const {id, value} = e.target;

		if(e.target.type === "radio"){
      console.log(e.target.checked);
      setFormValues((prevValues) => ( {
        ...prevValues,
        publication_status: value,
      } ));

    }else{
      setFormValues(prev => {
				if (prev[id] === value) return prev;
				return {...prev, [id]: value};
			} );
    }
    if(id === "dataset_uuids_string"){
      console.debug('%c◉  dataset_uuids_string', 'color:#00ff7b', value);
      setSelectedString(value); 
    }

  }

	const validateDOI = (protocolDOI) => {
		if (!validateProtocolIODOI(protocolDOI)){
			setFormErrors((prevValues) => ( {
				...prevValues,
					'protocol_url': "Please enter a valid protocols.io URL"
				} ));
			return 1
		} else if (!validateSingleProtocolIODOI(protocolDOI)){
			setFormErrors((prevValues) => ( {
				...prevValues,
					'protocol_url': "Please enter only one valid protocols.io URL"
				} ));
			return 1
		}else{
			setFormErrors((prevValues) => ( {
				...prevValues,
					'protocol_url': ""
				} ));
			return 0
		}
	}

  const validateForm = ()=> {
    setValErrorMessages(null);
    setSourceTableError(false);
    let errors = 0;
    let e_messages=[]

    let requiredFields = ["title", "publication_venue", "publication_date", "publication_status", "publication_url", "description"];
    
    for(let field of requiredFields){
      console.debug(`%c◉ formValues[${field}] `, 'color:#00ff7b', formValues[field]);
      if(!validateRequired(formValues[field])){
        console.debug("%c◉ Required Field Error ", "color:#00ff7b", field, formValues[field]);
        let fieldName = formFields.find(f => f.id === field)?.label || humanize(field);
        if(field !== "direct_ancestor_uuids"){
          e_messages.push(fieldName+" is a required field");
        }
        setSourceTableError(true)
        setFormErrors((prevValues) => ( {
          ...prevValues,
          [field]: " Required",
        } ));
        errors++; 
        console.debug("%c◉ Required Field Error ", "color:#00ff7b", field, formValues[field]);
      }else{
        setFormErrors((prevValues) => ( {
          ...prevValues,
          [field]: "",
        } ));
      }
    }

    function validatePositiveIntegerField(fieldName, label){
      if (formValues[fieldName] && formValues[fieldName].length > 0){
        if (isNaN(formValues[fieldName]) || parseInt(formValues[fieldName]) < 0){
          e_messages.push(`${label} must be a positive integer`);
          setFormErrors((prevValues) => ( {
            ...prevValues,
            [fieldName]: " Must be a positive integer",
          } ));
          errors++;
        } else {
          setFormErrors((prevValues) => ( {
            ...prevValues,
            [fieldName]: "",
          } ));
        }
      }
    }
    validatePositiveIntegerField('issue', 'Issue');
    validatePositiveIntegerField('volume', 'Volume');

    console.log(formValues['direct_ancestor_uuids'],sourcesData)

    if(!sourcesData || sourcesData.length <= 0){
      e_messages.push("Please select at least one Source");
      errors++; 
      setFormErrors((prevValues) => ( {
        ...prevValues,
        ["direct_ancestor_uuids"]: "Required",
      } ));
      setSourceTableError(true);
    }else if(sourcesData.length > 0 && formValues['direct_ancestor_uuids'].length <= 0){
      console.log("source table has data, but no uuids, so we'll sync back to formVals");
      setFormValues((prevValues) => ( {
        ...prevValues,
        'direct_ancestor_uuids': sourcesData.map(obj => obj.uuid),
      } ));
    }else{
      setSourceTableError(false);
    }
    // Formatting Validation
    errors += validateDOI(formValues['protocol_url']); 
    console.debug('%c◉ ERROR COUNTER: ', 'color:#00ff7b',errors);
    setValErrorMessages(errors>0?e_messages:null);
    return errors === 0;
  }

  const preValidateSources = (results,cleanList) => {
    console.debug('%c◉ preValidateSources ', 'color:#00ff7b', cleanList, results);

    // Clean up the old
    setBulkError([]);
    setBulkWarning([]);
    setShowBulkError(false)
    setShowBulkWarning(false)

    // Prep the new
    let errorArray = [];
    let warnArray = [];
    let goodArray = [];
    let typeArray = [];

    // The Search wont return dupes, so we need to check if the original list has 
    // both the uuid or hubmap_id of the same entity in the results
    const entitiesWithBoth = results.filter(
      entity =>
        cleanList.includes(entity.uuid) && cleanList.includes(entity.hubmap_id)
    );
    console.debug('%c◉ entitiesWithBoth: ', 'color:#00ff7b', entitiesWithBoth? entitiesWithBoth : "None");
    if (entitiesWithBoth.length > 0){
      let entList = entitiesWithBoth.map(entity => `${entity.hubmap_id} (${entity.uuid})`)
      warnArray.push([`The following ${entitiesWithBoth.length} ID${entitiesWithBoth.length>1?'s':''} ${entitiesWithBoth.length>1?'have':'has'} both UUID and Hubmap ID provided:`,entList])
    }

    // Checks whatever values were missed from those provided
    const missingIds = cleanList
      .filter(id =>!results
        .some(entity => entity.uuid === id || entity.hubmap_id === id)
    );
    console.debug('%c◉ missingIds: ', 'color:#00ff7b', missingIds? missingIds : "None");
    if (missingIds.length > 0){
      errorArray.push([`The following ${missingIds.length} ID${missingIds.length>1?'s':''} ${entitiesWithBoth.length>1?'were':'was'} not Included from the original set, and there is no Rejection message available. Please review, and make sure the value is properly formatted:`,missingIds]);
    }
    // Check against type/filter requirements
    for(let entity of results){
      if (entity.entity_type !== "Dataset"){
        typeArray.push(`${entity.hubmap_id} (Invalid Type: ${entity.entity_type})`);
      }else{
        goodArray.push(entity);
      } 
    }
    console.debug('%c◉ typeArray: ', 'color:#00ff7b', typeArray? typeArray : "None");
    if(typeArray.length > 0){
      errorArray.push([`The following ${typeArray.length} ID${typeArray.length>1?'s':''} ${typeArray.length>1?'are':'is'} of the wrong Type:`, typeArray]);
    }

    // prepare and trigger launch of the warning/error feedback
    console.debug('%c◉ errorArray: ', 'color:#00ff7b', errorArray? errorArray : "None");
    if (errorArray.length > 0){
      setBulkError(errorArray);
      setShowBulkError(true)
      console.warn("Bulk Error: ", errorArray);
    }
    if(warnArray.length > 0){
      setBulkWarning(warnArray);
      setShowBulkWarning(true)
      console.warn("Bulk Warning: ", warnArray);
    }

    // Return the ones that are good
    console.debug('%c◉ errorArray: ', 'color:#00ff7b', goodArray? goodArray : "None");
    return goodArray;
  }

  const handleInputUUIDs = (e) => {
    console.debug('%c◉ e ', 'color:#00ff7b', e);  
    e.preventDefault();
    setSourceTableError(false);
    if(!showHIDList){
      setShowHIDList(true);
      setSelectedString(selected_HIDs.join(", "))
      setSourceBulkStatus("Waiting for Input...");
    }else{
      // Lets clear out the previous errors first
      setFormErrors()
      setShowHIDList(false);
      setSourceBulkStatus("loading");
      setFormErrors((prevValues) => ( {
        ...prevValues,
        'direct_ancestor_uuids': ""
      } ));
      
      // Ok, we want to Save what's Stored for data in the Table
      let cleanList = Array.from(new Set(
        selected_string
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)
      ));

      // If We just Cleared out the whole thing, dump the whole table
      //  & errors/warnings
      if(selected_string.length<=0){
        setSourcesData([])
        setSelectedHIDs([]);
        setSelectedString("");
        setBulkError([]);
        setBulkWarning([]);
        setSourceBulkStatus("complete");
        setFormValues((prevValues) => ( { // Form Field Data
          ...prevValues,
          'direct_ancestor_uuids': null,
        } ));

      }else{
        let cols=["hubmap_id","uuid","entity_type","subtype","group_name","status","dataset_type","display_subtype"];
        search_api_es_query_ids(cleanList,['datasets'],cols) 
          .then((response) => {
            console.debug('%c◉ response ', 'color:#00ff7b', response);
            if(response.status >= 300){
              console.error("search_api_es_query_ids ERROR", response);
              setPageErrors(response);
              setSourceBulkStatus("error");
              return;
            }else if(response.results.length <= 0){
              setBulkError("No Datasets Found for the provided IDs");
            }else{
              let validatedSources = preValidateSources(response.results,cleanList);
              setSourcesData(validatedSources)
              let entityHIDs = validatedSources.map(obj => obj.hubmap_id)
              setSelectedHIDs(entityHIDs);
              setSelectedString(entityHIDs.join(", "));
              setShowHIDList(false);
              setSourceBulkStatus("complete");
              setFormValues((prevValues) => ( { // Form Field Data
                ...prevValues,
                'direct_ancestor_uuids': (validatedSources.map(obj => obj.uuid)),
              } ));
            }
          } )
          .catch((error) => {
            console.debug('%c◉ error ', 'color:#00ff7b', error);
          } )
      
        }

    }
  }

  const sourceRemover = (row_uuid,hubmap_id) => {
    console.debug('%c◉ Deleting: ', 'color:#00ff7b', hubmap_id);
    let newUUIDs = formValues['direct_ancestor_uuids'].filter((uuid) => uuid !== row_uuid);
    setSelectedHIDs((prev) => prev.filter((id) => id !== hubmap_id));
    setSourcesData((prev) => prev.filter((item) => item.hubmap_id !== hubmap_id));
    setFormValues((prev) => ( {
      ...prev,
      'direct_ancestor_uuids': newUUIDs
    } ));
    setSelectedString((prev) => {
      const filtered = prev
        .split(",")
        .map((s) => s.trim())
        .filter((id) => id && id !== hubmap_id);
      return filtered.join(", ");
    } );

  };

  const handleSubmit = (e) => {
    e.preventDefault()

    if(validateForm()){
      setIsProcessing(true);
      let selectedUUIDs = sourcesData.map((obj) => obj.uuid);
      console.debug('%c◉ selected_UUIDs ', 'color:#00ff7b', selectedUUIDs);
      let cleanForm ={
        title: formValues.title,
        publication_venue: formValues.publication_venue,
        publication_date: formValues.publication_date,
        publication_status: formValues.publication_status === "true" ? true : false,
        publication_url: formValues.publication_url,
        publication_doi: formValues.publication_doi,
        omap_doi: formValues.omap_doi,
        ...((formValues.issue) && {issue: parseInt(formValues.issue)} ),
        ...((formValues.volume) && {volume: parseInt(formValues.volume)} ),
        pages_or_article_num: formValues.pages_or_article_num,
        description: formValues.description,
        direct_ancestor_uuids: selectedUUIDs,
        contains_human_genetic_sequences: false // Holdover From Dataset Days
      }

      if(uuid){ // We're in Edit Mode
        let target = e.target.name;
        console.debug('%c◉ VALPASS ', 'color:#00ff7b',);
        setButtonLoading((prev) => ( {
          ...prev,
          [target]: true,
        } ));
        console.log("buttonLoading",buttonLoading,target, buttonLoading[target]);
        if(e.target.name === "process"){ // Process
          ingest_api_dataset_submit(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if (response.status < 300){
                props.onUpdated(response.results);
              } else {
                setPageErrors(response);
                setButtonLoading((prev) => ( {
                  ...prev,
                  process: false,
                } ));
              }
          } )
          .catch((error) => {
            props.reportError(error);
            setPageErrors(error);
          } );
        }else if(e.target.name === "submit"){ // Submit
          entity_api_update_entity(uuid, JSON.stringify(cleanForm))
            .then((response) => {
                if (response.status < 300){
                var ingestURL= process.env.REACT_APP_URL+"/publication/"+uuid
                var slackMessage = {"message": "Publication has been submitted ("+ingestURL+")"}
                ingest_api_notify_slack(slackMessage)
                  .then(() => {
                    if (response.status < 300){
                        props.onUpdated(response.results);
                    } else {
                      wrapUp(response)
                      props.reportError(response);
                    }
                  } )
              } else { 
                wrapUp(response)
                setPageErrors(response);
              }
          } )
        }else if(e.target.name === "save"){ // Save
          entity_api_update_entity(uuid,JSON.stringify(cleanForm))
            .then((response) => {
              if(response.status === 200){
                props.onUpdated(response.results);
              }else{
                wrapUp(response)
              }
            } )
            .catch((error) => {
              wrapUp(error)
            } );
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
                  let fullResult = {...response.results, globus_path: res.results};
                  props.onCreated(fullResult);
                } )
            }else{
              wrapUp(response.error ? response.error : response)
            }
          } )
          .catch((error) => {
            wrapUp(error)
            setPageErrors(error);
          } );
      }
    }else{
      console.debug("%c◉ Invalid ", "color:#00ff7b");
      setButtonLoading(() => ( {
        process: false,
        save: false,
        submit: false,
      } ));
    }
  }

  const wrapUp = (error) => {
    setPageErrors(error.error ? error.error : error);
    setButtonLoading(() => ( {
      process: false,
      save: false,
      submit: false,
    } ));
  }

  const buttonEngine = () => {
    return(
      <Box sx={{textAlign: "right"}}>
        <LoadingButton 
          variant="contained"
          className="m-2"
          onClick={() => navigate("/")}>
          Cancel
        </LoadingButton>
        {/* @TODO use next form to help work this in to its own UI component? */}
        {!uuid && (
          <LoadingButton
            variant="contained"
            name="generate"
            loading={isProcessing}
            className="m-2"
            onClick={(e) => handleSubmit(e)}
            type="submit">
              Save
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
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status!=="new" && (
          <LoadingButton  
            loading={buttonLoading['submit']} 
            onClick={(e) => handleSubmit(e)}
            name="submit"
            variant="contained" 
            className="m-2">
            Submit
          </LoadingButton>
        )}
        {/* Save */}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status!=="published" && (
          <LoadingButton 
            loading={buttonLoading['save']===true?true:false} 
            name="save"
            onClick={(e) => handleSubmit(e)}
            variant="contained" 
            className="m-2">
            Save
          </LoadingButton>
        )}
        {/* Submit */}
      </Box>
    );
  }
  //Click on row from Search
  const handleSelectClick = (event) => {
    setSourceTableError(false)
    console.debug('%c◉ !selected_HIDs.includes(event.row.hubmap_id ', 'color:#00ff7b', !selected_HIDs.includes(event.row.hubmap_id));
    if (!selected_HIDs.includes(event.row.hubmap_id)){
      setSelectedUUIDs((rows) => [...rows, event.row.uuid]);
      setSelectedHIDs((ids) => [...ids, event.row.hubmap_id]);
      setSelectedString((str) => str + (str ? ", " : "") + event.row.hubmap_id);
      console.debug("handleSelectClick SelctedSOurces", event.row, event.row.uuid);
      console.debug("selected_UUIDs", selected_UUIDs);
      setSourcesData((rows) => [...rows, event.row]);
      setFormValues((prevValues) => ( {
        ...prevValues,
        'direct_ancestor_uuids': (rows) => [...rows, event.row.uuid],
      } ))
      
      setFormErrors((prevValues) => ( { //Clear Errors
        ...prevValues,
        'direct_ancestor_uuids': "",
      } ));
      setShowSearchDialog(false); 
    } else {
      // maybe alert them theyre selecting one they already picked?
    }
  };

  const renderForum = () => {
    return (
      <>
        {formFields.map((field,index) => {
          if (["text", "date"].includes(field.type)){
            return (
              <TextField
                InputLabelProps={{shrink: true}}
                key={field.id+"_"+index}
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
          if (field.type === "radio"){
            return (
              <FormControl
                id={field.id}
                key={field.id+"_"+index}
                component="fieldset"
                variant="standard"
                size="small"  
                required={field.required}
                error={formErrors[field.id] && formErrors[field.id].length > 0 ? true : false}
                className="mb-3"
                fullWidth>
                <FormLabel component="legend">{field.label}</FormLabel> 
                <FormHelperText>
                  {formErrors[field.id] ? field.helperText + " " + formErrors[field.id] : field.helperText}
                </FormHelperText>
                <RadioGroup row aria-labelledby="publication_status" name="publication_status">
                  {field.values && field.values.map((val) => (
                    <FormControlLabel 
                      key={field.id+"_"+val}
                      value={val}
                      id={field.id + "_" + val} 
                      onChange={(e) => handleInputChange(e)}
                      // error={this.state.validationStatus.publication_status} 
                      disabled={!permissions.has_write_priv} 
                      checked={formValues[field.id] === val ? true : false}
                      control={<Radio />} 
                      // inputProps={{ 'aria-label': toTitleCase(val), id: field.id + "_" + val }}
                      label={val==="true" ? "Yes" : "No"} />
                  ))}
                </RadioGroup>
              </FormControl>
            );
          }
          return (
            <div key={field.id} className="my-3">
              {field.label}: {field.value}
            </div>
          );
        } )}
      </>
    );
  }
	const memoizedForum = React.useMemo(
		() => renderForum(),
		[formFields, formValues, formErrors, permissions,]
	);

  // MAIN RENDER
  if(isLoading ||((!entityData || !formValues) && uuid)){
    return(<LinearProgress />);
  }else{
    return(<div className={formErrors}>
      <Grid container className='mb-2'>
				{memoizedFormHeader}
      </Grid>
      <form onSubmit={(e) => handleSubmit(e)}>
        <BulkSelector
          dialogTitle="Associated Dataset IDs"
          dialogSubtitle="Datasets that are associated with this Publication "
          setShowSearchDialog={setShowSearchDialog}
          showSearchDialog={showSearchDialog}
          bulkError={bulkError} 
          setBulkError={setBulkError } 
          bulkWarning={bulkWarning } 
          setBulkWarning={setBulkWarning } 
          sourceBulkStatus={sourceBulkStatus}
          setSourceBulkStatus={setSourceBulkStatus}
          showHIDList={showHIDList}
          setShowHIDList={setShowHIDList}
          selected_HIDs={selected_HIDs}
          setSelectedHIDs={setSelectedHIDs}
          selected_string={selected_string}
          setSelectedString={setSelectedString}
          sourcesData={sourcesData}
          setSourcesData={setSourcesData}
          permissions={permissions}
          handleInputUUIDs={(e) => handleInputUUIDs(e)}
          handleSelectClick={handleSelectClick}
          handleInputChange={handleInputChange}
          sourceRemover={sourceRemover}
          sourceTableError={sourceTableError}
          showBulkError={showBulkError}
          setShowBulkError={setShowBulkError}
          showBulkWarning={showBulkWarning}
          setShowBulkWarning={setShowBulkWarning} />
        {memoizedForum} 
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
								{memoizedUserGroupSelectMenuPatch}
            </NativeSelect>
          </Box>
        )}

       {valErrorMessages && valErrorMessages.length > 0 && (
          <Alert severity="error">
            <AlertTitle>Please Review the following problems:</AlertTitle>
            {valErrorMessages.map(error => (
              <Typography key={error}>
                {error}
              </Typography>
            ))}
          </Alert>
      )}

        {buttonEngine()}
      </form>
    
      {pageErrors && (
        <Alert variant="filled" severity="error">
          <strong>Error:</strong> {JSON.stringify(pageErrors)}
        </Alert>
      )}
    </div>);
  }
}
