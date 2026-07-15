/* global cy, Cypress, describe, expect, it */

function visitWithSessionInfo() {
  cy.visitWithAuth('/', { log: false });
  cy.window({ log: false }).then((win) => {
    const storedAuthInfo = win.localStorage.getItem('info');
    expect(storedAuthInfo, 'authenticated session is stored').to.be.a('string');
    expect(JSON.parse(storedAuthInfo)).to.have.property('groups_token');
  });
}

describe('Authenticated search smoke', () => {
  it('loads the authenticated search UI and returns results', () => {
    visitWithSessionInfo();

    cy.get('#keywords', { timeout: 30000 }).should('be.visible');
    cy.get('#applySearchButton').should('be.visible');
    cy.get('.MuiDataGrid-root', { timeout: 30000 }).should('exist');

    const keyword = Cypress.env('authSearchKeyword');
    if (keyword) {
      cy.get('#keywords').clear().type(keyword);
      cy.get('#applySearchButton').click();
    }

    cy.get('.MuiDataGrid-columnHeader[data-field="hubmap_id"]', { timeout: 30000 })
      .should('exist');
    cy.get('.MuiDataGrid-row', { timeout: 60000 })
      .should('have.length.greaterThan', 0);
  });
});
