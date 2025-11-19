import React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

export const DonorFieldSet = [
  {
    id: "lab_donor_id",
    label: "Lab's Donor Non-PHI ID",
    helperText: "A non-PHI id used by the lab when referring to the donor",
    required: false,
    type: "text",
  },
  {
    id: "label",
    label: "Deidentified Name",
    helperText:
      "A deidentified name used by the lab to identify the donor (e.g. HuBMAP Donor 1)",
    required: true,
    type: "text",
  },
  {
    id: "protocol_url",
    label: "Case Selection Protocol",
    helperText:
      "The protocol used when choosing and acquiring the donor. This can be supplied a DOI from http://protocols.io",
    required: true,
    type: "text",
  },
  {
    id: "description",
    label: "Description",
    helperText: "Free text field to enter a description of the donor",
    required: false,
    type: "text",
    multiline: true,
    rows: 4,
  },
];

export const DonorFormFields = ({
  formValues,
  formErrors,
  formValErrors,
  permissions,
  handleInputChange,
}) => {
  console.debug('%c◉ formValErrors ', 'color:#00ff7b', formValErrors);
  return (
    <Box>
      {DonorFieldSet.map((field, index) => {
        const error = formErrors && formErrors[field.id];
        if(error){
          console.debug('%c◉ field error ', 'color:#f44336', field.id, error, formErrors[field.id]);
        }
        const errorStyle = error ? { borderColor: '#f44336', background: '#fff0f0' } : {};
        if (field.type === "text" || field.type === "textarea") {
          return (
            <TextField
              disabled={!permissions?.has_write_priv}
              error={!!error}
              fullWidth
              id={field.id}
              key={field.id + "_" + index}
              label={field.label}
              // minRows={field.rows || (field.type === "textarea" ? 4 : undefined)}
              multiline={field.multiline || false}
              name={field.id}
              onChange={handleInputChange}
              required={field.required}
              rows={field.rows || 1}
              // sx={errorStyle}
              value={formValues[field.id] ? formValues[field.id] : ""}
              helperText={
                formErrors[field.id] && formErrors[field.id].length > 0
                  ? (field.helperText +" " + formErrors[field.id])
                  : field.helperText
              }
              className={
                "my-3 fieldInput " +
                (formErrors[field.id] && formErrors[field.id].length > 0 ? "error fieldError" : "noerr")
              }
            />
          );
        }

        return null;
      }
      )}
    </Box>
  )
};
