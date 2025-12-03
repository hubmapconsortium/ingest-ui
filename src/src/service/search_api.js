// Search APIs

import axios from "axios";
import {ES_SEARCHABLE_FIELDS,ES_SEARCHABLE_WILDCARDS} from "../constants";
import {ingest_api_all_user_groups} from "./ingest_api";
export const esb = require("elastic-builder");

const globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;
const options = {
    headers: {
      Authorization: "Bearer " + globalToken,
      "Content-Type": "application/json",
    },
  };

/*
 * Auth Validation  method
 *
 * return:  { status}
 */
// Something of a hack to validate the auth token
export function api_validate_token(){
  let payload = search_api_filter_es_query_builder("test", 1, 1);
  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, payload, options)
    .then((res) => {
      return {status: res.status};
    } )
    .catch((error) => {
      return {error};
    } );
}

/*
 * Search API method
 *
 * return:  { status, results}
 */
export function api_search(params){
  let payload = search_api_filter_es_query_builder(params, 0, 100);
  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, payload, options)
    .then((res) => {
      let hits = res.data.hits.hits;

      let entities = {};
      hits.forEach((s) => {
        let uuid = s["_source"]["uuid"];
        if (entities[uuid]){
          entities[s["_source"]["uuid"]].push(s["_source"]);
        } else {
          entities[s["_source"]["uuid"]] = [s["_source"]];
        }
      } );

      return {status: res.status, results: entities};
    } )
    .catch((error) => {
      return {error};
    } );
}

export function api_search2(params, auth, from, size, fields){
  let payload = search_api_filter_es_query_builder(params, from, size, fields);
  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, payload, options)
    .then((res) => {
      // console.debug("API api_search2 res", res);
      let hits = res.data.hits.hits;
      let entities = [];
      hits.forEach((s) => {
        let data = s["_source"];
        data["id"] = s["_source"]["uuid"];
        entities.push(data);
      } );
      return {
        status: res.status,
        results: entities,
        total: res.data.hits.total.value,
      };
    } )
    .catch((error) => {
      return {error};
    } );
}

/*
 * Elasticsearch query builder helper
 *
 */
export function search_api_filter_es_query_builder(
  fields,
  from,
  size,
  colFields
){
  let requestBody = esb.requestBodySearch();
  let boolQuery = "";
  console.group('%c◉ search_api_filter_es_query_builder ', 'color:#E7EEFF;background: #9359FF;padding:200' );
    console.debug('%c◉ fields ', 'color:#E7EEFF;background: #C800FF;padding:200', fields);
    console.debug('%c◉ from ', 'color:#E7EEFF;background: #D859FF;padding:200', from, );
    console.debug('%c◉ size ', 'color:#E7EEFF;background: #E959FF;padding:200', size );
    console.debug('%c◉ colFields ', 'color:#E7EEFF;background: #E959FF;padding:200', colFields );
  // Always build a bool query and, if keywords contain a wildcard, add a
  // queryStringQuery as an additional MUST instead of short-circuiting the
  // whole builder. This preserves group/entity/organ filters while still
  // allowing wildcard searches across the wildcard-capable fields.
  const hasWildcard = fields && fields["keywords"] && fields["keywords"].indexOf("*") > -1;
  boolQuery = esb.boolQuery();

  // if no field criteria is sent just default to a (keeps prior behavior)
  if (Object.keys(fields).length === 0 && fields.constructor === Object){
    // console.debug("full search")
    boolQuery.must(
      esb.matchQuery(
        "entity_type",
        "Donor OR Sample OR Dataset OR Upload OR Publication OR Collection OR Epicollection"
      )
    );
  } else {
    // was a group name selected
    if (fields["group_name"]){
      boolQuery.must(
        esb.matchQuery("group_name.keyword", fields["group_name"])
      );
    } else if (fields["group_uuid"]){
      // this'll be from the dropdown,
      boolQuery.must(
        esb.matchQuery("group_uuid.keyword", fields["group_uuid"])
      );
    }

    // was specimen types selected
    if (fields["sample_category"]){
      // console.debug("sample_category", fields["sample_category"]);
      if (fields["sample_category"] !== "donor"){
        boolQuery.must(
          esb.matchQuery("sample_category.keyword", fields["sample_category"])
        );
      } else {
        boolQuery.must(esb.matchQuery("entity_type.keyword", "Donor"));
      }
    } else if (fields["organ"]){
      boolQuery.must(esb.matchQuery("organ.keyword", fields["organ"]));
    } else {
      // was entity types select
      if (fields["entity_type"]){

        if(["Data Upload"].includes(fields["entity_type"])){
          fields["entity_type"] = "Upload";
        }

        if (fields["entity_type"] === "DonorSample"){
          // hack to deal with no type selected from the UI, this clues from the donor/sample filer
          boolQuery.must(esb.matchQuery("entity_type", "Donor OR Sample"));
        } else {
          boolQuery.must(
            esb.matchQuery("entity_type.keyword", fields["entity_type"])
          );
        }
      } else {
        boolQuery.must(
          esb.matchQuery(
            "entity_type",
            "Donor OR Sample OR Dataset OR Upload OR Publication OR Collection OR Epicollection"
          )
        ); // default everything ; this maybe temp
      }
    }


    if (fields["status"]){
      let queryString = fields["status"].join(" OR ");
      boolQuery.must(
        esb.matchQuery("status", queryString)
      );
    }

    // keywords handling: preserve HBM exact-match behavior, otherwise use
    // multiMatch for non-wildcard keywords. Wildcard keywords are handled
    // after this block by adding a queryStringQuery as a MUST so other
    // filters are not dropped.
    // Determine if the UI has asked to target a single field for keyword searches
    const targetField = fields["target_field_select"];
    // default keyword fields (non-wildcard) and wildcard-capable fields
    const keywordSearchFields = targetField && targetField.length > 0 && targetField !== 'allcom' ? [targetField] : ES_SEARCHABLE_FIELDS;
    const wildcardSearchFields = targetField && targetField.length > 0 && targetField !== 'allcom' ? [targetField] : ES_SEARCHABLE_WILDCARDS;

    if (fields["keywords"]){
      if (fields["keywords"] && fields["keywords"].indexOf("HBM") === 0){
        // exact HubMAP id match stays the same
        boolQuery.must(
          esb.matchQuery("hubmap_id.keyword", fields["keywords"])
        );
      } else if (!hasWildcard) {
        // non-wildcard: use multiMatch across either the targeted field or the default searchable fields
        boolQuery.filter(
          esb.multiMatchQuery(keywordSearchFields, fields["keywords"])
        );
      }
    }

    // If we have a wildcard keyword, add it as an additional MUST so it
    // coexists with other filters rather than replacing them. Respect target field if provided.
    if (hasWildcard){
      boolQuery.must(
        esb.queryStringQuery(fields["keywords"]).fields(wildcardSearchFields)
      );
    }
  }
  if (fields["keywords"] && fields["keywords"].indexOf("HBM") > -1){
    // console.debug('%c⊙', 'color:#00ff7b', "BOOLQUERY", boolQuery );
    requestBody
      .query(boolQuery)
      .from(from)
      .size(1)
      .sort(esb.sort("last_modified_timestamp", "asc"))
      .source(colFields)
      .trackTotalHits(true);
  } else {
    requestBody
      .query(boolQuery)
      .from(from)
      .size(size)
      .sort(esb.sort("last_modified_timestamp", "asc"))
      .source(colFields)
      .trackTotalHits(true);
  }
  console.debug('%c◉ requestBody Total: ', 'color:#00ff7b', requestBody.toJSON() );
  console.groupEnd();

  return requestBody.toJSON();
}

