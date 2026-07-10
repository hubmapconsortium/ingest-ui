/* global Cypress, cy, expect */

export const devServices = {
  entityApi: Cypress.env('devEntityApiUrl') || 'https://entity-api.dev.hubmapconsortium.org',
  ingestApi: Cypress.env('devIngestApiUrl') || 'https://ingest-api.dev.hubmapconsortium.org',
  searchApi: Cypress.env('devSearchApiUrl') || 'https://search-api.dev.hubmapconsortium.org/v3',
  ubkgApi: Cypress.env('devUbkgApiUrl') || 'https://ontology-api.dev.hubmapconsortium.org',
};

export const protocolUrl = 'https://dx.doi.org/10.17504/protocols.io.AAAAAAdfgzf';

let cachedServiceAuthInfo = null;

function parseAuthInfo(authInfo) {
  return typeof authInfo === 'string' ? JSON.parse(authInfo) : authInfo;
}

function selectedRole() {
  return Cypress.env('serviceAuthRole');
}

function getConfiguredAuthInfo() {
  const authInfoByRole = Cypress.env('authInfoByRole') || {};
  const role = selectedRole();
  return (role && authInfoByRole[role]) ? authInfoByRole[role] : Cypress.env('authInfo');
}

function getServiceAccount() {
  const testAccounts = Cypress.env('testAccounts') || {};
  const role = selectedRole();
  return (role && testAccounts[role]) ? testAccounts[role] : Cypress.env('testAccount');
}

function validateAuthInfo(authInfo) {
  const parsed = parseAuthInfo(authInfo);

  if (!parsed || !parsed.groups_token) {
    throw new Error('Service login must return an info payload with groups_token.');
  }

  return parsed;
}

function cacheServiceAuthInfo(authInfo) {
  cachedServiceAuthInfo = validateAuthInfo(authInfo);
  Cypress.env('serviceAuthInfo', cachedServiceAuthInfo);
  return cachedServiceAuthInfo;
}

function loginPause() {
  const minMs = Cypress.env('serviceLoginPauseMinMs') || 1000;
  const maxMs = Cypress.env('serviceLoginPauseMaxMs') || 4000;
  return cy.wait(Cypress._.random(minMs, maxMs), { log: false });
}

function loginPauseConfig() {
  return {
    minMs: Cypress.env('serviceLoginPauseMinMs') || 1000,
    maxMs: Cypress.env('serviceLoginPauseMaxMs') || 4000,
  };
}

function authInfoFromHref(href) {
  const info = new URL(href).searchParams.get('info');
  return info ? JSON.parse(info) : null;
}

function originHostname(origin) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).hostname.toLowerCase();
  } catch (e) {
    return null;
  }
}

function fillGlobusLogin(account) {
  return cy.get('body', { timeout: 30000 }).then(($body) => {
    if (account.organization === 'Google' && $body.find('a[href*="google"], button:contains("Google"), img[alt*="Google"], .fa-google').length > 0) {
      const $googleTrigger = $body
        .find('a[href*="google"], button:contains("Google"), img[alt*="Google"], .fa-google')
        .first()
        .closest('a, button');
      const trigger = ($googleTrigger.length > 0 ? $googleTrigger : $body.find('a[href*="google"], button:contains("Google"), img[alt*="Google"], .fa-google').first())[0];

      trigger.click();
      return fillGoogleLogin(account);
    }

    if ($body.find('#identity_provider-selectized').length > 0 && account.organization) {
      cy.get('#identity_provider-selectized')
        .clear({ force: true })
        .type(account.organization, { force: true });
      loginPause();
      cy.contains('.selectize-dropdown-content [data-selectable], .selectize-dropdown-content .option', account.organization)
        .click({ force: true });
    }

    if ($body.find('#login-btn').length > 0) {
      loginPause();
      cy.get('#login-btn').click({ force: true });
    }
  });
}

function failIfGlobusErrorPage() {
  return cy.location('origin', { timeout: 30000 }).then((origin) => {
    if (originHostname(origin) !== 'auth.globus.org') {
      return;
    }

    cy.get('body', { timeout: 30000 }).then(($body) => {
      const bodyText = $body.text();

      if (bodyText.includes('Unable to Fulfill Your Request')) {
        throw new Error(`Globus login failed before token handoff. The configured organization may be invalid for this dummy account, or Globus rejected the login request. Current page says: ${bodyText.replace(/\s+/g, ' ').trim()}`);
      }
    });
  });
}

function fillGoogleLogin(account) {
  return cy.origin('https://accounts.google.com', {
    args: {
      username: account.username,
      password: account.password,
      ...loginPauseConfig(),
    },
  }, ({
    username, password, minMs, maxMs,
  }) => {
    const loginPauseInOrigin = () => cy.wait(Cypress._.random(minMs, maxMs), { log: false });
    const failIfGoogleErrorPage = ($body) => {
      const bodyText = $body.text().replace(/\s+/g, ' ').trim();

      if (bodyText.includes('403') && bodyText.includes('do not have access to this page')) {
        throw new Error(`Google rejected the Globus login handoff before the password step. Current page says: ${bodyText}`);
      }
    };

    return loginPauseInOrigin()
      .then(() => cy.get('body', { timeout: 30000 }))
      .then(($body) => {
        failIfGoogleErrorPage($body);

        if ($body.find('input[type="email"], input#identifierId').length === 0) {
          return undefined;
        }

        return cy.get('input[type="email"], input#identifierId')
          .first()
          .clear({ force: true })
          .type(username, { log: false, force: true })
          .then(() => loginPauseInOrigin())
          .then(() => cy.get('#identifierNext, button')
            .contains(/^Next$|^Continue$/)
            .click({ force: true }));
      })
      .then(() => loginPauseInOrigin())
      .then(() => cy.get('body', { timeout: 30000 }))
      .then(($body) => {
        failIfGoogleErrorPage($body);

        if ($body.find('input[type="password"], input[name="Passwd"]').length === 0) {
          throw new Error(`Google login did not present a password field. Current page says: ${$body.text().replace(/\s+/g, ' ').trim()}`);
        }

        return cy.get('input[type="password"], input[name="Passwd"]')
          .first()
          .clear({ force: true })
          .type(password, { log: false, force: true });
      })
      .then(() => loginPauseInOrigin())
      .then(() => cy.get('#passwordNext, button')
        .contains(/^Next$|^Continue$/)
        .click({ force: true }));
  });
}

