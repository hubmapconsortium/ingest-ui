import React, { useEffect, useState  } from "react";
import Select from 'react-select'

import FormControl from '@mui/material/FormControl';
// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useParams } from 'react-router-dom';

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import Tooltip, { tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import HelpTwoToneIcon from '@mui/icons-material/HelpTwoTone';

import { entity_api_get_entity, 
  entity_api_update_entity, 
  entity_api_create_entity,
  entity_api_create_multiple_entities, 
  entity_api_get_entity_ancestor 
} from '../service/entity_api';
import { ingest_api_allowable_edit_states } from '../service/ingest_api';
import { SAMPLE_TYPES, TISSUE_TYPES, ORGAN_TYPES, RUI_ORGAN_TYPES } from "../utils/constants";
import { compiledSelectList } from "../utils/constants";


import {ErrBox, HelpLabelTooltip, TestTable,MetadataBadge} from "../utils/ui_elements";
import { tsToDate, truncateString, parseErrorMessage } from "../utils/string_helper";
import { TissueForm } from "../utils/form_schema";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faUserShield,
  faTimes,
  faSearch, faPaperclip, faAngleDown
} from "@fortawesome/free-solid-svg-icons";

import RenderSearchComponent from "./SearchComponent";


const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props}  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 220,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
  },
}));





export const RenderSample = (props) => {
//console.debug("RenderSearchComponent", props);
  var authSet = JSON.parse(localStorage.getItem("info"));
  var [entity_data, setEntity] = useState(true);
  var [user_permissions, setUserPermissions] = useState([]);
  var [form_schema, setFormSchema] = useState();
  var [isLoading, setLoading] = useState(true);
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  let { uuid } = useParams();

  useEffect(() => {
    fetchData(uuid);
  }, []);


  // useEffect(() => {
  //   console.debug("RenderSearchComponent", entity_data, user_permissions, form_schema ); 
  //   if(entity_data.length >1 &&
  //      user_permissions.length >1 &&
  //      form_schema.length >1){
  //     setLoading(false);
  //   }
    

  function passError(status, message) {
   //console.debug("Error", status, message);
    setLoading(false);
    setErrorHandler({
        status: status,
        message:message,
        isError: true 
      })
    }



    function getFormSchema(params) {
      // Maybe good place to pluck structure based on privs
      var schema = TissueForm(params);
      // console.debug("getFormSchema", schema);
      return schema;
    }

  function fetchData(uuid){
    entity_api_get_entity(uuid, authSet.groups_token)
      .then((response) => {
          if (response.status === 200) {
            setEntity(response.results);
            console.debug("entity_data", response.results);
            // check to see if user can edit
            ingest_api_allowable_edit_states(uuid, authSet.groups_token)
              .then((resp) => {
              //console.debug("ingest_api_allowable_edit_states", resp);
                if (resp.status === 200) {
                  setUserPermissions(resp.results);
                  getFormSchema("all")
                  .then((resp) => {
                    // console.debug("getFormSchema", resp);
                    setFormSchema(resp);
                    setLoading(false);
                  })
                  .catch((err) => {
                    console.debug("getFormSchema ERROR", err);
                    // passError(err );
                  })
                  
                  // setLoading(false);
                //console.debug("userPermissions", user_permissions);
                }else{
                  passError(response.status, response.results.error );
                }      
              });
          }else{
            passError(response.status, response.results.error );
          }
        })
        .catch((error) => {
          passError(error.status, error.results.error );
        });

  }
  
    if (!isLoading && errorHandler.isError === true){
      return (
        <ErrBox err={errorHandler} />
      );
    }else if (isLoading) {
        return (
          <div className="card-body ">
            <div className="loader">Loading...</div>
          </div>
        );
    }else{
      return (
            <RenderForm 
              entity={entity_data} 
              permissions={user_permissions}
              schema={form_schema}/>
      )
    }
  }
  
  
  


