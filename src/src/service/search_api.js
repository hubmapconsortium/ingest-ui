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

    console.debug(options)
  let payload = search_api_filter_es_query_builder(params);

  return axios 
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`,
              payload, options
      )
      .then(res => {
        console.debug(res);
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
export function search_api_filter_es_query_builder(fields) {

  let requestBody =  esb.requestBodySearch();
 console.debug("here in the filter es builder")
 console.debug(fields);

  let boolQuery = esb.boolQuery();

  // if no field criteria is sent just default to a 
  if (Object.keys(fields).length === 0 && fields.constructor === Object) {
    boolQuery.must(esb.matchQuery('entity_type', 'Donor OR Sample OR Dataset'));  
  } else {
   
    // was a group name selected
    if (fields["group_name"]) {
      boolQuery.must(esb.matchQuery("group_name.keyword", fields["group_name"]));
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
      boolQuery.filter(esb.multiMatchQuery(['description.keyword', 'hubmap_display_id.keyword', 'display_doi.keyword', 
          'lab_donor_id.keyword', 'created_by_user_displayname', 'created_by_user_email'], fields["search_term"]));
    }
  
  }
  requestBody.query(boolQuery).size(100).sort(esb.sort('last_modified_timestamp', 'desc'));
  //requestBody.query(boolQuery).size(100);

  console.debug(requestBody.toJSON());
  return requestBody.toJSON();
}

export function fixKeywordText(text) {
  let x = text.replace(/-/gi, "\\-");
  console.debug('scrubbed', x)
return x

}
