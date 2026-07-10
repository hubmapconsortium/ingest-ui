import { describe, expect, it } from "vitest";
import { getEntityRoutePath } from "../../components/ui/formParts";

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
