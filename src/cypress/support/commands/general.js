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
import {DATA, PATHS, WAIT, AUTH} from '../../config/constants';
// import { AUTH } from '../../config/auth';

Cypress.Commands.add('clog', (msg) => {
    cy.log(`/********** ${msg} ************/`)
})

Cypress.Commands.add('loginProcess', (msg) => {
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