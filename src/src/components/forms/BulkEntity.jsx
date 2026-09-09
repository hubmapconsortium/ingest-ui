import {useEffect, useState, useRef} from "react";
import { toTitleCase } from "../../utils/string_helper";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import {NewBadge,SnackbarFeedback} from "../ui/formParts";
import {BulkEntitiesTable} from '../ui/bulkEntitiesTable';
import LinearProgress from '@mui/material/LinearProgress';
import {ingest_api_bulk_batch_id_status} from '../../service/ingest_api';
import { batchStatusBadge } from "../ui/BulkRegistrationsDashboard";
import { logger } from "../../utils/logger";

export const BulkEntityForm = (props) => {
  const [pageErrors] = useState(null);
  let docs ="https://docs.hubmapconsortium.org/bulk-registration/"+props.bulkType.toLowerCase()+"-bulk-reg.html"
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "",
    status: "info"
  });
  const intervalId = useRef(null)

  const [tsvFile] = useState(null);
  let [TMError, setTMError] = useState(false);
  const [bulkRegistrationMessage, setBulkRegistrationMessage] = useState(null)

  const batchIsComplete = (completedAt) => completedAt !== null && completedAt !== undefined

  const seconds = 5

  const getBatchIdStatus = () => {
    ingest_api_bulk_batch_id_status(
      `batches/${bulkRegistrationMessage.batchId}`,
    )
      .then((resp) => {
        const hasAlreadyCompletedStatus = batchIsComplete(bulkRegistrationMessage?.batch?.completed_at)
        const isComplete = batchIsComplete(resp?.data?.completed_at) || hasAlreadyCompletedStatus
        if (isComplete) {
          // STOP checking the status because all is complete
          clearInterval(intervalId.current)
          if (hasAlreadyCompletedStatus) {
            // don't make anymore state updates, return
            return 
          }
        }
        if (bulkRegistrationMessage?.batch?.status !== resp?.data.status || isComplete) {
          setBulkRegistrationMessage({...bulkRegistrationMessage, batch: resp?.data})
        }
        
      })
      .catch((error) => {
        console.error('BulkEntity.Error', error)
      });
  };

  useEffect(() => {
    if (bulkRegistrationMessage?.batchId && !batchIsComplete(bulkRegistrationMessage?.batch?.completed_at)) {
      intervalId.current = setInterval(() => {
        getBatchIdStatus()
      }, 1000 * seconds); //every 5 seconds
      getBatchIdStatus() // run immediately so the progress bar gets shown on change
    }
    return () => clearInterval(intervalId.current);
  }, [bulkRegistrationMessage])

  const badge = batchStatusBadge(bulkRegistrationMessage?.batch?.status)

  return(
    <Box>
      <Grid container className="mb-3 mt-3" spacing={1}>
        <Grid size="auto" className="topHeader" >
            {NewBadge(props.bulkType, true, badge.cssBadge, badge.status)}
            <h3 style={{margin: "4px 5px", display: "inline-table", width:"100%",verticalAlign: "bottom"}}>{`Bulk ${toTitleCase(props.bulkType)}s`}<br/></h3>
        </Grid>
        {!bulkRegistrationMessage && <Grid size={8} className="">
          <Typography variant="caption" style={{ display: "inline-block", fontSize: "" }}>
            To bulk register multiple {props.bulkType.toLowerCase()}s at one time, upload a tsv file here in the format specified by this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${props.bulkType.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>. Include one line per {props.bulkType.toLowerCase()} to register. {toTitleCase(props.bulkType)} metadata must be provided separately. <br />
            See the <a href={docs} target="_blank">{toTitleCase(props.bulkType)} Bulk Registration</a> page for further details.<br/>
            <br />
          </Typography>
        </Grid>}
        {bulkRegistrationMessage && <div style={{width: '70%'}}>
          <Alert severity={bulkRegistrationMessage.status || 'success'}>{bulkRegistrationMessage.body}</Alert>
          <p className="mt-3">You may view <span><a href={`/bulk/dashboard?batchId=${bulkRegistrationMessage.batchId}`}>the status of this request</a></span> and all other bulk registrations at the <a href="/bulk/dashboard">Submitted Registrations</a> page.</p>
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
          logger.debug('%c◉ onDataChange ', 'background:#D000FF', data, errors);
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
