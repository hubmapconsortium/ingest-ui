import {MSGS, PATHS} from "../../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.${MSGS.create}.Source`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    context("Ensure success of creating Source:", () => {
        it('Displays Hipaa', () => {
            cy.entityCreateForm()
            cy.checkHipaa()
        })
        it("Displays modal", () => {
            cy.entityCreateForm()
            cy.get('#group_uuid').select('University of Pittsburgh TMC')
            cy.enterToSource()
        })
    })

})