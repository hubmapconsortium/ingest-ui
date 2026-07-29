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

  it("prefers an API response message over the generic Axios message", () => {
    expect(getSampleGenerationError({
      message: "Request failed with status code 422",
      response: {
        status: 422,
        data: {message: "The selected source sample is invalid."},
      },
    })).toEqual({
      title: "Error:",
      userMessage: "The selected source sample is invalid.",
    });
  });

  it("prefers a wrapped XHR response body over the generic Axios message", () => {
    expect(getSampleGenerationError({
      message: "Network Error",
      code: "ERR_NETWORK",
      request: {
        responseText: JSON.stringify({message: "Endpoint request timed out"}),
      },
    })).toEqual({
      title: "Error:",
      userMessage: "Endpoint request timed out",
    });
  });

  it("renders the Axios message when no response content is available", () => {
    expect(getSampleGenerationError({
      message: "Network Error",
      code: "ERR_NETWORK",
    }).userMessage).toBe("Network Error");
  });

  it("pretty prints and redacts message-less errors", () => {
    const result = getSampleGenerationError({
      code: "UNKNOWN",
      config: {
        headers: {Authorization: "Bearer sensitive-token"},
      },
    });

    expect(result.title).toBe("Error:");
    expect(result.formattedDetails).toContain('\n');
    expect(result.formattedDetails).toContain('"code": "UNKNOWN"');
    expect(result.formattedDetails).toContain('"Authorization": "[Redacted]"');
    expect(result.formattedDetails).not.toContain("sensitive-token");
  });
});
