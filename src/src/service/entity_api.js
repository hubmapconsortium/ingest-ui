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
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(err => {
        throw new Error(err);
      });
};

/* 
 * update_entity - updates data of an existing entity
 *
 */
export function entity_api_update_entity(uuid, data, auth) { 
  console.debug("entity_api_update_entity", data);
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
          let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(err => {
        throw new Error(err);
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
          let results = res.data;
        return {status: res.status, results: results}
      })
      .catch((err) => {
        console.debug("entity_api_create_entity error", err);
        throw new Error(err);
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
          let results = res.data;
          let fin = [];
           results.forEach( element => {
              element.checked = false; // add a checked attribute for later UI usage
              fin.push(element);
            });
        return {status: res.status, results: fin}
      })
      .catch(err => {
        throw new Error(err);
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
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(err => {
        throw new Error(err);
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
        console.debug(res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(err => {
        throw new Error(err);
      });
};

/*
 * get Globus URL
 * 
 * return:  { status, results}
 */
export function entity_api_get_globus_url(uuid, auth) { 
  console.debug("entity_api_get_globus_url", auth);
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url`;
  const options = {
    headers: {
      Authorization:
        "Bearer " + auth,
      "Content-Type": "application/json"
    }
  };
  return axios
    .get(url, options)
      .then((res) => {
        console.debug("entity_api_get_globus_url", res);
        return {status: res.status, results: res.data}
      })
      .catch((err) => {
        throw new Error(err);
      });
};
