const MSGS = {
    name: 'Ingest-UI',
    search: 'Search',
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
    
}

const PATHS = {
    search: `${URLS.domain}search`,
    searchPub: `${URLS.domain}?keywords=${DATA.examples.publication.hubmapID}&entityType=publication`,
    loginURL: `localhost:8484/login`,
}


const WAIT = {
    time: Cypress.env('wait_time') || 9000
}

const AUTH = {
    username: Cypress.env('username'),
    password: Cypress.env('password')
}


export { URLS, PATHS, MSGS, DATA, WAIT, SELECTORS, AUTH }