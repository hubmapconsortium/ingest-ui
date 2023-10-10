
import {MSGS, PATHS, DATA, SELECTORS, WAIT} from "../config/constants";

describe(`${MSGS.name}.Table Bulk Export`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    it('Able to check all and select menu', () => {
        cy.get(SELECTORS.table.checkAll).click()
        cy.get(SELECTORS.table.checkAll)
            .invoke('attr', 'data-total')
            .then((total) => {
                cy.get(SELECTORS.table.bodyCheckbox).should('have.length', total)
            })
        cy.get('#sui-tbl-checkbox-actions').click()
        cy.get('#sui-tbl-checkbox-actions .dropdown-item').should('have.length', 2)
    })


    it('Able to copy id to clipboard', () => {
        cy.get(SELECTORS.search).clear()
        cy.get(SELECTORS.search).type(`${DATA.dataset.public.sennetId}{enter}`)
        cy.wait(WAIT.time)
        cy.get('.popover-clipboard-pc sup').click()
        cy.assertValueCopiedToClipboard(DATA.dataset.public.sennetId)
    })
})