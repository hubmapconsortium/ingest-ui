import {MSGS, PATHS, DATA} from "../../config/constants";

describe(`${MSGS.name}.Auth`, () => {

    it('Cannot create content when not logged in', () => {
        cy.visit(`${PATHS.edit}/dataset?uuid=register`)
        cy.contains('Access denied')
    })

    it('Cannot edit content when not logged in', () => {
        cy.visit(`${PATHS.edit}/dataset?uuid=${DATA.dataset.bulkRnaSeq.uuid}`)
        cy.contains('Access denied')
    })

})