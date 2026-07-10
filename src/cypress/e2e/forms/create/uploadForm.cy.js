/* global beforeEach, cy, describe, expect, it */

import {
  assertActionButtons,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertInvalidFieldValidation,
  assertMissingEntityRendersNotFoundInPlace,
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
  requiredFields: [
    'input#title',
    'textarea#description',
    '#intended_organ',
    '#intended_dataset_type',
  ],
};

describe('Upload form', () => {
  beforeEach(() => {
    cy.intercept('GET', '**/valueset?parent_sab=HUBMAP&parent_code=C003041&child_sabs=HUBMAP', {
      statusCode: 200,
      body: [
        { code: 'RNA', term: 'RNAseq' },
        { code: 'UNKNOWN', term: 'UNKNOWN' },
      ],
    }).as('uploadDatasetTypes');
  });

  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(uploadForm.path);
    assertFormLoaded(uploadForm);
    assertEmptySubmitValidation(uploadForm);
  });

  it('renders not-found content in place for missing upload IDs', () => {
    assertMissingEntityRendersNotFoundInPlace({
      path: '/upload',
      entityID: 'missing-upload-id',
    });
  });

  it('rejects invalid anticipated dataset count values', () => {
    const uploadParams = new URLSearchParams({
      title: 'Invalid upload count',
      description: 'Upload with invalid anticipated dataset count',
      intended_organ: 'RK',
      intended_dataset_type: 'RNAseq',
      anticipated_dataset_count: 'abc',
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/uploads').as('createUploadInvalidCount');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/upload?${uploadParams.toString()}`);
    cy.contains('button', 'Generate ID', { timeout: 30000 }).click({ force: true });

    assertInvalidFieldValidation({
      selector: 'input#anticipated_dataset_count',
      message: 'Anticipated Dataset Count must be a number',
    });
    cy.get('@createUploadInvalidCount.all').should('have.length', 0);
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

  describe('action buttons', () => {
    const upload = successEntity('Upload', {
      uuid: 'upload-action-buttons',
      hubmap_id: 'HBM999.UPLD.900',
      title: 'Action button upload',
      description: 'Action button upload description',
      intended_organ: 'RK',
      intended_dataset_type: 'RNAseq',
      anticipated_dataset_count: 1,
    });

    const cases = [
      {
        name: 'create mode shows Generate ID and Cancel',
        path: uploadForm.path,
        visible: ['Generate ID', 'Cancel'],
        hidden: ['Revert', 'Submit', 'Reorganize', 'Validate', 'Save'],
      },
      {
        name: 'new upload with write can submit and save',
        path: `/upload/${upload.uuid}`,
        entity: upload,
        permissions: editStates({ has_write_priv: true }),
        visible: ['Submit', 'Save', 'Cancel'],
        hidden: ['Revert', 'Reorganize', 'Validate', 'Generate ID'],
      },
      {
        name: 'new upload with admin can revert submit validate and save',
        path: `/upload/${upload.uuid}`,
        entity: upload,
        permissions: editStates({ has_admin_priv: true, has_write_priv: false }),
        visible: ['Revert', 'Submit', 'Validate', 'Save', 'Cancel'],
        hidden: ['Reorganize', 'Generate ID'],
      },
      {
        name: 'submitted upload shows admin reorganize and save but not submit',
        path: `/upload/${upload.uuid}`,
        entity: { ...upload, status: 'Submitted' },
        permissions: editStates({ has_admin_priv: true, has_write_priv: true }),
        visible: ['Revert', 'Reorganize', 'Validate', 'Save', 'Cancel'],
        hidden: ['Submit', 'Generate ID'],
      },
      {
        name: 'processing upload hides validate and save but can still be submitted by admin',
        path: `/upload/${upload.uuid}`,
        entity: { ...upload, status: 'Processing' },
        permissions: editStates({ has_admin_priv: true, has_write_priv: false }),
        visible: ['Revert', 'Submit', 'Cancel'],
        hidden: ['Reorganize', 'Validate', 'Save', 'Generate ID'],
      },
      {
        name: 'read-only upload hides edit actions',
        path: `/upload/${upload.uuid}`,
        entity: upload,
        permissions: editStates({ has_write_priv: false }),
        visible: ['Cancel'],
        hidden: ['Revert', 'Submit', 'Reorganize', 'Validate', 'Save', 'Generate ID'],
      },
    ];

    cases.forEach(({ name, path, entity, permissions, visible, hidden }) => {
      it(name, () => {
        cy.viewport(1280, 900);
        if (entity) {
          interceptExistingEntity(entity, permissions, {
            globusUrl: `https://example.org/globus/${entity.uuid}`,
          });
        }

        cy.visitWithMockAuth(path);
        assertActionButtons({ visible, hidden });
      });
    });
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
