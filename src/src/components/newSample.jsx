import React, {useEffect, useState, useMemo} from "react";
import {useParams, useNavigate} from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FilledInput from '@mui/material/FilledInput';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import LoadingButton from "@mui/lab/LoadingButton";
import Tooltip from '@mui/material/Tooltip';
import NativeSelect from '@mui/material/NativeSelect';
import SearchIcon from '@mui/icons-material/Search';
import PageviewIcon from '@mui/icons-material/Pageview';
import TextField from "@mui/material/TextField";
import {Typography} from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Snackbar from '@mui/material/Snackbar';
import Checkbox from '@mui/material/Checkbox';
import FemaleIcon from '@mui/icons-material/Female';
import MaleIcon from '@mui/icons-material/Male';
import {GridLoader} from "react-spinners";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
  entity_api_create_multiple_entities,
  entity_api_get_entity_ancestor_list
} from "../service/entity_api";
import {ingest_api_allowable_edit_states,ingest_api_get_associated_ids} from "../service/ingest_api";
import {FormHeader, UserGroupSelectMenu, FormCheckRedirect} from "./ui/formParts";
import {OrganIcons} from "./ui/icons";
import RUIIntegration from "./ui/ruiIntegration";
import SearchComponent from "./search/SearchComponent";
import {toTitleCase} from "../utils/string_helper";
// import {RUI_ORGAN_TYPES} from "../constants";
// import {ValidateLocalhost} from "../utils/validators";

