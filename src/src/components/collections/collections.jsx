import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import TextField from '@mui/material/TextField';

import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';

export function CollectionForm (props){

  var [formData, setFormData] = useState("")
  const [title, setTitle] = useState(props.editingCollection.title);
  const [description, setDescription] = useState(props.editingCollection.description);
  var [editingCollection, setEditingCollection] = useState(props.editingCollection)
  // var editingCollection = useState(props.editingCollection)
  var badge_class = "badge-purple";


  useEffect(() => {
    console.debug("useEffect",props,props.editingCollection);
    setFormData(props.editingCollection);

  }, [props]);



  const onChange = (name,value) => {
    console.debug("onChange",name,value);
  //   var newVal=value;
  //   console.debug(newVal);
  //   setEditingCollection({
  //     ...editingCollection,
  //    name:value // becomes "somename: some value"
  //  })
  }

  
  return (
    <form className="expanded-form">
          <div className="row">
            <div className="col-md-6">
              <h3>
                {props.newForm}
              {props.newForm && (
                <>
                <span
                  className={"badge " + badge_class}
                  style={{ cursor: "pointer" }}
                />
                <span className="mx-1">
                  Registering a Collection 
                </span>
                </>
              )}
              {!props.newForm && (
                <>
                <span
                  className={"badge " + badge_class}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    this.showErrorMsgModal(
                      editingCollection.pipeline_message
                    )
                  }>
                  {editingCollection.status}
                </span>
                <span className="mx-1">
                  {" "}
                  HuBMAP Collection ID {editingCollection.hubmap_id}{" "}
                </span>
                </>
              )}

              </h3>
              <p>
                <strong>
                  <big>
                    {!props.newForm &&
                      formData["title"]}
                  </big>
                </strong>
              </p>


            </div>
            <div className="col-md-6">
              {/* {editingCollection &&
                editingCollection.upload &&
                editingCollection.upload.uuid && (
                  // useful space for collection navigation things?
                  // <Box sx={{ display: "flex" }}>
                  //   <Box sx={{ width: "100%" }}>
                  //   </Box>
                  // </Box>
                )} */}
            </div>
          </div>


    <div className="card-body ">

      {/* Title  */}
      <div className="form-gropup ">
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
              //className={"form-control " +this.errorClass(formErrors.issue) +" "}
              onChange={ (e) => { 
                setFormData({
                 "title":e.value 
                });
              }}
              value={title}
            />
            {/* {validationStatus.issue.length >0 && ( 
              <FormHelperText className="component-error-text"> {validationStatus.issue}</FormHelperText>
            )} */}
        </FormControl>
      </div>

      {/* Description  */}
      <div className="form-gropup ">
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
            //className={"form-control " +this.errorClass(formErrors.issue) +" "}
            onChange={console.debug("onChange")}
            onChange={ (e) => { 
              setTitle(e.target.value);
            }}
            value={description}
          />
          {/* {validationStatus.issue.length >0 && ( 
            <FormHelperText className="component-error-text"> {validationStatus.issue}</FormHelperText>
          )} */}
        </FormControl>
      </div>


    </div>
  </form>
  )
  
}
  

