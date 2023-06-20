import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';

import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

export function CollectionForm (props){

  useEffect(() => {
    console.debug("useEffect",props);
  }, []);

  
  return (
    <div className="card-body ">

      {/* 
      description: Text field (large text area)
      title: Text field
      contributors: Import contact/contributor information via a standard contributors.tsv
      contacts: Import contact/contributor information via a standard contributors.tsv
      */}


      {/* Title  */}

      <div className="form-gropup mb-4">
      <FormControl>
          <TextField
            label="Title"
            name="title"
            id="title"
            error={false}
            disabled={false}
            helperText={"Test"}
            variant="standard"
            className="form-group"
            //className={"form-control " +this.errorClass(this.state.formErrors.issue) +" "}
            onChange={console.debug("onChange")}
            value={"Title"}
          />
          {/* {this.state.validationStatus.issue.length >0 && ( 
            <FormHelperText className="component-error-text"> {this.state.validationStatus.issue}</FormHelperText>
          )} */}
      </FormControl>
      </div>

      {/* Description  */}

      <div className="form-gropup mb-4">
        <FormControl>
          <TextField
            label="Description"
            name="description" 
            id="description"
            error={false}
            disabled={false}
            helperText={"Test"}
            variant="standard"
            className="form-group"
            multiline
            rows={4}
            //className={"form-control " +this.errorClass(this.state.formErrors.issue) +" "}
            onChange={console.debug("onChange")}
            value={"Description"}
          />
          {/* {this.state.validationStatus.issue.length >0 && ( 
            <FormHelperText className="component-error-text"> {this.state.validationStatus.issue}</FormHelperText>
          )} */}
        </FormControl>
      </div>


    </div>
  )
  
}
  

