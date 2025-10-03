import React from "react";
import TextField from "@mui/material/TextField";
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';

export const PublicationFormFields = ({
  formFields,
  formValues,
  formErrors,
  permissions,
  handleInputChange
}) => (
  <>
    {formFields.map((field, index) => {
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