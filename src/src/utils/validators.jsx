export function validateRequired(value){
  // console.debug(typeof value);
  // console.debug("VALUE",value);
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

export function ValidateDTList(datatypes){
  return datatypes && !datatypes.includes("[object Object]");
}