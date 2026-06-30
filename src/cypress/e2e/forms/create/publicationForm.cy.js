/* global cy, describe, it */

import {
  assertBulkSelectorSourceList,
  assertDatasetOnlyEmbeddedSearch,
  assertEmptySubmitValidation,
  assertFormLoaded,
} from './formTestHelpers';

const publicationForm = {
  entityType: 'Publication',
  path: '/new/publication',
  submitLabel: 'Save',
  selectors: [
    'input#title',
    'input#publication_venue',
    'input#publication_date',
    'input[name="publication_status"]',
    'input#publication_url',
    'textarea#description',
    'select#group_uuid',
  ],
};

describe('Publication form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(publicationForm.path);
    assertFormLoaded(publicationForm);
    assertEmptySubmitValidation(publicationForm);
  });

  it('prefills source_list rows and renders BulkSelector warning/error dialogs', () => {
    assertBulkSelectorSourceList({
      path: publicationForm.path,
      expectedSelected: 9,
      expectsWrongTypeError: true,
      screenshotName: 'publication-bulkselector-warning-error',
    });
  });

  it('locks embedded search source type to Datasets only', () => {
    assertDatasetOnlyEmbeddedSearch({
      path: publicationForm.path,
      dialogTitle: 'Search for a Source ID for your Publication',
      screenshotName: 'publication-embedded-search-dataset-only',
    });
  });
});
