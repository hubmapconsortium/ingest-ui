// // @TODO: Looks like everything calling constants is calling from the root folder, not utils
// // Let's properly move this into Utils & update the imports
// // These ones show on the main Search/Filter page
// export const SESSION_TIMEOUT_IDLE_TIME = 30 * 1000 * 60; // min * minisecond * second

// // DEPRICATED, using Sample Categories instead
// // Keeping the Types name here for now for smoother changeover,
// // @TODO: better naming to reflect this change
// // export const SAMPLE_TYPES = [
// //   { donor: "Donor" },
// //   { sample: "Sample"},
// //   { dataset: "Dataset"}, 
// //   { uploads: "Data Upload"},
// //   { organ: "Organ"},
// //   {
// //     biopsy: "Biopsy",
// //     cell_lysate: "Cell lysate",
// //     ffpe_block: "FFPE block",
// //     pfa_fixed_frozen_oct_block: "PFA Fixed frozen OCT block",
// //     fixed_tissue_piece: "Fixed tissue piece",
// //     flash_frozen_liquid_nitrogen: "Flash frozen, liquid nitrogen",
// //     formalin_fixed_oct_block: "Formalin fixed OCT block",
// //     fresh_frozen_tissue: "Fresh frozen tissue",
// //     fresh_frozen_oct_block: "Fresh frozen oct block",
// //     fresh_tissue: "Fresh tissue",
// //     frozen_cell_pellet_buffy_coat: "Frozen cell pellet (Buffy coat)",
// //     module: "Module",
// //     pbmc: "PBMC",
// //     plasma: "Plasma",
// //     nuclei_rnalater: "Nuclei RNAlater",
// //     organ_piece: "Organ Piece",
// //     rnalater_treated_and_stored: "RNAlater treated and stored",
// //     segment: "Segment",
// //     serum: "Serum",
// //     single_cell_cryopreserved: "Single cell cryopreserved",
// //     tissue_lysate: "Tissue lysate"
// //   },
// //   {
// //     clarity_hydrogel: "CLARITY hydrogel",
// //     cryosections_curls_from_fresh_frozen_oct:
// //       "Cryosections/curls from fresh frozen OCT",
// //     cryosections_curls_rnalater: "Cryosectinos/curls RNAlater",
// //     ffpe_slide: "FFPE slide",
// //     fixed_frozen_section_slide: "Fixed Frozen section slide",
// //     fresh_frozen_section_slide: "Fresh Frozen section slide",
// //     fresh_frozen_tissue_section: "Fresh Frozen Tissue Section"
// //   },
// //   {
// //     gdna: "gDNA",
// //     nuclei: "Nuclei",
// //     protein: "Protein",
// //     rna_total: "RNA, total",
// //     ran_poly_a_enriched: "RNA, poly-A enriched",
// //     sequence_library:"Sequence Library"
// //   },
// //   { other: "Other" }
// // ];
// // export const SAMPLE_TYPES = { // Move requests for this into categories
// //   Test:"Test",
// //   organ:"Organ",
// //   block:"Block",
// //   section:"Section",
// //   suspension:"Suspension",
// // }
// // export const SAMPLE_CATEGORIES = { // Use this instead of Types
// //   Test2:"Test2",
// //   organ:"Organ",
// //   organ:"Organ",
// //   block:"Block",
// //   section:"Section",
// //   suspension:"Suspension",
// // }
// // These ones show on the Create new Donor/Sample page
// // export const TISSUE_TYPES = {
// //    Donor: [{ 
// //     organ: "Organ"
// //   }],
// //    Sample: [{
// //     Test3:"Test3",
// //     biopsy: "Biopsy",
// //     cell_lysate: "Cell lysate",
// //     ffpe_block: "FFPE block",
// //     pfa_fixed_frozen_oct_block: "PFA Fixed frozen OCT block",
// //     fixed_tissue_piece: "Fixed tissue piece",
// //     flash_frozen_liquid_nitrogen: "Flash frozen, liquid nitrogen",
// //     formalin_fixed_oct_block: "Formalin fixed OCT block",
// //     fresh_frozen_tissue: "Fresh frozen tissue",
// //     fresh_frozen_oct_block: "Fresh frozen oct block",
// //     fresh_tissue: "Fresh tissue",
// //     frozen_cell_pellet_buffy_coat: "Frozen cell pellet (Buffy coat)",
// //     module: "Module",
// //     pbmc: "PBMC",
// //     plasma: "Plasma",
// //     nuclei_rnalater: "Nuclei RNAlater",
// //     organ_piece: "Organ Piece",
// //     rnalater_treated_and_stored: "RNAlater treated and stored",
// //     segment: "Segment",
// //     serum: "Serum",
// //     single_cell_cryopreserved: "Single cell cryopreserved",
// //     tissue_lysate: "Tissue lysate",
// //   },{
// //     clarity_hydrogel: "CLARITY hydrogel",
// //     cryosections_curls_from_fresh_frozen_oct:
// //       "Cryosections/curls from fresh frozen OCT",
// //     cryosections_curls_rnalater: "Cryosectinos/curls RNAlater",
// //     ffpe_slide: "FFPE slide",
// //     fixed_frozen_section_slide: "Fixed Frozen section slide",
// //     fresh_frozen_section_slide: "Fresh Frozen section slide",
// //     fresh_frozen_tissue_section: "Fresh Frozen Tissue Section"
// //   },{
// //     gdna: "gDNA",
// //     nuclei: "Nuclei",
// //     protein: "Protein",
// //     rna_total: "RNA, total",
// //     ran_poly_a_enriched: "RNA, poly-A enriched",
// //     sequence_library:"Sequence Library"
// //   },{
// //     other: "Other" }]
// // };