// @TODO: With Donors now in place, good opportunity to test out what can 
export const SampleForm = (props) => {
  let navigate = useNavigate();
  const{uuid} = useParams();
  let url = new URL(window.location.href);
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[validationError, setValidationError] = useState(null);
  let[sourceEntity, setSourceEntity] = useState(null);
  let[relatedEntities, setRelatedEntities] = useState(null);
  let [checked, setChecked] = useState(false);
  let [checkedMulti, setCheckedMulti] = useState(false);
  let [openSearch, setOpenSearch] = useState(false);
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "", 
    status: "info"
  });
  let organ_types = JSON.parse(localStorage.getItem("organs"));
  let[permissions,setPermissions] = useState({ 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  });
  let[entityData, setEntityData] = useState({
    direct_ancestor_uuid: "",
    sample_category: "",
    organ_type_donor_source_organ: "",
    visit: "",
    protocol_url: "",
    generate_ids_for_multiple_samples: "",
    number_to_generate: "",
    lab_sample_id_not_on_multiple: "",
    description: "",
    register_location_rui: "",
  });  
  let[formValues, setFormValues] = useState({
    direct_ancestor_uuid: "",
    sample_category: "",
    organ_type_donor_source_organ: "",
    visit: "",
    protocol_url: "",
    generate_ids_for_multiple_samples: "",
    number_to_generate: "",
    lab_tissue_sample_id: "",
    description: "",
  });
  let[formErrors, setFormErrors] = useState({
  });
  const organMenu = useMemo(() => {
    return Object.keys(organ_types)
      .sort((a, b) => organ_types[a].localeCompare(organ_types[b]))
      .map((key) => (
        <option key={key} value={key}>
          {organ_types[key]}
        </option>
      ));
  }, [organ_types]);

  let [RUIManagerObject, setRUIManagerObject] = useState({
    details: {
      organ: null,
      donorSex: null, // Optional
      json: null,
    },
    interface: {
      loading: false,
      openReg: false,
      JSONView: false,
      validOrgan: false,
      debugTooltip:false
    }
  });

  const RUI_ORGAN_TYPES = (() => {
    const RuiTypes = JSON.parse(localStorage.getItem("RUIOrgans"));
    if (!RuiTypes){ 
      return Object.values(JSON.parse(localStorage.getItem("organs_full")))
        .filter(org => org.rui_supported)
        .map(org => org.rui_code);
    }else{
      return RuiTypes;
    }

  })();

  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          console.debug('%c◉ response ', 'color:#00ff7b',response.results.direct_ancestor, response.results);
          if(response.status === 200){
            const entityType = response.results.entity_type;
            FormCheckRedirect(uuid,entityType,"Sample");
            const entityInfo = response.results;
            setEntityData(entityInfo);
            setFormValues(entityInfo);
            setSourceEntity(response.results.direct_ancestor);
            // We already have RUI JSON
            if(entityInfo.rui_location){
              setRUIManagerObject((prevValues) => ({...prevValues,
                details: {...prevValues.details, json: entityInfo.rui_location}}))
            }
            setSourceRUIDetails(response.results.direct_ancestor.uuid,response.results.direct_ancestor);
            // Permissions
            ingest_api_allowable_edit_states(uuid)
              .then((response) => {
                console.debug('%c◉ ingest_api_allowable_edit_states RESPONSE ', 'color:#00ff7b', response);
                const updatedPermissions = {
                  ...response.results,
                  ...(entityInfo.data_access_level === "public" && {has_write_priv: false})
                };
                setPermissions(updatedPermissions);
                ingest_api_get_associated_ids(uuid)
                  .then((response) => {
                      let related = response.results;
                      setRelatedEntities(related)
                      console.debug('%c◉ related.length ', 'color:#00ff7b', related.length);
                      console.debug('%c◉  ingest_api_get_associated_ids', 'color:#00ff7b', related, related.length);
                    // Is there a RUI enabled organ up the chain?

                    })
                    .catch((error) => {
                      console.debug('%c◉ ERROR ingest_api_get_associated_ids', 'color:#ff005d', error);
                    });
              })
              .catch((error) => {
                console.error("i0ngest_api_allowable_edit_states ERROR", error);
                setPageErrors(error);
              });            
          }else{
            console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        })
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          // setPageErrors(error); its counting no ancestors of ancestors as an error, shush
        });
    }else{
      setPermissions({
        has_write_priv: true,
      });
      // We should check if we're being passed a sourceEntity through the URL
      let params = Object.fromEntries(url.searchParams.entries());
      if(Object.keys(params).length > 0){
        console.debug('%c◉ URL params ', 'color:#00ff7b', params);
        setFormValues((prevValues) => ({
          ...prevValues,
          ...params
        }));
        setSnackbarController({
          open: true,
          message: "Passing Form values from URL parameters",
          status: "success"
        });
      }
      // Set the Source if Passed from URL
      if(params.direct_ancestor_uuid){
        // Let's just pass it as if it were a row in the search table
        entity_api_get_entity(params.direct_ancestor_uuid)
          .then((response) => {
            let error = response?.data?.error ?? false;
            if(!error && (response?.results?.entity_type === "Donor" || response.results.entity_type === "Sample")){
              console.debug('%c◉ error ', 'color:#00ff7b', error);
              let passSource = {row: response?.results ? response.results : null};
              console.log("passSource",passSource)
              handleSelectSource(passSource)
            }
            else if(!error && response?.results?.entity_type !== "Donor" && response.results.entity_type !== "Sample"){
              setSnackbarController({
                open: true,
                message: `Sorry, the entity ${response.results.hubmap_id} (${response.results.entity_type}) is not a valid Source (Must be a Donor or Sample) `,
                status: "error"
              });
            }else if(error){
              setSnackbarController({
                open: true,
                message: `Sorry, There was an error selecting your source: ${error}`,
                status: "error"
              });
            }else{
              throw new Error(response)
            }
          })
          .catch((error) => {
            console.debug("entity_api_get_entity ERROR", error);
            setPageErrors(error);
          });
      }
    }
    setLoading(false);
  }, [uuid]);

  function handleInputChange(e){
    const{id, value, checked} = e.target;
    console.debug('%c◉ handleInputChange ', 'color:#00ff7b', id, value, checked);
    setFormValues((prevValues) => ({
      ...prevValues,
      [id]: (id ==="generate_ids_for_multiple_samples") ? checked : value
    }));
    
    if(id ==="generate_ids_for_multiple_samples"){
      setChecked(checked)
    }

    if(id === "organ" ){
      setFormValues((prevValues) => ({
          ...prevValues,
          sample_category: "organ"
        })
      )
    }

    if(id === "sample_category" && value === "block"){
      console.debug('%c◉ Block! ', 'color:#005EFF');
      setRUIManagerObject((prevValues) => ({...prevValues,
        interface: {...prevValues.interface, loading: true}}))
    }else if(id === "sample_category" && value !== "block"){
    
    }
  }

  function validateForm(){
    let errors = 0;
    // If Sample Category for non donor or  Organ for a Donor  Are missing
    if((formValues.sample_category === "" && sourceEntity.entity_type !== "Donor") || (formValues.organ === "" && sourceEntity.entity_type === "Donor")){
      setFormErrors(prevErrors => ({
        ...prevErrors,
        sample_category: "Please select a Sample Category",
        organ: "Please select an Organ"
      }));
      errors++;
    }

    //  Validate The Multiples Generation 
    console.debug('%c◉ checked check ', 'color:#00ff7b', checked, formValues.generate_number);
    if(checked){
      // Validate generate_number
      if(!formValues.generate_number || parseInt(formValues.generate_number) <= 0 || isNaN(parseInt(formValues.generate_number))){
        setFormErrors(prevErrors => ({
          ...prevErrors,
          generate_number: "Please enter a valid number of samples to generate"
        }));
        errors++;
      }
    }

    return errors === 0;
  }

  function badValError(error){
    console.debug('%c◉badValError error ', 'color:#00ff7b', error);
    if(error.response){
      // setValidationError(error.response);
      setValidationError(error.response.data.error ? error.response.data.error : error);
    }else{
      setValidationError(error);
    }
    setIsProcessing(false);
  }
    
  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    let sampleFormData = {
      protocol_url: formValues.protocol_url,
      visit: formValues.visit,
      description: formValues.description,
      lab_tissue_sample_id: formValues.lab_tissue_sample_id,
      ...(formValues.rui_location ? {rui_location: formValues.rui_location} : {}),
    }
    console.debug('%c◉ handleSubmit:  ', 'color:#E7EEFF;background: #9359FF;padding:200',sampleFormData,formValues,);
    if(validateForm()){
      if(uuid){
        // We're in Edit mode
        entity_api_update_entity(uuid,JSON.stringify(sampleFormData))
          .then((response) => {
            if(response.status === 200){
              props.onUpdated(response.results);
            }
          })
          .catch((error) => {
            wrapUpPageErrors(error)
          });
      }else{
        // We're in Create mode
        sampleFormData = {
          ...sampleFormData,
          direct_ancestor_uuid: formValues.direct_ancestor_uuid,
          group_uuid: document.getElementById("group_uuid")?.value,
          sample_category: ((formValues.sample_category === "" && formValues.organ) ? "organ": formValues.sample_category),
          ...(sourceEntity.entity_type === 'Donor' && formValues.organ ? {organ: formValues.organ} : {}),
        }
        // Are we making multiples?
        if(checked){
          console.debug('%c◉ checked, ', 'color:#00ff7b', formValues.generate_number,sampleFormData,JSON.stringify(sampleFormData));
          entity_api_create_multiple_entities(formValues.generate_number,JSON.stringify(sampleFormData))
          .then((response) => {
            if(response.status === 200){
              props.onCreated({new_samples: response.results, entity: sampleFormData});
            }else{
              badValError(response.error ? response.error : response);
            }
          })
          .catch((error) => {
            console.debug('%c◉ ERROR entity_api_create_multiple_entities', 'color:#ff005d', error);
            wrapUpPageErrors(error)
          });
        // Nope Just One  
        }else{
          console.log("sampleFormData", typeof sampleFormData, sampleFormData)
          console.log("RUIManagerObject.details.json", typeof RUIManagerObject.details.json, RUIManagerObject.details.json)
          entity_api_create_entity("sample",JSON.stringify(sampleFormData))
          .then((response) => {
            if(response.status === 200){
              props.onCreated(response.results);
            }else{
              badValError(response.error ? response.error : response);
            }
          })
          .catch((error) => {
            wrapUpPageErrors(error)
          });
        }
          
      }
    }else{
      setIsProcessing(false);
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }
  
  function setSourceRUIDetails(sourceUUID,source){
    console.debug('%c◉ setSourceRUIDetails UUID:', 'color:#E7EEFF;background: #9359FF;padding:200',sourceUUID, "source:", source);
    if(!sourceUUID){
      return null;
    }else{
      entity_api_get_entity_ancestor_list(sourceUUID)
        .then((response) => {  
          let sex = getDonorSexDetail(response);
          console.debug('%c◉ sex, ', 'color:#00ff7b', sex);
          setRUIManagerObject((prevValues) => ({...prevValues,
            details: {...prevValues.details, 
              donorSex: sex,
              organ: source.organ ? source.organ : getSourceOrganDetail(response)},
            interface: {
              ...prevValues.interface,
              loading: false,
              tempSex: sex ? sex : null,
            }})) 
          if(sourceEntity && !sourceEntity.organ){ 
            setSourceEntity((prevValues) => ({...prevValues,
              organ: getSourceOrganDetail(response)
            }))
          }   
        })
        .catch((error) => { 
          console.debug('%c◉ ERROR fetchAncestors', 'color:#ff005d', error);
          wrapUpPageErrors(error)
        });
    }      
  }
        
  function getDonorSexDetail(ancestors){
    console.debug('%c◉ getDonorSexDetail ancestors ', 'color:#00ff7b', ancestors);
    if(!ancestors.results || ancestors.results.length === 0){
      return null;
    }else{
      const donorDetails = ancestors.results.length === 1 ? ancestors.results[0] : ancestors.results.find((d) => d.entity_type === "Donor");
      if(donorDetails.metadata){
        let donorMeta = donorDetails.metadata.organ_donor_data || donorDetails.metadata.living_donor_data;
        const donorSexDetails = donorMeta.find((m) => m.grouping_code === "57312000");
        return (donorSexDetails && donorSexDetails.preferred_term) ? donorSexDetails.preferred_term : null
      }else{
        return null
      }
    }
  }      
  function getSourceOrganDetail(ancestors){
    console.debug('%c◉ fetchAncestors response', 'color:#E7EEFF;background: #9359FF;padding:200',ancestors, ancestors.results);
    if(sourceEntity && sourceEntity.organ){ // if we can just grab it from the source
      return RUI_ORGAN_TYPES.includes(sourceEntity.organ) ? sourceEntity.organ : null
    }else{
      let organObject;
      if(Array.isArray(ancestors.results)){ // Many ancestors
        organObject = ancestors.results.find(obj => obj.hasOwnProperty('organ'));
      }else{  // One ancestor
        organObject = ancestors.results;
      }
      let organ = (organObject && organObject.organ) ? organObject.organ : null
      console.debug('%c◉ organ ', 'color:#00ff7b', organ);
      setSourceEntity((prevValues) => ({...prevValues,
        organ: organ
      }))
      return RUI_ORGAN_TYPES.includes(organ) ? organ : null
    }
  }

  function handleSelectSource(e){
    if(!e){
      return null;
    }
    console.debug('%c◉ handleSelectSource ', 'color:#00ff7b', e.row);
    setOpenSearch(false);
    handleClose(e);
    setSourceEntity(e.row);
    setSourceRUIDetails(e.row.uuid,e.row);
    setFormValues((prevValues) => ({
      ...prevValues,
      direct_ancestor_uuid: e.row.uuid,
      ...((e.row.organ) && {organ: e.row.organ}),
      // ...((ruiOrgan === true) && {RUIOrgan: true} ),
    }));

    // If the source is a Donor we already know we're not RUI Enabled abymore
    if(e.row.entity_type === "Donor"){
      setRUIManagerObject((prevValues) => ({...prevValues,
        interface: {...prevValues.interface, loading: false}}))
      setFormValues((prevValues) => ({...prevValues,
        sample_category: null,
        organ: null,
      })); 
    }
  }

  function handleClose(){
    setOpenSearch(false);
  }

  function handleMultiEdit(uuid){
    if(uuid !== entityData.uuid){
      window.location.replace(`${process.env.REACT_APP_URL}/Sample/${uuid}`);
    }
    // We're already here otherwise
  }

  function wrapUpPageErrors(error){
    let errors = pageErrors;
    console.debug('%c◉ wrapUpPageErrors Err pageErrors ', 'color:#00ff7b', errors);
    setPageErrors(error);
    setIsProcessing(false);
  }

  function buttonEngine(){
    return(
      <Box sx={{textAlign: "right"}}>
        <Button
          variant="contained"
          className="m-2"
          onClick={() => navigate("/")}>
          Cancel
        </Button>
        {/* @TODO use next form to help work this in to its own UI component? */}
        {!uuid && (
          <LoadingButton
            variant="contained"
            loading={isProcessing}
            className="m-2"
            type="submit">
            Generate ID
          </LoadingButton>
        )}
        {uuid && uuid.length > 0 && permissions.has_write_priv && (
          <LoadingButton loading={isProcessing} variant="contained" className="m-2" type="submit">
            Update
          </LoadingButton>
        )}
      </Box>
    );
  }

  function isOrganBloodType(sptype){
    return sptype === "organ" ||
      sptype === "blood";
  }

  // RUI
  function handleRUIJson(dataFromChild){
    console.debug('%c◉Form  handleRUIJson ', 'color:#00ff7b',typeof dataFromChild, dataFromChild);
    setFormValues((prevValues) => ({
      ...prevValues,
      rui_location: JSON.parse(dataFromChild)
    })); 
    setRUIManagerObject((prevValues) => ({...prevValues,
      details: {...prevValues.details, json: JSON.parse(dataFromChild)},}))
  }
  function closeRUIModal(){
    setRUIManagerObject((prevValues) => ({...prevValues,
      interface: {...prevValues.interface, openReg: false}}))
  }
  function shouldShowRUIInterface(){
    // console.debug('%c◉ shouldShowRUIInterface', 'color:#E7EEFF;background: #0F87FF;padding:200', RUIManagerObject.details.organ && RUI_ORGAN_TYPES.includes(RUIManagerObject.details.organ) ,formValues.sample_category === "block");
    if(sourceEntity && sourceEntity.entity_type === "Donor"){
      return false
    }
    let goodOrgan = RUIManagerObject.details.organ && RUI_ORGAN_TYPES.includes(RUIManagerObject.details.organ);
    let goodCat = (formValues.sample_category === "block")
    if(goodOrgan && goodCat){
      return true
    }else{
      return false
    }
  }
  function shouldIShowRUIDebugger(e,toggle){
    console.log("shouldIShowRUIDebugger", e)
    console.log("e.shiftKey", e.shiftKey)
    console.log("e.nativeEvent", e.nativeEvent, e.nativeEvent.type)
    if(toggle && e.shiftKey){
      setRUIManagerObject((prevValues) => ({...prevValues, interface: {...prevValues.interface, debugTooltip:true}}))
    }else{
      setRUIManagerObject((prevValues) => ({...prevValues, interface: {...prevValues.interface, debugTooltip:false}}))
    }
    if(toggle && e.nativeEvent.type === "click"){
      setRUIManagerObject((prevValues) => ({...prevValues, interface: {...prevValues.interface, debugTooltip: !RUIManagerObject.interface.debugTooltip}}))
    }
  }
  
  function preloadRUI(values){
    console.debug('%c◉ preloadRUI ', 'color:#00ff7b',values);
    // console.debug(RUIManagerObject);
     setRUIManagerObject((prevValues) => ({
    ...prevValues,
      details: {
        ...prevValues.details,
      },
      interface: {
        ...prevValues.interface,
        openReg: true,
        loading: false,
        tempSex: values?.donorSex ? values.donorSex : prevValues.details.donorSex,
      }
    }));
    // setRuiModal([true])
  }
  function renderRuiRegisterButtonset(){
    if(RUIManagerObject.details.donorSex){ // Has DonorMetadata
      return(
        <Button
          className="mt-2"
          disabled={!permissions.has_write_priv}
          onClick={() => preloadRUI()}
          variant="contained">
          Register Location
        </Button>
      );
    }else{ // No Donor Metadata 
      return(
        <>
          <Button // Female Button
            small
            className="m-1"
            endIcon={<FemaleIcon />}
            disabled={!permissions.has_write_priv}
            onClick={() => preloadRUI({donorSex: "female"})}
            variant="contained">
            Register Location
          </Button>
          <Button // Male Button
            small
            className="m-1"
            endIcon={<MaleIcon />}
            disabled={!permissions.has_write_priv}
            onClick={() => preloadRUI({donorSex: "male"})}
            variant="contained">
            Register Location
          </Button>
        </>
      );
    }
  }

  if(isLoading ||(!entityData && uuid)){
    return(<LinearProgress />);
  }else{
    return(
      <Box>
        <Dialog
          fullWidth={true}
          maxWidth="lg"
          onClose={(e) => handleClose(e)}
          aria-labelledby="source-lookup-dialog"
          open={openSearch === true ? true : false}>
          <DialogContent>
          <SearchComponent
              select={(e) => handleSelectSource(e)}
              custom_title="Search for a Source ID for your Sample"
              custom_subtitle="Only Donors or Samples may be selected as sources for newly created samples."
              // filter_type="Publication"
              modecheck="Source"
              blacklist={['collection',"dataset","upload","publication"]}/>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={(e) => handleClose(e)}
              variant="contained"
              color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
        
        <Grid container className=''>
          <FormHeader entityData={uuid ? entityData : ["new","Sample"]} permissions={permissions} />
        </Grid>
     
        {uuid && relatedEntities && relatedEntities.length > 1 && (
          <Alert severity="info" className="m-3" >
            <Grid container>
              <Grid item xs={8}>
                This sample is part of a group of {relatedEntities.length} other {entityData.sample_category} samples, ranging from {relatedEntities[0].hubmap_id } through { relatedEntities[relatedEntities.length - 1].hubmap_id}
                Click below to expand and view the groups list. Then select an Sample ID to edit the sample data. Press the update button to save your changes. 
              </Grid>
              <Grid item xs={4}>
                <Button onClick={() => setCheckedMulti(!checkedMulti)} variant="contained" color="primary">
                {checkedMulti ? "Hide" : "Show"} Related Samples
              </Button>
              </Grid>
            </Grid>
            <Collapse in={checkedMulti}> 
                {/* <ul className=""> */}
                <ul 
                  style={{
                    maxHeight: "125px", 
                    overflowY: "scroll", 
                    marginTop: "20px", 
                    padding: "10px",
                    display: "flex",
                    flexDirection: "column",
                    flexWrap: "wrap",
                  }}>
                  {relatedEntities.length > 0 && relatedEntities.map((item, index) => {
                    return(
                      <li key={index+"_"+item.submission_id} >
                          <Button 
                            style={{
                              backgroundColor: item.uuid === entityData.uuid ? "#ffffff77" : "none",
                              border: item.uuid === entityData.uuid ? "1px solid #1976d2" : "none",
                            }}
                            small={"true"}
                            onClick={(e) => handleMultiEdit(item.uuid, e)}>
                          {`${item.submission_id}`}
                        </Button>
                      </li>
                    );
                  })}
                </ul>
            </Collapse> 
          </Alert>
        )}

        <form onSubmit={(e) => handleSubmit(e)} className="mt-2">

          <FormControl sx={{width: '100%'}} >
            <InputLabel sx={{marginTop: "0px"}} htmlFor="direct_ancestor_uuid" style={{marginTop: "13px"}}>Source ID * </InputLabel>
            <FilledInput
              id="direct_ancestor_uuid"
              value={sourceEntity ? sourceEntity.hubmap_id : ""}
              error={formErrors.direct_ancestor_uuid ? true : false}
              onClick={() => setOpenSearch(uuid ? false : true)}
              disabled={uuid?true:false}
              // focused={"true"}
              // InputLabelProps={{shrink: ((uuid || (formValues?.direct_ancestor_uuid)) ? true:false)}}
              required={true}
              small={"true"}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="Select a Source Entity"
                    disabled={uuid?true:false}
                    onClick={() => setOpenSearch(true)}
                    edge="end">
                    {<SearchIcon />}
                  </IconButton>
                </InputAdornment>}/>
            <FormHelperText id="sourceIDHelp" className="mb-3">{"The HuBMAP Unique identifier of the direct origin entity,other sample or donor, where this sample came from. "+(formErrors.direct_ancestor_uuid ? formErrors.direct_ancestor_uuid : "")}
            </FormHelperText>
          </FormControl>

          {sourceEntity && sourceEntity.uuid && ( 
            <Box sx={{p: 2, mb: 2,textAlign: "left", width: "auto", border: "1px solid #ccc", borderRadius: "5px", boxSizing: "border-box"}}>
              <Typography >
                <b>Source Category:</b>{" "}
                {sourceEntity.entity_type === "Donor" ? "Donor" : toTitleCase(sourceEntity.sample_category) }
              </Typography>
              {sourceEntity.organ && !entityData.direct_ancestor?.organ && sourceEntity.sample_category.toLowerCase() !== "organ" &&(
                <Typography>
                  <b>Source Organ:</b>{" "}
                  {organ_types[sourceEntity.organ]}
                </Typography>
              )}


              {isOrganBloodType(sourceEntity.sample_category) && (
                <Typography>
                  <b>Organ Type:</b>
                  {organ_types[sourceEntity.organ]}
                  {/* <svg height="25px" viewBox="0 0 10 10" x="200" width="100"><image url={OrganIcons(sourceEntity.organ)} /></svg>  */}
                </Typography>
              )}
              {sourceEntity.submission_id && (
                  <Typography>
                    <b>Submission ID:</b>{" "}
                    {sourceEntity.submission_id}
                  </Typography>
              )}
              {sourceEntity.lab_donor_id && (
                <Typography>
                    <b>Lab ID: </b>{" "}
                    {sourceEntity.lab_donor_id}     
                </Typography>
              )}
              {sourceEntity.group_name && (
                <Typography className="col-sm-12">
                  <b>Group Name: </b>{" "}
                  {sourceEntity.group_name}
                </Typography>
              )}
            </Box>
          )}

          {sourceEntity && sourceEntity.uuid && (sourceEntity.entity_type === "Donor") && (
            <Box className="my-4" >           
                <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="organ">
                  Organ
                </InputLabel>
                <NativeSelect
                  id="organ"
                  label="Organ"
                  required={sourceEntity.entity_type === "Donor"}
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  helperText={(formErrors.organ ? formErrors.organ : "")}
                  inputProps={{style: {padding: "0.8em"}}}
                  sx={{background: "rgba(0, 0, 0, 0.06)"}}
                  disabled={uuid?true:false}
                  value={formValues.organ ? formValues.organ : ""}>
                  <option key={"DEFAULT"} value={""}></option>
                  {organMenu}  
                </NativeSelect>
                <FormHelperText id="organIDHelp" className="mb-3">The HuBMAP Unique identifier of the direct origin entity,other sample or donor, where this sample came from.</FormHelperText>
            </Box>
          )}

          {sourceEntity && sourceEntity.uuid && (sourceEntity.entity_type !== "Donor") && (
            <Box className="my-4">
              <NativeSelect
                id="sample_category"
                required={sourceEntity.entity_type !== "Donor"}
                onChange={(e) => handleInputChange(e)}
                fullWidth
                inputProps={{
                  style: {padding: "0.8em"}
                }}
                sx={{
                  background: "rgba(0, 0, 0, 0.06)"
                }}
                disabled={uuid?true:false}
                value={formValues.sample_category ? formValues.sample_category : ""}>
                <option key={"NA"} value={""}>Sample Category</option>                                        
                <option key={"block"} value={"block"}>Block</option>
                <option key={"section"} value={"section"}>Section</option>
                <option key={"suspension"} value={"suspension"}>Suspension</option>
              </NativeSelect>
              <FormHelperText id="sampleCategoryIDHelp" className="">The category of sample <span className="error">{(formErrors.sample_category ? formErrors.sample_category : "")}</span></FormHelperText>
            </Box>
          )}

          {/* Visit */}
          <TextField 
            id="visit"
            label="Visit "
            helperText="Associated visit in which sample was acquired (Non-PHI number). e.g., baseline"
            value={formValues ? formValues.visit : ""}
            InputLabelProps={{shrink: ((uuid || (formValues?.visit)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            small={"true"}
            disabled={!permissions.has_write_priv}/>
          
          {/* Protocol URL  */}
          <TextField 
            id="protocol_url"
            label="Preparation Protocol "
            helperText="The protocol used when procuring or preparing the tissue. This must be provided as a protocols.io DOI URL see https://www.protocols.io/"
            value={formValues ? formValues.protocol_url : ""}
            error={formErrors.protocol_url ? formErrors.protocol_url : false} 
            InputLabelProps={{shrink: ((uuid || (formValues?.protocol_url)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            className="mt-4 mb-2"
            required/>
          
          {/* lab_tissue_sample_id */}
          <Collapse in={!checked}> 
            <TextField 
              id="lab_tissue_sample_id"
              label="Lab Sample ID"
              helperText="An identifier used by the lab to identify the specimen, this can be an identifier from the system used to track the specimen in the lab. This field will be entered by the user."
              value={formValues ? formValues.lab_tissue_sample_id : ""}
              InputLabelProps={{shrink: ((uuid || (formValues?.lab_tissue_sample_id)) ? true:false)}}
              onChange={(e) => handleInputChange(e)}
              fullWidth
              disabled={!permissions.has_write_priv}
              className="my-4" />
          </Collapse>
          
          {/* Description */}
          <TextField 
            id="description"
            label="Description "
            helperText="Free text field to enter a description of the donor"
            value={formValues ? formValues.description : ""}
            InputLabelProps={{shrink: ((uuid || (formValues?.description)) ? true:false)}}
            onChange={(e) => handleInputChange(e)}
            fullWidth
            disabled={!permissions.has_write_priv}
            className="my-4"
            multiline
            rows={4}/>
          
          {/* generate_ids_for_multiple_samples */}
          {/* DOnt bother loading if we're gonna be an organ */}
          {sourceEntity && sourceEntity.uuid && (sourceEntity.entity_type !== "Donor") && (
            <>
              {!uuid && ( 
                <FormControlLabel 
                  control={
                    <Checkbox 
                      checked={checked}
                      error={formErrors.generate_ids_for_multiple_samples ? "true" : "false"}
                      id= "generate_ids_for_multiple_samples"
                      disabled={!permissions.has_write_priv}
                      onChange={(e) => handleInputChange(e)}
                    />
                  } 
                  label="Generate multiple samples" />
              )}
              
              {/*generate_number */}
              <Collapse in={checked}> 
                <TextField
                  id="generate_number"
                  required={checked}
                  label="Number to Generate"
                  helperText={(formErrors.generate_number ? formErrors.generate_number : "")}
                  onChange={(e) => handleInputChange(e)}
                  fullWidth
                  value={formValues ? formValues.generate_number : ""}
                  error={formErrors.generate_number ? formErrors.generate_number : false}
                  small={"true"} />
              </Collapse>
            </>
          )} 

          {/* RUI Interface */}
          {/* RUI Manager Display */}
            {/* RUI VIEWS */}
              {/* The Organ is only ever set if it's a RUI Enabled organ */}
              {RUIManagerObject.details.organ && !checked && ( // RUI Editing Interface
                <Dialog
                  fullScreen
                  onClose={(e) => handleClose(e)}
                  aria-labelledby="rui-dialog"
                  open={RUIManagerObject.interface.openReg}>
                    <RUIIntegration
                      handleJsonRUI={(str) =>handleRUIJson(str)}
                      closeRUIModal = {(str) => closeRUIModal(str)}
                      organList={localStorage.getItem('organs') ? JSON.parse(localStorage.getItem('organs')) : {}}
                      organ={RUIManagerObject.details.organ ? RUIManagerObject.details.organ : "error"}
                      sex={RUIManagerObject.details.donorSex ? RUIManagerObject.details.donorSex : RUIManagerObject.interface.tempSex}
                      user={sourceEntity ? sourceEntity.created_by_user_displayname : null}
                      location={RUIManagerObject.details.json ? RUIManagerObject.details.json : null}/>
                </Dialog>
              )}
              {(formValues.rui_location) && !checked && ( // View JSON Data
                <Dialog 
                  sx={{height: "80%",}}
                  onClose={() => setRUIManagerObject((prevValues) => ({...prevValues,
                    interface: {...prevValues.interface, JSONView: false}}))}
                  aria-labelledby="rui-view-dialog"
                  open={RUIManagerObject.interface.JSONView}>
                  <DialogTitle>Sample Location Information</DialogTitle>
                  <DialogContent>
                    <pre>
                      {JSON.stringify(RUIManagerObject.details.json, null, 3)}
                    </pre>
                  </DialogContent>
                  <DialogActions>
                    <Button
                      onClick={() => setRUIManagerObject((prevValues) => ({...prevValues,
                        interface: {...prevValues.interface, JSONView: false}}))}
                      variant="contained"
                      color="primary">
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
              )}
            {/* END RUI VIEWS */}

            {/* RUI State Feedback */}
            {!shouldShowRUIInterface() && !checked && (permissions.has_admin_priv || permissions.has_write_priv) &&( // RUI is Not Available (but user could edit)
              <Tooltip
                open={RUIManagerObject.interface.debugTooltip ? true : false }        
                onMouseEnter={(e) =>shouldIShowRUIDebugger(e,true)}
                onMouseLeave={(e) =>shouldIShowRUIDebugger(e,false)}
                sx={(["localhost", "ingest.dev.hubmapconsortium", "ingest.test.hubmapconsortium"].includes(window.location.hostname)) ? {padding: "0px",backgroundColor: "#eee"} : {display: "none"}}
                placement="top" 
                title={
                  <Box sx={{padding: "10px", width: "500px"}}>
                    <Typography 
                      variant="caption" 
                      sx={RUIManagerObject.interface.loading ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          RUIManagerObject loading: {RUIManagerObject.interface.loading.toString()}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={(!RUIManagerObject.details.organ) ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Organ: {organ_types[RUIManagerObject.details.organ]+" ("+RUIManagerObject.details.organ+")" || null}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={RUIManagerObject.details.organ && !RUI_ORGAN_TYPES.includes(RUIManagerObject.details.organ) ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          RUIOrgan:  {RUIManagerObject.details.organ && RUI_ORGAN_TYPES.includes(RUIManagerObject.details.organ) ? "true" : "false"}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={!formValues.sample_category ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Category: {formValues.sample_category ? (formValues.sample_category).toString() : "null"}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={!RUIManagerObject.details.json ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          JSON:  {RUIManagerObject.details.json ? "true" : "false"}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={!RUIManagerObject.details.donorSex ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Donor Sex:  {RUIManagerObject.details.donorSex || "null"}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={!formValues.direct_ancestor_uuid ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Source: {sourceEntity ? sourceEntity?.hubmap_id : "null"}
                    </Typography><br />
                    <Typography   
                      variant="caption" 
                      sx={!formValues.direct_ancestor_uuid ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Source Type: {sourceEntity ? sourceEntity?.entity_type : "null"}
                    </Typography><br />
                    <Typography 
                      variant="caption" 
                      sx={checked ? {color: "#FFB2D6"} : {color: "PaleGreen"}}>
                          Checked: {checked.toString()} 
                    </Typography>
                  </Box>
                }>
                <Alert 
                  variant="caption" 
                  severity="info" 
                  onClick={(e) =>shouldIShowRUIDebugger(e,true)}
                  sx={{
                    backgroundColor: "#eee", 
                    color: "rgba(0, 0, 0, 0.38)", 
                    display:"inline-flex", 
                    cursor:"pointer!important"
                  }}>

                  {!sourceEntity && (
                    <Typography variant="caption">
                      Please Select a Source to begin <br />
                    </Typography>
                  )}
                  {sourceEntity && (!formValues.sample_category && (sourceEntity.entity_type === "Sample" || sourceEntity.entity_type === "Organ")) && (   
                    <Typography variant="caption"> 
                      <GridLoader size={4} /> Waiting on Category Selection... < br/>
                    </Typography>
                  )}
                  {(sourceEntity && (formValues.sample_category && formValues.sample_category !== "block")) &&(
                    <Typography variant="caption">RUI Interface is only available for Block Samples<br /></Typography>
                  )}
                  {checked && (
                    <Typography variant="caption"> RUI Interface is not compatible with the Multi-Registration system < br/></Typography>
                  )}
                  {sourceEntity && sourceEntity.organ && !RUI_ORGAN_TYPES.includes(RUIManagerObject.details.organ) &&(
                    <Typography variant="caption">RUI Interface is only available for Select Organs<br /></Typography>
                  )}
                </Alert>
              </Tooltip>
              )}
            {/* END RUI State Feedback */}
            {/* RUI Manager Interface (Buttons) */}
              {/* Edit or Add RUI data*/}

              {shouldShowRUIInterface() && !checked && ( // RUI is Available
                <React.Fragment>
                  <div className="col-sm-12 text-left">
                    {(entityData.rui_location || RUIManagerObject.details.json) ? ( // If we have a location from the Entity Data (already saved)
                      <Button
                        className="mt-2"
                        disabled={!permissions.has_write_priv}
                        onClick={() => setRUIManagerObject((prevValues) => ({...prevValues, interface: {...prevValues.interface, openReg: true}}))}
                        variant="contained">
                        Modify Location Information
                      </Button>
                    ):( // No Saved Entity RUI Data, offer to Register
                      <>{renderRuiRegisterButtonset()}</>
                    )}
                  </div>
                  <div className="col-sm-6 text-left">
                    {(RUIManagerObject.details.json) && !checked && ( // We have RUI Data in The Form Field
                      <Button
                        small
                        variant="text"
                        className="btn btn-link"
                        type="button"
                        startIcon={<PageviewIcon />}
                        onClick={() => setRUIManagerObject((prevValues) => ({...prevValues, interface: {...prevValues.interface, JSONView: true}}))}>
                        View Location
                      </Button>
                    )}
                  </div>
                </React.Fragment>
              )}
              
            {/* END  Manager Interface (Buttons) */}
          {/* END RUI Manager Display */}
      
          {/* Group */}
          {/* Data is viewable in form header & cannot be changed, so only show on Creation */}
          {!uuid && (
            <Box className="my-4">           
              <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
                Group
              </InputLabel>
              <NativeSelect
                id="group_uuid"
                label="Group"
                onChange={(e) => handleInputChange(e)}
                fullWidth
                className="p-2"
                sx={{
                  BorderTopLeftRadius: "4px",
                  BorderTopRightRadius: "4px",
                }}
                disabled={uuid?true:false}
                value={formValues.group_uuid ? formValues.group_uuid : ""}>
                <UserGroupSelectMenu formValues={formValues} />
              </NativeSelect>
            </Box>
          )}
          
          {validationError && (
            <Alert variant="filled" severity="error">
              <strong>Error:</strong> {JSON.stringify(validationError)}
            </Alert>
          )}
          {buttonEngine()}
        </form>
      
        {pageErrors && (
          <Alert variant="filled" severity="error">
            <strong>Error:</strong> {JSON.stringify(pageErrors)}
          </Alert>
        )}

        {/* Snackbar Feedback*/}
        <Snackbar 
          open={snackbarController.open} 
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          autoHideDuration={6000} 
          onClose={() => setSnackbarController(prev => ({...prev, open: false}))}>
          <Alert
            onClose={() => setSnackbarController(prev => ({...prev, open: false}))}
            severity={snackbarController.status}
            variant="filled"
            sx={{ 
              width: '100%',
              backgroundColor: snackbarController.status === "error" ? "#f44336" : "#4caf50",
              }}>
            {snackbarController.message}
          </Alert>
        </Snackbar>
      </Box>

    );
  }
}