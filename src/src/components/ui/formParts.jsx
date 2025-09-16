import ArticleIcon from '@mui/icons-material/Article';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import ClearIcon from "@mui/icons-material/Clear";
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import TableChartIcon from '@mui/icons-material/TableChart';
import WarningIcon from '@mui/icons-material/Warning';
import {Typography} from "@mui/material";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBell, faHeadset, faCircleExclamation} from "@fortawesome/free-solid-svg-icons";
import CircleNotificationsIcon from '@mui/icons-material/CircleNotifications';
import Grid from '@mui/material/Grid';
import InputLabel from "@mui/material/InputLabel";
import NativeSelect from '@mui/material/NativeSelect';
import Snackbar from '@mui/material/Snackbar';
import React from "react";
import {SAMPLE_CATEGORIES} from "../../constants";
import {tsToDate} from "../../utils/string_helper";
import HIPPA from "./HIPPA";

import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';

// import {ingest_api_allowable_edit_states} from "../../service/ingest_api";
// import {entity_api_get_entity} from "../../service/entity_api";
// const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;

export const FormHeader = (props) => {
  let entityData = props.entityData;
  let details = (props.entityData[0]!=="new") ? `${entityData.entity_type}: ${entityData.hubmap_id}` : `New ${props.entityData[1]}`;
  let permissions = props.permissions;
  let globusURL = props.globusURL;
  document.title = `HuBMAP Ingest Portal | ${details}`; //@TODO - somehow handle this detection in App
  return (
    <React.Fragment>
      {topHeader(entityData)}
      {infoPanels(entityData,permissions,globusURL)}
    </React.Fragment>
  )
}

export function IconSelection(entity_type,status){  
  console.debug('%c◉ status ', 'color:#00ff7b', entity_type, status);
  console.debug('%c◉ test.. ', 'color:#00ff7b', status? "true" : "false");
  let style = {fontSize: "1.5em", "verticalAlign": "text-bottom"}
  let newSX={"&&": {color: status?"white":""}}
  switch
  (entity_type && entity_type.toLowerCase()){
    case "donor":
      return <PersonIcon style={style} sx={newSX} />
    case "sample":
      return <BubbleChartIcon style={style} sx={newSX} />
    case "dataset":
      return <TableChartIcon style={style} sx={newSX} />
    case "upload":
      return <DriveFolderUploadIcon style={style} sx={newSX} />
    case "publication":
      return <ArticleIcon style={style} sx={newSX} />
    case "collection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    case "eppicollection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    default:
      return <BubbleChartIcon style={style} />
  }
}

export function badgeClass(status){
  var badge_class = "";
  if(status=== undefined || !status){
    badge_class = "badge-danger";
    console.log("No Status Value for this unit ");
  }else{
	switch (status.toUpperCase()){
    case "NEW":
      badge_class = "badge-purple";
      break;
    case "REOPENED":
      badge_class = "badge-purple";
      break;
    case "REORGANIZED":
      badge_class = "badge-info";
      break;
    case "VALID":
      badge_class = "badge-success";
      break;
    case "INVALID":
      badge_class = "badge-danger";
      break;
    case "QA":
      badge_class = "badge-info";
      break;
    case "LOCKED":
      badge_class = "badge-secondary";
      break;
    case "PROCESSING":
      badge_class = "badge-secondary";
      break;
    case "PUBLISHED":
      badge_class = "badge-success";
      break;
    case "UNPUBLISHED":
      badge_class = "badge-light";
      break;
    case "DEPRECATED":
      break;
    case "ERROR":
      badge_class = "badge-danger";
      break;
    case "HOLD":
      badge_class = "badge-dark";
      break;
    case "SUBMITTED":
      badge_class = "badge-info";
      break;
    case "INCOMPLETE":
      badge_class = "badge-incomplete";
          break;
        default:
          break;
    }
    return badge_class;
  }
}


