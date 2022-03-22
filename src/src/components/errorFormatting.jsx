
export class APIError extends Error {}

function getErrorMessageFromResponseBody( string ) {
    let errorString = string
    try {
      let json = JSON.parse(string)
      if(json.errors) {
        errorString = json.errors[0].msg
      }
    } catch ( parseOrAccessError ) {
        //console.debug("parseOrAccessError", parseOrAccessError);
    }
    return errorString
  }


function formatErrorForRender( error ) {
    var errResponse;
    if (error.response) {
      var errString;
      // The request was made and the server responded with a status code
        // console.debug("error Responmse", error.response);
        // that falls out of the range of 2xx
        // MOST LIKELY FROM ES
        // Let's check, eventually have an ES Error type?
        if(error.response.data.error.root_cause[0]){
          var rootError = error.response.data.error.root_cause[0]
          var target = error.target;
          var reason = rootError.reason;
          var status = error.response.status;
          var statusText = error.response.statusText;
          var esErrType = rootError.type;
          var errIndex = [rootError.index, rootError.index_uuid];
          var errMessage = "Source: Elastic Search, Type: "+esErrType+", Reason: "+reason+", StatusText: "+statusText+", Target: "+target+", Index: ["+rootError.index+", "+rootError.index_uuid+"]";
          var errJSON = {
            status: status,
            message:errMessage,
          }
          errString = JSON.stringify(errJSON);
        }else{
          errString = error.response.data.error;
        }
        errResponse = errString;
        //console.debug(errString);
      } else if (error.request) {
        // The request was made but no response was received
        const errorMessage = JSON.parse(error.request.response)
        //console.log("errorMessage",errorMessage,errorMessage.message)
        errResponse = errorMessage.message;
        //console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        //console.log('Error', error);
        errResponse = error;
      }
      console.debug("errResponse", errResponse);
      return errResponse;
  }


APIError.fromResponseText = function ( responseText ) {
  let message = getErrorMessageFromResponseBody(responseText)
  return new APIError(message)
}
APIError.digestError = function ( error ) {
  let message = formatErrorForRender(error)
  return new APIError(message)
}





// function stackTraceCallback = (stackTrace) => {
//     //console.debug("stackTraceCallback", stackTrace);
//     var localStackFrames = [];
//     // We could check the whole stack trce, but that could get super long
//     // Let's only look at the first 30 or so lines\
//     //console.debug("stackTrace.length",stackTrace.length);
//     var stackLimit = 50;
//     if(stackTrace.length < stackLimit){
//       stackLimit = stackTrace.length;
//     }
//     for (var i = 0; i < stackLimit; i++) {
//       if (stackTrace[i].fileName.includes("/src/src")) {
//         //console.debug("STACK INDEX", i);
//         var filenameShort = stackTrace[i].fileName.substr(stackTrace[i].fileName.lastIndexOf("/")+1);
//         var stackLocation = [
//           filenameShort, 
//           stackTrace[i].lineNumber
//         ]
//         var stackListItem = [
//           stackTrace[i].functionName,
//           stackLocation
//         ];
//         // console.debug("stackListItem",stackListItem);
//         localStackFrames.push(stackListItem);
//       }
//     }
//     this.setState({localStackFrames: localStackFrames});
//     //console.debug("localStackFrames", localStackFrames);
//   }