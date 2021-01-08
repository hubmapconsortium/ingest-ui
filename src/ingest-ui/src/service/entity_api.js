import axios from "axios";

/*
 * Search Entity method
 * 
 * return:  { status, results}
 */
export function api_get_entity(uuid, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let uri = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
        
  return axios 
    .get(uri,options)
      .then(res => {
        console.log(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};