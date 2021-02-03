// Search APIs

import axios from "axios";
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

    console.log(options)
  let payload = api_filter_es_query_builder(params);

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

        return {status: res.status, results: entities}
      })
      .catch(err => {
         return {status: 500, results: err.response}
      });
};

/*
 * Elasticsearch query builder helper
 *
 */
export function api_es_query_builder(fields) {

  let requestBody = esb.requestBodySearch();
 
  console.log(fields)

  Object.keys(fields).forEach(f => {
  //console.log(f + ':' + p[f])
    requestBody.query(esb.matchQuery(f, fields[f]));
  })
  console.log(requestBody.toJSON());
  return requestBody.toJSON();
}

export function api_filter_es_query_builder(fields) {

  let requestBody =  esb.requestBodySearch();
 console.log("here in the filter es builder")
 console.log(fields);

  let boolQuery = esb.boolQuery();

  if (Object.keys(fields).length === 0 && fields.constructor === Object) {
   // boolQuery.must(esb.matchAllQuery());
    //boolQuery.must(esb.matchQuery("entity_type", "Donor"));
    //boolQuery.filter(esb.termQuery("entity_type", "Sample"));
    boolQuery.should([
        esb.termQuery('entity_type.keyword', 'Donor'),
        esb.termQuery('entity_type.keyword', 'Sample')
    ]);
  } else {
   

    // boolQuery.filter(esb.termQuery("entity_type", "Donor"));
    // boolQuery.filter(esb.termQuery("entity_type", "Sample"));

    if (fields["group_name"]) {
      boolQuery.must(esb.matchQuery("group_name", fields["group_name"]));
    } 

    // if (fields["specimen_type"]) {
    //   if (fields["specimen_type"] !== 'donor') {
    //     boolQuery.must(esb.matchQuery("specimen_type", fields["specimen_type"]));
    //   } else {
    //     boolQuery.must(esb.matchQuery("entity_type", 'Donor'));
    //   }
    // } 
    if (fields["specimen_type"]) {
      boolQuery.must(esb.matchQuery("specimen_type", fields["specimen_type"]));
    } 


    if (fields["entity_type"]) {
       boolQuery.must(esb.matchQuery("entity_type", fields["entity_type"]));
    }
    // else {
    //     boolQuery.should([
    //       esb.termQuery('entity_type', 'Donor'),
    //       esb.termQuery('entity_type', 'Sample')
    //      ]);
    //  }

    if (fields["search_term"]) {
         boolQuery.filter(esb.multiMatchQuery(['description', 'group_name', 'hubmap_display_id', 'display_doi', 
          'lab_donor_id', 'hubmap_id', 'created_by_user_displayname', 'title'], fields["search_term"]));
    }
  
  }
  requestBody.query(boolQuery).size(100);

  console.log(requestBody.toJSON());
  return requestBody.toJSON();
}

