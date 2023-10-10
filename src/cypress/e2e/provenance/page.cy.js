import {MSGS, PATHS, DATA, WAIT} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.provenance}.Page`, () => {

    beforeEach(() => {
        cy.login()

    })

    context('Ensure provenance loads', () => {
        it('Displays nodes', () => {
            cy.viewEntity('dataset', DATA.dataset.bulkRnaSeq.uuid)
            cy.get('.js-provenance .node').should('have.length.gte', 1)
        })
        it('Expand button loads modal with provenance', () => {
            cy.viewEntity('dataset', DATA.dataset.bulkRnaSeq.uuid)
            cy.get('#Provenance .js-legend--Expand').eq(0).click()
            cy.get('.modal-full').should('have.length', 1)
            cy.get('.modal-full .modal-title').contains('Provenance')
            cy.get('.modal-full .js-provenance .node').should('have.length.gte', 1)
        })

        it('Clicking metadata button simultaneously selects node', () => {
            cy.viewEntity('dataset', DATA.dataset.codex.uuid)
            cy.wait(WAIT.time * 3)
            cy.get('#Metadata-collapse .nav-item a').eq(0).click()
            cy.get('.node.is-active').should('have.length.gte', 1)
        })

        it('Clicking node simultaneously selects metadata button', () => {
            cy.viewEntity('dataset', DATA.dataset.codex.uuid)
            cy.get('#node--6abdf1b6be804e5901edf8add100dc4d').click()
            cy.get('#Metadata-collapse [data-uuid="6abdf1b6be804e5901edf8add100dc4d"].active').should('have.length.gte', 1)
        })

    })

})