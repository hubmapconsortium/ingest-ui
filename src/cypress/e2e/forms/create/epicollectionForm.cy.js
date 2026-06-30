/* global cy, describe, it */

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

  it('creates an EPICollection from a complete valid form', () => {
    const createdEPICollection = successEntity('EPICollection', {
      uuid: 'epicollection-create-success',
      hubmap_id: 'HBM999.EPIC.001',
      title: 'Created EPICollection title',
    });
    const epicollectionParams = new URLSearchParams({
      title: createdEPICollection.title,
      description: 'Created EPICollection description',
      source_list: sourceListEntities[0].hubmap_id,
      group_uuid: '00000000-0000-0000-0000-000000000001',
    });

    cy.intercept('POST', '**/entities/epicollection', {
      statusCode: 200,
      body: createdEPICollection,
    }).as('createEPICollection');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/epicollection?${epicollectionParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
    cy.contains('button', 'Save', { timeout: 30000 }).click({ force: true });

    requestBody('@createEPICollection').then((body) => {
      expect(body).to.include({
        title: createdEPICollection.title,
        description: 'Created EPICollection description',
        group_uuid: '00000000-0000-0000-0000-000000000001',
      });
      expect(body.dataset_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertSuccessDialog(createdEPICollection);
  });

  it('updates an existing EPICollection from a valid edit form', () => {
    const editableEPICollection = successEntity('EPICollection', {
      uuid: 'epicollection-edit-success',
      hubmap_id: 'HBM999.EPIC.002',
      title: 'Editable EPICollection title',
      description: 'Original EPICollection description',
      dataset_uuids: [sourceListEntities[0].uuid],
      datasets: [sourceListEntities[0]],
    });

    interceptExistingEntity(editableEPICollection, editStates({ has_write_priv: true }));
    cy.intercept('PUT', `**/entities/${editableEPICollection.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'The update request for 0123456789abcdef0123456789abcdef has been accepted' },
    }).as('updateEPICollection');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/epicollection/${editableEPICollection.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated EPICollection description');
    cy.contains('button', /^Save$/).click({ force: true });

    requestBody('@updateEPICollection').then((body) => {
      expect(body.description).to.equal('Updated EPICollection description');
      expect(body.dataset_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertUpdateSnackbar(`The update request for ${editableEPICollection.hubmap_id} has been accepted`);
  });
});
