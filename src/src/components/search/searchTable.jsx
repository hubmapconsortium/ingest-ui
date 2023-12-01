import React,{useEffect,useState} from "react";
import {DataGrid,GridToolbar} from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import {ENTITY_TYPES,SAMPLE_CATEGORIES} from "../../constants";

import LinearProgress from "@material-ui/core/LinearProgress";
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
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
} from "./table_constants";
import {api_search2} from "../../service/search_api";

export const RenderSearchTable = (props) => {
  var [search_title] = useState(props.search_title ? props.search_title : [""]);

  // TABLE & FILTER VALUES
  var [allGroups] = useState(props.allGroups ? props.allGroups : []);
  var [entityTypeList] = useState(props.allTypes ? props.allTypes : []);
  var [formFilters, setFormFilters] = useState(props.searchFilters ? props.searchFilters : {});
  var [searchFilters, setSearchFilters] = useState(props.searchFilters ? props.searchFilters : {});
  // var [formFilters, setFormFilters] = useState(props.formFilters ? props.formFilters : {});
  var [page, setPage] = useState(0);
  var [pageSize] = useState(100);

  // TABLE DATA
  var [results, setResults] = React.useState({
    dataRows:null,
    rowCount:0,
    colDef:  COLUMN_DEF_SAMPLE,
  });

  //  LOADERS
  var [loading, setLoading] = useState(true);
  var [tableLoading, setTableLoading] = useState(true);
  var [filtersLoading, setFiltersLoading] = useState(true);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorState] = useState();
  
  // PROPS
  const {data, columns} = props;
  const urlChange = props.urlChange;

  function resultFieldSet() {
    var fieldObjects = [];
    var fieldArray = fieldObjects.concat(
      COLUMN_DEF_SAMPLE,
      COLUMN_DEF_COLLECTION,
      COLUMN_DEF_DATASET,
      COLUMN_DEF_UPLOADS,
      COLUMN_DEF_DONOR
    );
    const unique = [...new Set(fieldArray.map((item) => item.field))];
    return unique;
  }
  function errorReporting(error){
    console.debug('%c⭗errorReporting', 'color:#ff005d', error );
  }
  // var errorReport = props.errorReport? props.errorReport : errorReporting;
  

  useEffect(() => {

    setTableLoading(true);
    // Will run automatically once searchFilters is updated
    // (Hence populating formFilters & converting to searchFilters on click)
    console.debug('%c⊙PageSizeChange', 'color:#00ff7b', page);
    var fieldSearchSet = resultFieldSet();
    api_search2(
      searchFilters,
      JSON.parse(localStorage.getItem("info")).groups_token,
      page * pageSize,
      100,
      fieldSearchSet,
      "newTable"
    )
      .then((response) => {
        setTableLoading(false);
        console.debug('%c⊙useEffect Search', 'color:rgb(0 140 255)',  response.total, response.results );
        if (response.total > 0 && response.status === 200) {
          setResults({
            dataRows:response.results,
            rowCount:response.total,
            colDef:  columnDefType(response.results[0].entity_type),
          });
        } else if (response.total === 0) {
          setResults({
            dataRows:response.results,
            rowCount:response.total,
            colDef:  COLUMN_DEF_SAMPLE,
          });
        } else {
          var errStringMSG = "";
          var errString =response.results.data.error.root_cause[0].type +" | " +response.results.data.error.root_cause[0].reason;
            typeof errString.type === "string"
              ? (errStringMSG = "Error on Search")
              : (errStringMSG = errString);
            setErrorState(true)
            setError(errStringMSG)
          }
      })
      .catch((error) => {
        setTableLoading(false);
        // errorReport(error)
        props.reportError(error);
        console.debug("%c⭗ ERROR", "color:#ff005d", error);
      });
  }, [page, pageSize, searchFilters]);


  useEffect(() => {
    if( (allGroups && allGroups.length>0) && (entityTypeList && entityTypeList.length>0) ){
      setFiltersLoading(false);
    }
  }, [allGroups,entityTypeList]);

  // const handleSortModelChange = useCallback((sortModel) => {
  //   setSortOrder(sortModel[0].sort);
  // }, []);
