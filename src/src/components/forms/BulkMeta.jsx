import {useState} from "react";
import { toTitleCase } from "../../utils/string_helper";
import Box from "@mui/material/Box";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from "@mui/material/Alert";
import {NewBadge,SnackbarFeedback} from "../ui/formParts";
import {BulkMetaTable} from '../ui/bulkMetaTable';

export const BulkMetaForm = (props) => {
  const [pageErrors] = useState(null);
  let [snackbarController, setSnackbarController] = useState({
    open: false,
    message: "", 
    status: "info"
  });
  let tsvURL = `https://raw.githubusercontent.com/hubmapconsortium/dataset-metadata-spreadsheet/main/sample-${props.type.toLowerCase()}/latest/sample-${props.type.toLowerCase()}.tsv`
  let docURL = `https://hubmapconsortium.github.io/ingest-validation-tools/sample-${props.type.toLowerCase()}/current/`

  const [tsvFile] = useState(null);
  let [TMError, setTMError] = useState(false);
  return(
    <Box>
      <Grid container className="mb-3 mt-3" >
        <Grid item xs={4} className="topHeader" > 
            {NewBadge(props.type,"new")}
            <h3 style={{margin: "4px 5px", display: "inline-table",verticalAlign: "bottom"}}>{`Bulk ${toTitleCase(props.type)}s`}<br/></h3>
        </Grid>
        <Grid item xs={8} className="">
          <Typography variant="caption" style={{ display: "inline-block", fontSize: "" }}>
            To bulk register section metadata, upload your tsv file here. Please refer to the format specified in this <a href={tsvURL} target='_blank' rel="noreferrer">Example TSV File</a>. For further details, please see the <a href={docURL} target='_blank' rel="noreferrer">Metadata Upload Documentation</a> for sections.<br />
            <span className={TMError ? "rowLimitClass error" : "rowLimitClass"}><strong> There is a 40 row limit on uploaded files.</strong></span><br />
          </Typography>
        </Grid>
      </Grid>

      {/* Wizard */}
      <BulkMetaTable 
        tsvfile={tsvFile}
        type={props.type}
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