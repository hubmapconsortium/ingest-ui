

import React, { useEffect, useState  } from "react";
// import Select from '@mui/material/Select';import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';


export const RenderError = (props) => {
  var [errorMSG, setErrorMSG] = useState(true);
    useEffect(() => {
        console.debug("USEEFFECT",props.errorMSG);
        setErrorMSG(props.error);
    },  [props.error, props.errorMSG]);
     console.debug("RenderError",errorMSG );
     if(errorMSG){
        typeof errorMSG.type === 'string' ? errorMSG = "Error on Search" : errorMSG = errorMSG
        return (
            <div>
              <Alert severity="error" variant="filled">{errorMSG}</Alert>
            </div>
          )
     }else{ return (<div></div> ) }

      
  }
  

