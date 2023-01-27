
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
  

