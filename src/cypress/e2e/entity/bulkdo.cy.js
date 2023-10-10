import {MSGS, PATHS, DATA, WAIT, SELECTORS} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.Bulk`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    it('Able to bulk register source', () => {
        cy.bulkDoStepOne(0, 'example_source_1_line.tsv')
        cy.get('.MuiAlert-message').contains('Validation successful please continue onto the next step')
        cy.get(SELECTORS.btns.default).contains('Next').click()
        cy.get('#group_uuid').select('University of Pittsburgh TMC')
        cy.get(SELECTORS.btns.default).contains('Next').click()
        cy.wait(WAIT.time * 7)
        cy.get(SELECTORS.modal.title).contains('Sources registered')
        cy.get('.modal-footer .btn').eq(0).contains('Close').click()
        cy.wait(WAIT.time * 2)
        cy.get(SELECTORS.btns.default).contains('Finish').click()
    })

    it('Fails on register of bad source', () => {
        cy.bulkDoStepOne(0, 'example_source_bad.tsv')
        cy.get('.MuiStepLabel-labelContainer .MuiStepLabel-label').should('have.class', 'Mui-error')
    })

    it('Fails on bad sample.block', () => {
        cy.bulkDoStepOne(1, 'example_source_bad.tsv', 'Metadata')
        cy.get('.MuiStepLabel-labelContainer .MuiStepLabel-label').should('have.class', 'Mui-error')
    })



})