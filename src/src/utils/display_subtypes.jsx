// THIS is a port of the Display Subtype stuff we're only gettting from search otherwise
// add a calculated (not stored in Neo4j) field called `display_subtype` to 
// all Elasticsearch documents of the above types with the following rules:
// Upload: Just make it "Data Upload" for all uploads
// Donor: "Donor"
// Sample: if specimen_type == 'organ' the display name linked to the corresponding description of organ code
// otherwise the display name linked to the value of the corresponding description of specimen_type code
// Dataset: the display names linked to the values in dataset_type as a comma separated list

import { ubkg_api_get_organ_type_set,ubkg_api_get_assay_type_set } from "../service/ubkg_api";
import { SAMPLE_TYPES } from "../constants";


var organs = {
    //Manually Copied from Search API's 
    //search-schema/data/definitions/enums/organ_types.yaml
    "AO":"Aorta",
    "BL":"Bladder",
    "BD":"Blood",
    "BM":"Bone Marrow",
    "BR":"Brain",
    "LF":"Fallopian Tube (Left)",
    "RF":"Fallopian Tube (Right)",
    "HT":"Heart",
    "LB":"Bronchus (Left)",
    "LE":"Eye (Left)",
    "LI":"Large Intestine",
    "LK":"Kidney (Left)",
    "LL":"Lung (Left)",
    "LN":"Knee (Left)",
    "LV":"Liver",
    "LY":"Lymph Node",
    "LO":"Ovary (Left)",
    "RO":"Ovary (Right)",
    "OT":"Other",
    "PA":"Pancreas",
    "PL":"Placenta",
    "RB":"Bronchus (Right)",
    "RE":"Eye (Right)",
    "RK":"Kidney (Right)",
    "RL":"Lung (Right)",
    "RN":"Knee (Right)",
    "SI":"Small Intestine",
    "SK":"Skin",
    "SP":"Spleen",
    "ST":"Sternum",
    "TH":"Thymus",
    "TR":"Trachea",
    "UR":"Ureter",
    "UT":"Uterus"
}


var tissues = {
    //Manually Copied from Search API's 
    //search-schema/data/definitions/enums/tissue_types.yaml
    "atacseq":"ATACseq",
    "biopsy":"Biopsy",
    "blood":"Blood",
    "cell_lysate":"Cell lysate",
    "clarity_hydrogel":"CLARITY hydrogel",
    "codex":"CODEX",
    "cryosections_curls_from_fresh_frozen_oct":"Cryosections/curls from fresh frozen OCT",
    "cryosections_curls_rnalater":"Cryosections/curls RNAlater",
    "ffpe_block":"FFPE block",
    "ffpe_slide":"FFPE slide",
    "fixed_frozen_section_slide":"Fixed frozen section slide",
    "fixed_tissue_piece":"Fixed tissue piece",
    "flash_frozen_liquid_nitrogen":"Flash frozen, liquid nitrogen",
    "formalin_fixed_oct_block":"Formalin fixed OCT block",
    "fresh_frozen_oct_block":"Fresh frozen OCT block",
    "fresh_frozen_section_slide":"Fresh frozen section slide",
    "fresh_frozen_tissue":"Fresh frozen tissue",
    "fresh_frozen_tissue_section":"Fresh frozen tissue section",
    "fresh_tissue":"Fresh tissue",
    "frozen_cell_pellet_buffy_coat":"Frozen cell pellet (Buffy coat)",
    "gdna":"gDNA",
    "module":"Module",
    "nuclei":"Nuclei",
    "nuclei_rnalater":"Nuclei RNAlater",
    "organ":"Organ",
    "organ_piece":"Organ piece",
    "other":"Other",
    "pbmc":"PBMC",
    "pfa_fixed_frozen_oct_block":"PFA fixed frozen OCT block",
    "plasma":"Plasma",
    "protein":"Protein",
    "ran_poly_a_enriched":"RNA, poly-A enriched",
    "rna_total":"RNA, total",
    "rnalater_treated_and_stored":"RNAlater treated and stored",
    "rnaseq":"RNAseq",
    "scatacseq":"scATACseq",
    "scrnaseq":"scRNAseq",
    "segment":"Segment",
    "seqfish":"seqFISH",
    "sequence_library":"Sequence library",
    "serum":"Serum",
    "single_cell_cryopreserved":"Single cell cryopreserved",
    "snatacseq":"snATACseq",
    "snrnaseq":"snRNAseq",
    "tissue_lysate":"Tissue lysate",
    "wgs":"Whole genome sequencing"
}


 function get_organ_description(organ_code){
   console.debug("get_organ_description",organs[organ_code]);
   return organs[organ_code];
 }
  function get_tissue_sample_description(tissue_code){
   console.debug("get_tissue_sample_description",organs[tissue_code]);
   return tissues[tissue_code];
 }
    

