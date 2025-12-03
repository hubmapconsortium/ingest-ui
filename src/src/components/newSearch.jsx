import React,{useEffect,useState} from "react";
import {DataGrid,GridToolbar,GridColDef} from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import {SAMPLE_CATEGORIES} from "../constants";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from '@mui/material/Chip';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import GroupsIcon from '@mui/icons-material/Groups';
import Collapse from '@mui/material/Collapse';
import FormHelperText from "@mui/material/FormHelperText";
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import GridLoader from "react-spinners/GridLoader";
import SearchIcon from '@mui/icons-material/Search';
import {combineTypeOptionsComplete, CombineTypeSelect,CombineTypeSelectIcons, StatusBadge, badgeClass} from "./ui/formParts";
import {RenderError} from "../utils/errorAlert";
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import {toTitleCase} from "../utils/string_helper";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
  COLUMN_DEF_MIXED,
} from "./search/table_constants";
import {api_search2} from "../service/search_api";
import {OrganIcons} from "./ui/icons"

export function NewSearch({  
  searchTitle,
  searchSubtitle,
  searchFilters,
  restrictions,
  urlChange,
  modecheck,
  reportError,
  handleTableCellClick,
}){
  var [search_title] = useState(
    searchTitle ? 
    searchTitle : "Search");
  var [search_subtitle] = useState(
    searchSubtitle ? 
    searchSubtitle : null);

  // TABLE & FILTER VALUES
  var allGroups = localStorage.getItem("allGroups") ? JSON.parse(localStorage.getItem("allGroups")) : [];
  var [chipSelect, setChipSelect] = useState([]);
  var [pulseMap, setPulseMap] = useState({});
  var [searchFilters, setSearchFilters] = useState();
  var [formFilters, setFormFilters] = useState(
    searchFilters ? 
    searchFilters : {});
  var [page, setPage] = useState(0);
  var [pageSize,setPageSize] = useState(100);
  var [advancedSearch,setAdvancedSearch] = useState(true);

  // organ icons are passed to CombineTypeSelectIcons via prop when needed

  // TABLE DATA
  var [results, setResults] = React.useState({
    dataRows: null,
    rowCount: 0,
    colDef: COLUMN_DEF_SAMPLE,
  });

  //  LOADERS
  var [loading, setLoading] = useState(true);
  var [tableLoading, setTableLoading] = useState(true);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorState] = useState();
  const simpleColumns = ["Donor", "Dataset", "Publication", "Upload", "Collection"];

  useEffect(() => {
  // We're gonna want to check what Mode We're in
  // Will likely be either Source mode or Home mode (homepage)
  }, [modecheck]);

  function resultFieldSet() {
    var fieldObjects = [];
    var fieldArray = fieldObjects.concat(
      COLUMN_DEF_SAMPLE,
      COLUMN_DEF_COLLECTION,
      COLUMN_DEF_DATASET,
      COLUMN_DEF_UPLOADS,
      COLUMN_DEF_DONOR,
      COLUMN_DEF_MIXED
    );
    const unique = [...new Set(fieldArray.map((item) => item.field))];
    return unique;
  }
  function errorReporting(error){
    // console.debug('%c⭗errorReporting', 'color:#ff005d', error );
  }
  useEffect(() => {
    var searchFilterParams = searchFilters ? searchFilters : { entity_type: "DonorSample" };
    setTableLoading(true);

    // Will run automatically once searchFilters is updated
    // (Hence populating formFilters & converting to searchFilters on click)
    // Let's make sure the casing is right on the entity based fields\
    if (searchFilterParams?.entity_type && searchFilterParams?.entity_type !== "----") {
      let entityTypes = {
        donor: "Donor" ,
        sample: "Sample",
        dataset: "Dataset", 
        upload: "Data Upload",
        publication: "Publication",
        collection: "Collection"
      }
     console.debug('%c◉ SAMPLE_CATEGORIES ', 'color:#00ff7b', SAMPLE_CATEGORIES ,searchFilterParams.entity_type, entityTypes.hasOwnProperty(searchFilterParams.entity_type.toLowerCase()));
      if (entityTypes.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        console.debug('%c◉ hasOwnProperty  searchFilterParams.entity_type', 'color:#00ff7b', searchFilterParams.entity_type);
        searchFilterParams.entity_type = toTitleCase(searchFilterParams.entity_type);
      } else if (SAMPLE_CATEGORIES.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        console.debug('%c◉ has  SAMPLE_CATEGORIES', 'color:#00ff7b', );
        searchFilterParams.sample_category = searchFilterParams.entity_type.toLowerCase();
      } else {
        if(searchFilters && searchFilters.entityType !=="DonorSample"){
          // Coughs on Restricted Source Selector for EPICollections
          console.debug('%c◉ searchFilters.entityType ', 'color:#00ff7b', searchFilters.entityType);
          searchFilterParams.organ = searchFilterParams.entity_type.toUpperCase();
        }
      }
    }

    // That searchFilters Update thing above is triggered on search button click,
    // If we have restrictions, we still need to set the dropdowns accordingly
    // Before the user does anything
    if(restrictions && restrictions.entityType){

      searchFilterParams.entity_type = toTitleCase(restrictions.entityType);
      setFormFilters((prevValues) => ({
        ...prevValues,
      entity_type: restrictions.entityType,}));
    }

    var fieldSearchSet = resultFieldSet();
    api_search2(
      searchFilterParams,
      JSON.parse(localStorage.getItem("info")).groups_token,
      page * pageSize,
      pageSize,
      fieldSearchSet,
      "newTable"
    )
      .then((response) => {
        if(response.error){
          // console.debug('%c◉ Error on Search ', 'color:#C800FF', response.error);
          errorReporting(response.error)
        }
        // console.debug('%c◉ searchFilterParams ', 'color:#00d184', searchFilterParams);

        // console.debug('%c⊙useEffect Search', 'color:#008CFF', response.total, response.results );
        if (response.total > 0 && response.status === 200) {
          
          // console.debug('%c◉ searchFilterParams.entity_type ', 'color:#008CFF', searchFilterParams.entity_type);
          let colDefs;
          if(simpleColumns.includes(searchFilterParams.entity_type) ){
            colDefs = columnDefType(searchFilterParams.entity_type);
          }else if(!searchFilterParams.entity_type || searchFilterParams.entity_type === undefined || searchFilterParams.entity_type === "---"){
            colDefs = COLUMN_DEF_MIXED
          }else{
            colDefs = COLUMN_DEF_SAMPLE
          }
          // console.debug('%c◉ colDefs ', 'color:#00ff7b', colDefs);
          setResults({
            dataRows: response.results,
            rowCount: response.total,
            colDef: colDefs,
          });
          setTableLoading(false);
        } else if (response.total === 0) {
          setResults({
            dataRows: response.results,
            rowCount: response.total,
            colDef: COLUMN_DEF_MIXED,
          });
          setTableLoading(false);
        } else {
          var errStringMSG = "";
          var errString =response.results.data.error.root_cause[0].type +" | " +response.results.data.error.root_cause[0].reason;
            typeof errString.type === "string"
              ? (errStringMSG = "Error on Search")
              : (errStringMSG = errString);
            setErrorState(true)
            setError(errStringMSG)
            setTableLoading(false);
          }
      })
      .catch((error) => {
        setTableLoading(false);
        // errorReport(error)
        //props.reportError(error);
        // console.debug("%c⭗ ERROR", "color:#ff005d", error);
      });
  }, [page, pageSize, searchFilters, restrictions]);

  function handlePageChange(pageInfo) {
    // console.debug("%c⭗", "color:#ff005d", "AAAAAAAAAAAAAAAAAAA", pageInfo);
    setPage(pageInfo.page);
    setPageSize(pageInfo.pageSize);
  }
  
  function columnDefType(et) {
    // console.debug('%c◉ columnDefType ', 'color:#00ff7b', et );
    if (et === "Donor") {
      return COLUMN_DEF_DONOR;
    }
    if (et === "Dataset") {
      return COLUMN_DEF_DATASET;
    }
    if (et === "Publication") {
      return COLUMN_DEF_PUBLICATION;
    }
    if (et === "Upload") {
      return COLUMN_DEF_UPLOADS;
    }
    if (et === "Collection") {
      return COLUMN_DEF_COLLECTION;
    }
    if (et === "Mixed") {
      return COLUMN_DEF_MIXED;
    }
    return COLUMN_DEF_SAMPLE;
  }

  function handleInputChange(e) {
    // Values for filtering the table data are set here
    const {name, value } = e.target;
    console.debug("%c⊙", "color:#FF7300", "HandleINputChange", name, value, e);
    switch (name) {
      case "group_uuid":
        if (value !== "All Components" && value !== "allcom") {
          setFormFilters((prevValues) => ({...prevValues,
            group_uuid: value,}));
        } else {
          setFormFilters((prevValues) => ({...prevValues,
            group_uuid: "",}));
        }
        break;
      case "entity_type":
        console.debug('%c◉ Entity Time ', 'color:#00ff7b', value);
        if (value !== "---") {
          console.debug('%c◉ Setting Entity Type from formFilters ', 'color:#00ff7b', );
          setFormFilters((prevValues) => ({...prevValues,
            entity_type: value}));
          } else {
            console.debug('%c◉ Clearing Entity Type from formFilters ', 'color:#00ff7b', );
            setFormFilters((prevValues) => ({...prevValues,
            entity_type: "",}));
        }
        break
      case "keywords":
        setFormFilters((prevValues) => ({...prevValues,
          keywords: value,}));
        break;
      default:
        break;
    }
  }

  function handleTableCellClickDefault(params, event) {
    console.debug('%c◉ handleTableCellClickDefault ', 'color:#00ff7b', );
    if (params.field === "uuid") return; // skip this field
    if (params.hasOwnProperty("row")) {
      var typeText = params.row.entity_type.toLowerCase();
      urlChange(event, typeText + "/" + params.row.uuid);
    }
  }
  
  function handleClearFilter() {
    setFormFilters({
      group_uuid: "",
      entity_type: "",
      keywords: ""
    })
    setSearchFilters({
      group_uuid: "allcom",
      entity_type: "---",
      keywords: ""
    })
  }
        
  function handleSearchClick(event) {
    // console.debug('%c◉  handleSearchClick ', 'color:#00ff7b', info);
    if(event){event.preventDefault()}
    setTableLoading(true);
    setPage(0)
    // console.debug('%c⊙handleSearchClick', 'color:#5789ff;background: #000;padding:200', formFilters );
    var group_uuid = formFilters.group_uuid;
    var entityType;
    if(formFilters.entity_type){
      entityType = formFilters.entity_type;
    }else if(formFilters.organ){
      entityType = formFilters.organ;
    }else if(formFilters.sample_category){
      entityType = formFilters.sample_category;
    }
    var keywords = formFilters.keywords;
    let which_cols_def = COLUMN_DEF_SAMPLE; //default
    if (entityType) {
      let colSet = entityType.toLowerCase();
      if (which_cols_def) {
        if (colSet === "donor") {
          which_cols_def = COLUMN_DEF_DONOR;
        } else if (colSet === "sample") {
          which_cols_def = COLUMN_DEF_SAMPLE;
        } else if (colSet === "dataset") {
          which_cols_def = COLUMN_DEF_DATASET;
        } else if (colSet === "publication") {
          which_cols_def = COLUMN_DEF_PUBLICATION;
        } else if (colSet === "upload") {
          which_cols_def = COLUMN_DEF_UPLOADS;
        } else if (colSet === "collection") {
          which_cols_def = COLUMN_DEF_COLLECTION;
        }
      }
  }

    let params = {}; // Will become the searchFilters
    var url = new URL(window.location); // Only used outside in basic / homepage Mode

    if (keywords) {
      params["keywords"] = keywords.trim();
      url.searchParams.set("keywords", keywords);
    } else {
      url.searchParams.delete("keywords");
    }
    if (group_uuid && group_uuid !== "All Components") {
      params["group_uuid"] = group_uuid;
      url.searchParams.set("group_uuid", group_uuid);
    } else {
      url.searchParams.delete("group_uuid");
    }
    // Here's where we sort out if the query's getting either:
    //  an entity type, sample category, or an organ
    // Doing this IN search now to avoid miscasting from URL
    // console.debug('%c◉ entityType ', 'color:#2600FF', entityType);
    if (entityType && entityType !== "----") {
      // console.debug('%c⊙', 'color:#00ff7b', "entityType fiound", entityType );
      params["entity_type"] = entityType;
      url.searchParams.set("entity_type", entityType);
    } else {
      // console.debug('%c⊙', 'color:#00ff7b', "entityType NOT fiound" );
      url.searchParams.delete("entity_type");
    } 
    if(chipSelect.length > 0){
      params["status"] = chipSelect;
    }
    
    // If we're not in a special mode, push URL to window
    if (!
      modecheck) {
      window.history.pushState({}, "", url);
      document.title = "HuBMAP Ingest Portal Search"
    }
    console.debug('%c◉ params ', 'color:#00ff7b', params);
    setSearchFilters(params);
  };


  function statusFilter(e, status){
    console.debug('%c◉ e ', 'color:#00ff7b', e, status);
    // Toggle selection using React state so the component re-renders immediately
    setChipSelect((prev) => {
      if (!Array.isArray(prev)) return [status];
      if (prev.includes(status)) {
        return prev.filter((item) => item !== status);
      }
      return [...prev, status];
    });
    // trigger one-shot pulse animation
    setPulseMap((prev) => ({...prev, [status]: true}));
    // window.setTimeout(() => {
    //   setPulseMap((prev) => {
    //     const copy = {...prev};
    //     delete copy[status];
    //     return copy;
    //   });
    // }, 380);
  }


  function renderStatusControls() {
    // Blue: QA, Submitted, REORGANIZED 
    // Green: PUBLISHED, VALID 
    // Red: ERROR, INVALID 
    // Yellow: INCOMPLETE 
    // Black: PROCESSING 
    // Purple: NEW 
    let colorMap = {  
      "QA": '#17a2b8', 
      "Submitted": '#17a2b8', 
      "Reorganized": '#17a2b8', 
      "Published": '#0ecd3a', 
      "Valid": '#0ecd3a',
      "Error": '#dc004e', 
      "Invalid": '#dc004e', 
      "Processing": '#424242', 
      "Incomplete": '#ffc107', 
      "New": '#9933cc', 
    }


    let statusOptions = ["Published", "QA", "Error", "Invalid", "Processing", "Submitted", "New", "Incomplete" , "Reorganized", "Valid"]
    
    return(<> 
        {statusOptions.map((status, i) => {
          const isSelected = chipSelect.includes(status);
          const baseBorder = `1px solid ${colorMap[status]}`;
          const hoverGlow = (c) => `0 0 8px ${c}55`;
          const activeGlow = (c) => `0 0 12px ${c}88`;
          const isPulsing = !!pulseMap && !!pulseMap[status];
          const sxSelected = {
            margin: "3px",
            fontSize: '0.7rem',
            backgroundColor: colorMap[status],
            color: 'white',
            border: baseBorder,
            transition: 'border-color 10ms ease, box-shadow 20ms ease, background-color 20ms cubic-bezier(.2,.9,.3,1)',
            boxShadow: hoverGlow(colorMap[status]),
              '&:hover': {
                boxShadow: `0 0 4px ${colorMap[status]}44`,
                filter: 'brightness(0.92)',
                backgroundColor: `${colorMap[status]}44`,
              },
            '&:active': {
              boxShadow: activeGlow(colorMap[status]),
            },
          };
          if (isPulsing) {
            sxSelected.animation = 'chipPulse 30ms ease-out';
            sxSelected['@keyframes chipPulse'] = {
              '0%': { boxShadow: `0 0 0 ${colorMap[status]}00`},
              '60%': { boxShadow: `0 0 12px ${colorMap[status]}88` },
              '100%': { boxShadow: `0 0 6px ${colorMap[status]}55`},
            };
          }

          const sxUnselected = {
            // fontWeight: 'bold',
            fontSize: '0.7rem',
            margin: "3px",
            backgroundColor:`${colorMap[status]}11`,
            color: colorMap[status],
            border: baseBorder,
            // slower first part when moving toward color
            transition: 'border-color 10ms cubic-bezier(.2,.8,.2,1), box-shadow 30ms cubic-bezier(.2,.8,.2,1), background-color 20ms cubic-bezier(.2,.8,.2,1), color 20ms ease',
            boxShadow: 'none',
            '&:hover': {
              borderColor: colorMap[status],
              boxShadow: hoverGlow(colorMap[status]),
                // smooth background transition from white -> tinted color on hover (midway)
                backgroundColor: `${colorMap[status]}33`,
                // color: 'white',
              },
            '&:active': {
              // active click: snap to a stronger glow (will be followed by selection state change)
              boxShadow: activeGlow(colorMap[status]),
              backgroundColor: `${colorMap[status]}55`,
              color: `${colorMap[status]}99`,
            },
          };
          if (isPulsing) {
            sxUnselected.animation = 'chipPulse 12ms ease-out';
            sxUnselected['@keyframes chipPulse'] = {
              '0%': { boxShadow: `0 0 0 ${colorMap[status]}00`},
              '60%': { boxShadow: `0 0 14px ${colorMap[status]}99`},
              '100%': { boxShadow: `0 0 6px ${colorMap[status]}55`},
            };
          }

          return (
            <Chip
              key={i}
              variant={isSelected ? 'filled' : 'outlined'}
              sx={isSelected ? sxSelected : sxUnselected}
              className={isSelected ? badgeClass(status) : 'statusChipUnselected'}
              label={status.toUpperCase()}
              size="small"
              onClick={(e) => statusFilter(e, status)}
            />
          );
        })}
    </>)  
  }

  function renderView() {
    return (
      <div style={{ width: "100%", textAlign: "center"}} sx={{
          background: "#444a65",
          background: "linear-gradient(180deg, rgb(88, 94, 122) 0%,  rgb(68, 74, 101) 100%)",
          width: "100%",
          color: "white",
          borderBottomRadius: "0.375rem"
        }}>
        {/* {renderFilterControls()} */}
        { renderNewFilterControls()}
        {results.dataRows && results.dataRows.length > 0 && renderTable()}
        {results.dataRows && results.dataRows.length === 0 && !tableLoading && (
          <div className="text-center">No record found.</div>)}
      </div>
    );
  }

  function renderTable() {
    var hiddenFields = [
      "created_by_user_displayname",
      "lab_tissue_sample_id",
      "lab_donor_id",
      "specimen_type",
      "organ",
      "registered_doi",
    ];

    if (results.colDef !== COLUMN_DEF_MIXED) {
      hiddenFields.push("entity_type",)
      hiddenFields.push("sample_category",)
    }    
    if (results.colDef === COLUMN_DEF_MIXED && (
      !modecheck || 
      modecheck !== "Source")) {
      hiddenFields.push("uuid",)
    }

    function buildColumnFilter(arr) {
      let obj = {};
      arr.forEach(value => {
          obj[value] = false;
      });
      console.debug('%c◉ obj ', 'color:#00ff7b', obj);
      return obj;
    }
    var columnFilters = buildColumnFilter(hiddenFields)
    console.debug('%c◉ columnFilters ', 'color:#00ff7b', results.colDef);
    
    const getTogglableColumns = (columns: GridColDef[]) => {
      return columns
        .filter((column) => !hiddenFields.includes(column.field))
        .map((column) => column.field);
    };

    return (
      <Box style={{height: 590, width: "100%" }}>
        <Box className="sourceShade" sx={{
          opacity: tableLoading ? 1 : 0,
          background: "#444a65",
          background: "linear-gradient(180deg, rgba(88, 94, 122, 1) 0%,  rgba(68, 74, 101, 1) 100%)",
          width: "100%",
          maxWidth: "1266px",
          pointerEvents: "none",
          height: "48px",
          position: "absolute",
          color: "white",
          zIndex: 999,
          padding: "10px",
          boxSizing: "border-box",
          borderRadius: "0.375rem",
          transitionProperty: "opacity",
          transitionTimingFunction: "ease-in",
          transitionDuration: "0.5s"
        }}>
          <GridLoader size="2px" color="white" width="30px" /> Loading ...
        </Box>
        <DataGrid
          sx={{
            '.MuiTablePagination-select': {
              'background': '#eee',
            },
            '.MuiTablePagination-displayedRows': {
              'marginTop': '1em',
              'marginBottom': '1em'
            },
            '.MuiTablePagination-displayedRows, .MuiTablePagination-selectLabel': {
              'marginTop': '1em',
              'marginBottom': '1em'
            }
          }}
          id="SearchDataGrid"
          className="SearchGridWrap associationTable "
          columnBuffer={2}
          columns={results.colDef}
          columnThreshold={2}
          columnVisibilityModel={columnFilters}
          disableColumnMenu={true}
          hideFooterSelectedRowCount
          loading={tableLoading}
          onCellClick={
            handleTableCellClick ? (event, params, details)=> 
            handleTableCellClick(event, params, details) : (event, params, details) => handleTableCellClickDefault(event, params, details)} // this allows a props handler to override the local handler
          onPaginationModelChange={(e) => handlePageChange(e)}
          pageSizeOptions={[10, 50, 100]}
          pagination
          paginationMode="server"
          rowCount={results.rowCount}
          rows={results.dataRows}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              csvOptions: {fileName: "hubmap_ingest_export",}
            },
            columnsPanel: {
              getTogglableColumns,
            },
          }}
        />
      </Box>
    );
  }

  function renderPreamble() {
    return (
      <Box
        sx={{flexDirection: "column",
          justifyContent: "center",
          marginBottom: 2,}}>
        
        <span className="portal-label text-center" style={{width: "100%", display: "inline-block"}}>{search_title} </span>
          {!search_subtitle &&(
            <Typography align={"center"} variant="subtitle1" gutterBottom >
              Use the filter controls to search for Donors, Samples, Datasets, Data Uploads, Publications, or Collections.<br />
              If you know a specific ID you can enter it into the keyword field to locate individual entities.
            </Typography>
          )}
          {search_subtitle &&(
            <Typography align={"center"} variant="caption" gutterBottom>
              {search_subtitle} <br/>
              If you know a specific ID you can enter it into the keyword field to locate individual entities.

            </Typography>
          )}
          
      </Box>
    );
  }

  function renderGroupField(){
    return (
        <FormControl sx={{width:"100%"}} size="small">
          <Box className="searchFieldLabel" id="SearchLabelGroiup" >
            <GroupsIcon sx={{marginRight:"5px",marginTop:"-4px", fontSize:"1.1em" }} />
            <Typography variant="overline" id="group_label" sx={{fontWeight:"700", color:"#fff", display:"inline-flex"}}> Group | </Typography>  <Typography variant="caption" id="group_label" sx={{color:"#fff"}}>Select a group to filter by:</Typography>
          </Box>
          <Box>
            <Select
              fullWidth
              sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize:"0.9em", width:"100%"}}
              name="group_uuid"
              value={formFilters.group_uuid?formFilters.group_uuid : ""}
              onChange={(event) => handleInputChange(event)}>
              <MenuItem key={0} value="allcom"></MenuItem>
              {allGroups.map((group) => {
                return (
                    <MenuItem sx={{fontSize:"0.8em"}} key={group.uuid} value={group.uuid}>{group.shortName}</MenuItem>
                );
              })}
            </Select>
          </Box>
        </FormControl>
    )
  }
  
  function renderKeywordField(){
    return (
        <FormControl sx={{width:"100%"}} size="small"  >
          <Box className="searchFieldLabel" id="SearchLabelGroiup" >
            <ManageSearchIcon sx={{marginRight:"5px",marginTop:"-4px", fontSize:"1.1em" }} />
            <Typography variant="overline" id="group_label" sx={{fontWeight:"700", color:"#fff", display:"inline-flex"}}> Keyword | </Typography>  <Typography variant="caption" id="group_label" sx={{color:"#fff"}}>Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*</Typography>
          </Box>
          <Box>
            <TextField
              labelid="keywords_label"
              name="keywords"
              id="keywords"
              sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize:"0.9em", width:"100%"}}
              fullWidth
              value={formFilters.keywords?formFilters.keywords : ""}
              onChange={(e) => handleInputChange(e)}/>
          </Box>
        </FormControl>
    )
  }
  
  function renderNewFilterControls() {
    return (

      <Box 
        className="m-0" 
        sx={{
          // borderTopRightRadius: "0px!important",
          // borderTopLeftRadius: "0px!important"
          // borderBottomRightRadius: "0px!important",
          // borderBottomLeftRadius: "0px!important"
        }}>
        {renderPreamble()}
        {errorState && <RenderError error={error} />}
        
        <form
          sx={{width: "100%", padding: "0px"}}
          onSubmit={(e) => {
            handleSearchClick(e);
          }}>
            
          <Grid
            container
            spacing={0}
            sx={{
              textAlign: "left",
              background: "#444a65",
              background: "linear-gradient(180deg, #585E7A ,  #444A65 )",
              width: "100%",
              color: "white",
              padding: "16px",
              border:"1px solid #222831",
              borderBottom:"0px!important",
              borderTopRightRadius: "10px!important",
              borderTopLeftRadius: "10px!important",
              borderBottomRightRadius: "0px!important",
              borderBottomLeftRadius: "0px!important"
            }}>

            <Grid item xs={12} sx={{display: "flex", flexFlow: "row"}}>
              <Grid item xs={6} sx={{padding:"4px"}} >{renderGroupField()}</Grid>
              <Grid item xs={6} sx={{padding:"4px"}} > 
                <CombineTypeSelect
                  formFilters = {formFilters}
                  OrganIcons={OrganIcons}
                  handleInputChange = {(e) => handleInputChange(e)}
                  restrictions = {restrictions}/>
              </Grid>
            </Grid>

            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", marginTop:"16px", padding:"4px"}}>
              {renderKeywordField()}
            </Grid>
            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", margin:"0px", padding:"0px"}}>
              <Typography variant="caption" sx={{marginLeft:"auto", marginRight:"auto", cursor:"pointer"}} onClick ={() => setAdvancedSearch(!advancedSearch)}>
              {advancedSearch ? "Close" : "Enable"} Advanced Search {advancedSearch ? <KeyboardArrowUpIcon /> : <ExpandMoreIcon />}  
              </Typography>
            </Grid>
            
            <Collapse in={advancedSearch}>
              <Grid item xs={12} sx={{display: "flex", flexFlow: "row", marginTop:"16px"}}>
                <Box className="searchFieldLabel" id="SearchLabelGroiup" >
                  <CloudSyncIcon sx={{marginRight:"5px",marginTop:"-4px", fontSize:"1.1em" }} />
                  <Typography variant="overline" id="group_label" sx={{fontWeight:"700", color:"#fff", display:"inline-flex"}}> Status | </Typography>  <Typography variant="caption" id="group_label" sx={{color:"#fff"}}>Select a Status to limit your search to</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sx={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                listStyle: 'none',
                p: 0.5,
                m: 0,
                boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px",
                padding: "8px",
                backgroundColor:"rgb(255, 255, 255)",
                borderRadius: "8px",
                width:"100%"

              }}>
                {renderStatusControls()}
            </Grid>
            </Collapse>

            <Grid cotainer rowSpacing={1} columnSpacing={1} xs={12} sx={{display: "flex", flexFlow: "row", marginTop:"16px", padding:"4px", }}>
              {/* <Grid item xs={2}> */}
                <Button
                  className="m-1"
                  startIcon={<ClearIcon />}
                  sx={{width:"40%", background: "#e0e0e0", borderColor: "rgb(0 6 30)", color: "#AAAAAA",'&:hover': {backgroundColor: "#EAEAEA",}}}
                  size="large"  
                  onClick={(e) => handleClearFilter(e)}>
                  Clear
                </Button>
              <Button 
                className="m-1"
                size="large"
                sx={{width:"70%",}}
                startIcon={<SearchIcon />}
                onClick={(e) => handleSearchClick(e)}
                variant="contained">
                Search
              </Button>
              {/* </Grid>           */}
           </Grid>
          </Grid>
        </form>
      </Box>
    )
  }


  return renderView();

};
