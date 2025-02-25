import React, { useEffect, useState  } from "react";
import { useParams } from 'react-router-dom';
import { entity_api_get_entity} from '../service/entity_api';
import { ingest_api_users_groups} from '../service/ingest_api';
import { getPerms} from '../service/user_service';
import {ErrBox} from "../utils/ui_elements";
import {useNavigate} from "react-router-dom";
import LinearProgress from '@mui/material/LinearProgress';
import { FormControl } from '@mui/base/FormControl';
import ReactTooltip from "react-tooltip";
import {
  faQuestionCircle,
 // faPlus,
  faSpinner,
  faPaperclip,
  //faLink,
  faImages
  // faTimes
} from "@fortawesome/free-solid-svg-icons";
import { tsToDate } from "../utils/string_helper";

import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faUserShield} from "@fortawesome/free-solid-svg-icons";
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { validateRequired } from "../utils/validators";
import HIPPA from "./ui/HIPPA";



export const RenderNewDonor = (props) => {
  let navigate = useNavigate();
  let [entityData, setEntityData] = useState();
  let [isLoading, setLoading] = useState(true);
  let [permissions, setPermissions] = useState(true);
  let [formErrors, setFormErrors] = useState({
    lab_donor_id: "",
    label: "",
    protocol_url: "",
    description: "",
  },);
  let [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null 
  });
  const { uuid } = useParams();
  const { readOnly } = useState(false);
  

  // TODO: Polish Process for loading the requested Entity, If Requested
 
  // (Including the Entity Type redirect)
  useEffect(() => {
    console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
    let test = props.userGroups[0].shortname;
    console.debug('%c◉ test ', 'color:#00ff7b', test);
    if(uuid && uuid!= ""){
      let authSet = JSON.parse(localStorage.getItem("info"));
      console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
      entity_api_get_entity(uuid, authSet.groups_token)
        .then((response) => {
          console.debug("useEffect entity_api_get_entity", response);
          if (response.status === 200) {
            if(response.results.entity_type !== "Donor"){
              navigate("/"+response.results.entity_type+"/"+uuid);
            }else{
              setEntityData(response.results);
              document.title = ("HuBMAP Ingest Portal | Donor: "+response.results.hubmap_id +"" );
              // setPermissions(getPerms(uuid, authSet.groups_token));
              // console.debug('%c◉ permissios ', 'color:#00ff7b', permissions);
              setLoading(false);
            }
          } else {
            console.debug("entity_api_get_entity RESP NOT 200", response.status, response);
            // passError(response.status, response.message);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          passError(error.status, error.results.error );
          setLoading(false);
        });
    }else{
      console.debug('%c◉ NEW FORM ', 'color:#00ff7b', );
      setLoading(false);
    }
  }, [uuid]);


  function passError(status, message) {
    setLoading(false);
    setErrorHandler({
      status: status,
      message:message,
      isError: true 
    })
  }


  function handleInputChange(e){
    const { name, value } = e.target;
    this.setState(prev => ({
      [name]: value
    }));
  }

  function renderHeader() {
    let PanelStyle = {
      width:"50%", 
      margin:"0 auto", 
      display:"inline-block", 
      boxSizing:"border-box"
    }
    
    return (
      <Box sx={{maxWidth:"90%",margin:"10px auto 20px auto "}}>
        <Box className="portal-label " sx={PanelStyle}>
          HuBMAP ID: {entityData.hubmap_id}
        </Box>
        <Box className="portal-label " sx={PanelStyle}>
          Submission ID: {entityData.submission_id}
        </Box>      
        <Box className="portal-label" sx={PanelStyle}>
          Entered by: {entityData.created_by_user_email}
        </Box>
        <Box className="portal-label" sx={PanelStyle}>
          Entry Date: {tsToDate(entityData.created_timestamp)}
        </Box>
      </Box>
    );
  }

  function validateForm() {
    let errors = {}
    let requiredFields = ['label','protocol_url']
    for (let field of requiredFields) {
      console.debug('%c◉ entityData[field] ', 'color:#00ff7b',field,entityData[field]);
      if (!validateRequired(entityData[field])) {
        errors[field] = 'Required';
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }



  function handleSubmit(){
    setEntityData({
      lab_donor_id: "",
      label: "",
      protocol_url: "",
      description: "",
      group_name:"",
    });
    if(validateForm()){
     console.debug('%c◉ VALID ', 'color:#00ff7b', );
    }else{
      console.debug('%c◉ INVALnoEnt ', 'color:#00ff7b');
    }
  }
  
  function handleUpdate(){
    let groups = ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token)
    console.debug('%c◉ groups ', 'color:#00ff7b', groups);
    if(validateForm()){
     console.debug('%c◉ VALID ', 'color:#00ff7b', );
    }else{
      console.debug('%c◉ INVALnoEnt ', 'color:#00ff7b');
    }
  }

  function buttonEngine () {
    console.debug('%c◉ uuid ', 'color:#00ff7b', uuid);
    return (
      <Box sx={{textAlign:"right"}}>
        <Button 
          variant="contained" 
          className="m-2" 
          onClick={()=>window.location.back()}>
            Cancel
        </Button>

        {/* Here we compile which buttons they get */}
        {( !uuid  &&(
          <Button 
            variant="contained" 
            className="m-2" 
            type="submit">
            {/* onClick={()=>handleUpdate()}> */}
              Generate ID
          </Button>
        ))}

        {( uuid && uuid.length > 0 &&(
          <Button 
            variant="contained" 
            className="m-2" 
            type="submit">
            // onClick={()=>handleUpdate()}>
              Update
          </Button>
        ))}
        

        
      </Box>
    )
  }
  

  
    if (!isLoading && errorHandler.isError === true){
      return (
        <ErrBox err={errorHandler} />
      );
    }else if (isLoading) {
        return (
          <div className="card-body ">
             <LinearProgress />
          </div>
        );
    }else{
      return (
        <Box>
          <Box className="col-sm-12 text-center">
            <h4>{entityData ? 'Donor Information' : 'Registering a Donor'}</h4>
          </Box>

          <Alert sx={{maxWidth:"80%", margin:"0 auto"}} icon={false} severity="error">
            <FontAwesomeIcon icon={faUserShield} /> - Do not provide any
            Protected Health Information.
            This includes the{" "}        
            <span
              style={{ cursor: "pointer" }}
              className="text-primary">
              18 identifiers specified by HIPAA
            </span>
          </Alert>
          
          {!isLoading && (uuid && uuid!== "") && renderHeader()}
          
          <form onSubmit={handleSubmit()}>
            <TextField //"Lab's Donor Non-PHI ID "
              id="lab_donor_id"
              label="Lab's Donor Non-PHI ID "
              helperText="An non-PHI id used by the lab when referring to the donor"
              defaultValue={entityData ? entityData.lab_donor_id : ""}
              error={formErrors.lab_donor_id !== ""}
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="standard"    
              className="my-3"/>
            <TextField //"Deidentified Name "
              id="label"
              label="Deidentified Name "
              helperText="A deidentified name used by the lab to identify the donor (e.g. HuBMAP Donor 1)"
              defaultValue={entityData ? entityData.label : ""}
              error={formErrors.label !== ""}
              required
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="standard"    
              className="my-3"/>
            <TextField //"Case Selection Protocol "
              id="protocol_url"
              label="Case Selection Protocol "
              helperText="The protocol used when choosing and acquiring the donor. This can be supplied a DOI from http://protocols.io"
              defaultValue={entityData ? entityData.protocol_url : ""}
              error={formErrors.protocol_url !== ""}
              required
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="standard"    
              className="my-3"/>
            <TextField //"Description "
              id="description"
              label="Description "
              helperText="Free text field to enter a description of the donor"        
              defaultValue={entityData ? entityData.description : ""}
              error={formErrors.description !== ""}
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="standard"    
              className="my-3"
              multiline
              rows={4}/>
              
            <Box className="my-3">
              <InputLabel variant="standard" htmlFor="group" >
                Group
              </InputLabel>
              <Select
                label="Group "
                id="group"
                onChange={(e) => handleInputChange(e)}
                fullWidth
                defaultValue={entityData ? entityData.group_name : props.userGroups[0].shortname}>
                  {props.userGroups.map((group, index) => {
                    return (
                      <MenuItem key={index + 1} value={group.shortname}>
                        {group.shortname} 
                      </MenuItem>
                    );
                  })}
              </Select>
            </Box>

            {buttonEngine()}  
          </form>
          

          
        </Box>
      )
    }
  }
