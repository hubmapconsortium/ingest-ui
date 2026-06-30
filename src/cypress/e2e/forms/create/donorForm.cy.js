/* global cy, describe, it */

import {
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertSuccessDialog,
  assertUpdateSnackbar,
  editStates,
  interceptExistingEntity,
  protocolUrl,
  requestBody,
  successEntity,
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

  it('creates a donor from a complete valid form', () => {
    const createdDonor = successEntity('Donor', {
      uuid: 'donor-create-success',
      hubmap_id: 'HBM999.DONR.001',
      label: 'Created donor label',
    });
    const donorParams = new URLSearchParams({
      lab_donor_id: 'created-donor-lab-id',
      label: createdDonor.label,
      protocol_url: protocolUrl,
      description: 'Created donor description',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/entities/donor', {
      statusCode: 200,
      body: createdDonor,
    }).as('createDonor');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/donor?${donorParams.toString()}`);
    cy.contains('button', 'Generate ID').click({ force: true });

    requestBody('@createDonor').then((body) => {
      expect(body).to.include({
        lab_donor_id: 'created-donor-lab-id',
        label: createdDonor.label,
        protocol_url: protocolUrl,
        description: 'Created donor description',
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
    });
    assertSuccessDialog(createdDonor);
  });

  it('updates an existing donor from a valid edit form', () => {
    const donor = successEntity('Donor', {
      uuid: 'donor-edit-success',
      hubmap_id: 'HBM999.DONR.002',
      lab_donor_id: 'editable-donor-lab-id',
      label: 'Editable donor',
      protocol_url: protocolUrl,
      description: 'Original donor description',
    });

    interceptExistingEntity(donor, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${donor.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'Donor updated successfully' },
    }).as('updateDonor');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/donor/${donor.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated donor description');
    cy.contains('button', 'Update').click({ force: true });

    requestBody('@updateDonor').then((body) => {
      expect(body.description).to.equal('Updated donor description');
      expect(body.label).to.equal(donor.label);
    });
    assertUpdateSnackbar('Donor updated successfully');
  });
});
