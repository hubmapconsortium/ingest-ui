/* global cy, describe, it */

import {
  assertEmptySubmitValidation,
  assertFormLoaded,
} from './formTestHelpers';

const donorForm = {
  entityType: 'Donor',
  path: '/new/donor',
  submitLabel: 'Generate ID',
  selectors: [
    'input#label',
    'input#protocol_url',
    'textarea#description',
    'select#group_uuid',
  ],
};

describe('Donor form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(donorForm.path);
    assertFormLoaded(donorForm);
    assertEmptySubmitValidation(donorForm);
  });

  it('prefills from URL parameters', () => {
    cy.viewport(1280, 900);
    const donorParams = new URLSearchParams({
      lab_donor_id: 'test-donor-id',
      label: 'test donor label',
      protocol_url: 'dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf',
      description: 'test donor description',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.visitWithMockAuth(`/new/donor?${donorParams.toString()}`);

    cy.get('input#lab_donor_id', { timeout: 30000 }).should('have.value', 'test-donor-id');
    cy.get('input#label').should('have.value', 'test donor label');
    cy.get('input#protocol_url').should('have.value', 'dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf');
    cy.get('textarea#description').should('have.value', 'test donor description');
    cy.get('select#group_uuid').should('have.value', '00000000-0000-0000-0000-000000000001');
    cy.contains('Passing Form values from URL parameters').should('be.visible');
  });
});
