/* global cy, describe, it */

import {
  assertEmptySubmitValidation,
  assertFormLoaded,
} from './formTestHelpers';

const uploadForm = {
  entityType: 'Upload',
  path: '/new/upload',
  submitLabel: 'Generate ID',
  selectors: [
    'input#title',
    'textarea#description',
    '#intended_organ',
    '#intended_dataset_type',
    'input#anticipated_dataset_count',
    '#group_uuid',
  ],
};

describe('Upload form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(uploadForm.path);
    assertFormLoaded(uploadForm);
    assertEmptySubmitValidation(uploadForm);
  });
});
