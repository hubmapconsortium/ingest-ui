// Lightweight localStorage helpers used across the app.
// getItem tries to parse JSON and falls back to raw string when not JSON.
import { ubkg_api_get_organ_type_set, ubkg_api_get_organs_full, ubkg_api_get_dataset_type_set } from './ubkg_api';
import { ingest_api_users_groups, ingest_api_all_groups } from './ingest_api';
import { OrganDetails } from '../components/ui/icons';
export function getItem(key) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw);
    } catch (err) {
      return raw;
    }
  } catch (err) {
    console.debug('local_storage.getItem error', err);
    return null;
  }
}

export function setItem(key, value) {
  try {
    if (typeof value === 'string') {
      window.localStorage.setItem(key, value);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
    return true;
  } catch (err) {
    console.debug('local_storage.setItem error', err);
    return false;
  }
}

export function removeItem(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.debug('local_storage.removeItem error', err);
    return false;
  }
}

export function removeItems(keys) {
  try {
    for (const k of keys) {
      window.localStorage.removeItem(k);
    }
    return true;
  } catch (err) {
    console.debug('local_storage.removeItems error', err);
    return false;
  }
}

export function ensureMenuMap(defaultMap) {
  try {
    const existing = getItem('menuMap');
    if (!existing) {
      setItem('menuMap', defaultMap);
      return defaultMap;
    }
    return existing;
  } catch (err) {
    console.debug('local_storage.ensureMenuMap error', err);
    setItem('menuMap', defaultMap);
    return defaultMap;
  }
}

// Ensure organs (and organ icons) exist in local storage. Calls loadCountCb() after successful set if provided.
export async function ensureOrgansCached(loadCountCb) {
  try {
    const organs = getItem('organs');
    const organIcons = getItem('organ_icons');
    if (!organs || !organIcons) {
      const res = await ubkg_api_get_organ_type_set();
      // save organ icons from UI helper
      try {
        const icons = OrganDetails();
        setItem('organ_icons', icons);
      } catch (e) {
        // ignore icon generation errors
        console.debug('OrganDetails error', e);
      }
      if (res !== undefined) {
        setItem('organs', res);
      }
      if (typeof loadCountCb === 'function') loadCountCb();
      return res;
    }
    if (typeof loadCountCb === 'function') loadCountCb();
    return organs;
  } catch (err) {
    console.debug('ensureOrgansCached error', err);
    throw err;
  }
}

export async function ensureOrgansFullCached(loadCountCb) {
  try {
    const organsFull = getItem('organs_full');
    if (!organsFull) {
      const data = await ubkg_api_get_organs_full();
      setItem('organs_full', data);
      const RUIOrgans = Array.isArray(data) ? data.filter(o => o.rui_supported).map(o => o.rui_code) : [];
      setItem('RUIOrgans', RUIOrgans);
      if (typeof loadCountCb === 'function') loadCountCb();
      return data;
    }
    if (typeof loadCountCb === 'function') loadCountCb();
    return organsFull;
  } catch (err) {
    console.debug('ensureOrgansFullCached error', err);
    throw err;
  }
}

export async function ensureDatasetTypesCached(loadCountCb) {
  try {
    const dt = getItem('dataset_types');
    if (!dt) {
      const res = await ubkg_api_get_dataset_type_set();
      if (res !== undefined) setItem('dataset_types', res);
      if (typeof loadCountCb === 'function') loadCountCb();
      return res;
    }
    if (typeof loadCountCb === 'function') loadCountCb();
    return dt;
  } catch (err) {
    console.debug('ensureDatasetTypesCached error', err);
    throw err;
  }
}

export async function ensureUserGroupsCached(loadCountCb) {
  try {
    const existing = getItem('userGroups');
    if (!existing || existing === 'Non-active login') {
      const res = await ingest_api_users_groups();
      if (res && res.status === 200) {
        setItem('userGroups', res.results);
      }
      if (typeof loadCountCb === 'function') loadCountCb();
      return res;
    }
    if (typeof loadCountCb === 'function') loadCountCb();
    return existing;
  } catch (err) {
    console.debug('ensureUserGroupsCached error', err);
    throw err;
  }
}

export async function ensureAllGroupsCached(loadCountCb) {
  try {
    const existing = getItem('allGroups');
    if (!existing) {
      const res = await ingest_api_all_groups();
      if (res && res.results) {
        const allGroups = typeof res.results === 'string' ? [] : res.results;
        setItem('allGroups', allGroups);
        if (typeof loadCountCb === 'function') loadCountCb();
        return allGroups;
      }
    }
    if (typeof loadCountCb === 'function') loadCountCb();
    return existing;
  } catch (err) {
    console.debug('ensureAllGroupsCached error', err);
    throw err;
  }
}

// Initialize a common set of local cache entries used by the app.
export async function initLocalCache(loadCountCb) {
  // ensure menu map default
  ensureMenuMap({
    datasetadmin : {blackList :  ["collection","epicollection"]},
    publication: {whiteList: ["dataset"]},
    collection: {whiteList: ["dataset"]},
    epicollection: {whiteList: ["dataset"]},
    sample: {blackList: ['collection','epicollection',"dataset","upload","publication"]},
  });

  // Run ensures in parallel but call loadCountCb when each resolves
  const tasks = [
    ensureOrgansCached(loadCountCb),
    ensureOrgansFullCached(loadCountCb),
    ensureDatasetTypesCached(loadCountCb),
    ensureUserGroupsCached(loadCountCb),
    ensureAllGroupsCached(loadCountCb),
  ];
  return Promise.all(tasks);
}
