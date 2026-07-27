import {describe, expect, it} from "vitest";
import {getSampleGenerationError} from "../../utils/errorAlert";

describe("getSampleGenerationError", () => {
  it("returns a safe, actionable message for an Axios 504 response", () => {
    const error = {
      message: "Request failed with status code 504",
      response: {
        status: 504,
        data: {raw: "gateway response that should not be rendered"},
      },
    };

    const result = getSampleGenerationError(error);

    expect(result.title).toBe("Sample generation is taking longer than expected");
    expect(result.userMessage).toContain("may still have been created");
    expect(result.userMessage).toContain("avoid creating duplicates");
    expect(JSON.stringify(result)).not.toContain("gateway response");
  });

  it("recognizes the wrapped error returned by the entity service", () => {
    expect(getSampleGenerationError({
      error: {response: {status: 504}},
    })).not.toBeNull();
  });

  it("leaves non-504 errors to the existing error handling", () => {
    expect(getSampleGenerationError({
      response: {status: 422},
    })).toBeNull();
  });
});
