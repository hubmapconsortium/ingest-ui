export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second
export const SAMPLE_TYPES = [
  { donor: "Donor" },
  { organ: "Organ", blood: "Blood" },
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
    ran_poly_a_enriched: "RNA, poly-A enriched"
  },
  {
    atacseq: "ATACseq",
    codex: "CODEX",
    rnaseq: "RNAseq",
    scatacseq: "scATACseq",
    scrnaseq: "scRNAseq",
    seqfish: "seqFISH",
    snatacseq: "snATACseq",
    snrnaseq: "snRNAseq",
    wes: "WES",
    wgs: "WGS"
  },
  { other: "Other" }
];
export const ORGAN_TYPES = {
  BL: "Bladder",
  BR: "Brain",
  RK: "Kidney (Right)",
  LK: "Kidney (Left)",
  HT: "Heart",
  LI: "Large Intestine",
  SI: "Small Intestine",
  LL: "Left Lung",
  RL: "Right Lung",
  LY: "Lymph Node",
  SP: "Spleen",
  TH: "Thymus",
  UR: "Ureter",
  LV: "Liver",
  OT: "Other"
};
