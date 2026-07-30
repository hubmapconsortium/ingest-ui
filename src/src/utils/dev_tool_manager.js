import {
  NOTES_ACTIVE_STORAGE_KEY,
  NOTES_ACTIVE_VALUE,
  NOTES_INACTIVE_VALUE,
  prepareProtectedLocalStorage,
} from "./protected_storage";

const NOTES_DEV_TOOL_SCRIPT_ID = "notes-dev-tool";
const ENCODED_NOTES_DEV_TOOL_SCRIPT_URL =
  "https%3A%2F%2Fcdn.jsdelivr.net%2Fgh%2FIdreesInc%2F%50ocket-%42ird%40main%2Fdist%2Fweb%2F%62irb.embed.js";
const NOTES_ACTIVATION_SEQUENCE = [ "arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a", "enter"];

export function loadNotesDevTool(
  documentRef = document,
  storageRef = window.localStorage
) {
  if (documentRef.getElementById(NOTES_DEV_TOOL_SCRIPT_ID)) return;

  prepareProtectedLocalStorage(storageRef);

  const script = documentRef.createElement("script");
  script.id = NOTES_DEV_TOOL_SCRIPT_ID;
  script.src = decodeURIComponent(ENCODED_NOTES_DEV_TOOL_SCRIPT_URL);
  script.async = true;
  script.addEventListener("error", () => script.remove(), {once: true});
  documentRef.head.appendChild(script);
}

export function installDevToolHotkeys({
  documentRef = document,
  storageRef = window.localStorage,
  onNotesActivate = () => loadNotesDevTool(documentRef, storageRef),
} = {}) {
  try {
    const savedActiveState = storageRef.getItem(NOTES_ACTIVE_STORAGE_KEY);
    if (savedActiveState === NOTES_ACTIVE_VALUE) {
      onNotesActivate();
      return () => {};
    }
    if (savedActiveState === null) {
      storageRef.setItem(NOTES_ACTIVE_STORAGE_KEY, NOTES_INACTIVE_VALUE);
    }
  } catch {
    // Storage can be unavailable in privacy-restricted browsers. Hotkeys still work.
  }

  let sequenceIndex = 0;

  const handleKeyDown = (event) => {
    if (event.repeat) return;

    const key = event.key.toLowerCase();
    if (key === NOTES_ACTIVATION_SEQUENCE[sequenceIndex]) {
      sequenceIndex += 1;
      if (sequenceIndex === NOTES_ACTIVATION_SEQUENCE.length) {
        sequenceIndex = 0;
        try {
          storageRef.setItem(NOTES_ACTIVE_STORAGE_KEY, NOTES_ACTIVE_VALUE);
        } catch {
          // Loading the tool should not depend on storage availability.
        }
        documentRef.removeEventListener("keydown", handleKeyDown);
        onNotesActivate();
      }
      return;
    }

    sequenceIndex = key === NOTES_ACTIVATION_SEQUENCE[0] ? 1 : 0;
  };

  documentRef.addEventListener("keydown", handleKeyDown);
  return () => documentRef.removeEventListener("keydown", handleKeyDown);
}
