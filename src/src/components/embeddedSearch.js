import React,{useEffect,useState,useMemo} from "react";
import {DataGrid,GridToolbar} from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import {SAMPLE_CATEGORIES} from "../constants";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import GridLoader from "react-spinners/GridLoader";
import {CombinedTypeOptions} from "./ui/formParts";
import {RenderError} from "../utils/errorAlert";
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

export function EmbeddedSearch({  
  searchTitle,
  searchSubtitle,
  searchFilters,
  restrictions,
  urlChange,
  modecheck,
  setBulkError,
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
  var [searchFilters, setSearchFilters] = useState();
  var [formFilters, setFormFilters] = useState(
    searchFilters ? 
    searchFilters : {});
  var [page, setPage] = useState(0);
  var [pageSize,setPageSize] = useState(100);
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

  // Memoized helpers to avoid recreating objects/functions passed into DataGrid
  const colDefDep = results ? results.colDef : null;
  const hiddenFields = useMemo(() => {
    const base = [
      "created_by_user_displayname",
      "lab_tissue_sample_id",
      "lab_donor_id",
      "specimen_type",
      "organ",
      "registered_doi",
    ];
    const hf = [...base];
    if (colDefDep && colDefDep !== COLUMN_DEF_MIXED) {
      hf.push("entity_type");
    }
    if (colDefDep && colDefDep === COLUMN_DEF_MIXED && (!modecheck || modecheck !== "Source")) {
      hf.push("uuid");
    }
    return hf;
  }, [colDefDep, modecheck]);

  const columnFilters = useMemo(() => {
    const obj = {};
    hiddenFields.forEach((value) => {
      obj[value] = false;
    });
    return obj;
  }, [hiddenFields]);

  const getTogglableColumns = useMemo(() => {
    return (columns) => columns.filter((column) => !hiddenFields.includes(column.field)).map((column) => column.field);
  }, [hiddenFields]);

  const csvOptions = useMemo(() => ({ fileName: "hubmap_ingest_export" }), []);


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

  useEffect(() => {
    var searchFilterParams = searchFilters ? searchFilters : { entity_type: "DonorSample" };
    setTableLoading(true);
    if (searchFilterParams?.entity_type && searchFilterParams?.entity_type !== "----") {
      let entityTypes = {
        donor: "Donor" ,
        sample: "Sample",
        dataset: "Dataset", 
        upload: "Data Upload",
        publication: "Publication",
        collection: "Collection"
      }
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
        console.debug('%c◉ Error on Search ', 'color:#C800FF', response.error);
        setErrorState(true)
        setError(response.error)
        setTableLoading(false);
      }
      if (response.total > 0 && response.status === 200) {
        let colDefs;
        if(simpleColumns.includes(searchFilterParams.entity_type) ){
          colDefs = columnDefType(searchFilterParams.entity_type);
        }else if(!searchFilterParams.entity_type || searchFilterParams.entity_type === undefined || searchFilterParams.entity_type === "---"){
          colDefs = COLUMN_DEF_MIXED
        }else{
          colDefs = COLUMN_DEF_SAMPLE
        }
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
    });
  }, [page, pageSize, searchFilters, restrictions]);

  function handlePageChange(pageInfo) {
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
    // console.log("Inner Search Table handleTableCellClick", params)
    if (params.field === "uuid") return; // skip this field
    if (params.hasOwnProperty("row")) {
      var typeText = params.row.entity_type.toLowerCase();
      urlChange(typeText + "/" + params.row.uuid);
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
    if(event){event.preventDefault()}
    setTableLoading(true);
    setPage(0)
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
    if (keywords) {
      params["keywords"] = keywords.trim();
    } 
    if (group_uuid && group_uuid !== "All Components") {
      params["group_uuid"] = group_uuid;
    } 
    if (entityType && entityType !== "----") {
      params["entity_type"] = entityType;
    } 
   setSearchFilters(params);
  };

  function renderView() {
    return (
      <div style={{ width: "100%", textAlign: "center"}}>
        {/* {renderFilterControls()} */}
        { renderFilterControls()}
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
    }    
    if (results.colDef === COLUMN_DEF_MIXED && (
      !modecheck || 
      modecheck !== "Source")) {
      hiddenFields.push("uuid",)
    }

    // use memoized columnFilters and getTogglableColumns defined at component scope
    console.debug('%c◉ columnFilters ', 'color:#00ff7b', results.colDef);

    return (
      <div style={{height: 590, width: "100%" }}>
        <Box className="sourceShade" sx={{
          opacity: tableLoading ? 1 : 0,
          backgroundColor: "#444a65",
          background: "linear-gradient(180deg, rgba(88, 94, 122, 1) 0%,  rgba(68, 74, 101, 1) 100%)",
          width: "100%",
          maxWidth: "1266px",
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
              csvOptions: csvOptions,
            },
            columnsPanel: {
              getTogglableColumns,
            },
          }}
        />
      </div>
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

  function renderFilterControls() {
    return (
      <div className="m-2">
        {renderPreamble()}
        {errorState && <RenderError error={error} />}
        <form
          onSubmit={(e) => {
            handleSearchClick(e);
          }}>
        {/* <FormControl sx={{ m:1, minWidth:120 }}> */}

          <Grid
            container
            spacing={3}
            sx={{display: "flex",justifyContent: "flex-start",textAlign: "left", marginBottom: "36px",}}>
            <Grid item xs={6}>
            <FormControl sx={{ width: "100%", marginTop: "26px", display: "block" }} >
              <InputLabel htmlFor="group_uuid" id="group_label">Group</InputLabel>
              <Select
                native 
                fullWidth
                labelid="group_label"
                id="group_uuid"
                name="group_uuid"
                label="Group"
                value={formFilters.group_uuid?formFilters.group_uuid : ""}
                onChange={(event) => handleInputChange(event)}>
                <option value="allcom"></option>
                {allGroups.map((group, index) => {
                  return (
                    <option key={index + 1} value={group.uuid}>
                      {group.shortName}
                    </option>
                  );
                })}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <InputLabel htmlFor="entity_type" id="entity_type_label">Type</InputLabel>
              <Select
                native 
                fullWidth
                labelid="entity_type_label"
                name="entity_type"
                id="entity_type"
                label="Type"
                value={formFilters.entity_type}
                onChange={(e) => handleInputChange(e)}
                disabled={restrictions && restrictions.entityType?true:false}>
                <CombinedTypeOptions />
                </Select>
            </Grid>
            <Grid item xs={12}>
            <InputLabel htmlFor="keywords" id="keywords_label">Keywords</InputLabel>
            <TextField
              labelid="keywords_label"
              name="keywords"
              id="keywords"
              helperText="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
              // placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
              fullWidth
              value={formFilters.keywords?formFilters.keywords : ""}
              onChange={(e) => handleInputChange(e)}/>
              
            </Grid>
            <Grid item xs={2}></Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                color="primary"
                variant="contained"
                size="large"
                onClick={(e) => handleSearchClick(e)}>
                Search
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={(e) => handleClearFilter(e)}>
                Clear
              </Button>
            </Grid>

            <Grid item xs={2}></Grid>
          </Grid>

          {/* </FormControl> */}
        </form>
      </div>
    );
  }

  return renderView();

};
