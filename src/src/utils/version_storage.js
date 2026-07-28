export const APP_VERSION_STORAGE_KEY = "ingest-ui-version";
export const STORAGE_RESET_PENDING_KEY = "ingest-ui-storage-reset-pending";

function clearStorageForVersion(storage, version) {
  storage.clear();
  storage.setItem(APP_VERSION_STORAGE_KEY, version);
}

/**
 * Runs before the application modules are loaded so components never see a
 * partially cleared cache.
 *
 * Returns false when the browser is being sent through the server logout flow.
 */
export function prepareVersionedStorage({
  storage = window.localStorage,
  location = window.location,
  version = process.env.npm_package_version,
  logoutUrl = `${process.env.REACT_APP_DATAINGEST_API_URL}/logout`,
} = {}) {
  if (!version) return true;

  try {
    const pendingVersion = storage.getItem(STORAGE_RESET_PENDING_KEY);
    if (pendingVersion) {
      clearStorageForVersion(storage, version);
      return true;
    }

    const previousVersion = storage.getItem(APP_VERSION_STORAGE_KEY);
    if (!previousVersion) {
      storage.setItem(APP_VERSION_STORAGE_KEY, version);
      return true;
    }

    if (previousVersion === version) return true;

    if (storage.getItem("info")) {
      storage.setItem(STORAGE_RESET_PENDING_KEY, version);
      location.replace(logoutUrl);
      return false;
    }

    clearStorageForVersion(storage, version);
  } catch (error) {
    // Storage may be unavailable (for example, in a privacy-restricted browser).
    // Do not prevent the application from loading in that case.
    console.debug("Unable to prepare versioned local storage", error);
  }

  return true;
}

export function requestStorageReset(storage = window.localStorage) {
  try {
    storage.setItem(
      STORAGE_RESET_PENDING_KEY,
      process.env.npm_package_version || "pending"
    );
  } catch (error) {
    console.debug("Unable to mark local storage for reset", error);
  }
}
