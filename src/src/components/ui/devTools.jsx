import {useNavigate} from "react-router-dom";
import TableChartIcon from '@mui/icons-material/TableChart';
import {Typography} from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import DynamicFormIcon from '@mui/icons-material/DynamicForm';

// The SpeedDial tool being used for quick actions like Copy Form URL & Create Dataset (Admin quick access)
export function SpeedDialTooltipOpen() {
  let navigate = useNavigate();
  const actions = [
    { icon: <DynamicFormIcon />, name: 'Copy Form Prefil URL', action: (e) => HandleCopyFormUrl(e) },
    { icon: <TableChartIcon />, name: 'Create Dataset', action: () => navigate(`/new/datasetAdmin`) },
  ];
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  return (
    <Box sx={{ height: 320, transform: 'translateZ(0px)', flexGrow: 1, position: 'fixed', top: "80px", right: 0 }}>
      <SpeedDial
        ariaLabel="SpeedDial basic example"
        sx={{ position: 'absolute', top: 0, right: 16,/*  background:"#0080d009", borderRadius:"1.2em"*/ }}
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
    </Box>
  );
}

// Returns a small 
export function ViewDebug(values){
  let valList = []
  // console.debug('%c◉ values ', 'color:#00ff7b', values.data, typeof values.data);
  Object.entries(values.data).forEach(([key, value]) => {
    // console.debug(`%c${key}:`, 'color:#00ff7b', value);
    valList.push()
  })

  return(
    <Box 
      sx={{
        padding:"10px",
        position:"fixed",
        bottom:"0px",
        left:"50%",
        backgroundColor:"#00000020",
        color:"#000",
        width:"60%",
        maxHeight:"40vh",
        overflowY:"scroll",
        zIndex: 9999
      }}>
      {Object.entries(values.data).map(([key, value]) => (
        <Typography key={key} variant="caption" sx={{color:"#000"}}>{key}: {JSON.stringify(value)} | </Typography>
      ))}
    </Box>
  )
}

// Looks at the Bulk Selector Table and returns an array of  all Hubmap IDs
// Used in HandleCopyFormUrl to populate source_list
function getHubmapIDsFromBulkTable() {
  const wrapper = document.getElementById('bulkTableWrapper');
  if (!wrapper) return [];
  const table = wrapper.querySelector('table');
  if (!table) return [];
  // Select all first-column <a> elements in table rows
  const idLinks = table.querySelectorAll('tbody tr td:first-child a');
  // console.log("idLinks",idLinks);
  return Array.from(idLinks).map(a => a.textContent.trim());
}

// Gathers all of the Input fields on the page Plus some other data to generate a pre-fill URL
export function HandleCopyFormUrl() {
  // e.preventDefault();
  const url = new URL(window.location.origin + window.location.pathname);
  let formValues = document.querySelectorAll("input, textarea, select");
  // console.debug('%c◉ Found Inputs: ', 'color:#00ff7b',formValues );
  Object.entries(formValues).forEach(([key, value]) => {
    // console.debug('%c◉ formValues ', 'color:#00ff7b', value.id, value.type, value.value);
    if (value !== undefined && value !== null && value !== "" && value.type !== "checkbox" && value.id && value.value && !value.disabled) {
      url.searchParams.set(value.id, value.value);
    }
    else if (value.type === "checkbox" && value.checked ) {
      url.searchParams.set(value.id, value.checked === true ? "true" : "false");
    }
  });
  let sourceTable = getHubmapIDsFromBulkTable();
  if (sourceTable.length > 0) {
    url.searchParams.set("source_list", sourceTable.join(","));
  }
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
