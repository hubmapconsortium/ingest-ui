/* global Cypress */

export const defaultAuthRole = 'basic';

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

export function normalizeAuthInfo(authInfo, label = 'Cypress auth info') {
  const normalizedAuthInfo = parseJsonish(authInfo, label);
  const requiredFields = ['name', 'email', 'groups_token'];
  const missingFields = requiredFields.filter((field) => !normalizedAuthInfo?.[field]);

  if (missingFields.length > 0) {
    throw new Error(`${label} must include: ${missingFields.join(', ')}.`);
  }

  return {
    name: normalizedAuthInfo.name,
    email: normalizedAuthInfo.email,
    groups_token: normalizedAuthInfo.groups_token,
  };
}

export function authInfoString(authInfo, label = 'Cypress auth info') {
  return JSON.stringify(normalizeAuthInfo(authInfo, label));
}

export function selectedAuthRole() {
  return Cypress.env('authRole') || defaultAuthRole;
}

export function getConfiguredAuthInfo() {
  const authAccounts = parseJsonish(Cypress.env('authAccounts'), 'authAccounts') || {};
  const role = selectedAuthRole();
  const authInfo = authAccounts[role];

  if (!authInfo) {
    throw new Error(`Missing Cypress auth account for role: ${role}.`);
  }

  return normalizeAuthInfo(authInfo, `Cypress auth account ${role}`);
}
