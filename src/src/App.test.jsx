import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';

import { App } from './App';
import { COLUMN_DEF_MIXED } from './components/ui/tableBuilder';
import { api_search2, api_validate_token } from './service/search_api';
import {
  ingest_api_all_groups,
  ingest_api_all_user_groups,
  ingest_api_user_admin,
  ingest_api_users_groups,
} from './service/ingest_api';
import { gateway_api_status } from './service/gateway_service';
import { adminStatusValidation } from './service/user_service';
import {
  ubkg_api_get_dataset_type_set,
  ubkg_api_get_organ_type_set,
  ubkg_api_get_organs_full,
} from './service/ubkg_api';

vi.mock('./service/search_api', () => ({
  api_search2: vi.fn(),
  api_validate_token: vi.fn(),
}));

vi.mock('./service/ingest_api', () => ({
  ingest_api_all_groups: vi.fn(),
  ingest_api_all_user_groups: vi.fn(),
  ingest_api_user_admin: vi.fn(),
  ingest_api_users_groups: vi.fn(),
}));

vi.mock('./service/gateway_service', () => ({
  gateway_api_status: vi.fn(),
}));

vi.mock('./service/ubkg_api', () => ({
  ubkg_api_get_dataset_type_set: vi.fn(),
  ubkg_api_get_organ_type_set: vi.fn(),
  ubkg_api_get_organs_full: vi.fn(),
}));

vi.mock('./service/user_service', () => ({
  adminStatusValidation: vi.fn(),
  sortGroupsByDisplay: vi.fn((value) => value),
}));

vi.mock('./Nav', () => ({
  Navigation: () => <nav aria-label="Migration test navigation" />,
}));

vi.mock('./components/ui/idle', () => ({ default: () => null }));

vi.mock('./utils/axiosDoglog', () => ({
  installAxiosDoglog: vi.fn(),
  installGlobalAxiosErrorLogger: vi.fn(),
}));

vi.mock('./utils/doglog', () => ({
  ddLog: vi.fn(),
  initDoglog: vi.fn(),
}));

const authInfo = {
  name: 'Migration Test User',
  email: 'migration@example.org',
  groups_token: 'migration-test-token',
};

const groups = [
  {
    displayname: 'Migration Test Group',
    name: 'migration-test-group',
    shortname: 'TMC Migration',
    uuid: 'migration-group-uuid',
  },
];

const searchRow = {
  id: 'migration-row-uuid',
  uuid: 'migration-row-uuid',
  hubmap_id: 'HBM123.TEST.456',
  submission_id: 'TEST0001',
  entity_type: 'Donor',
  lab_donor_id: 'DONOR-1',
  group_name: 'Migration Test Group',
  status: 'NEW',
  data_access_level: 'private',
  type: 'DONOR-1',
};

const originalFetch = globalThis.fetch;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function seedAuthenticatedStorage() {
  localStorage.setItem('info', JSON.stringify(authInfo));
  localStorage.setItem('organs', JSON.stringify({ BR: 'Brain' }));
  localStorage.setItem('organ_icons', JSON.stringify({ BR: 'brain.svg' }));
  localStorage.setItem(
    'organs_full',
    JSON.stringify([
      {
        organ_uberon: 'UBERON:0000955',
        rui_code: 'BR',
        rui_supported: true,
        term: 'Brain',
        uberon_url: 'http://purl.obolibrary.org/obo/UBERON_0000955',
      },
    ])
  );
  localStorage.setItem('RUIOrgans', JSON.stringify(['BR']));
  localStorage.setItem('dataset_types', JSON.stringify(['RNA-seq']));
  localStorage.setItem('userGroups', JSON.stringify(groups));
  localStorage.setItem('allGroups', JSON.stringify(groups));
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function waitFor(predicate) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (predicate()) return;
    await act(async () => {
      await flushPromises();
    });
  }
  throw new Error('Timed out waiting for the migration smoke condition.');
}

