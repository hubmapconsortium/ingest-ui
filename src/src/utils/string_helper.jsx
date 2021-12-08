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
  let strLowerCase = str.toLowerCase();
  let wordArr = strLowerCase.split(" ").map(function(currentValue) {
      return currentValue[0].toUpperCase() + currentValue.substring(1);
  });
  return wordArr.join(" ");
}
