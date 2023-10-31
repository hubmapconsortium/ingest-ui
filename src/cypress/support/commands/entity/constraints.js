import {DATA, SELECTORS, WAIT} from "../../../config/constants";

Cypress.Commands.add('basicConstraint', (ancestor = {name: 'Source', index: 1}, descendant = {name: 'Sample', index: 1}, constraints = [], action= {click: true}) => {
    cy.entityCreateForm(descendant.name, descendant.index)
    cy.clickAddAncestorButton()
    cy.facets(ancestor.name, null)
    cy.wait(WAIT.time)
    let $tr = ancestor.index !== undefined ? cy.get(SELECTORS.table.tr).eq(ancestor.index) : null
    if (ancestor.category) {
        $tr = cy.get(SELECTORS.table.td).contains(ancestor.category)
    }
    if (ancestor.keyword) {
        cy.searchTable(ancestor.keyword)
    }
    if ( action.click && $tr != null ){
        $tr.click()
    }
    if (action.callback ) {
        action.callback($tr, constraints)
    }
})

Cypress.Commands.add('checkSampleCategories', (constraints) => {
    cy.get(`${SELECTORS.forms.sampleCategory} option`).should('have.length', constraints.length + 1)
    const prefixMsg = 'Sample category dropdown has option: '
    for (let c of constraints) {
        if (typeof c === 'object') {
            cy.log(prefixMsg, c.name)
            cy.get(SELECTORS.forms.sampleCategory).select(c.name).should('have.value', c.val)
        } else {
            cy.log(prefixMsg, c)
            cy.get(SELECTORS.forms.sampleCategory).select(c).should('have.value', c) //c.toLowerCase()
        }
    }
})

Cypress.Commands.add('sampleConstraint', (ancestor = {name: 'Source', index: 1}, descendant = {name: 'Sample', index: 1}, constraints = [{name: 'Organ', val: 'Organ'}], action) => {
    cy.basicConstraint(ancestor, descendant, constraints, action)
    cy.wait(WAIT.time)
    cy.checkSampleCategories(constraints)
})
