export const UPLOAD_ACTIONS = {
  cancel: "cancel",
  create: "create",
  revert: "revert",
  submit: "submit",
  reorganize: "reorganize",
  validate: "validate",
  save: "save",
};

export const UPLOAD_SAVE_STATUSES = ["submitted", "valid", "invalid", "incomplete", "error", "new"];
export const UPLOAD_VALIDATE_RESTRICTIONS = ["reorganized", "processing"];

const statusFor = (entityData) => (entityData?.status || "").toLowerCase();

const hasExistingUuid = (uuid) => Boolean(uuid && uuid.length > 0);

const canSaveUpload = ({ status, permissions = {}, saveStatuses = UPLOAD_SAVE_STATUSES }) => (
  saveStatuses.includes(status) && (permissions.has_write_priv === true || permissions.has_admin_priv === true)
);

export function getUploadActions({
  uuid,
  permissions = {},
  entityData = {},
  saveStatuses = UPLOAD_SAVE_STATUSES,
  validateRestrictions = UPLOAD_VALIDATE_RESTRICTIONS,
}) {
  const status = statusFor(entityData);
  const isExisting = hasExistingUuid(uuid);

  return [
    {
      id: UPLOAD_ACTIONS.cancel,
      label: "Cancel",
      visible: true,
    },
    {
      id: UPLOAD_ACTIONS.create,
      label: "Generate ID",
      visible: !isExisting,
    },
    {
      id: UPLOAD_ACTIONS.revert,
      label: "Revert",
      visible: isExisting && permissions.has_admin_priv,
    },
    {
      id: UPLOAD_ACTIONS.submit,
      label: "Submit",
      visible: isExisting
        && (permissions.has_write_priv || permissions.has_admin_priv)
        && status !== "reorganized"
        && status !== "submitted",
    },
    {
      id: UPLOAD_ACTIONS.reorganize,
      label: "Reorganize",
      visible: isExisting && permissions.has_admin_priv && status === "submitted",
    },
    {
      id: UPLOAD_ACTIONS.validate,
      label: "Validate",
      visible: isExisting && permissions.has_admin_priv && Boolean(status) && !validateRestrictions.includes(status),
    },
    {
      id: UPLOAD_ACTIONS.save,
      label: "Save",
      visible: isExisting && canSaveUpload({ status, permissions, saveStatuses }),
      disabled: false,
    },
  ].filter((action) => action.visible);
}
