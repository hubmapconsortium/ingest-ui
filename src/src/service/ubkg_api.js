import axios from "axios";
import { ORGAN_TYPES } from "../constants";

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
  console.debug("ubkg_api_get_assay_type_set", scope);
  let url = `${process.env.REACT_APP_UBKG_API_URL}/assaytype`;
  // Note: scope == 'all' will not include the query parameter
  if (scope == 'primary') {
      url += '?primary=true'
  } else if (scope == 'alt') {
      url += '?primary=false'
  }
  return axios
    .get(url)
      .then(res => {
          let data = res.data;
          let mapCheck = data.result.map((value, index) => { return value });
          console.debug("API get_processed_assays data", data, mapCheck);
          return {data}
      })
      .catch(error => {
        console.debug("ubkg_api_get_assaytype", error, error.response);
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        } else {
          return {error}
        }
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
  console.debug("ubkg_api_get_organ_type_set");

    // For testing, simulate the delay...
  return new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve(ORGAN_TYPES);
     }, 5000);
   });

  let url = `${process.env.REACT_APP_UBKG_API_URL}/organtype/all`;
  // return axios
  //   .get(url)
  //     .then(res => {
  //         let data = res.data;
  //         return {data}
  //     })
  //     .catch(error => {
  //       console.debug("ubkg_api_get_organ_type_set", error, error.response);
  //       if(error.response){
  //         return {status: error.response.status, results: error.response.data}
  //       } else {
  //         return {error}
  //       }
  //     });
};
