/* global cy, describe, expect, it */

import {
  assertActionButtons,
  assertBulkSelectorSourceList,
  assertDatasetOnlyEmbeddedSearch,
  assertEmptySubmitValidation,
  assertFormLoaded,
  assertInvalidFieldValidation,
  assertMissingEntityRendersNotFoundInPlace,
  assertSuccessDialog,
  assertUpdateSnackbar,
  editStates,
  interceptExistingEntity,
  requestBody,
  sourceListEntities,
  successEntity,
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
  requiredFields: [
    'input#title',
    'input#publication_venue',
    'input#publication_date',
    '#publication_status',
    'input#publication_url',
    'textarea#description',
  ],
  requiredMessages: [
    'Please select at least one Source',
  ],
};

describe('Publication form', () => {
  it('loads and validates required fields', () => {
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(publicationForm.path);
    assertFormLoaded(publicationForm);
    assertEmptySubmitValidation(publicationForm);
  });

  it('renders not-found content in place for missing publication IDs', () => {
    assertMissingEntityRendersNotFoundInPlace({
      path: '/publication',
      entityID: 'missing-publication-id',
    });
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

  it('rejects invalid issue and volume values', () => {
    const publicationParams = new URLSearchParams({
      title: 'Invalid publication numbers',
      publication_venue: 'Journal of Cypress',
      publication_date: '2026-01-15',
      publication_status: 'true',
      publication_url: 'https://example.org/publication',
      issue: '-1',
      volume: 'abc',
      description: 'Publication with invalid numeric fields',
      source_list: sourceListEntities[0].hubmap_id,
    });

    cy.intercept('POST', '**/publications').as('createPublicationInvalidNumbers');
    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/publication?${publicationParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
    cy.contains('button', 'Save', { timeout: 30000 }).click({ force: true });

    assertInvalidFieldValidation({
      selector: 'input#issue',
      message: 'Issue must be a positive integer',
    });
    assertInvalidFieldValidation({
      selector: 'input#volume',
      message: 'Volume must be a positive integer',
    });
    cy.get('@createPublicationInvalidNumbers.all').should('have.length', 0);
  });

  it('creates a publication from a complete valid form', () => {
    const createdPublication = successEntity('Publication', {
      uuid: 'publication-create-success',
      hubmap_id: 'HBM999.PUBL.001',
      title: 'Created publication title',
    });
    const publicationParams = new URLSearchParams({
      title: createdPublication.title,
      publication_venue: 'Journal of Cypress',
      publication_date: '2026-01-15',
      publication_status: 'true',
      publication_url: 'https://example.org/publication',
      publication_doi: '10.1234/cypress.publication',
      issue: '4',
      volume: '12',
      pages_or_article_num: 'A123',
      description: 'Created publication abstract',
      source_list: sourceListEntities[0].hubmap_id,
    });

    cy.intercept('POST', '**/publications', {
      statusCode: 200,
      body: createdPublication,
    }).as('createPublication');
    cy.intercept('GET', `**/entities/${createdPublication.uuid}/globus-url`, {
      statusCode: 200,
      body: 'https://example.org/globus/publication-create-success',
    }).as('publicationCreateGlobus');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/new/publication?${publicationParams.toString()}`, {
      searchResults: [sourceListEntities[0]],
    });
    cy.contains('button', 'Save', { timeout: 30000 }).click({ force: true });

    requestBody('@createPublication').then((body) => {
      expect(body).to.include({
        title: createdPublication.title,
        publication_venue: 'Journal of Cypress',
        publication_date: '2026-01-15',
        publication_status: true,
        publication_url: 'https://example.org/publication',
        description: 'Created publication abstract',
      });
      expect(body.issue).to.equal(4);
      expect(body.volume).to.equal(12);
      expect(body.direct_ancestor_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertSuccessDialog(createdPublication);
  });

  describe('action buttons', () => {
    const publication = successEntity('Publication', {
      uuid: 'publication-action-buttons',
      hubmap_id: 'HBM999.PUBL.900',
      title: 'Action button publication',
      publication_venue: 'Journal of Cypress',
      publication_date: '2026-01-15',
      publication_status: true,
      publication_url: 'https://example.org/publication',
      publication_doi: '10.1234/cypress.publication',
      description: 'Action button publication abstract',
      direct_ancestors: [sourceListEntities[0]],
    });

    const cases = [
      {
        name: 'create mode shows Save and Cancel',
        path: publicationForm.path,
        visible: ['Save', 'Cancel'],
        hidden: ['Revert', 'Process', 'Submit'],
      },
      {
        name: 'new publication with admin and write shows all edit actions',
        path: `/publication/${publication.uuid}`,
        entity: publication,
        permissions: editStates({ has_admin_priv: true, has_write_priv: true }),
        visible: ['Revert', 'Process', 'Submit', 'Save', 'Cancel'],
        hidden: [],
      },
      {
        name: 'admin-only publication can revert and process but cannot save or submit',
        path: `/publication/${publication.uuid}`,
        entity: publication,
        permissions: editStates({ has_admin_priv: true, has_write_priv: false }),
        visible: ['Revert', 'Process', 'Cancel'],
        hidden: ['Submit', 'Save'],
      },
      {
        name: 'published publication hides edit actions',
        path: `/publication/${publication.uuid}`,
        entity: { ...publication, status: 'Published' },
        permissions: editStates({ has_admin_priv: true, has_write_priv: true }),
        visible: ['Cancel'],
        hidden: ['Revert', 'Process', 'Submit', 'Save'],
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

  it('updates an existing publication from a valid edit form', () => {
    const editablePublication = successEntity('Publication', {
      uuid: 'publication-edit-success',
      hubmap_id: 'HBM999.PUBL.002',
      title: 'Editable publication title',
      publication_venue: 'Journal of Cypress',
      publication_date: '2026-01-15',
      publication_status: true,
      publication_url: 'https://example.org/publication',
      publication_doi: '10.1234/cypress.publication',
      description: 'Original publication abstract',
      direct_ancestors: [sourceListEntities[0]],
    });

    interceptExistingEntity(editablePublication, editStates({ has_write_priv: true }), {
      globusUrl: 'https://example.org/globus/publication-edit-success',
    });
    cy.intercept('PUT', `**/entities/${editablePublication.hubmap_id}`, {
      statusCode: 200,
      body: { message: 'Publication updated successfully' },
    }).as('updatePublication');

    cy.viewport(1280, 900);
    cy.visitWithMockAuth(`/publication/${editablePublication.uuid}`);
    cy.get('textarea#description', { timeout: 30000 }).clear().type('Updated publication abstract');
    cy.contains('button', /^Save$/).click({ force: true });

    requestBody('@updatePublication').then((body) => {
      expect(body.description).to.equal('Updated publication abstract');
      expect(body.direct_ancestor_uuids).to.deep.equal([sourceListEntities[0].uuid]);
    });
    assertUpdateSnackbar('Publication updated successfully');
  });
});
