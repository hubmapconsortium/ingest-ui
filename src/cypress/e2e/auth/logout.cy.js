import {MSGS, PATHS} from "../../config/constants";

describe(`${MSGS.name}.Auth`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    it('Logs out after log in', () => {
        cy.contains('Log out').click()
        cy.contains('Log in with your institution credentials')
    })
})