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

export function tsToDate(timestamp) {
  
  var date = new Date(timestamp);

  return (date.getDate()+
          "/"+(date.getMonth()+1)+
          "/"+date.getFullYear()+
          " "+date.getHours()+
          ":"+date.getMinutes()+
          ":"+date.getSeconds());
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