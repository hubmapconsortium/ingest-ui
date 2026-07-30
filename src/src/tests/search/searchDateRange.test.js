import { describe, expect, it } from "vitest";
import { search_api_filter_es_query_builder } from "../../service/search_api";

function getRangeFilter(query) {
  const filters = Array.isArray(query.query.bool.filter)
    ? query.query.bool.filter
    : [query.query.bool.filter];
  return filters.find((filter) => filter.range)?.range;
}

describe("advanced search date range", () => {
  it("filters the selected target date across both inclusive calendar dates", () => {
    const query = search_api_filter_es_query_builder(
      {
        entity_type: "Dataset",
        date_from: "2026-07-01",
        date_to: "2026-07-17",
      },
      0,
      100,
      ["uuid"],
      "newTable",
    );

    expect(getRangeFilter(query)).toEqual({
      created_timestamp: {
        gte: 1782864000000,
        lte: 1784332799999,
      },
    });
  });

  it("ignores legacy target fields and treats one selected date as one day", () => {
    const query = search_api_filter_es_query_builder(
      { date_field: "last_modified_timestamp", date_from: "2026-07-01" },
      0,
      100,
      ["uuid"],
      "newTable",
    );

    expect(getRangeFilter(query)).toEqual({
      created_timestamp: {
        gte: 1782864000000,
        lte: 1782950399999,
      },
    });
  });
});
