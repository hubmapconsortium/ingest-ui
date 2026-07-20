import { describe, expect, it } from "vitest";

import { UPLOAD_ACTIONS, getUploadActions } from "../../components/formActionRules/uploadActionRules";

const actionSummary = (context) => (
  getUploadActions(context).map(({ id, label }) => ({ id, label }))
);

describe("getUploadActions", () => {
  it("shows Cancel and Generate ID in create mode", () => {
    expect(actionSummary({
      uuid: undefined,
      permissions: { has_write_priv: true, has_admin_priv: false },
      entityData: {},
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
      { id: UPLOAD_ACTIONS.create, label: "Generate ID" },
    ]);
  });

  it("shows Submit and Save for writable new uploads", () => {
    expect(actionSummary({
      uuid: "upload-new",
      permissions: { has_write_priv: true, has_admin_priv: false },
      entityData: { status: "New" },
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
      { id: UPLOAD_ACTIONS.submit, label: "Submit" },
      { id: UPLOAD_ACTIONS.save, label: "Save" },
    ]);
  });

  it("shows Revert, Submit, Validate, and Save for admin new uploads", () => {
    expect(actionSummary({
      uuid: "upload-admin",
      permissions: { has_write_priv: false, has_admin_priv: true },
      entityData: { status: "New" },
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
      { id: UPLOAD_ACTIONS.revert, label: "Revert" },
      { id: UPLOAD_ACTIONS.submit, label: "Submit" },
      { id: UPLOAD_ACTIONS.validate, label: "Validate" },
      { id: UPLOAD_ACTIONS.save, label: "Save" },
    ]);
  });

  it("shows Reorganize instead of Submit for submitted admin uploads", () => {
    expect(actionSummary({
      uuid: "upload-submitted",
      permissions: { has_write_priv: true, has_admin_priv: true },
      entityData: { status: "Submitted" },
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
      { id: UPLOAD_ACTIONS.revert, label: "Revert" },
      { id: UPLOAD_ACTIONS.reorganize, label: "Reorganize" },
      { id: UPLOAD_ACTIONS.validate, label: "Validate" },
      { id: UPLOAD_ACTIONS.save, label: "Save" },
    ]);
  });

  it("hides Validate and Save for processing uploads", () => {
    expect(actionSummary({
      uuid: "upload-processing",
      permissions: { has_write_priv: false, has_admin_priv: true },
      entityData: { status: "Processing" },
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
      { id: UPLOAD_ACTIONS.revert, label: "Revert" },
      { id: UPLOAD_ACTIONS.submit, label: "Submit" },
    ]);
  });

  it("shows only Cancel for existing read-only uploads", () => {
    expect(actionSummary({
      uuid: "upload-readonly",
      permissions: { has_write_priv: false, has_admin_priv: false },
      entityData: { status: "New" },
    })).toEqual([
      { id: UPLOAD_ACTIONS.cancel, label: "Cancel" },
    ]);
  });
});
