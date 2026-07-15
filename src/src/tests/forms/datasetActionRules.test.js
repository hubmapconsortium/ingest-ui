import { describe, expect, it } from "vitest";

import { DATASET_ACTIONS, getDatasetActions } from "../../components/formActionRules/datasetActionRules";

const basePermissions = {
  has_admin_priv: false,
  has_pipeline_testing_priv: false,
  has_write_priv: false,
};

const dataset = (overrides = {}) => ({
  status: "New",
  isPrimary: true,
  isEpic: false,
  ...overrides,
});

const actionSummary = (context) => (
  getDatasetActions(context).map(({ id, label }) => ({ id, label }))
);

describe("getDatasetActions", () => {
  it("shows create Save and Cancel for a new dataset", () => {
    expect(actionSummary({
      uuid: undefined,
      permissions: { ...basePermissions, has_write_priv: true },
      entityData: {},
    })).toEqual([
      { id: DATASET_ACTIONS.create, label: "Save" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });

  it("shows every eligible action for a new primary dataset with admin, write, and testing permissions", () => {
    expect(actionSummary({
      uuid: "dataset-new",
      permissions: {
        ...basePermissions,
        has_admin_priv: true,
        has_pipeline_testing_priv: true,
        has_write_priv: true,
      },
      entityData: dataset(),
    })).toEqual([
      { id: DATASET_ACTIONS.revert, label: "Revert" },
      { id: DATASET_ACTIONS.process, label: "Process" },
      { id: DATASET_ACTIONS.submitForTesting, label: "Submit for Testing" },
      { id: DATASET_ACTIONS.submit, label: "Submit" },
      { id: DATASET_ACTIONS.validate, label: "Validate" },
      { id: DATASET_ACTIONS.save, label: "Save" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });

  it("keeps published and retracted datasets to testing submission and Cancel when pipeline testing is allowed", () => {
    ["Published", "Retracted"].forEach((status) => {
      expect(actionSummary({
        uuid: `dataset-${status.toLowerCase()}`,
        permissions: {
          ...basePermissions,
          has_admin_priv: true,
          has_pipeline_testing_priv: true,
          has_write_priv: false,
        },
        entityData: dataset({ status }),
      })).toEqual([
        { id: DATASET_ACTIONS.submitForTesting, label: "Submit for Testing" },
        { id: DATASET_ACTIONS.cancel, label: "Cancel" },
      ]);
    });
  });

  it("allows admin override Save for QA and Approval datasets", () => {
    ["QA", "Approval"].forEach((status) => {
      expect(actionSummary({
        uuid: `dataset-${status.toLowerCase()}`,
        permissions: {
          ...basePermissions,
          has_admin_priv: true,
          has_pipeline_testing_priv: true,
          has_write_priv: false,
        },
        entityData: dataset({ status }),
      })).toEqual([
        { id: DATASET_ACTIONS.revert, label: "Revert" },
        { id: DATASET_ACTIONS.submitForTesting, label: "Submit for Testing" },
        { id: DATASET_ACTIONS.validate, label: "Validate" },
        { id: DATASET_ACTIONS.save, label: "Save" },
        { id: DATASET_ACTIONS.cancel, label: "Cancel" },
      ]);
    });
  });

  it("hides testing submission, Validate, and Save for a processing dataset without write access", () => {
    expect(actionSummary({
      uuid: "dataset-processing",
      permissions: {
        ...basePermissions,
        has_admin_priv: true,
        has_pipeline_testing_priv: true,
      },
      entityData: dataset({ status: "Processing" }),
    })).toEqual([
      { id: DATASET_ACTIONS.revert, label: "Revert" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });

  it("keeps process and testing submission hidden for component datasets", () => {
    expect(actionSummary({
      uuid: "dataset-component",
      permissions: {
        ...basePermissions,
        has_admin_priv: true,
        has_write_priv: true,
        has_pipeline_testing_priv: true,
      },
      entityData: dataset({ isPrimary: false, isEpic: false }),
    })).toEqual([
      { id: DATASET_ACTIONS.revert, label: "Revert" },
      { id: DATASET_ACTIONS.submit, label: "Submit" },
      { id: DATASET_ACTIONS.validate, label: "Validate" },
      { id: DATASET_ACTIONS.save, label: "Save" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });

  it("allows pipeline-testing-only users to submit eligible primary datasets for testing", () => {
    expect(actionSummary({
      uuid: "dataset-error",
      permissions: {
        ...basePermissions,
        has_pipeline_testing_priv: true,
      },
      entityData: dataset({ status: "Error" }),
    })).toEqual([
      { id: DATASET_ACTIONS.submitForTesting, label: "Submit for Testing" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });

  it("shows Submit and Save for write-only New datasets", () => {
    expect(actionSummary({
      uuid: "dataset-write-only",
      permissions: {
        ...basePermissions,
        has_write_priv: true,
      },
      entityData: dataset(),
    })).toEqual([
      { id: DATASET_ACTIONS.submit, label: "Submit" },
      { id: DATASET_ACTIONS.save, label: "Save" },
      { id: DATASET_ACTIONS.cancel, label: "Cancel" },
    ]);
  });
});
