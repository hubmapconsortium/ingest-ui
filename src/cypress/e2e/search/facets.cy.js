import {MSGS, PATHS, WAIT} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.search}.Facets`, () => {
    beforeEach(() => {
        cy.visit(PATHS.search)
    })

    it("Facets present 'Entity Type', 'Data Type', 'Data Provider Group', 'Registered By' ", () => {
        const facets = ['Entity Type', 'Data Type', 'Data Provider Group', 'Registered By']
        let result = [];
        cy.wait(WAIT.time)
        cy.get('.sui-facet__title').each((el, index) => {
            const text = el.text()
            if (facets.indexOf(text) !== -1) {
                result.push(true)
            }
        })
        cy.wrap(result).its('length').should('eq', facets.length)
    })

})