async function renderAppAt(path) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <MemoryRouter
        future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
        initialEntries={[path]}
      >
        <App />
      </MemoryRouter>
    );
    await flushPromises();
  });

  return {
    container,
    async unmount() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  seedAuthenticatedStorage();

  globalThis.fetch = vi.fn().mockResolvedValue({
    json: async () => ({}),
    ok: false,
  });

  gateway_api_status.mockResolvedValue({
    status: 200,
    results: {
      entity_api: true,
      ingest_api: true,
      ontology_api: true,
      search_api: true,
    },
  });
  api_validate_token.mockResolvedValue({ status: 200 });
  api_search2.mockResolvedValue({
    status: 200,
    results: [searchRow],
    total: 1,
  });
  ingest_api_user_admin.mockResolvedValue(false);
  ingest_api_users_groups.mockResolvedValue({ status: 200, results: groups });
  ingest_api_all_groups.mockResolvedValue({ status: 200, results: groups });
  ingest_api_all_user_groups.mockResolvedValue({ status: 200, results: groups });
  adminStatusValidation.mockResolvedValue(false);
  ubkg_api_get_organ_type_set.mockResolvedValue({ BR: 'Brain' });
  ubkg_api_get_organs_full.mockResolvedValue([
    {
      organ_uberon: 'UBERON:0000955',
      rui_code: 'BR',
      rui_supported: true,
      term: 'Brain',
      uberon_url: 'http://purl.obolibrary.org/obo/UBERON_0000955',
    },
  ]);
  ubkg_api_get_dataset_type_set.mockResolvedValue(['RNA-seq']);
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

it('renders the unauthenticated application root', async () => {
  localStorage.clear();

  const view = await renderAppAt('/');
  await waitFor(() => view.container.textContent.includes('HuBMAP Data Ingest'));

  expect(view.container.textContent).toContain('HuBMAP Data Ingest');
  expect(view.container.textContent).toContain(
    'Log in with your institutional credentials'
  );

  await view.unmount();
});

it('reads the required migration environment configuration', () => {
  const requiredVariables = [
    import.meta.env.REACT_APP_DATAINGEST_API_URL,
    import.meta.env.REACT_APP_ENTITY_API_URL,
    import.meta.env.REACT_APP_RUI_BASE_URL,
    import.meta.env.REACT_APP_SEARCH_API_URL,
    import.meta.env.REACT_APP_UBKG_API_URL,
    import.meta.env.REACT_APP_URL,
  ];

  requiredVariables.forEach((value) => {
    expect(value).toEqual(expect.any(String));
    expect(value.length).toBeGreaterThan(0);
  });
});

it('resolves the authenticated search route and requests its data', async () => {
  const view = await renderAppAt('/');
  await waitFor(() => api_search2.mock.calls.length > 0);

  expect(view.container.querySelector('input#keywords')).not.toBeNull();
  expect(api_search2).toHaveBeenCalled();

  await view.unmount();
});

it('renders a representative Data Grid with a result row', async () => {
  const container = document.createElement('div');
  container.style.height = '400px';
  container.style.width = '800px';
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <DataGrid
        columns={[
          { field: 'hubmap_id', headerName: 'HuBMAP ID', width: 180 },
          { field: 'entity_type', headerName: 'Entity Type', width: 180 },
        ]}
        rows={[searchRow]}
      />
    );
    await flushPromises();
  });

  expect(container.querySelector('.MuiDataGrid-root')).not.toBeNull();
  expect(container.textContent).toContain(searchRow.hubmap_id);

  await act(async () => {
    root.unmount();
  });
  container.remove();
});

it('renders the app mixed Data Grid columns with computed values', async () => {
  const container = document.createElement('div');
  container.style.height = '400px';
  container.style.width = '1000px';
  document.body.appendChild(container);
  const root = createRoot(container);

  await act(async () => {
    root.render(
      <DataGrid
        columns={COLUMN_DEF_MIXED}
        rows={[searchRow]}
      />
    );
    await flushPromises();
  });

  expect(container.querySelector('.MuiDataGrid-root')).not.toBeNull();
  expect(container.textContent).toContain(searchRow.hubmap_id);
  expect(container.textContent).toContain(searchRow.type);
  expect(container.textContent).toContain('Migration Test Group');

  await act(async () => {
    root.unmount();
  });
  container.remove();
});

it('resolves and mounts the new donor route', async () => {
  const view = await renderAppAt('/new/donor');
  await waitFor(() => view.container.querySelector('input#label'));

  expect(view.container.querySelector('input#label')).not.toBeNull();
  expect(view.container.querySelector('input#protocol_url')).not.toBeNull();

  await view.unmount();
});

it('resolves and mounts the new sample route', async () => {
  const view = await renderAppAt('/new/sample');
  await waitFor(() =>
    view.container.querySelector('input#direct_ancestor_uuid')
  );

  expect(
    view.container.querySelector('input#direct_ancestor_uuid')
  ).not.toBeNull();

  await view.unmount();
});
