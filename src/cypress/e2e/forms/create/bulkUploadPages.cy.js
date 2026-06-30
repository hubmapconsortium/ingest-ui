/* global cy, describe, it */

import { visualCheckpoint } from './formTestHelpers';

describe('Bulk entity and metadata upload pages', () => {
  it('parses and registers a bulk sample TSV through the happy path', () => {
    cy.viewport(1280, 900);
    cy.intercept('POST', '**/samples/bulk-upload', {
      statusCode: 201,
      body: { temp_id: 'bulk-sample-temp-id' },
    }).as('sampleBulkUpload');
    cy.intercept('POST', '**/samples/bulk', {
      statusCode: 201,
      body: {
        data: {
          1: {
            uuid: 'bulk-sample-1',
            hubmap_id: 'HBM555.BULK.001',
            submission_id: 'S-BULK-1',
            lab_tissue_sample_id: '19-002 Thymus CC-1 Block D',
            sample_category: 'block',
            status: 'New',
          },
          2: {
            uuid: 'bulk-sample-2',
            hubmap_id: 'HBM555.BULK.002',
            submission_id: 'S-BULK-2',
            lab_tissue_sample_id: 'dfghdfvghdg',
            sample_category: 'organ',
            status: 'New',
          },
        },
      },
    }).as('sampleBulkRegister');

    cy.visitWithMockAuth('/bulk/samples');

    cy.contains('Bulk Samples', { timeout: 30000 }).should('be.visible');
    cy.get('input[type=file]').selectFile('testFiles/Entities/Samples/Reg3Good.tsv', { force: true });
    cy.wait('@sampleBulkUpload');
    cy.get('.pagelessFooter').should('contain', 'Total Rows:').and('contain', '3');
    cy.get('.uploadManager').contains('button', 'Register').should('not.be.disabled').click();
    cy.wait('@sampleBulkRegister');
    cy.contains('Success: The following rows registered successfully!', { timeout: 30000 }).should('be.visible');
    cy.contains('HBM555.BULK.001').should('be.visible');
    cy.contains('button', 'Restart').should('be.visible');
    visualCheckpoint('bulk-samples-registration-success');
  });

  it('surfaces row-limit validation messaging for bulk entity uploads', () => {
    cy.viewport(1280, 900);
    cy.intercept('POST', '**/samples/bulk-upload', {
      statusCode: 400,
      body: { error: 'File exceeds the 40 row limit.' },
    }).as('sampleBulkUploadLimit');

    cy.visitWithMockAuth('/bulk/samples');

    cy.get('input[type=file]').selectFile('testFiles/Entities/Samples/tooMany.tsv', { force: true });
    cy.wait('@sampleBulkUploadLimit');
    cy.contains('There is a 40 row limit on uploaded files.').should('be.visible');
    cy.contains('File exceeds the 40 row limit.').should('be.visible');
    cy.get('.uploadManager').contains('button', 'Register').should('be.disabled');
    visualCheckpoint('bulk-samples-row-limit-error');
  });

  it('uploads sample block metadata after parsing the selected TSV', () => {
    cy.viewport(1280, 900);
    cy.intercept('PUT', '**/sample-bulk-metadata', {
      statusCode: 200,
      body: { status: 'success' },
    }).as('bulkMetadataUpload');

    cy.visitWithMockAuth('/metadata/block');

    cy.contains('Bulk Blocks', { timeout: 30000 }).should('be.visible');
    cy.get('input[type=file]').selectFile('cypress/fixtures/sample-block-metadata.tsv', { force: true });
    cy.contains('SNT329.XDJS.568').should('be.visible');
    cy.get('.uploadManager').contains('button', 'Upload').should('not.be.disabled').click();
    cy.wait('@bulkMetadataUpload');
    cy.contains('Success: The following rows were Uploaded successfully!', { timeout: 30000 }).should('be.visible');
    cy.contains('button', 'Restart').should('be.visible');
    visualCheckpoint('sample-block-metadata-success');
  });

  it('renders backend validation errors for sample metadata uploads', () => {
    cy.viewport(1280, 900);
    cy.intercept('PUT', '**/sample-bulk-metadata', {
      statusCode: 400,
      body: {
        error: 'Errors occurred during validation. Error validating metadata: [{"row": 2, "column": "sample_id", "error": "Sample UUID was not found"}]',
      },
    }).as('bulkMetadataUploadError');

    cy.visitWithMockAuth('/metadata/block');

    cy.get('input[type=file]').selectFile('cypress/fixtures/sample-block-metadata.tsv', { force: true });
    cy.get('.uploadManager').contains('button', 'Upload').should('not.be.disabled').click();
    cy.wait('@bulkMetadataUploadError');
    cy.contains('The following errors were encountered when trying to upload your data.').should('be.visible');
    cy.contains('Sample UUID was not found').should('be.visible');
    visualCheckpoint('sample-block-metadata-error');
  });
});
