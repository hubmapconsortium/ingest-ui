/* eslint-disable no-undef */
// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
import {AUTH} from '../../config/constants';
// import { AUTH } from '../../config/auth';

const requiredAuthInfoFields = [
  'name',
  'email',
  'auth_token',
  'transfer_token',
  'groups_token',
];

const smokeGroups = [
  {
    displayname: 'Cypress Smoke Group',
    name: 'cypress-smoke-group',
    shortname: 'Cypress',
    uuid: '00000000-0000-0000-0000-000000000001',
    data_provider: true,
  },
];

function getAuthInfo() {
  const authInfo = Cypress.env('authInfo');
  if (!authInfo) {
    throw new Error('Missing CYPRESS_AUTH_INFO. Export a local session JSON string before running authenticated Cypress specs.');
  }

  let parsedAuthInfo;
  try {
    parsedAuthInfo = JSON.parse(authInfo);
  } catch (error) {
    throw new Error('CYPRESS_AUTH_INFO must be valid JSON.');
  }

  const missingFields = requiredAuthInfoFields.filter((field) => !parsedAuthInfo[field]);
  if (missingFields.length > 0) {
    throw new Error(`CYPRESS_AUTH_INFO is missing: ${missingFields.join(', ')}`);
  }

  return authInfo;
}

function seedAuthenticatedLocalStorage(win, authInfo) {
  win.localStorage.setItem('info', authInfo);
  win.localStorage.setItem('userGroups', JSON.stringify(smokeGroups));
  win.localStorage.setItem('allGroups', JSON.stringify(smokeGroups));
  win.localStorage.setItem('organs', JSON.stringify({ RK: 'Right Kidney', LK: 'Left Kidney', BL: 'Blood' }));
  win.localStorage.setItem('organ_icons', JSON.stringify({}));
  win.localStorage.setItem('organs_full', JSON.stringify([]));
  win.localStorage.setItem('RUIOrgans', JSON.stringify(['RK', 'LK']));
  win.localStorage.setItem('dataset_types', JSON.stringify([{ dataset_type: 'RNAseq' }]));
}

Cypress.Commands.add('visitWithAuth', (path, options = {}) => {
  const authInfo = getAuthInfo();
  const { onBeforeLoad, ...visitOptions } = options;

  cy.visit(path, {
    ...visitOptions,
    onBeforeLoad(win) {
      seedAuthenticatedLocalStorage(win, authInfo);
      if (onBeforeLoad) onBeforeLoad(win);
    },
  });
});

Cypress.Commands.add('clog', (msg) => {
    cy.log(`/********** ${msg} ************/`)
})

Cypress.Commands.add('loginProcess', () => {
    // cy.contains('Log in with your institution credentials').click()
    cy.wait(2000)
    cy.get('#identity_provider-selectized').type(AUTH.organization).type('{enter}')
    cy.get('#login-btn').click({ force: true })   
    cy.get('#username').type(AUTH.username)
    cy.get('#password').type(AUTH.password).type('{enter}')
    cy.wait(2000)
})

Cypress.Commands.add('login', (options = { }, name = 'pitt') => {
    cy.viewport('macbook-13')
    cy.session(name, () => {
        if (!options.triggered) {
            cy.visit("localhost:8484/login")
            cy.loginProcess()
        }
        cy.wait(2000)
        cy.contains('Search')
    })
})

let LOCAL_STORAGE_MEMORY = {};
Cypress.Commands.add("mSaveLocalStorage", () => {
  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});
Cypress.Commands.add("mRestoreLocalStorage", () => {
  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});

//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