function fillCurrentOriginLogin(account) {
  return cy.location('origin', { timeout: 60000 }).then((origin) => {
    if (originHostname(origin) === 'accounts.google.com') {
      return fillGoogleLogin(account);
    }

    return fillGlobusLogin(account);
  });
}

function continueLoginUntilAuthInfo(account, attemptsRemaining = 5) {
  return cy.location('href', { timeout: 45000 }).then((href) => {
    if (href && href.includes('info=')) {
      return cacheServiceAuthInfo(authInfoFromHref(href));
    }

    if (attemptsRemaining <= 0) {
      throw new Error(`Login did not produce an info token bundle. Last URL: ${href || '(unknown)'}`);
    }

    return failIfGlobusErrorPage()
      .then(() => fillCurrentOriginLogin(account))
      .then(() => continueLoginUntilAuthInfo(account, attemptsRemaining - 1));
  });
}

function loginForServiceAuth() {
  const account = getServiceAccount();

  if (!account) {
    const configuredAuthInfo = getConfiguredAuthInfo();
    if (configuredAuthInfo) {
      return cy.wrap(cacheServiceAuthInfo(configuredAuthInfo), { log: false });
    }
    throw new Error('Missing test account. Provide testAccounts[serviceAuthRole] with username, password, and organization.');
  }

  if (!account.username || !account.password || !account.organization) {
    throw new Error('Service test account must include username, password, and organization.');
  }

  cachedServiceAuthInfo = null;
  Cypress.env('serviceAuthInfo', null);

  const loginUrl = Cypress.env('devServiceLoginUrl') || `${devServices.ingestApi}/login`;
  cy.visit(loginUrl, { failOnStatusCode: false });
  loginPause();
  return continueLoginUntilAuthInfo(account);
}

export function getAuthInfo() {
  if (cachedServiceAuthInfo) {
    return cy.wrap(cachedServiceAuthInfo, { log: false });
  }

  const envAuthInfo = Cypress.env('serviceAuthInfo');
  if (envAuthInfo) {
    return cy.wrap(cacheServiceAuthInfo(envAuthInfo), { log: false });
  }

  const configuredAuthInfo = getConfiguredAuthInfo();
  if (configuredAuthInfo) {
    return cy.wrap(cacheServiceAuthInfo(configuredAuthInfo), { log: false });
  }

  return loginForServiceAuth();
}

export function assertDevOnly() {
  expect(devServices.entityApi, 'entity API target').to.include('.dev.');
  expect(devServices.ingestApi, 'ingest API target').to.include('.dev.');
  expect(devServices.searchApi, 'search API target').to.include('.dev.');
  expect(devServices.ubkgApi, 'UBKG API target').to.include('.dev.');
}

export function serviceHeaders(authInfo) {
  return {
    Authorization: `Bearer ${authInfo.groups_token}`,
    'Content-Type': 'application/json',
    'X-Hubmap-Application': 'ingest-ui-cypress-service-test',
  };
}

export function uniqueRunId(prefix) {
  return `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}`;
}

export function entityApiRequest(method, path, body) {
  assertDevOnly();
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.entityApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function ingestApiRequest(method, path, body) {
  assertDevOnly();
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.ingestApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function searchApiRequest(method, path, body) {
  assertDevOnly();
  return getAuthInfo().then((authInfo) => {
    return cy.request({
      method,
      url: `${devServices.searchApi}${path}`,
      headers: serviceHeaders(authInfo),
      body,
      failOnStatusCode: false,
    });
  });
}

export function ubkgApiRequest(method, path) {
  assertDevOnly();
  return cy.request({
    method,
    url: `${devServices.ubkgApi}${path}`,
    failOnStatusCode: false,
  });
}

export function expectSuccess(response, allowedStatuses = [200]) {
  expect(response.status, JSON.stringify(response.body)).to.be.oneOf(allowedStatuses);
}

export function getServiceGroupUuid() {
  const configuredGroupUuid = Cypress.env('devServiceGroupUuid');

  if (configuredGroupUuid) {
    return cy.wrap(configuredGroupUuid);
  }

  return ingestApiRequest('GET', '/metadata/usergroups')
    .then((response) => {
      expectSuccess(response);
      expect(response.body).to.have.property('groups');

      const serviceGroup = response.body.groups.find((group) => group.data_provider)
        || response.body.groups[0];

      expect(Boolean(serviceGroup), 'DEV service data-provider group').to.equal(true);
      expect(serviceGroup.uuid, 'DEV service group UUID').to.be.a('string');
      expect(serviceGroup.uuid.length, 'DEV service group UUID length').to.be.greaterThan(0);

      return serviceGroup.uuid;
    });
}