/*
 * Elasticsearch Special query builder for returning multiple entities by UUID/Hubmap_id
 *
 */
export function search_api_es_query_ids(IDs,types,colFields){
  // console.debug('%c◉ search_api_es_query_ids', 'color:#00ff7b', IDs, IDs.length, types, colFields);
  const idsearch = esb.boolQuery()
    .should([
        esb.termsQuery('uuid.keyword', IDs.filter(id => !id.includes('.'))),
        esb.termsQuery('hubmap_id.keyword',IDs.filter(id => id.includes('.')))
    ])
    .minimumShouldMatch(1)

    let requestBody = esb.requestBodySearch();
    requestBody
      .query(idsearch)
      .size(IDs.length)
      .source( {
        // "includes": [ "uuid", "hubmap_id", "entity_type"],
        "includes": colFields,
        "excludes": ["*.NO_SUCH_THING"]
      } )

  // console.debug('%c◉ requestBody ', 'color:#00ff7b', requestBody.toJSON());
  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, requestBody.toJSON(), options)
    .then((res) => {
      // console.debug("API api_search2 res", res);
      // console.debug('%c◉ res ', 'color:#00ff7b', res);
      let hits = res.data.hits.hits;
      let entities = [];
      hits.forEach((s) => {
        let data = s["_source"];
        data["id"] = s["_source"]["uuid"];
        entities.push(data);
      } );
      return {
        status: res.status,
        results: entities,
        total: res.data.hits.total.value,
      };
    } )
    .catch((error) => {
      return {error};
    } );
  // return requestBody.toJSON();
}

// this WAS a  function that reads from a static file groups.jsx
export function search_api_search_group_list(){
  ingest_api_all_user_groups(
    JSON.parse(localStorage.getItem("info")).groups_token
  )
    .then((res) => {
      // no need to filter out the data_providers, the ingest api does that for us
      let groups = res.results;
      return groups;
    } )
    .catch((err) => {
      // console.debug(
      //   "%c⭗",
      //   "color:#ff005d",
      //   "search_api_search_group_list error",
      //   err
      // );
      return err;
    } );
}

export function search_api_get_assay_type(assay){
  return axios
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`)
    .then((res) => {
      let data = res.data;
      var found_dt = undefined;
      data.result.forEach((s) => {
        if (s["name"] === assay){
          found_dt = s;
        }
      } );

      // console.debug(found_dt);
      return {status: res.status, results: found_dt};
    } )
    .catch((error) => {
      return {error};
    } );
}

export function search_api_get_assay_set(scope){
  // Scope informs either Primary, Alt, or All
  var target = "";
  switch (scope){
    case "primary":
      target = "?primary=true";
      break;
    case "alt":
      target = "?primary=false";
      break;
    default:
      break;
  }
  return (
    axios
      // primaryness NEEDS to be in the url, not a form body addon
      .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype` + target)
      .then((res) => {
        let data = res.data;
        let mapCheck = data.result.map((value) => {
          return value;
        } );
        // console.debug("API get_processed_assays data", data, mapCheck);
        return {data};
      } )
      .catch((error) => {
        // console.debug("search_api_get_assay_set", error, error.response);
        if (error.response){
          return {
            status: error.response.status,
            results: error.response.data,
          };
        } else {
          return {error};
        }
      } )
  );
}

export function search_api_get_assay_primaries(){
  return axios
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype?primary=true`)
    .then((res) => {
      let data = res.data;
      let dtListMapped = data.result.map((value) => {
        return value;
      } );
      return {status: res.status, data: dtListMapped};
    } )
    .catch((error) => {
      return {error};
    } );
}