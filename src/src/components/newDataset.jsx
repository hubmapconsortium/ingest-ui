
import React, { useEffect, useState, useMemo, useCallback } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import LinearProgress from "@mui/material/LinearProgress";
import Snackbar from '@mui/material/Snackbar';
import { useNavigate, useParams } from "react-router-dom";
import { BulkSelector } from "./ui/bulkSelector";
import { FormHeader, TaskAssignment } from "./ui/formParts";
import { DatasetFormFields } from "./ui/fields/DatasetFormFields";
import {RevertFeature} from "../utils/revertModal";
import { humanize } from "../utils/string_helper";
import { validateRequired } from "../utils/validators";
import { entity_api_get_entity, entity_api_update_entity } from "../service/entity_api";
import { 
  ingest_api_allowable_edit_states, 
  ingest_api_create_dataset, 
  ingest_api_validate_entity,
  ingest_api_pipeline_test_submit,
  ingest_api_dataset_submit,
  ingest_api_notify_slack} from "../service/ingest_api";
import { prefillFormValuesFromUrl, EntityValidationMessage, RenderSubmitModal } from "./ui/formParts";
export const DatasetForm = (props) => {
  let navigate = useNavigate();

  let [entityData, setEntityData] = useState();
  let [loading, setLoading] = useState({
    page: true,
    processing: false,
    bulk: false,
    button: { process: false, save: false, submit: false, submitFT: false, validate: false }
  });
  let [form, setForm] = useState({
    lab_dataset_id: "",
    description: "",
    dataset_info: "",
    contains_human_genetic_sequences: "",
    dt_select: "",
    direct_ancestor_uuids: [],
    group_uuid: "",
    ingest_task: "",
    assigned_to_group_name: ""
  });
  let [formErrors, setFormErrors] = useState({});
  let [errorMessages, setErrorMessages] = useState([]);
  let [pageErrors, setPageErrors] = useState(null);
  let [readOnlySources, setReadOnlySources] = useState(false);
  let [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  let [entityValidation, setEntityValidation] = useState({
    open: false,
    message: null
  });
  let [permissions, setPermissions] = useState({
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let [bulkSelection, setBulkSelection] = useState({ uuids: [], data: [] });
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  const allGroups = localStorage.getItem("allGroups") ? JSON.parse(localStorage.getItem("allGroups")) : [];
  const { uuid } = useParams();
  const formFields = useMemo(() => [{
      id: "lab_dataset_id",
      label: "Lab Name or ID",
      helperText: "An identifier used locally by the data provider.",
      required: true,
      type: "text"
    },
    {
      id: "description",
      label: "Description",
      helperText: "",
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
      values: localStorage.getItem("dataset_types") ? JSON.parse(localStorage.getItem("dataset_types")).map(dt => ({ value: dt.dataset_type, label: dt.dataset_type })) : []  
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
          // console.debug('%c◉ RESP ', 'color:#00ff7b', response);
          if(response.status === 404 || response.status === 400){
            // console.debug('%c◉ ERRRRR ', 'color:#FFFFFF;background: #2200FF;padding:200' , );
            navigate("/notFound?entityID="+uuid);
          }
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
                direct_ancestor_uuids: entityData.direct_ancestors.map(obj => obj.uuid),
                ingest_task: entityData.ingest_task || "",
                assigned_to_group_name: entityData.assigned_to_group_name || ""
              });
              setBulkSelection({
                uuids: entityData.direct_ancestors.map(obj => obj.uuid),
                data: entityData.direct_ancestors
              });
              // Set the Bulk Table to read only if the Dataset is not in a modifiable state
              if (entityData.creation_action === "Multi-Assay Split" || entityData.creation_action === "Central Process"){
                setReadOnlySources(true);
              }

              ingest_api_allowable_edit_states(entityData.uuid)
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
                  // console.error(error);

                  setPageErrors(error);
                });
            }
          } else {
            setPageErrors(response);
          }
        })
        .catch((error) => {
            // console.debug('%c◉ ingest_api_allowable_edit_states ERR Catch ', 'color:#FFFFFF;background: #2200FF;padding:200' ,error );
          if(error.status === 404){
            navigate("/notFound?entityID="+uuid);
          }
          setPageErrors(error);
        });
    } else {
      // Pre-fill form values from URL parameters
      prefillFormValuesFromUrl(setForm, setSnackbarController);
      setPermissions({ has_write_priv: true });
    }
    setLoading(prevVals => ({ ...prevVals, page: false }));
  }, [uuid]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm(prev => {
      if (prev[name] === value) return prev;
      return { ...prev, [name]: value };
    });
    // console.debug('%c◉  handleInputChange', 'color:#00ff7b', name, value);
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

  function buildCleanForm() {
    let selectedUUIDs = bulkSelection.data.map(obj => obj.uuid);
    let cleanForm = {
      lab_dataset_id: form.lab_dataset_id,
      contains_human_genetic_sequences: form.contains_human_genetic_sequences === "yes",
      description: form.description,
      dataset_info: form.dataset_info,
      direct_ancestor_uuids: selectedUUIDs,
      ...(((form.assigned_to_group_name && form.assigned_to_group_name !== entityData?.assigned_to_group_name) && permissions.has_admin_priv) && { assigned_to_group_name: form.assigned_to_group_name }),
      ...(((form.ingest_task && form.ingest_task !== entityData?.ingest_task) && permissions.has_admin_priv) && { ingest_task: form.ingest_task })
    };
    if (!uuid) {
      cleanForm.group_uuid = form.group_uuid || (localStorage.getItem("userGroups") ? JSON.parse(localStorage.getItem("userGroups"))[0].uuid : "");
      cleanForm.dataset_type = form.dt_select;
    }
    return cleanForm;
  }

  const handleSave = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(prevVals => ({ ...prevVals, processing: true }));
      let selectedUUIDs = bulkSelection.data.map((obj) => obj.uuid);
      let cleanForm = {
        lab_dataset_id: form.lab_dataset_id,
        contains_human_genetic_sequences: form.contains_human_genetic_sequences === "yes" ? true : false,
        description: form.description,
        dataset_info: form.dataset_info,
        direct_ancestor_uuids: selectedUUIDs,
        ...(((form.assigned_to_group_name && form.assigned_to_group_name !== entityData.assigned_to_group_name) && permissions.has_admin_priv) && {assigned_to_group_name: form.assigned_to_group_name}),
        ...(((form.ingest_task && form.ingest_task !== entityData.ingest_task) && permissions.has_admin_priv) && {ingest_task: form.ingest_task})
      };
      // console.debug('%c⭗ Data', 'color:#00ff7b', cleanForm);
      if (uuid) {
        let target = e.target.name;
        setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, [target]: true } }));
        // console.log("handleSave", target);
        entity_api_update_entity(uuid, JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setPageErrors(response);
              setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, [target]: false } }));
            }
          })
          .catch((error) => {
            setPageErrors(error);
            setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, [target]: false } }));
          });
      } else {
        // If group_uuid is not set, default to first user group
        let group_uuid = form.group_uuid || (localStorage.getItem("userGroups") ? JSON.parse(localStorage.getItem("userGroups"))[0].uuid : "");
        cleanForm.group_uuid = group_uuid;
        cleanForm.dataset_type = form.dt_select
        cleanForm.group_uuid = form.group_uuid
        // console.log(form, form.contains_human_genetic_sequences);
        // console.debug('%c◉ cleanForm ', 'color:#00ff7b', cleanForm);
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
            setLoading(prevVals => ({ ...prevVals, button: { process: false, save: false, submit: false }, processing: false }));
          });
      }
    } else {
      setLoading(prevVals => ({ ...prevVals, button: { process: false, save: false, submit: false }, processing: false }));
    }
  };

  const handleValidateEntity = (e) => {
    e.preventDefault();
    ingest_api_validate_entity(entityData.uuid, "datasets")
      .then((response) => {
        // console.debug('%c◉ res ', 'color:#00ff7b', response);
        setEntityValidation({
          open: true,
          message: response
        });
      })
      .catch((error) => {
        // console.debug('%c◉ error ', 'color:#ff007b', error);
        setEntityValidation({
          open: true,
          message: error
        });
      });
  };

  const handleSubmitForTesting = () => {
    // console.debug('%c◉ Submitting for Testing ', 'color:#00ff7b', );
    // NOTE: CannotBe Derived! @TODO? 
    ingest_api_pipeline_test_submit({"uuid": entityData.uuid})
      .then((response) => {
        // console.debug('%c◉  SUBMITTED', 'color:#00ff7b', response);
        let results = "";
        let title = "";
        if(response.status === 200){
          title = "Submitted for Testing";
          results = "Dataset submitted for test processing";
        }else if(response.status === 500){
          title = "Error";
          results = "Unexpected error occurred, please ask an admin to check the ingest-api logs.";
        }else{
          title = "Submission Response: "+response.status;
          results = response.results;
        }
        setSnackbarController({
          open: true,
          message: title+" - "+results,
          status: "success"
        });
      })
      .catch((error) => {
        setSnackbarController({
          open: true,
          message: "SubmitForTesting Error - "+error.toString(),
          status: "error"
        });
      })
  }

  const handleLaunchSubmitModal = () => {
    setIsSubmitModalOpen(true);
  }
  
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, submit: true } }));
    var dataSubmit = {"status":"Submitted"}
    setIsSubmitModalOpen(false);
    entity_api_update_entity(entityData.uuid, JSON.stringify(dataSubmit))
      .then((response) => {
        // console.debug("entity_api_update_entity response", response);
        // @TODO: Move slackness call into entity_api_update_entity
        var ingestURL= process.env.REACT_APP_URL+"/dataset/"+uuid
        var slackMessage = {"message":"Dataset has been submitted ("+ingestURL+")"}
        ingest_api_notify_slack(slackMessage)
          .then((slackRes) => {
            // console.debug("slackRes", slackRes);
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setSnackbarController({
                open: true,
                message: "Slack Notification Error - "+response.toString(),
                status: "error"
              });
            }
          })
          .catch((error) => {
            setSnackbarController({
              open: true,
              message: "Submit Error - "+error.toString(),
              status: "error"
            });
          });
      })
      .catch((error) => {
        console.error("handleSubmit error", error);
        setSnackbarController({
          open: true,
          message: "Submit Error - "+error.toString(),
          status: "error"
        });
      });
  }

  const handleProcess = (e) => {
    e.preventDefault();
    setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, process: true } }));
    let data = buildCleanForm();
    ingest_api_dataset_submit(entityData.uuid, JSON.stringify(data))
      .then((response) => {
          if (response.status < 300) {
            props.onUpdated(response.results);
          } else { 
            // @TODO: Update on the API's end to hand us a Real error back, not an error wrapped in a 200 
            var statusText = "";
            // console.debug("err", response, response.error);
            if(response.err){
              statusText = response.err.response.status+" "+response.err.response.statusText;
            }else if(response.error){
              statusText = response.error.response.status+" "+response.error.response.statusText;
            }
            var submitErrorResponse="Uncaptured Error";
            if(response.err && response.err.response.data ){
              submitErrorResponse = response.err.response.data 
            }
            if(response.error && response.error.response.data ){
              submitErrorResponse = response.error.response.data 
            }
            setSnackbarController({
              open: true,
              message: "Process Error - "+statusText+" "+submitErrorResponse,
              status: "error"
            });
            // console.debug("entity_api_get_entity RESP NOT 200", response.status, response);
          }
        })
        .catch((error) => {
          setSnackbarController({
            open: true,
            message: "Process Error - "+error.toString(),
            status: "error"
          });
        });
            
  }

  const buttonEngine = () => {
    return (<>
      <Box sx={{ textAlign: "right" }}>
        <LoadingButton
          variant="contained"
          className="m-2"
          onClick={() => navigate("/")}>
          Cancel
        </LoadingButton>
        {/* NEW, INVALID, REOPENED, ERROR, SUBMITTED */}
        {!uuid && (
          <LoadingButton
            variant="contained"
            name="generate"
            loading={loading.processing}
            className="m-2"
            onClick={(e) => handleSave(e)}
            type="submit">
            Save
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_admin_priv && (!["published"].includes(entityData.status.toLowerCase())) && (
          <RevertFeature uuid={entityData ? entityData.uuid : null} type={entityData ? entityData.entity_type : 'entity'}/>
        )}
        {/* NEW, SUBMITTED */}
        {uuid && uuid.length > 0 && permissions.has_admin_priv && ["new", "submitted"].includes(entityData.status.toLowerCase()) && (
          <LoadingButton
            loading={loading.button.process}
            name="process"
            onClick={(e) => handleProcess(e)}
            variant="contained"
            className="m-2">
            Process
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status.toLowerCase() === "new" && (
          <LoadingButton
            loading={loading.button.submitFT}
            onClick={(e) => handleSubmitForTesting(e)}
            name="submit"
            variant="contained"
            className="m-2">
            Submit for Testing
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status.toLowerCase() === "new" && (
          <LoadingButton
            loading={loading.button.submit}
            onClick={(e) => handleLaunchSubmitModal(e)}
            name="submit"
            variant="contained"
            className="m-2">
            Submit
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_admin_priv && (!["published", "processing"].includes(entityData.status.toLowerCase())) && (
          <LoadingButton
            loading={loading.button.validate}
            onClick={(e) => handleValidateEntity(e)}
            name="validate"
            variant="contained"
            className="m-2">
            Validate
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && ((permissions.has_write_priv && (!["published", "QA"].includes(entityData.status.toLowerCase()))) || (permissions.has_admin_priv && entityData.status === "QA")) && (
          <LoadingButton
            loading={loading.button.save}
            name="save"
            onClick={(e) => handleSave(e)}
            variant="contained"
            className="m-2">
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
        <form>
            <BulkSelector
              permissions={permissions}
              dialogTitle={"Associated Entities"}
              dialogSubtitle={"Entities associated with this Dataset"}
              initialSelectedUUIDs={bulkSelection.uuids}
              initialSourcesData={bulkSelection.data}
              initialSelectedString={bulkSelection.data.map(obj => obj.hubmap_id).join(", ")}
              onBulkSelectionChange={handleBulkSelectionChange}
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
        {entityValidation?.message && (
          <EntityValidationMessage
            response={entityValidation.message}
            eValopen={entityValidation.open}
            setEValopen={(open) => setEntityValidation(prev => ({ ...prev, open }))}
          />
        )}
        {uuid && entityData.status.toLowerCase() === "new" && (
          <RenderSubmitModal
            showSubmitModal={isSubmitModalOpen}
            setIsSubmitModalOpen={setIsSubmitModalOpen}
            submitting={loading.button.submit}
            handleSubmitAction={handleSubmit}/>
        )}
      </Box>
    );
  }
};