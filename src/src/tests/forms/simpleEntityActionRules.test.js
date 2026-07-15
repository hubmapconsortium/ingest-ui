import { describe, expect, it } from "vitest";

import { SIMPLE_ENTITY_ACTIONS, getSimpleEntityActions } from "../../components/formActionRules/simpleEntityActionRules";

const actionSummary = (context) => (
  getSimpleEntityActions(context).map(({ id, label }) => ({ id, label }))
);

describe("getSimpleEntityActions", () => {
  it("shows Cancel and Generate ID in create mode", () => {
    expect(actionSummary({
      uuid: undefined,
      permissions: { has_write_priv: true },
    })).toEqual([
      { id: SIMPLE_ENTITY_ACTIONS.cancel, label: "Cancel" },
      { id: SIMPLE_ENTITY_ACTIONS.create, label: "Generate ID" },
    ]);
  });

  it("shows Update for existing writable entities", () => {
    expect(actionSummary({
      uuid: "entity-existing",
      permissions: { has_write_priv: true },
    })).toEqual([
      { id: SIMPLE_ENTITY_ACTIONS.cancel, label: "Cancel" },
      { id: SIMPLE_ENTITY_ACTIONS.update, label: "Update" },
    ]);
  });

  it("hides Update for existing read-only entities", () => {
    expect(actionSummary({
      uuid: "entity-existing",
      permissions: { has_write_priv: false },
    })).toEqual([
      { id: SIMPLE_ENTITY_ACTIONS.cancel, label: "Cancel" },
    ]);
  });
});
