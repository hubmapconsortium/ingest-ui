export function truncateString(str, max_length) {
  if (str && str.length > max_length) {
    return str.substring(0, max_length) + "...";
  } else {
    return str;
  }
}

export function naturalLanguageJoin(strArr) {
  if (strArr) {
    let ret = "";
    strArr.forEach((str, index) => {
      if (index < strArr.length - 2) {
        ret += str + ", ";
      } else if (index < strArr.length - 1) {
        ret += str + " and ";
      } else {
        ret += str;
      }
    });
    return ret;
  }
  return "";
}

// convert a timestampe to human readble format for display puposes
export function tsToDate(timestamp_ms) {
  
  var date = new Date(timestamp_ms);

  return date.toLocaleString()
}

export function parseErrorMessage(err) {
  console.log('parseErrorMessage', err)
  try { 
     var l = err["error"].split(":");   // parse out the : which separates the error number and message
console.log('error message', l)

     return l[1]
  }
  catch {}
 return err
}

export function toTitleCase(str) {
//console.debug('toTitleCase', str)
  try { 
    let strLowerCase = str.toLowerCase();
  //console.debug('toTitleCase', strLowerCase)
    let wordArr = strLowerCase.split(" ").map(function(currentValue) {
    //console.debug("currentValue", currentValue)
    //console.debug("currentValue.charAt(0)", currentValue.charAt(0)) 
      return currentValue[0].toUpperCase() + currentValue.substring(1); 
    });
  //console.debug('toTitleCase', wordArr.join(" "));
    return wordArr.join(" ");
 }catch(error) {
 //console.debug("toTitleCase ERR ",error);
   return error
 }


  
  
}

export function toSingular(str) {
  try { 
     if(str.slice(-1) === "s"){
       return (str.slice(0, -1)).toLowerCase()
    }else{
      return str.toLowerCase();}
  }catch(error) {
  //console.debug("toSingular ERR ",error);
    return error
  }
}

export function toPlural(str) {
  try { 
    if(str.slice(-1) === "s"){
      return str;
    }else{
      return (str+"s");
    }
 }catch(error) {
 //console.debug("toPlural ERR ",error);
   return error
 }


  
}

