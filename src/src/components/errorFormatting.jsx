
export class APIError extends Error {}

function getErrorMessageFromResponseBody( string ) {
    let errorString = string
    try {
      let json = JSON.parse(string)
      if(json.errors) {
        errorString = json.errors[0].msg
      }
    } catch ( parseOrAccessError ) {
        console.debug("parseOrAccessError", parseOrAccessError);
    }
    
    return errorString
  }


function buildStackFrame( stack ) {
    // var stackFrame = new StackFrame({
    //     functionName: 'funName',
    //     args: ['args'],
    //     fileName: 'http://localhost:3000/file.js',
    //     lineNumber: 1,
    //     columnNumber: 3288, 
    //     isEval: true,
    //     isNative: false,
    //     source: 'ORIGINAL_STACK_LINE'
    //     evalOrigin: new StackFrame({functionName: 'withinEval', lineNumber: 2, columnNumber: 43})
    // });
    // return stackFrame
  }

function formatErrorForRender( error ) {
    var errResponse;
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        // MOST LIKELY FROM ES
        // Let's check, eventually have an ES Error type?
        var reason = error.response.data.error.reason;
        var esErrType = error.response.data.error.type
        // console.log(error.response.data.error.reason);
        errResponse = "ES error: Type: "+esErrType+" Reason: "+reason;
        console.debug(errResponse);
      } else if (error.request) {
        const errorMessage = JSON.parse(error.request.response)
        console.log("errorMessage",errorMessage,errorMessage.message)
        errResponse = errorMessage.message;
        console.log(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error', error);
        errResponse = error;
      }
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
//     console.debug("stackTraceCallback", stackTrace);
//     var localStackFrames = [];
//     // We could check the whole stack trce, but that could get super long
//     // Let's only look at the first 30 or so lines\
//     console.debug("stackTrace.length",stackTrace.length);
//     var stackLimit = 50;
//     if(stackTrace.length < stackLimit){
//       stackLimit = stackTrace.length;
//     }
//     for (var i = 0; i < stackLimit; i++) {
//       if (stackTrace[i].fileName.includes("/src/src")) {
//         console.debug("STACK INDEX", i);
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
//     console.debug("localStackFrames", localStackFrames);
//   }