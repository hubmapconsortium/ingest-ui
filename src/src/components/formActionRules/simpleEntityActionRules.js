export const SIMPLE_ENTITY_ACTIONS = {
  cancel: "cancel",
  create: "create",
  update: "update",
};

const hasExistingUuid = (uuid) => Boolean(uuid && uuid.length > 0);

export function getSimpleEntityActions({ uuid, permissions = {} }) {
  const isExisting = hasExistingUuid(uuid);

  return [
    {
      id: SIMPLE_ENTITY_ACTIONS.cancel,
      label: "Cancel",
      visible: true,
    },
    {
      id: SIMPLE_ENTITY_ACTIONS.create,
      label: "Generate ID",
      visible: !isExisting,
    },
    {
      id: SIMPLE_ENTITY_ACTIONS.update,
      label: "Update",
      visible: isExisting && permissions.has_write_priv,
    },
  ].filter((action) => action.visible);
}
