import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import Result from "../../components/ui/result";

describe("Result", () => {
  it("renders every newly created sample HuBMAP ID with its entity link", () => {
    const html = renderToStaticMarkup(
      <Result
        result={{
          entity: {
            new_samples: [
              { uuid: "sample-uuid-1", hubmap_id: "HBM123.ABC.001" },
              { uuid: "sample-uuid-2", hubmap_id: "HBM123.ABC.002" },
              { uuid: "sample-uuid-3", hubmap_id: "HBM123.ABC.003" },
            ],
          },
        }}
      />
    );

    expect(html).toContain('href="/sample/sample-uuid-1">HBM123.ABC.001</a>');
    expect(html).toContain('href="/sample/sample-uuid-2">HBM123.ABC.002</a>');
    expect(html).toContain('href="/sample/sample-uuid-3">HBM123.ABC.003</a>');
  });
});
