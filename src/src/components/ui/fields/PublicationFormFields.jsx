import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

export const PublicationFieldSet = [
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
    id: "omap_doi",
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
];

export const PublicationFormFields = ({
  formValues,
  formErrors,
  permissions,
  handleInputChange
}) => (
  <>
    {PublicationFieldSet.map((field, index) => {
      if (["text", "date"].includes(field.type)) {
        return (
          <TextField
            InputLabelProps={{ shrink: true }}
            key={field.id + "_" + index}
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
            onChange={handleInputChange}
            disabled={!permissions.has_write_priv}
            fullWidth={field.type === "date" ? false : true}
            size={field.type === "date" ? "small" : "medium"}
            multiline={field.multiline || false}
            rows={field.rows || 1}
            className={
              "my-3 " +
              (formErrors[field.id] && formErrors[field.id].length > 0 ? "error" : "")
            }
          />
        );
      }
      if (field.type === "radio") {
        return (
          <FormControl
            id={field.id}
            key={field.id + "_" + index}
            component="fieldset"
            variant="standard"
            size="small"
            required={field.required}
            error={formErrors[field.id] && formErrors[field.id].length > 0 ? true : false}
            className="mb-3"
            fullWidth
          >
            <FormLabel component="legend">{field.label}</FormLabel>
            <FormHelperText>
              {formErrors[field.id]
                ? field.helperText + " " + formErrors[field.id]
                : field.helperText}
            </FormHelperText>
            <RadioGroup row aria-labelledby="publication_status" name="publication_status">
              {field.values &&
                field.values.map((val) => (
                  <FormControlLabel
                    key={field.id + "_" + val}
                    value={val}
                    id={field.id + "_" + val}
                    onChange={handleInputChange}
                    disabled={!permissions.has_write_priv}
                    checked={formValues[field.id] === val}
                    control={<Radio />}
                    label={val === "true" ? "Yes" : "No"}
                  />
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
    })}
  </>
);