function errorNote(){
  return (<>
    <Typography variant="caption" color={"#444a65"}>
      <strong><FontAwesomeIcon sx={{padding: "1.2em"}} icon={faHeadset}/></strong>If this message persists, please reach out to help@hubmapconsortium.org symbol beneith the table will re-launch this message
    </Typography>
  </>)
}
function noteWrap(note){
  return (
    <Typography variant="caption" color={"#444a65"}>
      <strong>Note: </strong>{note}
    </Typography>
  );
}
function statusBadge(status){
  return (
    <Chip sx={{fontWeight: "bold"}} className={badgeClass(status)} label={status.toUpperCase()} size="small" />
  )
}
function newBadge(type){
  console.debug('%c◉ newBadge ', 'color:#00ff7b', type);
  let newBadgeStyle = {
    "&&": {color: "#ffffff!important"} ,
    fontWeight: "bold",
    color: "white",
    padding: "4px",
    fontSize: "1.2rem!important",
    height: "auto",
    display: "inlineTable",
    verticalAlign: "super",
  }
  return (  
    <Chip style={newBadgeStyle} className={badgeClass("NEW")} icon={IconSelection(type,"new")} label={"NEW"} size="small" />
  )
}
function buildPriorityProjectList(list){
  if(list.length>1){
    return list.join(", ");
  }else{
    return list[0]
  }
}	
function topHeader(entityData){
  if(entityData[0] !== "new"){
    return (
      <React.Fragment>
        <Grid item xs={12} className="" > 
          <h3 style={{marginLeft: "-2px"}}>{IconSelection(entityData.entity_type)}{entityData.entity_type} Information</h3>
        </Grid>
        <Grid item xs={6} className="" >
          <Typography><strong>HuBMAP ID:</strong> {entityData.hubmap_id}</Typography>
          {entityData.status && (
            <Typography><strong>Status:</strong> {entityData.status ? statusBadge(entityData.status) : ""} </Typography>             
          )}
          {entityData.priority_project_list	 && (
            <Typography variant="caption" sx={{display: "inline-block"}}><strong>Priority Projects:</strong> {buildPriorityProjectList(entityData.priority_project_list)} </Typography>             
          )}
          <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Entered by: </strong> {entityData.created_by_user_email}</Typography>
          {(entityData.entity_type === "Donor" || entityData.entity_type ==="Sample") && (
            <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Submission ID:  </strong> {entityData.submission_id}</Typography>
          )}
          <Typography variant="caption" sx={{display: "inline-block", width: "100%"}}><strong>Entry Date: </strong> {tsToDate(entityData.created_timestamp)}</Typography>   
        </Grid>
      </React.Fragment>
    ) 
  }else{
    return (
      <React.Fragment>
        <Grid item xs={entityData[1] === "Upload" ? 12 : 6} className="" >  
          {newBadge(entityData[1],"new")}
          <h3 style={{margin: "4px 5px", display: "inline-table",verticalAlign: "bottom"}}> Registering a new {entityData[1]}</h3>
        </Grid>
        
        {entityData[1] === "Upload" && (
          <Grid item xs={6} className="" >
            <Typography sx={{marginRight: "10px"}} >
              Register a new Data Upload that will be used to bulk upload data, which will be organized by HIVE into multiple datasets. For more information about registering and uploading data see the <a href="https://docs.hubmapconsortium.org/data-submission/" target="_blank" >Data Submission Guide</a>.
            </Typography>
          </Grid>
        )}
        
      </React.Fragment>
    )
  }
}
function infoPanels(entityData,permissions,globusURL){
  return (
    <Grid item xs={6} className="" >
      {globusURL&& (
        <Typography className="pb-1">
          <strong><big>
            <a href={globusURL}
              target='_blank'
              rel='noopener noreferrer'>   
                {(entityData.status && (entityData.status.toUpperCase() ==="REORGANIZED" || entityData.status.toUpperCase() ==="SUBMITTED")) && (
                  <>Open data repository {" "}</>
                )}
                {entityData.status && entityData.status.toUpperCase() !=="REORGANIZED" && entityData.status.toUpperCase() !=="SUBMITTED" && (
                  <>To add or modify data files go to the data repository {" "}</>
                )}
                <OpenInNewIcon />
            </a>
          </big></strong>
        </Typography>
      )}
      {permissions.has_write_priv && entityData.entity_type !== "publication" &&(
        <HIPPA />
      )}
    {entityData && ((entityData.data_access_level && entityData.data_access_level === "public") || (entityData.status && entityData.status === "Published")) && (
        // They might not have write access but not because of data_access_level
        <Alert severity="warning" 
          iconMapping={{warning: <WarningIcon style={{fontSize: "2em"}} />}}
          sx={{
            // minHeight: "100%",
            minWidth: "100%",
            padding: "10px"
          }}>
          This entity is no longer editable. It was locked when it became publicly
          acessible when data associated with it was published.
        </Alert>
      )}
      {!permissions.has_write_priv && !permissions.has_admin_priv && (
        <Alert  
          variant="caption" 
          severity="info" 
          sx={{
            color: "rgba(0, 0, 0, 0.38)",
            minWidth: "100%", 
            margin: "0px",
            padding: "0px",
          }}
          iconMapping={{
            warning: <WarningIcon style={{fontSize: "2em"}} />
          }} >
          You do not have permission to modify this item.
        </Alert>
      )}
     
    </Grid>
  )
}


