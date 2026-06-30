/* global describe, it, expect */

import {
  entityApiRequest,
  expectSuccess,
  ingestApiRequest,
  protocolUrl,
  uniqueRunId,
} from './devServiceHelpers';

describe('DEV service integration: entity lifecycle', () => {
  it('reads authenticated user groups from DEV ingest-api', () => {
    ingestApiRequest('GET', '/metadata/usergroups')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.have.property('groups');
        expect(response.body.groups).to.be.an('array').and.not.be.empty;
      });
  });

  it('creates, updates, and reads back a donor in DEV entity-api', () => {
    const runId = uniqueRunId('cypress-donor');
    const createPayload = {
      lab_donor_id: runId,
      label: `Cypress DEV donor ${runId}`,
      protocol_url: protocolUrl,
      description: `Created by Cypress DEV service integration test ${runId}`,
      group_uuid: '00000000-0000-0000-0000-000000000001',
    };
    const updatedDescription = `Updated by Cypress DEV service integration test ${runId}`;

    entityApiRequest('POST', '/entities/donor', createPayload)
      .then((createResponse) => {
        expectSuccess(createResponse, [200, 201]);
        expect(createResponse.body).to.include({
          entity_type: 'Donor',
          lab_donor_id: runId,
          label: createPayload.label,
        });
        expect(createResponse.body.uuid, 'created uuid').to.be.a('string').and.not.be.empty;
        expect(createResponse.body.hubmap_id, 'created HuBMAP ID').to.match(/^HBM\d+\.\w+\.\d+$/);

        const donorId = createResponse.body.hubmap_id;
        return entityApiRequest('PUT', `/entities/${donorId}`, {
          lab_donor_id: runId,
          label: createPayload.label,
          protocol_url: protocolUrl,
          description: updatedDescription,
        }).then((updateResponse) => ({ createResponse, updateResponse }));
      })
      .then(({ createResponse, updateResponse }) => {
        expectSuccess(updateResponse, [200, 202]);
        return entityApiRequest('GET', `/entities/${createResponse.body.uuid}`)
          .then((getResponse) => ({ createResponse, getResponse }));
      })
      .then(({ createResponse, getResponse }) => {
        expectSuccess(getResponse);
        expect(getResponse.body).to.include({
          uuid: createResponse.body.uuid,
          hubmap_id: createResponse.body.hubmap_id,
          description: updatedDescription,
        });
      });
  });
});
