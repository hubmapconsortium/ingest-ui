import {beforeEach, describe, expect, it, vi} from "vitest";
import {
  forceLogoutForExpiredEntityLogin,
  NON_ACTIVE_LOGIN_ERROR,
} from "../../utils/auth_expiration";
import {STORAGE_RESET_PENDING_KEY} from "../../utils/version_storage";

describe("forceLogoutForExpiredEntityLogin", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marks storage for reset and starts server logout for an expired entity login", () => {
    const location = {replace: vi.fn()};

    expect(
      forceLogoutForExpiredEntityLogin(
        {
          status: 401,
          data: {error: NON_ACTIVE_LOGIN_ERROR},
        },
        {
          location,
          logoutUrl: "https://ingest.example/logout",
        }
      )
    ).toBe(true);

    expect(localStorage.getItem(STORAGE_RESET_PENDING_KEY)).toBeTruthy();
    expect(location.replace).toHaveBeenCalledWith(
      "https://ingest.example/logout"
    );
  });

  it.each([
    [403, NON_ACTIVE_LOGIN_ERROR],
    [401, "Another authorization error"],
    [401, undefined],
  ])("does not log out for status %s and error %s", (status, error) => {
    const location = {replace: vi.fn()};

    expect(
      forceLogoutForExpiredEntityLogin(
        {status, data: {error}},
        {location, logoutUrl: "https://ingest.example/logout"}
      )
    ).toBe(false);

    expect(localStorage.getItem(STORAGE_RESET_PENDING_KEY)).toBeNull();
    expect(location.replace).not.toHaveBeenCalled();
  });
});
