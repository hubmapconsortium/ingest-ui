import { useEffect, useState } from "react";
import Alert from '@mui/material/Alert';

function getNestedError(error) {
  let nestedError = error;
  const visited = new Set();

  while (nestedError?.error && !visited.has(nestedError)) {
    visited.add(nestedError);
    nestedError = nestedError.error;
  }

  return nestedError;
}

function getMessageFromValue(value) {
  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) return null;

    try {
      const parsedValue = JSON.parse(trimmedValue);
      if (parsedValue !== trimmedValue) {
        return getMessageFromValue(parsedValue);
      }
    } catch {
      // Plain-text API responses are already usable messages.
    }

    return trimmedValue;
  }

  if (!value || typeof value !== "object") return null;

  const candidates = [
    value.message,
    value.error,
    value.detail,
    value.description,
    value.title,
  ];

  for (const candidate of candidates) {
    const message = getMessageFromValue(candidate);
    if (message) return message;
  }

  return null;
}

function getErrorMessage(error) {
  const nestedError = getNestedError(error);
  const readValue = (reader) => {
    try {
      return reader();
    } catch {
      return null;
    }
  };
  const candidates = [
    readValue(() => nestedError?.response?.data),
    readValue(() => nestedError?.request?.response),
    readValue(() => nestedError?.request?.responseText),
    readValue(() => nestedError?.request?.statusText),
    readValue(() => nestedError?.data),
    readValue(() => nestedError?.cause),
    readValue(() => nestedError?.message),
    typeof nestedError === "string" ? nestedError : null,
  ];

  for (const candidate of candidates) {
    const message = getMessageFromValue(candidate);
    if (message) return message;
  }

  return null;
}

function stringifyError(error) {
  const visited = new WeakSet();

  return JSON.stringify(error, (key, value) => {
    if (/authorization|token|cookie|secret|password/i.test(key)) {
      return "[Redacted]";
    }
    if (typeof value === "object" && value !== null) {
      if (visited.has(value)) return "[Circular]";
      visited.add(value);
    }
    return value;
  }, 2);
}

export function getSampleGenerationError(error) {
  const nestedError = getNestedError(error);
  const status = nestedError?.status ?? nestedError?.response?.status;

  if (status === 504) {
    return {
      title: "Sample generation is taking longer than expected",
      userMessage: "The server did not finish responding in time, but the samples may still have been created. Before trying again, wait a moment and check Search for the new samples to avoid creating duplicates.",
    };
  }

  const userMessage = getErrorMessage(error);
  return {
    title: "Error:",
    ...(userMessage
      ? {userMessage}
      : {formattedDetails: stringifyError(nestedError) || String(error)}),
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
