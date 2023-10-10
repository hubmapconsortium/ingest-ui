import {MSGS, PATHS, DATA, WAIT, SELECTORS} from "../../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.${MSGS.create}.Sample`, () => {
    beforeEach(() => {
        cy.login()
        cy.interceptProtocols()
        cy.visit(PATHS.search)
    })

    context("Ensure success of creating Sample:", () => {
        it('Displays Hipaa', () => {
            cy.entityCreateForm('Sample', 1)
            cy.checkHipaa()
        })
        it("Displays modal", () => {
            cy.entityCreateForm('Sample', 1)
            cy.get(SELECTORS.forms.groupUuid).select('University of Pittsburgh TMC')
            cy.get('#direct_ancestor_uuid .btn').click()
            cy.searchTable(DATA.source.human.sennetId)
            cy.enterToSample()
        })
    })

})