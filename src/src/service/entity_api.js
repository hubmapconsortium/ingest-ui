import axios from "axios";

/*
 * Search Entity method
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity(uuid, auth) { 
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
export function entity_api_update_entity(uuid, data, auth) { 
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

/* 
 * create_entity - create a new entity
 *
 */
export function entity_api_create_entity(entitytype, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${entitytype}`;
        
  return axios 
     .post(url, data, options)
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
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_create_multiple_entities(count, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples/${count}`;
        
  return axios 
     .post(url, data, options)
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
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_update_multiple_entities(data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples`;
        
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



/*
 * get ancestor-organs for the specified Entity 
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity_ancestor(uuid, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/ancestor-organs`;
        
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
