import React,{useEffect,useState,useCallback,useMemo,useReducer,useRef} from "react";
import {DataGrid,GridToolbar,GridColDef} from "@mui/x-data-grid";

// import { DataGrid } from '@material-ui/data-grid';

import {SAMPLE_CATEGORIES} from "../constants";
import {Link} from "react-router-dom";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from '@mui/material/Chip';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ClearIcon from '@mui/icons-material/Clear';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import GroupsIcon from '@mui/icons-material/Groups';
import Collapse from '@mui/material/Collapse';
import GridLoader from "react-spinners/GridLoader";
import SearchIcon from '@mui/icons-material/Search';
import {CombinedWholeEntityOptions,badgeClass} from "./ui/formParts";
import {RenderError} from "../utils/errorAlert";
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import {toTitleCase} from "../utils/string_helper";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_EPICOLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
  COLUMN_DEF_MIXED,
} from "./ui/tableBuilder";
import {api_search2} from "../service/search_api";
import {OrganIcons, EntityIconsBasic} from "./ui/icons"
import {ES_SEARCHABLE_FIELDS} from "../constants";
import { useLocation, useNavigate } from 'react-router-dom';
 
export function NewSearch({
  searchFilters: initialSearchFilters,
  restrictions,
  urlChange,
}){

  // TABLE & FILTER VALUES
  var allGroups = localStorage.getItem("allGroups") ? JSON.parse(localStorage.getItem("allGroups")) : [];
  var [chipSelect, setChipSelect] = useState([]);
  var [pulseMap, setPulseMap] = useState({});
  // rename local state to avoid shadowing the incoming prop 'initialSearchFilters'
  var [searchFiltersState, setSearchFiltersState] = useState(initialSearchFilters);
  var [formFilters, setFormFilters] = useState(
    initialSearchFilters ? 
    initialSearchFilters : {});
  var [page, setPage] = useState(0);
  var [pageSize,setPageSize] = useState(100);
  var [advancedSearch,setAdvancedSearch] = useState(false);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const urlParamsAppliedRef = useRef(false);
  if (initialSearchFilters && Object.keys(initialSearchFilters).length > 0) {
    // if parent provided initial filters, treat like URL-driven initial search
    urlParamsAppliedRef.current = true;
  }

  // TABLE DATA + LOADING: useReducer to update related fields atomically
  const initialSearchState = {
    dataRows: null,
    rowCount: 0,
    colDef: COLUMN_DEF_MIXED,
    loading: true,
  };

  function searchReducer(state, action) {
    switch (action.type) {
      case "SET":
        return { ...state, ...action.payload };
      case "RESET":
        return initialSearchState;
      default:
        return state;
    }
  }

  const [searchState, dispatchSearchState] = useReducer(searchReducer, initialSearchState);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorState] = useState();
  const simpleColumns = ["Donor", "Dataset", "Publication", "Upload", "Collection","EPICollection"];

  function resultFieldSet() {
    var fieldObjects = [];
    var fieldArray = fieldObjects.concat(
      COLUMN_DEF_SAMPLE,
      COLUMN_DEF_COLLECTION,
      COLUMN_DEF_EPICOLLECTION,
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

  // If URL contains search params, prefill form and trigger a search.
  // Listen to location.search so Back/Forward navigation re-applies URL-driven searches.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    try {
      // If the component was explicitly given initialSearchFilters, prefer that
      if (initialSearchFilters && Object.keys(initialSearchFilters).length > 0) return;
      if (!location || !location.search) return;
      const params = new URLSearchParams(location.search);
      const entries = Array.from(params.entries());
      if (!entries || entries.length === 0) return;
      urlParamsAppliedRef.current = true;
      const paramsObj = Object.fromEntries(entries);

      // Populate form fields from URL (map group_uuid allcom -> empty for the form)
      const newForm = { ...formFilters };
      if (paramsObj.keywords) newForm.keywords = paramsObj.keywords;
      if (paramsObj.group_uuid) newForm.group_uuid = paramsObj.group_uuid === 'allcom' ? '' : paramsObj.group_uuid;
      if (paramsObj.entity_type) newForm.entity_type = paramsObj.entity_type;
      if (paramsObj.target_field) newForm.target_field = paramsObj.target_field;

      // status may be repeated or comma-separated
      const statusParams = params.getAll('status');
      if (statusParams && statusParams.length > 0) {
        const statusList = statusParams
          .flatMap((s) => s.split(','))
          .map((s) => s.trim())
          .filter(Boolean);
        if (statusList.length > 0) {
          setChipSelect(statusList);
          paramsObj.status = statusList;
        }
      }

      setFormFilters(newForm);
      // trigger the search effect by setting the searchFiltersState
      setSearchFiltersState(paramsObj);
      // reset pagination to first page
      setPage(0);
      // Do we need to open the Advanced Fields view?
      if(paramsObj.target_field || paramsObj.status){
        setAdvancedSearch(true);
      }
      
    } catch (err) {
      // ignore URL parse errors for now
    }
  }, [location.search]);
  // small stable helper for building columnVisibility model
  const buildColumnFilter = useCallback((arr) => {
    let obj = {};
    arr.forEach(value => {
        obj[value] = false;
    });
    return obj;
  }, []);

  // memoized visibility model for DataGrid columns so we don't recreate the object each render
  const columnVisibilityModel = useMemo(() => {
    const hiddenFields = [
      "created_by_user_displayname",
      "lab_tissue_sample_id",
      "lab_donor_id",
      "specimen_type",
      "organ",
      "registered_doi",
    ];
    if (searchState.colDef !== COLUMN_DEF_MIXED) {
      hiddenFields.push("entity_type");
      hiddenFields.push("sample_category");
    }
    if (searchState.colDef === COLUMN_DEF_MIXED ){
      hiddenFields.push("uuid");
    }
    return buildColumnFilter(hiddenFields);
  }, [searchState.colDef, buildColumnFilter]);

  // memoized csv options object for DataGrid toolbar
  const csvOptions = useMemo(() => ({ fileName: "hubmap_ingest_export" }), []);

  // stable handlers
  const handleTableCellClickDefault = useCallback((params, event, details) => {
    console.debug('%c◉ handleTableCellClickDefault ', 'color:#00ff7b', params, params?.field);
    console.debug('%c◉ details ', 'color:#00ff7b', details);
    console.debug('%c◉ event ', 'color:#00ff7b', event);
    let row = event.hasOwnProperty("row") ? event.row : params.row;
    let field = params.hasOwnProperty("row") ? params.field : event.field;
    if (field === "uuid") return; // skip this field
    if (row) {
      var typeText = row.entity_type.toLowerCase();
      let target = typeText + "/" + row.uuid
      console.debug('%c◉ target ', 'color:#00ff7b', target);
      urlChange(event, target);
    }
  }, [urlChange]);

  const handlePageChange = useCallback((pageInfo) => {
    setPage(pageInfo.page);
    setPageSize(pageInfo.pageSize);
  }, []);

  const onCellClickHandler = useCallback((event, params, details) => {
    return handleTableCellClickDefault(params, event, details);
  }, [handleTableCellClickDefault]);

  useEffect(() => {
    // If URL/initial filters were applied, and we don't yet have searchFiltersState, skip the default search
    console.debug('%c◉ searchFiltersState ', 'color:#00ff7b', searchFiltersState);
    console.debug('%c◉ urlParamsAppliedRef ', 'color:#00ff7b', urlParamsAppliedRef, urlParamsAppliedRef.current);
    if (!searchFiltersState && urlParamsAppliedRef.current) {
      console.debug('%c◉ Init/Url ', 'color:#00ff7b', );
      return;
    }
    var searchFilterParams = searchFiltersState ? searchFiltersState : {  };
    // set loading in reducer so results+loading can be updated together on response
    dispatchSearchState({ type: "SET", payload: { loading: true } });

    // Will run automatically once searchFilters is updated
    // (Hence populating formFilters & converting to searchFilters on click)
    // Let's make sure the casing is right on the entity based fields\
    console.debug('%c◉ searchFilterParams ', 'color:#002AFF', searchFilterParams);
    if (searchFilterParams?.entity_type && searchFilterParams?.entity_type !== "----") {
      let entityTypes = {
        donor: "Donor" ,
        sample: "Sample",
        dataset: "Dataset", 
        upload: "Data Upload",
        publication: "Publication",
        collection: "Collection",
        epicollection: "EPICollection"
      }
      console.debug('%c◉ SEARCHWHAT ', 'color:#002AFF', searchFilterParams, searchFilterParams?.entity_type, searchFiltersState, searchFiltersState?.entityType);
      if (entityTypes.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        // console.debug('%c◉ hasOwnProperty  searchFilterParams.entity_type', 'color:#00ff7b', searchFilterParams.entity_type);
        searchFilterParams.entity_type = toTitleCase(searchFilterParams.entity_type);
      } else if (SAMPLE_CATEGORIES.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        // console.debug('%c◉ has  SAMPLE_CATEGORIES', 'color:#00ff7b', );
        searchFilterParams.sample_category = searchFilterParams.entity_type.toLowerCase();
      } else {
        if(searchFilterParams && searchFilterParams.entityType !=="DonorSample"){
          console.debug('%c◉ searchFilterParams.entityType ', 'color:#00ff7b', searchFilterParams.entityType);
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
    ).then((response) => {
        if(response.error){
          errorReporting(response.error)
        }
        if (response.total > 0 && response.status === 200) {
          let colDefs;
          console.debug('%c◉ simpleColumns', 'color:#F6FF00', simpleColumns);
          console.debug('%c◉ searchFilterParams.entity_type', 'color:#F6FF00', searchFilterParams.entity_type);
          console.debug('%c◉ simpleColumns.includes(searchFilterParams.entity_type) ', 'color:#002AFF', simpleColumns.includes(searchFilterParams.entity_type));
          if(searchFilterParams.entity_type === "Epicollection"){
            searchFilterParams.entity_type = "EPICollection";
          }
          if(simpleColumns.includes(searchFilterParams.entity_type) ){
            colDefs = columnDefType(searchFilterParams.entity_type);
            console.debug('%c◉ colDefs ', 'color:#00ff7b', colDefs, searchFilterParams.entity_type);
          }else if(!searchFilterParams.entity_type || searchFilterParams.entity_type === undefined || searchFilterParams.entity_type === "---"){
            colDefs = COLUMN_DEF_MIXED
          }else{
            colDefs = COLUMN_DEF_MIXED
          }
          // console.debug('%c◉ colDefs ', 'color:#00ff7b', colDefs);
          dispatchSearchState({
            type: "SET",
            payload: {
              dataRows: response.results,
              rowCount: response.total,
              colDef: colDefs,
              loading: false,
            },
          });
        } else if (response.total === 0) {
          dispatchSearchState({
            type: "SET",
            payload: {
              dataRows: response.results,
              rowCount: response.total,
              colDef: COLUMN_DEF_MIXED,
              loading: false,
            },
          });
        } else {
          var errStringMSG = "";
          var errString =response.results.data.error.root_cause[0].type +" | " +response.results.data.error.root_cause[0].reason;
            typeof errString.type === "string"
              ? (errStringMSG = "Error on Search")
              : (errStringMSG = errString);
            setErrorState(true)
            setError(errStringMSG)
            dispatchSearchState({ type: "SET", payload: { loading: false } });
          }
      })
      .catch((error) => {
        dispatchSearchState({ type: "SET", payload: { loading: false } });
        // errorReport(error)
        //props.reportError(error);
        // console.debug("%c⭗ ERROR", "color:#ff005d", error);
      });
      console.debug('%c◉ searchFiltersState ', 'color:#00ff7b', searchFiltersState);
  }, [page, pageSize, searchFiltersState, restrictions]);

  function columnDefType(et) {
    console.debug('%c◉ columnDefType ', 'color:#D0FF00', et );
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
    if (et === "EPICollection") {
      return COLUMN_DEF_EPICOLLECTION;
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
        setFormFilters((prevValues) => ({...prevValues,
          [name]: value,}));
        break;
    }
  }

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
  }

  function renderStatusControls() {
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
        const hoverGlow = (c) => `0 0 4px ${c}44`;
        const activeGlow = (c) => `0 0 4px ${c}99`;
        const isPulsing = !!pulseMap && !!pulseMap[status];
        const sxSelected = {
          // fontWeight: 'bold',
          margin: "2px",
          fontSize: '0.7rem',
          backgroundColor: colorMap[status],
          color: 'white',
          border: baseBorder,
          transition: 'border-color 10ms ease, box-shadow 20ms ease, background-color 20ms cubic-bezier(.2,.9,.3,1)',
          boxShadow: hoverGlow(colorMap[status]),
            '&:hover': {
              boxShadow: `0 0 6px ${colorMap[status]}44`,
              backgroundColor: `${colorMap[status]}44`,
            },
          '&:active': {
            boxShadow: activeGlow(colorMap[status]),
          },
        };
        if (isPulsing) {
          sxSelected.animation = 'chipPulse 30ms ease-out';
          sxSelected['@keyframes chipPulse'] = {
            '0%': { boxShadow: `0 0 6 ${colorMap[status]}00`},
            '60%': { boxShadow: `0 0 6px ${colorMap[status]}88` },
            '100%': { boxShadow: `0 0 6px ${colorMap[status]}55`},
          };
        }
        const sxUnselected = {
          fontSize: '0.7rem',
          margin: "3px",
          backgroundColor: `${colorMap[status]}11`,
          color: colorMap[status],
          border: baseBorder,
          // slower first part when moving toward color
          transition: 'border-color 10ms cubic-bezier(.2,.8,.2,1), box-shadow 30ms cubic-bezier(.2,.8,.2,1), background-color 20ms cubic-bezier(.2,.8,.2,1), color 20ms ease',
          boxShadow: `0 0 4px ${colorMap[status]}44`,
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
            '60%': { boxShadow: `0 0 6px ${colorMap[status]}99`},
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
          backgroundColor: "#444a65",
          background: "linear-gradient(180deg, rgb(88, 94, 122) 0%,  rgb(68, 74, 101) 100%)",
          width: "100%",
          color: "white",
          borderBottomRadius: "0.375rem"
        }}>
        { renderNewFilterControls()}
        {searchState.dataRows && searchState.dataRows.length > 0 && renderTable()}
        {searchState.dataRows && searchState.dataRows.length === 0 && !searchState.loading && (
          <div className="text-center">No records were found using the provided criteria.</div>)}
      </div>
    );
  }

  function renderTable() {
    // inner buildColumnFilter removed - using memoized columnVisibilityModel
    // console.debug('%c◉ columnFilters ', 'color:#00ff7b', searchState.colDef);

    return (
      <Box style={{height: 590, width: "100%" , position: "relative"}}>
        <Box className="sourceShade" sx={{
          opacity: searchState.loading ? 1 : 0,
          backgroundColor: "#444a65",
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
          columns={searchState.colDef}
          columnThreshold={2}
          columnVisibilityModel={columnVisibilityModel}
          disableColumnMenu={true}
          hideFooterSelectedRowCount
          loading={searchState.loading}
          onCellClick={onCellClickHandler}
          onPaginationModelChange={handlePageChange}
          pageSizeOptions={[10, 50, 100]}
          pagination
          paginationMode="server"
          rowCount={searchState.rowCount}
          rows={searchState.dataRows}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              csvOptions
            },
            // columnsPanel: {
            //   getTogglableColumns,
            // },
          }}
        />
      </Box>
    );
  }

  function renderGroupField(){
    return (
      <FormControl sx={{width: "100%"}} size="small">
        <Box className="searchFieldLabel" id="SearchLabelGroiup" >
          <GroupsIcon sx={{marginRight: "5px",marginTop: "-4px", fontSize: "1.1em" }} />
          <Typography variant="overline" id="group_label" sx={{fontWeight: "700", color: "#fff", display: "inline-flex"}}> Group | </Typography>  <Typography variant="caption" id="group_label" sx={{color: "#fff"}}>Select a group to filter by:</Typography>
        </Box>
        <Box>
          <Select
            fullWidth
            sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize: "0.9em", width: "100%"}}
            name="group_uuid"
            value={formFilters.group_uuid?formFilters.group_uuid : ""}
            onChange={(event) => handleInputChange(event)}>
            <MenuItem key={0} value="allcom" sx={{color:"#ddd"}}>All Groups</MenuItem>
            {allGroups.map((group) => {
              return (
                  <MenuItem sx={{fontSize: "0.8em"}} key={group.uuid} value={group.uuid}>{group.shortName}</MenuItem>
              );
            })}
          </Select>
        </Box>
      </FormControl>
    )
  }

  function renderTargetField(){
    const targetOptions = ES_SEARCHABLE_FIELDS.map((f) => {
      const clean = f.replace(/\.keyword$/i, "").replace(/[._]/g, " ");
      return { field: f, title: toTitleCase(clean) };
    });
  return (
      <FormControl sx={{width: "100%"}} size="small">
        <Box className="searchFieldLabel" id="SearchLabelGroup" >
          <TroubleshootIcon sx={{marginRight: "5px",marginTop: "-4px", fontSize: "1.1em" }} />
          <Typography variant="overline" id="group_label" sx={{fontWeight: "700", color: "#fff", display: "inline-flex"}}> Target | </Typography>  <Typography variant="caption" id="group_label" sx={{color: "#fff"}}>Select the field you wish to target:</Typography>
        </Box>
        <Box>
          <Select
            fullWidth
            sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize: "0.9em", width: "100%"}}
            name="target_field"
            id="target_field"
            value={formFilters.target_field?formFilters.target_field : ""}
            onChange={(event) => handleInputChange(event)}>
            <MenuItem key={0} value="">&nbsp;</MenuItem>
            {targetOptions.map((field) => {
              return (
                  <MenuItem sx={{fontSize: "0.8em"}} key={field.field} value={field.field}>{field.title}</MenuItem>
              );
            })}
          </Select>
        </Box>
      </FormControl>
    )
  }

  function renderKeywordField(){
    return (
      <FormControl sx={{width: "100%"}} size="small" >
        <Box className="searchFieldLabel" id="SearchLabelGroiup" >
          <ManageSearchIcon sx={{marginRight: "5px",marginTop: "-4px", fontSize: "1.1em" }} />
          <Typography variant="overline" id="group_label" sx={{fontWeight: "700", color: "#fff", display: "inline-flex"}}> Keyword | </Typography>  <Typography variant="caption" id="group_label" sx={{color: "#fff"}}>Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*</Typography>
        </Box>
        <Box>
          <TextField
            labelid="keywords_label"
            name="keywords"
            id="keywords"
            sx={{backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #ccc", fontSize: "0.9em", width: "100%"}}
            fullWidth
            value={formFilters.keywords?formFilters.keywords : ""}
            onChange={(e) => handleInputChange(e)}/>
        </Box>
      </FormControl>
    )
  }

  function renderEntityIcon(entity_type){
    let icon = EntityIconsBasic(entity_type,"5px")
    return icon;
  }
  
  function renderNewFilterControls() {
    return (

      <Box>
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
              border: "1px solid #222831",
              borderBottom: "0px!important",
              borderTopRightRadius: "10px!important",
              borderTopLeftRadius: "10px!important",
              borderBottomRightRadius: "0px!important",
              borderBottomLeftRadius: "0px!important"
            }}>
            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", paddingLeft: "10px",borderLeft: "1px solid #fff"}}><Typography variant="h3">Search </Typography></Grid>
            <Grid item xs={12} sx={{display: "flex", paddingLeft: "10px", flexFlow: "row", fontSize: "0.9em", borderLeft: "1px solid #fff", alignItems: "end", fontStyle: "italic"}}> 
              <Typography variant="" sx={{ color: "#fff"}}>
                Use the filter controls to search for <Link to={"?entity_type=donor"} className="text-white">Donors</Link>, <Link to={"?entity_type=sample"} className="text-white">Samples</Link>, <Link to={"?entity_type=dataset"} className="text-white">Datasets</Link>, <Link to={"?entity_type=upload"} className="text-white">Data Uploads</Link>, <Link to={"?entity_type=publication"} className="text-white">Publications</Link>, or <Link to={"?entity_type=collection"} className="text-white">Collections</Link>. <br />If you know a specific ID you can enter it into the keyword field to locate individual entities.
                </Typography>
              </Grid>
            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", marginTop: "15px", }}>
              <Grid item xs={6} sx={{padding: "4px"}} >{renderGroupField()}</Grid>
              <Grid item xs={6} sx={{padding: "4px"}} > 
                <CombinedWholeEntityOptions
                  formFilters = {formFilters}
                  OrganIcons={OrganIcons}
                  handleInputChange = {(e) => handleInputChange(e)}
                  restrictions = {restrictions}/>
              </Grid>
            </Grid>
            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", marginTop: "16px", padding: "4px"}}>
              {renderKeywordField()}
            </Grid>
            <Grid item xs={12} sx={{display: "flex", flexFlow: "row", margin: "0px", padding: "0px"}}>
              <Typography variant="caption" sx={{marginLeft: "auto", marginRight: "auto", cursor: "pointer"}} onClick ={() => setAdvancedSearch(!advancedSearch)}>
              {advancedSearch ? "Hide" : "Show"} Advanced Search {advancedSearch ? <KeyboardArrowUpIcon /> : <ExpandMoreIcon />}  
              </Typography>
            </Grid>
            <Collapse in={advancedSearch} sx={{width: "100%"}}>
              <Grid container sx={{display: "flex", marginTop: "16px"}}>
                <Grid item xs={6} sx={{padding: "4px"}}>
                  {renderTargetField()}
                </Grid>
                <Grid item xs={6} sx={{padding: "4px"}}>
                  <Box className="searchFieldLabel" id="SearchLabelGroiup" >
                    <CloudSyncIcon sx={{marginRight: "5px",marginTop: "-4px", fontSize: "1.1em" }} />
                    <Typography variant="overline" id="group_label" sx={{fontWeight: "700", color: "#fff", display: "inline-flex"}}> Status | </Typography>  <Typography variant="caption" id="status_label" sx={{color: "#fff"}}>The Status of the Entity</Typography>
                  </Box>

                  <Box 
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                      listStyle: 'none',
                      p: 0.5,
                      m: 0,
                      boxShadow: "rgba(0, 0, 0, 0.2) 0px 2px 1px -1px, rgba(0, 0, 0, 0.14) 0px 1px 1px 0px, rgba(0, 0, 0, 0.12) 0px 1px 3px 0px",
                      padding: "8px",
                      backgroundColor: "rgb(255, 255, 255)",
                      borderRadius: "8px",
                      border: "thick double solid #ccc",
                      width: "100%"
                    }}>

                    {renderStatusControls()}
                  </Box>
                </Grid>

              </Grid>
                
            </Collapse>

            <Grid container rowSpacing={1} columnSpacing={0} sx={{display: "flex", flexFlow: "row", marginTop: "16px", padding: "4px", minHeight: "60px" }}>
              {/* <Grid item xs={2}> */}
                <Button
                  className="m-1 HBM_DarkButton"
                  startIcon={<ClearIcon />}
                    sx={{
                      width: "40%",
                    }}
                  variant="contained"
                  size="large"  
                  onClick={(e) => handleClearFilter(e)}>
                  Clear
                </Button>
              <Button 
                className="m-1 HBM_DarkBlueButton"
                size="large"
                sx={{width: "70%",}}
                startIcon={<SearchIcon />}
                onClick={(e) => handleSearchClick(e)}
                variant="contained">
                Search
              </Button>
           </Grid>
          </Grid>
        </form>
      </Box>
    )
  }

  function handleClearFilter(e) {
    // Allow ctrl/meta + click to open a fresh search in a new tab (mirrors table behavior)
    if (e && (e.ctrlKey || e.metaKey)) {
      window.open('/newSearch', '_blank');
      return;
    }
    // Reset local form state and push a fresh /newSearch entry so the
    // navigation is recorded in history (useNavigate from react-router).
    // Clear all visible fields back to their defaults
    setFormFilters({ group_uuid: "", entity_type: "DonorSample", keywords: "" });

    // Clear the URL (remove any search params) and record navigation
    navigate('/newSearch');

    // Ensure URL-driven guard won't block the default search and reset paging
    urlParamsAppliedRef.current = false;
    setPage(0);

    // Setting searchFiltersState to null causes the main effect to run the
    // default search (it treats falsy state as the default {entity_type: 'DonorSample'})
    setSearchFiltersState(null);
  }

  function handleSearchClick(event,reset) {
    // console.debug('%c◉  handleSearchClick ', 'color:#00ff7b', info);
    if(event){event.preventDefault()}
    dispatchSearchState({ type: "SET", payload: { loading: true } });
    setPage(0)
    console.debug('%c⊙handleSearchClick', 'color:#5789ff;background: #000;padding:200', formFilters );
    if(reset){
      entityType = "DonorSample";
      params["entity_type"] = "DonorSample";
    }
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

    let params = {}; // Will become the searchFilters
    var url = new URL(window.location); // Only used outside in basic / homepage Mode

    if (keywords) {
      params["keywords"] = keywords.trim();
      url.searchParams.set("keywords", keywords);
    } else {
      url.searchParams.delete("keywords");
    }
    // If the user selected a specific target field for keyword search, include it
    if (formFilters.target_field) {
      params["target_field"] = formFilters.target_field;
      url.searchParams.set("target_field", formFilters.target_field);
    } else {
      url.searchParams.delete("target_field");
    }
    if (group_uuid && group_uuid !== "All Components") {
      params["group_uuid"] = group_uuid;
      url.searchParams.set("group_uuid", group_uuid);
    } else {
      url.searchParams.delete("group_uuid");
    }
    
    if (entityType && entityType !== "----" && entityType !== "DonorSample") {
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
    window.history.pushState({}, "", url);
    document.title = "HuBMAP Ingest Portal Search"
    // console.debug('%c◉ params ', 'color:#00ff7b', params);
    setSearchFiltersState(params);
  };

  return renderView();

};
