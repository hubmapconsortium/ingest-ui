import {MSGS, PATHS, DATA} from "../config/constants";

describe(`${MSGS.name}.Auth`, () => {
    beforeEach(() => {
        cy.login()
        cy.visit(PATHS.search)
    })

    it('Displays not found alert', () => {
        cy.visit({url: `${PATHS.edit}/dataset?uuid=blablabla`, failOnStatusCode: false })
        cy.contains('Oops! This page could not be found')
    })

})