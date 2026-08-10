import {useState} from "react";
import { toTitleCase } from "../../utils/string_helper";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import {NewBadge,SnackbarFeedback} from "../ui/formParts";
import {BulkEntitiesTable} from '../ui/bulkEntitiesTable';
import LinearProgress from '@mui/material/LinearProgress';
import {ingest_api_bulk_batch_id_status} from '../../service/ingest_api';

export const BulkEntityForm = (props) => {
  const [pageErrors] = useState(null);
  let docs ="https://docs.hubmapconsortium.org/bulk-registration/"+props.bulkType.toLowerCase()+"-bulk-reg.html"
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  let st

  const [tsvFile] = useState(null);
  let [TMError, setTMError] = useState(false);
  const [bulkRegistrationMessage, setBulkRegistrationMessage] = useState(null)

  const batchIsComplete = (status) => (['success','failed'].indexOf(status) !== -1)
  const getBatchIdStatus = () => {
    clearInterval(st);
    st = setInterval(() => {
      ingest_api_bulk_batch_id_status(
        `batches/${bulkRegistrationMessage.batchId}`,
      )
        .then((resp) => {
          if (batchIsComplete(resp.data.status) || batchIsComplete(bulkRegistrationMessage?.batch?.status)) {
            // STOP checking the status all is complete
            clearInterval(st)
            return 
          }
          let cssBadge;
          switch(resp?.data?.status) {
            case 'success':
              cssBadge = 'VALID';
              break;
            case 'failed': 
              cssBadge = 'ERROR';
              break;
            default:
              cssBadge = 'PROCESSING';
              break;
          }
          setBulkRegistrationMessage({...bulkRegistrationMessage, cssBadge, batch: resp?.data})
        })
        .catch((error) => {});
    }, 3000); //every 3 seconds
  };

  if (bulkRegistrationMessage?.batchId && !batchIsComplete(bulkRegistrationMessage?.batch?.status)) {
    getBatchIdStatus()
  }

  const defaultStatus = "NEW"
  const currentStatus = bulkRegistrationMessage?.cssBadge ? bulkRegistrationMessage.cssBadge : defaultStatus

  return(
    <Box>
      <Grid container className="mb-3 mt-3" spacing={1}>
        <Grid size="auto" className="topHeader" >
            {NewBadge(props.bulkType, true, currentStatus)}
            <h3 style={{margin: "4px 5px", display: "inline-table", width:"100%",verticalAlign: "bottom"}}>{`Bulk ${toTitleCase(props.bulkType)}s`}<br/></h3>
        </Grid>
        {!bulkRegistrationMessage && <Grid size={8} className="">
          <Typography variant="caption" style={{ display: "inline-block", fontSize: "" }}>
            To bulk register multiple {props.bulkType.toLowerCase()}s at one time, upload a tsv file here in the format specified by this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${props.bulkType.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>. Include one line per {props.bulkType.toLowerCase()} to register. {toTitleCase(props.bulkType)} metadata must be provided separately. <br />
            See the <a href={docs} target="_blank">{toTitleCase(props.bulkType)} Bulk Registration</a> page for further details.<br/>
            <span className={TMError ? "rowLimitClass error" : "rowLimitClass"}><strong> There is a 40 row limit on uploaded files.</strong></span><br />
          </Typography>
        </Grid>}
        {bulkRegistrationMessage && <div style={{width: '70%'}}>
          <Alert severity={bulkRegistrationMessage.status || 'success'}>{bulkRegistrationMessage.body}</Alert>
          <p><small>You may view the status of all registrations at the <a href="/bulk/dashboard">Submitted Registrations</a> page.</small></p>
          {bulkRegistrationMessage.batch && ['running', 'partial'].indexOf(bulkRegistrationMessage.batch?.status) !== -1 && <LinearProgress aria-label="Bulk status ..." />}
        </div>}
      </Grid>

      {/* Wizard */}
      <BulkEntitiesTable
        tsvfile={tsvFile}
        type={props.bulkType}
        setBulkRegistrationMessage={setBulkRegistrationMessage}
        // columns={columns}
        onDataChange ={({data, errors})=>{
          console.debug('%c◉ onDataChange ', 'background:#D000FF', data, errors);
          if(errors[0]?.name === "Too Many"){
            setTMError(true);
          }else{
            setTMError(false);
          }
        }}
      />

      {pageErrors && (
        <Alert variant="filled" severity="error" className="pageErrors">
          <strong>Error:</strong> {JSON.stringify(pageErrors)}
        </Alert>
      )}
      <SnackbarFeedback snackbarController={snackbarController} setSnackbarController={setSnackbarController}/>
    </Box>
  );

}
