/* global cy, describe, it */

import {
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertSuccessDialog,
  assertUpdateSnackbar,
  editStates,
  interceptExistingEntity,
  requestBody,
  successEntity,
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

  it('creates an upload from a complete valid form', () => {
    const createdUpload = successEntity('Upload', {
      uuid: 'upload-create-success',
      hubmap_id: 'HBM999.UPLD.001',
      title: 'Created upload title',
    });
    const uploadParams = new URLSearchParams({
      title: createdUpload.title,
      description: 'Created upload description',
      intended_organ: 'RK',
      intended_dataset_type: 'RNAseq',
      anticipated_dataset_count: '2',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/uploads', {
      statusCode: 200,
      body: createdUpload,
    }).as('createUpload');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/upload?${uploadParams.toString()}`);
    cy.contains('button', 'Generate ID', { timeout: 30000 }).click({ force: true });

    requestBody('@createUpload').then((body) => {
      expect(body).to.include({
        title: createdUpload.title,
        description: 'Created upload description',
        intended_organ: 'RK',
        intended_dataset_type: 'RNAseq',
        anticipated_dataset_count: 2,
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
    });
    assertSuccessDialog(createdUpload);
  });

  it('updates an existing upload from a valid edit form', () => {
    const editableUpload = successEntity('Upload', {
      uuid: 'upload-edit-success',
      hubmap_id: 'HBM999.UPLD.002',
      title: 'Editable upload title',
      description: 'Original upload description',
      intended_organ: 'RK',
      intended_dataset_type: 'RNAseq',
      anticipated_dataset_count: 1,
    });

    interceptExistingEntity(editableUpload, editStates({ has_write_priv: true }), {
      globusUrl: 'https://example.org/globus/upload-edit-success',
    });
    cy.intercept('PUT', `**/entities/${editableUpload.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'Upload updated successfully' },
    }).as('updateUpload');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/upload/${editableUpload.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated upload description');
    cy.contains('button', /^Save$/).click({ force: true });

    requestBody('@updateUpload').then((body) => {
      expect(body.description).to.equal('Updated upload description');
      expect(body.title).to.equal(editableUpload.title);
    });
    assertUpdateSnackbar('Upload updated successfully');
  });
});
