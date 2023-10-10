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
import {DATA, PATHS, WAIT} from '../../config/constants';
import { AUTH } from '../../config/auth';

Cypress.Commands.add('clog', (msg) => {
    cy.log(`/********** ${msg} ************/`)
})

Cypress.Commands.add('loginProcess', (msg) => {
    cy.contains('Log in with your institution credentials').click()
    cy.origin('auth.globus.org',  { args: { AUTH } }, ({ AUTH }) => {
        // Use Globus
        cy.contains('Globus ID to sign in').click()
    })

    cy.origin('www.globusid.org', { args: { AUTH } }, ({ AUTH })  => {
        cy.get('input[name="username"]').type(AUTH.user)
        cy.get('input[name="password"]').type(AUTH.password)
        cy.get('button[type="submit"]').click()
    })
})

Cypress.Commands.add('login', (options = { }, name = 'pitt') => {
    cy.viewport('macbook-13')
    cy.session(name, () => {
        if (!options.triggered) {
            cy.visit(PATHS.login)
        }
        // cy.loginProcess()

        cy.contains('Search')
    })
})

Cypress.Commands.add('facets', (name = 'Sample', legend = 'Sample Category', index = 2) => {
    cy.wait(WAIT.time)
    //cy.get('.sui-facet__title--EntityType').click() // Entity Type should be opened by default, but uncomment to open
    cy.get(`#sui-facet--EntityType-${name}`).parent().click()
    if (legend && legend.length) {
        cy.get(`.sui-facet__title--${legend.replaceAll(' ', '')}`).should('have.text', legend)
    }
})

Cypress.Commands.add('copyVal', (delimiter = 'SenNet ID:', key = 'cypress.sennet_id', sel = '.modal-body div') => {
    cy.get(sel).should(($el) => {
        const txt = $el.text()
        //expect(text).to.match(/foo/)
        const id = txt.split(delimiter)[1].trim()
        localStorage.setItem(key, id)
        return id
    })
})

Cypress.Commands.add('checkHipaa', () => {
    cy.get('.hipaa-alert').should('have.length', 1)
})

Cypress.Commands.add('viewEntity', (entity, id) => {
    const url = PATHS.view.replace('{entity}', entity).replace('{id}', id)
    cy.visit(`${url}`)
})

Cypress.Commands.add('interceptProtocols', () => {
    // Intercept the jsonp requests to protocols made that triggers 'unexpected' while running in cypress
    const randomJsonForNoError = 'http://localhost:3000/api/ontology/C020076'
    cy.intercept('/view/603-3-amp-604*', (req) => {
        req.url = randomJsonForNoError
    })
    cy.intercept('/10.17504/4*', (req) => {
        req.url = randomJsonForNoError
    })
    cy.intercept('/view/protocol-*', (req) => {
        req.url = randomJsonForNoError
    })
})

Cypress.Commands.add('assertValueCopiedToClipboard', value => {
    cy.window().then(win => {
        win.navigator.clipboard.readText().then(text => {
            expect(text).to.eq(value)
        })
    })
})

Cypress.Commands.add('getNthChild', (index) => {
  return cy.get(`root-div > div:nth-child(${index})`);
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