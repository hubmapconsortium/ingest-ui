import React, {useEffect, useState, useMemo} from "react";
import {useParams} from "react-router-dom";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
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
import NativeSelect from '@mui/material/NativeSelect';
import SearchIcon from '@mui/icons-material/Search';
import PageviewIcon from '@mui/icons-material/Pageview';
import TextField from "@mui/material/TextField";
import {Typography} from "@mui/material";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';

import {ingest_api_allowable_edit_states,ingest_api_get_associated_ids} from "../service/ingest_api";
import {
  entity_api_get_entity,
  entity_api_update_entity,
  entity_api_create_entity,
  entity_api_create_multiple_entities,
  entity_api_get_entity_ancestor_list
} from "../service/entity_api";
import {FormHeader, GroupSelectMenu, FormCheckRedirect} from "./ui/formParts";
import SearchComponent from "./search/SearchComponent";
import RUIIntegration from "./uuid/tissue_form_components/ruiIntegration";
import {toTitleCase} from "../utils/string_helper";
import {RUI_ORGAN_TYPES} from "../constants";

// @TODO: With Donors now in place, good opportunity to test out what can 
export const SampleForm = (props) => {
  const{uuid} = useParams();
  let[isLoading, setLoading] = useState(true);
  let[isProcessing, setIsProcessing] = useState(false);
  let[pageErrors, setPageErrors] = useState(null);
  let[validationError, setValidationError] = useState(null);
  let[sourceEntity, setSourceEntity] = useState(null);
  let[relatedEntities, setRelatedEntities] = useState(null);
  let [checked, setChecked] = React.useState(false);
  let [checkedMulti, setCheckedMulti] = React.useState(false);
  let [openSearch, setOpenSearch] = React.useState(false);
  let [ruiModal, setRuiModal] = React.useState([false]);
  let [ruiDetailsModal, setRUIDetailsModal] = React.useState(false);
  let [ruiEnabled, setRuiEnabled] = React.useState(false);
  let [RUIJson, setRUIJson] = React.useState(false);
  const userGroups = JSON.parse(localStorage.getItem("userGroups"));
  const userInfo = JSON.parse(localStorage.getItem("info"));
  const defaultGroup = userGroups[0].uuid;
  let organ_types = JSON.parse(localStorage.getItem("organs"));
  let[permissions,setPermissions] = useState( { 
    has_admin_priv: false,
    has_publish_priv: false,
    has_submit_priv: false,
    has_write_priv: false
  } );
  let[entityData, setEntityData] = useState( {
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
  } );  
  let[formValues, setFormValues] = useState( {
    direct_ancestor_uuid: "",
    sample_category: "",
    organ_type_donor_source_organ: "",
    visit: "",
    protocol_url: "",
    generate_ids_for_multiple_samples: "",
    number_to_generate: "",
    lab_tissue_sample_id: "",
    description: "",
  } );
  let[formErrors, setFormErrors] = useState( {
  } );

  // let organMenu = Object.keys(organ_types)
  //   .sort((a, b) => organ_types[a].localeCompare(organ_types[b])) // Sort keys by their values
  //   .map(key => (
  //     <option key={key} value={key}>
  //       {organ_types[key]}
  //     </option>
  //   ));
  const organMenu = useMemo(() => {
    return Object.keys(organ_types)
      .sort((a, b) => organ_types[a].localeCompare(organ_types[b]))
      .map((key) => (
        <option key={key} value={key}>
          {organ_types[key]}
        </option>
      ));
  }, [organ_types]);

  // TODO: Polish Process for loading the requested Entity, If Requested
  // (Including the Entity Type redirect)
  useEffect(() => {
    if(uuid && uuid !== ""){
      entity_api_get_entity(uuid)
        .then((response) => {
          if(response.status === 200){
            const entityType = response.results.entity_type;
            FormCheckRedirect(uuid,entityType,"Sample");
            const entityInfo = response.results;
            setSourceEntity(entityInfo.direct_ancestor);
            if(entityInfo.direct_ancestor && entityInfo.direct_ancestor.uuid && !entityInfo.direct_ancestor.organ){
              // We dont have the organ directly from the source, so we gotta dig up the tree for it
              entity_api_get_entity_ancestor_list(entityInfo.direct_ancestor.uuid)
                .then((ancestorList) => {
                  console.debug('%c◉ ancestorList ', 'color:#00ff7b', ancestorList);
                  let organObject;
                  let organ;
                  try {
                    if(Array.isArray(ancestorList.results)){
                      organObject = ancestorList.results.find(obj => obj.hasOwnProperty('organ'));
                      console.debug('%c◉ organObject ', 'color:#00ff7b', organObject.organ);
                    }else{
                      organObject = ancestorList.results;
                    }
                    organ = organObject.organ ? organObject.organ : undefined;
                    // console.debug('%c◉ LOADED BY UUID, PARENT ORG IS:', 'color:#00ff7b', organ);
                    // entityInfo.organ = organ;
                    console.debug('%c◉ RUI_ORGAN_TYPES.includes(organ) ', 'color:#00ff7b', RUI_ORGAN_TYPES.includes(organ));
                    setRuiEnabled([(RUI_ORGAN_TYPES.includes(organ) && entityInfo.sample_category==="block") ? true : false,organ]);
                    // entityInfo.ruiEnabled =(RUI_ORGAN_TYPES.includes(entityInfo.organ) && entityInfo.sample_category==="block" ) ? true : false;
                  }catch(error){
                    console.debug('%c◉ getAncestorOrgan error ', 'color:#ff005d', error);
                    // return error;
                  }
                } )
                .catch((error) => { 
                  console.debug('%c◉ getAncestorOrgan error ', 'color:#ff005d', error);
                } )
            }else if(entityInfo.direct_ancestor.organ){
              // We already have the Organ from the Source
              setRuiEnabled([(RUI_ORGAN_TYPES.includes(entityInfo.direct_ancestor.organ) && entityInfo.sample_category==="block") ? true : false,entityInfo.direct_ancestor.organ]);
            }

            if(entityInfo.rui_location){
              console.debug('%c◉ entityInfo.rui_location setting RUIJson', 'color:#EE00FF', entityInfo.rui_location);
              setRUIJson(entityInfo.rui_location);
            }

            console.debug('%c◉ entityInfo ', 'color:#00ff7b', entityInfo);
            setEntityData(entityInfo);
            setFormValues(entityInfo);
            
            ingest_api_allowable_edit_states(uuid)
              .then((response) => {
                const updatedPermissions = {
                  ...response.results,
                  ...(entityInfo.data_access_level === "public" && {has_write_priv: false} )
                };
                setPermissions(updatedPermissions);
                ingest_api_get_associated_ids(uuid)
                  .then((response) => {
                      let related = response.results;
                      setRelatedEntities(related)
                      console.debug('%c◉ related.length ', 'color:#00ff7b', related.length);
                      console.debug('%c◉  ingest_api_get_associated_ids', 'color:#00ff7b', related, related.length);
                    // Is there a RUI enabled organ up the chain?

                    } )
                    .catch((error) => {
                      console.debug('%c◉ ERROR ingest_api_get_associated_ids', 'color:#ff005d', error);
                    } );
              } )
              .catch((error) => {
                console.error("i0ngest_api_allowable_edit_states ERROR", error);
                setPageErrors(error);
              } );
            
              document.title = `HuBMAP Ingest Portal | Sample: ${entityInfo.hubmap_id}`; //@TODO - somehow handle this detection in App
          }else{
            console.error("entity_api_get_entity RESP NOT 200",response.status,response);
            setPageErrors(response);
          }
        } )
        .catch((error) => {
          console.debug("entity_api_get_entity ERROR", error);
          setPageErrors(error);
        } );
    }else{
      setPermissions( {
        has_write_priv: true,
      } );
      
    }
    setLoading(false);
  }, [uuid]);

  function handleRUIJson(dataFromChild){
    console.debug('%c◉Form  handleRUIJson ', 'color:#00ff7b',dataFromChild);
    setFormValues((prevValues) => ( {
      ...prevValues,
      rui_location: JSON.stringify(dataFromChild)
    } ));
    console.log("dataFromChild: "+typeof dataFromChild)
    setRUIJson(JSON.parse(dataFromChild))
    setRuiModal([false])
    console.debug('%c◉ PostRUISELECT ', 'color:#00ff7b', RUIJson, formValues);
  };

  function handleInputChange(e){
    const{id, value, checked} = e.target;
    console.debug('%c◉ handleInputChange ', 'color:#00ff7b', id, value, checked);
    setFormValues((prevValues) => ( {
      ...prevValues,
      [id]: (id ==="generate_ids_for_multiple_samples") ? checked : value
    } ));
    
    if(id ==="generate_ids_for_multiple_samples"){
      setChecked(checked)
    }

    if(id === "sample_category" && value === "block"){
      console.debug('%c◉ Block! ', 'color:#005EFF');
      // if we're a block, lets also check if our Source
      // is rui Enabled

      entity_api_get_entity_ancestor_list(formValues.direct_ancestor_uuid)
        .then((response) => {
          console.debug('%c◉ isRUIEntity Response ', 'color:#00ff7b', response);
          console.log(response.results);
          // the handleJson values
          const donorDetails =
          response.results.length === 1
            ? response.results[0]
            : response.results.find((d) => d.entity_type === "Donor");
          const donorMeta =
            donorDetails.metadata.organ_donor_data ||
            donorDetails.metadata.living_donor_data;
          // Get Sex Details
          const donorSexDetails = donorMeta.find(
            (m) => m.grouping_code === "57312000"
          );
          console.debug('%c◉ donorSexDetails ', 'color:#00ff7b', donorSexDetails);
          let donorSex = donorSexDetails.preferred_term;
          console.debug('%c◉ donorSex ', 'color:#00ff7b', donorSex);

          let organ;
          let organObject;
          // Lets skip Right to assembly of RUI Info
          // If we've already set a ruiOrgan By Selecting it as the Source
          console.debug('%c◉ formValues ', 'color:#ffe921', formValues);
          if(formValues.RUIOrgan && formValues.RUIOrgan === true){
            setRuiEnabled([true,formValues.organ,donorSex]);
          }else{
            // We gotta fetch the organ from up the ancestry chain
            // Then assemble the RUI Info
            try {
              if(Array.isArray(response.results)){
                organObject = response.results.find(obj => obj.hasOwnProperty('organ'));
                console.debug('%c◉ organObject ', 'color:#00ff7b', organObject.organ);
              }else{
                organObject = response.results;
              }
              organ = organObject.organ ? organObject.organ : undefined;
              console.debug('%c◉ isRUIEntity organ:', 'color:#00ff7b', organ);
              setRuiEnabled([(RUI_ORGAN_TYPES.includes(organ)) ? true : false,organ,donorSex]);
            }catch(error){
              console.debug('%c◉ getAncestorOrgan error ', 'color:#ff005d', error);
            }
          }
        } )
        .catch((error) => { 
          console.debug('%c◉ getAncestorOrgan error ', 'color:#ff005d', error);
          // return error;
        } );
    }else if(id === "sample_category" && value !== "block"){
      // Other Sample Cats Dont Count
      setRuiEnabled([false])
    }
  }

  function validateForm(){
    let errors = 0;
    // If Sample Category for non donor or  Organ for a Donor  Are missing
    if((formValues.sample_category === "" && sourceEntity.entity_type !== "Donor") || (formValues.organ === "" && sourceEntity.entity_type === "Donor")){
      setFormErrors(prevErrors => ( {
        ...prevErrors,
        sample_category: "Please select a Sample Category",
        organ: "Please select an Organ"
      } ));
      errors++;
    }

    //  Validate The Multiples Generation 
    console.debug('%c◉ checked check ', 'color:#00ff7b', checked, formValues.generate_number);
    if (checked){
      // Validate generate_number
      if (!formValues.generate_number || parseInt(formValues.generate_number) <= 0 || isNaN(parseInt(formValues.generate_number))){
        setFormErrors(prevErrors => ( {
          ...prevErrors,
          generate_number: "Please enter a valid number of samples to generate"
        } ));
        errors++;
      }
      // Validate Blank lab_tissue_sample_id
      if (formValues.lab_tissue_sample_id?.length > 0){
        setFormErrors(prevErrors => ( {
          ...prevErrors,
          generate_number: "Please uncheck this box and remove the Lab Sample ID, then check this box again"
        } ));
        errors++;
      }
    }

    return errors === 0;
  }

  function badValError(error){
    console.debug('%c◉badValError error ', 'color:#00ff7b', error,error.response.data.error);
    setValidationError(error.response.data.error ? error.response.data.error : error);
    setIsProcessing(false);
  }
    
  function openRUIDetailModal(){
    console.debug('%c◉  openRUIDetailModal', 'color:#00ff7b');
    console.debug(RUIJson);
    // console.debug(RUIJson.location);
    setRUIDetailsModal(true)
  }
 
  function handleSubmit(e){
    e.preventDefault()    
    setIsProcessing(true);
    let sampleFormData = {
      direct_ancestor_uuid: formValues.direct_ancestor_uuid,
      protocol_url: formValues.protocol_url,
      visit: formValues.visit,
      description: formValues.description,
      ...((formValues.sample_category === "" && formValues.organ) && {organ: formValues.organ} ),
      ...((!checked && (formValues.rui_location && formValues.rui_location.length>0)) && {rui_location: RUIJson} ),
      ...((!checked && formValues.lab_tissue_sample_id) && {lab_tissue_sample_id: formValues.lab_tissue_sample_id} )
    }
    console.debug('%c◉ sampleFormData ', 'color:#00ff7b', sampleFormData);
    if(validateForm()){
      if(uuid){
        // We're in Edit mode
        entity_api_update_entity(uuid,JSON.stringify(sampleFormData))
          .then((response) => {
            if(response.status === 200){
              props.onUpdated(response.results);
            }else{
              badValError(response.error ? response.error : response);
            }
          } )
          .catch((error) => {
            wrapUp(error)
          } );
      }else{
        // We're in Create mode

        // They might not have changed the Group Selector, so lets check for the value
        let selectedGroup = document.getElementById("group_uuid");
        sampleFormData.group_uuid = selectedGroup?.value ? selectedGroup.value : defaultGroup;
        
        // We need to add the Category back to the Form being submitted 
        sampleFormData.sample_category = ((formValues.sample_category === "" && formValues.organ) ? "organ": formValues.sample_category)
        
        // Are we making multiples?
        if(checked){
          console.debug('%c◉ checked, ', 'color:#00ff7b', formValues.generate_number,sampleFormData,JSON.stringify(sampleFormData));
          
          entity_api_create_multiple_entities(formValues.generate_number,JSON.stringify(sampleFormData))
          .then((response) => {
            if (response.status === 200){
              props.onCreated( {new_samples: response.results, entity: sampleFormData} );
            }else if(response.status === 400){
              badValError(response.error ? response.error : response);
            }else{
              badValError(response.error ? response.error : response);
            }
          } )
          .catch((error) => {
            console.debug('%c◉ ERROR entity_api_create_multiple_entities', 'color:#ff005d', error);
          } );
        // Nope Just One
        }else{
          entity_api_create_entity("sample",JSON.stringify(sampleFormData))
          .then((response) => {
            if(response.status === 200){
              props.onCreated(response.results);
            }else{
              badValError(response.error ? response.error : response);
            }
          } )
          .catch((error) => {
            wrapUp(error)
          } );
        }
          
      }
    }else{
      setIsProcessing(false);
      console.debug("%c◉ Invalid ", "color:#00ff7b");
    }
  }

  function handleSelectSource(e){
    setOpenSearch(false);
    handleClose(e);
    console.debug('%c◉ handleSelectSource ', 'color:#00ff7b', e.row);
    setSourceEntity(e.row);
    let ruiOrgan;
    if(e.row.organ){
      // Is this a RUI Organ?
      ruiOrgan = RUI_ORGAN_TYPES.includes(e.row.organ) 
    }
    setFormValues((prevValues) => ( {
      ...prevValues,
      direct_ancestor_uuid: e.row.uuid,
      ...((e.row.organ) && {organ: e.row.organ} ),
      ...((ruiOrgan === true) && {RUIOrgan: true} ),
    } ));
    // If the source is a Donor we already know we're not RUI Enabled abymore
    if(e.row.entity_type === "Donor"){
      setRuiEnabled([false]);
    }
  }

  function handleClose(e){
    setOpenSearch(false);
  }

  function handleMultiEdit(uuid){
    if(uuid !== entityData.uuid){
      window.location.replace(`${process.env.REACT_APP_URL}/Sample/${uuid}`);
    }
    // We're already here otherwise
  }

  function wrapUp(error){
    console.debug('%c◉ Wrapup Err ', 'color:#00ff7b');
    setPageErrors(error);
    setIsProcessing(false);
  }

  function buttonEngine(){
    return(
      <Box sx={{textAlign: "right"}}>
        <Button
          variant="contained"
          className="m-2"
          onClick={() => window.history.back()}>
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

  function shouldShowRUIInterface(){
    return ruiEnabled[0]
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
              filter_type="Sample"
              blacklist={['collection']}
              modecheck="Source"
            />
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

        {shouldShowRUIInterface() && !checked && (
          <Dialog
            fullScreen
            onClose={(e) => handleClose(e)}
            aria-labelledby="rui-dialog"
            open={ruiModal[0]}>

            <RUIIntegration 
              handleJsonRUI={(dataFromChild) => handleRUIJson(dataFromChild)}
              organList={organ_types}
              organ={ruiEnabled[1]}
              sex={ruiEnabled[2]}
              user={userInfo.name}
              closeRUIModal={() => setRuiModal([false])}
              location={RUIJson ? RUIJson : null}
              parent="SamplesForm" />
              {/* <RUI 
                user={JSON.parse(localStorage.getItem("info")).name}
                uuid={uuid ? uuid : (sourceEntity ? sourceEntity.uuid : entityData.direct_ancestor_uuid)} 
                source={sourceEntity ? sourceEntity : entityData.direct_ancestor} 
                organ={ruiEnabled[1] ? ruiEnabled[1] : entityData.direct_ancestor }/> */}
          </Dialog>
        )}
        
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
                    // columnCount: "3"  
                    display: "flex",
                    flexDirection: "column",
                    flexWrap: "wrap",
                  }}>
                  {relatedEntities.length > 0 && relatedEntities.map((item, index) => {
                    return (
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
                  } )}
                </ul>
                {/* </ul> */}
            </Collapse> 

          </Alert>
          
        )}

        <form onSubmit={(e) => handleSubmit(e)}>

          <FormControl sx={{width: '100%', mt: 2}} variant="filled">
            <InputLabel htmlFor="direct_ancestor_uuid" shrink={(uuid || (formValues?.direct_ancestor_uuid) ? true:false)}>Source ID</InputLabel>
            <FilledInput
              id="direct_ancestor_uuid"
              value={sourceEntity ? sourceEntity.hubmap_id : ""}
              error={formErrors.direct_ancestor_uuid ? true : false}
              onClick={() => setOpenSearch(uuid ? false : true)}
              disabled={uuid?true:false}
              InputLabelProps={{shrink: ((uuid || (formValues?.direct_ancestor_uuid)) ? true:false)}}
              variant="filled"
              helperText={(formErrors.direct_ancestor_uuid ? formErrors.direct_ancestor_uuid : "")}
              small={"true"}
              required
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
            <FormHelperText id="sourceIDHelp" className="mb-3">The HuBMAP Unique identifier of the direct origin entity,other sample or donor, where this sample came from.</FormHelperText>
          </FormControl>

          {sourceEntity && sourceEntity.uuid && ( 
            <Box sx={{p: 2, mb: 2,textAlign: "left", width: "auto", border: "1px solid #ccc", borderRadius: "5px", boxSizing: "border-box"}}>
              <Typography >
                <b>Source Category:</b>{" "}
                {sourceEntity.entity_type === "Donor" ? "Donor" : toTitleCase(sourceEntity.sample_category) }
              </Typography>

              {isOrganBloodType(sourceEntity.sample_category) && (
                <Typography>
                  <b>Organ Type:</b>{" "}
                  {organ_types[sourceEntity.organ]}
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
            disabled={!permissions.has_write_priv}
            variant="filled"/>
          
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
            variant="filled"
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
              variant="filled"
              className="my-4" />
          </Collapse>
          
          {/* generate_ids_for_multiple_samples */}
          {!uuid && ( 
            <FormControlLabel 
              control={
                <Checkbox 
                  checked={checked}
                  error={formErrors.generate_ids_for_multiple_samples ? "true" : "false"}
                  id= "generate_ids_for_multiple_samples"
                  helperText=""
                  disabled={!permissions.has_write_priv}
                  onChange={(e) => handleInputChange(e)}
                />
              } 
            label="Generate Multiple IDs" />
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
            variant="filled"
            className="my-4"
            multiline
            rows={4}/>
          
          {/* RUI REG */}
          { (formValues.direct_ancestor_uuid && sourceEntity.entity_type.toLowerCase() !=="donor") && (!formValues.sample_category || formValues.sample_category === "") && (
            <>
              <Typography variant="caption">Validating RUI Interface... Please Select a Sample Category</Typography>
              <LinearProgress />
            </>
          )}

          {/* {(shouldShowRUIInterface() === false && uuid) && (     */}
          {(shouldShowRUIInterface() === false) && !checked && (    
            <Alert variant="caption" severity="info" sx={{backgroundColor: "rgba(0, 0, 0, 0.03)", color: "rgba(0, 0, 0, 0.38)"}}>
              <Typography variant="caption">RUI Interface not Available < br/></Typography>
              <Typography variant="caption">(Sample must be a Block from a Supported Organ Type)</Typography>
            </Alert>
          )}
          {shouldShowRUIInterface() === true && !checked && (
            <Button
              onClick={() => setRuiModal([true])}
              variant="contained">
                {entityData.rui_location ? "Modify Location Information" : "Register Location"}
            </Button>
          )}          
          
          {/* RUI VIEW */}
          {(formValues.rui_location && (RUIJson && RUIJson !== null)) && (!checked && !uuid) && (
            <React.Fragment>
              <div className="col-sm-2 text-left">
                <Button
                  variant="text"
                  className="btn btn-link"
                  type="button"
                  startIcon={<PageviewIcon />}
                  onClick={() => openRUIDetailModal()}>
                  View Location
                </Button>
              </div>             
              <Dialog
                sx={{
                  height: "80%",

                }}
                onClose={() => setRUIDetailsModal(false)}
                aria-labelledby="rui-view-dialog"
                open={ruiDetailsModal}>
                <DialogTitle>Sample Location Information</DialogTitle>
                <DialogContent>
                  <pre>
                    {JSON.stringify(RUIJson, null, 3)}
                  </pre>
                </DialogContent>
                <DialogActions>
                  <Button
                    onClick={() => setRUIDetailsModal(false)}
                    variant="contained"
                    color="primary">
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            </React.Fragment>
          )}

          {/* Group */}
          <Box className="my-4">           
            <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
              Group
            </InputLabel>
            <NativeSelect
              id="group_uuid"
              label="Group"
              onChange={(e) => handleInputChange(e)}
              fullWidth
              variant="filled" 
              disabled={uuid?true:false}
              value={formValues.group_uuid ? formValues.group_uuid : defaultGroup}>
              <GroupSelectMenu formValues={formValues} />
            </NativeSelect>
          </Box>
          
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
      </Box>
    );
  }
}

