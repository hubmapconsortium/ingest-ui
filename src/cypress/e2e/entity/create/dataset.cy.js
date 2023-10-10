import {MSGS, PATHS, DATA, SELECTORS} from "../../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.${MSGS.create}.Dataset`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    context("Ensure success of creating Dataset:", () => {
        it('Displays Hipaa', () => {
            cy.entityCreateForm('Dataset', 2)
            cy.checkHipaa()
        })
        it("Displays modal", () => {
            cy.entityCreateForm('Dataset', 2)
            cy.get(SELECTORS.forms.groupUuid).select('Duke University TMC')
            cy.selectAncestorInDataset(DATA.sample.block.sennetId)
            cy.selectAncestorInDataset(DATA.dataset.bulkRnaSeq.sennetId)
            cy.get(SELECTORS.table.ancestors).contains(DATA.sample.block.sennetId)

            // Delete
            cy.get(`${SELECTORS.table.ancestors} tr`).should('have.length', 3)
            cy.get(`${SELECTORS.table.ancestors} tr [type="button"]`).eq(1).click()
            cy.get(`${SELECTORS.table.ancestors} tr`).should('have.length', 2)
            cy.enterToDataset()
        })
    })

})