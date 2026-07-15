import { describe, expect, it } from "vitest";

import { DOI_COLLECTION_ACTIONS, getDoiCollectionActions } from "../../components/formActionRules/doiCollectionActionRules";

const actionSummary = (context) => (
  getDoiCollectionActions(context).map(({ id, label, disabled }) => ({ id, label, disabled }))
);

describe("getDoiCollectionActions", () => {
  it("shows Cancel and enabled Save for writable create mode", () => {
    expect(actionSummary({
      uuid: undefined,
      permissions: { has_write_priv: true, has_admin_priv: false },
      entityData: {},
    })).toEqual([
      { id: DOI_COLLECTION_ACTIONS.cancel, label: "Cancel", disabled: undefined },
      { id: DOI_COLLECTION_ACTIONS.save, label: "Save", disabled: false },
    ]);
  });

  it("disables Save when write permission is missing", () => {
    expect(actionSummary({
      uuid: "collection-readonly",
      permissions: { has_write_priv: false, has_admin_priv: false },
      entityData: {},
    })).toEqual([
      { id: DOI_COLLECTION_ACTIONS.cancel, label: "Cancel", disabled: undefined },
      { id: DOI_COLLECTION_ACTIONS.save, label: "Save", disabled: true },
    ]);
  });

  it("shows Publish for existing admin collections", () => {
    expect(actionSummary({
      uuid: "collection-admin",
      permissions: { has_write_priv: true, has_admin_priv: true },
      entityData: {},
    })).toEqual([
      { id: DOI_COLLECTION_ACTIONS.cancel, label: "Cancel", disabled: undefined },
      { id: DOI_COLLECTION_ACTIONS.save, label: "Save", disabled: false },
      { id: DOI_COLLECTION_ACTIONS.publish, label: "Publish", disabled: false },
    ]);
  });

  it("disables Publish when a DOI already exists", () => {
    expect(actionSummary({
      uuid: "collection-doi",
      permissions: { has_write_priv: false, has_admin_priv: true },
      entityData: { registered_doi: "10.123/example" },
    })).toEqual([
      { id: DOI_COLLECTION_ACTIONS.cancel, label: "Cancel", disabled: undefined },
      { id: DOI_COLLECTION_ACTIONS.save, label: "Save", disabled: true },
      { id: DOI_COLLECTION_ACTIONS.publish, label: "Publish", disabled: true },
    ]);
  });
});
