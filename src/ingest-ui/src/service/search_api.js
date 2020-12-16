
import axios from "axios";
const esb = require('elastic-builder');

const options = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json"
      }
    };


export function api_users_groups(config) { 
  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
   config
 )
 .then(res => {
  const display_names = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g.displayname;
          });
    return display_names;
 })
 .catch(err => {
     return err.response.status;
 });
}


export function api_search(payload) { 
return axios 
  .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
            payload, options
    )
    .then(res => {
      console.log(res);
        let hits = res.data.hits.hits;
    
        let entities = {};
        hits.forEach(s => {
          let uuid = s['_source']['uuid'];
          if (entities[uuid]) {
            entities[s['_source']['uuid']].push(s['_source']);
          } else {
            entities[s['_source']['uuid']] = [s['_source']];
          }
        });
      return entities;
    })
    .catch(err => {
      return err.response;
    });
};

export function api_es_query_builder(fields) {
  let requestBody = esb
  .requestBodySearch();
 

  Object.keys(fields).forEach(f => {
  //console.log(f + ':' + p[f])
    requestBody.query(esb.matchQuery(f, fields[f]));
  })
  console.log(requestBody.toJSON());
  return requestBody.toJSON();
}
