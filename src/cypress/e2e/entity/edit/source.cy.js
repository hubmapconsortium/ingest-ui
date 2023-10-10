import {MSGS, PATHS, DATA} from "../../../config/constants";

describe(`${MSGS.name}.${MSGS.entity}.${MSGS.edit}.Source`, () => {
    beforeEach(() => {
        cy.login()
        cy.interceptProtocols()
        cy.visit(`${PATHS.edit}/source?uuid=${DATA.source.human.uuid}`)
    })

    context("Ensure success of editing Source:", () => {
        it('Displays Hipaa', () => {
            cy.checkHipaa()
        })
        it("Values populated", () => {
            cy.inputValueExists(['#lab_source_id', '#protocol_url', '#source_type'])
            cy.inputValueExists(['#description'], 'val', 10)
        })
        it("Displays modal", () => {
            cy.enterToSource('Updated')
        })
    })

})