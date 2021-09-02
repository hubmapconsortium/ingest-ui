// Search APIs

import axios from "axios";
import { GROUPS } from "./groups";
import { ES_SEARCHABLE_FIELDS, ES_SEARCHABLE_WILDCARDS } from "../constants";

export const esb = require('elastic-builder');



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

export function api_search2(params, auth, from, size) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let payload = search_api_filter_es_query_builder(params, from , size);

  ////console.debug('payload', payload)

  return axios 
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
              payload, options
      )
      .then(res => {
       
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
         return {status: 500, results: err.response}
      });
};

/*
 * Elasticsearch query builder helper
 *
 */
export function search_api_filter_es_query_builder(fields, from, size) {

  let requestBody =  esb.requestBodySearch();
 ////console.debug("here in the filter es builder")
 ////console.debug(fields);


let boolQuery = "";

  if (fields["search_term"] && fields["search_term"].indexOf("*") > -1) {  // if keywords contain a wildcard
    boolQuery = esb.queryStringQuery(fields["search_term"])
      .fields(ES_SEARCHABLE_WILDCARDS)

  } else {

      boolQuery = esb.boolQuery();

      // if no field criteria is sent just default to a 
      if (Object.keys(fields).length === 0 && fields.constructor === Object) {
          console.debug("full search")
            boolQuery.must(esb.matchQuery('entity_type', 'Donor OR Sample OR Dataset')); 
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
        } else {
            // was entity types select
            if (fields["entity_type"]) {
              if (fields["entity_type"] === 'DonorSample') {  // hack to deal with no type selected from the UI, this clues from the donor/sample filer
                boolQuery.must(esb.matchQuery('entity_type', 'Donor OR Sample'));
              } else {
                boolQuery.must(esb.matchQuery("entity_type.keyword", fields["entity_type"]));
              }
            } else {
               boolQuery.must(esb.matchQuery("entity_type", 'Donor OR Sample OR Dataset'));  // default everything ; this maybe temp
            }
        }

        if (fields["search_term"]) {
          //let scrubbed = fixKeywordText(fields["search_term"]);
            boolQuery.filter(esb.multiMatchQuery(ES_SEARCHABLE_FIELDS, fields["search_term"]));
        }
      
      }
    }
  requestBody.query(boolQuery).from(from).size(size).sort(esb.sort('last_modified_timestamp', 'desc'));
  //requestBody.query(boolQuery).size(100);

  console.debug(requestBody.toJSON());
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