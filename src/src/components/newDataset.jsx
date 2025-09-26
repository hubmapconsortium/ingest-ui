
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
import Snackbar from '@mui/material/Snackbar';
import { useNavigate, useParams } from "react-router-dom";
import { BulkSelector } from "./ui/bulkSelector";
import { FormHeader, UserGroupSelectMenuPatch,TaskAssignment } from "./ui/formParts";
import { DatasetFormFields } from "./ui/fields/DatasetFormFields";
import {RevertFeature} from "../utils/revertModal";
import { humanize } from "../utils/string_helper";
import { validateRequired } from "../utils/validators";
import { entity_api_get_entity, entity_api_update_entity } from "../service/entity_api";
import { ingest_api_allowable_edit_states, ingest_api_create_dataset } from "../service/ingest_api";
import { handleSourceListFromParams } from "./ui/formParts";
import { prefillFormValuesFromUrl } from "./ui/formParts";

export const DatasetForm = (props) => {
  let navigate = useNavigate();

  const [entityData, setEntityData] = useState();
  const [loading, setLoading] = useState({
    page: true,
    processing: false,
    bulk: false,
    button: { process: false, save: false, submit: false }
  });
  const [form, setForm] = useState({
    lab_dataset_id: "",
    description: "",
    dataset_info: "",
    contains_human_genetic_sequences: "",
    dt_select: "",
    direct_ancestor_uuids: [],
    group_uuid: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [errorMessages, setErrorMessages] = useState([]);
  const [pageErrors, setPageErrors] = useState(null);
  const [readOnlySources, setReadOnlySources] = useState(false);
  const [permissions, setPermissions] = useState({
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  const [bulkSelection, setBulkSelection] = useState({ uuids: [], data: [] });
  const [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  const allGroups = localStorage.getItem("allGroups") ? JSON.parse(localStorage.getItem("allGroups")) : [];
  const { uuid } = useParams();
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
      writeEnabled: (uuid?.length<=0 || uuid === undefined || uuid === null) ? true : false,
      values: localStorage.getItem("datasetTypes") ? JSON.parse(localStorage.getItem("datasetTypes")).map(dt => ({ value: dt.dataset_type, label: dt.dataset_type })) : []  
    },
    {
      id: "group_uuid",
      label: "Group",
      helperText: (uuid?.length<=0 || uuid === undefined || uuid === null) ? "" : `Select the group for this dataset.`,
      required: true,
      type: "select", 
      writeEnabled: (uuid?.length<=0 || uuid === undefined || uuid === null) ? true : false,
      values: localStorage.getItem("userGroups") ? JSON.parse(localStorage.getItem("userGroups")).map(g => ({ value: g.uuid, label: g.displayname })) : []
    }
  ], []);

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
              setForm({
                lab_dataset_id: entityData.lab_dataset_id,
                description: entityData.description,
                dataset_info: entityData.dataset_info,
                contains_human_genetic_sequences: entityData.contains_human_genetic_sequences,
                dt_select: entityData.dataset_type,
                group_uuid: entityData.group_uuid,
                direct_ancestor_uuids: entityData.direct_ancestors.map(obj => obj.uuid)
              });
              setBulkSelection({
                uuids: entityData.direct_ancestors.map(obj => obj.uuid),
                data: entityData.direct_ancestors
              });
              // Set the Bulk Table to read only if the Dataset is not in a modifiable state
              if (entityData.creation_action === "Multi-Assay Split" || entityData.creation_action === "Central Process"){
                setReadOnlySources(true);
              }
              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
                  if (entityData.data_access_level === "public") {
                    setReadOnlySources(true);
                    setPermissions({ has_write_priv: false });
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
      // Pre-fill form values from URL parameters
      const params = prefillFormValuesFromUrl(setForm, setSnackbarController);
      // Handle source_list from URL params
      handleSourceListFromParams(params, {
        setPreLoadingBulk: (v) => setLoading(l => ({ ...l, bulk: v })),
        setSnackbarController,
        setSelectedBulkUUIDs: (uuids) => setBulkSelection(sel => ({ ...sel, uuids })),
        setSelectedBulkData: (data) => setBulkSelection(sel => ({ ...sel, data })),
        handleBulkSelectionChange: (uuids, hids, string, data) => setBulkSelection({ uuids, data }),
        setFormValues: setForm,
        setPageErrors
      });
      setPermissions({ has_write_priv: true });
    }
    setLoading(l => ({ ...l, page: false }));
  }, [uuid]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (prev[name] === value) return prev;
      return { ...prev, [name]: value };
    });
    console.debug('%c◉  handleInputChange', 'color:#00ff7b', name, value);
  }, []);

  // Callback for BulkSelector
  const handleBulkSelectionChange = (uuids, hids, string, data) => {
    setForm(prev => ({
      ...prev,
      direct_ancestor_uuids: uuids
    }));
    setBulkSelection({ uuids, data });
  };

  const validateForm = () => {
    setErrorMessages([]);
    let errors = 0;
    let e_messages = [];
    let requiredFields = ["lab_dataset_id", "description", "contains_human_genetic_sequences", "dt_select", "group_uuid"];
    let newFormErrors = {};
    for (let field of requiredFields) {
      if (!validateRequired(form[field])) {
        let fieldName = formFields.find(f => f.id === field)?.label || humanize(field);
        e_messages.push(fieldName + " is a required field");
        newFormErrors[field] = " Required";
        errors++;
      } else {
        newFormErrors[field] = "";
      }
    }
    if (!bulkSelection.data || bulkSelection.data.length <= 0) {
      e_messages.push("Please select at least one Source");
      errors++;
      newFormErrors["direct_ancestor_uuids"] = "Required";
    } else if (bulkSelection.data.length > 0 && form['direct_ancestor_uuids'].length <= 0) {
      setForm(prev => ({
        ...prev,
        'direct_ancestor_uuids': bulkSelection.data.map(obj => obj.uuid),
      }));
    }
    setFormErrors(newFormErrors);
    setErrorMessages(errors > 0 ? e_messages : []);
    return errors === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(l => ({ ...l, processing: true }));
      let selectedUUIDs = bulkSelection.data.map((obj) => obj.uuid);
      let cleanForm = {
        lab_dataset_id: form.lab_dataset_id,
        contains_human_genetic_sequences: form.contains_human_genetic_sequences === "yes" ? true : false,
        description: form.description,
        dataset_info: form.dataset_info,
        direct_ancestor_uuids: selectedUUIDs,
        dataset_type: form.dt_select,
        group_uuid: form.group_uuid
      };
      console.debug('%c⭗ Data', 'color:#00ff7b', cleanForm);
      if (uuid) {
        let target = e.target.name;
        setLoading(l => ({ ...l, button: { ...l.button, [target]: true } }));
        entity_api_update_entity(uuid, JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setPageErrors(response);
              setLoading(l => ({ ...l, button: { ...l.button, [target]: false } }));
            }
          })
          .catch((error) => {
            setPageErrors(error);
            setLoading(l => ({ ...l, button: { ...l.button, [target]: false } }));
          });
      } else {
        // If group_uuid is not set, default to first user group
        let group_uuid = form.group_uuid || (localStorage.getItem("userGroups") ? JSON.parse(localStorage.getItem("userGroups"))[0].uuid : "");
        cleanForm.group_uuid = group_uuid;
        console.log(form, form.contains_human_genetic_sequences);
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
            setLoading(l => ({ ...l, button: { process: false, save: false, submit: false }, processing: false }));
          });
      }
    } else {
      setLoading(l => ({ ...l, button: { process: false, save: false, submit: false }, processing: false }));
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
            loading={loading.processing}
            className="m-2"
            onClick={(e) => handleSubmit(e)}
            type="submit">
            Save
          </LoadingButton>
        )}
        
        {uuid && uuid.length > 0 && permissions.has_admin_priv && (
          <LoadingButton
            loading={loading.button.process}
            name="process"
            onClick={(e) => handleSubmit(e)}
            variant="contained"
            className="m-2">
            Process
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status !== "new" && (
          <LoadingButton
            loading={loading.button.submit}
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
            loading={!!loading.button.save}
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

  if (loading.page || ((!entityData || !form) && uuid)) {
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
              initialSelectedUUIDs={bulkSelection.uuids}
              initialSourcesData={bulkSelection.data}
              onBulkSelectionChange={handleBulkSelectionChange}
              searchFilters={{
                custom_title: "Search for a Source ID for your Dataset",
                custom_subtitle: "Collections may not be selected for Dataset sources",
                blacklist: ['collection']
              }}
              readOnly={readOnlySources}
              preLoad={loading.bulk}
            />
          <DatasetFormFields
            formFields={formFields}
            formValues={form}
            formErrors={formErrors}
            permissions={permissions}
            handleInputChange={handleInputChange}
            readOnly={uuid && true}
          />
          {/* TASK ASSIGNMENT */}
          {uuid && (
            <TaskAssignment
              uuid={uuid}
              permissions={permissions}
              entityData={entityData}
              formValues={form}
              formErrors={formErrors}
              handleInputChange={handleInputChange}
              allGroups={allGroups}
            />
          )}
          {errorMessages && errorMessages.length > 0 && (
            <Alert severity="error">
              <AlertTitle>Please Review the following problems:</AlertTitle>
              {errorMessages.map(error => (
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