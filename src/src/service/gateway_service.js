
import axios from "axios";

export function gateway_api_status() { 
  return axios
    .get(`https://gateway.api.hubmapconsortium.org/status.json`)
      .then(res => {
        console.debug("gateway_api_status RES", res.status, res.data);
        const d = res.data || {};
        let services = {
          entity_api: Boolean(d.entity_api?.neo4j_connection),
          ingest_api: Boolean(d.ingest_api?.neo4j_connection),
          ontology_api: Boolean(d.ontology_api?.neo4j_connection),
          search_api: d.search_api?.elasticsearch_status === "green"
        }
        return {status: res.status, results: services};
      })
      .catch(error => {
        console.error("gateway_api_status ERROR", error);
        return {status: error.response ? error.response.status : 500, results: null}
      });
}

