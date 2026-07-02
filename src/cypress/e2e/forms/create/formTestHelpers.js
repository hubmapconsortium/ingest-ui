/* global cy, Cypress, expect */

export const editStates = (overrides = {}) => ({
  has_admin_priv: false,
  has_publish_priv: false,
  has_submit_priv: false,
  has_write_priv: true,
  has_pipeline_testing_priv: false,
  ...overrides,
});

export const sampleSource = {
  uuid: 'source-sample-rui',
  hubmap_id: 'HBM111.RUI.001',
  entity_type: 'Sample',
  sample_category: 'organ',
  organ: 'RK',
  submission_id: 'S-RUI-1',
  group_name: 'Cypress Smoke Group',
  created_by_user_displayname: 'Cypress Mock User',
};

export const sampleSourceWithoutOrgan = {
  uuid: 'source-sample-ancestor-rui',
  hubmap_id: 'HBM111.RUI.002',
  entity_type: 'Sample',
  sample_category: 'section',
  submission_id: 'S-RUI-2',
  group_name: 'Cypress Smoke Group',
  created_by_user_displayname: 'Cypress Mock User',
};

export const ancestorOrganSample = {
  uuid: 'ancestor-organ-sample',
  hubmap_id: 'HBM111.ORGN.003',
  entity_type: 'Sample',
  sample_category: 'organ',
  organ: 'LK',
};

export const donorSource = {
  uuid: 'source-donor',
  hubmap_id: 'HBM222.DONR.002',
  entity_type: 'Donor',
  lab_donor_id: 'donor-source-1',
  submission_id: 'D-1',
  group_name: 'Cypress Smoke Group',
};

export const donorAncestor = {
  uuid: 'ancestor-donor',
  entity_type: 'Donor',
  metadata: {
    organ_donor_data: [
      { grouping_code: '57312000', preferred_term: 'Female' },
    ],
  },
};

export const sourceListString = 'HBM575.XFCT.276, HBM645.XLLN.924, HBM243.HRTG.365, segdszdg.PHSC.677, HBM628.HGGF.468, HBM452.MTRP.523, HBM237.XQJV.963, HBM536.GZQR.922, HBM293.GBPH.862, HBM645.XLLN.924, HBM566.QVLX.393, HBM279.SLFX.335,';

export const sourceListEntities = [
  'HBM575.XFCT.276',
  'HBM645.XLLN.924',
  'HBM243.HRTG.365',
  'HBM452.MTRP.523',
  'HBM237.XQJV.963',
  'HBM536.GZQR.922',
  'HBM293.GBPH.862',
  'HBM566.QVLX.393',
  'HBM279.SLFX.335',
].map((hubmapId, index) => ({
  uuid: `dataset-source-list-${index + 1}`,
  hubmap_id: hubmapId,
  entity_type: 'Dataset',
  lab_dataset_id: `dataset-source-list-${index + 1}`,
  dataset_type: 'RNAseq',
  data_access_level: 'public',
  created_by_user_email: 'cypress@example.org',
  group_name: 'Cypress Smoke Group',
  status: 'Published',
}));

export const wrongTypeSourceListEntity = {
  uuid: 'wrong-type-source-list-1',
  hubmap_id: 'HBM628.HGGF.468',
  entity_type: 'Sample',
  sample_category: 'block',
  group_name: 'Cypress Smoke Group',
  status: 'New',
};

export const protocolUrl = 'https://dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf';

export function successEntity(entityType, overrides = {}) {
  const prefix = entityType.substring(0, 4).toUpperCase();
  return {
    uuid: `${entityType.toLowerCase()}-created-cypress`,
    hubmap_id: `HBM999.${prefix}.999`,
    entity_type: entityType,
    submission_id: `${prefix}-CYPRESS-1`,
    group_uuid: '00000000-0000-0000-0000-000000000001',
    group_name: 'Cypress Smoke Group',
    status: 'New',
    ...overrides,
  };
}

