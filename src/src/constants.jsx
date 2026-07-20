
// These ones show on the main Search/Filter page
export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
export const ENTITY_TYPES = { // Use this instead of Types
  donor: "Donor" ,
  sample: "Sample",
  dataset: "Dataset", 
  upload: "Data Upload",
  publication: "Publication",
  collection: "Collection"
}

export const SAMPLE_TYPES = [ // Move requests for this into categories
{ organ: "Organ" },
{ block: "Block"},
{ section: "Section"}, 
{ suspension: "Suspension"},
]
export const SAMPLE_CATEGORIES = { // Use this instead of Types
   organ: "Organ",
   block: "Block",
   section: "Section", 
   suspension: "Suspension",
}

// Deprecated but the old Tissue form still yerns for it till I Purge the Old Forms/Files
export const RUI_ORGAN_TYPES = JSON.parse(localStorage.getItem("RUIOrgans"));

export const EXCLUDE_USER_GROUPS = ["2cf25858-ed44-11e8-991d-0e368f3075e8", "5777527e-ec11-11e8-ab41-0af86edb4424"];

// this is a list of fields for the keyword search.  note: must ID fields need to use .keyword
export const ES_SEARCHABLE_FIELDS = [
  "computed_lab_id_type.keyword",
  "created_by_user_displayname",
  "created_by_user_email",
  "creation_action",
  "data_access_level",
  "dataset_info.keyword",
  "dataset_type.keyword",
  "datasets.group_uuid", 
  "description.keyword", 
  "display_doi.keyword", 
  "display_subtype.keyword",
  "doi_url.keyword",
  "entity_type",
  "group_name.keyword",
  "hubmap_id.keyword", 
  "lab_dataset_id.keyword",
  "lab_donor_id.keyword", 
  "lab_name.keyword",
  "lab_tissue_sample_id.keyword",
  "organ.keyword",
  "registered_doi.keyword",
  "sample_category.keyword",
  "status.keyword",
  "statusAccess.keyword",
  "submission_id.keyword",
  "title.keyword",
  "type",
  "uuid",
];

// this list is for wildcard searchable fields
export const ES_SEARCHABLE_WILDCARDS = [
  "computed_lab_id_type.keyword",
  "created_by_user_displayname",
  "created_by_user_email",
  "data_access_level",
  "dataset_info.keyword",
  "dataset_type.keyword",
  "datasets.group_uuid", 
  "description.keyword", 
  "display_doi.keyword", 
  "display_subtype.keyword",
  "doi_url.keyword",
  "entity_type",
  "group_name.keyword",
  "hubmap_id.keyword", 
  "lab_dataset_id.keyword",
  "lab_donor_id.keyword", 
  "lab_name.keyword",
  "lab_tissue_sample_id.keyword",
  "organ.keyword",
  "registered_doi.keyword",
  "sample_category.keyword",
  "status",
  "statusAccess",
  "submission_id.keyword",
  "title.keyword",
  "type",
  "uuid",

  ];
