/* global Cypress */

export const requiredAuthInfoFields = [
  'name',
  'email',
  'groups_token',
];

function parseJsonish(value, label) {
  if (!value || typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function envFirst(...names) {
  return names.map((name) => Cypress.env(name)).find(Boolean);
}

export function authInfoFromGlobusSession() {
  const token = envFirst('groups_token', 'token', 'globusToken');
  const sessionDisplayName = envFirst('session_displayname', 'sessionDisplayName', 'display_name');

  if (!token) {
    return null;
  }

  if (!sessionDisplayName) {
    throw new Error('Globus token auth requires session_displayname.');
  }

  return {
    name: sessionDisplayName,
    email: sessionDisplayName,
    groups_token: token,
  };
}

export function normalizeAuthInfo(authInfo, label = 'CYPRESS_AUTH_INFO') {
  const parsedAuthInfo = parseJsonish(authInfo, label);
  const normalizedAuthInfo = parsedAuthInfo || authInfoFromGlobusSession();

  if (!normalizedAuthInfo) {
    throw new Error(
      'Missing Cypress auth session. Provide authInfo or token plus session_displayname before running authenticated Cypress specs.'
    );
  }

  const missingFields = requiredAuthInfoFields.filter((field) => !normalizedAuthInfo[field]);
  if (missingFields.length > 0) {
    throw new Error(`Cypress auth session is missing: ${missingFields.join(', ')}`);
  }

  return normalizedAuthInfo;
}

export function authInfoString(authInfo, label = 'CYPRESS_AUTH_INFO') {
  return JSON.stringify(normalizeAuthInfo(authInfo, label));
}

export function selectedAuthRole() {
  return Cypress.env('serviceAuthRole') || Cypress.env('authRole');
}

export function getConfiguredAuthInfo() {
  const authInfoByRole = Cypress.env('authInfoByRole') || {};
  const role = selectedAuthRole();
  return (role && authInfoByRole[role]) ? authInfoByRole[role] : Cypress.env('authInfo');
}
