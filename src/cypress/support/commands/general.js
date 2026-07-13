/* eslint-disable no-undef */

import { authInfoString } from '../authSession';

const smokeGroups = [
  {
    displayname: 'Cypress Smoke Group',
    name: 'cypress-smoke-group',
    shortname: 'Cypress',
    uuid: '00000000-0000-0000-0000-000000000001',
    data_provider: true,
  },
];

const mockAuthInfo = {
  name: 'Cypress Mock User',
  email: 'cypress@example.org',
  auth_token: 'mock-auth-token',
  transfer_token: 'mock-transfer-token',
  groups_token: 'mock-groups-token',
};

function getAuthInfo() {
  const authInfo = Cypress.env('authInfo');
  return JSON.parse(authInfoString(authInfo));
}

function seedAuthenticatedLocalStorage(win, authInfo) {
  win.localStorage.setItem('info', JSON.stringify(authInfo));
  win.localStorage.setItem('userGroups', JSON.stringify(smokeGroups));
  win.localStorage.setItem('allGroups', JSON.stringify(smokeGroups));
  win.localStorage.setItem('organs', JSON.stringify({ RK: 'Right Kidney', LK: 'Left Kidney', BL: 'Blood' }));
  win.localStorage.setItem('organ_icons', JSON.stringify({}));
  win.localStorage.setItem('organs_full', JSON.stringify([
    { rui_supported: true, rui_code: 'RK' },
    { rui_supported: true, rui_code: 'LK' },
    { rui_supported: false, rui_code: 'BL' },
  ]));
  win.localStorage.setItem('RUIOrgans', JSON.stringify(['RK', 'LK']));
  win.localStorage.setItem('dataset_types', JSON.stringify([{ dataset_type: 'RNAseq' }]));
  win.localStorage.setItem('menuMap', JSON.stringify({
    datasetadmin: { blackList: ['collection', 'epicollection'] },
    publication: { whiteList: ['dataset'] },
    collection: { whiteList: ['dataset'] },
    epicollection: { whiteList: ['dataset'] },
    sample: { blackList: ['collection', 'epicollection', 'dataset', 'upload', 'publication'] },
  }));
}

Cypress.Commands.add('visitWithAuth', (path, options = {}) => {
  const { onBeforeLoad, ...visitOptions } = options;
  const authInfo = getAuthInfo();

  cy.visit(path, {
    ...visitOptions,
    onBeforeLoad(win) {
      seedAuthenticatedLocalStorage(win, authInfo);
      if (onBeforeLoad) onBeforeLoad(win);
    },
  });
});

Cypress.Commands.add('visitWithMockAuth', (path, options = {}) => {
  const {
    authInfo = mockAuthInfo,
    groups = smokeGroups,
    searchResults = [],
    onBeforeLoad,
    ...visitOptions
  } = options;

  cy.intercept('GET', '**/status.json', {
    statusCode: 200,
    body: {
      entity_api: { neo4j_connection: true },
      ingest_api: { neo4j_connection: true },
      ontology_api: { neo4j_connection: true },
      search_api: { elasticsearch_status: 'green' },
    },
  }).as('gatewayStatus');

  cy.intercept('POST', '**/search', {
    statusCode: 200,
    body: {
      hits: {
        hits: searchResults.map((result) => ({ _source: result })),
        total: { value: searchResults.length },
      },
    },
  }).as('searchApi');

  cy.intercept('GET', '**/metadata/usergroups', {
    statusCode: 200,
    body: { groups },
  }).as('userGroups');

  cy.visit(path, {
    ...visitOptions,
    onBeforeLoad(win) {
      seedAuthenticatedLocalStorage(win, authInfo);
      win.localStorage.setItem('userGroups', JSON.stringify(groups));
      win.localStorage.setItem('allGroups', JSON.stringify(groups));
      if (onBeforeLoad) onBeforeLoad(win);
    },
  });
});
