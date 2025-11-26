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
  // console.debug('%c◉ status ', 'color:#00ff7b', entity_type, status);
  // console.debug('%c◉ test.. ', 'color:#00ff7b', status? "true" : "false");
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

export function OrganDetails(){
  console.debug('%c◉ OrganDetails ', 'color:#00ff7b', );
  let organs =  JSON.parse(localStorage.getItem("organs"))
  let organsFull =  JSON.parse(localStorage.getItem("organs_full"))
  const BASE_ICON_URL = 'https://cdn.humanatlas.io/hra-design-system/icons'
  let uberonIcons = {
    'skin': `${BASE_ICON_URL}/organs/organ-icon-skin.svg`,
    'blood': `${BASE_ICON_URL}/organs/organ-icon-blood.svg`,
    'bone-marrow': `${BASE_ICON_URL}/organs/organ-icon-bone-marrow.svg`,
    'brain': `${BASE_ICON_URL}/organs/organ-icon-brain.svg`,
    'kidney-left': `${BASE_ICON_URL}/organs/organ-icon-kidney-left.svg`,
    'kidney-right': `${BASE_ICON_URL}/organs/organ-icon-kidney-right.svg`,
    'large-intestine': `${BASE_ICON_URL}/organs/organ-icon-large-intestine.svg`,
    'liver': `${BASE_ICON_URL}/organs/organ-icon-liver.svg`,
    'lung-left': `${BASE_ICON_URL}/organs/organ-icon-lung-left.svg`,
    'lung-right': `${BASE_ICON_URL}/organs/organ-icon-lung-right.svg`,
    'lymph-nodes': `${BASE_ICON_URL}/organs/organ-icon-lymph-nodes.svg`,
    'mammary-gland-left': `${BASE_ICON_URL}/organs/organ-icon-breast.svg`,
    'mammary-gland-right':`${BASE_ICON_URL}/organs/organ-icon-breast.svg`,
    'UBERON:0005090': 'https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-united.svg',
    'ovary-left': `${BASE_ICON_URL}/organs/organ-icon-ovary-left.svg`,
    'ovary-right': `${BASE_ICON_URL}/organs/organ-icon-ovary-right.svg`,
    'pancreas': `${BASE_ICON_URL}/organs/organ-icon-pancreas.svg`,
    'placenta': `${BASE_ICON_URL}/organs/organ-icon-placenta.svg`,
    'spleen': `${BASE_ICON_URL}/organs/organ-icon-spleen.svg`,
    'spinal-cord': `${BASE_ICON_URL}/organs/organ-icon-spinal-cord.svg`,
    'skin': `${BASE_ICON_URL}/organs/organ-icon-skin.svg`,
    'bone-marrow': `${BASE_ICON_URL}/organs/organ-icon-bone-marrow.svg`,
    'thymus': `${BASE_ICON_URL}/organs/organ-icon-thymus.svg`,
    'trachea': `${BASE_ICON_URL}/organs/organ-icon-trachea.svg`,
    'heart': `${BASE_ICON_URL}/organs/organ-icon-heart.svg`,
    'palatine-tonsil':`${BASE_ICON_URL}/organs/organ-icon-palatine-tonsil.svg`,
    'palatine-tonsil':`${BASE_ICON_URL}/organs/organ-icon-palatine-tonsil.svg`,
    'UBERON:0010000': "https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-united.svg",
  }

  const iconMap = {};
  if (Array.isArray(organsFull)) {
    organsFull.forEach((entry) => {
      console.debug('%c◉ entry ', 'color:#00ff7b', entry);
      try {
        if (entry && entry.rui_code) {
          iconMap[entry.rui_code] = OrganIcons(entry.rui_code);
        }
      } catch (err) {
        console.debug('%c◉ OrganDetails: skipped entry', 'color:#FF8800', err);
      }
    });
  }
  console.debug('%c◉ iconMap ', 'color:#00ff7b', iconMap);
  return iconMap;
}

