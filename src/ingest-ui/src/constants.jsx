import axios from "axios";
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

export const TISSUE_TYPES = [
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
  LB: "Bronchus (Left)",
  RB: "Bronchus (Right)",
  HT: "Heart",
  LK: "Kidney (Left)",
  RK: "Kidney (Right)",
  LI: "Large Intestine",
  LV: "Liver",
  LL: "Lung (Left)",
  RL: "Lung (Right)",
  LY01: "Lymph Node 01",
  LY02: "Lymph Node 02",
  LY03: "Lymph Node 03",
  LY04: "Lymph Node 04",
  LY05: "Lymph Node 05",
  LY06: "Lymph Node 06",
  LY07: "Lymph Node 07",
  LY08: "Lymph Node 08",
  LY09: "Lymph Node 09",
  LY10: "Lymph Node 10",
  LY11: "Lymph Node 11",
  LY12: "Lymph Node 12",
  LY13: "Lymph Node 13",
  LY14: "Lymph Node 14",
  LY15: "Lymph Node 15",
  LY16: "Lymph Node 16",
  LY17: "Lymph Node 17",
  LY18: "Lymph Node 18",
  LY19: "Lymph Node 19",
  LY20: "Lymph Node 20",
  SI: "Small Intestine",
  SP: "Spleen",
  TH: "Thymus",
  TR: "Trachea",
  UR: "Ureter",
  OT: "Other"
};

export function get_data_type_dicts(params) {
    const req = axios.get(
    `${process.env.REACT_APP_SEARCH_API_URL}/assaytype`,
    {
	headers: {
	    "Content-Type": "application/json"
	},
	// params: {
	//     "primary": "true"
	// }
	params: params
    }).then(response => {
	return response.data;
    }).catch(error => {
	console.log(error);
	return Promise.reject(error);
    });

    return req;
}

export const DATA_TYPES = ['AF', 'ATACseq-bulk', 'MxIF', 'CODEX', 'IMC', 'MALDI-IMS-neg',
'MALDI-IMS-pos', 'PAS', 'bulk-RNA', 'SNAREseq', 'TMT-LC-MS', 'Targeted-Shotgun-LC-MS',
'LC-MS-untargeted', 'WGS', 'scRNA-Seq-10x', 'sciATACseq', 'sciRNAseq', 'seqFish',
'snATACseq', 'snRNAseq']
