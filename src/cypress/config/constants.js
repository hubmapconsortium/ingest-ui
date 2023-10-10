const MSGS = {
    name: 'Ingest-UI',
    search: 'Search',
    entity: 'Entity',
    create: 'Create',
    edit: 'Edit',
    provenance: 'Provenance-UI'
}

// Selectors that are used more than once throughout the code
// should be made into constants for reuse here.
const SEARCH_TABLE = '.MuiDataGrid-main'
const TABLE_TD = '.MuiDataGrid-cell'

const SELECTORS = {
    search: '.input-group #search',
    table: {
        // btn_search: '.input-group-append button',
        result: '.result',
        input_keyword : '#keywords.form-control',
        input_group : '#group.select-css',
        input_type : '#entityType.select-css',
        checkAll: '.sui-check-all input',
        bodyCheckbox: `.rdt_TableBody input[type="checkbox"]`,
        main: SEARCH_TABLE,
        cell: TABLE_TD,
        ancestors: '.table--ancestors',
        th: `.MuiDataGrid-columnHeader`,
        tr: `${SEARCH_TABLE} .MuiDataGrid-row`,
        td: `${SEARCH_TABLE} .MuiDataGrid-cell`,
    },
    forms: {
        sampleCategory: '#sample_category',
        desc: '#description',
        protocolUrl: '#protocol_url',
        groupUuid: '#group_uuid'
    },
    modal: {
        title: '.modal-title'
    },
    btns: {
        default: '[type="button"]'
    }
}

const URLS = {
    domain: Cypress.env('domain') || 'https://localhost:8585/',
    ubkg: Cypress.env('ubkg_server') || 'https://ontology-api.dev.hubmapconsortium.org/'  //https://ontology.api.hubmapconsortium.org/
}

const DATA = {
    examples: {
        publication: {
            hubmapID: 'HBM874.DNFL.692',
            uuid: '0bac279e054856ca1b98a2bfb28bb011'
        }
    },
    source: {
        mouse: {
            uuid: '15f945ec3543385e6d7c191ab8321233',
            sennetId: 'SNT489.SKVP.536'
        },
        human: {
            uuid: '34fb81da75a5386d406a7b1835d92bdd',
            sennetId: 'SNT456.NJFC.364'
        }
    },
    sample: {
        organBrain: {
            uuid: '5d44c0918f5cac196b07feed76dcb4f9',
            sennetId: 'SNT875.ZVHK.264'
        },
        organ: {
            uuid: '3a54ef0a99eb5b39a0df732857bc96af',
            sennetId: 'SNT967.JSBZ.284'
        },
        block: {
            uuid: '3ffd8a087f0b8e2ffb4c5566dbd6c451',
            sennetId: 'SNT329.XDJS.568'
        },
        section: {
            uuid: '88e99a8332dc4f1ab71c668a0cdcdd63',
            sennetId: 'SNT576.VGWF.323'
        }
    },
}

const PATHS = {
    login: `${URLS.domain}?info={"name": "Jessica Waldrip", "email": "JJW118@pitt.edu", "globus_id": "73e021ed-ab4a-4955-bdc4-248fa50d2860", "auth_token": "AgYyJxbgqr810yPxnYPrJgXO1kvl143VbGedrgY27z5rpXQ6XDsWCrwbbBgg4XBgeew1K5WlaQvyw8U61n6WvFYXXJh8QQKFo77ghlWWv", "transfer_token": "AgVlryqYYWdD2o4KKoM3gNja6qEnllJza7XN22Xzzjge7kx34nhbC8Dl1092g3YwNK493DEEoBbK5ETvx8v7YC1vv6", "groups_token": "AgXjannnQxYvd9zpY7NPmMr6bkyzJqv75003KoOpr09alWWlEjTwC7j7GGYXeQOKEoG8eB97QMwbyvf0jO0EJu120y"}`,
    search: `${URLS.domain}search`,
    searchPub: `${URLS.domain}?keywords=${DATA.examples.publication.hubmapID}&entityType=publication`,
    searchFiles: `${URLS.domain}search/files`,
    edit: `${URLS.domain}edit`,
    view: `${URLS.domain}{entity}?uuid={id}`,
    api: {
        base: `${URLS.domain}api`,
        ontology: `${URLS.domain}api/ontology/{code}`
    }
}


const WAIT = {
    time: Cypress.env('wait_time') || 9000
}

export { URLS, PATHS, MSGS, DATA, WAIT, SELECTORS }