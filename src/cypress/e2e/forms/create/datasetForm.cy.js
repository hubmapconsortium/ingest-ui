/* global cy, describe, it */

import {
  assertBulkSelectorSourceList,
  assertEmptySubmitValidation,
  assertFormLoaded,
  datasetEntity,
  editStates,
  interceptDataset,
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
});
