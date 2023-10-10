import {MSGS, PATHS, DATA, WAIT, SELECTORS} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.RUI`, () => {
    beforeEach(() => {
        cy.login()
        cy.interceptProtocols()
    })

    it('Able to select RUI tool', () => {
        cy.visit(`${PATHS.edit}/sample?uuid=${DATA.sample.block.uuid}`)
        cy.contains('Register location')
    })

    it('Unable to select RUI tool', () => {
        cy.visit(`${PATHS.edit}/sample?uuid=${DATA.sample.organ.uuid}`)
        cy.contains('Register location').should('not.exist')
    })

})