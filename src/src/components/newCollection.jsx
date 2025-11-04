import React, { useEffect, useState, useCallback } from "react";
import Grid from "@mui/material/Grid";
import { useNavigate, useParams } from "react-router-dom";
import LinearProgress from "@mui/material/LinearProgress";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Typography from "@mui/material/Typography";
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from "@mui/material/NativeSelect";
import LoadingButton from "@mui/lab/LoadingButton";
import { BulkSelector } from "./ui/bulkSelector";
import { ContributorsTable } from "./ui/contributorsTable";
import { FormHeader, UserGroupSelectMenu,prefillFormValuesFromUrl,SnackbarFeedback } from "./ui/formParts";
import { CollectionFormFields } from "./ui/fields/CollectionFormFields";
import {entity_api_create_entity, entity_api_update_entity, entity_api_get_filtered_entity } from "../service/entity_api";
import { ingest_api_users_groups,ingest_api_user_admin,ingest_api_publish_collection } from "../service/ingest_api";
import { validateRequired } from "../utils/validators";

export const CollectionForm = (props) => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [entityData, setEntityData] = useState();
  // const [isLoading, setLoading] = useState(true);
  let [loading, setLoading] = useState({
    page: true,
    button: {save: false, publish: false, }
  });
  const [valErrorMessages, setValErrorMessages] = useState([]);
  const [pageErrors, setPageErrors] = useState(null);
  const [permissions, setPermissions] = useState({ has_write_priv: true, has_admin_priv: false, });
  // Removed unused buttonLoading
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    dataset_uuids: [],
    contributors: [],
    group_uuid: "",
  });
  const [deliniatedContacts, setDeliniatedContacts] = useState([]);
  const [formErrors, setFormErrors] = useState({ ...formValues });
  let [bulkSelection, setBulkSelection] = useState({ uuids: [], data: [] });
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  const formFields = React.useMemo(() => [
    {
      id: "title",
      label: "Title",
      helperText: "The title of the collection",
      required: true,
      type: "text",
    },
    {
      id: "description",
      label: "Description",
      helperText: "A description of the collection",
      required: true,
      type: "text",
      multiline: true,
      rows: 4,
    },
  ], []);

  const memoizedUserGroupSelectMenu = React.useMemo(
    () => <UserGroupSelectMenu />, []
  );

  useEffect(() => {
    console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
    if (uuid && uuid !== "") {
      entity_api_get_filtered_entity(uuid,["datasets.antibodies", "datasets.contacts", "datasets.contributors", "datasets.files", "datasets.metadata", "datasets.ingest_metadata"])
        .then((response) => {
          if (response.status === 200) {
            const entityType = response.results.entity_type;
            if (entityType !== "Collection") {
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            } else {
              const entityData = response.results;
              entityData.initialSelectedUUIDs = entityData.dataset_uuids || [];
              setEntityData(entityData);
              setFormValues({
                title: entityData.title || "",
                description: entityData.description || "",
                dataset_uuids: entityData.dataset_uuids || [],
                contributors: entityData.contributors || [],
                contacts: entityData.contacts || [],
                group_uuid: entityData.group_uuid || "",
              });
              console.debug('%c◉ entityData.dataset_uuids ', 'color:#00ff7b', entityData.dataset_uuids);
              setBulkSelection({
                uuids: entityData.datasets.map(obj => obj.uuid),
                data: entityData.datasets
              });
              // processContacts(response.results);
              ingest_api_users_groups()
                .then((response) => {
                  console.debug('%c◉ response ', 'color:#00ff7b', response);
                  // setPermissions(response.results);
                })
                .catch((error) => {
                  console.debug('%c◉ error ', 'color:#00ff7b', error);
                  setPageErrors(error);
                });
              ingest_api_user_admin()
                .then((response) => {
                  console.debug('%c◉ response ', 'color:#00ff7b', response);
                  setPermissions(prev => ({...prev, has_admin_priv: response }));
                })
                .catch((error) => {
                  console.debug('%c◉ error ', 'color:#00ff7b', error);
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
      prefillFormValuesFromUrl(setFormValues, setSnackbarController);
      setPermissions({ has_write_priv: true });
    }
    // setLoading(false);
    setLoading(prevVals => ({ ...prevVals, page: false }));
  }, [uuid]);

  const handleInputChange = useCallback((e) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  function handleContributorsChange(newContributors) {
    console.debug('%c◉  handleContributorsChange ', 'color:#00ff7b', newContributors);
    processContacts(newContributors.data);
    if(newContributors.errors && newContributors.errors.length>0){
      setFormErrors(prev => ({...prev, contributors: "There are errors in the contributors data"}))
    }
    if(newContributors.errors && newContributors.errors.length>0){
      setFormErrors(prev => ({...prev, contributors: "There are errors in the contributors data"}))
    }else if(!newContributors.errors || newContributors.errors.length===0){
      setFormErrors(prev => ({...prev, contributors: ""}))
      console.debug('%c◉ frmErroros ', 'color:#E7EEFF;background: #9359FF;padding:200', formErrors);
    }
  }

  function processContacts(data){
    var contributors = []
    var contacts = []
    for (const row of data) {
      contributors.push(row)
      if (row?.is_contact && ( row?.is_contact === "TRUE"|| row?.is_contact.toLowerCase()==="yes" )){
        contacts.push(row)
      } 
    }
    console.debug('%c◉ contacts ', 'color:#00ff7b', contacts);
    setDeliniatedContacts({contacts: contacts, contributors: contributors})
  }

  // // Callback for BulkSelector
  const handleBulkSelectionChange = (uuids, hids, string, data) => {
    setFormValues(prev => ({
      ...prev,
      dataset_uuids: uuids
    }));
    setBulkSelection({ uuids, data });
  };

  const validateForm = () => {
    setValErrorMessages(null);
    let errors = 0;
    let e_messages = [];
    let requiredFields = ["title", "description"];
    for (let field of requiredFields) {
      if (!validateRequired(formValues[field])) {
        let fieldName = formFields.find(f => f.id === field)?.label || field;
        e_messages.push(fieldName + " is a required field");
        setFormErrors((prevValues) => ({ ...prevValues, [field]: " Required" }));
        errors++;
      } else {
        setFormErrors((prevValues) => ({ ...prevValues, [field]: "" }));
      }
    }

    console.debug('%c◉ formValues ', 'color:#00ff7b', formValues, formValues["dataset_uuids"], bulkSelection.uuids);
    let datasetUUIDs = entityData?.datasets ? entityData.datasets.map(d => d.uuid) : bulkSelection.uuids;
    if( (!bulkSelection.data || bulkSelection.data.length <= 0) && 
        (!datasetUUIDs || datasetUUIDs.length <= 0) ){
        e_messages.push("Please select at least one Associated Dataset");
        errors++;
      setFormErrors((prevValues) => ({ ...prevValues, ["dataset_uuids"]: "Required" }));
    } else if (bulkSelection.data.length > 0 && formValues["dataset_uuids"].length <= 0) {
      setFormValues((prevValues) => ({ ...prevValues, dataset_uuids: bulkSelection.data.map(obj => obj.uuid) }));
    }

    // ALso Invalid if The Contirbutors section has errors
    if (formErrors.contributors && formErrors.contributors.length>0){
      errors++
      e_messages.push("Please correct the errors in the Contributors section, then try again.");
    }

    setValErrorMessages(errors > 0 ? e_messages : null);
    return errors === 0;
  };

  const handleSubmit = (e) => {
    setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, save: true } }));
    e.preventDefault();
    if (validateForm()) {
      // setIsProcessing(true);
      if (uuid) {
        entity_api_update_entity(uuid, JSON.stringify({
          title: formValues.title,
          description: formValues.description,
          dataset_uuids: entityData.datasets.map(d => d.uuid),    
          contacts: deliniatedContacts.contacts,
        }))
          .then((response) => {
            setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, save: false } }));
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setPageErrors(response);
            }
          })
          .catch((error) => {
            setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, save: false } }));
            props.reportError(error);
            setPageErrors(error);
          });
      } else {
        let newForm = {
        title: formValues.title,
        description: formValues.description,
        dataset_uuids: bulkSelection.uuids,
        group_uuid: formValues.group_uuid,
      };
        let selectedGroup = document.getElementById("group_uuid");
        if (selectedGroup?.value) {
          newForm = { ...newForm, group_uuid: selectedGroup.value };
        }
        if(deliniatedContacts.contacts && deliniatedContacts.contacts.length>0){
          newForm = { ...newForm, contacts: deliniatedContacts.contacts };
        }
        if(deliniatedContacts.contributors && deliniatedContacts.contributors.length>0){
          newForm = { ...newForm, contributors: deliniatedContacts.contributors };
        }

        entity_api_create_entity("collection", JSON.stringify(newForm))
          .then((response) => {
            setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, save: false } }));
            if (response.status === 200) {
              props.onCreated(response.results);
            } else {
              setPageErrors(response.error ? response.error : response);
            }
          })
          .catch((error) => {
            setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, save: false } }));
            setPageErrors(error);
          });
      }
    } else {
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, publish: true } }));
    console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
    ingest_api_publish_collection(uuid)
      .then((response) => {
        setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, publish: false } }));
        if (response.status < 300) {
          let fullResponse = response;
          fullResponse.message = "Collection Published Successfully";
          props.onUpdated(fullResponse);
        } else {
          console.debug('%c◉ Publish Error ', 'color:#2158FF', response );
          let error = response.results.error ? response.results.error : response;
          setPageErrors(error);
        }
      })
      .catch((error) => {
        setLoading(prevVals => ({ ...prevVals, button: { ...prevVals.button, publish: false } }));
        console.debug('%c◉ Page error ', 'color:#2158FF', );
        props.reportError(error);
        setPageErrors(error);
      });
  };

  const buttonEngine = () => (
    <Box sx={{ textAlign: "right" }}>
      <LoadingButton
        variant="contained"
        className="m-2"
        onClick={() => navigate("/")}>
        Cancel
      </LoadingButton>
      <LoadingButton
        variant="contained"
        name="save"
        loading={loading.button.save}
        className="m-2"
        onClick={(e) => handleSubmit(e)}
        type="submit">
        Save
      </LoadingButton>
      {permissions.has_admin_priv && uuid && (
        <LoadingButton
          variant="contained"
          name="save"
          loading={loading.button.publish}
          className="m-2"
          onClick={(e) => handlePublish(e)}
          type="submit">
          Publish
        </LoadingButton>
      )}
    </Box>
  );

  if (loading.page || ((!entityData || !formValues) && uuid)) {
    return <LinearProgress />;
  } else {
    return (
      <div className={formErrors}>
        <Grid container className="">
          <FormHeader entityData={uuid ? entityData : ["new", "Collection"]} permissions={permissions} />
        </Grid>
        <form onSubmit={(e) => handleSubmit(e)}>
          <BulkSelector 
            dialogTitle="Associated Dataset IDs"
            dialogSubtitle="Datasets that are associated with this Collection"
            permissions={{ has_write_priv: entityData && (entityData.doi_url || entityData.registered_doi) ? false : true}}
            initialSelectedUUIDs={bulkSelection.uuids}
            initialSourcesData={bulkSelection.data}
            onBulkSelectionChange={handleBulkSelectionChange}
            searchFilters={{
              custom_title: "Search for an Associated Dataset for your Collection",
              custom_subtitle: "Only Datasets may be selected for Collection sources",
              restrictions: { entityType: "dataset" },
            }}
          />
          <CollectionFormFields
            formFields={formFields}
            formValues={formValues}
            formErrors={formErrors}
            permissions={{ has_write_priv: entityData && (entityData.doi_url || entityData.registered_doi) ? false : true}}
            handleInputChange={handleInputChange}
          />
          <ContributorsTable
            contributors={formValues.contributors}
            onContributorsChange={(contributorRows) => handleContributorsChange(contributorRows)}
            permissions={{has_write_priv: entityData && (entityData.doi_url || entityData.registered_doi) ? false : true}}/>
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
              sx={{ borderTopLeftRadius: "4px", borderTopRightRadius: "4px" }}
              disabled={uuid ? true : false}
              value={formValues["group_uuid"] || (JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "")}>
              {memoizedUserGroupSelectMenu}
            </NativeSelect>
          </Box>

          {valErrorMessages && valErrorMessages.length > 0 && (
            <Alert severity="error">
              <AlertTitle>Please Review the following problems:</AlertTitle>
              {valErrorMessages.map((error) => (
                <Typography key={error}>{error}</Typography>
              ))}
            </Alert>
          )}
          {buttonEngine()}
        </form>
        {pageErrors && (
          <Alert variant="filled" severity="error">
            <strong>Error:</strong> {pageErrors.toString()}
          </Alert>
        )}
        <SnackbarFeedback snackbarController={snackbarController} setSnackbarController={setSnackbarController}/>
      </div>
    );
  }
};
