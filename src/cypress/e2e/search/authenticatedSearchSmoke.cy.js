/* global cy, Cypress, describe, expect, it */
const requiredSessionFields = [
  'name',
  'email',
  'groups_token',
];

function getAuthInfo() {
  const authInfo = Cypress.env('authInfo');

  if (!authInfo) {
    throw new Error(
      'Missing CYPRESS_AUTH_INFO. Export a local session JSON string before running this spec.'
    );
  }

  let parsedAuthInfo;
  try {
    parsedAuthInfo = JSON.parse(authInfo);
  } catch (error) {
    throw new Error('CYPRESS_AUTH_INFO must be valid JSON.');
  }

  const missingFields = requiredSessionFields.filter((field) => !parsedAuthInfo[field]);
  if (missingFields.length > 0) {
    throw new Error(`CYPRESS_AUTH_INFO is missing: ${missingFields.join(', ')}`);
  }

  return authInfo;
}

function visitWithSessionInfo() {
  const encodedAuthInfo = encodeURIComponent(getAuthInfo());

  cy.visit(`/?info=${encodedAuthInfo}`, { log: false });
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
