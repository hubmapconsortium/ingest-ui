
// These ones show on the main Search/Filter page
// export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
export const SAMPLE_TYPES = [
  { donor: "Donor" },
  { sample: "Sample"},
  { dataset: "Dataset"}, 
  { uploads: "Data Upload"},
  { organ: "Organ"},
  {
    biopsy: "Biopsy",
    cell_lysate: "Cell lysate",
    ffpe_block: "FFPE block",
    pfa_fixed_frozen_oct_block: "PFA Fixed frozen OCT block",
    fixed_tissue_piece: "Fixed tissue piece",
    flash_frozen_liquid_nitrogen: "Flash frozen, liquid nitrogen",
    formalin_fixed_oct_block: "Formalin fixed OCT block",
    fresh_frozen_tissue: "Fresh frozen tissue",
    fresh_frozen_oct_block: "Fresh frozen oct block",
    fresh_tissue: "Fresh tissue",
    frozen_cell_pellet_buffy_coat: "Frozen cell pellet (Buffy coat)",
    module: "Module",
    pbmc: "PBMC",
    plasma: "Plasma",
    nuclei_rnalater: "Nuclei RNAlater",
    organ_piece: "Organ Piece",
    rnalater_treated_and_stored: "RNAlater treated and stored",
    segment: "Segment",
    serum: "Serum",
    single_cell_cryopreserved: "Single cell cryopreserved",
    tissue_lysate: "Tissue lysate"
  },
  {
    clarity_hydrogel: "CLARITY hydrogel",
    cryosections_curls_from_fresh_frozen_oct:
      "Cryosections/curls from fresh frozen OCT",
    cryosections_curls_rnalater: "Cryosectinos/curls RNAlater",
    ffpe_slide: "FFPE slide",
    fixed_frozen_section_slide: "Fixed Frozen section slide",
    fresh_frozen_section_slide: "Fresh Frozen section slide",
    fresh_frozen_tissue_section: "Fresh Frozen Tissue Section"
  },
  {
    gdna: "gDNA",
    nuclei: "Nuclei",
    protein: "Protein",
    rna_total: "RNA, total",
    ran_poly_a_enriched: "RNA, poly-A enriched",
    sequence_library:"Sequence Library"
  },
  { other: "Other" }
];

// These ones show on the Create new Donor/Sample page
export const TISSUE_TYPES = {
   Donor: [{ 
    organ: "Organ"
  }],
   Sample: [{
    biopsy: "Biopsy",
    cell_lysate: "Cell lysate",
    ffpe_block: "FFPE block",
    pfa_fixed_frozen_oct_block: "PFA Fixed frozen OCT block",
    fixed_tissue_piece: "Fixed tissue piece",
    flash_frozen_liquid_nitrogen: "Flash frozen, liquid nitrogen",
    formalin_fixed_oct_block: "Formalin fixed OCT block",
    fresh_frozen_tissue: "Fresh frozen tissue",
    fresh_frozen_oct_block: "Fresh frozen oct block",
    fresh_tissue: "Fresh tissue",
    frozen_cell_pellet_buffy_coat: "Frozen cell pellet (Buffy coat)",
    module: "Module",
    pbmc: "PBMC",
    plasma: "Plasma",
    nuclei_rnalater: "Nuclei RNAlater",
    organ_piece: "Organ Piece",
    rnalater_treated_and_stored: "RNAlater treated and stored",
    segment: "Segment",
    serum: "Serum",
    single_cell_cryopreserved: "Single cell cryopreserved",
    tissue_lysate: "Tissue lysate",
  },{
    clarity_hydrogel: "CLARITY hydrogel",
    cryosections_curls_from_fresh_frozen_oct:
      "Cryosections/curls from fresh frozen OCT",
    cryosections_curls_rnalater: "Cryosectinos/curls RNAlater",
    ffpe_slide: "FFPE slide",
    fixed_frozen_section_slide: "Fixed Frozen section slide",
    fresh_frozen_section_slide: "Fresh Frozen section slide",
    fresh_frozen_tissue_section: "Fresh Frozen Tissue Section"
  },{
    gdna: "gDNA",
    nuclei: "Nuclei",
    protein: "Protein",
    rna_total: "RNA, total",
    ran_poly_a_enriched: "RNA, poly-A enriched",
    sequence_library:"Sequence Library"
  },{
    other: "Other" }]
};

