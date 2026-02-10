
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';

// Creates a new error object with the given message
export const BuildError = (message) => {
    var newError;
    if(message?.message){
        // If it IS aleady an error object, just return it
        newError = message;
    }else{}
    // Else, let's make it one
        newError = new Error(message);
    return (
        newError
    )
}

export const FormatError = (message) => {
    var newError;
    if(message.message){
        newError = new Error(message.message);
    }
    if(message.status && message.status >200){
        // probably looks like
        // {"status": 400, "results": {"error": "400 Bad Request: The provided status value of Dataset is not valid"}}
        if(message.data ){
            newError = new Error(message.data);
        }else if(message.results){
            newError = new Error(message.results);
        }
    } else {
        // Else, let's make it one
        newError = new Error(message);
    }
    return (newError)
}

export const RenderPageError = (errorObj) => {
  if (!errorObj) return null;
  let error = typeof errorObj === "string" ? { message: errorObj } : errorObj;
  return (
    <Alert variant="filled" severity="error" sx={{ whiteSpace: "pre-line" }}>
      <AlertTitle>Error</AlertTitle>
      <strong>{error.message || ""}</strong>
      <ul style={{ margin: "0.5em 0 0 1.5em", padding: 0 }}>
        {error.status && <li>Status: <strong>{error.status}</strong></li>}
        {error.code && <li>Code: <strong>{error.code}</strong></li>}
        {error.name && <li>Name: <strong>{error.name}</strong></li>}
        {error.config?.method && <li>Method: <strong>{error.config.method.toUpperCase()}</strong></li>}
        {error.config?.url && <li>URL: <strong>{error.config.url}</strong></li>}
      </ul>
      {error.stack && (
        <details style={{ marginTop: "0.5em" }}>
          <summary>Stack Trace</summary>
          <pre style={{ fontSize: "0.8em", maxHeight: 120, overflow: "auto" }}>
            {error.stack.split('\n').slice(0, 5).join('\n')}
            {error.stack.split('\n').length > 5 ? "\n..." : ""}
          </pre>
        </details>
      )}
      {!error.stack && (
        <pre style={{ fontSize: "0.8em", maxHeight: 120, overflow: "auto" }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
    </Alert>
  );
}

export const getErrorList = (details) => {
    console.debug('%c⊙ getErrorList', 'color:#00ff7b', details);
    let data = []
    let {code, description, name} = details.code ? details : {code: 500, description: details.message, name: "Truncated Error:"}
    try {
        let keyedErrors
        if(description){
            keyedErrors = description['Preflight'] || description['Validation Errors'] || description['URL Errors'] || description['Request Errors']
        }else{
            keyedErrors = name
        }
        const errorMessageFormat = (err) => {
            let results = []
            if (typeof err === 'object') {
                for (let key in err) {
                    results.push({error: `${key}: ${err[key]}`})
                }
            } else {
                results.push({error: err})
            }
            console.debug('%c⊙ errorMessageFormat', 'color:#00ff7b', results );
            return results
        }
        let err = keyedErrors ? keyedErrors : details
        console.debug('%c⊙err keyedErrors check', 'color:#00ff7b', err );
        if (Array.isArray(err)) {
            if (err.length) {
                // Is it already formatted?
                if (err[0].error) {
                    data = err
                } else {
                    // No, let's run through the list and format for the table.
                    for (let item of err) {
                        data = data.concat(errorMessageFormat(item))
                    }
                }
            }
            console.debug('%c⊙data ISARRAY', 'color:#00ff7b', data );
        } else {
            data = errorMessageFormat(err)
            console.debug('%c⊙ ISNOTARRAY', 'color:#00ff7b', data );
        }
        console.debug('Metadata errors', data)
    } catch (e) {
        console.debug('%c⭗ CATGHT e', 'color:#ff005d', e );
        console.error(e)
    }
    console.debug('%c⊙ getErrorList DATA', 'color:#00ff7b', data );
    return {data, columns: tableColumns()}
};

const handleErrorRow = (row) => {
    let err = row.error
    if (typeof row.error === 'object') {
        err = err.msg
        if (row.error.data) {
            const jsonStr = JSON.stringify(row.error.data);
            err += ' http://local/api/json?view='+(jsonStr)
        }
    }
    return err
}
export const tableColumns = (d = '"') => [{
        name: 'row',
        selector: row => row.row,
        sortable: true,
        width: '100px',
    },{
        name: 'error',
        selector: row => {
            let err = handleErrorRow(row)
            return row.column ? ` "${row.column}" ` + err : err
        },
        sortable: true,
        format: (row) => {
            const formatError = (val) => val.replaceAll(' '+d, ' <code>').replaceAll(' "', ' <code>').replaceAll(d, '</code>').replaceAll('"', '</code>')
            // const formatError = (val);
            let err = handleErrorRow(row)
            err = formatError(err)
            return err
            // return <span dangerouslySetInnerHTML={{__html: urlify(err)}} />
        }
    }
]


export function parseErrorMessage(err) {
console.debug('%c⊙parseErrorMessage', 'color:#00ff7b', err );
var formattingMessage = err;
try { 
  if(err["error"]){
    console.debug('%c⊙', 'color:#00ff7b', "err has err" );
      formattingMessage = err["error"].split(":");   // parse out the : which separates the error number and message
    }else if(err.data){
      console.debug('%c⊙ErrData', 'color:#00ff7b', err.data );
    }
    // console.log('parseErrorMessageerror ', l, (1)[1])\
    console.debug('%c⭗parseErrorMessageerror', 'color:#A200FF', 1, (1)[1], err, );
     return formattingMessage
  } catch {
    console.debug('%c⊙parseErrorMessage CATCH', 'color:#ff005d', err );
  }
 return err
}

export const ParseRegErrorFrame = (errResp) => {
  var parsedError;
  
  if(errResp.results && errResp.results.data && errResp.results.data.data){
    parsedError = parseErrorMessage(errResp.results.data.data);
  }else if(errResp.results && errResp.results.data){
    parsedError = parseErrorMessage(errResp.results.data);
  }else if(errResp.results && errResp.results.data){
    parsedError = parseErrorMessage(errResp.results.data);
  }else if(errResp.status && errResp.data){
    parsedError = parseErrorMessage(errResp.data);
  }else{
    let regErrorSet ={}
    if(errResp.err && errResp.err.response.data){
      regErrorSet = errResp.err.response.data 
    }else if(errResp.error && errResp.error.response.data){
      regErrorSet = errResp.error.response.data 
    }else if(errResp.data){
      regErrorSet = errResp 
    }else{
      regErrorSet = errResp
    }
    // var errRows = regErrorSet.data;
    var errRows = regErrorSet.map(g => {
      return g.message
    })
    var errMessage = regErrorSet.status;
    parsedError=errResp;
  }

  this.handleErrorCompiling(parsedError); // Error Array's set in that not here
  this.setState({ 
    error_status:   true, 
    submit_error:   true, 
    error_message:  errMessage,
    success_message:null,
    submitting:     false,
    response_status:errResp.Error
  });
  console.debug("DEBUG",this.state.error_message_detail);
  this.setState({loading:false,}, () => {   
  });
}
