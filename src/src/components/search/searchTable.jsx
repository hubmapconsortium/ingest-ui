import React,{useEffect,useState} from "react";
import {DataGrid,GridToolbar,GridColDef} from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import {SAMPLE_CATEGORIES} from "../../constants";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';

import {GridLoader} from "react-spinners";
import {RenderError} from "../../utils/errorAlert";
import {toTitleCase} from "../../utils/string_helper";
import {combineTypeOptionsComplete} from "../ui/formParts";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
  COLUMN_DEF_MIXED,
} from "./table_constants";
import {api_search2} from "../../service/search_api";

export const RenderSearchTable = (props) => {
  var [search_title] = useState(props.searchTitle ? props.searchTitle : "Search");
  var [search_subtitle] = useState(props.searchSubtitle ? props.searchSubtitle : null);

  // TABLE & FILTER VALUES
  var [allGroups] = useState(props.allGroups ? props.allGroups : []);
  // var [allGroups] = useState(props.allGroups ? props.allGroups : []);
  var [entityTypeList, setEntityTypeList] = useState(props.allTypes ? props.allTypes : []);
  var [formFilters, setFormFilters] = useState(props.searchFilters ? props.searchFilters : {});
  // var [searchFilters, setSearchFilters] = useState();
  var [searchFilters, setSearchFilters] = useState(props.searchFilters ? props.searchFilters : {});
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
  // var [filtersLoading, setFiltersLoading] = useState(false);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorState] = useState();
  
  // PROPS
  const restrictions = props.restrictions ? props.restrictions : null;
  const urlChange = props.urlChange;
  // Cant reach many hooks like useLocation since we're wrapped in a class
  var queryParams = props.packagedQuery?props.packagedQuery : null
  
  const simpleColumns = ["Donor", "Dataset", "Publication", "Upload", "Collection"];

  useEffect(() => {
    console.debug('%c⊙ CURRENT QUERY PARAMS:', 'color:#00ff7b', queryParams );
    var formQueries = {};
    console.debug('%c◉ props.modecheck ', 'color:#000;background:#00ff7b', props.modecheck);
    if(props.modecheck === "Source") {
      // We dont want it to start with a search on Samples, 
      // No search till the user clicks, ensures Restrictions aren't 
      // overridden by initial loads/reloads
      // document.title = ("HuBMAP Ingest Portal "); 
    }else{
      // If we're Modeless, we also want to ditch any restrictions
      // and make sure, till we can revisit all this, that the Fresh search Starts Fresh
      console.debug('%c◉ MODELESS ', 'color:#00ff7b', );
      // setEntityTypeList(combineTypeOptionsComplete());
      document.title = ("HuBMAP Ingest Portal ");
      if(queryParams){
        var queryTitle = "HubMAP Ingest Portal Search: ";
        if(queryParams.entity_type && queryParams.entity_type!==null){
          formQueries.entity_type = queryParams.entity_type
          queryTitle += "Type: "+queryParams.entity_type + "";
        }
        if(queryParams.keywords && queryParams.keywords!==null){
          formQueries.keywords = queryParams.keywords;
          queryTitle += "Keywords: "+queryParams.keywords + "";
        }
        if(queryParams.group_uuid && queryParams.group_uuid!==null){
          formQueries.group_uuid = queryParams.group_uuid;
          queryTitle += "Group: "+queryParams.group_uuid + "";
        }
        if(formQueries.length>0){
          document.title = "HuBMAP Ingest Portal | Search: "+queryTitle + ""
        }
        console.debug('%c⊙ useEffect formQueries', 'color:#FF004C', queryParams.entity_type,formQueries );
        var queryLength = Object.keys(formQueries).length
        console.debug('%c⊙', 'color:#00ff7b', "FORM QUERY USEFFECT", formQueries,queryLength );
        setFormFilters(formQueries);
        if(queryLength>0){
          console.debug("Setting search Filters from URL",formQueries);
          setSearchFilters(formQueries);
          // handleSearchClick();
        }// setSearchFilters(searchQueries);
      }
    }

    // If we're on the main home page, re-set the Dropdown Values
    // Using modecheck causes re-renders/crashing, 
    // I think because we're the child of a Class Component  
    let url = new URL(window.location.href);
    if(url.pathname === "/"){
      console.debug('%c◉ HOMEPAGE ', 'color:#FFBF00');
      // setEntityTypeList(combineTypeOptionsComplete());
    }
  }, [queryParams,props.modecheck]);

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
    console.debug('%c⭗errorReporting', 'color:#ff005d', error );
  }

  useEffect(() => {
    var searchFilterParams = searchFilters;
    setTableLoading(true);
    console.debug("useEffect loadTable");
    console.debug('%c⊙ searchFilters: ', 'color:#00ff7b', searchFilterParams );
    // Lets just reset this dang thing then set again with proper filters later
    // setEntityTypeList(combineTypeOptionsComplete());

    // Will run automatically once searchFilters is updated
    // (Hence populating formFilters & converting to searchFilters on click)
    // Let's make sure the casing is right on the entity based fields\
    if (searchFilterParams.entity_type && searchFilterParams.entity_type !== "----") {
      // var entityType = searchFilterParams.entity_type;
      // console.debug('%c◉ entityType ', 'color:#00ff7b', entityType);
      let entityTypes = { // @TODO: Find out why the imported ENTITY_TYPES is corrupted/truncated
        donor: "Donor" ,
        sample: "Sample",
        dataset: "Dataset", 
        upload: "Data Upload",
        publication: "Publication",
        collection: "Collection"
      }
     
      if (entityTypes.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        searchFilterParams.entity_type = toTitleCase(searchFilterParams.entity_type);
      } else if (SAMPLE_CATEGORIES.hasOwnProperty(searchFilterParams.entity_type.toLowerCase())) {
        searchFilterParams.sample_category = searchFilterParams.entity_type.toLowerCase();
      } else {
        // Coughs on Restricted Source Selector for EPICollections
        searchFilterParams.organ = searchFilterParams.entity_type.toUpperCase();
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
          console.debug('%c◉ Error on Search ', 'color:#ff005d', response.error);
          errorReporting(response.error)
        }
        console.debug('%c◉ searchFilterParams ', 'color:#00d184', searchFilterParams);

        console.debug('%c⊙useEffect Search', 'color:#008CFF', response.total, response.results );
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
          console.debug('%c◉ colDefs ', 'color:#00ff7b', colDefs);
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
        console.debug("%c⭗ ERROR", "color:#ff005d", error);
      });
  }, [page, pageSize, searchFilters, restrictions]);

  function handlePageChange(pageInfo) {
    // console.debug("%c⭗", "color:#ff005d", "AAAAAAAAAAAAAAAAAAA", pageInfo);
    setPage(pageInfo.page);
    setPageSize(pageInfo.pageSize);
  }
  
  function columnDefType(et) {
    console.debug('%c◉ columnDefType ', 'color:#00ff7b', et );
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
  
  function handleTableCellClick(params) {
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
    // console.debug('%c◉  handleSearchClick ', 'color:#00ff7b', info);
    if(event){event.preventDefault()}
    setTableLoading(true);
    setPage(0)
    console.debug('%c⊙handleSearchClick', 'color:#5789ff;background: #000;padding:200', formFilters );
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
      console.debug('%c◉ entityType ', 'color:#2600FF', entityType);
      if (entityType && entityType !== "----") {
        console.debug('%c⊙', 'color:#00ff7b', "entityType fiound", entityType );
        params["entity_type"] = entityType;
        url.searchParams.set("entity_type", entityType);
      } else {
        console.debug('%c⊙', 'color:#00ff7b', "entityType NOT fiound" );
        url.searchParams.delete("entity_type");
      } 
      
      // If we're not in a special mode, push URL to window
      if (!props.modecheck) {
        console.debug("%c⊙SETTING URL: ", "color:#FFf07b", url, params);
        window.history.pushState({}, "", url);
        document.title = "HuBMAP Ingest Portal Search"
      }
    // Since useEffect is watching searchFilters, 
    // maybe we can just set it here and it'll search on its own?
    console.debug('%c⊙ searchFilters', 'color:#00ff7b', params);
    // We should apply restrictions here instead
    setSearchFilters(params);
  };

  // function renderGridLoader() {
  //   // So we can keep the 
  // }

  function renderView() {
    //console.debug("%c⊙", "color:#00ff7b", "RENDERVIEW", results.dataRows, results.colDef);
    return (
      <div style={{ width: "100%", textAlign: "center"}}>
        {/* {renderFilterControls()} */}
        { renderFilterControls()}
        {/* {filtersLoading && <GridLoader/>} */}
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
      "specimen_type",
      "organ",
      "registered_doi",
    ];

    if (results.colDef !== COLUMN_DEF_MIXED) {
      hiddenFields.push("entity_type",)
    }    
    if (results.colDef === COLUMN_DEF_MIXED && (!props.modecheck || props.modecheck !== "Source")) {
      hiddenFields.push("uuid",)
    }

    function buildColumnFilter(arr) {
      let obj = {};
      arr.forEach(value => {
          obj[value] = false;
      });
      return obj;
    }
    var columnFilters = buildColumnFilter(hiddenFields)
    
    const getTogglableColumns = (columns: GridColDef[]) => {
      return columns
        .filter((column) => !hiddenFields.includes(column.field))
        .map((column) => column.field);
    };

    return (
      <div style={{height: 590, width: "100%" }}>
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
          columnBuffer={2}
          columns={results.colDef}
          columnThreshold={2}
          columnVisibilityModel={columnFilters}
          disableColumnMenu={true}
          hideFooterSelectedRowCount
          loading={tableLoading}
          onCellClick={props.handleTableCellClick ? (e)=> props.handleTableCellClick(e) : (e) => handleTableCellClick(e)} // this allows a props handler to override the local handler
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
            sx={{display: "flex",justifyContent: "flex-start",textAlign: "left"}}>
            <Grid item xs={6}>
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
                <option value="allcom">All Components</option>
                {allGroups.map((group, index) => {
                  return (
                    <option key={index + 1} value={Object.values(group)[1]}>
                      {Object.values(group)[0]}
                    </option>
                  );
                })}
                </Select>
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
                disabled={props.restrictions && props.restrictions.entityType?true:false}>
                <option value="---">---</option>
                {entityTypeList.map((optgs, index) => {
                  // console.debug('%c⊙', 'color:#00ff7b', optgs, index );
                  return (
                    <optgroup
                    key={index}
                    label="____________________________________________________________">
                      {Object.entries(optgs).map((op, index) => {
                        return (
                          <option key={op[0]} value={op[0]}>
                            {op[1]}
                          </option>
                        );
                      })}
                    </optgroup>
                  );
                })}
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
