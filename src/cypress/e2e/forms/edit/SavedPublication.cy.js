/* global beforeEach, cy, describe, it */

describe('Publication Form - View Existing Entity', () => {
  const pubUrl = '/publication/ced6498450bd1b7d05f8e59acbad244d';

  beforeEach(() => {
    cy.visitWithAuth(pubUrl);
  });

  it('should load the publication form for a specific UUID', () => {
    cy.contains('Publication Information').should('exist');
    cy.get('form').should('exist');
  });

  it('should display correct entity data in the header', () => {
    cy.get('.entityDataHead').within(() => {
      cy.contains('HuBMAP ID: HBM479.NXMM.494').should('exist');
      cy.contains('Status: SUBMITTED').should('exist');
      cy.contains('Entered by: JJW118@pitt.edu').should('exist');
      cy.contains('Group: IEC Testing Group').should('exist');
      cy.contains('Entry Date: 1/18/2024, 9:37:44 AM').should('exist');
    });
  });

  it('should have populated publication fields', () => {
    // Title
    cy.get('input#title').should('have.value', 'TestTitle');
    // Venue
    cy.get('input#publication_venue').should('have.value', 'testVenu');
    // Date (date input)
    cy.get('input#publication_date').should('have.value', '2024-01-18');
    // URL
    cy.get('input#publication_url').should('have.value', 'google.com');
    // DOI
    cy.get('input#publication_doi').should('have.value', 'pdoi');
    // OMAP DOI
    cy.get('input#omap_doi').should('have.value', 'odoi');
    // Issue / Volume / Pages
    cy.get('input#issue').should('have.value', '333');
    cy.get('input#volume').should('have.value', '343');
    cy.get('input#pages_or_article_num').should('have.value', '535');
    // Description / Abstract
    cy.get('textarea#description').should('have.value', 'Abstract Test');
  });

  it('should have a publication_status selected', () => {
    // Ensure at least one radio in the publication_status group is checked
    cy.get('input[name="publication_status"]').should('exist');
    cy.get('input[name="publication_status"]:checked').should('exist');
  });

});
