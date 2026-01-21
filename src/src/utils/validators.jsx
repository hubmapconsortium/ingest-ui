export function validateRequired(value){
  console.debug(typeof value);
  console.debug("VALUE",value);
  if(typeof value === "string"){
    // console.debug("trim", (value.trim()!==""));
    return value.trim() !== "";
  }else if(typeof value === "object"){
    // console.debug("value length: ",value.length);
    if(value.name === undefined){
      // console.debug("value.name === undefined");
      if(value.length <= 0){
        return false;
      }else{
        return true;
      }
    }else if(value.name){
      // console.debug(value.name);
      return value.name.trim() !== "";
    }
  }else if(typeof value === "boolean"){
    // console.debug("value length: ",value.length);
    if(value === true || value === false){
      return true;
    }else{
      return false;
    }
  }
}

export function validateProtocolIOURL(value){
  if(value === undefined || value === "")return true;
  const patt = /^(http(s)?:\/\/(www\.)?)?protocols\.io\/.*/;
  return patt.test(value);
}

export function validateProtocolIODOI(value){
  if(value === undefined || value === "")return true;
  const patt1= /^(http(s)?:\/\/)?dx\.doi\.org\/10\.17504\/protocols\.io\..+/;
  const patt2 = /^(http(s)?:\/\/)?doi\.org\/10\.17504\/protocols\.io\..+/;
  return patt1.test(value) || patt2.test(value);
}

export function validateSingleProtocolIODOI(value){
  // Only one, let's check for dupe domains & commas
  if(value === undefined || value === "")return true;
  if(value.includes(","))return false;

  let checkVal = "doi.org"
  let count = value.split(checkVal).length - 1;
  console.log("validateSingleProtocolIODOI", count); 
  if(count>1){
    return false;
  }else{
    return true;
  }
}

export function validateFileType(file_type, allow_types){
  if(!file_type)return true;
  if(allow_types.includes(file_type))return true;
  else return false;
}

export function ValidateJSON(str){
  try{     
    return JSON.parse(str);
  }
  catch(e){
    return{
      "Error": true,
      "String": str,
    }
  }
}

export function ValidateLocalStoreValue(data){
  console.debug('%c◉  ValidateLocalStoreValue', 'color:#00ff7b', !data.includes("[object Object]"), !data.includes("undefined"), !data.includes("null"), typeof data === "string");
  return data && (!data.includes("[object Object]") && !data.includes("undefined") && !data.includes("null") && typeof data !== "string");
}

export function ValidateLocalhost(){
  const isLocalhost = Boolean(
    window.location.hostname === 'localhost' ||
      // [::1] is the IPv6 localhost address.
      window.location.hostname === '[::1]' ||
      // 127.0.0.1/8 is considered localhost for IPv4.
      window.location.hostname.match(
        /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
      )
  );
  return isLocalhost;
}