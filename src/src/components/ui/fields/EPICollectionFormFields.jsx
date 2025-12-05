import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from '@mui/material/FormControl';

export const EPICollectionFieldSet = [
  {
    id: "title",
    label: "Title",
    helperText: "The title of the EPICollection",
    required: true,
    type: "text",
  },
  {
    id: "description",
    label: "Description",
    helperText: "A description of the EPICollection",
    required: true,
    type: "text",
    multiline: true,
    rows: 4,
  },
];

export const EPICollectionFormFields = ({
  formValues,
  formErrors,
  permissions,
  handleInputChange
}) => (
  <>
    {EPICollectionFieldSet.map((field, index) => (
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
        sx={{ width: "100%" }}
        value={formValues[field.id] ? formValues[field.id] : ""}
        error={formErrors[field.id] && formErrors[field.id].length > 0 ? true : false}
        onChange={handleInputChange}
        disabled={!permissions?.has_write_priv}
        fullWidth
        multiline={field.multiline || false}
        rows={field.rows || 1}
        className={
          "my-3 " +
          (formErrors[field.id] && formErrors[field.id].length > 0 ? "error" : "")
        }
      />
    ))}
  </>
);
