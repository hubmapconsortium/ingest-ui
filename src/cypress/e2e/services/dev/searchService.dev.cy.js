/* global describe, it, expect */

import {
  expectSuccess,
  searchApiRequest,
} from './devServiceHelpers';

function expectSearchHits(response) {
  expectSuccess(response);
  expect(response.body).to.have.nested.property('hits.hits');
  expect(response.body.hits.hits).to.be.an('array');
}

describe('DEV service integration: search-api', () => {
  it('accepts a minimal authenticated search request', () => {
    const payload = {
      from: 0,
      size: 1,
      query: {
        match_all: {},
      },
    };

    searchApiRequest('POST', '/search', payload)
      .then((response) => {
        expectSearchHits(response);
        expect(response.body).to.have.nested.property('hits.total.value');
        expect(response.body.hits.total.value).to.be.a('number');
      });
  });

  it('returns entity-shaped results for a Dataset filter', () => {
    const payload = {
      from: 0,
      size: 3,
      query: {
        bool: {
          must: [
            {
              match: {
                'entity_type.keyword': 'Dataset',
              },
            },
          ],
        },
      },
      _source: [
        'uuid',
        'hubmap_id',
        'entity_type',
        'status',
        'group_name',
      ],
    };

    searchApiRequest('POST', '/search', payload)
      .then((response) => {
        expectSearchHits(response);

        response.body.hits.hits.forEach((hit) => {
          expect(hit).to.have.property('_source');
          expect(hit._source).to.include({ entity_type: 'Dataset' });
          expect(hit._source.uuid, 'search result uuid').to.be.a('string');
          expect(hit._source.hubmap_id, 'search result HuBMAP ID').to.match(/^HBM\d+\.\w+\.\d+$/);
        });
      });
  });
});
