import { useEffect, useState } from "react";
import Alert from '@mui/material/Alert';
// @TODO: Function components like this cant be loaded into any of the class components
// Once upgraded they'll be able to use this

export function getSampleGenerationError(error) {
  const status = error?.status
    ?? error?.response?.status
    ?? error?.error?.status
    ?? error?.error?.response?.status;

  if (status !== 504) return null;

  return {
    title: "Sample generation is taking longer than expected",
    userMessage: "The server did not finish responding in time, but the samples may still have been created. Before trying again, wait a moment and check Search for the new samples to avoid creating duplicates.",
  };
}

export const RenderError = (props) => {
  var [errorMSG, setErrorMSG] = useState(true);
  useEffect(() => {
    console.debug("USEEFFECT", props.errorMSG);
    setErrorMSG(props.error);
  }, [props.error, props.errorMSG]);

  console.debug("RenderError", errorMSG);
  if (errorMSG) {
    var errorString = "";
    typeof errorMSG.type === 'string'
      ? (errorString = "Error on Search")
      : (errorString = errorMSG);
    return (
      <div>
        <Alert severity="error" variant="filled">{errorString}</Alert>
      </div>
    );
  } else {
    return <div></div>;
  }
};
