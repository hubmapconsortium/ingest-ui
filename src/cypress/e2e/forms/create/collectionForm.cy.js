/* global cy, describe, it */

import {
  assertBulkSelectorSourceList,
  assertDatasetOnlyEmbeddedSearch,
  assertEmptySubmitValidation,
  assertFormLoaded,
} from './formTestHelpers';

const collectionForm = {
  entityType: 'Collection',
  path: '/new/collection',
  submitLabel: 'Save',
  selectors: [
    '.associationTableWrap',
    'input#title',
    'textarea#description',
    'select#group_uuid',
  ],
};

describe('Collection form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(collectionForm.path);
    assertFormLoaded(collectionForm);
    assertEmptySubmitValidation(collectionForm);
  });

  it('prefills source_list rows and renders BulkSelector warning/error dialogs', () => {
    assertBulkSelectorSourceList({
      path: collectionForm.path,
      expectedSelected: 9,
      expectsWrongTypeError: true,
      screenshotName: 'collection-bulkselector-warning-error',
    });
  });

  it('locks embedded search source type to Datasets only', () => {
    assertDatasetOnlyEmbeddedSearch({
      path: collectionForm.path,
      dialogTitle: 'Search for an Associated Dataset for your Collection',
      screenshotName: 'collection-embedded-search-dataset-only',
    });
  });
});
