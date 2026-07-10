import { describe, expect, it } from "vitest";

import { PUBLICATION_ACTIONS, getPublicationActions } from "../../components/formActionRules/publicationActionRules";

const actionSummary = (context) => (
  getPublicationActions(context).map(({ id, label }) => ({ id, label }))
);

describe("getPublicationActions", () => {
  it("shows Cancel and create Save for a new publication", () => {
    expect(actionSummary({
      uuid: undefined,
      permissions: { has_write_priv: true, has_admin_priv: false },
      entityData: {},
    })).toEqual([
      { id: PUBLICATION_ACTIONS.cancel, label: "Cancel" },
      { id: PUBLICATION_ACTIONS.create, label: "Save" },
    ]);
  });

  it("shows all editable admin actions for a new-status publication", () => {
    expect(actionSummary({
      uuid: "publication-new",
      permissions: { has_write_priv: true, has_admin_priv: true },
      entityData: { status: "New" },
    })).toEqual([
      { id: PUBLICATION_ACTIONS.revert, label: "Revert" },
      { id: PUBLICATION_ACTIONS.cancel, label: "Cancel" },
      { id: PUBLICATION_ACTIONS.process, label: "Process" },
      { id: PUBLICATION_ACTIONS.submit, label: "Submit" },
      { id: PUBLICATION_ACTIONS.save, label: "Save" },
    ]);
  });

  it("hides edit actions for published or retracted publications", () => {
    ["Published", "Retracted"].forEach((status) => {
      expect(actionSummary({
        uuid: `publication-${status.toLowerCase()}`,
        permissions: { has_write_priv: true, has_admin_priv: true },
        entityData: { status },
      })).toEqual([
        { id: PUBLICATION_ACTIONS.cancel, label: "Cancel" },
      ]);
    });
  });

  it("shows only admin Process and Revert plus Cancel without write permission", () => {
    expect(actionSummary({
      uuid: "publication-admin-only",
      permissions: { has_write_priv: false, has_admin_priv: true },
      entityData: { status: "Invalid" },
    })).toEqual([
      { id: PUBLICATION_ACTIONS.revert, label: "Revert" },
      { id: PUBLICATION_ACTIONS.cancel, label: "Cancel" },
      { id: PUBLICATION_ACTIONS.process, label: "Process" },
    ]);
  });
});
