import {MSGS, PATHS, DATA, URLS} from "../config/constants";
import {UBKG} from "../config/ubkg";

describe(`${MSGS.name}.UBKG`, () => {

    const makeRequest = (url, u) => {
        cy.request(url).then((response) => {
            let live = response.body
            let res = JSON.stringify(live)
            let current = JSON.parse(u.data)
            for (let i = 0; i < live.length; i++) {
                cy.log(`Is ${u.name} index ${i} equal?`, JSON.stringify(live[i]) === JSON.stringify(current[i]))
                expect(JSON.stringify(live[i])).to.equal(JSON.stringify(current[i]))
            }
            expect(res).to.equal(u.data)
        })
    }

    it('UBKG API Endpoints return expected response ...', () => {
        for (let u of UBKG.codes) {
            cy.log(`Testing endpoint for ${u.code}`, u.name)
            let url = URLS.ubkg
            url = u.endpoint ? url + u.endpoint : url + UBKG.endpoints.default.replace('{code}', u.code)
            makeRequest(url, u)
        }
    })

    it('SenNet Portal Ontology API code endpoints return expected response ...', () => {
        for (let u of UBKG.codes) {
            cy.log(`Testing endpoint for ${u.code}`, u.name)
            let url = PATHS.api.ontology.replace('{code}', u.code)
            makeRequest(url, u)
        }
    })
})