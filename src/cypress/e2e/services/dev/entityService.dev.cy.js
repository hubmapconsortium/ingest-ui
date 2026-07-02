/* global describe, it, expect */

import {
  entityApiRequest,
  expectSuccess,
  getServiceGroupUuid,
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
        expect(response.body.groups).to.be.an('array');
        expect(response.body.groups.length).to.be.greaterThan(0);
      });
  });

  it('creates, updates, and reads back a donor in DEV entity-api', () => {
    getServiceGroupUuid().then((groupUuid) => {
      const runId = uniqueRunId('cypress-donor');
      const createPayload = {
        lab_donor_id: runId,
        label: `Cypress DEV donor ${runId}`,
        protocol_url: protocolUrl,
        description: `Created by Cypress DEV service integration test ${runId}`,
        group_uuid: groupUuid,
      };
      const updatedDescription = `Updated by Cypress DEV service integration test ${runId}`;

      return entityApiRequest('POST', '/entities/donor', createPayload)
        .then((createResponse) => {
          expectSuccess(createResponse, [200, 201]);
          expect(createResponse.body).to.include({
            entity_type: 'Donor',
            lab_donor_id: runId,
            label: createPayload.label,
          });
          expect(createResponse.body.uuid, 'created uuid').to.be.a('string');
          expect(createResponse.body.uuid.length, 'created uuid length').to.be.greaterThan(0);
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

  it('creates, updates, and reads back sample, dataset, and upload entities in DEV', () => {
    getServiceGroupUuid().then((groupUuid) => {
      const runId = uniqueRunId('cypress-lifecycle');
      const donorPayload = {
        lab_donor_id: `${runId}-donor`,
        label: `Cypress DEV lifecycle donor ${runId}`,
        protocol_url: protocolUrl,
        description: `Lifecycle donor created by Cypress ${runId}`,
        group_uuid: groupUuid,
      };

      return entityApiRequest('POST', '/entities/donor', donorPayload)
        .then((donorResponse) => {
          expectSuccess(donorResponse, [200, 201]);

          const samplePayload = {
            direct_ancestor_uuid: donorResponse.body.uuid,
            sample_category: 'organ',
            organ: 'RK',
            protocol_url: protocolUrl,
            lab_tissue_sample_id: `${runId}-sample`,
            description: `Lifecycle sample created by Cypress ${runId}`,
            group_uuid: groupUuid,
          };

          return entityApiRequest('POST', '/entities/sample', samplePayload)
            .then((sampleResponse) => ({ donor: donorResponse.body, sampleResponse }));
        })
        .then(({ donor, sampleResponse }) => {
          expectSuccess(sampleResponse, [200, 201]);
          expect(sampleResponse.body).to.include({
            entity_type: 'Sample',
            lab_tissue_sample_id: `${runId}-sample`,
            sample_category: 'organ',
            organ: 'RK',
          });

          const updatedSampleDescription = `Lifecycle sample updated by Cypress ${runId}`;
          return entityApiRequest('GET', `/ancestors/${sampleResponse.body.uuid}`)
            .then((ancestorsResponse) => {
              expectSuccess(ancestorsResponse);
              const ancestorUuids = ancestorsResponse.body.map((ancestor) => ancestor.uuid);
              expect(ancestorUuids, 'sample ancestor UUIDs').to.include(donor.uuid);

              return entityApiRequest('PUT', `/entities/${sampleResponse.body.hubmap_id}`, {
                lab_tissue_sample_id: `${runId}-sample`,
                protocol_url: protocolUrl,
                description: updatedSampleDescription,
              });
            })
            .then((sampleUpdateResponse) => ({
              sample: sampleResponse.body,
              updatedSampleDescription,
              sampleUpdateResponse,
            }));
        })
        .then((state) => {
          expectSuccess(state.sampleUpdateResponse, [200, 202]);
          return entityApiRequest('GET', `/entities/${state.sample.uuid}`)
            .then((sampleGetResponse) => ({ ...state, sampleGetResponse }));
        })
        .then((state) => {
          expectSuccess(state.sampleGetResponse);
          expect(state.sampleGetResponse.body.description).to.equal(state.updatedSampleDescription);

          const datasetPayload = {
            lab_dataset_id: `${runId}-dataset`,
            description: `Lifecycle dataset created by Cypress ${runId}`,
            dataset_info: `Traceable Cypress DEV dataset ${runId}`,
            contains_human_genetic_sequences: false,
            dataset_type: 'RNAseq',
            direct_ancestor_uuids: [state.sample.uuid],
            group_uuid: groupUuid,
          };

          return ingestApiRequest('POST', '/datasets', datasetPayload)
            .then((datasetResponse) => ({ ...state, datasetPayload, datasetResponse }));
        })
        .then((state) => {
          expectSuccess(state.datasetResponse, [200, 201]);
          expect(state.datasetResponse.body).to.include({
            entity_type: 'Dataset',
            lab_dataset_id: state.datasetPayload.lab_dataset_id,
            contains_human_genetic_sequences: false,
            dataset_type: 'RNAseq',
          });

          const datasetAncestorUuids = (state.datasetResponse.body.direct_ancestors || [])
            .map((ancestor) => ancestor.uuid);
          expect(datasetAncestorUuids, 'dataset ancestors').to.include(state.sample.uuid);

          const updatedDatasetDescription = `Lifecycle dataset updated by Cypress ${runId}`;
          return entityApiRequest('PUT', `/entities/${state.datasetResponse.body.hubmap_id}`, {
            lab_dataset_id: state.datasetPayload.lab_dataset_id,
            description: updatedDatasetDescription,
            dataset_info: state.datasetPayload.dataset_info,
            contains_human_genetic_sequences: false,
          }).then((datasetUpdateResponse) => ({
            ...state,
            dataset: state.datasetResponse.body,
            updatedDatasetDescription,
            datasetUpdateResponse,
          }));
        })
        .then((state) => {
          expectSuccess(state.datasetUpdateResponse, [200, 202]);
          return entityApiRequest('GET', `/entities/${state.dataset.uuid}`)
            .then((datasetGetResponse) => ({ ...state, datasetGetResponse }));
        })
        .then((state) => {
          expectSuccess(state.datasetGetResponse);
          expect(state.datasetGetResponse.body.description).to.equal(state.updatedDatasetDescription);

          const uploadPayload = {
            title: `Cypress DEV lifecycle upload ${runId}`,
            description: `Lifecycle upload created by Cypress ${runId}`,
            intended_organ: 'RK',
            intended_dataset_type: 'RNAseq',
            anticipated_dataset_count: 1,
            group_uuid: groupUuid,
          };

          return ingestApiRequest('POST', '/uploads', uploadPayload)
            .then((uploadResponse) => ({ ...state, uploadPayload, uploadResponse }));
        })
        .then((state) => {
          expectSuccess(state.uploadResponse, [200, 201]);
          expect(state.uploadResponse.body).to.include({
            entity_type: 'Upload',
            title: state.uploadPayload.title,
            intended_organ: 'RK',
            intended_dataset_type: 'RNAseq',
            anticipated_dataset_count: 1,
          });

          const updatedUploadDescription = `Lifecycle upload updated by Cypress ${runId}`;
          return entityApiRequest('PUT', `/entities/${state.uploadResponse.body.hubmap_id}`, {
            title: state.uploadPayload.title,
            description: updatedUploadDescription,
            intended_organ: state.uploadPayload.intended_organ,
            intended_dataset_type: state.uploadPayload.intended_dataset_type,
            anticipated_dataset_count: state.uploadPayload.anticipated_dataset_count,
          }).then((uploadUpdateResponse) => ({
            upload: state.uploadResponse.body,
            updatedUploadDescription,
            uploadUpdateResponse,
          }));
        })
        .then((state) => {
          expectSuccess(state.uploadUpdateResponse, [200, 202]);
          return entityApiRequest('GET', `/entities/${state.upload.uuid}`)
            .then((uploadGetResponse) => ({ ...state, uploadGetResponse }));
        })
        .then((state) => {
          expectSuccess(state.uploadGetResponse);
          expect(state.uploadGetResponse.body).to.include({
            uuid: state.upload.uuid,
            hubmap_id: state.upload.hubmap_id,
            description: state.updatedUploadDescription,
          });
        });
    });
  });
});
