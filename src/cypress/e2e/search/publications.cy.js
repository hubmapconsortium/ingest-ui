/* eslint-disable no-undef */
import {MSGS, PATHS, WAIT, DATA} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.searchPub}`, () => {
    beforeEach(() => {
        cy.viewport(1000, 1000)
        cy.login(PATHS.login)
        cy.visit(PATHS.searchPub)
        cy.wait(2000);
    })
     const checkResult = ({targetHID = DATA.examples.publication.hubmapID}) => {
        cy.wait(1000)
        cy.get('.MuiDataGrid-row--lastVisible [data-field=hubmap_id] .MuiDataGrid-cellContent')
            .invoke('attr', 'title')
            .as('HubMAPID');
         cy.get('@HubMAPID')
            .then(function($elem) {
                cy.log('elem: ' + $elem)
                expect($elem).to.equal(targetHID)
            })
     }
    it("Should Return a single Result with a  Hubmap ID that matches the Keyword Search ", () => {
        checkResult({})
    })
})

