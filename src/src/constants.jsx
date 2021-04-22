
// These ones show on the main Search/Filter page
export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
export const SAMPLE_TYPES = [
  { donor: "Donor" },
  { organ: "Organ"},
  { dataset: "Dataset"}, 
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
  RL: "Lung (Right)",
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
