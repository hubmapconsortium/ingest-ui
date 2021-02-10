// Ingest specific APIs

import axios from "axios";


/*
 * User Group API
 *
 */
export function api_users_groups(auth) { 
   const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`, options)
 .then(res => {
  //console.log(res.data)
  const group_list = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g;
          });
    //console.log(group_list);
    return {status: res.status, results: group_list}
 })
 .catch(err => {
    return {status: err.response.status, results: err.response}
     //return err.response.status;
 });
}

/*
 * Get whether a user can update the selected entity data
 * 
 * return:  { status, results}
 */
export function api_has_write(uuid, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_METADATA_API_URL}/entities/${uuid}/has-write`;
        
  return axios 
    .get(url,options)
      .then(res => {
        //console.log(res);
          let results = res.data.has_write;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};
