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
import { FormHeader, UserGroupSelectMenu } from "./ui/formParts";
import { CollectionFormFields } from "./ui/fields/CollectionFormFields";
import { entity_api_get_entity, entity_api_create_entity, entity_api_update_entity } from "../service/entity_api";
import { ingest_api_allowable_edit_states } from "../service/ingest_api";
import { validateRequired } from "../utils/validators";

export const CollectionForm = (props) => {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const [entityData, setEntityData] = useState();
  const [isLoading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [valErrorMessages, setValErrorMessages] = useState([]);
  const [pageErrors, setPageErrors] = useState(null);
  const [permissions, setPermissions] = useState({ has_write_priv: true });
  // Removed unused buttonLoading
  const [formValues, setFormValues] = useState({
    title: "",
    description: "",
    dataset_uuids: [],
    contributors: [],
    group_uuid: "",
  });
  const [formErrors, setFormErrors] = useState({ ...formValues });
  const [selectedBulkUUIDs, setSelectedBulkUUIDs] = useState([]);
  const [selectedBulkData, setSelectedBulkData] = useState([]);

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
    // Add contributors field if needed
  ], []);

  const memoizedUserGroupSelectMenu = React.useMemo(
    () => <UserGroupSelectMenu />, []
  );

  useEffect(() => {
    if (uuid && uuid !== "") {
      entity_api_get_entity(uuid)
        .then((response) => {
          if (response.status === 200) {
            const entityType = response.results.entity_type;
            if (entityType !== "Collection") {
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            } else {
              const entityData = response.results;
              setEntityData(entityData);
              setFormValues({
                title: entityData.title || "",
                description: entityData.description || "",
                dataset_uuids: entityData.dataset_uuids || [],
                contributors: entityData.contributors || [],
                group_uuid: entityData.group_uuid || "",
              });
              setSelectedBulkUUIDs(entityData.dataset_uuids || []);
              setSelectedBulkData(entityData.associations || []);
              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
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
      setPermissions({ has_write_priv: true });
    }
    setLoading(false);
  }, [uuid]);

  const handleInputChange = useCallback((e) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));
  }, []);

  // Callback for BulkSelector
  const handleBulkSelectionChange = (uuids, hids, string, data) => {
    setFormValues((prev) => ({ ...prev, dataset_uuids: uuids }));
    setSelectedBulkUUIDs(uuids);
    setSelectedBulkData(data);
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
    if (!selectedBulkData || selectedBulkData.length <= 0) {
      e_messages.push("Please select at least one Associated Dataset");
      errors++;
      setFormErrors((prevValues) => ({ ...prevValues, ["dataset_uuids"]: "Required" }));
    } else if (selectedBulkData.length > 0 && formValues["dataset_uuids"].length <= 0) {
      setFormValues((prevValues) => ({ ...prevValues, dataset_uuids: selectedBulkData.map(obj => obj.uuid) }));
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
        title: formValues.title,
        description: formValues.description,
        dataset_uuids: selectedUUIDs,
        contributors: formValues.contributors,
        group_uuid: formValues.group_uuid,
      };
      if (uuid) {
        entity_api_update_entity(uuid, JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status < 300) {
              props.onUpdated(response.results);
            } else {
              setPageErrors(response);
            }
          })
          .catch((error) => {
            props.reportError(error);
            setPageErrors(error);
          });
      } else {
        let selectedGroup = document.getElementById("group_uuid");
        if (selectedGroup?.value) {
          cleanForm = { ...cleanForm, group_uuid: selectedGroup.value };
        }
        entity_api_create_entity("collection", JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status === 200) {
              props.onCreated(response.results);
            } else {
              setPageErrors(response.error ? response.error : response);
            }
          })
          .catch((error) => {
            setPageErrors(error);
          });
      }
    } else {
    }
  };

  const buttonEngine = () => (
    <Box sx={{ textAlign: "right" }}>
      <LoadingButton
        variant="contained"
        className="m-2"
        onClick={() => navigate("/")}
      >
        Cancel
      </LoadingButton>
      <LoadingButton
        variant="contained"
        name="save"
        loading={isProcessing}
        className="m-2"
        onClick={handleSubmit}
        type="submit"
      >
        Save
      </LoadingButton>
    </Box>
  );

  // Removed unused memoizedFormFields

  if (isLoading || ((!entityData || !formValues) && uuid)) {
    return <LinearProgress />;
  } else {
    return (
      <div className={formErrors}>
        <Grid container className="">
          <FormHeader entityData={uuid ? entityData : ["new", "Collection"]} permissions={permissions} />
        </Grid>
        <form onSubmit={handleSubmit}>
          <BulkSelector
            dialogTitle="Associated Dataset IDs"
            dialogSubtitle="Datasets that are associated with this Collection"
            permissions={permissions}
            initialSelectedUUIDs={selectedBulkUUIDs}
            initialSourcesData={selectedBulkData}
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
            permissions={permissions}
            handleInputChange={handleInputChange}
          />
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
              value={formValues["group_uuid"] || (JSON.parse(localStorage.getItem("userGroups"))[0]?.uuid || "")}
            >
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
            <strong>Error:</strong> {JSON.stringify(pageErrors)}
          </Alert>
        )}
      </div>
    );
  }
};
