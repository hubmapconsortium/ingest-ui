/* global cy, describe, it */

import {
  ancestorOrganSample,
  assertEmptySubmitValidation,
  assertFormLoaded,
  donorAncestor,
  donorSource,
  editStates,
  interceptNewSampleSource,
  sampleSource,
  sampleSourceWithoutOrgan,
  visualCheckpoint,
} from './formTestHelpers';

const sampleForm = {
  entityType: 'Sample',
  path: '/new/sample',
  submitLabel: 'Generate ID',
  selectors: [
    'input#direct_ancestor_uuid',
    'input#protocol_url',
    'textarea#description',
    'select#group_uuid',
  ],
};

describe('Sample form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(sampleForm.path);
    assertFormLoaded(sampleForm);
    assertEmptySubmitValidation(sampleForm);
  });

  it('switches visible creation fields based on whether the source is a donor or sample', () => {
    cy.viewport(1280, 900);
    interceptNewSampleSource(donorSource, [donorSource]);

    cy.visitWithMockAuth(`/new/sample?direct_ancestor_uuid=${donorSource.uuid}`);

    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', donorSource.hubmap_id);
    cy.contains('Source Category:').should('be.visible');
    cy.contains('Donor').should('be.visible');
    cy.get('#organ').should('exist').and('not.be.disabled');
    cy.get('#sample_category').should('not.exist');
    cy.get('#generate_ids_for_multiple_samples').should('not.exist');
    cy.contains('button', 'Generate ID').should('be.visible');
    cy.contains('button', /Register Location/i).should('not.exist');

    interceptNewSampleSource(sampleSource);
    cy.visitWithMockAuth(`/new/sample?direct_ancestor_uuid=${sampleSource.uuid}`);

    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', sampleSource.hubmap_id);
    cy.contains('Source Category:').should('be.visible');
    cy.contains('Organ').should('be.visible');
    cy.get('#organ').should('not.exist');
    cy.get('#sample_category').should('exist').and('not.be.disabled');
    cy.get('#generate_ids_for_multiple_samples').should('exist').and('not.be.disabled');
  });

  it('updates RUI and multiple-sample controls when sample category changes', () => {
    cy.viewport(1280, 900);
    interceptNewSampleSource(sampleSource);

    cy.visitWithMockAuth(`/new/sample?direct_ancestor_uuid=${sampleSource.uuid}`);

    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', sampleSource.hubmap_id);
    cy.contains('Waiting on Category Selection').should('be.visible');

    cy.get('#sample_category').select('section');
    cy.contains('RUI Interface is only available for Block Samples').should('be.visible');
    cy.contains('button', /Register Location/i).should('not.exist');
    cy.get('#lab_tissue_sample_id').should('be.visible');
    cy.get('#generate_number').should('not.be.visible');

    cy.get('#sample_category').select('block');
    cy.contains('button', /Register Location/i).should('be.visible');
    visualCheckpoint('sample-block-rui-available');

    cy.get('#generate_ids_for_multiple_samples').check();
    cy.contains('button', /Register Location/i).should('not.exist');
    cy.get('#generate_number').should('be.visible');
    visualCheckpoint('sample-multiple-block-rui-hidden');
  });

  it('enables RUI for block samples when an ancestor resolves to an RUI-supported organ', () => {
    cy.viewport(1280, 900);
    interceptNewSampleSource(sampleSourceWithoutOrgan, [
      donorAncestor,
      ancestorOrganSample,
      sampleSourceWithoutOrgan,
    ]);

    cy.visitWithMockAuth(`/new/sample?direct_ancestor_uuid=${sampleSourceWithoutOrgan.uuid}`);

    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', sampleSourceWithoutOrgan.hubmap_id);
    cy.get('#sample_category').select('section');
    cy.contains('RUI Interface is only available for Block Samples').should('be.visible');
    cy.contains('button', /Register Location/i).should('not.exist');

    cy.get('#sample_category').select('block');
    cy.contains('button', /Register Location/i).should('be.visible');
    visualCheckpoint('sample-ancestor-supported-organ-rui-available');
  });

  it('locks immutable and writable sample fields separately on an existing read-only sample', () => {
    const existingSample = {
      ...sampleSource,
      uuid: 'existing-sample-readonly',
      hubmap_id: 'HBM444.SAMP.004',
      status: 'Published',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      protocol_url: 'https://dx.doi.org/10.17504/protocols.io.mock',
      lab_tissue_sample_id: 'sample-readonly-1',
      description: 'Existing sample description',
      created_by_user_email: 'cypress@example.org',
      created_timestamp: 1700000000000,
      group_name: 'Cypress Smoke Group',
    };

    cy.viewport(1280, 900);
    cy.intercept('GET', `**/entities/${existingSample.uuid}*`, {
      statusCode: 200,
      body: existingSample,
    }).as('existingSample');
    cy.intercept('GET', `**/ancestors/${sampleSource.uuid}`, {
      statusCode: 200,
      body: [donorAncestor, sampleSource],
    }).as('sampleAncestors');
    cy.intercept('GET', `**/entities/${existingSample.uuid}/allowable-edit-states`, {
      statusCode: 200,
      body: editStates({ has_write_priv: false }),
    }).as('sampleEditStates');
    cy.intercept('GET', `**/specimens/${existingSample.uuid}/ingest-group-ids`, {
      statusCode: 200,
      body: { ingest_group_ids: [] },
    }).as('associatedIds');

    cy.visitWithMockAuth(`/sample/${existingSample.uuid}`);

    cy.get('#direct_ancestor_uuid', { timeout: 30000 })
      .should('have.value', sampleSource.hubmap_id)
      .and('be.disabled');
    cy.get('#sample_category').should('be.disabled');
    cy.get('#protocol_url').should('be.disabled');
    cy.get('#lab_tissue_sample_id').should('be.disabled');
    cy.contains('You do not have permission to modify this item.').should('be.visible');
    cy.contains('button', 'Update').should('not.exist');
    cy.contains('button', 'Cancel').should('be.visible');
  });
});
