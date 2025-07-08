import LoadingButton from "@mui/lab/LoadingButton";
import {Typography} from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
	entity_api_get_these_entities,
	entity_api_update_entity
} from "../service/entity_api";
import {ingest_api_allowable_edit_states,ingest_api_create_publication,ingest_api_dataset_submit,ingest_api_notify_slack} from "../service/ingest_api";
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
  let [showSearchDialog, setShowSearchDialog] = useState(false);
  let [sourceBulkStatus, setSourceBulkStatus] = useState("idle");
  let [showHIDList, setShowHIDList] = useState(false);
  
  let [selected_HIDs, setSelectedHIDs] = useState([]);
  let [selected_UUIDs, setSelectedUUIDs] = useState([]);
  let [selected_string, setSelectedString] = useState("");
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
              setFormValues({
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
		console.log('%c◉ handleInputChange ', 'color:#00ff7b', e);
    const { id, value } = e.target;

		if(e.target.type === "radio"){
      console.log(e.target.checked);
      setFormValues((prevValues) => ({
        ...prevValues,
        publication_status: value,
      }));

    }else{
      setFormValues(prev => {
				if (prev[id] === value) return prev;
				return { ...prev, [id]: value };
			});
    }
    if(id === "dataset_uuids_string"){
      console.debug('%c◉  dataset_uuids_string', 'color:#00ff7b', value);
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
  setValErrorMessages(null);
  let errors = 0;
  let e_messages=[]

  let requiredFields = ["title", "publication_venue", "publication_date", "publication_status", "publication_url", "description","direct_ancestor_uuids"];
  
	for(let field of requiredFields){
    console.debug(`%c◉ formValues[${field}] `, 'color:#00ff7b', formValues[field]);
    if(!validateRequired(formValues[field])){
      console.debug("%c◉ Required Field Error ", "color:#00ff7b", field, formValues[field]);
      let fieldName = formFields.find(f => f.id === field)?.label || humanize(field);
      if(field !== "direct_ancestor_uuids"){
        e_messages.push(fieldName+" is a required field");
      }
      setFormErrors((prevValues) => ({
        ...prevValues,
        [field]: " Required",
      }));
      errors++;
    }else{
      setFormErrors((prevValues) => ({
        ...prevValues,
        [field]: "",
      }));
    }
  }

  function validatePositiveIntegerField(fieldName, label) {
    if (formValues[fieldName] && formValues[fieldName].length > 0) {
      if (isNaN(formValues[fieldName]) || parseInt(formValues[fieldName]) < 0) {
        e_messages.push(`${label} must be a positive integer`);
        setFormErrors((prevValues) => ({
          ...prevValues,
          [fieldName]: " Must be a positive integer",
        }));
        errors++;
      } else {
        setFormErrors((prevValues) => ({
          ...prevValues,
          [fieldName]: "",
        }));
      }
    }
  }
  validatePositiveIntegerField('issue', 'Issue');
  validatePositiveIntegerField('volume', 'Volume');
  
  if(formValues['direct_ancestor_uuids'].length <= 0 && sourcesData.length <= 0){
    e_messages.push("Please select at least one Source");
  }else if(sourcesData.length > 0 && formValues['direct_ancestor_uuids'].length <= 0){
    setFormValues((prevValues) => ({
      ...prevValues,
      'direct_ancestor_uuids': sourcesData.map(obj => obj.uuid),
    }));

  }

  // Formatting Validation
  errors += validateDOI(formValues['protocol_url']);
  
  console.debug('%c◉ ERRORTEST ', 'color:#00ff7b',errors );
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
		let cleanList = Array.from(new Set(
			selected_string
			.split(",")
			.map(s => s.trim())
			.filter(s => s.length > 0)
		));

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
				setPageErrors(error);
				props.reportError(error);
      });
  }
}

const sourceRemover = (row) => {
  let hid = row.hubmap_id;
  setFormValues((prev) => ({
    ...prev,
    'direct_ancestor_uuids': prev.direct_ancestor_uuids.filter((uuid) => uuid !== row.row.uuid),
  }));
  setSelectedHIDs((prev) => prev.filter((id) => id !== hid));
  setSourcesData((prev) => prev.filter((item) => item.hubmap_id !== hid));
  setSelectedString((prev) => {
    const filtered = prev
      .split(",")
      .map((s) => s.trim())
      .filter((id) => id && id !== hid);
    return filtered.join(", ");
  });

};

