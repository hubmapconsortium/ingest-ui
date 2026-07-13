import { describe, expect, it } from "vitest";
import { getEntityRoutePath } from "../../components/ui/formParts";
import {
  getCanonicalEntityPath,
  getEntityIdFromPath,
} from "../../components/EntityRedirectResolver";

describe("getEntityRoutePath", () => {
  it("builds same-origin entity paths without the configured app URL", () => {
    expect(getEntityRoutePath("Donor", "donor-1")).toBe("/donor/donor-1");
    expect(getEntityRoutePath("Sample", "sample-1")).toBe("/sample/sample-1");
    expect(getEntityRoutePath("Dataset", "dataset-1")).toBe("/dataset/dataset-1");
    expect(getEntityRoutePath("Upload", "upload-1")).toBe("/upload/upload-1");
    expect(getEntityRoutePath("Publication", "publication-1")).toBe("/publication/publication-1");
    expect(getEntityRoutePath("Collection", "collection-1")).toBe("/collection/collection-1");
    expect(getEntityRoutePath("EPICollection", "epicollection-1")).toBe("/epicollection/epicollection-1");
  });

  it("normalizes legacy data upload labels to the upload route", () => {
    expect(getEntityRoutePath("Data Upload", "upload-1")).toBe("/upload/upload-1");
  });
});

describe("entity redirect fallback helpers", () => {
  it("uses the last URL segment as the candidate entity ID", () => {
    expect(getEntityIdFromPath("/samples/HBM123.TEST.456")).toBe("HBM123.TEST.456");
    expect(getEntityIdFromPath("/erererhrhihr/52842684idNumber5967")).toBe("52842684idNumber5967");
    expect(getEntityIdFromPath("/")).toBeNull();
  });

  it("builds the canonical route from the resolved entity type and requested ID", () => {
    expect(getCanonicalEntityPath({ entity_type: "Sample" }, "HBM123.TEST.456")).toBe("/sample/HBM123.TEST.456");
    expect(getCanonicalEntityPath({ entity_type: "Donor" }, "HBM423.ECT.001")).toBe("/donor/HBM423.ECT.001");
    expect(getCanonicalEntityPath({ entity_type: "Data Upload" }, "upload-1")).toBe("/upload/upload-1");
  });

  it("does not build a canonical route without an entity type", () => {
    expect(getCanonicalEntityPath({}, "HBM123.TEST.456")).toBeNull();
  });
});
