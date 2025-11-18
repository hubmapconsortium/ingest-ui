import React from "react";
import TextField from "@mui/material/TextField";

export const DonorFormFields = ({
  formFields,
  formValues,
  formErrors,
  permissions,
  handleInputChange,
  uuid
}) => (
  <>
    {formFields.map((field, index) => (
      <TextField
        InputLabelProps={{ shrink: !!(uuid || formValues?.[field.id]) }}
        key={field.id + "_" + index}
        required={field.required}
        type={field.type}
        id={field.id}
        label={field.label}
        helperText={
          formErrors[field.id] && formErrors[field.id].length > 0
            ? formErrors[field.id]
            : field.helperText
        }
        sx={{ width: "100%" }}
        value={formValues[field.id] ? formValues[field.id] : ""}
        error={formErrors[field.id] && formErrors[field.id].length > 0}
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
