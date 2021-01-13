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

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
        
  return axios 
    .get(url,options)
      .then(res => {
        console.log(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};

/* 
 * update_entity - updates data of an existing entity
 *
 */
export function api_update_entity(uuid, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
        console.log(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};