export function UserGroupSelectMenu(formValues){
  let userGroups = JSON.parse(localStorage.getItem("userGroups"));
  if(formValues.group_name){
    return(
      <option value={formValues.group_uuid}>
        {formValues.group_name}
      </option>
    )
  }else{
    let menuArray = [];
    for(let group of userGroups){
      menuArray.push(
        <option key={group.uuid} value={group.uuid}>
          {group.shortname}
        </option>
      );
    }
    return menuArray;
  } 
}

export function UserGroupSelectMenuPatch(formValues){
  console.debug('%c◉ UserGroupSelectMenuPatch ', 'color:#0026FF', formValues);
  let userGroups = JSON.parse(localStorage.getItem("userGroups"));
  if(formValues.group_name){
    return(
      <option key={formValues.group_uuid} value={formValues.group_uuid}>
        {formValues.group_name}
      </option>
    )
  }else{
    let menuArray = [];
    for(let group of userGroups){
      menuArray.push(
        <option key={group.uuid} value={group.uuid}>
          {group.shortname}
        </option>
      );
    }
    return menuArray;
  } 
}

export function FormCheckRedirect(uuid,entityType,form){
  console.debug('%c◉ FormCheckRedirect ', 'color:#ff0073', uuid,entityType,form);
  if(entityType !== form){
    // @TODO: Move this sort of handling/detection to the outer app, or into component
    window.location.replace(
      `${process.env.REACT_APP_URL}/${entityType}/${uuid}`
    );
  }
}

export function combineTypeOptionsComplete(){
  // Removes the Whitelist / Blacklist stuff,
  // mostly for use for resetting the main Search Page View

  var combinedList = [];

  // FIRST: Main Entity Types
  combinedList.push( {  // @TODO: Find out why Importing Warps this
    donor: "Donor" ,
    sample: "Sample",
    dataset: "Dataset", 
    upload: "Data Upload",
    publication: "Publication",
    collection: "Collection"} );

  // NEXT: Sample Categories
  combinedList.push(SAMPLE_CATEGORIES);
  // @TODO: Switch these to UBKG too?

  // LAST: Organs
  let organs = [];
  let organList = handleSortOrgans(JSON.parse(localStorage.getItem("organs")))
  try {
    organList.forEach((value, key) => {
      organs[value] = "\u00A0\u00A0\u00A0\u00A0\u00A0" + key; // Gives it that Indent
    } );
    combinedList.push(organs.sort());
    console.debug('%c⊙', 'color:#00ff7b', "combinedList", combinedList);
    return combinedList;
  } catch (error){
    console.debug("%c⭗", "color:#ff005d", "combinedList error", error);
    var errStringMSG = "";
    typeof error.type === "string"
      ? (errStringMSG = "Error on Organ Assembly")
      : (errStringMSG = error);
    console.debug('%c◉ ERROR  ', 'color:#ff005d', error,errStringMSG);
  }
};

export function handleSortOrgans(organList){
  // console.debug('%c⊙', 'color:#00ff7b', "handleSortOrgans", organList );
  let sortedDataProp = {};
  let sortedDataArray = [];
  var sortedMap = new Map();
  for (let key in organList){
    let value = organList[key];
    sortedDataProp[value] = key;
    sortedDataArray.push(value);
  }
  sortedDataArray = sortedDataArray.sort();
  for (const [index, element] of sortedDataArray.entries()){
    sortedMap.set(element, sortedDataProp[element]);
  }
  return sortedMap;
};

export function GroupSelector( {formValues, handleInputChange, memoizedUserGroupSelectMenuPatch, uuid} ){
  if (uuid) return null;
  return (
    <Box className="my-3">
      <InputLabel sx={{color: "rgba(0, 0, 0, 0.38)"}} htmlFor="group_uuid">
        Group
      </InputLabel>
      <NativeSelect
        id="group_uuid"
        label="Group"
        onChange={handleInputChange}
        fullWidth
        className="p-2"
        sx={{
          BorderTopLeftRadius: "4px",
          BorderTopRightRadius: "4px",
        }}
        disabled={!!uuid}
        value={formValues["group_uuid"] ? formValues["group_uuid"].value : JSON.parse(localStorage.getItem("userGroups"))[0].uuid}>
        {memoizedUserGroupSelectMenuPatch}
      </NativeSelect>
    </Box>
  );
}

