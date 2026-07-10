/* global cy, describe, expect, it */

import {
  assertActionButtons,
  assertBulkSelectorSourceList,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertMissingEntityRendersNotFoundInPlace,
  assertSuccessDialog,
  assertWrongTypeRedirectsToEntityRoute,
  datasetEntity,
  editStates,
  interceptDataset,
  requestBody,
  sourceListEntities,
  successEntity,
} from './formTestHelpers';

const datasetForm = {
  entityType: 'Dataset',
  path: '/new/datasetAdmin',
  submitLabel: 'Save',
  selectors: [
    'textarea#description',
    'input[name="contains_human_genetic_sequences"]',
    '#dt_select',
    '#group_uuid',
  ],
};

describe('Dataset form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(datasetForm.path);
    assertFormLoaded(datasetForm);
    assertEmptySubmitValidation(datasetForm);
  });

  it('prefills source_list rows and renders BulkSelector warning/error dialogs', () => {
    assertBulkSelectorSourceList({
      path: datasetForm.path,
      expectedSelected: 10,
      expectsWrongTypeError: false,
      screenshotName: 'dataset-bulkselector-warning-error',
    });
  });

  it('creates a dataset from a complete valid form', () => {
    const createdDataset = successEntity('Dataset', {
      uuid: 'dataset-create-success',
      hubmap_id: 'HBM999.DATA.001',
      lab_dataset_id: 'created-dataset-lab-id',
      dataset_type: 'RNAseq',
    });
    const datasetParams = new URLSearchParams({
      lab_dataset_id: createdDataset.lab_dataset_id,
      description: 'Created dataset description',
      dataset_info: 'Created dataset searchable info',
      contains_human_genetic_sequences: 'false',
      dt_select: 'RNAseq',
      group_uuid: '00000000-0000-0000-0000-000000000001',
      source_list: sourceListEntities[0].hubmap_id,
    });

    cy.intercept('POST', '**/datasets', {
      statusCode: 200,
      body: createdDataset,
    }).as('createDataset');
    interceptDataset(createdDataset, editStates({ has_write_priv: true }));

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/datasetAdmin?${datasetParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
    cy.contains('button', sourceListEntities[0].hubmap_id, { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Save', { timeout: 30000 }).click({ force: true });

    requestBody('@createDataset').then((body) => {
      expect(body).to.include({
        lab_dataset_id: createdDataset.lab_dataset_id,
        description: 'Created dataset description',
        dataset_info: 'Created dataset searchable info',
        contains_human_genetic_sequences: false,
        dataset_type: 'RNAseq',
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
      expect(body.direct_ancestor_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertSuccessDialog(createdDataset);
  });

  it('renders not-found content in place for missing dataset IDs', () => {
    assertMissingEntityRendersNotFoundInPlace({
      path: '/dataset',
      entityID: 'missing-dataset-id',
    });
  });

  it('redirects to the matching entity form on the current origin when the ID belongs to a different type', () => {
    assertWrongTypeRedirectsToEntityRoute({
      fromPath: '/dataset',
      entity: successEntity('Donor', {
        uuid: 'donor-found-via-dataset-route',
        hubmap_id: 'HBM999.DONR.404',
        label: 'Donor found via dataset route',
        protocol_url: 'dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf',
        description: 'A donor returned from the dataset route lookup',
      }),
      permissions: editStates({ has_write_priv: true }),
    });
  });

  describe('action buttons', () => {
    const cases = [
      {
        name: 'new primary dataset with write, admin, and testing permissions',
        entity: datasetEntity(),
        permissions: editStates({
          has_admin_priv: true,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Revert', 'Process', 'Submit for Testing', 'Submit', 'Validate', 'Save', 'Cancel'],
        hidden: [],
      },
      {
        name: 'published primary dataset allows admin pipeline-testing submission only',
        entity: datasetEntity({ uuid: 'dataset-published', status: 'Published', data_access_level: 'public' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: false,
        }),
        visible: ['Submit for Testing', 'Cancel'],
        hidden: ['Revert', 'Process', 'Submit', 'Validate', 'Save'],
      },
      {
        name: 'QA dataset with admin override can save and validate but cannot submit',
        entity: datasetEntity({ uuid: 'dataset-qa', status: 'QA' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Revert', 'Submit for Testing', 'Validate', 'Save', 'Cancel'],
        hidden: ['Process', 'Submit'],
      },
      {
        name: 'processing dataset with admin cannot validate or submit for testing',
        entity: datasetEntity({ uuid: 'dataset-processing', status: 'Processing' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Revert', 'Cancel'],
        hidden: ['Process', 'Submit for Testing', 'Submit', 'Validate', 'Save'],
      },
      {
        name: 'pipeline-testing privilege can submit for testing without admin',
        entity: datasetEntity({ uuid: 'dataset-pipeline-only', status: 'Error' }),
        permissions: editStates({
          has_admin_priv: false,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Submit for Testing', 'Cancel'],
        hidden: ['Revert', 'Process', 'Submit', 'Validate', 'Save'],
      },
      {
        name: 'approval dataset follows QA rules for admin or pipeline testing submission',
        entity: datasetEntity({ uuid: 'dataset-approval', status: 'Approval' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Revert', 'Submit for Testing', 'Validate', 'Save', 'Cancel'],
        hidden: ['Process', 'Submit'],
      },
      {
        name: 'retracted dataset follows published rules for admin or pipeline testing submission',
        entity: datasetEntity({ uuid: 'dataset-retracted', status: 'Retracted' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Submit for Testing', 'Cancel'],
        hidden: ['Revert', 'Process', 'Submit', 'Validate', 'Save'],
      },
      {
        name: 'component dataset cannot process or submit for testing even with admin',
        entity: datasetEntity({ uuid: 'dataset-component', creation_action: 'Multi-Assay Split' }),
        permissions: editStates({
          has_admin_priv: true,
          has_submit_priv: true,
          has_write_priv: true,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Revert', 'Submit', 'Validate', 'Save', 'Cancel'],
        hidden: ['Process', 'Submit for Testing'],
        enabledFields: ['textarea#description'],
      },
    ];

    cases.forEach(({ name, entity, permissions, visible, hidden, enabledFields = [] }) => {
      it(name, () => {
        cy.viewport(1280, 900);
        interceptDataset(entity, permissions);

        cy.visitWithMockAuth(`/dataset/${entity.uuid}`);

        cy.contains(entity.hubmap_id, { timeout: 30000 }).should('be.visible');
        cy.contains('Status:').should('be.visible');
        cy.contains(entity.status.toUpperCase()).should('be.visible');

        assertActionButtons({ visible, hidden });
        enabledFields.forEach((selector) => {
          cy.get(selector, { timeout: 30000 }).should('be.enabled');
        });
      });
    });
  });

  it('updates an existing dataset from a valid edit form', () => {
    const editableDataset = datasetEntity({
      uuid: 'dataset-edit-success',
      hubmap_id: 'HBM999.DATA.002',
      description: 'Original dataset description',
      direct_ancestors: [sourceListEntities[0]],
    });

    interceptDataset(editableDataset, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${editableDataset.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'Dataset update accepted' },
    }).as('updateDataset');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/dataset/${editableDataset.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated dataset description');
    cy.contains('button', /^Save$/).click({ force: true });

    requestBody('@updateDataset').then((body) => {
      expect(body.description).to.equal('Updated dataset description');
      expect(body.lab_dataset_id).to.equal(editableDataset.lab_dataset_id);
    });
    cy.location('pathname', { timeout: 30000 }).should('eq', '/');
    cy.contains('Search').should('be.visible');
  });
});
