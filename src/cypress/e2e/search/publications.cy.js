/* eslint-disable no-undef */
import {MSGS, PATHS, WAIT,SELECTORS, DATA} from "../../config/constants";

describe(`${MSGS.name}.${MSGS.searchPub}`, () => {
    beforeEach(() => {
        cy.viewport(1000, 1000)
        cy.visit(PATHS.searchPub)
        cy.wait(WAIT.time);
    })

     const checkResult = ({targetHID = DATA.examples.publication.hubmapID}) => {
        
        cy.wait(WAIT.time)
        cy.get('.MuiDataGrid-row--lastVisible [data-field=hubmap_id] .MuiDataGrid-cellContent')
            .invoke('attr', 'title')
            .as('HubMAPID');
         cy.get('@HubMAPID')
            .then(function($elem) {
                cy.log('elem: ' + $elem)
                expect($elem).to.equal(targetHID)
            })
     }
    it("BLAHBLAHBLAH", () => {
        checkResult({})
    })
})

