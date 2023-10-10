import {MSGS, PATHS, WAIT} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.search}.Facets.Date`, () => {
    beforeEach(() => {
        cy.visit(PATHS.search)
    })

    const checkDate = ({name = 'CreationDate', subName = 'startdate', date = '2023-06-20'}) => {
        cy.get(`.sui-facet__title--${name}`).click()
        cy.wait(WAIT.time)
        let text
        cy.get('.sui-paging-info').then(function($elem) {
            text = $elem.text()
        })
        cy.get(`#sui-facet--${name}-${subName}`).clear().type(date)
        cy.wait(WAIT.time)
        cy.get('.sui-paging-info').then(function($elem) {
            //expect(text).to.not.match(/foo/)
            expect(text).not.equal($elem.text())
        })
    }


    it("Facets Create Date.startdate should be present and working", () => {
        checkDate({})
    })

    it("Facets Create Date.enddate should be present and working", () => {
        checkDate({subName: 'enddate', date: '2022-06-20'})
    })


    it("Facets Modification Date.startdate should be present and working", () => {
        checkDate({name: 'ModificationDate'})
    })

    it("Facets Modification Date.enddate should be present and working", () => {
        checkDate({name: 'ModificationDate', subName: 'enddate', date: '2022-06-20'})
    })

})