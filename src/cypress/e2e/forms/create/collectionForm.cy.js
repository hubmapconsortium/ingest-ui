/* global cy, describe, expect, it */

import {
  assertBulkSelectorSourceList,
  assertDatasetOnlyEmbeddedSearch,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertSuccessDialog,
  assertUpdateSnackbar,
  editStates,
  interceptExistingEntity,
  requestBody,
  sourceListEntities,
  successEntity,
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
  requiredFields: [
    'input#title',
    'textarea#description',
  ],
  requiredMessages: [
    'Please select at least one Associated Dataset',
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

  it('creates a collection from a complete valid form', () => {
    const createdCollection = successEntity('Collection', {
      uuid: 'collection-create-success',
      hubmap_id: 'HBM999.COLL.001',
      title: 'Created collection title',
    });
    const collectionParams = new URLSearchParams({
      title: createdCollection.title,
      description: 'Created collection description',
      source_list: sourceListEntities[0].hubmap_id,
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/entities/collection', {
      statusCode: 200,
      body: createdCollection,
    }).as('createCollection');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/collection?${collectionParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
    cy.contains('button', 'Save', { timeout: 30000 }).click({ force: true });

    requestBody('@createCollection').then((body) => {
      expect(body).to.include({
        title: createdCollection.title,
        description: 'Created collection description',
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
      expect(body.dataset_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertSuccessDialog(createdCollection);
  });

  it('updates an existing collection from a valid edit form', () => {
    const editableCollection = successEntity('Collection', {
      uuid: 'collection-edit-success',
      hubmap_id: 'HBM999.COLL.002',
      title: 'Editable collection title',
      description: 'Original collection description',
      dataset_uuids: [sourceListEntities[0].uuid],
      datasets: [sourceListEntities[0]],
    });

    interceptExistingEntity(editableCollection, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${editableCollection.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'The update request for 0123456789abcdef0123456789abcdef has been accepted' },
    }).as('updateCollection');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/collection/${editableCollection.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated collection description');
    cy.contains('button', /^Save$/).click({ force: true });

    requestBody('@updateCollection').then((body) => {
      expect(body.description).to.equal('Updated collection description');
      expect(body.dataset_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertUpdateSnackbar(`The update request for ${editableCollection.hubmap_id} has been accepted`);
  });
});
