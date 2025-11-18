import React from "react";
import TextField from "@mui/material/TextField";

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
  permissions,
  handleInputChange,
  uuid
}) => (
  <>
    {DonorFieldSet.map((field, index) => (
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