export function HandleCopyFormUrl(e) {
    const url = new URL(window.location.origin + window.location.pathname);
    let formValues = document.querySelectorAll("input, textarea");
    Object.entries(formValues).forEach(([key, value]) => {
      console.debug('%c◉ formValues ', 'color:#00ff7b', value.id, value.type, value.value);
      if (value !== undefined && value !== null && value !== "" && value.type !== "checkbox" && value.id && value.value && !value.disabled) {
        url.searchParams.set(value.id, value.value);
      }
      else if (value.type === "checkbox" && value.checked ) {
        url.searchParams.set(value.id, value.checked === true ? "true" : "false");
      }
    });
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        // setSnackMessage("Form URL copied to clipboard!");
        // setShowSnack(true)
      })
      .catch(() => {
        // setSnackMessage("Form URL Failed to copy to clipboard!");
        // setShowSnack(true)
      });
  }
export default function SpeedDialTooltipOpen() {
  const actions = [
    // { icon: <FileCopyIcon />, name: 'Copy' },
    // { icon: <SaveIcon />, name: 'Save' },
    { icon: <DynamicFormIcon />, name: 'Copy Form Prefil URL', action: (e) => HandleCopyFormUrl(e) },
    // { icon: <ReportIcon />, name: 'Share' },
  ];
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', top: "80px", right: 0 }}>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'absolute', top: 0, right: 16 }}
        icon={<OfflineBoltIcon />}
        direction={"down"}>
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            onClick={() => action.action ? action.action() : alert(action.name)}
            slotProps={{
              tooltip: {
                title: action.name,
              },
            }}
          />
        ))}
      </SpeedDial>
      {/* <Snackbar
        open={false}
        autoHideDuration={6000}
        onClose={() => e.setShowSnack(false)}
        message={e.snackMessage}
        /> */}
    </Box>
  );
}

export function FeedbackDialog( { 
  showMessage, 
  setShowMessage, 
  message,
  title,
  summary,
  note,
  color,
  icon
} ){
  let messageColor = color ? color : "#444A65";
  let altColorLight = LightenHex(messageColor, 20);
  let altColorDark = DarkenHex(messageColor, 20);
  let defaultNote = ""
  let defaultSummary = "";
  if (!message || message.length <= 0){
    defaultSummary = "No Known Problems or Messages";
  }
  
  return (
    <Dialog 
      maxWidth="sm"
      open={showMessage} 
      sx={{margin: "auto", marginBottom: "0px"}}
      fullWidth={true}>
      <DialogTitle sx={{
        background: `linear-gradient(180deg,${messageColor} 0%, ${altColorLight} 100%)`, 
        border: `1px solid ${messageColor}`, 
        color: "white", 
        padding: "2px 10px 0px 10px",
        borderTopLeftRadius: "4px",
        borderTopRightRadius: "4px",}}> 
        <FontAwesomeIcon icon={icon?icon:faBell} sx={{marginRight: "10px"}} /> {title?title:"Attention: "}
      </DialogTitle>
      <DialogContent sx={{border: `1px solid ${messageColor}`}}> 
        <Typography sx={{fontSize: "0.9rem", marginBottom: "10px", marginTop: "10px"}}>
          {summary?summary:defaultSummary}
        </Typography >
        {(message && message.length>0 && typeof message ==="object") ? message.map(([details, items], index) => (
          <React.Fragment key={index}>
            <Typography sx={{fontSize: "0.9rem", marginTop: "20px"}}>{details}</Typography>
            <ul style={{margin: "10px 0px 20px 0px", padding: "20px", background: messageColor+"20", borderRadius: "5px", border: `1px solid ${messageColor+20}`}}>
              {Array.isArray(items) && items.map((item, i) => {
                // Split at the first space before the parenthesis
                const match = item.match(/^([^\s(]+)\s*(\(.*\))?$/);
                return (
                  <li key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        borderBottom: "1px solid #444a6520"
                      }}>
                      <Typography component="span" >
                        <FontAwesomeIcon 
                          className='messageIcon'
                          icon={icon?icon:faCircleExclamation} 
                          color={altColorLight} 
                          style={{marginRight: "10px"}}/> 
                        {match ? match[1] : item}
                      </Typography>
                      {match && match[2] && (
                        <Typography component="span" sx={{marginLeft: "0.5em", fontSize: "0.8rem", color: altColorDark}}>
                          {match[2] && match[2].includes("Invalid Type:") ? (
                            <>Invalid Type: <strong>{match[2].match(/Invalid Type:\s*([^)]+)/)?.[1] || ""}</strong></>
                          ) : (
                            match[2]
                          )}
                        </Typography>
                      )}
                  </li>
                );
              } )}
            </ul>
          </React.Fragment>
        )) : ""}
      </DialogContent>
      <DialogActions sx={{
        background: "rgb(207, 211, 226)", 
        padding: "6px 10px", 
        display: "flex", 
        border: `1px solid ${messageColor}`, 
        borderTop:"none",
        borderBottomLeftRadius: "4px",
        borderBottomRightRadius: "4px"}}>
          
        {note && (
          noteWrap(note)  
        )}
          
        {((!message || message.length <= 0) && (!summary || summary.length<=0)) && (!note || note.length<=0) && (
          errorNote(errorNote)  
        )}
        
        <Button
          size="small"
          sx={{
            background: "white", 
            color: "#444a65",
            "&:hover": {
              backgroundColor: "#444a65",
              color: "white"
            }
          }}
          onClick={() => setShowMessage(false)}
          variant="contained"
          startIcon={<ClearIcon />}
          color="primary">
          Ok
        </Button>
      </DialogActions>
		</Dialog>
  )
}

