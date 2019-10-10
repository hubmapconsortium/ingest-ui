export function validateRequired(value) {
  if (typeof value === "string") {
    return value.trim() !== "";
  } else if (typeof value === "object") {
    return value.name.trim() !== "";
  }
}

export function validateProtocolIOURL(value) {
  if (value === undefined || value === "") return true;
  const patt = /^(http(s)?:\/\/(www\.)?)?protocols\.io\/.*/;
  return patt.test(value);
}

export function validateFileType(file_type, allow_types) {
  if (!file_type) return true;
  if (allow_types.includes(file_type)) return true;
  else return false;
}