export function assertFormLoaded({ entityType, selectors, submitLabel }) {
  cy.contains('.FormHead', 'Registering a', { timeout: 30000 }).should('be.visible');
  cy.contains('.FormHead', entityType, { timeout: 30000 }).should('be.visible');

  selectors.forEach((selector) => {
    cy.get(selector, { timeout: 30000 }).should('exist');
  });

  cy.get('button:visible').contains(submitLabel).should('exist');
}

function assertRequiredFieldError(selector) {
  cy.get(selector, { timeout: 30000 }).should(($field) => {
    const elements = Array.from($field);
    const hasInvalidField = elements.some((element) => element.matches(':invalid'));
    const hasErrorState = (
      hasInvalidField
      || $field.hasClass('Mui-error')
      || $field.hasClass('error')
      || $field.hasClass('fieldError')
      || $field.closest('.MuiFormControl-root').find('.Mui-error').length > 0
      || $field.closest('.MuiFormControl-root').find('.fieldError').length > 0
      || $field.closest('.invalid').length > 0
      || $field.closest('.error').length > 0
    );

    expect(hasErrorState, `${selector} should render an error state`).to.equal(true);
    expect(elements.length, `${selector} should still be in the form`).to.be.greaterThan(0);
  });
}

export function assertEmptySubmitValidation({ submitLabel, requiredFields = [], requiredMessages = [] }) {
  cy.get('button:visible').contains(submitLabel).click();
  cy.contains(/required|Please select|Please Review|valid protocols/i, { timeout: 30000 })
    .should('exist');

  requiredFields.forEach(assertRequiredFieldError);

  requiredMessages.forEach((message) => {
    cy.contains(message, { timeout: 30000 }).should('be.visible');
  });
}

export function visualCheckpoint(name) {
  if (Cypress.env('VISUAL_CHECKPOINTS')) {
    cy.screenshot(`form-checkpoints/${name}`, { capture: 'viewport' });
  }
}

export function assertSuccessDialog(entity) {
  cy.contains('Success!', { timeout: 30000 }).should('be.visible');
  cy.contains('Save was successful').should('be.visible');
  cy.contains(entity.hubmap_id).should('be.visible');
}

export function assertUpdateSnackbar(message = 'Entity Updated Successfully!') {
  cy.contains(message, { timeout: 30000 }).should('be.visible');
}

export function requestBody(alias) {
  return cy.wait(alias).then((interception) => {
    const { body } = interception.request;
    return typeof body === 'string' ? JSON.parse(body) : body;
  });
}

export function interceptNewSampleSource(source, ancestors = [donorAncestor, source]) {
  cy.intercept('GET', `**/entities/${source.uuid}*`, {
    statusCode: 200,
    body: source,
  }).as(`entity-${source.uuid}`);

  cy.intercept('GET', `**/ancestors/${source.uuid}`, {
    statusCode: 200,
    body: ancestors,
  }).as(`ancestors-${source.uuid}`);
}

export function datasetEntity(overrides = {}) {
  return {
    uuid: 'dataset-action-matrix',
    hubmap_id: 'HBM999.DATA.999',
    entity_type: 'Dataset',
    status: 'New',
    creation_action: 'Create Dataset Activity',
    lab_dataset_id: 'lab-dataset-1',
    description: 'Mock dataset for action buttons',
    dataset_info: 'Additional searchable info',
    contains_human_genetic_sequences: false,
    dataset_type: 'RNAseq',
    group_uuid: '00000000-0000-0000-0000-000000000001',
    group_name: 'Cypress Smoke Group',
    created_by_user_email: 'cypress@example.org',
    created_timestamp: 1700000000000,
    direct_ancestors: [
      {
        uuid: 'dataset-source-1',
        hubmap_id: 'HBM333.SRC.003',
        entity_type: 'Sample',
        sample_category: 'block',
        group_name: 'Cypress Smoke Group',
        status: 'New',
      },
    ],
    ...overrides,
  };
}

