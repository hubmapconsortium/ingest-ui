
import axios from "axios";
import { logger } from "../utils/logger";

export function gatewayServiceHealth(data = {}) {
  const connectionHealth = (value) => {
    if (value === true || value === false) {
      return value;
    }
    return undefined;
  };
  const elasticsearchStatus = data.search_api?.elasticsearch_status;

  return {
    entity_api: connectionHealth(data.entity_api?.neo4j_connection),
    ingest_api: connectionHealth(data.ingest_api?.neo4j_connection),
    ontology_api: connectionHealth(data.ontology_api?.neo4j_connection),
    search_api: elasticsearchStatus === "red"
      ? false
      : ["green", "yellow"].includes(elasticsearchStatus)
        ? true
        : undefined,
  };
}

export function gateway_api_status() { 
  return axios
    .get(`https://gateway.api.hubmapconsortium.org/status.json`)
      .then(res => {
        logger.debug("gateway_api_status RES", res.status, res.data);
        return {status: res.status, results: gatewayServiceHealth(res.data)};
      })
      .catch(error => {
        logger.all.error({message: 'gateway_api_status', error_details: error})
        return {status: error.response ? error.response.status : 500, results: null}
      });
}
