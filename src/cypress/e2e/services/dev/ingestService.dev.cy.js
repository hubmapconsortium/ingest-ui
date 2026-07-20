/* global describe, it, expect */

import {
  expectSuccess,
  ingestApiRequest,
} from './devServiceHelpers';

describe('DEV service integration: ingest-api', () => {
  it('reads authenticated user groups', () => {
    ingestApiRequest('GET', '/metadata/usergroups')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.have.property('groups');
        expect(response.body.groups).to.be.an('array');
        expect(response.body.groups.length).to.be.greaterThan(0);

        response.body.groups.forEach((group) => {
          expect(group.uuid, 'group uuid').to.be.a('string');
          expect(group.name || group.displayname, 'group name or display name').to.be.a('string');
        });
      });
  });

  it('reads pipeline testing privilege status for the authenticated user', () => {
    ingestApiRequest('GET', '/has-pipeline-test-privs')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.have.property('has_pipeline_test_privs');
        expect(response.body.has_pipeline_test_privs).to.be.oneOf([true, false]);
      });
  });
});
