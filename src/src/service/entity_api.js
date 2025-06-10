import axios from "axios";

const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;
const options = {
  headers: {
    "X-Hubmap-Application": "ingest-ui",
    "Authorization": "Bearer " + globalToken, 
    "Content-Type": "application/json"
  }
};
/*
 * Search Entity method
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity(uuid){ 
  // console.debug("entity_api_get_entity");
  return axios 
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`,options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      console.debug("entity_api_get_entity", error, error.response);
      if(error.response){
        return error.response
      }else{
        return{error}
      }
    } );
};

/* 
 * update_entity - updates data of an existing entity
 *
 */
export function entity_api_update_entity(uuid, data){ 
  return axios 
    .put(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`, data, options)
    .then(res => {
      // console.debug("entity_api_update_entity", res);
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      if(error.response){
        console.debug("entity_api_update_entity Error", error.response.status, error.response.data);
        return{status: error.response.status, results: error.response.data}
      }else{
        return{error: error.response}
      }
    } );
};

/* 
 * create_entity - create a new entity
 *
 */
export function entity_api_create_entity(entitytype, data){ 
        
  return axios 
    .post(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${entitytype}`, data, options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch((error) => {
      console.debug("entity_api_create_entity error", error, error.response);
      if(error.response && error.response.data){
        return{error: error.response.data}
      }else{
        return{error}
      }
    } );
};

/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_create_multiple_entities(count, data){ 
  return axios 
    .post(`${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples/${count}`, data, options)
    .then(res => {
      let results = res.data;
      let fin = [];
      results.forEach(element => {
        element.checked = false; // add a checked attribute for later UI usage
        fin.push(element);
      } );
      return{status: res.status, results: fin}
    } )
    .catch(error => {
      return{error}
    } );
};

/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_update_multiple_entities(data){ 
  return axios 
    .put(`${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples`, data, options)
    .then(res => {
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      return{error}
    } );
};

/*
 * get ancestor-organs for the specified Entity 
 * 
 * return:  { status, results}
 */
// @TODO: Rename to reflect Organ endpoint
export function entity_api_get_entity_ancestor(uuid){ 
  return axios 
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/ancestor-organs`,options)
    .then(res => {
      // console.debug(res);
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      return{error}
    } );
};

export function entity_api_get_entity_ancestor_organ(uuid){ 
  return axios 
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/ancestor-organs`,options)
    .then(res => {
      // console.debug(res);
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      return{error}
    } );
};

/*
 * get ancestor list  for the specified Entity 
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity_ancestor_list(uuid){ 
  return axios 
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/ancestors/${uuid}`,options)
    .then(res => {
      // console.debug(res);
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      return{error}
    } );
};

/*
 * get Globus URL
 * 
 * return:  { status, results}
 */
export function entity_api_get_globus_url(uuid){ 
  return axios
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url`, options)
    .then((res) => {
      // console.debug("entity_api_get_globus_url", res);
      return{status: res.status, results: res.data}
    } )
    .catch((error) => {
      return{error}
    } );
};

// @TODO  DEPRECATING replaced with newer ingest API call
export function entity_api_attach_bulk_metadata(uuid,item){ 
  console.debug('%c⭗', 'color:#ff005d', "entity_api_upload_bulk_metadata", item);
  return axios 
    .put(`${process.env.REACT_APP_ENTITY_API_URL}/entities/`+uuid,item,options)
    .then(res => {
      console.debug("ingest_api_attach_bulk_metadata",res);
      let results = res.data;
      return{status: res.status, results: results}
    } )
    .catch(error => {
      console.debug('%c⭗  ingest_api_attach_bulk_metadata', 'color:#ff005d',error);
      // throw new Error(error);
      return{error}
    } );
};

/*
 * Get Multiple Entities from a list 
 * 
 * return:  { status, results}
 */
export function entity_api_get_these_entities(uuids) {
  let message = "";
  let uuidSet = Array.from(new Set(uuids)); // Nix any Dupes
  let dupes = uuids.filter((item, idx, arr) => arr.indexOf(item) !== idx); // Also get a list of dupes to note
  if (dupes.length > 0) {
    message = "Duplicate IDs found and Removed: " + Array.from(new Set(dupes)).join(", ");
  }
  if (uuids.length === 0) {
    message = "No UUIDs provided";
    return Promise.resolve({ status: 400, results: { message: message } });
  }
  // Fetch all entities in parallel
  return Promise.all(uuidSet.map(entity_api_get_entity))
    .then((results) => {
      let badList = []; 
      let goodList = [];
      let errMessage = null;
      results.map((item) => {
        console.debug('%c◉ item ', 'color:#00ff7b', item);
        if (item.status !== 200) {
          badList.push(item.data.error || item.data.message || item.data || "Unknown Error");
          errMessage = "Error fetching entities: "+ badList.join(", ");
        }else{
          goodList.push(item);
        }
      });
      return ({
        status: 200,
        message: message,
        results: goodList,
        badList: badList,
        error: errMessage? errMessage : null
      })
    })
    .catch(error => ({
      status: 500,
      message: message,
      results: error.message?error.message: "Error fetching entities" 
    }));
}