const handleSubmit = (e) => {
    e.preventDefault()
    
    setIsProcessing(true);
    if(validateForm()){
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
        setButtonLoading((prev) => ({
          ...prev,
          [target]: true,
        }));
        console.log("buttonLoading",buttonLoading,target, buttonLoading[target]);
        if(e.target.name === "process"){ // Process
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
                var ingestURL= process.env.REACT_APP_URL+"/publication/"+uuid
                var slackMessage = {"message": "Publication has been submitted ("+ingestURL+")"}
                ingest_api_notify_slack(slackMessage)
                  .then(() => {
                    if (response.status < 300) {
                        props.onUpdated(response.results);
                    } else {
                      wrapUp(response)
                      props.reportError(response);
                    }
                  })
              } else { 
                wrapUp(response)
                setPageErrors(response);
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
                  let fullResult = {...response.results, globus_path: res.results};
                  props.onCreated(fullResult);
                })
            }else{
              wrapUp(response.error ? response.error : response)
            }
          })
          .catch((error) => {
            wrapUp(error)
            setPageErrors(error);
          });
      }
    }else{
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }

const wrapUp = (error) => {
  setPageErrors(error.error ? error.error : error);
  setButtonLoading(() => ({
    process: false,
    save: false,
    submit: false,
  }));
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
    if (!selected_HIDs.includes(event.row.hubmap_id)) {
      setSourcesData((rows) => [...rows, event.row]);
      setSelectedUUIDs((rows) => [...rows, event.row.uuid]);
      setSelectedHIDs((ids) => [...ids, event.row.hubmap_id]);
      setSelectedString((str) => str + (str ? ", " : "") + event.row.hubmap_id);
    
      console.debug("handleSelectClick SelctedSOurces", event.row, event.row.uuid);
      console.debug("selected_UUIDs", selected_UUIDs);
      setFormValues((prevValues) => ({
        ...prevValues,
        'dataset_uuids': selected_UUIDs,
        'direct_ancestor_uuids': selected_UUIDs,
      }))
      setFormErrors((prevValues) => ({ //Clear Errors
        ...prevValues,
        'direct_ancestor_uuids': "",
      }));
      setShowSearchDialog(false); 
    } else {
      // maybe alert them theyre selecting one they already picked?
    }
  };

  const renderForum = () => {
    return (
      <>
        {formFields.map((field,index) => {
          if (["text", "date"].includes(field.type)) {
            return (
              <TextField
                InputLabelProps={{ shrink: true }}
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
          if (field.type === "radio") {
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
	const memoizedForum = React.useMemo(
		() => renderForum(),
		[formFields, formValues, formErrors, permissions,]
	);

  // MAIN RENDER
  if(isLoading ||((!entityData || !formValues) && uuid) ){
    return(<LinearProgress />);
  }else{
    return(<>
      <Grid container className='mb-2'>
				{memoizedFormHeader}
      </Grid>
      <form onSubmit={(e) => handleSubmit(e)}>
        <BulkSelector
          showSearchDialog={showSearchDialog}
          setShowSearchDialog={setShowSearchDialog}
          sourceBulkStatus={sourceBulkStatus}
          setSourceBulkStatus={setSourceBulkStatus}
          bulkError={bulkError}
          setBulkError={setBulkError}
          bulkWarning={bulkWarning}
          setBulkWarning={setBulkWarning}
          showHIDList={showHIDList}
          setShowHIDList={setShowHIDList}
          selected_HIDs={selected_HIDs}
          setSelectedHIDs={setSelectedHIDs}
          selected_string={selected_string}
          setSelectedString={setSelectedString}
          sourcesData={sourcesData}
          setSourcesData={setSourcesData}
          permissions={permissions}
          formErrors={formErrors}
          handleInputUUIDs={handleInputUUIDs}
          handleSelectClick={handleSelectClick}
          handleInputChange={handleInputChange}
          sourceRemover={sourceRemover}
        />
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
              <Typography >
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
    </>);
  }
}
