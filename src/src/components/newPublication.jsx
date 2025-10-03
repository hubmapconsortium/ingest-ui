import React, { useEffect, useState } from "react";
import LoadingButton from "@mui/lab/LoadingButton";
import { Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import Grid from '@mui/material/Grid';
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import NativeSelect from '@mui/material/NativeSelect';
import { useNavigate, useParams } from "react-router-dom";
import {
  entity_api_get_entity,
  entity_api_get_globus_url,
  entity_api_update_entity
} from "../service/entity_api";
import {
  ingest_api_allowable_edit_states,
  ingest_api_create_publication,
  ingest_api_dataset_submit,
  ingest_api_notify_slack
} from "../service/ingest_api";
import { humanize } from "../utils/string_helper";
import {
  validateProtocolIODOI,
  validateRequired,
  validateSingleProtocolIODOI
} from "../utils/validators";
import { BulkSelector } from "./ui/bulkSelector";
import { FormHeader, UserGroupSelectMenu } from "./ui/formParts";
import { PublicationFormFields } from "./ui/fields/PublicationFormFields";

export const PublicationForm = (props) => {
  let navigate = useNavigate();
  let [entityData, setEntityData] = useState();
  let [isLoading, setLoading] = useState(true);
  let [isProcessing, setIsProcessing] = useState(false);
  let [valErrorMessages, setValErrorMessages] = useState([]);
  let [pageErrors, setPageErrors] = useState(null);
  let [globusPath, setGlobusPath] = useState(null);

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
  var [formValues, setFormValues] = useState({
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
  let [formErrors, setFormErrors] = useState({ ...formValues }); // Null out the unused vs ""

  // Only track selected UUIDs from BulkSelector
  let [selectedBulkUUIDs, setSelectedBulkUUIDs] = useState([]);
  let [selectedBulkData, setSelectedBulkData] = useState([]);

  const formFields = React.useMemo(() => [
    {
      id: "title",
      label: "Title",
      helperText: "The title of the publication",
      required: true,
      type: "text",
    }, {
      id: "publication_venue",
      label: "Publication Venue",
      helperText: "The venue of the publication, journal, conference, preprint server, etc...",
      required: true,
      type: "text",
    }, {
      id: "publication_date",
      label: "Publication Date",
      helperText: "The date of publication",
      required: true,
      type: "date",
    }, {
      id: "publication_status",
      label: "Publication Status ",
      helperText: "Has this Publication been Published?",
      required: true,
      type: "radio",
      values: ["true", "false"]
    }, {
      id: "publication_url",
      label: "Publication URL",
      helperText: "The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]",
      required: true,
      type: "text",
    }, {
      id: "publication_doi",
      label: "Publication DOI",
      helperText: "The DOI of the publication. (##.####/[alpha-numeric-string])",
      required: false,
      type: "text",
    }, {
      id: "OMAP_doi",
      label: "OMAP DOI",
      helperText: "A DOI pointing to an Organ Mapping Antibody Panel relevant to this publication",
      required: false,
      type: "text",
    }, {
      id: "issue",
      label: "Issue",
      helperText: "The issue number of the journal that it was published in.",
      required: false,
      type: "text",
    }, {
      id: "volume",
      label: "Volume",
      helperText: "The volume number of a journal that it was published in.",
      required: false,
      type: "text",
    }, {
      id: "pages_or_article_num",
      label: "Pages Or Article Number",
      helperText: 'The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.',
      required: false,
      type: "text",
    }, {
      id: "description",
      label: "Abstract",
      helperText: "Free text description of the publication",
      required: true,
      type: "text",
      multiline: true,
      rows: 4,
    }
  ], []);

  const { uuid } = useParams();

  const memoizedUserGroupSelectMenu = React.useMemo(
    () => <UserGroupSelectMenu />,
    []
  );

  useEffect(() => {
    if (uuid && uuid !== "") {
      entity_api_get_entity(uuid)
        .then((response) => {
          if (response.status === 200) {
            const entityType = response.results.entity_type;
            if (entityType !== "Publication") {
              window.location.replace(
                `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
              );
            } else {
              const entityData = response.results;
              setEntityData(entityData);
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
              entity_api_get_globus_url(entityData.uuid)
                .then((res) => {
                  console.debug('%c◉ entity_api_get_globus_url:  ', 'color:#E7EEFF;background: #9359FF;padding:200',res);
                  if(res && res.status === 200){
                    setGlobusPath(res.results);
                  }
                })
              setSelectedBulkUUIDs(entityData.direct_ancestors.map(obj => obj.uuid));
              setSelectedBulkData(entityData.direct_ancestors);

              ingest_api_allowable_edit_states(uuid)
                .then((response) => {
                  if (entityData.data_access_level === "public") {
                    setPermissions({
                      has_write_priv: false,
                    });
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
      setPermissions({
        has_write_priv: true,
      });
    }
    setLoading(false);
  }, [uuid]);

  const handleInputChange = React.useCallback((e) => {
    const { id, value } = e.target;
    if (e.target.type === "radio") {
      setFormValues((prevValues) => ({
        ...prevValues,
        publication_status: value,
      }));
    } else {
      setFormValues(prev => {
        if (prev[id] === value) return prev;
        return { ...prev, [id]: value };
      });
    }
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
    } else {
      setFormErrors((prevValues) => ({
        ...prevValues,
        'protocol_url': ""
      }));
      return 0
    }
  }

  const validateForm = () => {
    setValErrorMessages(null);
    let errors = 0;
    let e_messages = []

    let requiredFields = ["title", "publication_venue", "publication_date", "publication_status", "publication_url", "description"];

    for (let field of requiredFields) {
      if (!validateRequired(formValues[field])) {
        let fieldName = formFields.find(f => f.id === field)?.label || humanize(field);
        if (field !== "direct_ancestor_uuids") {
          e_messages.push(fieldName + " is a required field");
        }
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
    // Formatting Validation
    errors += validateDOI(formValues['protocol_url']);
    setValErrorMessages(errors > 0 ? e_messages : null);
    return errors === 0;
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      setIsProcessing(true);
      let selectedUUIDs = selectedBulkData.map((obj) => obj.uuid);
      let cleanForm = {
        title: formValues.title,
        publication_venue: formValues.publication_venue,
        publication_date: formValues.publication_date,
        publication_status: formValues.publication_status === "true" ? true : false,
        publication_url: formValues.publication_url,
        publication_doi: formValues.publication_doi,
        omap_doi: formValues.omap_doi,
        ...((formValues.issue) && { issue: parseInt(formValues.issue) }),
        ...((formValues.volume) && { volume: parseInt(formValues.volume) }),
        pages_or_article_num: formValues.pages_or_article_num,
        description: formValues.description,
        direct_ancestor_uuids: selectedUUIDs,
        contains_human_genetic_sequences: false // Holdover From Dataset Days
      }

      if (uuid) { // We're in Edit Mode
        let target = e.target.name;
        setButtonLoading((prev) => ({
          ...prev,
          [target]: true,
        }));
        if (e.target.name === "process") { // Process
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
        } else if (e.target.name === "submit") { // Submit
          entity_api_update_entity(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if (response.status < 300) {
                var ingestURL = process.env.REACT_APP_URL + "/publication/" + uuid
                var slackMessage = { "message": "Publication has been submitted (" + ingestURL + ")" }
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
        } else if (e.target.name === "save") { // Save
          entity_api_update_entity(uuid, JSON.stringify(cleanForm))
            .then((response) => {
              if (response.status === 200) {
                props.onUpdated(response.results);
              } else {
                wrapUp(response)
              }
            })
            .catch((error) => {
              wrapUp(error)
            });
        }
      } else { // We're in Create mode
        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");
        if (selectedGroup?.value) {
          cleanForm = { ...cleanForm, group_uuid: selectedGroup.value };
        }
        ingest_api_create_publication(JSON.stringify(cleanForm))
          .then((response) => {
            if (response.status === 200) {
              entity_api_get_globus_url(response.results.uuid)
                .then((res) => {
                  console.debug('%c◉ entity_api_get_globus_url:  ', 'color:#E7EEFF;background: #9359FF;padding:200',res);
                  let fullResult = { ...response.results, globus_path: res.results };
                  props.onCreated(fullResult);
                })
            } else {
              wrapUp(response.error ? response.error : response)
            }
          })
          .catch((error) => {
            wrapUp(error)
            setPageErrors(error);
          });
      }
    } else {
      setButtonLoading(() => ({
        process: false,
        save: false,
        submit: false,
      }));
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
    return (
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
            className="m-2">
            Submit
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && entityData.status !== "published" && (
          <LoadingButton
            loading={buttonLoading['save'] === true ? true : false}
            name="save"
            onClick={(e) => handleSubmit(e)}
            variant="contained"
            className="m-2">
            Save
          </LoadingButton>
        )}
      </Box>
    );
  }

  const memoizedFormFields = React.useMemo(
    () => (
      <PublicationFormFields
        formFields={formFields}
        formValues={formValues}
        formErrors={formErrors}
        permissions={permissions}
        handleInputChange={handleInputChange}
      />
    ),
    [formFields, formValues, formErrors, permissions, handleInputChange]
  );

  // MAIN RENDER
  if (isLoading || ((!entityData || !formValues) && uuid)) {
    return (<LinearProgress />);
  } else {
    return (
      <div className={formErrors}>
        <Grid container className=''>
          <FormHeader entityData={uuid ? entityData : ["new","Publication"]} permissions={permissions} globusURL={globusPath?globusPath:null}/>
        </Grid>
        <form onSubmit={(e) => handleSubmit(e)}>
          <BulkSelector
            dialogTitle="Associated Dataset IDs"
            dialogSubtitle="Datasets that are associated with this Publication"
            permissions={permissions}
            initialSelectedUUIDs={selectedBulkUUIDs}
            initialSourcesData={selectedBulkData}
            onBulkSelectionChange={handleBulkSelectionChange}
            searchFilters={{
              custom_title: "Search for a Source ID for your Publication",
              custom_subtitle: "Only Datasets may be selected for Publication sources",
              restrictions: { 
                entityType: "dataset"
              },
            }}
          />
          <PublicationFormFields
            formFields={formFields}
            formValues={formValues}
            formErrors={formErrors}
            permissions={permissions}
            handleInputChange={handleInputChange}
          />
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
                {memoizedUserGroupSelectMenu}
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
      </div>
    );
  }
};
