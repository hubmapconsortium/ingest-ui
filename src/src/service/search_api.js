// Search APIs

import axios from "axios";
// import { GROUPS } from "./groups";
import { ES_SEARCHABLE_FIELDS, ES_SEARCHABLE_WILDCARDS } from "../constants";

import { ingest_api_all_user_groups } from "./ingest_api";
export const esb = require("elastic-builder");

/*
 * Auth Validation  method
 *
 * return:  { status}
 */
// Something of a hack to validate the auth token
export function api_validate_token(auth) {
  const options = {
    headers: {
      Authorization: "Bearer " + auth,
      "Content-Type": "application/json",
    },
  };
  let payload = search_api_filter_es_query_builder("test", 1, 1);

  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, payload, options)
    .then((res) => {
      return { status: res.status };
    })
    .catch((error) => {
      return { error };
    });
}

/*
 * Search API method
 *
 * return:  { status, results}
 */
export function api_search(params, auth) {
  const options = {
    headers: {
      Authorization: "Bearer " + auth,
      "Content-Type": "application/json",
    },
  };

  let payload = search_api_filter_es_query_builder(params, 0, 100);

  return axios
    .post(`${process.env.REACT_APP_SEARCH_API_URL}/search`, payload, options)
    .then((res) => {
      let hits = res.data.hits.hits;

      let entities = {};
      hits.forEach((s) => {
        let uuid = s["_source"]["uuid"];
        if (entities[uuid]) {
          entities[s["_source"]["uuid"]].push(s["_source"]);
        } else {
          entities[s["_source"]["uuid"]] = [s["_source"]];
        }
      });

      return { status: res.status, results: entities };
    })
    .catch((error) => {
      return { error };
    });
}

export function api_search2(params, auth, from, size, fields, source) {
  // console.debug('%c⊙', 'color:#00ff7b', fields );
  // console.debug('%c⊙', 'color:#00ff7b', "api2", params, auth, from, size, fields,source);
  const options = {
    headers: {
      Authorization: "Bearer " + auth,
      "Content-Type": "application/json",
    },
  };
  let payload = search_api_filter_es_query_builder(params, from, size, fields);
  // console.debug('payload', payload)
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
      });
      return {
        status: res.status,
        results: entities,
        total: res.data.hits.total.value,
      };
    })
    .catch((error) => {
      return { error };
    });
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
) {
  // console.debug("%c⊙queryBits:", "color:#00ff7b", fields, from, size, colFields);
  let requestBody = esb.requestBodySearch();
  let boolQuery = "";
  if (fields["keywords"] && fields["keywords"].indexOf("*") > -1) {
    // if keywords contain a wildcard
    boolQuery = esb
      .queryStringQuery(fields["keywords"])
      .fields(ES_SEARCHABLE_WILDCARDS);
  } else {
    boolQuery = esb.boolQuery();
    // if no field criteria is sent just default to a
    if (Object.keys(fields).length === 0 && fields.constructor === Object) {
      // console.debug("full search")
      boolQuery.must(
        esb.matchQuery(
          "entity_type",
          "Donor OR Sample OR Dataset OR Upload OR Publication OR Collection"
        )
      );
    } else {
      // was a group name selected
      if (fields["group_name"]) {
        boolQuery.must(
          esb.matchQuery("group_name.keyword", fields["group_name"])
        );
      } else if (fields["group_uuid"]) {
        // this'll be from the dropdown,
        // if its a collection, we wanna search the datasets of it, not it itself
        if (fields["entity_type"] === "Collection") {
          boolQuery.must(
            esb.matchQuery("datasets.group_uuid.keyword", fields["group_uuid"])
          );
        } else {
          boolQuery.must(
            esb.matchQuery("group_uuid.keyword", fields["group_uuid"])
          );
        }
      }
      // was specimen types selected
      if (fields["sample_category"]) {
        // console.debug("sample_category", fields["sample_category"]);
        if (fields["sample_category"] !== "donor") {
          boolQuery.must(
            esb.matchQuery("sample_category.keyword", fields["sample_category"])
          );
        } else {
          boolQuery.must(esb.matchQuery("entity_type.keyword", "Donor"));
        }
      } else if (fields["organ"]) {
        boolQuery.must(esb.matchQuery("organ.keyword", fields["organ"]));
      } else {
        // was entity types select
        if (fields["entity_type"]) {
          if (fields["entity_type"] === "DonorSample") {
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
              "Donor OR Sample OR Dataset OR Upload OR Publication OR Collection"
            )
          ); // default everything ; this maybe temp
        }
      }

      if (fields["keywords"]) {
        if (fields["keywords"] && fields["keywords"].indexOf("HBM") === 0) {
          boolQuery.must(
            esb.matchQuery("hubmap_id.keyword", fields["keywords"])
          );
        } else {
          boolQuery.filter(
            esb.multiMatchQuery(ES_SEARCHABLE_FIELDS, fields["keywords"])
          );
        }
      }
    }
  }
  if (fields["keywords"] && fields["keywords"].indexOf("HBM") > -1) {
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
      .size(100)
      .sort(esb.sort("last_modified_timestamp", "asc"))
      .source(colFields)
      .trackTotalHits(true);
  }
  return requestBody.toJSON();
}

export function fixKeywordText(text) {
  let x = text.replace(/-/gi, "\\-");
  return x;
}

// this WAS a  function that reads from a static file groups.jsx
export function search_api_search_group_list() {
  ingest_api_all_user_groups(
    JSON.parse(localStorage.getItem("info")).groups_token
  )
    .then((res) => {
      // no need to filter out the data_providers, the ingest api does that for us
      let groups = res.results;
      return groups;
    })
    .catch((err) => {
      console.debug(
        "%c⭗",
        "color:#ff005d",
        "search_api_search_group_list error",
        err
      );
      return err;
    });
}

export function search_api_get_assay_type(assay) {
  return axios
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`)
    .then((res) => {
      let data = res.data;
      var found_dt = undefined;
      data.result.forEach((s) => {
        if (s["name"] === assay) {
          found_dt = s;
        }
      });

      console.debug(found_dt);
      return { status: res.status, results: found_dt };
    })
    .catch((error) => {
      return { error };
    });
}

export function search_api_get_assay_list(params) {
  // So the api defaults to primary even if False is passed as ?primary=false
  var primaryParam = {};
  if (params) {
    primaryParam = { params: params };
  }
  return (
    axios
      // Only regards flag via url for some reason?
      .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype?primary=true`)
      .then((res) => {
        let data = res.data;
        let dtListMapped = data.result.map((value, index) => {
          return value;
        });
        return { status: res.status, data: dtListMapped };
      })
      .catch((error) => {
        return { error };
      })
  );
}

export function search_api_get_assay_set(scope) {
  // Scope informs either Primary, Alt, or All
  var target = "";
  switch (scope) {
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
        let mapCheck = data.result.map((value, index) => {
          return value;
        });
        console.debug("API get_processed_assays data", data, mapCheck);
        return { data };
      })
      .catch((error) => {
        console.debug("search_api_get_assay_set", error, error.response);
        if (error.response) {
          return {
            status: error.response.status,
            results: error.response.data,
          };
        } else {
          return { error };
        }
      })
  );
}

export function search_api_get_assay_primaries() {
  return axios
    .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype?primary=true`)
    .then((res) => {
      let data = res.data;
      let dtListMapped = data.result.map((value, index) => {
        return value;
      });
      return { status: res.status, data: dtListMapped };
    })
    .catch((error) => {
      return { error };
    });
}
