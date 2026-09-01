import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { logger } from "./logger";

// Creates a new error object with the given message
export const BuildError = (message) => {
  var newError;
  if (message?.message) {
    // If it IS aleady an error object, just return it
    newError = message;
  } else {
  }
  // Else, let's make it one
  newError = new Error(message);
  return newError;
};

export const FormatError = (message) => {
  var newError;
  if (message.message) {
    newError = new Error(message.message);
  }
  if (message.status && message.status > 200) {
    // probably looks like
    // {"status": 400, "results": {"error": "400 Bad Request: The provided status value of Dataset is not valid"}}
    if (message.data) {
      newError = new Error(message.data);
    } else if (message.results) {
      newError = new Error(message.results);
    }
  } else {
    // Else, let's make it one
    newError = new Error(message);
  }
  return newError;
};

export const RenderPageError = (errorObj) => {
  if (!errorObj) return null;
  let error = typeof errorObj === "string" ? { message: errorObj } : errorObj;
  return (
    <Alert variant="filled" severity="error" sx={{ whiteSpace: "pre-line" }}>
      <AlertTitle>Error</AlertTitle>
      <strong>{error.message || ""}</strong>
      <ul style={{ margin: "0.5em 0 0 1.5em", padding: 0 }}>
        {error.status && (
          <li>
            Status: <strong>{error.status}</strong>
          </li>
        )}
        {error.code && (
          <li>
            Code: <strong>{error.code}</strong>
          </li>
        )}
        {error.name && (
          <li>
            Name: <strong>{error.name}</strong>
          </li>
        )}
        {error.config?.method && (
          <li>
            Method: <strong>{error.config.method.toUpperCase()}</strong>
          </li>
        )}
        {error.config?.url && (
          <li>
            URL: <strong>{error.config.url}</strong>
          </li>
        )}
      </ul>
      {error.stack && (
        <details style={{ marginTop: "0.5em" }}>
          <summary>Stack Trace</summary>
          <pre style={{ fontSize: "0.8em", maxHeight: 120, overflow: "auto" }}>
            {error.stack.split("\n").slice(0, 5).join("\n")}
            {error.stack.split("\n").length > 5 ? "\n..." : ""}
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
};

export const getErrorList = (details) => {
  logger.debug("%c⊙ getErrorList", "color:#008000", details);
  let data = [];
  let { description, name } = details.code
    ? details
    : { description: details.message, name: "Truncated Error:" };
  try {
    let keyedErrors;
    if (description) {
      keyedErrors =
        description["Preflight"] ||
        description["Validation Errors"] ||
        description["URL Errors"] ||
        description["Request Errors"];
    } else {
      keyedErrors = name;
    }
    const errorMessageFormat = (err) => {
      let results = [];
      if (typeof err === "object") {
        for (let key in err) {
          results.push({ error: `${key}: ${err[key]}` });
        }
      } else {
        results.push({ error: err });
      }
      return results;
    };
    let err = keyedErrors ? keyedErrors : details;
    if (Array.isArray(err)) {
      if (err.length) {
        // Is it already formatted?
        if (err[0].error) {
          data = err;
        } else {
          // No, let's run through the list and format for the table.
          for (let item of err) {
            data = data.concat(errorMessageFormat(item));
          }
        }
      }
    } else {
      data = errorMessageFormat(err);
    }
  } catch (e) {
    logger.all.error({ message: "getErrorList", error_details: e });
  }
  return { data, columns: tableColumns() };
};

const handleErrorRow = (row) => {
  let err = row.error;
  if (typeof row.error === "object") {
    err = err.msg;
    if (row.error.data) {
      const jsonStr = JSON.stringify(row.error.data);
      err += " http://local/api/json?view=" + jsonStr;
    }
  }
  return err;
};
export const tableColumns = (d = '"') => [
  {
    name: "row",
    selector: (row) => row.row,
    sortable: true,
    width: "100px",
  },
  {
    name: "error",
    selector: (row) => {
      let err = handleErrorRow(row);
      return row.column ? ` "${row.column}" ` + err : err;
    },
    sortable: true,
    format: (row) => {
      const formatError = (val) =>
        val
          .replaceAll(" " + d, " <code>")
          .replaceAll(' "', " <code>")
          .replaceAll(d, "</code>")
          .replaceAll('"', "</code>");
      // const formatError = (val);
      let err = handleErrorRow(row);
      err = formatError(err);
      return err;
      // return <span dangerouslySetInnerHTML={{__html: urlify(err)}} />
    },
  },
];

export function parseErrorMessage(err) {
  logger.debug("%c⊙parseErrorMessage", "color:#008000", err);
  var formattingMessage = err;
  try {
    if (err["error"]) {
      formattingMessage = err["error"].split(":"); // parse out the : which separates the error number and message
    }
    return formattingMessage;
  } catch {
    logger.all.error({ message: "parseErrorMessage", error_details: err });
  }
  return err;
}

export const ParseRegErrorFrame = (errResp) => {
  var parsedError;
  if (typeof err === "object" && typeof errResp[0] === "object") {
    logger.debug("%c◉ ParseRegErrorFrame OBK ERR FOUND ", "color:#008000");
  }
  if (errResp.results && errResp.results.data && errResp.results.data.data) {
    parsedError = parseErrorMessage(errResp.results.data.data);
  } else if (errResp.results && errResp.results.data) {
    parsedError = parseErrorMessage(errResp.results.data);
  } else if (errResp.results && errResp.results.data) {
    parsedError = parseErrorMessage(errResp.results.data);
  } else if (errResp.status && errResp.data) {
    parsedError = parseErrorMessage(errResp.data);
  } else {
    let regErrorSet = {};
    if (errResp.err && errResp.err.response.data) {
      regErrorSet = errResp.err.response.data;
    } else if (errResp.error && errResp.error.response.data) {
      regErrorSet = errResp.error.response.data;
    } else if (errResp.data) {
      regErrorSet = errResp;
    } else {
      regErrorSet = errResp;
    }
    var errMessage = regErrorSet.status;
    parsedError = errResp;
  }

  this.handleErrorCompiling(parsedError); // Error Array's set in that not here
  this.setState({
    error_status: true,
    submit_error: true,
    error_message: errMessage,
    success_message: null,
    submitting: false,
    response_status: errResp.Error,
  });
  logger.debug("ParseRegErrorFrame", this.state.error_message_detail);
  this.setState({ loading: false }, () => {});
};

export function TableErrorRowProcessing(errorsArray) {
  // Build a normalized error set: ensure we operate on strings
  const errorSet = errorsArray.map((item) => {
    const message =
      typeof item === "string" ? item : item && item.error ? item.error : "";
    const msgStr = String(message || "");

    // Row #
    const rowMatch = msgStr.match(/Row Number:\s*(\d+)\./i);
    let trimMsg = msgStr.replace(/Row Number:\s*\d+\./gi, ""); // Nix "Row N" from message
    // Sometimes the error lists "sample type" instead of "sample_category".
    // Until this is fixes in the API, let's do a simple replace
    trimMsg = trimMsg.replace(/sample type/gi, "sample_category");
    const eRow = (rowMatch ? parseInt(rowMatch[1], 10) : null) + 1;

    // Consolidated regex patterns — try each in order and return on first match
    // See def validate_samples in app.py on ingest-api for source of these patterns
    // https://github.com/hubmapconsortium/ingest-api/blob/29470ffe4e4521e8c57724d27b672d48ecc9cef9/src/app.py#L3117
    const samplePatterns = [
      // Is Isnt To be or not
      // [COL] is a required header
      {
        name: "requiredMatch",
        regex: /\b([A-Za-z0-9_]+)\s+is\s+a\s+required\s+header\b/i,
      },
      // [COL] is a required filed
      {
        name: "requiredFieldMatch",
        regex: /\b([A-Za-z0-9_]+)\s+is\s+a\s+required\s+field\b/i,
      },
      // [COL] field is not blank
      {
        name: "blankCheck",
        regex: /\b([A-Za-z0-9_]+)\s+field\s+is\s+not\s+blank,\b/i,
      },
      // [COL] is not a valid
      {
        name: "notValidMatch",
        regex: /\b([A-Za-z0-9_]+)\s+is\s+not\s+a\s+valid\b/i,
      },
      // [COL] is not an accepted field
      {
        name: "notAcceptedMatch",
        regex: /\b([A-Za-z0-9_]+)\s+is\s+not\s+an\s+accepted\s+field\b/i,
      },

      // Musts
      // [COL] must be
      { name: "mustBeMatch", regex: /\b([A-Za-z0-9_]+)\s+must\b/i },
      // [COL] field must
      { name: "fieldMustMatch", regex: /\b([A-Za-z0-9_]+)\s+field\s+must\b/i },
      // [COL] value Must Be
      {
        name: "valueMustBeMatch",
        regex: /\b([A-Za-z0-9_]+)\s+value\s+must\b/i,
      },
      // [COL] must either be of the format
      {
        name: "formatMatch",
        regex: /\b([A-Za-z0-9_]+)\s+must\s+either\s+be\s+of\s+the\s+format\b/i,
      },
      // [COL] must be fewer than
      {
        name: "fewerThanMatch",
        regex: /\b([A-Za-z0-9_]+)\s+must\s+be\s+fewer\s+than\b/i,
      },

      // Can Nots
      // [COL] can not be
      { name: "canNotBeMatch", regex: /\b([A-Za-z0-9_]+)\s+can\s+not\s+be\b/i },
      // [COL] cannot be
      {
        name: "canNotBeConjMatch",
        regex: /\b([A-Za-z0-9_]+)\s+cannot\s+be\b/i,
      },

      // Misc
      // verify [COL] exists
      { name: "verifyColMatch", regex: /\b([A-Za-z0-9_]+)\s+exists\b/i },
      // [COL] field
      { name: "fieldMatch", regex: /\b([A-Za-z0-9_]+)\s+field\b/i },
    ];

    for (const p of samplePatterns) {
      const m = trimMsg.match(p.regex);
      if (m) {
        return {
          column: m[1] || "",
          error: trimMsg,
          row: eRow ? eRow : "",
        };
      }
    }
  });
  return errorSet;
}

export function ParseBadJSON(jsonString) {
  let trimmed = jsonString.slice(1, -1);
  // Split on '}, {' and add braces back, then replace 'value "" fails' with 'empty value fails'
  let arr = trimmed.split(/},\s*{/).map((s, i, allArr) => {
    let objStr = i === 0 ? s + "}" : "{" + s + "}";
    // If last element and ends with '}}', trim to '}'
    if (i === allArr.length - 1 && objStr.endsWith("}}")) {
      objStr = objStr.replace(/}}+$/, "}");
    }
    // Replace 'value "" fails' with 'empty value fails'
    objStr = objStr.replace(/value "" fails/g, "empty value fails");
    // Escape inner double quotes in value fields (e.g., value "gallons" fails)
    objStr = objStr.replace(/value "([^"]+)" fails/g, (match, p1) => {
      return 'value \\"' + p1 + '\\" fails';
    });
    return objStr;
  });
  let arrArray = [];
  arr.forEach((objStr) => {
    if (
      objStr.includes('empty value fails because of error "missingRequired"')
    ) {
      // Parse the string to get column and row
      let colMatch = objStr.match(/"column"\s*:\s*"([^"]+)"/);
      let rowMatch = objStr.match(/"row"\s*:\s*(\d+)/);
      arrArray.push({
        column: colMatch ? colMatch[1] : "",
        error: "An Empty value is not allowed",
        row: rowMatch ? parseInt(rowMatch[1], 10) : null,
      });
    } else {
      // Try to parse the string as JSON
      try {
        // Strip out all escaped double quotes before parsing
        let cleanStr = objStr.replace(/\\"/g, "");
        // Remove quotes around error value in 'fails because of error "..."'
        cleanStr = cleanStr.replace(
          /fails because of error "([^"]+)"/g,
          "fails because of error $1",
        );
        // Remove unescaped newlines and carriage returns (control characters)
        cleanStr = cleanStr.replace(/[\r\n]+/g, " ");
        logger.debug("%c◉ Cleaned JSON string: ", "color:#008000", cleanStr);
        let obj = JSON.parse(cleanStr);
        arrArray.push(obj);
      } catch (e) {
        // Fallback: add as raw string
        logger.debug("%c◉ JSON Parse row fail: ", "color:#008000", e, objStr);
        arrArray.push({ error: objStr });
      }
    }
  });
  return arrArray;
}
