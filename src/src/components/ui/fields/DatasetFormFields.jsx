import React from "react";
import { TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio, Select, MenuItem, FormHelperText, Box, Typography } from "@mui/material";

export const DatasetFormFields = ({ formFields, formValues, formErrors, permissions, handleInputChange }) => {
  
  return (
    <Box>
      {formFields.map((field) => {
        if (field.type === "text" || field.type === "textarea") {
          return (
            <TextField
              key={field.id}
              id={field.id}
              name={field.id}
              label={field.label}
              value={formValues[field.id] || ""}
              onChange={handleInputChange}
              error={!!formErrors[field.id]}
              helperText={formErrors[field.id] || field.helperText}
              fullWidth
              margin="normal"
              multiline={field.type === "textarea" || field.multiline}
              minRows={field.rows || (field.type === "textarea" ? 4 : undefined)}
              disabled={permissions.has_write_priv === false}
              required={field.required}
            />
          );
        }
        if (field.type === "radio") {
          return (
            <FormControl
              key={field.id}
              component="fieldset"
              margin="normal"
              error={!!formErrors[field.id]}
              required={field.required}
              disabled={permissions.has_write_priv === false}
              fullWidth
            >
              <FormLabel component="legend">{field.label}</FormLabel>
              <RadioGroup
                row
                name={field.id}
                value={formValues[field.id] === true ? "yes" : formValues[field.id] === false ? "no" : formValues[field.id] || ""}
                onChange={handleInputChange}
              >
                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="no" control={<Radio />} label="No" />
              </RadioGroup>
              <FormHelperText>{formErrors[field.id] || field.helperText}</FormHelperText>
            </FormControl>
          );
        }
        if (field.id === "dt_select") {
          let datasetTypes = localStorage.getItem("datasetTypes") ? JSON.parse(localStorage.getItem("datasetTypes")).map(dt => dt.dataset_type) : [];
          let dtvalues =  datasetTypes ? datasetTypes.map(dt => ({ value: dt.dataset_type, label: dt.dataset_type })) : []
          console.debug('%c◉  dtvalues', 'color:#00ff7b',dtvalues );
          if(!field.values.includes(formValues[field.id])){
            field.values.push(formValues[field.id]);
          }
          console.debug('%c◉ providedType ', 'color:#00ff7b', field.values.includes(formValues[field.id]),formValues[field.id]);
          return (
            <FormControl
              key={field.id}
              fullWidth
              margin="normal"
              error={!!formErrors[field.id]}
              required={field.required}
              disabled={permissions.has_write_priv === false}
            >
              <FormLabel>{field.label}</FormLabel>
              {!field.writeEnabled && (
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1, mt: 0.5 }}>
                  {formValues[field.id]}
                </Typography>
              )}
              {field.writeEnabled && (
                <Select
                  id={field.id}
                  name={field.id}
                  value={formValues[field.id] || ""}
                  onChange={handleInputChange}
                  displayEmpty>
                  {!field.values.includes(formValues[field.id]) && (
                    <MenuItem key={formValues[field.id]} value={formValues[field.id]} selected>{formValues[field.id]}</MenuItem>
                  )}
                  {field.values && field.values.map((val) => (
                    <MenuItem key={val.value} value={val.value}>{val.label}</MenuItem>
                  ))}
                </Select>
              )}
              <FormHelperText>{formErrors[field.id] || field.helperText}</FormHelperText>
            </FormControl>
          );
        }
        return null;
      })}
    </Box>
  );
};
