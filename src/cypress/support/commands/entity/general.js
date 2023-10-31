import { WAIT, SELECTORS } from "../../../config/constants";

Cypress.Commands.add('entityCreateForm', (entity = 'Source', index = 0) => {
    cy.get('#nav-dropdown').click()
    cy.wait(WAIT.time)
    cy.get('#submenu-md-Single a').eq(index).click()
    cy.url().should('contain', `/edit/${entity.toLowerCase()}?uuid=register`)
})

Cypress.Commands.add('submitAndCheckModalTitle', (entity, action) => {
    cy.get('.js-btn--save').contains('Save').click()
    cy.wait(WAIT.time)
    cy.get(SELECTORS.modal.title).contains(`${entity} ${action}`)
    cy.copyVal()
})

Cypress.Commands.add('enterToSource', (action = 'Registered') => {
    cy.get('#lab_source_id').clear().type('Aorta')
    cy.get('#source_type').select('Human')
    cy.get(SELECTORS.forms.protocolUrl).clear().type('https://dx.doi.org/10.17504/protocols.io.bf4cjqsw')
    cy.get(SELECTORS.forms.desc).clear().type('Cypress automated description source')
    cy.submitAndCheckModalTitle('Source', action)
})

Cypress.Commands.add('enterToSample', (action = 'Registered') => {
    cy.get(SELECTORS.forms.sampleCategory).select('Organ')
    cy.get('#organ').select('Brain')
    cy.get(SELECTORS.forms.protocolUrl).clear().type('https://dx.doi.org/10.17504/protocols.io.af4cjqsw')
    cy.get(SELECTORS.forms.desc).clear().type('Cypress automated description sample')
    cy.get('#lab_tissue_sample_id').clear().type(`${Math.floor(Math.random() * 1000)}-organ`)
    cy.submitAndCheckModalTitle('Sample', action)
})

Cypress.Commands.add('enterToDataset', (action = 'Registered') => {
    cy.get('#lab_dataset_id').clear().type(`${Math.floor(Math.random() * 1000)}-lab`)
    cy.get(SELECTORS.forms.desc).clear().type('Cypress automated description dataset')
    cy.get('#dataset_info').clear().type('Additional Cypress automated description dataset')
    if (action === 'Registered') {
        cy.get('#data_types').select(1)
    }
    cy.get('#contains_human_genetic_sequences[value="false"]').check()
    cy.submitAndCheckModalTitle('Dataset', action)
})

Cypress.Commands.add('searchTable', (keyword) => {
    cy.wait(WAIT.time)
    cy.get(SELECTORS.search).clear().type(`${keyword}{enter}`)
    cy.wait(WAIT.time)
    //cy.get(SELECTORS.table.tr).eq(1).click()
    cy.get(SELECTORS.table.td).contains(keyword).click()
})

Cypress.Commands.add('clickAddAncestorButton', (id) => {
    // TODO: consolidate id name of this button in code
    cy.get('#direct_ancestor_uuid button, #direct_ancestor_uuid_button button').click()
})

Cypress.Commands.add('selectAncestorInDataset', (id) => {
    cy.clog('Selector Ancestor in Dataset')
    cy.clickAddAncestorButton()
    cy.wait(WAIT.time)
    cy.searchTable(id)
})

Cypress.Commands.add('inputValueExists', (selectors, prop = 'val', min = 2) => {
    for (let i = 0; i < selectors.length; i++) {
        cy.get(selectors[i]).invoke(prop).should((val) => {
            expect(val.length).to.be.at.least(min)
        })
    }
})

Cypress.Commands.add('bulkDoStepOne', (index, file, actionId= 'Create') => {
    if (actionId !== 'Create') {
        cy.get(`#nav-dropdown--bulk${actionId}`).click()
        cy.get(`[aria-labelledby="nav-dropdown--bulk${actionId}"] a`).eq(index).click()
    } else {
        cy.get('#nav-dropdown').click()
        cy.get('#submenu-md-Bulk a').eq(index).click()
    }

    cy.get('input[type=file]').selectFile(`cypress/fixtures/${file}`, {force: true})
    cy.get(SELECTORS.btns.default).contains('Next').click()
})