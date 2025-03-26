import axios from "axios";

var globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;

/*
 * Search Entity method
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity(uuid, auth){ 
  // console.debug("entity_api_get_entity", auth);
  const options = {
    headers: {
      Authorization:
          "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
  return axios 
    .get(url,options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      console.debug("entity_api_get_entity", error, error.response);
      if(error.response){
        return error.response
      }else{
        return{error}
      }
    });
};

/* 
 * update_entity - updates data of an existing entity
 *
 */
export function entity_api_update_entity(uuid, data, auth){ 
  // console.debug("entity_api_update_entity", data);
  const options = {
    headers: {
      'X-Hubmap-Application': 'ingest-api',
      Authorization:
          "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
        
  return axios 
    .put(url, data, options)
    .then(res => {
      // console.debug("entity_api_update_entity", res);
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      if(error.response){
        console.debug("entity_api_update_entity Error", error.response.status, error.response.data);
        return{status: error.response.status, results: error.response.data}
      }else{
        return{error: error.response}
      }
    });
};

/* 
 * create_entity - create a new entity
 *
 */
export function entity_api_create_entity(entitytype, data, auth){ 
  const options = {
    headers: {
      'X-Hubmap-Application': 'ingest-api',
      Authorization:
        "Bearer " + globalToken,
      "Content-Type": "application/json"
    }
  };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${entitytype}`;
        
  return axios 
    .post(url, data, options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch((error) => {
      console.debug("entity_api_create_entity error", error, error.response);
      if(error.response && error.response.data){
        return{error: error.response.data}
      }else{
        return{error}
      }
    });
};

/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_create_multiple_entities(count, data){ 
  const options = {
    headers: {
      Authorization:
          "Bearer " + globalToken, 
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
      return{status: res.status, results: fin}
    })
    .catch(error => {
      return{error}
    });
};

/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_update_multiple_entities(data, auth){ 
  const options = {
    headers: {
      Authorization:
          "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples`;
        
  return axios 
    .put(url, data, options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      return{error}
    });
};

/*
 * get ancestor-organs for the specified Entity 
 * 
 * return:  { status, results}
 */
// @TODO: Rename to reflect Organ endpoint
export function entity_api_get_entity_ancestor(uuid, auth){ 
  const options = {
    headers: {
      Authorization:
          "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/ancestor-organs`;
  return axios 
    .get(url,options)
    .then(res => {
      // console.debug(res);
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      return{error}
    });
};

/*
 * get ancestor list  for the specified Entity 
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity_ancestor_list(uuid, auth){ 
  const options = {
    headers: {
      Authorization:
          "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/ancestors/${uuid}`;
  return axios 
    .get(url,options)
    .then(res => {
      // console.debug(res);
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      return{error}
    });
};

/*
 * get Globus URL
 * 
 * return:  { status, results}
 */
export function entity_api_get_globus_url(uuid, auth){ 
  // console.debug("entity_api_get_globus_url", auth);
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url`;
  const options = {
    headers: {
      Authorization:
        "Bearer " + globalToken, 
      "Content-Type": "application/json"
    }
  };
  return axios
    .get(url, options)
    .then((res) => {
      // console.debug("entity_api_get_globus_url", res);
      return{status: res.status, results: res.data}
    })
    .catch((error) => {
      return{error}
    });
};

// @TODO  DEPRECATING replaced with newer ingest API call
export function entity_api_attach_bulk_metadata(uuid,item, auth){ 
  console.debug('%c⭗', 'color:#ff005d', "entity_api_upload_bulk_metadata", item, auth);
  const options = {headers: {Authorization: "Bearer " + globalToken, 
    "Content-Type": "application/json"}};
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/`+uuid

  return axios 
    .put(url,item,options)
    .then(res => {
      console.debug("ingest_api_attach_bulk_metadata",res);
      let results = res.data;
      return{status: res.status, results: results}
    })
    .catch(error => {
      console.debug('%c⭗  ingest_api_attach_bulk_metadata', 'color:#ff005d',error );
      // throw new Error(error);
      return{error}
    });
};