export const ORGAN_TYPES = {
  AO: "Aorta",
  BL: "Bladder",
  BD: "Blood",
  BM: "Bone Marrow",
  BR: "Brain",
  LB: "Bronchus (Left)",
  RB: "Bronchus (Right)",
  LE: "Eye (Left)",
  RE: "Eye (Right)",
  LF: "Fallopian Tube (Left)",
  RF: "Fallopian Tube (Right)",
  HT: "Heart",
  LK: "Kidney (Left)",
  RK: "Kidney (Right)",
  LI: "Large Intestine",
  LV: "Liver",
  LL: "Lung (Left)",
  LN: "Knee (Left)",
  RL: "Lung (Right)",
  RN: "Knee (Right)",
  LY: "Lymph Node",
  LO: "Ovary (Left)",
  RO: "Ovary (Right)",
  PA: "Pancreas",
  PL: "Placenta",
  SI: "Small Intestine",
  SK: "Skin",
  SP: "Spleen",
  ST: "Sternum",
  TH: "Thymus",
  TR: "Trachea",
  UR: "Ureter",
  UT: "Uterus",
  OT: "Other"
};

// Direct mapping from HuBMAP Organ Code to appropriate RUI Reference Organ IRIs
export const RUI_ORGAN_MAPPING = {
  AO: "http://purl.obolibrary.org/obo/UBERON_0000948",
  BL: "http://purl.obolibrary.org/obo/UBERON_0001255",
  BD: "http://purl.obolibrary.org/obo/UBERON_0001270",
  BM: "http://purl.obolibrary.org/obo/UBERON_0001270",
  BR: "http://purl.obolibrary.org/obo/UBERON_0000955",
  LB: "http://purl.obolibrary.org/obo/UBERON_0001004",
  RB: "http://purl.obolibrary.org/obo/UBERON_0001004",
  LE: "http://purl.obolibrary.org/obo/UBERON_0004548",
  RE: "http://purl.obolibrary.org/obo/FMA_54449",
  LF: "http://purl.obolibrary.org/obo/UBERON_0001303",
  RF: "http://purl.obolibrary.org/obo/UBERON_0001302",
  HT: "http://purl.obolibrary.org/obo/UBERON_0000948",
  LK: "http://purl.obolibrary.org/obo/UBERON_0004538",
  RK: "http://purl.obolibrary.org/obo/UBERON_0004539",
  LI: "http://purl.obolibrary.org/obo/UBERON_0000059",
  LV: "http://purl.obolibrary.org/obo/UBERON_0002107",
  LL: "http://purl.obolibrary.org/obo/UBERON_0001004",
  LN: "http://purl.obolibrary.org/obo/FMA_24978",
  RL: "http://purl.obolibrary.org/obo/UBERON_0001004",
  RN: "http://purl.obolibrary.org/obo/FMA_24977",
  LY: "http://purl.obolibrary.org/obo/UBERON_0002509",
  LO: "http://purl.obolibrary.org/obo/FMA_7214",
  RO: "http://purl.obolibrary.org/obo/FMA_7213",
  PA: "http://purl.obolibrary.org/obo/UBERON_0001264",
  // PL: "", // No CCF Reference Organ for Placenta yet
  SI: "http://purl.obolibrary.org/obo/UBERON_0002108",
  SK: "http://purl.obolibrary.org/obo/UBERON_0002097",
  SP: "http://purl.obolibrary.org/obo/UBERON_0002106",
  // ST: "", // No CCF Reference Organ for Sternum yet
  TH: "http://purl.obolibrary.org/obo/UBERON_0002370",
  TR: "http://purl.obolibrary.org/obo/UBERON_0001004",
  UR: "http://purl.obolibrary.org/obo/UBERON_0001223",
  UT: "http://purl.obolibrary.org/obo/UBERON_0000995",
  // OT: "" // No CCF Reference Organ for 'Other' ever
};

export const RUI_ORGAN_TYPES = Object.keys(RUI_ORGAN_MAPPING);

export const EXCLUDE_USER_GROUPS = ["2cf25858-ed44-11e8-991d-0e368f3075e8", "5777527e-ec11-11e8-ab41-0af86edb4424"];

// this is a list of fields for the keyword search.  note: must ID fields need to use .keyword
export const ES_SEARCHABLE_FIELDS = [
  "description.keyword", 
  "hubmap_id.keyword", 
  "submission_id.keyword",
  "display_doi.keyword", 
  "lab_donor_id.keyword", 
  "display_subtype.keyword",
  "lab_name.keyword",
  "lab_tissue_sample_id.keyword",
  "lab_donor_id.keyword",
  "lab_dataset_id.keyword",
  "created_by_user_displayname", 
  "created_by_user_email",
  "dataset_info"
  ];

// this list is for wildcard searchable fields
export const ES_SEARCHABLE_WILDCARDS = [
  "submission_id", 
  "hubmap_id",
  "lab_donor_id", 
  "lab_name",
  "lab_tissue_sample_id",
  "lab_dataset_id"
  ];
