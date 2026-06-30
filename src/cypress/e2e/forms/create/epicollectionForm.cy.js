/* global cy, describe, it */

import {
  assertBulkSelectorSourceList,
  assertDatasetOnlyEmbeddedSearch,
  assertEmptySubmitValidation,
  assertFormLoaded,
} from './formTestHelpers';

const epicollectionForm = {
  entityType: 'EPICollection',
  path: '/new/epicollection',
  submitLabel: 'Save',
  selectors: [
    '.associationTableWrap',
    'input#title',
    'textarea#description',
    'select#group_uuid',
  ],
};

describe('EPICollection form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(epicollectionForm.path);
    assertFormLoaded(epicollectionForm);
    assertEmptySubmitValidation(epicollectionForm);
  });

  it('prefills source_list rows and renders BulkSelector warning/error dialogs', () => {
    assertBulkSelectorSourceList({
      path: epicollectionForm.path,
      expectedSelected: 9,
      expectsWrongTypeError: true,
      screenshotName: 'epicollection-bulkselector-warning-error',
    });
  });

  it('locks embedded search source type to Datasets only', () => {
    assertDatasetOnlyEmbeddedSearch({
      path: epicollectionForm.path,
      dialogTitle: 'Search for an Associated Dataset for your EPICollection',
      screenshotName: 'epicollection-embedded-search-dataset-only',
    });
  });
});
