import {beforeEach, describe, expect, it, vi} from "vitest";
import {
  APP_VERSION_STORAGE_KEY,
  STORAGE_RESET_PENDING_KEY,
  prepareVersionedStorage,
  requestStorageReset,
} from "../../utils/version_storage";

describe("versioned local storage", () => {
  const version = "2.8.0";
  const logoutUrl = "https://ingest.example/logout";
  let location;

  beforeEach(() => {
    localStorage.clear();
    location = {replace: vi.fn()};
  });

  it("records the first known version without disrupting the session", () => {
    localStorage.setItem("info", '{"groups_token":"token"}');

    expect(
      prepareVersionedStorage({storage: localStorage, location, version, logoutUrl})
    ).toBe(true);
    expect(localStorage.getItem(APP_VERSION_STORAGE_KEY)).toBe(version);
    expect(localStorage.getItem("info")).not.toBeNull();
    expect(location.replace).not.toHaveBeenCalled();
  });

  it("starts logout without clearing storage when the version changes", () => {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, "2.7.0");
    localStorage.setItem("info", '{"groups_token":"token"}');
    localStorage.setItem("organs", '["kidney"]');

    expect(
      prepareVersionedStorage({storage: localStorage, location, version, logoutUrl})
    ).toBe(false);
    expect(location.replace).toHaveBeenCalledWith(logoutUrl);
    expect(localStorage.getItem("info")).not.toBeNull();
    expect(localStorage.getItem("organs")).not.toBeNull();
    expect(localStorage.getItem(STORAGE_RESET_PENDING_KEY)).toBe(version);
  });

  it("clears storage on the next app load and retains the current version", () => {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, "2.7.0");
    localStorage.setItem(STORAGE_RESET_PENDING_KEY, version);
    localStorage.setItem("info", '{"groups_token":"token"}');
    localStorage.setItem("organs", '["kidney"]');

    expect(
      prepareVersionedStorage({storage: localStorage, location, version, logoutUrl})
    ).toBe(true);
    expect([...Array(localStorage.length)].map((_, i) => localStorage.key(i))).toEqual([
      APP_VERSION_STORAGE_KEY,
    ]);
    expect(localStorage.getItem(APP_VERSION_STORAGE_KEY)).toBe(version);
    expect(location.replace).not.toHaveBeenCalled();
  });

  it("clears stale anonymous storage immediately", () => {
    localStorage.setItem(APP_VERSION_STORAGE_KEY, "2.7.0");
    localStorage.setItem("organs", '["kidney"]');

    expect(
      prepareVersionedStorage({storage: localStorage, location, version, logoutUrl})
    ).toBe(true);
    expect(localStorage.getItem("organs")).toBeNull();
    expect(localStorage.getItem(APP_VERSION_STORAGE_KEY)).toBe(version);
  });

  it("uses the same deferred reset for an ordinary logout", () => {
    requestStorageReset(localStorage);

    expect(localStorage.getItem(STORAGE_RESET_PENDING_KEY)).toBe(
      process.env.npm_package_version
    );
  });
});
