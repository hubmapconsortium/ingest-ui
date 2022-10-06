// Search APIs

import axios from "axios";
import { GROUPS } from "./groups";
import { ES_SEARCHABLE_FIELDS, ES_SEARCHABLE_WILDCARDS } from "../constants";

export const esb = require('elastic-builder');

/*
 * Auth Validation  method
 * 
 * return:  { status}
 */
// Something of a hack to validate the auth token
export function api_validate_token(auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    let payload = search_api_filter_es_query_builder("test", 1 , 1);

  return axios 
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
        payload, options
      )
      .then(res => {
        return {status: res.status}
      })
      .catch(err => {
        return {status: err.response.status, results: err.response.data}
      });
};


/*
 * Search API method
 * 
 * return:  { status, results}
 */
export function api_search(params, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

    ////console.debug(options)
  let payload = search_api_filter_es_query_builder(params, 0, 100);

  return axios 
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
              payload, options
      )
      .then(res => {
        ////console.debug(res);
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

        return {status: res.status, results: entities}
      })
      .catch(err => {
         return {status: 500, results: err.response}
      });
};

export function api_search2(params, auth, from, size, fields) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    // console.debug("params", params);
    let payload = search_api_filter_es_query_builder(params, from, size, fields);
    // console.debug("payload", payload);

    console.debug('payload', payload)

  return axios 
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
              payload, options
      )
      .then(res => {
        console.debug("API api_search2 res", res);
          let hits = res.data.hits.hits;
          let entities = [];
          hits.forEach(s => {
            let data = s['_source']
            data['id'] = s['_source']['uuid']
            entities.push(data);
          });
           //console.debug(entities);
        return {status: res.status, results: entities, total: res.data.hits.total.value}
      })
      .catch(err => {
        console.debug("API api_search2 err", err);
         return {status: 500, results: err.response}
      });
};

/*
 * Elasticsearch query builder helper
 *
 */
export function search_api_filter_es_query_builder(fields, from, size, colFields) {

  let requestBody =  esb.requestBodySearch();
//  console.debug("here in the filter es builder")
//  console.debug(fields);


let boolQuery = "";
console.debug("Fields", fields);
  if (fields["keywords"] && fields["keywords"].indexOf("*") > -1) {  // if keywords contain a wildcard
    boolQuery = esb.queryStringQuery(fields["keywords"])
      .fields(ES_SEARCHABLE_WILDCARDS)

  } else {

      boolQuery = esb.boolQuery();

      // if no field criteria is sent just default to a 
      if (Object.keys(fields).length === 0 && fields.constructor === Object) {
          console.debug("full search")
            boolQuery.must(esb.matchQuery('entity_type', 'Donor OR Sample OR Dataset OR Upload')); 
      } else {
       
        // was a group name selected
        if (fields["group_name"]) {
          boolQuery.must(esb.matchQuery("group_name.keyword", fields["group_name"]));
        } else if (fields["group_uuid"]) {
          boolQuery.must(esb.matchQuery("group_uuid.keyword", fields["group_uuid"]));
        } 

        // was specimen types selected
        if (fields["specimen_type"]) {
          if (fields["specimen_type"] !== 'donor') {
            boolQuery.must(esb.matchQuery("specimen_type.keyword", fields["specimen_type"]));
          } else {
            boolQuery.must(esb.matchQuery("entity_type.keyword", 'Donor'));
          }
        } else if (fields["organ"]) {
            boolQuery.must(esb.matchQuery("organ.keyword", fields["organ"]));
        } else {
            // was entity types select
            if (fields["entity_type"]) {
              if (fields["entity_type"] === 'DonorSample') {  // hack to deal with no type selected from the UI, this clues from the donor/sample filer
                boolQuery.must(esb.matchQuery('entity_type', 'Donor OR Sample'));
              } else {
                boolQuery.must(esb.matchQuery("entity_type.keyword", fields["entity_type"]));
              }
            } else {
               boolQuery.must(esb.matchQuery("entity_type", 'Donor OR Sample OR Dataset OR Upload'));  // default everything ; this maybe temp
            }
        }

        if (fields["keywords"]) {
          //let scrubbed = fixKeywordText(fields["keywords"]);
            boolQuery.filter(esb.multiMatchQuery(ES_SEARCHABLE_FIELDS, fields["keywords"]));
        }
      
      }
    }
  requestBody
    .query(boolQuery)
    .from(from)
    .size(size)
    .sort(esb.sort('last_modified_timestamp', 'asc'))
    .source(colFields);
  //requestBody.query(boolQuery).size(100);

/*  

submission_id
lab_name
group_name
created_by_user_email
lab_donor_id

*/
  

// console.debug("search_api_filter_es_query_builder", requestBody.toJSON());
// console.debug("requestBody", requestBody);
  // console.debug("search_api_filter_es_query_builder", requestBody.toJSON().query.bool.must);
  return requestBody.toJSON();

}

export function fixKeywordText(text) {
  let x = text.replace(/-/gi, "\\-");
  ////console.debug('scrubbed', x)
return x
}

// this is a shell function that reads from a static file groups.jsx
export function search_api_search_group_list() {
  let groups = [];

  GROUPS.forEach(function(group) { 
    if (group.data_provider) {  // only show the data_providers
      groups.push(group);
    }
  });

  // groups.sort((a, b) => {
  //   if (a.tmc_prefix < b.tmc_prefix) {
  //     return -1;
  //   }
  //   if (a.tmc_prefix  > b.tmc_prefix) {
  //     return 1;
  //   }
  //   // must be equal
  //   return 0;
  // });

  return groups;
}

export function  search_api_get_assay_type(assay) { 
  return axios 
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`)
      .then(res => {
        let data = res.data;
        //var dt_dict = data.result.map((value, index) => { return value });
        var found_dt = undefined
        data.result.forEach(s => {
          if (s['name'] === assay) { 
            found_dt = s;
          }
        });

        console.debug(found_dt);
        return {status: res.status, results: found_dt}
      })
      .catch(err => {
         return {results: err.response}
      });
};


export function search_api_get_assay_list(params) { 
  console.debug("search_api_get_assay_list", params);
  // So the api defaults to primary even if False is passed as ?primary=false
  var primaryParam = {};
  if(params){
    primaryParam = { params: params };
  }
  return axios 
    // .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`,  primaryParam)
    // Only regards flag via url for some reason?
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype?primary=true`)
    .then(res => {
        let data = res.data;
        let dtListMapped = data.result.map((value, index) => { return value });
        console.debug("search_api_get_assay_list", dtListMapped);
        return {status: res.status, data: dtListMapped}
      })
      .catch(err => {
        console.debug("search_api_get_assay_list", err.response);
         return {results: err.response}
      });
};


export function  search_api_get_assay_set(scope){ 
  // Scope informs either Primary, Alt, or All
  console.debug("search_api_get_assay_set", scope);
  var target=""
  switch (scope) {
    case "primary":
      target = "?primary=true"
      break;
    case "alt":
        target = "?primary=false"
        break;
    default:
      break;
  }
  return axios 
  // primaryness NEEDS to be in the url, not a form body addon
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`+target, ) 
      .then(res => {
        let data = res.data;
        let mapCheck = data.result.map((value, index) => { return value });
        console.debug("API get_processed_assays data", data, mapCheck);
        return {data}
      })
      .catch(err => {
        console.debug("API get_processed_assays err", err);
         return {results: err.response}
      });
};

