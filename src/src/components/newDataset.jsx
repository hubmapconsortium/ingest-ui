import React, { useEffect, useState, useMemo, useCallback } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import TextField from "@mui/material/TextField";
import FormHelperText from '@mui/material/FormHelperText';
import Snackbar from '@mui/material/Snackbar';
import { useNavigate, useParams } from "react-router-dom";
import { BulkSelector } from "./ui/bulkSelector";
import { FormHeader, UserGroupSelectMenuPatch,TaskAssignment } from "./ui/formParts";
import { DatasetFormFields } from "./ui/fields/DatasetFormFields";
import {RevertFeature} from "../utils/revertModal";
import { humanize, toTitleCase } from "../utils/string_helper";
import { validateRequired } from "../utils/validators";
import { entity_api_get_entity, entity_api_update_entity } from "../service/entity_api";
import { ingest_api_allowable_edit_states, ingest_api_create_dataset } from "../service/ingest_api";
import {ubkg_api_generate_display_subtype} from "../service/ubkg_api";

export const DatasetForm = (props) => {
  let navigate = useNavigate();

  let [entityData, setEntityData] = useState();
  let [isLoading, setLoading] = useState(true);
  let [isProcessing, setIsProcessing] = useState(false);
  let [valErrorMessages, setValErrorMessages] = useState([]);
  let [pageErrors, setPageErrors] = useState(null);
  let [readOnlySources, setReadOnlySources] = useState(false);
  let [preLoadingBulk, setPreLoadingBulk] = useState(false);

  let [permissions, setPermissions] = useState({
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let [buttonLoading, setButtonLoading] = useState({
    process: false,
    save: false,
    submit: false,
  });
  let [formValues, setFormValues] = useState({
    lab_dataset_id: "",
    description: "",
    dataset_info: "",
    contains_human_genetic_sequences: "",
    dt_select: "",
    direct_ancestor_uuids: [],
  });
  let [formErrors, setFormErrors] = useState({ ...formValues });
  let [selectedBulkUUIDs, setSelectedBulkUUIDs] = useState([]);
  let [selectedBulkData, setSelectedBulkData] = useState([]);
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "", 
    status: "info"
  });

  const allGroups = localStorage.getItem("allGroups") ? JSON.parse(localStorage.getItem("allGroups")) : [];

  const formFields = useMemo(() => [
    {
      id: "lab_dataset_id",
      label: "Lab Name or ID",
      helperText: "Lab Name or ID",
      required: true,
      type: "text"
    },
    {
      id: "description",
      label: "Description",
      helperText: "Description Tips",
      required: true,
      type: "textarea"
    },
    {
      id: "dataset_info",
      label: "Additional Information",
      helperText: "Add information here which can be used to find this data, including lab specific (non-PHI) identifiers.",
      required: false,
      type: "textarea"
    },
    {
      id: "contains_human_genetic_sequences",
      label: "Gene Sequences",
      helperText: "",
      required: true,
      type: "radio"
    },
    {
      id: "dt_select",
      label: "Dataset Type",
      helperText: "",
      required: true,
      type: "select",
      writeEnabled: entityData?.uuid ? true : false,
      values: localStorage.getItem("datasetTypes") ? JSON.parse(localStorage.getItem("datasetTypes")).map(dt => ({ value: dt.dataset_type, label: dt.dataset_type })) : []  
    }
  ], []);

  const { uuid } = useParams();

  const memoizedFormHeader = useMemo(
    () => <FormHeader entityData={uuid ? entityData : ["new", "Dataset"]} permissions={permissions} />, [uuid, entityData, permissions]
  );


  useEffect(() => {
    if (uuid && uuid !== "") {
      entity_api_get_entity(uuid)
        .then((response) => {
          if (response.status === 200) {
            const entityType = response.results.entity_type;
            if (entityType !== "Dataset") {
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            } else {
              const entityData = response.results;
              setEntityData(entityData);
              setFormValues({
                lab_dataset_id: entityData.lab_dataset_id,
                description: entityData.description,
                dataset_info: entityData.dataset_info,
                contains_human_genetic_sequences: entityData.contains_human_genetic_sequences,
                dt_select: entityData.dataset_type,
              });
              let formattedAncestors = assembleSourceAncestorData(entityData.direct_ancestors);
              setSelectedBulkUUIDs(entityData.direct_ancestors.map(obj => obj.uuid));
              setSelectedBulkData(formattedAncestors);
              console.log("Entity Data:", entityData.direct_ancestors, selectedBulkData);

              // Set the Bulk Table to read only if the Dataset is not in a modifiable state
              if (entityData.creation_action === "Multi-Assay Split" || entityData.creation_action === "Central Process"){
                setReadOnlySources(true);
              }

              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
                  console.debug('%c◉  ingest_api_allowable_edit_states Permissions', 'color:#00ff7b', response.results);
                  if (entityData.data_access_level === "public") {
                    setReadOnlySources(true);
                    setPermissions({
                      has_write_priv: false,
                    });
                  }
                  if(response.results.has_write_priv === false){
                    setReadOnlySources(true);
                  }
                  setPermissions(response.results);
                  
                })
                .catch((error) => {
                  setPageErrors(error);
                });
            }
          } else {
            setPageErrors(response);
          }
        })
        .catch((error) => {
          setPageErrors(error);
        });
    } else {
      let url = new URL(window.location.href);
      let params = Object.fromEntries(url.searchParams.entries());
      if(Object.keys(params).length > 0){
        console.debug('%c◉ URL params ', 'color:#00ff7b', params);
        setFormValues((prevValues) => ({
          ...prevValues,
          ...params
        }));
        setSnackbarController({
          open: true,
          message: "Passing Form values from URL parameters",
          status: "success"
        });
      }
      setPermissions({
        has_write_priv: true,
      });
      // Set the Source if Passed from URL
        if(params.source_list){
          setPreLoadingBulk(true);
          console.debug('%c◉ params.source_list  setPreLoadingBulk TRUEW', 'color:#00ff7b', params.source_list);
          // Support comma-separated list of UUIDs
          const ancestorUUIDs = params.source_list.split(',').map(s => s.trim()).filter(Boolean);
          let ancestorData = [];
          let fetchCount = 0;
          ancestorUUIDs.forEach((uuidItem) => {
            entity_api_get_entity(uuidItem)
              .then((response) => {
                let error = response?.data?.error ?? false;
                console.debug('%c◉ entity_api_get_entity response ', 'color:#00ff7b', response, error);
                if(!error && (response?.results?.entity_type !== "Collection")){
                  console.debug('%c◉ error ', 'color:#00ff7b', error);
                  let passSource = {row: response?.results ? response.results : null};
                  console.log("passSource",passSource)
                  ancestorData.push(passSource.row);
                }
                else if(!error && response?.results?.entity_type === "Donor" && response.results.entity_type !== "Sample"){
                  setSnackbarController({
                    open: true,
                    message: `Sorry, the entity ${response.results.hubmap_id} (${response.results.entity_type}) is not a valid Source (Must not be a Collection) `,
                    status: "error"
                  });
                }else if(error){
                  setSnackbarController({
                    open: true,
                    message: `Sorry, There was an error selecting your source: ${error}`,
                    status: "error"
                  });
                }else{
                  throw new Error(response)
                }
              })
              .catch((error) => {
                console.debug("entity_api_get_entity ERROR", error);
                setPageErrors(error);
              })
              .finally(() => {
                fetchCount++;
                if (fetchCount === ancestorUUIDs.length) {
                  setSelectedBulkUUIDs(ancestorUUIDs);
                  setSelectedBulkData(assembleSourceAncestorData(ancestorData));
                  handleBulkSelectionChange(ancestorUUIDs, [], "", ancestorData);
                  setFormValues((prevValues) => ({
                    ...prevValues,
                    direct_ancestor_uuids: ancestorUUIDs
                  }));
                  setPreLoadingBulk(false);
                }
              });
          });
        }
    }
    setLoading(false);
    // eslint-disable-next-line
  }, [uuid]);

  const assembleSourceAncestorData = (source_uuids) =>{   
    var dst="";
    source_uuids.forEach(function(row, index) {
      dst=ubkg_api_generate_display_subtype(row);
      console.debug("dst", dst);
      source_uuids[index].display_subtype=toTitleCase(dst);
    });
    return (source_uuids)
  }

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormValues(prev => {
      if (prev[name] === value) return prev;
      return { ...prev, [name]: value };
    });
    console.debug('%c◉  handleInputChange', 'color:#00ff7b',name, value );
  }, []);

  // Callback for BulkSelector
  const handleBulkSelectionChange = (uuids, hids, string, data) => {
    setFormValues(prev => ({
      ...prev,
      direct_ancestor_uuids: uuids
    }));
    setSelectedBulkUUIDs(uuids);
    setSelectedBulkData(data);
  };

  const validateForm = () => {
    setValErrorMessages(null);
    let errors = 0;
    let e_messages = [];
    let requiredFields = ["lab_dataset_id", "description", "contains_human_genetic_sequences", "dt_select"];
    for (let field of requiredFields) {
      if (!validateRequired(formValues[field])) {
        let fieldName = formFields.find(f => f.id === field)?.label || humanize(field);
        e_messages.push(fieldName + " is a required field");
        setFormErrors((prevValues) => ({
          ...prevValues,
          [field]: " Required",
        }));
        errors++;
      } else {
        setFormErrors((prevValues) => ({
          ...prevValues,
          [field]: "",
        }));
      }
    }
    if (!selectedBulkData || selectedBulkData.length <= 0) {
      e_messages.push("Please select at least one Source");
      errors++;
      setFormErrors((prevValues) => ({
        ...prevValues,
        ["direct_ancestor_uuids"]: "Required",
      }));
    } else if (selectedBulkData.length > 0 && formValues['direct_ancestor_uuids'].length <= 0) {
      setFormValues((prevValues) => ({
        ...prevValues,
        'direct_ancestor_uuids': selectedBulkData.map(obj => obj.uuid),
      }));
    }
    setValErrorMessages(errors > 0 ? e_messages : null);
    return errors === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsProcessing(true);
      let selectedUUIDs = selectedBulkData.map((obj) => obj.uuid);
      let cleanForm = {
        lab_dataset_id:formValues.lab_dataset_id,
        contains_human_genetic_sequences:formValues.contains_human_genetic_sequences === "yes" ? true : false,
        description:formValues.description, 
        dataset_info:formValues.dataset_info,
        direct_ancestor_uuids: selectedUUIDs,
      };
      console.debug('%c⭗ Data', 'color:#00ff7b',cleanForm  );
      // if(this.state.has_admin_priv){
      //   console.debug('%c⊙', 'color:#8b1fff', this.state.assigned_to_group_name, this.state.ingest_task );
      //   if (this.state.assigned_to_group_name && this.state.assigned_to_group_name.length > 0){
      //     data["assigned_to_group_name"]=this.state.assigned_to_group_name;
      //   }
      //   if (this.state.ingest_task && this.state.ingest_task.length > 0){
      //     data["ingest_task"]=this.state.ingest_task;
      //   }
      // }
      console.debug('%c⭗ Data', 'color:#00ff7b',cleanForm);
      if (uuid) {
        let target = e.target.name;
        setButtonLoading((prev) => ({
          ...prev,
          [target]: true,
        }));
        entity_api_update_entity(uuid, JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setPageErrors(response);
              setButtonLoading((prev) => ({
                ...prev,
                [target]: false,
              }));
            }
          })
          .catch((error) => {
            setPageErrors(error);
            setButtonLoading((prev) => ({
              ...prev,
              [target]: false,
            }));
          });
      } else {
        let group_uuid = formValues["group_uuid"] ? formValues["group_uuid"].value : JSON.parse(localStorage.getItem("userGroups"))[0].uuid;
        cleanForm.dataset_type = formValues.dt_select;
        cleanForm.group_uuid = formValues.group_uuid;
        console.log(formValues, formValues.contains_human_genetic_sequences )
        console.debug('%c◉ cleanForm ', 'color:#00ff7b', cleanForm);
        ingest_api_create_dataset(JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status === 200) {
              props.onCreated(response.results);
            } else {
              setPageErrors(response.error ? response.error : response);
            }
          })
          .catch((error) => {
            setPageErrors(error);
            setButtonLoading(() => ({
              process: false,
              save: false,
              submit: false,
            }));
          });
      }
      
    } else {
      setButtonLoading(() => ({
        process: false,
        save: false,
        submit: false,
      }));
    }
  };

  const buttonEngine = () => {
    return (<>
      <Box sx={{ textAlign: "left" }}>
        {uuid && uuid.length > 0 && permissions.has_admin_priv &&(
          <RevertFeature uuid={entityData ? entityData.uuid : null} type={entityData ? entityData.entity_type : 'entity'}/>
        )}
      </Box>
      <Box sx={{ textAlign: "right" }}>
        <LoadingButton
          variant="contained"
          className="m-2"
          onClick={() => navigate("/")}>
          Cancel
        </LoadingButton>
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
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status !== "new" && (
          <LoadingButton
            loading={buttonLoading['submit']}
            onClick={(e) => handleSubmit(e)}
            name="submit"
            variant="contained"
            className="m-2"
          >
            Submit
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status !== "published" && (
          <LoadingButton
            loading={buttonLoading['save'] === true ? true : false}
            name="save"
            onClick={(e) => handleSubmit(e)}
            variant="contained"
            className="m-2"
          >
            Save
          </LoadingButton>
        )}
      </Box>
    </>);
  };

  if (isLoading || ((!entityData || !formValues) && uuid)) {
    return (<LinearProgress />);
  } else {
    return (
      <Box className={formErrors}>
        <Grid container className='mb-2'>
          {memoizedFormHeader}
        </Grid>
        <form onSubmit={(e) => handleSubmit(e)}>
            <BulkSelector
              permissions={permissions}
              initialSelectedUUIDs={selectedBulkUUIDs}
              initialSourcesData={selectedBulkData}
              onBulkSelectionChange={handleBulkSelectionChange}
              searchFilters={{
                custom_title: "Search for a Source ID for your Dataset",
                custom_subtitle: "Collections may not be selected for Dataset sources",
                blacklist: ['collection']
              }}
              readOnly={readOnlySources}
              preLoad = {preLoadingBulk}
            />
          <DatasetFormFields
            formFields={formFields}
            formValues={formValues}
            formErrors={formErrors}
            permissions={permissions}
            handleInputChange={handleInputChange}
            readOnly = {uuid && true}
          />
          {/* TASK ASSIGNMENT */}
          {uuid && (
            <TaskAssignment
              uuid={uuid}
              permissions={permissions}
              entityData={entityData}
              formValues={formValues}
              formErrors={formErrors}
              handleInputChange={handleInputChange}
              allGroups={allGroups}
            />
          )}
          {!uuid && (
            <Box className="my-3">
              <InputLabel sx={{ color: "rgba(0, 0, 0, 0.38)" }} htmlFor="group_uuid">
                Group
              </InputLabel>
              <NativeSelect
                id="group_uuid"
                label="Group"
                onChange={handleInputChange}
                fullWidth
                className="p-2"
                sx={{
                  borderTopLeftRadius: "4px",
                  borderTopRightRadius: "4px",
                }}
                disabled={uuid ? true : false}
                value={formValues["group_uuid"] ? formValues["group_uuid"].value : JSON.parse(localStorage.getItem("userGroups"))[0].uuid}>
                <UserGroupSelectMenuPatch />
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
        
        {/* Snackbar Feedback*/}
        <Snackbar 
          open={snackbarController.open} 
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          autoHideDuration={6000} 
          onClose={() => setSnackbarController(prev => ({...prev, open: false}))}>
          <Alert
            onClose={() => setSnackbarController(prev => ({...prev, open: false}))}
            severity={snackbarController.status}
            variant="filled"
            sx={{ 
              width: '100%',
              backgroundColor: snackbarController.status === "error" ? "#f44336" : "#4caf50",
              }}>
            {snackbarController.message}
          </Alert>
        </Snackbar>
      </Box>
    );
  }
};