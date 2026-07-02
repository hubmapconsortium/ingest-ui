/* global cy, describe, expect, it */

import {
  assertBulkSelectorSourceList,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertSuccessDialog,
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

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/datasetAdmin?${datasetParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
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

  describe('action buttons', () => {
    const cases = [
      {
        name: 'new primary dataset with write, admin, and testing permissions',
        entity: datasetEntity(),
        permissions: editStates({
          has_admin_priv: true,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Process', 'Submit for Testing', 'Submit', 'Validate', 'Save', 'Cancel'],
        hidden: [],
      },
      {
        name: 'published dataset with pipeline testing privilege but no write access',
        entity: datasetEntity({ uuid: 'dataset-published', status: 'Published', data_access_level: 'public' }),
        permissions: editStates({
          has_write_priv: true,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Submit for Testing', 'Cancel'],
        hidden: ['Process', 'Submit', 'Validate', 'Save'],
      },
      {
        name: 'QA dataset with admin override can save and validate but cannot submit',
        entity: datasetEntity({ uuid: 'dataset-qa', status: 'QA' }),
        permissions: editStates({
          has_admin_priv: true,
          has_write_priv: false,
          has_pipeline_testing_priv: true,
        }),
        visible: ['Submit for Testing', 'Validate', 'Save', 'Cancel'],
        hidden: ['Process', 'Submit'],
      },
    ];

    cases.forEach(({ name, entity, permissions, visible, hidden }) => {
      it(name, () => {
        cy.viewport(1280, 900);
        interceptDataset(entity, permissions);

        cy.visitWithMockAuth(`/dataset/${entity.uuid}`);

        cy.contains(entity.hubmap_id, { timeout: 30000 }).should('be.visible');
        cy.contains('Status:').should('be.visible');
        cy.contains(entity.status.toUpperCase()).should('be.visible');

        visible.forEach((label) => {
          cy.contains('button', new RegExp(`^${label}$`)).should('be.visible');
        });

        hidden.forEach((label) => {
          cy.contains('button', new RegExp(`^${label}$`)).should('not.exist');
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