function RenderForm(props) {
  var [tissueType, setTissueType] = useState([]);
  var  [open, setOpen] = useState(false)

  let entity = props.entity;
  let permissions = props.permissions;
  let readOnly = !permissions.has_write_priv;
  let schema = props.schema;
  // let InputProps = {className: 'Mui-disabled'};
  var [tissueOptions, setTissueOptions] = useState([]);
  // var [InputProps, setInputProps] = useState({"priv":"disabled"});
  const [formValues, setFormValues] = useState()
  // console.debug("schema", schema);
  // console.debug("RenderForm", entity, permissions);



  const handleClose = () => {
    setOpen(false);
  };
  const handleClickOpen = () => {
    setOpen(true);
  };



  useEffect(() => {
    setTissueOptions(TISSUE_TYPES[entity.entity_type]);
    console.debug("TissueOptions", TISSUE_TYPES[entity.entity_type]);
    setTissueType(compiledSelectList(TISSUE_TYPES[entity.entity_type]));
    
  }, [entity]);
  

  // function readOnly() {
  //   if(permissions.has_write_priv === true){
  //     return "disabled";
  //   }else{
  //     return "";
  //   }
  // }


  //console.debug("entity.entity_type", entity.entity_type, tissueOptions);

  function handleChange(e) {
    console.debug("handleChange", e.target);
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
    console.debug("formValues", formValues);
  
  }

  function SourceSelection(e) {
    console.debug("SourceSelection", e.target);
  }


    return (
     <div>
       <Dialog open={true} onClose={handleClose}>
          <DialogContent >
            <RenderSearchComponent 
              intent={() => SourceSelection}
              custom_title="Source Selection" 
              entity_type="donors"  />
          </DialogContent>
      </Dialog>


        <div className=" text-center"><h4>Sample Information</h4></div>
          <div
            className="alert alert-danger col-sm-10 offset-sm-1"
            role="alert"
          >
            <FontAwesomeIcon icon={faUserShield} /> - Do not provide any
              Protected Health Information. This includes the{" "}
            <span
              style={{ cursor: "pointer" }}
              className="text-primary"
              >
              18 identifiers specified by HIPAA
              </span>
        </div>
      

          <div className="row">
            <div className="col-sm-5 offset-sm-1 portal-label">
                HuBMAP ID: {entity.hubmap_id}
            </div>
            <div className="col-sm-5 text-right portal-label">
            Submission ID: {entity.submission_id}
            </div>
              <div className="col-sm-5 offset-sm-1 portal-label">
                Entered by: {entity.created_by_user_email}
            </div>
            <div className="col-sm-5 text-right portal-label">
                Entry Date: {tsToDate(entity.created_timestamp)}
            </div>
          </div>

          <Box
            component="form"
            id="TissueForm"
            noValidate
            autoComplete="off">

          <div className="form-group  my-4">
            <div className="row mb-3">
              <FormControl>
              <HelpLabelTooltip info={schema["source_id"]} />
                <TextField
                    hiddenLabel
                    disabled={readOnly}
                    id="source_id"
                    name="source_id"
                    size="small"
                    variant="filled"
                    required
                    defaultValue={entity.source_id} 
                  />    
              </FormControl>
            </div>
            <div className="col-8"> <TestTable /> </div>

          </div>

          {entity.specimen_type && (
          <div className="my-3 form-group">
            <div className="row">
            <FormControl>
              <HelpLabelTooltip info={schema["specimen_type"]} />
              <Select    
                  disabled={readOnly}     
                  placeholder={"------"}
                  name="specimen_type"
                  options={tissueType}
                  value={entity.specimen_type}
                  onChange={handleChange}
                  >
              </Select>
            </FormControl>
            </div>
          </div>
          )}

          {["organ", "biopsy", "blood"].includes(entity.specimen_type) && (
          <div className="my-3 form-group">
            <div className="row" >
              <FormControl>
              <HelpLabelTooltip info={schema["visit"]} />
            
                <TextField
                  disabled={readOnly}
                  name="visit"
                  className = "filledInputfield"
                  fullWidth
                  required
                  defaultValue={entity.visit}
                  hiddenLabel
                  size="small"
                  variant="filled"
                  onChange={handleChange}
                  />
              </FormControl>
            </div>
          </div>
          )}

          <div className="my-3 form-group" >
            <div className="row" >
              <FormControl>
              <HelpLabelTooltip info={schema["protocol_url"]} />
            
                <TextField
                  disabled={readOnly}
                  name="protocol_url"
                  className = "filledInputfield"
                  fullWidth
                  required
                  defaultValue={entity.protocol_url}
                  hiddenLabel
                  size="small"
                  variant="filled"  
                  onChange={handleChange}
                 />
              </FormControl>
            </div>
          </div>

          <div className="my-3 form-group" >
            <div className="row" >
              <FormControl>
              <HelpLabelTooltip info={schema["lab_tissue_sample_id"]} />
            
                <TextField
                  disabled={readOnly}
                  name="lab_tissue_sample_id"
                  className = "filledInputfield"
                  fullWidth
                  required
                  defaultValue={entity.lab_tissue_sample_id}
                  hiddenLabel
                  size="small"
                  variant="filled"
                  onChange={handleChange}
                  />
              </FormControl>
            </div>
          </div>

          <div className="my-3 form-group" >
            <div className="row" >
              <FormControl>
              <HelpLabelTooltip info={schema["description"]} />
            
                <TextField
                  disabled={readOnly}
                  name="description"
                  className = "filledInputfield"
                  fullWidth
                  id="outlined-multiline-static"
                  hiddenLabel
                  size="small"
                  variant="filled"
                  multiline
                  rows={4}
                  defaultValue={entity.description}
                  onChange={handleChange}
                />
              </FormControl>
            </div>
          </div>

          {entity.sample_metadata_statuse && (
            <div className="col-sm-9 my-auto">
              {MetadataBadge({status:entity.sample_metadata_status})}
            </div>
          )}



           </Box>

        </div>
    );
  }
