export const DOI_COLLECTION_ACTIONS = {
  cancel: "cancel",
  save: "save",
  publish: "publish",
};

const hasExistingUuid = (uuid) => Boolean(uuid && uuid.length > 0);

const hasRegisteredDoi = (entityData = {}) => Boolean(entityData.doi_url || entityData.registered_doi);

export function getDoiCollectionActions({ uuid, permissions = {}, entityData = {} }) {
  return [
    {
      id: DOI_COLLECTION_ACTIONS.cancel,
      label: "Cancel",
      visible: true,
    },
    {
      id: DOI_COLLECTION_ACTIONS.save,
      label: "Save",
      visible: true,
      disabled: !permissions.has_write_priv,
    },
    {
      id: DOI_COLLECTION_ACTIONS.publish,
      label: "Publish",
      visible: permissions.has_admin_priv && hasExistingUuid(uuid),
      disabled: hasRegisteredDoi(entityData),
    },
  ].filter((action) => action.visible);
}
