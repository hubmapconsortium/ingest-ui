import {useState} from "react";
import { toTitleCase } from "../../utils/string_helper";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import {NewBadge,SnackbarFeedback} from "../ui/formParts";
import {BulkEntitiesTable} from '../ui/bulkEntitiesTable';

export const BulkEntityForm = (props) => {
  const [pageErrors] = useState(null);
  let docs ="https://docs.hubmapconsortium.org/bulk-registration/"+props.bulkType.toLowerCase()+"-bulk-reg.html"
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "", 
    status: "info"
  });

  const [tsvFile] = useState(null);
  let [TMError, setTMError] = useState(false);
  return(
    <Box>
      <Grid container className="mb-3 mt-3" spacing={1}>
        <Grid item className="topHeader" > 
            {NewBadge(props.bulkType,"new")}
            <h3 style={{margin: "4px 5px", display: "inline-table",verticalAlign: "bottom"}}>{`Bulk ${toTitleCase(props.bulkType)}s`}<br/></h3>
        </Grid>
        <Grid item xs={8} className="">
          <Typography variant="caption" style={{ display: "inline-block", fontSize: "" }}>
            To bulk register multiple {props.bulkType.toLowerCase()}s at one time, upload a tsv file here in the format specified by this <a href={`https://raw.githubusercontent.com/hubmapconsortium/ingest-ui/main/src/src/assets/Documents/example-${props.bulkType.toLowerCase()}-registrations.tsv`} target='_blank' rel="noreferrer">Example TSV File</a>. Include one line per {props.bulkType.toLowerCase()} to register. {toTitleCase(props.bulkType)} metadata must be provided separately. <br />
            See the <a href={docs} target="_blank">{toTitleCase(props.bulkType)} Bulk Registration</a> page for further details.<br/>
            <span className={TMError ? "rowLimitClass error" : "rowLimitClass"}><strong> There is a 40 row limit on uploaded files.</strong></span><br />
          </Typography>
        </Grid>
      </Grid>

      {/* Wizard */}
      <BulkEntitiesTable 
        tsvfile={tsvFile}
        type={props.bulkType}
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