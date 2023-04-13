
// Creates a new error object with the given message
export const BuildError = (message) => {
    console.debug("buildError", message);
    var newError;
    if(message.message){
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
    console.debug("FormatError", message);
    var newError;
    if(message.status && message.status >200){
        // probably looks like
        console.debug("FormatError", message.results, message.results.error);
        // {"status": 400, "results": {"error": "400 Bad Request: The provided status value of Dataset is not valid"}}
        newError = new Error(message.results);
    }else{}
    // Else, let's make it one
        newError = new Error(message);
    return (
        newError
    )
}
  