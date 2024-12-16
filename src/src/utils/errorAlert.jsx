import React, { useEffect, useState  } from "react";
import Alert from '@mui/material/Alert';
// @TODO: Function components like this cant be loaded into any of the class components
// Once upgraded they'll be able to use this

export const RenderError = (props) => {
  var [errorMSG, setErrorMSG] = useState(true);
    useEffect(() => {
        console.debug("USEEFFECT",props.errorMSG);
        setErrorMSG(props.error);
    },  [props.error, props.errorMSG]);
     console.debug("RenderError",errorMSG );
     if(errorMSG){
         var errorString = "";
        typeof errorMSG.type === 'string' ? errorString = "Error on Search" : errorString = errorMSG
        return (
            <div>
              <Alert severity="error" variant="filled">{errorString}</Alert>
            </div>
          )
     }else{ return (<div></div> ) }

      
  }
  

