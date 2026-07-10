export const PUBLICATION_ACTIONS = {
  revert: "revert",
  cancel: "cancel",
  create: "create",
  process: "process",
  submit: "submit",
  save: "save",
};

const statusFor = (entityData) => (entityData?.status || "").toLowerCase();

const hasExistingUuid = (uuid) => Boolean(uuid && uuid.length > 0);

export function getPublicationActions({ uuid, permissions = {}, entityData = {} }) {
  const status = statusFor(entityData);
  const isExisting = hasExistingUuid(uuid);
  const isPublishedOrRetracted = ["published", "retracted"].includes(status);

  return [
    {
      id: PUBLICATION_ACTIONS.revert,
      label: "Revert",
      visible: isExisting && permissions.has_admin_priv && !isPublishedOrRetracted,
    },
    {
      id: PUBLICATION_ACTIONS.cancel,
      label: "Cancel",
      visible: true,
    },
    {
      id: PUBLICATION_ACTIONS.create,
      label: "Save",
      visible: !isExisting,
    },
    {
      id: PUBLICATION_ACTIONS.process,
      label: "Process",
      visible: isExisting && permissions.has_admin_priv && !isPublishedOrRetracted,
    },
    {
      id: PUBLICATION_ACTIONS.submit,
      label: "Submit",
      visible: isExisting && permissions.has_write_priv && status === "new",
    },
    {
      id: PUBLICATION_ACTIONS.save,
      label: "Save",
      visible: isExisting && permissions.has_write_priv && !isPublishedOrRetracted,
    },
  ].filter((action) => action.visible);
}