// export const ORGAN_TYPES = {
//   AO: "Aorta",
//   BL: "Bladder",
//   BD: "Blood",
//   BM: "Bone Marrow",
//   BR: "Brain",
//   LB: "Bronchus (Left)",
//   RB: "Bronchus (Right)",
//   LE: "Eye (Left)",
//   RE: "Eye (Right)",
//   LF: "Fallopian Tube (Left)",
//   RF: "Fallopian Tube (Right)",
//   HT: "Heart",
//   LK: "Kidney (Left)",
//   RK: "Kidney (Right)",
//   LI: "Large Intestine",
//   LV: "Liver",
//   LL: "Lung (Left)",
//   RL: "Lung (Right)",
//   LY: "Lymph Node",
//   LO: "Ovary (Left)",
//   RO: "Ovary (Right)",
//   PA: "Pancreas",
//   PL: "Placenta",
//   SI: "Small Intestine",
//   SK: "Skin",
//   SP: "Spleen",
//   ST: "Sternum",
//   TH: "Thymus",
//   TR: "Trachea",
//   UR: "Ureter",
//   UT: "Uterus",
//   OT: "Other"
// };

// export const RUI_ORGAN_TYPES = ["SK", "LI", "HT", "LK", "RK", "SP", "BR", "LL", "RL", "LY", "TH"];

// export const EXCLUDE_USER_GROUPS = ["2cf25858-ed44-11e8-991d-0e368f3075e8", "5777527e-ec11-11e8-ab41-0af86edb4424"];

// // this is a list of fields for the keyword search.  note: must ID fields need to use .keyword
// export const ES_SEARCHABLE_FIELDS = [
//   "description.keyword", 
//   "hubmap_id.keyword", 
//   "submission_id.keyword",
//   "display_doi.keyword", 
//   "lab_donor_id.keyword", 
//   "display_subtype.keyword",
//   "lab_name.keyword",
//   "lab_tissue_sample_id.keyword",
//   "lab_donor_id.keyword",
//   "lab_dataset_id.keyword",
//   "created_by_user_displayname", 
//   "created_by_user_email",
//   "dataset_info"
//   ];

// // this list is for wildcard searchable fields
// export const ES_SEARCHABLE_WILDCARDS = [
//   "submission_id", 
//   "hubmap_id",
//   "lab_donor_id", 
//   "lab_name",
//   "lab_tissue_sample_id",
//   "lab_dataset_id"
//   ];



// //   export function compiledTissueTypes() {
// //     const  compileTypeList = () =>{
// //       var donor_types=[]
// //       var sample_types=[]
// //       TISSUE_TYPES.forEach((optgs, index) => {
// //         Object.entries(optgs).forEach(op => {
// //           var type = {
// //             label: op[1],
// //             value: op[0]
// //           }
          
// //           if(index>0){
// //             sample_types.push(type);
// //           }else{
// //             donor_types.push(type)
// //           }
// //         })
        
// //       })
// //       var groupedOption = [{
// //         label: 'Donor',
// //         options: donor_types,
// //       },{
// //         label: 'Sample',
// //         options: sample_types
// // ,
// //       }];
// //   //console.debug("groupedTypeList", groupedOption);
// //       return groupedOption;
// //     };
// //     return compileTypeList();
// //   }
  



//   export function compiledSelectList(params) {
// //console.debug("compiledSelectList", params);
  
//       var groups = []; 
//       params.forEach((optgs, index) => {
//         groups.push({
//           "label": "---" ,
//           "options":[]
//         })
      
//         var list = []; 
//         Object.entries(optgs).forEach(op => {
//           var option = {
//             label: op[1],
//             value: op[0]
//           }
//           list.push(option);
//           groups[index].options.push(option);
//         //console.debug("index", index);
//         //console.debug("groupCOunt", groups[index]);
//         })        
//       //console.debug("index", index); 
//       //console.debug("group", groups);
//     //console.debug("list", list[0], list[1]);
//     //console.debug("compiledSelectList", list);
//       })
//     return groups;
//   }