//  UBKG:
// Get Organs
function get_organs_UBKG(organ_code){
  ubkg_api_get_organ_type_set()
    .then((res) => {
      console.debug('%c⊙', 'color:#00ff7b', res);
      return res;
    })
    .catch((error) => {
      console.error('%c⭗', 'color:#ff005d', "ERROR: ubkg_api_get_organ_type_set",error);
    });
    
 }
function get_organ_description_UBKG(organ_code) {
  var organList = get_organs_UBKG();
  console.debug('%c⊙', 'color:#00ff7b', "organList",organList );
   console.debug("get_organ_description",organList[organ_code]);
   return "TEST";
}
      
// Get Sample Types
function get_sample_types_UBKG(tissue_code){
  ubkg_api_get_assay_type_set()
    .then((res) => {
      console.debug('%c⊙', 'color:#00ff7b', res);
      return res;
    })
    .catch((error) => {
      console.error('%c⭗', 'color:#ff005d', "ERROR: ubkg_api_get_organ_type_set",error);
    });
    
 }
function get_sample_description_UBKG(tissue_code) {
  var typeList = get_sample_types_UBKG();
  console.debug('%c⊙', 'color:#00ff7b', "typeList",typeList );
   console.debug("get_organ_description",typeList[tissue_code]);
   return "TEST";
 }
        
        
export function generateDisplaySubtype( entity) {
    var entity_type = entity['entity_type']
    var display_subtype = '{unknown}'

    if (entity_type === 'Upload'){
        display_subtype = 'Data Upload'
    }else if (entity_type === 'Donor'){
        display_subtype = 'Donor'
    }else if (entity_type === 'Sample'){

        if ('specimen_type' in entity){
            if (entity['specimen_type'].toLowerCase() === 'organ'){
                if ('organ' in entity){
                    display_subtype = get_organ_description(entity['organ']);
                }else{
                    console.error("Missing missing organ when specimen_type is set of Sample with uuid: {entity['uuid']}")
                }
            }else{
               display_subtype = get_tissue_sample_description(entity['specimen_type'])
            }
        }else{
            console.error("Missing specimen_type of Sample with uuid: {entity['uuid']}")
        }

    }else if (entity_type === 'Dataset'){
        if ('dataset_type' in entity){
            display_subtype = entity['dataset_type'].toString();
        }else{
            console.error("Missing dataset_type of Dataset with uuid: {entity['uuid']}")
        }
    }else{
        // Do nothing
        console.error("Invalid entity_type: {entity_type}. Only generate display_subtype for Upload/Donor/Sample/Dataset")
    }
    return display_subtype
};


export function generateDisplaySubtypeSimple_UBKG(datatype, datatypeList) {
  // console.debug('%c⊙', 'color:#00ff7b', "generateDisplaySubtypeSimple_UBKG", datatype, datatypeList);
  const assayDetail = datatypeList.find(({ name }) => name === datatype);
  console.debug('%c⊙', 'color:#00ff7b', "assayDetail", assayDetail );
  if (assayDetail !==undefined && assayDetail && assayDetail.description) {
    return assayDetail.description
  } else {
    return "N/A"
  }
}

