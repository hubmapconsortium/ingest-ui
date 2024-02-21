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


// Camel Case & Strip Underscores
export function humanize(str) {
  var i, frags = str.split('_');
  for (i=0; i<frags.length; i++) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
  }
  return frags.join(' ');
}

// convert a timestampe to human readble format for display puposes
export function tsToDate(timestamp_ms) {
  
  var date = new Date(timestamp_ms);

  return date.toLocaleString()
}

export function parseErrorMessage(err) {
  // console.log('parseErrorMessage', err)
console.debug('%c⊙parseErrorMessage', 'color:#00ff7b', err );
var formattingMessage = err;
try { 
  if(err["error"]){
    console.debug('%c⊙', 'color:#00ff7b', "err has err" );
      formattingMessage = err["error"].split(":");   // parse out the : which separates the error number and message
    }else if(err.data){
      console.debug('%c⊙ErrData', 'color:#00ff7b', err.data );
    }
    // console.log('parseErrorMessageerror ', l, (1)[1])\
    console.debug('%c⭗parseErrorMessageerror', 'color:#A200FF', 1, (1)[1], err, );
     return formattingMessage
  } catch {
    console.debug('%c⊙parseErrorMessage CATCH', 'color:#ff005d', err );
  }
 return err
}

export function toTitleCase(str) {
  if(str){
    try { 
      let strLowerCase = str.toLowerCase();
      let wordArr = strLowerCase.split(" ").map(function(currentValue) {
      if(currentValue[0]){
        return currentValue[0].toUpperCase() + currentValue.substring(1); 
      }else{
        return currentValue.toUpperCase(); 
      }
      });
      return wordArr.join(" ");
    }catch(error) {
      console.debug("toTitleCase ERR ",error); 
      return error
    }
  }else{
    return ""
  }


  
  
}

export function toSingular(str) {
  try { 
     if(str.slice(-1) === "s"){
       return (str.slice(0, -1)).toLowerCase()
    }else{
      return str.toLowerCase();
}
  }catch(error) {
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
   return error
 }
}


export function stripHTML(str) {
  const regexForStripHTML = /<([^</> ]+)[^<>]*?>[^<>]*?<\/\1> */gi;
  try { 
    const stripContent = str.replaceAll(regexForStripHTML, '');
    return stripContent;
 }catch(error) {
   return error
 }
}


export function prettyObject(object) {
  const data = JSON.stringify(object, null, 2);
  return (
    <pre>
      {data}
    </pre>
  );
}

export function urlify(text, blank = true, max = 40) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url) {
      url = url.replace('http://local', '')
      return `<a href="${url}" title="${url}" ${blank ? 'target="_blank" class="lnk--ic"' : ''}>${url.length > max ? url.substr(0, 40) + '...' : url} ${blank ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor"><path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5z"></path><path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0v-5z"></path></svg>' : ''}</a>`;
  })
}
  


