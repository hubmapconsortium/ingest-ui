import {requestStorageReset} from "./version_storage";

export const NON_ACTIVE_LOGIN_ERROR = "401 Unauthorized: Non-active login";

export function forceLogoutForExpiredEntityLogin(
  response,
  {
    location = window.location,
    logoutUrl = `${process.env.REACT_APP_DATAINGEST_API_URL}/logout`,
  } = {}
) {
  if (
    response?.status !== 401 ||
    response?.data?.error !== NON_ACTIVE_LOGIN_ERROR
  ) {
    return false;
  }

  requestStorageReset();
  location.replace(logoutUrl);
  return true;
}
