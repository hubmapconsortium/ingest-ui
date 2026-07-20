/* global Cypress, cy, expect */

import { getConfiguredAuthInfo, normalizeAuthInfo } from '../../../support/authSession';

export const devServices = {
  entityApi: Cypress.env('devEntityApiUrl') || 'https://entity-api.dev.hubmapconsortium.org',
  ingestApi: Cypress.env('devIngestApiUrl') || 'https://ingest-api.dev.hubmapconsortium.org',
  searchApi: Cypress.env('devSearchApiUrl') || 'https://search-api.dev.hubmapconsortium.org/v3',
  ubkgApi: Cypress.env('devUbkgApiUrl') || 'https://ontology-api.dev.hubmapconsortium.org',
};

export const protocolUrl = 'https://dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf';

let cachedServiceAuthInfo = null;

function parseAuthInfo(authInfo) {
  return normalizeAuthInfo(authInfo);
}

function validateAuthInfo(authInfo) {
  const parsed = parseAuthInfo(authInfo);

  if (!parsed || !parsed.groups_token) {
    throw new Error('Service auth session must include groups_token.');
  }

  return parsed;
}

function cacheServiceAuthInfo(authInfo) {
  cachedServiceAuthInfo = validateAuthInfo(authInfo);
  Cypress.env('serviceAuthInfo', cachedServiceAuthInfo);
  return cachedServiceAuthInfo;
}

export function getAuthInfo() {
  if (cachedServiceAuthInfo) {
    return cy.wrap(cachedServiceAuthInfo, { log: false });
  }

  const envAuthInfo = Cypress.env('serviceAuthInfo');
  if (envAuthInfo) {
    return cy.wrap(cacheServiceAuthInfo(envAuthInfo), { log: false });
  }

  return cy.wrap(cacheServiceAuthInfo(getConfiguredAuthInfo()), { log: false });
}

export function assertDevOnly() {
  expect(devServices.entityApi, 'entity API target').to.include('.dev.');
  expect(devServices.ingestApi, 'ingest API target').to.include('.dev.');
  expect(devServices.searchApi, 'search API target').to.include('.dev.');
  expect(devServices.ubkgApi, 'UBKG API target').to.include('.dev.');
}

export function serviceHeaders(authInfo) {
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
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.entityApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function ingestApiRequest(method, path, body) {
  assertDevOnly();
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.ingestApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function searchApiRequest(method, path, body) {
  assertDevOnly();
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.searchApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function ubkgApiRequest(method, path) {
  assertDevOnly();
  return cy.request({
    method,
    url: `${devServices.ubkgApi}${path}`,
    failOnStatusCode: false,
  });
}

export function expectSuccess(response, allowedStatuses = [200]) {
  expect(response.status, JSON.stringify(response.body)).to.be.oneOf(allowedStatuses);
}

export function getServiceGroupUuid() {
  const configuredGroupUuid = Cypress.env('devServiceGroupUuid');

  if (configuredGroupUuid) {
    return cy.wrap(configuredGroupUuid);
  }

  return ingestApiRequest('GET', '/metadata/usergroups')
    .then((response) => {
      expectSuccess(response);
      expect(response.body).to.have.property('groups');

      const serviceGroup = response.body.groups.find((group) => group.data_provider)
        || response.body.groups[0];

      expect(Boolean(serviceGroup), 'DEV service data-provider group').to.equal(true);
      expect(serviceGroup.uuid, 'DEV service group UUID').to.be.a('string');
      expect(serviceGroup.uuid.length, 'DEV service group UUID length').to.be.greaterThan(0);

      return serviceGroup.uuid;
    });
}
