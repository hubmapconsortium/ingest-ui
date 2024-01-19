import axios from "axios";
import { stripHTML,toTitleCase } from '../utils/string_helper'



/*
 * UBKG GET assaytype method
 *
 * scope: controls the subset of assay names returned:
 *  all: iterate over all valid canonical names
 *  primary: iterate only primary assay names, that is, those for
 *        which a dataset of this type has no parent which is also
 *        a dataset.
 *  alt: iterate only over the names of derived assays, that is,
 *        those for which a dataset of the given type has at least
 *        one parent which is also a dataset.
 *
 * NOTE: This function should match search_api.js (search_api_get_assay_set)
 *
 * return:  { status, results}
 */
export function ubkg_api_get_assay_type_set(scope) {
  // application_context 
  // console.debug("ubkg_api_get_assay_type_set", scope);
  let url = `${process.env.REACT_APP_UBKG_API_URL}/assaytype?application_context=HUBMAP`;
  // let url = `${process.env.REACT_APP_SEARCH_API_URL}/v3/assaytype`;
  // Note: scope == 'all' will not include the query parameter
  if (scope === 'primary') {
      url += '&primary=true'
  } else if (scope === 'alt') {
      url += '&primary=false'
  }
  // console.debug("ubkg_api_get_assay_type_set url", url);
  return axios
    .get(url)
      .then(res => {
        // let mapCheck = data.result.map((value, index) => { return value });
        let data = res.data;
        return {data}
      })
      .catch(error => {
        console.debug('%c⭗', 'color:#ff005d', "ubkg_api_get_assaytype", error, error.response);
        var errorResp = captureError(error);
        return errorResp
      });
};

/*
 * UBKG GET organtype/all method
 *
 * NOTE: This endpoint does not yet exist in UBKG
 *
 * return: {'AO': 'Aorta' ... }
 */
export function ubkg_api_get_organ_type_set() {
  let url = `${process.env.REACT_APP_UBKG_API_URL}/organs/by-code?application_context=HUBMAP`;
  return axios
    .get(url)
      .then(res => {
        let data = res.data;
        return data;
      })
      .catch(error => {
        console.debug("ubkg_api_get_organ_type_set", error, error.response);
        captureError(error);
      });
};

/*
 * UBKG GET dataset types method
 *
 */
export function ubkg_api_get_dataset_type_set() {
  let url = `${process.env.REACT_APP_UBKG_API_URL}/valueset?parent_sab=HUBMAP&parent_code=C003041&child_sabs=HUBMAP`;
  return axios
    .get(url)
      .then(res => {
        let data = res.data;
        return data;
      })
      .catch(error => {
        console.debug("ubkg_api_get_dataset_type_set", error, error.response);
        captureError(error);
      });
};


/*
 * UBKG Generate Display Subtype method
 *
 */
export function ubkg_api_generate_display_subtype(entity) {
  var entity_type = entity['entity_type']
  if (entity_type === 'Sample' && 'sample_category' in entity){
    if (entity['sample_category'].toLowerCase() === 'organ'){
      if ('organ' in entity) {
        var organCode = entity['organ'];
        return ubkg_api_get_organ_type_set()
          .then((res) => {
            console.debug('%c⊙ generate_subtype', 'color:#8400FF', res[organCode] );
            return (res[organCode])
          })
          .catch((error) => {
            return (error)
          });
          
      }else{
        throw new Error("Missing Organ key for  Sample with uuid: {entity['uuid']}")
      }
    } else {
      return entity['sample_category'].toString();
    }  
  }else if (entity_type === 'Dataset' && 'dataset_type' in entity){ 
    // Datasets store in ugly format, need to reff pretty style
    return (entity['dataset_type'].toString())
  }else if (entity_type === 'Upload'){ 
    // Uploads just need language fix
    return ("Data Upload")
  }else{ 
    // All others (Donors, & I'm asuming Collections and Publications) just use Entity Type
    return ( toTitleCase(entity_type.toString()))
  }    
}




function captureError (error){

  console.debug("Error Format CHeck", error);

  if(error.response ){
    if(error.response.data ){
      if(error.response.data.includes("<!DOCTYPE html>")){
        var responseData = stripHTML(error.response.data)
        return {status: error.response.status, results: responseData}
      }else{
        return {status: error.response.status, results: error.response.data}
      }
    }else{
      return {status: error.response.status, results: error.response.data}
    }
  } else {
    return {error}
  }
}
