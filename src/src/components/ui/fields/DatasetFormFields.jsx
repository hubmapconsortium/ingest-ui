import React from "react";
import { 
  Box, 
  FormControl,
  FormControlLabel, 
  FormHelperText, 
  FormLabel, 
  MenuItem, 
  Radio, 
  RadioGroup, 
  Select, 
  TextField, 
  Typography 
} from "@mui/material";

export const DatasetFormFields = ({ formFields, formValues, formErrors, permissions, handleInputChange, errorHighlight }) => {
  return (
    <Box>
      {formFields.map((field) => {
        const error = formErrors && formErrors[field.id];
        const errorStyle = errorHighlight && error ? { borderColor: '#f44336', background: '#fff0f0' } : {};
        if (field.type === "text" || field.type === "textarea") {
          return (
            <TextField
              key={field.id}
              id={field.id}
              name={field.id}
              label={field.label}
              value={formValues[field.id] || ""}
              onChange={handleInputChange}
              error={!!error}
              helperText={error ? error : field.helperText}
              fullWidth
              margin="normal"
              multiline={field.type === "textarea" || field.multiline}
              minRows={field.rows || (field.type === "textarea" ? 4 : undefined)}
              disabled={permissions.has_write_priv === false}
              required={field.required}
              sx={errorStyle}
            />
          );
        }
        if (field.type === "radio") {
          return (
            <FormControl
              key={field.id}
              component="fieldset"
              margin="normal"
              error={!!error}
              required={field.required}
              disabled={permissions.has_write_priv === false}
              fullWidth
              sx={errorStyle}
            >
              <FormLabel component="legend">{field.label}</FormLabel>
              <RadioGroup
                row
                name={field.id}
                // value={formValues[field.id] === true ? "yes" : formValues[field.id] === false ? "no" : formValues[field.id] || ""}
                value={formValues[field.id]}
                onChange={handleInputChange}
              >
                <FormControlLabel value={true} control={<Radio />} label="Yes" />
                <FormControlLabel value={false} control={<Radio />} label="No" />
              </RadioGroup>
              <FormHelperText>{error ? error : field.helperText}</FormHelperText>
            </FormControl>
          );
        }      
        
        if (field.type === "select") {
          if (field.id === "dt_select") {
            let datasetTypes = localStorage.getItem("datasetTypes") ? JSON.parse(localStorage.getItem("datasetTypes")).map(dt => dt.dataset_type) : [];
            let dtvalues =  datasetTypes ? datasetTypes.map(dt => ({ value: dt, label: dt })) : []
            let found = dtvalues.some(item => item.label === formValues[field.id]);
            // console.debug('%c◉  dtvalues', 'color:#00ff7b',found );
            if(!found && formValues[field.id] && formValues[field.id] !== ""){
              field.values.push({label: formValues[field.id], value: formValues[field.id]});
              // console.debug('%c◉  updated field.values', 'color:#00ff7b',field.values );
            }
          }
          let selectedGroup = null;
          if (field.id === "group_uuid" && !field.writeEnabled) {
            selectedGroup = field.values.find(v => v.value === formValues[field.id]);
          }
          return (
            <FormControl
              key={field.id}
              fullWidth
              margin="normal"
              error={!!error}
              required={field.required}
              disabled={permissions.has_write_priv === false}
              sx={errorStyle}>
              <FormLabel>{field.label}</FormLabel>
              {!field.writeEnabled && (
                <Typography variant="body2" color="textSecondary" sx={{ marginBottom: "10px", marginTop: "5px", color: "rgba(0, 0, 0, 0.3)" }}>
                  {selectedGroup ? selectedGroup.label : formValues[field.id]}  
                </Typography>
              )}
              {field.writeEnabled && (
                <Select
                  id={field.id}
                  name={field.id}
                  value={formValues[field.id] || ""}
                  onChange={handleInputChange}
                  inputProps={{
                    name: field.id,
                    id: field.id,
                  }} >
                  {field.values && field.values.map((val, index) => (
                    <MenuItem key={(val.value)+"-i"+index} value={val.value}>{val.label}</MenuItem>
                  ))}
                </Select>
              )}
              <FormHelperText>{error ? error : field.helperText}</FormHelperText>
            </FormControl>
          );
      
        }
        return null;
      }
      )}
    </Box>
  );
};