export function interceptDataset(entity, permissions) {
  cy.intercept('GET', `**/entities/${entity.uuid}*`, {
    statusCode: 200,
    body: entity,
  }).as(`dataset-${entity.uuid}`);

  cy.intercept('GET', `**/entities/${entity.uuid}/globus-url`, {
    statusCode: 200,
    body: 'https://example.org/globus/mock',
  }).as(`globus-${entity.uuid}`);

  cy.intercept('GET', `**/entities/${entity.uuid}/allowable-edit-states`, {
    statusCode: 200,
    body: permissions,
  }).as(`edit-states-${entity.uuid}`);
}

export function interceptExistingEntity(entity, permissions = editStates(), options = {}) {
  cy.intercept('GET', `**/entities/${entity.uuid}*`, {
    statusCode: 200,
    body: entity,
  }).as(`${entity.entity_type.toLowerCase()}-${entity.uuid}`);

  cy.intercept('GET', `**/entities/${entity.hubmap_id}*`, {
    statusCode: 200,
    body: entity,
  }).as(`${entity.entity_type.toLowerCase()}-${entity.hubmap_id}`);

  cy.intercept('GET', `**/entities/${entity.uuid}/allowable-edit-states`, {
    statusCode: 200,
    body: permissions,
  }).as(`${entity.entity_type.toLowerCase()}-edit-states-${entity.uuid}`);

  if (options.globusUrl) {
    cy.intercept('GET', `**/entities/${entity.uuid}/globus-url`, {
      statusCode: 200,
      body: options.globusUrl,
    }).as(`${entity.entity_type.toLowerCase()}-globus-${entity.uuid}`);
  }
}

export function assertBulkSelectorSourceList({
  path,
  expectedSelected,
  expectsWrongTypeError,
  screenshotName,
}) {
  cy.viewport(1280, 900);

  cy.visitWithMockAuth(`${path}?source_list=${encodeURIComponent(sourceListString)}`, {
    searchResults: [...sourceListEntities, wrongTypeSourceListEntity],
  });

  cy.contains('Associated Dataset IDs', { timeout: 30000 }).should('be.visible');
  cy.contains('button', 'HBM575.XFCT.276').should('exist');
  cy.contains('button', 'HBM645.XLLN.924').should('exist');
  cy.contains('button', 'HBM279.SLFX.335').should('exist');
  cy.contains(new RegExp(`TotalSelected\\s*:\\s*${expectedSelected}`)).should('exist');

  cy.contains('Bulk Selection Warning').should('be.visible');
  cy.contains('referenced more than once').should('be.visible');
  cy.contains('HBM645.XLLN.924').should('be.visible');

  cy.contains('Bulk Selection Error').should('exist');
  cy.contains('not found').should('exist');
  cy.contains('segdszdg.PHSC.677').should('exist');

  if (expectsWrongTypeError) {
    cy.contains('wrong Type').should('exist');
    cy.contains('HBM628.HGGF.468').should('exist');
    cy.contains('Invalid Type:').should('exist');
    cy.contains('Sample').should('exist');
  } else {
    cy.contains('button', 'HBM628.HGGF.468').should('exist');
    cy.contains('wrong Type').should('not.exist');
  }

  visualCheckpoint(screenshotName);
}

export function assertDatasetOnlyEmbeddedSearch({ path, dialogTitle, screenshotName }) {
  cy.viewport(1280, 900);

  cy.visitWithMockAuth(path, {
    searchResults: sourceListEntities.slice(0, 2),
  });

  cy.contains('Associated Dataset IDs', { timeout: 30000 }).should('be.visible');
  cy.get('#bulkButtons').contains('button', 'Add').click();
  cy.contains(dialogTitle, { timeout: 30000 }).should('be.visible');
  cy.get('select#entity_type').should('be.disabled').and('have.value', 'dataset');
  cy.get('select#entity_type option').should('have.length', 1).and('contain', 'Dataset');
  visualCheckpoint(screenshotName);
}
