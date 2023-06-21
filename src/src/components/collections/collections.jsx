
import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';

import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';

import {SourcePicker} from "../ui/SourcePicker";

export function CollectionForm (props){
  const [formValues, setFormValues] = useState({
    title: '',
    description: '',
    file: null,
    source_uuid_list: [],
  });

  const handleInputChange = (event) => {
    const { name, value, type } = event.target;
    console.debug("handleInputChange", name, value, type);
    if (type === 'file') {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: event.target.files[0],
      }));
    } else {
      setFormValues((prevValues) => ({
        ...prevValues,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Do something with the form values
    console.log(formValues);
  };

  return (
    <Box
      component="form"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        // maxWidth: '400 px',
        margin: '0 0',
      }}
      onSubmit={handleSubmit}
    >
      <SourcePicker 
        source_uuid_list={formValues.source_uuid_list}
        formErrors={{
            title:"",
            description:"",
            dataset_uuids:"",
            contributors:"",
        }}
        />
      <FormControl>
        <TextField
          label="Title"
          name="title"
          id="title"
          error={false}
          disabled={false}
          helperText={"Test"}
          variant="standard"
          onChange={handleInputChange}
          value={formValues.title}
        />
      </FormControl>
      <FormControl>
        <TextField
          label="Description"
          name="description"
          id="description"
          error={false}
          disabled={false}
          helperText={"Test"}
          variant="standard"
          onChange={handleInputChange}
          value={formValues.description}
        />
      </FormControl>

      <label htmlFor="file-input">
        <Button variant="contained" component="span">
          Upload File
        </Button>
      </label>
      <Button variant="contained" type="submit">
        Submit
      </Button>
    </Box>
  );
}



