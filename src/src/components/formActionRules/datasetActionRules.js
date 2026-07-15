export const DATASET_ACTIONS = {
  create: "create",
  revert: "revert",
  process: "process",
  submitForTesting: "submitForTesting",
  submit: "submit",
  validate: "validate",
  save: "save",
  cancel: "cancel",
};

const statusFor = (entityData) => (entityData?.status || "").toLowerCase();

const hasExistingUuid = (uuid) => Boolean(uuid && uuid.length > 0);

const isPrimaryOrEpic = (entityData) => Boolean(entityData?.isPrimary || entityData?.isEpic);

export function getDatasetActions({ uuid, permissions = {}, entityData = {} }) {
  const status = statusFor(entityData);
  const isExisting = hasExistingUuid(uuid);

  return [
    {
      id: DATASET_ACTIONS.create,
      label: "Save",
      visible: !isExisting,
    },
    {
      id: DATASET_ACTIONS.revert,
      label: "Revert",
      visible: isExisting && permissions.has_admin_priv && !["published", "retracted"].includes(status),
    },
    {
      id: DATASET_ACTIONS.process,
      label: "Process",
      visible: isExisting
        && permissions.has_admin_priv
        && ["new", "submitted"].includes(status)
        && isPrimaryOrEpic(entityData),
    },
    {
      id: DATASET_ACTIONS.submitForTesting,
      label: "Submit for Testing",
      visible: isExisting
        &&( permissions.has_pipeline_testing_priv || permissions.has_admin_priv)
        && isPrimaryOrEpic(entityData)
        && ["new", "invalid", "error", "submitted", "published", "retracted", "qa", "approval"].includes(status),
    },
    {
      id: DATASET_ACTIONS.submit,
      label: "Submit",
      visible: isExisting && permissions.has_write_priv && status === "new",
    },
    {
      id: DATASET_ACTIONS.validate,
      label: "Validate",
      visible: isExisting
        && permissions.has_admin_priv
        && !["published", "retracted", "processing"].includes(status),
    },
    {
      id: DATASET_ACTIONS.save,
      label: "Save",
      visible: isExisting
        && (
          (
            permissions.has_write_priv
            && !["published", "retracted", "qa", "approval"].includes(status)
          )
          || (
            permissions.has_admin_priv
            && ["qa", "approval"].includes(status)
          )
        ),
    },
    {
      id: DATASET_ACTIONS.cancel,
      label: "Cancel",
      visible: true,
    },
  ].filter((action) => action.visible);
}
