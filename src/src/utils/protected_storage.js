export const PROTECTED_LOCAL_STORAGE_KEY = decodeURIComponent("%62%69%72bSaveData");
export const NOTES_ACTIVE_STORAGE_KEY = decodeURIComponent("%6E%6F%74eSaveActive");
export const UNLOCKED_FIELD = decodeURIComponent("%75%6E%6Clocked%53%70%65cies");
export const CURRENT_FIELD = decodeURIComponent("%63%75%72rent%53%70%65cies");
export const SETTINGS_FIELD = decodeURIComponent("%73%65%74tings");
export const NAME_FIELD = decodeURIComponent("%6E%61%6De");
export const BASELINE_VALUE = decodeURIComponent("%62%6C%75ebird");
export const CT_VALUE = decodeURIComponent("%63%75%62anTody");
export const DEFAULT_NAME_VALUE = decodeURIComponent("%54%61%72kus");
export const NOTES_ACTIVE_VALUE = decodeURIComponent("%74%72%75e");
export const NOTES_INACTIVE_VALUE = decodeURIComponent("%66%61%6Cse");
const PROTECTED_LOCAL_STORAGE_KEYS = new Set([
  PROTECTED_LOCAL_STORAGE_KEY,
  NOTES_ACTIVE_STORAGE_KEY,
]);
const LEGACY_NAME_FIELD = decodeURIComponent("%4E%61%6De");

export function prepareProtectedLocalStorage(storage = window.localStorage) {
  let rawSavedData = null;
  let savedData;
  try {
    rawSavedData = storage.getItem(PROTECTED_LOCAL_STORAGE_KEY);
    savedData = JSON.parse(rawSavedData);
  } catch {
    savedData = null;
  }

  const normalizedData =
    savedData && typeof savedData === "object" && !Array.isArray(savedData)
      ? {...savedData}
      : {[UNLOCKED_FIELD]: [BASELINE_VALUE]};
  const unlockedSpecies = Array.isArray(normalizedData[UNLOCKED_FIELD])
    ? [...normalizedData[UNLOCKED_FIELD]]
    : [];

  if (!unlockedSpecies.includes(BASELINE_VALUE)) {
    unlockedSpecies.unshift(BASELINE_VALUE);
  }
  if (!unlockedSpecies.includes(CT_VALUE)) {
    unlockedSpecies.push(CT_VALUE);
    normalizedData[CURRENT_FIELD] = CT_VALUE;
  }

  normalizedData[UNLOCKED_FIELD] = unlockedSpecies;
  const settings =
    normalizedData[SETTINGS_FIELD] &&
    typeof normalizedData[SETTINGS_FIELD] === "object" &&
    !Array.isArray(normalizedData[SETTINGS_FIELD])
      ? {...normalizedData[SETTINGS_FIELD]}
      : {};
  if (
    typeof settings[NAME_FIELD] !== "string" ||
    settings[NAME_FIELD].trim() === ""
  ) {
    settings[NAME_FIELD] =
      typeof normalizedData[LEGACY_NAME_FIELD] === "string" &&
      normalizedData[LEGACY_NAME_FIELD].trim() !== ""
        ? normalizedData[LEGACY_NAME_FIELD]
        : DEFAULT_NAME_VALUE;
  }
  delete normalizedData[LEGACY_NAME_FIELD];
  normalizedData[SETTINGS_FIELD] = settings;

  try {
    const normalizedValue = JSON.stringify(normalizedData);
    if (normalizedValue !== rawSavedData) {
      storage.setItem(PROTECTED_LOCAL_STORAGE_KEY, normalizedValue);
    }
  } catch {
    // Do not prevent the application from loading when storage is unavailable.
  }
  return normalizedData;
}

export function isProtectedLocalStorageKey(key) {
  return PROTECTED_LOCAL_STORAGE_KEYS.has(key);
}

export function removeLocalStorageItem(storage, key) {
  if (isProtectedLocalStorageKey(key)) return false;
  storage.removeItem(key);
  return true;
}

export function clearUnprotectedLocalStorage(storage = window.localStorage) {
  const keys = Array.from(
    {length: storage.length},
    (_, index) => storage.key(index)
  );

  for (const key of keys) {
    if (key !== null) removeLocalStorageItem(storage, key);
  }
}