export function generateDisplaySubtype_UBKG( entity) {
    var entity_type = entity['entity_type']
    var display_subtype = '{unknown}'
  

    if (entity_type === 'Upload'){
        display_subtype = 'Data Upload'
    }else if (entity_type === 'Donor'){
        display_subtype = 'Donor'
    }else if (entity_type === 'Sample'){
        if ('specimen_type' in entity){
            if (entity['specimen_type'].toLowerCase() === 'organ'){
              if ('organ' in entity) {
                    display_subtype = get_organ_description_UBKG(entity['organ']);
                }else{
                    console.error("Missing missing organ when specimen_type is set of Sample with uuid: {entity['uuid']}")
                }
            } else {
               display_subtype = get_sample_description_UBKG(entity['specimen_type'])
            }
        }else{
            console.error("Missing specimen_type of Sample with uuid: {entity['uuid']}")
        }

    }else if (entity_type === 'Dataset'){
        if ('dataset_type' in entity){
            display_subtype = entity['dataset_type'].toString();
        }else{
            console.error("Missing dataset_type of Dataset with uuid: {entity['uuid']}")
        }
    }else{
        // Do nothing
        console.error("Invalid entity_type: {entity_type}. Only generate display_subtype for Upload/Donor/Sample/Dataset")
    }
    return display_subtype
};


export function compiledTypes() {
    
  const  compileTypeList = () =>{
    // Ok, we have all the:
    //  Core Sample Types
    //  Organ Types
    // Tissue Types
    // Cell Types
    var core_types=[]
    var organ_types=[]
    var tissue_types=[]
    var cell_types=[]
    var misc_types=[]
    SAMPLE_TYPES.forEach((optgs, index) => (

      Object.entries(optgs).forEach(op => {
        var type = {
          label: op[1],
          value: op[0]
        }
        
        if(index<5){
          core_types.push(type);
        }else if (index === 5) {
          organ_types.push(type)
        }else if (index === 6) {
          tissue_types.push(type)
        }else if (index === 7) {  
          cell_types.push(type)
        }else if (index === 8) {
          misc_types.push(type)
        }
      })
      
    ))
    
    var groupedOption = [{
      label: '',
      options: core_types,
    },{
      label: 'Organs',
      options: organ_types,
    },{
      label: 'Tissues',
      options: tissue_types,
    },{
      label: 'Cells',
      options: cell_types,
    },{
      label: 'Other', 
      options: misc_types,
    }];
  console.debug("groupedTypeList", groupedOption);
    return groupedOption;
  };

  return compileTypeList();
}





    // def generate_display_subtype(self, entity):
    //     entity_type = entity['entity_type']
    //     display_subtype = '{unknown}'

    //     if entity_type == 'Upload':
    //         display_subtype = 'Data Upload'
    //     else if entity_type == 'Donor':
    //         display_subtype = 'Donor'
    //     else if entity_type == 'Sample':
    //         if 'specimen_type' in entity:
    //             if entity['specimen_type'].lower() == 'organ':
    //                 if 'organ' in entity:
    //                     display_subtype = self.get_organ_description(entity['organ'])
    //                 else:
    //                     logger.error(f"Missing missing organ when specimen_type is set of Sample with uuid: {entity['uuid']}")
    //             else:
    //                 display_subtype = self.get_tissue_sample_description(entity['specimen_type'])
    //         else:
    //             logger.error(f"Missing specimen_type of Sample with uuid: {entity['uuid']}")
    //     else if entity_type == 'Dataset':
    //         if 'dataset_type' in entity:
    //             display_subtype = ','.join(entity['dataset_type'])
    //         else:
    //             logger.error(f"Missing dataset_type of Dataset with uuid: {entity['uuid']}")
    //     else:
    //         # Do nothing
    //         logger.error(f"Invalid entity_type: {entity_type}. Only generate display_subtype for Upload/Donor/Sample/Dataset")

    //     return display_subtype
