/* global Cypress, cy, expect */

export const devServices = {
  entityApi: Cypress.env('devEntityApiUrl') || 'https://entity-api.dev.hubmapconsortium.org',
  ingestApi: Cypress.env('devIngestApiUrl') || 'https://ingest-api.dev.hubmapconsortium.org',
};

export const protocolUrl = 'https://dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf';

export function getAuthInfo() {
  const authInfoByRole = Cypress.env('authInfoByRole') || {};
  const serviceAuthRole = Cypress.env('serviceAuthRole');
  const authInfo = (serviceAuthRole && authInfoByRole[serviceAuthRole])
    ? authInfoByRole[serviceAuthRole]
    : Cypress.env('authInfo');

  if (!authInfo) {
    throw new Error('Missing authInfo. Provide authInfo or authInfoByRole[serviceAuthRole] locally before running DEV service tests.');
  }

  const parsed = typeof authInfo === 'string' ? JSON.parse(authInfo) : authInfo;
  if (!parsed.groups_token) {
    throw new Error('CYPRESS_AUTH_INFO must include groups_token.');
  }
  return parsed;
}

export function assertDevOnly() {
  expect(devServices.entityApi, 'entity API target').to.include('.dev.');
  expect(devServices.ingestApi, 'ingest API target').to.include('.dev.');
}

export function serviceHeaders() {
  const authInfo = getAuthInfo();
  return {
    Authorization: `Bearer ${authInfo.groups_token}`,
    'Content-Type': 'application/json',
    'X-Hubmap-Application': 'ingest-ui-cypress-service-test',
  };
}

export function uniqueRunId(prefix) {
  return `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

export function entityApiRequest(method, path, body) {
  assertDevOnly();
  return cy.request({
    method,
    url: `${devServices.entityApi}${path}`,
    headers: serviceHeaders(),
    body,
    failOnStatusCode: false,
  });
}

export function ingestApiRequest(method, path, body) {
  assertDevOnly();
  return cy.request({
    method,
    url: `${devServices.ingestApi}${path}`,
    headers: serviceHeaders(),
    body,
    failOnStatusCode: false,
  });
}

export function expectSuccess(response, allowedStatuses = [200]) {
  expect(response.status, JSON.stringify(response.body)).to.be.oneOf(allowedStatuses);
}
