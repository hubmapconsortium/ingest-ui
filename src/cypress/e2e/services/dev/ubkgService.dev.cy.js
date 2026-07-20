/* global describe, it, expect */

import {
  expectSuccess,
  ubkgApiRequest,
} from './devServiceHelpers';

describe('DEV service integration: UBKG ontology-api', () => {
  it('reads organ codes used by Sample and Upload forms', () => {
    ubkgApiRequest('GET', '/organs/by-code?application_context=HUBMAP')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.be.an('object');
        expect(response.body).to.have.property('RK');
        expect(response.body.RK).to.be.a('string');
        expect(response.body.RK).to.match(/Kidney/i);
      });
  });

  it('reads full organ metadata with RUI support flags', () => {
    ubkgApiRequest('GET', '/organs?application_context=HUBMAP')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.be.an('array');

        const rightKidney = response.body.find((organ) => organ.rui_code === 'RK');

        expect(Boolean(rightKidney), 'right kidney organ metadata').to.equal(true);
        expect(rightKidney).to.have.property('rui_supported');
      });
  });

  it('reads dataset types used by Dataset forms', () => {
    ubkgApiRequest('GET', '/dataset-types?application_context=HUBMAP')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);

        const datasetTypeNames = response.body
          .map((datasetType) => datasetType.dataset_type || datasetType.name || datasetType.term);

        expect(datasetTypeNames).to.include('RNAseq');
      });
  });

  it('reads upload dataset type values used by Upload forms', () => {
    ubkgApiRequest('GET', '/valueset?parent_sab=HUBMAP&parent_code=C003041&child_sabs=HUBMAP')
      .then((response) => {
        expectSuccess(response);
        expect(response.body).to.be.an('array');
        expect(response.body.length).to.be.greaterThan(0);

        response.body.forEach((value) => {
          expect(value).to.have.property('term');
          expect(value.term).to.be.a('string');
        });
      });
  });
});
