/* global cy, describe, expect, it */

import {
  ancestorOrganSample,
  assertActionButtons,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertInvalidFieldValidation,
  assertMissingEntityRendersNotFoundInPlace,
  assertSuccessDialog,
  assertUpdateSnackbar,
  donorAncestor,
  donorSource,
  editStates,
  interceptExistingEntity,
  interceptNewSampleSource,
  protocolUrl,
  requestBody,
  sampleSource,
  sampleSourceWithoutOrgan,
  successEntity,
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
  requiredFields: [
    'input#direct_ancestor_uuid',
    'input#protocol_url',
  ],
};

const ruiLocation = {
  '@context': 'https://hubmapconsortium.github.io/ccf-ontology/ccf-context.jsonld',
  '@id': 'http://example.org/rui-location/cypress-kidney-block',
  '@type': 'SpatialEntity',
  label: 'Cypress kidney block',
  x_dimension: 10,
  y_dimension: 12,
  z_dimension: 8,
  dimension_unit: 'millimeter',
};

describe('Sample form', () => {
  function interceptSampleEdit(entity, permissions, associatedIds = []) {
    interceptExistingEntity(entity, permissions);
    cy.intercept('GET', `**/ancestors/${sampleSource.uuid}`, {
      statusCode: 200,
      body: [donorAncestor, sampleSource],
    }).as(`ancestors-${entity.uuid}`);
    cy.intercept('GET', `**/specimens/${entity.uuid}/ingest-group-ids`, {
      statusCode: 200,
      body: { ingest_group_ids: associatedIds },
    }).as(`associated-${entity.uuid}`);
  }

  function openRui(buttonLabel) {
    cy.contains('button', buttonLabel, { timeout: 30000 }).click();
    cy.get('ccf-rui', { timeout: 30000 }).should('be.visible');
  }

  function registerRuiLocation(location = ruiLocation) {
    cy.get('ccf-rui').should(($rui) => {
      expect($rui[0].register).to.be.a('function');
    }).then(($rui) => {
      $rui[0].register(JSON.stringify(location));
    });
    cy.get('ccf-rui').should('not.exist');
  }

  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(sampleForm.path);
    assertFormLoaded(sampleForm);
    assertEmptySubmitValidation(sampleForm);
  });

  it('renders not-found content in place for missing sample IDs', () => {
    assertMissingEntityRendersNotFoundInPlace({
      path: '/sample',
      entityID: 'missing-sample-id',
    });
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

  it('shows existing RUI JSON and launches RUI with the saved location', () => {
    const editableBlock = successEntity('Sample', {
      uuid: 'sample-existing-rui',
      hubmap_id: 'HBM999.RUI.001',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'existing-rui-location',
      rui_location: ruiLocation,
    });

    interceptSampleEdit(editableBlock, editStates({ has_write_priv: true }));
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/sample/${editableBlock.uuid}`);

    cy.contains('button', 'View Location', { timeout: 30000 }).click();
    cy.contains(ruiLocation['@id']).should('be.visible');
    cy.contains(ruiLocation.label).should('be.visible');
    cy.contains('button', 'Close').click();

    openRui('Modify Location Information');
    cy.get('ccf-rui').should(($rui) => {
      expect($rui[0].editRegistration).to.deep.equal(ruiLocation);
    });
  });

  it('does not allow RUI edits on a sample associated with a published dataset', () => {
    const publicBlock = successEntity('Sample', {
      uuid: 'sample-public-rui',
      hubmap_id: 'HBM999.RUI.002',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'public-rui-location',
      rui_location: ruiLocation,
    });

    interceptSampleEdit(
      publicBlock,
      editStates({ has_write_priv: false }),
      [{ uuid: publicBlock.uuid, submission_id: 'S-PUBLIC-1' }],
    );
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/sample/${publicBlock.uuid}`);

    cy.contains('button', 'View Location', { timeout: 30000 }).should('be.enabled');
    cy.contains('button', 'Modify Location Information').should('be.disabled');
    cy.contains('button', 'Update').should('not.exist');
  });

  it('allows an existing consortium-level RUI location to be edited', () => {
    const consortiumBlock = successEntity('Sample', {
      uuid: 'sample-consortium-rui',
      hubmap_id: 'HBM999.RUI.003',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'consortium-rui-location',
      rui_location: ruiLocation,
    });
    const updatedLocation = {
      ...ruiLocation,
      '@id': 'http://example.org/rui-location/updated-consortium-block',
      label: 'Updated consortium kidney block',
    };

    interceptSampleEdit(consortiumBlock, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${consortiumBlock.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'RUI location updated successfully' },
    }).as('updateConsortiumRui');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/sample/${consortiumBlock.uuid}`);

    openRui('Modify Location Information');
    registerRuiLocation(updatedLocation);
    cy.contains('button', 'Update').click({ force: true });

    requestBody('@updateConsortiumRui').then((body) => {
      expect(body.rui_location).to.deep.equal(updatedLocation);
    });
  });

  it('creates a new RUI location while creating a block sample', () => {
    const createdBlock = successEntity('Sample', {
      uuid: 'sample-create-rui',
      hubmap_id: 'HBM999.RUI.004',
      sample_category: 'block',
      lab_tissue_sample_id: 'new-rui-block',
    });
    const sampleParams = new URLSearchParams({
      direct_ancestor_uuid: sampleSource.uuid,
      protocol_url: protocolUrl,
      lab_tissue_sample_id: createdBlock.lab_tissue_sample_id,
      description: 'Block created with RUI location',
      sample_category: 'block',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    interceptNewSampleSource(sampleSource);
    cy.intercept('POST', '**/entities/sample', {
      statusCode: 200,
      body: createdBlock,
    }).as('createRuiSample');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/sample?${sampleParams.toString()}`);

    openRui('Register Location');
    registerRuiLocation();
    cy.contains('button', 'Generate ID').click({ force: true });

    requestBody('@createRuiSample').then((body) => {
      expect(body.rui_location).to.deep.equal(ruiLocation);
      expect(body.sample_category).to.equal('block');
    });
    assertSuccessDialog(createdBlock);
  });

  it('adds a new RUI location while editing a consortium-level block', () => {
    const consortiumBlock = successEntity('Sample', {
      uuid: 'sample-add-rui',
      hubmap_id: 'HBM999.RUI.005',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'consortium-block-without-rui',
    });

    interceptSampleEdit(consortiumBlock, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${consortiumBlock.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'RUI location added successfully' },
    }).as('addConsortiumRui');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/sample/${consortiumBlock.uuid}`);

    openRui('Register Location');
    registerRuiLocation();
    cy.contains('button', 'Update').click({ force: true });

    requestBody('@addConsortiumRui').then((body) => {
      expect(body.rui_location).to.deep.equal(ruiLocation);
    });
  });

  it('rejects invalid protocol URL values', () => {
    const sampleParams = new URLSearchParams({
      direct_ancestor_uuid: donorSource.uuid,
      protocol_url: 'https://example.org/not-a-protocol',
      lab_tissue_sample_id: 'invalid-protocol-sample',
      description: 'Sample with invalid protocol URL',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/entities/sample').as('createSampleInvalidProtocol');
    cy.viewport(1280, 900);
    interceptNewSampleSource(donorSource, [donorSource]);
    cy.visitWithMockAuth(`/new/sample?${sampleParams.toString()}`);
    cy.get('#organ', { timeout: 30000 }).select('RK');
    cy.contains('button', 'Generate ID', { timeout: 30000 }).click({ force: true });

    assertInvalidFieldValidation({
      selector: 'input#protocol_url',
      message: 'This must be provided as a protocols.io DOI URL',
    });
    cy.get('@createSampleInvalidProtocol.all').should('have.length', 0);
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

  it('creates a sample from a complete valid form', () => {
    const createdSample = successEntity('Sample', {
      uuid: 'sample-create-success',
      hubmap_id: 'HBM999.SAMP.001',
      sample_category: 'organ',
      organ: 'RK',
      lab_tissue_sample_id: 'created-sample-lab-id',
    });
    interceptNewSampleSource(donorSource, [donorSource]);
    cy.intercept('POST', '**/entities/sample', {
      statusCode: 200,
      body: createdSample,
    }).as('createSample');

    const sampleParams = new URLSearchParams({
      direct_ancestor_uuid: donorSource.uuid,
      protocol_url: protocolUrl,
      lab_tissue_sample_id: createdSample.lab_tissue_sample_id,
      description: 'Created sample description',
      organ: 'RK',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/sample?${sampleParams.toString()}`);
    cy.get('#organ', { timeout: 30000 }).select('RK');
    cy.contains('button', 'Generate ID', { timeout: 30000 }).click({ force: true });

    requestBody('@createSample').then((body) => {
      expect(body).to.include({
        direct_ancestor_uuid: donorSource.uuid,
        protocol_url: protocolUrl,
        lab_tissue_sample_id: createdSample.lab_tissue_sample_id,
        description: 'Created sample description',
        sample_category: 'organ',
        organ: 'RK',
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
    });
    assertSuccessDialog(createdSample);
  });

  describe('action buttons', () => {
    const sample = successEntity('Sample', {
      uuid: 'sample-action-buttons',
      hubmap_id: 'HBM999.SAMP.900',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'sample-action-buttons',
      description: 'Action button sample description',
    });

    const cases = [
      {
        name: 'create mode shows Generate ID and Cancel',
        path: sampleForm.path,
        visible: ['Generate ID', 'Cancel'],
        hidden: ['Update'],
      },
      {
        name: 'editable sample shows Update and Cancel',
        path: `/sample/${sample.uuid}`,
        entity: sample,
        permissions: editStates({ has_write_priv: true }),
        visible: ['Update', 'Cancel'],
        hidden: ['Generate ID'],
      },
      {
        name: 'read-only sample hides Update',
        path: `/sample/${sample.uuid}`,
        entity: sample,
        permissions: editStates({ has_admin_priv: true, has_write_priv: false }),
        visible: ['Cancel'],
        hidden: ['Generate ID', 'Update'],
      },
    ];

    cases.forEach(({ name, path, entity, permissions, visible, hidden }) => {
      it(name, () => {
        cy.viewport(1280, 900);
        if (entity) {
          interceptSampleEdit(entity, permissions);
        }

        cy.visitWithMockAuth(path);
        assertActionButtons({ visible, hidden });
      });
    });
  });

  it('updates an existing sample from a valid edit form', () => {
    const editableSample = successEntity('Sample', {
      uuid: 'sample-edit-success',
      hubmap_id: 'HBM999.SAMP.002',
      direct_ancestor: sampleSource,
      direct_ancestor_uuid: sampleSource.uuid,
      sample_category: 'block',
      protocol_url: protocolUrl,
      lab_tissue_sample_id: 'editable-sample-lab-id',
      description: 'Original sample description',
    });

    interceptExistingEntity(editableSample, editStates({ has_write_priv: true }));
    cy.intercept('GET', `**/ancestors/${sampleSource.uuid}`, {
      statusCode: 200,
      body: [donorAncestor, sampleSource],
    }).as('editableSampleAncestors');
    cy.intercept('GET', `**/specimens/${editableSample.uuid}/ingest-group-ids`, {
      statusCode: 200,
      body: { ingest_group_ids: [] },
    }).as('editableSampleAssociatedIds');
    cy.intercept('PUT', `**/entities/${editableSample.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'Sample updated successfully' },
    }).as('updateSample');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/sample/${editableSample.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated sample description');
    cy.contains('button', 'Update').click({ force: true });

    requestBody('@updateSample').then((body) => {
      expect(body.description).to.equal('Updated sample description');
      expect(body.lab_tissue_sample_id).to.equal(editableSample.lab_tissue_sample_id);
    });
    assertUpdateSnackbar('Sample updated successfully');
  });
});
