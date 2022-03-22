// Search APIs

import axios from "axios";
import { GROUPS } from "./groups";
import { ES_SEARCHABLE_FIELDS, ES_SEARCHABLE_WILDCARDS } from "../constants";
import {APIError} from "../components/errorFormatting";
import StackTracey from 'stacktracey'

var bearer = localStorage.getItem("bearer")
let SearchAPI = axios.create({
  baseURL: `${process.env.REACT_APP_SEARCH_API_URL}`,
  headers: {
      Authorization:
      "Bearer " + bearer,
      "Content-Type": "application/json"
    }
});

function handleError(error,stack){
  console.debug("handleError", error, stack);
  var top = stack.withSourceAt (0) 
  error.target = error.config.baseURL + error.config.url;
  var APIErrorMSG = APIError.digestError(error);
  var bundled = {error: APIErrorMSG, stack: top};
  return (bundled);
}



export const esb = require('elastic-builder');
/*
 * Auth Validation  method
 * 
 * return:  { status}
 */
// Something of a hack to validate the auth token
// Maybe removeable with handling in app.js?
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
      .catch(error => {
        var stack = new StackTracey ()// captures the current call stack
        var bundled = handleError(error, stack);
        return Promise.reject(bundled); 
        // return {status: err.response.status, results: err.response.data}
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
  let payload = search_api_filter_es_query_builder(params, 0, 100);
  return axios 
    .post(
      `${process.env.REACT_APP_SEARCH_API_URL}/search`,
      payload, 
      options
    )
    .then(res => {
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
    .catch(error => {
      var stack = new StackTracey ()// captures the current call stack
      var bundled = handleError(error, stack);
      return Promise.reject(bundled); 
    });
};

export function api_search2(params, auth, from, size, fields, colFields) { 
  let payload = search_api_filter_es_query_builder(fields, from, size, colFields );
  console.debug("SearchAPI Payload", payload);
  return SearchAPI
      .post('/search',payload) 
      .then(res => {
        // console.debug("SearchAPI RES", res);
        if(res.status !== 200){
          console.debug("Got Err in 200 again");
          throw new Error(res.data);
        }
        if(res.data.hits){
          let hits = res.data.hits.hits;
          let entities = [];
          hits.forEach(s => {
            let data = s['_source']
            data['id'] = s['_source']['uuid']
            entities.push(data);
          });
          return {status: res.status, results: entities, total: res.data.hits.total.value}
        }else{
          //  lacking hits likely means we hit another error?
          console.debug("No Hits No Error", res.data);
          return {status: res.status, results: res.data} 
        }
      })
      .catch(error => {
        var stack = new StackTracey ()// captures the current call stack
        var bundled = handleError(error, stack);
        return Promise.reject(bundled);    
    });
};


/*
 * Elasticsearch query builder helper
 *
 */
export function search_api_filter_es_query_builder(fields, from, size, colFields) {
let requestBody =  esb.requestBodySearch();
let boolQuery = "";
// console.debug("Fields", fields);
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
    .sort(esb.sort('last_modified_timestamp', 'desc'))
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

export function get_assay_type(assay) { 
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
         return {status: 500, results: err.response}
      });
};
