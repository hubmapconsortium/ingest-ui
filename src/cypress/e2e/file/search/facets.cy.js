import {MSGS, PATHS, SELECTORS, WAIT} from "../../../config/constants";

describe(`${MSGS.name}.File.${MSGS.search}.Facets`, () => {
    beforeEach(() => {
        cy.visit(PATHS.searchFiles)
    })

    it("Facets present 'File Type', 'Organs', 'Data Type', 'Modification Date' ", () => {
        const facets = ['File Type', 'Organs', 'Data Type', 'Modification Date']
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

    it("Headers include: 'Dataset SenNet ID', 'Files', 'Sample Type', 'Data Types', 'Size'", () => {

        //DEP: Requires headings to be in following order on the page
        const headers = ['Dataset SenNet ID', 'Files', 'Sample Type', 'Data Types', 'Size']
        for (let i = 0; i < headers.length; i++) {
            cy.get(SELECTORS.table.th).eq(i).should('have.text', headers[i])
        }
    })

})