export function EntityValidationMessage(props) {
  const {response, eValopen, setEValopen} = props
  console.debug('%c◉ EntityValidationMessage Inner Response  ', 'color:#00ff7b', response);
  let message = response?.results ?? response?.data ?? "No Response";
  let severity = message?.error ? "error" : "info";
  if (message?.error) message = message.error;
  if (response?.status === 202) message = "This Entity has been accepted for validation.";
  
  const handleClose = (event, reason) => reason !== 'clickaway' && setEValopen(false);
  
  return (
    <Snackbar
      sx={{ marginBottom: "20px" }}
      direction="up"
      autoHideDuration={5000}
      disableWindowBlurListener
      open={eValopen}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={handleClose}>
      <Alert
        className="eValSnackbar"
        variant="filled"
        severity={severity}
        sx={severity === "info" ? { backgroundColor: "#444a65" } : {}}
        onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}

// @TODO: Eventually unify the Snackbar Feedback across forms into one
// export function snackbarFeedback(props){
//   const {snackbarController, setSnackbarController, } = props
//   return(
//     {/* Snackbar Feedback*/}
//       <Snackbar 
//       </Snackbar>
//   );
// }

  // TODO: Move this into.... idk a Value/Calculation helper service/thing?
export function HexToHsl(hex){
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map(x => x + x).join('');
  const num = parseInt(hex, 16);
  let r = (num >> 16) & 255, g = (num >> 8) & 255, b = num & 255;
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min){ h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max){
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0; break;
    }
    h /= 6;
  }
  return {h: h * 360, s: s * 100, l: l * 100};
}
export function HslToHex(h, s, l){
  s /= 100; l /= 100;
  let c = (1 - Math.abs(2 * l - 1)) * s;
  let x = c * (1 - Math.abs((h / 60) % 2 - 1));
  let m = l - c / 2, r = 0, g = 0, b = 0;
  if (0 <= h && h < 60){ r = c; g = x; b = 0; }
  else if (60 <= h && h < 120){ r = x; g = c; b = 0; }
  else if (120 <= h && h < 180){ r = 0; g = c; b = x; }
  else if (180 <= h && h < 240){ r = 0; g = x; b = c; }
  else if (240 <= h && h < 300){ r = x; g = 0; b = c; }
  else if (300 <= h && h < 360){ r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b)
    .toString(16).slice(1).toUpperCase();
}
export function LightenHex(hex, amount = 15){
  let {h, s, l} = HexToHsl(hex);
  l = Math.min(100, l + amount); // Increase lightness by 'amount'
  return HslToHex(h, s, l);
}
export function DarkenHex(hex, amount = 15){
  let {h, s, l} = HexToHsl(hex);
  l = Math.max(0, l - amount); // Decrease lightness by 'amount', but not below 0
  return HslToHex(h, s, l);
}