export function OrganIcons(organ){  
  // console.debug('%c◉ status ', 'color:#00ff7b', organ);
  const BASE_ICON_URL = 'https://cdn.humanatlas.io/hra-design-system/icons/organs/organ-icon-'
  // let prependURL = `${BASE_ICON_URL}`
  let iconMap={
    "BD": `${BASE_ICON_URL}blood`,
    "BL": `${BASE_ICON_URL}bladder`,
    "BM": `${BASE_ICON_URL}bone-marrow`,
    "BR": `${BASE_ICON_URL}brain`,
    "BV": `${BASE_ICON_URL}blood`,
    "HT": `${BASE_ICON_URL}heart`,
    "LA": `${BASE_ICON_URL}larynx`,
    "LB": `${BASE_ICON_URL}extrapulmonary bronchus`,
    "LE": `${BASE_ICON_URL}eye`,
    "LF": `${BASE_ICON_URL}fallopian-tube-left`,
    "LI": `${BASE_ICON_URL}large-intestine`,
    "LK": `${BASE_ICON_URL}kidney-left`,
    "LL": `${BASE_ICON_URL}lung-left`,
    "LN": `${BASE_ICON_URL}knee-left`,
    "LO": `${BASE_ICON_URL}ovary-left`,
    "LT": `${BASE_ICON_URL}palatine tonsil`,
    "LU": `${BASE_ICON_URL}ureter-left`,
    "LV": `${BASE_ICON_URL}liver`,
    "LY": `${BASE_ICON_URL}lymph-nodes`,
    "ML": `${BASE_ICON_URL}mammary-gland-left`,
    "MR": `${BASE_ICON_URL}mammary-gland-right`,
    "PA": `${BASE_ICON_URL}pancreas`,
    "PL": `${BASE_ICON_URL}placenta`,
    "PR": `${BASE_ICON_URL}prostate`,
    "PV": `${BASE_ICON_URL}pelvis-f`,
    "RB": `${BASE_ICON_URL}extrapulmonary bronchus`,
    "RE": `${BASE_ICON_URL}eye`,
    "RF": `${BASE_ICON_URL}fallopian-tube-right`,
    "RK": `${BASE_ICON_URL}kidney-right`,
    "RL": `${BASE_ICON_URL}lung-right`,
    "RN": `${BASE_ICON_URL}knee-right`,
    "RO": `${BASE_ICON_URL}ovary-right`,
    "RT": `${BASE_ICON_URL}palatine tonsil`,
    "RU": `${BASE_ICON_URL}ureter-right`,
    "SC": `${BASE_ICON_URL}spinal-cord`,
    "SI": `${BASE_ICON_URL}small intestine`,
    "SK": `${BASE_ICON_URL}skin`,
    "SP": `${BASE_ICON_URL}spleen`,
    "TH": `${BASE_ICON_URL}thymus`,
    "TR": `${BASE_ICON_URL}trachea`,
    "UT": `${BASE_ICON_URL}uterus`,
    "VL": `${BASE_ICON_URL}lymphatic-vasculature`,
  }
  let iconURL = iconMap[organ]? iconMap[organ] + ".svg" : "https://cdn.jsdelivr.net/gh/cns-iu/md-icons@main/other-icons/organs/ico-organs-united.svg"
  return iconURL
}

export function RUIIcon(size,color){
  // Scraped from: 
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}` } fill="none" xmlns="http://www.w3.org/2000/svg" fit="" preserveAspectRatio="xMidYMid meet" focusable="false">
      <path d="M6.80697 4.04111C6.54665 3.52941 4.5 3.56532 4.5 4.15782V8.50282C4.85906 7.82055 5.36175 7.22805 5.98113 6.75225C6.00806 5.79168 6.29531 4.85805 6.81595 4.04111H6.80697Z" fill="white"></path>
      <path d="M18.19 11.8066C18.19 11.8066 17.418 8.61068 15.3983 7.7309C14.8058 7.54238 13.0913 8.03613 14.1326 10.5677C13.8813 10.2715 12.9208 8.4042 13.7287 7.20124C14.2942 6.46511 15.1649 6.02522 16.0985 5.99829C16.6909 5.99829 17.1846 5.52249 17.1846 4.92999C17.1846 4.83124 17.1757 4.72351 17.1397 4.62476C16.9692 3.45772 15.4432 3.61931 15.4432 3.61931C15.4432 3.61931 11.4755 3.53851 10.533 6.15988C10.533 2.98192 14.5994 2.96397 14.5994 2.96397C14.5994 1.97647 11.1883 1.37499 9.01597 3.05374C6.08064 5.31601 6.10757 9.21216 8.45045 12.1657C7.09499 11.259 6.23324 9.75977 6.14347 8.1259C5.75748 8.61966 4.60848 10.4331 4.94061 13.7457C5.42535 18.746 16.0536 22.7499 17.804 20.2183C19.5544 17.6867 18.208 11.7886 18.208 11.7886L18.19 11.8066ZM12.7592 16.6005C12.7592 17.0314 12.7592 17.4623 12.7592 17.9022C12.7592 18.1535 12.6874 18.1894 12.4719 18.0727C11.7538 17.6598 11.0447 17.2468 10.3265 16.8428C10.0842 16.6992 9.96748 16.5017 9.97646 16.2144C9.97646 15.4065 9.97646 14.5985 9.97646 13.7906C9.97646 13.5033 10.0393 13.4674 10.2817 13.611C11.0177 14.033 11.7448 14.4639 12.4899 14.8858C12.6874 15.0025 12.7682 15.1551 12.7682 15.3795C12.7682 15.7925 12.7682 16.2144 12.7682 16.6274L12.7592 16.6005ZM12.7143 14.4818C11.9693 14.0599 11.2242 13.629 10.4881 13.1981C10.2547 13.0634 10.2637 12.9916 10.4881 12.848C11.1973 12.435 11.9154 12.022 12.6335 11.6091C12.849 11.4834 13.0734 11.4744 13.2978 11.6091C14.0159 12.031 14.743 12.444 15.4611 12.8569C15.6945 12.9916 15.6945 13.0634 15.4611 13.1981C14.7161 13.629 13.98 14.0599 13.2349 14.4818C13.1631 14.5267 13.0734 14.5536 12.9836 14.5895C12.8938 14.5536 12.7951 14.5267 12.7143 14.4818ZM15.6676 16.8159C14.9315 17.2378 14.1954 17.6688 13.4504 18.0907C13.2709 18.1984 13.1901 18.1446 13.1901 17.9201C13.1901 17.4802 13.1901 17.0314 13.1901 16.5915C13.1901 16.1785 13.1901 15.7745 13.1901 15.3616C13.1901 15.1282 13.2709 14.9666 13.4773 14.8499C14.2224 14.428 14.9674 13.9881 15.7125 13.5661C15.9189 13.4494 15.9907 13.4943 15.9907 13.7277C15.9907 14.5716 15.9907 15.4155 15.9907 16.2593C15.9907 16.5107 15.883 16.6902 15.6676 16.8159Z" fill="white"></path>
    </svg>
  )
}