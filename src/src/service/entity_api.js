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
        //console.debug(res);
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(err => {
        if(err.response){
          console.debug("entity_api_get_entity have response");
          return {status: err.response.status, results: err.response.data}
        }else{ 
          console.debug("entity_api_get_entity no response");
          return err;
        }
        
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
        //console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        var response = "";
        if(err.response){
          response =  {status: err.response.status, results: err.response.data}
        }else{
          response = err
        }
        return response
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
        //console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch((err) => {
        return {status: err.response.status, results: err.response.data}
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
        //console.debug(res);
          let results = res.data;
          let fin = [];
           results.forEach( element => {
              element.checked = false; // add a checked attribute for later UI usage
              fin.push(element);
            });
        return {status: res.status, results: fin}
      })
      .catch(err => {
        return {status: err.response.status, results: err.response.data}
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
        //console.debug(res);
          let results = res.data;
         
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: err.response.status, results: err.response.data}
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
        return {status: err.response.status, results: err.response.data}
      });
};
