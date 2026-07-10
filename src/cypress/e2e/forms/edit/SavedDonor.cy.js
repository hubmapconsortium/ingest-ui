/* global beforeEach, cy, describe, it */

// Cypress tests for the newDonor form
// Covers both /new/donor and /donor/:uuid routes

describe('Donor Form - View Existing Entity', () => {
  const donorUrl = '/donor/4413c7ba71ae446a8d4080b5ebbaf7fb';

  beforeEach(() => {
    cy.visitWithAuth(donorUrl);
  });

  it('should load the donor form for a specific UUID', () => {
    cy.contains('Donor Information').should('exist');
  });

  it('should display correct entity data in the header', () => {
    cy.get('.entityDataHead').within(() => {
      cy.contains('HuBMAP ID: HBM544.CDJS.566').should('exist');
      cy.contains('Entered by: neumane@vanderbilt.edu').should('exist');
      cy.contains('Group: Vanderbilt TMC').should('exist');
      cy.contains('Submission ID: VAN0001').should('exist');
      cy.contains('Entry Date: 9/20/2019, 2:53:13 PM').should('exist');
    });
  });

  it('should display correct form field values and all fields should be disabled', () => {
    cy.get('input#lab_donor_id').should('have.value', '66592').and('be.disabled');
    cy.get('input#label').should('have.value', '66592').and('be.disabled');
    cy.get('input#protocol_url').should('have.value', 'dx.doi.org/10.17504/protocols.io.7hhhj36').and('be.disabled');
    cy.get('textarea#description').should('have.value', 'Age 21 , White Male, Trauma Patient').and('be.disabled');
  });

  it('should only show the Cancel button at the bottom', () => {
    cy.get('.entityForm').within(() => {
      cy.get('button').contains('Cancel').should('exist').and('be.visible');
      cy.get('button').not(':contains("Cancel")').should('not.exist');
    });

  });

});
