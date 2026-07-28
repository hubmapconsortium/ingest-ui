import { describe, expect, it } from "vitest";
import { gatewayServiceHealth } from "../../service/gateway_service";

describe("gateway service health", () => {
  it("preserves missing service results as unknown", () => {
    expect(gatewayServiceHealth({})).toEqual({
      entity_api: undefined,
      ingest_api: undefined,
      ontology_api: undefined,
      search_api: undefined,
    });
  });

  it("reports only explicit unhealthy service values as down", () => {
    expect(gatewayServiceHealth({
      entity_api: { neo4j_connection: false },
      ingest_api: { neo4j_connection: true },
      search_api: { elasticsearch_status: "red" },
    })).toEqual({
      entity_api: false,
      ingest_api: true,
      ontology_api: undefined,
      search_api: false,
    });
  });

  it("does not treat a degraded Elasticsearch response as down", () => {
    expect(gatewayServiceHealth({
      search_api: { elasticsearch_status: "yellow" },
    }).search_api).toBe(true);
  });
});
