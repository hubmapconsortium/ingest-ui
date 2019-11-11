export function getFileNameOnPath(file_path) {
  if (file_path)
    return file_path.substring(
      file_path.lastIndexOf("/") + 1,
      file_path.length
    );
  else return "";
}

export function getFileMIMEType(file_name) {
  if (file_name) {
    let arr = file_name.split(".");
    const ext = arr[arr.length - 1];
    if (ext === "doc") {
      return "application/msword";
    } else if (ext === "docx") {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    } else if (ext === "pdf") {
      return "application/pdf";
    } else if (ext === "Choose a file") {
      return "";
    } else {
      return "unknown";
    }
  } else return "";
}