// Probably dont need since state updates it 
  // function handleResponse(response) {
  //   setTableLoading(false);
  //   console.debug('%c⊙ handleResponse', 'color:rgb(0 140 255)', response,  response.total, response.results );
  //   if (response.total > 0 && response.status === 200) {
  //     setResults({
  //       dataRows:response.results,
  //       rowCount:response.total,
  //       colDef:  columnDefType(response.results[0].entity_type),
  //     });
  //   } else if (response.total === 0) {
  //     console.debug('%c⊙', 'color:#00ff7b', "NORES" );
  //     setResults({
  //       dataRows:response.results,
  //       rowCount:response.total,
  //       colDef:  COLUMN_DEF_SAMPLE,
  //     });
  //   } else {
  //     var errStringMSG = "";
  //     var errString =response.results.data.error.root_cause[0].type +" | " +response.results.data.error.root_cause[0].reason;
  //       typeof errString.type === "string"
  //         ? (errStringMSG = "Error on Search")
  //         : (errStringMSG = errString);
  //       setErrorState(true)
  //       setError(errStringMSG)
  //     }
  // }

  function handlePageChange(pageInfo) {
    console.debug("%c⭗", "color:#ff005d", "AAAAAAAAAAAAAAAAAAA", pageInfo);
    // var currentPage = page;
    // var nextPage = page + 1;
    setPage(pageInfo.page);
    // prepQueryParams();
  }

  
  function columnDefType(et) {
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
    return COLUMN_DEF_SAMPLE;
  }

  function handleInputChange(e) {
    // Values for filtering the table data are set here
    const {name, value } = e.target;
    console.debug("%c⊙", "color:#00ff7b", "HandleINputChange", name, value, e);
    switch (name) {
      case "group_uuid":
        if (value !== "All Components" && value !== "allcom") {
          setFormFilters((prevValues) => ({...prevValues,
            group_uuid:value,}));
        } else {
          setFormFilters((prevValues) => ({...prevValues,
            group_uuid:"",}));
        }
        break;
      case "entity_type":
        if (value !== "---") {
          setFormFilters((prevValues) => ({...prevValues,
            entity_type:value}));
        } else {
          setFormFilters((prevValues) => ({...prevValues,
            entity_type:"",}));
        }
        // We only care about type deliniaton for search back end / searchFilters
        // Keep em grouped up in formFilters as the val to the One dropdown 
        // if (ENTITY_TYPES.hasOwnProperty(value)) {
          // typeParam["entity_type"] = toTitleCase(value);
        //   setformFilters((prevValues) => ({...prevValues,
        //     entity_type:toTitleCase(value),}));
        // } else if (SAMPLE_CATEGORIES.hasOwnProperty(value)) {
          // typeParam["sample_category"] = value;
        //   setformFilters((prevValues) => ({...prevValues,
        //     sample_category:value,}));
        // } else {
          // typeParam["organ"] = value;
        //   setformFilters((prevValues) => ({...prevValues,
        //     organ:value,}));
        // }
        break
      case "keywords":
        setFormFilters((prevValues) => ({...prevValues,
          keywords:value,}));
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
      group_uuid:"",
      entity_type:"",
      keywords:""
    })
    setSearchFilters({
      group_uuid:"allcom",
      entity_type:"---",
      keywords:""
    })
  }
        
  function handleSearchButtonClick(event) {
    event.preventDefault();
    handleSearchClick(event);
  }
        
  function handleSearchClick(event) {
    console.debug('%c⊙handleSearchClick', 'color:#5789ff;background: #000;padding:200', formFilters );
    // handle this in the function component now 
    var group_uuid = formFilters.group_uuid;
    var entityType = formFilters.entity_type;
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
        params["keywords"] = keywords;
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
      if (entityType && entityType !== "----") {
        console.debug('%c⊙', 'color:#00ff7b', entityType );
        url.searchParams.set("entity_type", entityType);
        if (ENTITY_TYPES.hasOwnProperty(entityType.toLowerCase())) {
          console.debug('%c⊙ Entity', 'color:#00ff7b' );
          params["entity_type"] = toTitleCase(entityType);
        } else if (SAMPLE_CATEGORIES.hasOwnProperty(entityType.toLowerCase())) {
          console.debug('%c⊙ Sample', 'color:#00ff7b' );
          params["sample_category"] = entityType.toLowerCase();
        } else {
          console.debug('%c⊙ Organ', 'color:#00ff7b' );
          params["organ"] = entityType.toUpperCase();
        }
      } else {
        url.searchParams.delete("entity_type");
      }
      console.debug('%c⊙SAMPLE_CATEGORIES', 'color:#00ff7b', SAMPLE_CATEGORIES.hasOwnProperty(entityType.toLowerCase()),entityType,SAMPLE_CATEGORIES );
      // If we're not in a special mode, push URL to window
      if (!props.modecheck) {
        window.history.pushState({}, "", url);
      }


    // Since useEffect is watching searchFilters, 
    // maybe we can just set it here and it'll search on its own?
    setSearchFilters(params);
    console.debug('%c⊙ searchFilters', 'color:#00ff7b', searchFilters);
  };


  function renderView() {
    //console.debug("%c⊙", "color:#00ff7b", "RENDERVIEW", results.dataRows, results.colDef);
    return (
      <div style={{ width:"100%", textAlign:"center"}}>
        {/* {renderFilterControls()} */}
        {!filtersLoading && renderFilterControls()}
        {filtersLoading && <GridLoader/>}
        {tableLoading && <GridLoader/>}
        {!tableLoading && results.dataRows && results.dataRows.length > 0 && renderTable()}
        {results.dataRows && results.dataRows.length === 0 && !tableLoading && (
          <div className="text-center">No record found.</div>
        )}
      </div>
    );
  }

  function renderGroupOptions() {
    allGroups.map((group, index) => {
      //console.debug("%c⊙", "color:#00ff7b", "group", group.shortName);
      return (
        <option key={index} value={group.uuid}>
          {group.shortname}
        </option>
      );
    });
  }

  function renderLoadingBar() {
    if (!page > 0) {
      return (
        <div>
          <LinearProgress />
        </div>
      );
    }
  }

  function renderTable() {
    return (
      <div style={{height:590, width:"100%" }}>
        <DataGrid
          rows={results.dataRows}
          columns={results.colDef}
          disableColumnMenu={true}
          columnBuffer={2}
          columnThreshold={2}
          pageSizeOptions={[100]}
          pagination
          slots={{ toolbar:GridToolbar }}
          slotProps={{toolbar:{csvOptions:{fileName:"hubmap_ingest_export",},},}}
          hideFooterSelectedRowCount
          rowCount={results.rowCount}
          paginationMode="server"
          onPaginationModelChange={(e) => handlePageChange(e)}
          // onPageChange={() => handlePageChange()}
          // onPageChange={(newPage) => setPage(newPage)}
          // onPageSizeChange={(page) => handlePageSizeSelection(page)}
          loading={tableLoading}
          onCellClick={props.select ? props.select() : (e) => handleTableCellClick(e)} // this allows a props handler to override the local handler
        />
      </div>
    );
  }

  function renderPreamble() {
    return (
      <Box
        sx={{flexDirection: "column",
          justifyContent:"center",}}>
        <Typography
          component={"h1"}
          variant={"h4"}
          fontWeight={500}
          align={"center"}>
          {search_title}
        </Typography>

        <Typography align={"center"} variant="subtitle1" gutterBottom>
          Use the filter controls to search for Donors, Samples, Datasets, Data
          Uploads, Publications, or Collections. <br />
          If you know a specific ID you can enter it into the keyword field to
          locate individual entities.
        </Typography>
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
            handleSearchButtonClick(e);
          }}>
        {/* <FormControl sx={{ m:1, minWidth:120 }}> */}

          <Grid
            container
            spacing={3}
            pb={3}
            alignItems="center"
            sx={{display:       "flex",
              justifyContent:"flex-start",}}>
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
                // defaultValue={formFilters.entity_type?formFilters.entity_type : ""}
                onChange={(e) => handleInputChange(e)}>
                <option value="---">---</option>
                {entityTypeList.map((optgs, index) => {
                  console.debug('%c⊙', 'color:#00ff7b', optgs, index );
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
                onClick={(e) => handleSearchButtonClick(e)}>
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
  // if (!loading ) {
  // //console.debug("Loaded!");
  //   return (
  //     renderView()
  //   )
  // }else{
  //   return (
  //     <div className="card-body ">
  //       <div className="loader">Loading...</div>
  //     </div>
  //   );
  // }
};
