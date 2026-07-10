/* global cy, describe, expect, it */

import {
  assertActionButtons,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertInvalidFieldValidation,
  assertMissingEntityRendersNotFoundInPlace,
  assertSuccessDialog,
  assertUpdateSnackbar,
  editStates,
  interceptExistingEntity,
  interceptNewSampleSource,
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
  requiredFields: [
    'input#label',
    'input#protocol_url',
  ],
};

describe('Donor form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(donorForm.path);
    assertFormLoaded(donorForm);
    assertEmptySubmitValidation(donorForm);
  });

  it('renders not-found content in place for missing donor IDs', () => {
    assertMissingEntityRendersNotFoundInPlace({
      path: '/donor',
      entityID: 'missing-donor-id',
    });
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

  it('rejects invalid protocol URL values', () => {
    const donorParams = new URLSearchParams({
      lab_donor_id: 'invalid-protocol-donor',
      label: 'Invalid protocol donor',
      protocol_url: 'https://example.org/not-a-protocol',
      description: 'Donor with invalid protocol URL',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/entities/donor').as('createDonorInvalidProtocol');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/donor?${donorParams.toString()}`);
    cy.contains('button', 'Generate ID').click({ force: true });

    assertInvalidFieldValidation({
      selector: 'input#protocol_url',
      message: 'Please enter a valid protocols.io URL',
    });
    cy.get('@createDonorInvalidProtocol.all').should('have.length', 0);
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

  it('follows success links to create an organ from a donor and start a sample from that organ', () => {
    const createdDonor = successEntity('Donor', {
      uuid: 'donor-create-organ-flow',
      hubmap_id: 'HBM999.DONR.101',
      label: 'Donor for organ flow',
    });
    const createdOrgan = successEntity('Sample', {
      uuid: 'organ-create-sample-flow',
      hubmap_id: 'HBM999.SAMP.101',
      direct_ancestor_uuid: createdDonor.uuid,
      sample_category: 'organ',
      organ: 'RK',
      lab_tissue_sample_id: 'organ-from-donor-flow',
    });
    const donorParams = new URLSearchParams({
      lab_donor_id: 'donor-organ-flow-lab-id',
      label: createdDonor.label,
      protocol_url: protocolUrl,
      description: 'Donor used to test organ and sample handoff links',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });
    const organSampleParams = {
      protocol_url: protocolUrl,
      lab_tissue_sample_id: createdOrgan.lab_tissue_sample_id,
      description: 'Organ sample created from donor success link',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    };

    cy.intercept('POST', '**/entities/donor', {
      statusCode: 200,
      body: createdDonor,
    }).as('createFlowDonor');
    cy.intercept('POST', '**/entities/sample', {
      statusCode: 200,
      body: createdOrgan,
    }).as('createFlowOrgan');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/donor?${donorParams.toString()}`);
    cy.contains('button', 'Generate ID').click({ force: true });
    requestBody('@createFlowDonor').then((body) => {
      expect(body.label).to.equal(createdDonor.label);
    });
    assertSuccessDialog(createdDonor);

    interceptNewSampleSource(createdDonor, [createdDonor]);
    cy.contains('button', 'Register an Organ from this Donor').click();

    cy.location('pathname', { timeout: 30000 }).should('equal', '/new/sample');
    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', createdDonor.hubmap_id);
    cy.contains('Source Category:').should('be.visible');
    cy.contains('Donor').should('be.visible');
    cy.get('#organ').should('exist').and('not.be.disabled');
    cy.get('#sample_category').should('not.exist');

    cy.get('#protocol_url').should('have.value', '');
    cy.get('#protocol_url').type(organSampleParams.protocol_url);
    cy.get('#lab_tissue_sample_id').type(organSampleParams.lab_tissue_sample_id);
    cy.get('textarea#description').type(organSampleParams.description);
    cy.get('select#group_uuid').select(organSampleParams.group_uuid);
    cy.get('#organ').select(createdOrgan.organ);
    cy.contains('button', 'Generate ID', { timeout: 30000 }).click({ force: true });

    requestBody('@createFlowOrgan').then((body) => {
      expect(body).to.include({
        direct_ancestor_uuid: createdDonor.uuid,
        protocol_url: organSampleParams.protocol_url,
        lab_tissue_sample_id: organSampleParams.lab_tissue_sample_id,
        description: organSampleParams.description,
        sample_category: 'organ',
        organ: createdOrgan.organ,
        group_uuid: organSampleParams.group_uuid,
      });
    });
    assertSuccessDialog(createdOrgan);

    interceptNewSampleSource(createdOrgan, [createdDonor, createdOrgan]);
    cy.contains('button', 'Register a new Sample from this Organ').click();

    cy.location('pathname', { timeout: 30000 }).should('equal', '/new/sample');
    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', createdOrgan.hubmap_id);
    cy.contains('Source Category:').should('be.visible');
    cy.contains('Organ').should('be.visible');
    cy.get('#organ').should('not.exist');
    cy.get('#sample_category').should('exist').and('not.be.disabled');
  });

  describe('action buttons', () => {
    const donor = successEntity('Donor', {
      uuid: 'donor-action-buttons',
      hubmap_id: 'HBM999.DONR.900',
      lab_donor_id: 'donor-action-buttons',
      label: 'Action button donor',
      protocol_url: protocolUrl,
      description: 'Action button donor description',
    });

    const cases = [
      {
        name: 'create mode shows Generate ID and Cancel',
        path: donorForm.path,
        visible: ['Generate ID', 'Cancel'],
        hidden: ['Update'],
      },
      {
        name: 'editable donor shows Update and Cancel',
        path: `/donor/${donor.uuid}`,
        entity: donor,
        permissions: editStates({ has_write_priv: true }),
        visible: ['Update', 'Cancel'],
        hidden: ['Generate ID'],
      },
      {
        name: 'read-only donor hides Update',
        path: `/donor/${donor.uuid}`,
        entity: donor,
        permissions: editStates({ has_admin_priv: true, has_write_priv: false }),
        visible: ['Cancel'],
        hidden: ['Generate ID', 'Update'],
      },
    ];

    cases.forEach(({ name, path, entity, permissions, visible, hidden }) => {
      it(name, () => {
        cy.viewport(1280, 900);
        if (entity) {
          interceptExistingEntity(entity, permissions);
        }

        cy.visitWithMockAuth(path);
        assertActionButtons({ visible, hidden });
      });
    });
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
