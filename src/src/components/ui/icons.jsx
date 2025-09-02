


import ClearIcon from "@mui/icons-material/Clear";
import ArticleIcon from '@mui/icons-material/Article';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonIcon from '@mui/icons-material/Person';
import TableChartIcon from '@mui/icons-material/TableChart';

// @TODO: Strip the Status/Style wrapping back into where its being used &
// only return the icon here.
export function EntityIcons(entity_type, status){  
  console.debug('%c◉ status ', 'color:#00ff7b', entity_type, status);
  console.debug('%c◉ test.. ', 'color:#00ff7b', status? "true" : "false");
  let style = {fontSize: "1.5em", "verticalAlign": "text-bottom"}
  let newSX={"&&": {color: status?"white":""}}
  switch
  (entity_type && entity_type.toLowerCase()){
    case "donor":
      return <PersonIcon style={style} sx={newSX} />
    case "sample":
      return <BubbleChartIcon style={style} sx={newSX} />
    case "dataset":
      return <TableChartIcon style={style} sx={newSX} />
    case "upload":
      return <DriveFolderUploadIcon style={style} sx={newSX} />
    case "publication":
      return <ArticleIcon style={style} sx={newSX} />
    case "collection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    case "eppicollection":
      return <CollectionsBookmarkIcon style={style} sx={newSX} />
    default:
      return <BubbleChartIcon style={style} />
  }
}
export function OrganIcons(organ){  
  console.debug('%c◉ status ', 'color:#00ff7b', organ);
  let prependURL = "https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-"
  let iconMap={
    "BD": "blood",
    "BL": "bladder",
    "BM": "bone-marrow",
    "BR": "brain",
    "BV": "blood",
    "HT": "heart",
    "LA": "larynx",
    "LB": "extrapulmonary bronchus",
    "LE": "eye",
    "LF": "fallopian-tube-left",
    "LI": "large-intestine",
    "LK": "kidney-left",
    "LL": "lung-left",
    "LN": "knee-left",
    "LO": "ovary-left",
    "LT": "palatine tonsil",
    "LU": "ureter-left",
    "LV": "liver",
    "LY": "lymph-nodes",
    "ML": "mammary-gland-left",
    "MR": "mammary-gland-right",
    "PA": "pancreas",
    "PL": "placenta",
    "PR": "prostate",
    "PV": "pelvis-f",
    "RB": "extrapulmonary bronchus",
    "RE": "eye",
    "RF": "fallopian-tube-right",
    "RK": "kidney-right",
    "RL": "lung-right",
    "RN": "knee-right",
    "RO": "ovary-right",
    "RT": "palatine tonsil",
    "RU": "ureter-right",
    "SC": "spinal-cord",
    "SI": "small intestine",
    "SK": "skin",
    "SP": "spleen",
    "TH": "thymus",
    "TR": "trachea",
    "UT": "uterus",
    "VL": "lymphatic-vasculature",
  }
  let iconURL = iconMap[organ]? prependURL + iconMap[organ] + ".svg" : null
  return iconURL
}
 