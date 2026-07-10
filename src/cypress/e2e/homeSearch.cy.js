
tldr: does this look reasonable for coverage:
1 Home & 1 Embedded per main test (wildcard & base functioality),
that 1 Embedded also used for all-Embedded-specifc tests,
then each embedded just gets tests around their individual nuance)


// describe('Publication Form - View Existing Entity', () => {
//   const pubUrl = 'http://localhost:8585/publication/ced6498450bd1b7d05f8e59acbad244d';
//   const authInfo = '{"name":"Jessica Waldrip","email":"JJW118@pitt.edu","globus_id":"73e021ed-ab4a-4955-bdc4-248fa50d2860","auth_token":"AgrqwJPkOzN95MO9z896kMKg6ODpY6qJv4MePe39EmgDDgdbmBuXCe0zlWdKGn5m2OVvdVQ057Jvz5h0GO2GoT8rrJSvYY9FVddpT2aa7","transfer_token":"Ag89GlQbv3bqMaz9JrkwEbP9m2oyY3ryE36BxyqMBqGb3pb3Ggh8CgPzEEVyW2nOo60nxKymwVzVPoHyXlwX5t2EEx","groups_token":"Ag4pdByjmgMemdjVPjP9yQ106m2b6WYGjgblMw2VKXrpVmMQ83U7C9W9oqXBqV0W04MWM7ymbr1ml4HvVzBVPF5lyB"}';

//   beforeEach(() => {
//     cy.visit(pubUrl, {
//       onBeforeLoad(win) {
//         win.localStorage.setItem('info', authInfo);
//       }
//     });
//   });

//     it('should load the donor form for a specific UUID', () => {
//     cy.visit(donorUrl, {
//       onBeforeLoad(win) {
//         win.localStorage.setItem('info', authInfo);
//       }
//     });
//     cy.contains('Publication Information').should('exist');
//     cy.get('form').should('exist');
//   });

//   it('should display correct entity data in the header', () => {
//     cy.visit(donorUrl, {
//       onBeforeLoad(win) {
//         win.localStorage.setItem('info', authInfo);
//       }
//     });
//     cy.get('.entityDataHead').within(() => {
//       cy.contains('HuBMAP ID: HBM479.NXMM.494').should('exist');
//       cy.contains('Status: SUBMITTED').should('exist');
//       cy.contains('Entered by: JJW118@pitt.edu').should('exist');
//       cy.contains('Group: IEC Testing Group').should('exist');
//       cy.contains('Entry Date: 1/18/2024, 9:37:44 AM').should('exist');
//     });
//   });


//   it('should have populated publication fields', () => {
//     // Title
//     cy.get('input#title').should('have.value', 'TestTitle');
//     // Venue
//     cy.get('input#publication_venue').should('have.value', 'testVenu');
//     // Date (date input)
//     cy.get('input#publication_date').should('have.value', '2024-01-18');
//     // URL
//     cy.get('input#publication_url').should('have.value', 'google.com');
//     // DOI
//     cy.get('input#publication_doi').should('have.value', 'pdoi');
//     // OMAP DOI
//     cy.get('input#omap_doi').should('have.value', 'odoi');
//     // Issue / Volume / Pages
//     cy.get('input#issue').should('have.value', '333');
//     cy.get('input#volume').should('have.value', '343');
//     cy.get('input#pages_or_article_num').should('have.value', '535');
//     // Description / Abstract
//     cy.get('textarea#description').should('have.value', 'Abstract Test');
//   });

//   it('should have a publication_status selected', () => {
//     // Ensure at least one radio in the publication_status group is checked
//     cy.get('input[name="publication_status"]').should('exist');
//     cy.get('input[name="publication_status"]:checked').should('exist');
//   });

// });
