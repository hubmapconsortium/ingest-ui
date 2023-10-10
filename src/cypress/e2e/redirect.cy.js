import {MSGS, PATHS, DATA, WAIT, SELECTORS} from "../config/constants";

describe(`${MSGS.name}.Redirect`, () => {

    it('User is sent back to desired page after login', () => {
        cy.interceptProtocols()
        cy.visit(`${PATHS.edit}/sample?uuid=${DATA.sample.block.uuid}`)
        cy.contains('Access denied')
        cy.contains('here').click()
        cy.wait(WAIT.time)
        cy.loginProcess()
        cy.wait(WAIT.time * 2)
        cy.contains(DATA.sample.block.sennetId)
        cy.contains('Register location')
    })
})