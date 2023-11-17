import React, { useEffect, useState,useCallback  } from "react";
// import { withRouter } from 'react-router-dom';
import { useQuery } from "react-query";
import {DataGrid, GridToolbar} from '@mui/x-data-grid';
// import { DataGrid } from '@material-ui/data-grid';

import LinearProgress from '@material-ui/core/LinearProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import {GridLoader} from 'react-spinners';
import {RenderError} from '../../utils/errorAlert';
import {ErrBox} from "../../utils/ui_elements";
import { toTitleCase } from "../../utils/string_helper";  

import { SAMPLE_TYPES, ENTITY_TYPES, SAMPLE_CATEGORIES } from "../../constants";
import { ubkg_api_get_organ_type_set } from "../../service/ubkg_api";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
} from "./table_constants";
import {
  api_search2,
  search_api_search_group_list,
} from "../../service/search_api";
import {
  ingest_api_users_groups,
  ingest_api_all_user_groups,
  ingest_api_allowable_edit_states,
  ingest_api_all_groups,
} from "../../service/ingest_api";
import { entity_api_get_entity } from "../../service/entity_api";

export const RenderSearchTable = (props) => {
  var [isAuthenticated, setIsauthenticated] = useState(
    props.isAuthenticated ? props.isAuthenticated : [""]
  );
  var [search_title, setSearch_Title] = useState(
    props.search_title ? props.search_title : [""]
  );
  var [rlc, setRLC] = useState(0);

  // TABLE & FILTER VALUES
  var [allGroups, setAllgroups] = useState(props.allGroups ? props.allGroups : []);
  var [entityTypeList, setEntityTypeList] = useState(props.allTypes ? props.allTypes : []);
  var [searchFilters, setSearchFilters] = useState(props.searchFilters ? props.searchFilters : {});
  // var [colDef, setColDef] = useState(COLUMN_DEF_SAMPLE);
  var [page, setPage] = useState(0);
  var [pageSize, setPageSize] = useState(100);
  var [sortOrder, setSortOrder] = useState("asc");
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 25,
    page: 0,
  });

  // TABLE DATA
  var [dataRows, setDataRows] = useState(props.data ? props.data : null);
  var [rowCount, setRowCount] = React.useState(10000);
  var [results, setResults] = React.useState({
    dataRows:null,
    rowCount:0,
    colDef:COLUMN_DEF_SAMPLE,
  });

  //  LOADERS
  var [loading, setLoading] = useState(true);
  var [dataLoading, setDataLoading] = useState(true);
  var [tableLoading, setTableLoading] = useState(true);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorstate] = useState();
  var [errorHandler, setErrorHandler] = useState({
    status: "",
    message: "",
    isError: null,
  });

  // PROPS
  const { data, columns } = props;
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

  useEffect(() => {
    var authSet = JSON.parse(localStorage.getItem("info"));
    console.debug("useEffect");
    
    var fieldSearchSet= resultFieldSet();
    api_search2(
      searchFilters,
      JSON.parse(localStorage.getItem("info")).groups_token,
      page * pageSize,
      100,
      fieldSearchSet,
      "newTable"
    )
      .then((response) => {
        console.debug('%c⊙USEEFAPISEARCHRES', 'color:rgb(0 140 255)',  response.total, response.results );
        if (response.status === 200) {
          if (response.total === 1) {
            // for single returned items, customize the columns to match
            // setColDef(response.results[0].entity_type);
            // which_cols_def = this.stateData.columnDefType();
          }
          console.debug(
            "%c⊙",
            "color:#00ff7b",
            "SETTING RESULTS",
            response.total,
            response.results
          );
          // return response;
          setResults({
            dataRows:response.results,
            rowCount:response.total,
            colDef:columnDefType(response.results[0].entity_type),
          });
          // setRowCount(response.total);
          // setDataRows(response.results);
          // setColDef(columnDefType(response.results[0].entity_type));
          setLoading(false);
          setTableLoading(false);
        } else {
          var errStringMSG = "";
          var errString =
            response.results.data.error.root_cause[0].type +
            " | " +
            response.results.data.error.root_cause[0].reason;
          typeof errString.type === "string"
            ? (errStringMSG = "Error on Search")
            : (errStringMSG = errString);
          this.setState({
            errorState: true,
            error: errStringMSG,
          });
        }
      })
      .catch((error) => {
        // props.reportError(error);
        console.debug("%c⭗", "color:#ff005d", "ERROR", error);
      });



    // entity_api_get_entity(uuid, authSet.groups_token)
    //   .then((response) => {
    //     console.debug("useEffect entity_api_get_entity", response);
    //       if (response.status === 200) {
    //         setEntity(response.results);
    //         //console.debug("entity_data", response.results);
    //         setLoading(false);
    //       } else {
    //         console.debug("entity_api_get_entity RESP NOT 200", response.status, response);
    //         passError(response.status, response.message);
    //       }
    //     })
    //     .catch((error) => {
    //       console.debug("entity_api_get_entity ERROR", error);
    //       passError(error.status, error.results.error );
    //     });




  }, [page,pageSize,searchFilters]);

  // useEffect(() => {
  //   populateTableData();
  // }, [populateTableData]);

  const handleSortModelChange = useCallback((sortModel) => {
    setSortOrder(sortModel[0].sort);
  }, []);

  function handlePageChange(pageInfo) {
    console.debug("%c⭗", "color:#ff005d", "AAAAAAAAAAAAAAAAAAA", pageInfo);
    // var currentPage = page;
    // var nextPage = page + 1;
    setPage(pageInfo.page)
    // prepQueryParams();
  }

  function handleSearchButtonClick(event) {
    event.preventDefault();
  }

  function prepQueryParams() {
    // var group = searchFilters.group;
    // var entityType = searchFilters.entityType;
    // var keywords = searchFilters.keywords;

    // // COLUMN setting
    // setColDef(COLUMN_DEF_SAMPLE);

    // // let which_cols_def = COLUMN_DEF_SAMPLE; //default
    // if (entityType) {
    //   let colSet = entityType.toLowerCase();
    //   setColDef(columnDefType(colSet));
    // }

    // let params = {};
    // var url = new URL(window.location);

    // if (keywords) {
    //   params["keywords"] = keywords;
    //   if (!this.props.modecheck) {
    //     url.searchParams.set("keywords", keywords);
    //   }
    // } else {
    //   url.searchParams.delete("keywords");
    // }

    // if (group && group !== "All Components") {
    //   params["group_uuid"] = group;
    //   if (!this.props.modecheck) {
    //     url.searchParams.set("group", group);
    //   }
    // } else {
    //   url.searchParams.delete("group");
    // }

    // if (entityType && entityType !== "----") {
    //   if (!this.props.modecheck) {
    //     url.searchParams.set("entityType", entityType);
    //   }

    //   if (ENTITY_TYPES.hasOwnProperty(entityType)) {
    //     params["entity_type"] = toTitleCase(entityType);
    //   } else if (SAMPLE_CATEGORIES.hasOwnProperty(entityType)) {
    //     params["sample_category"] = entityType;
    //   } else {
    //     params["organ"] = entityType;
    //   }
    // } else {
    //   url.searchParams.delete("entityType");
    // }
    // // window.history.pushState({}, "", url);
    // setSearchFilters(params);

    // THey get set on Selection now.
    // populateTableData(searchFilters, page, pageSize, colDef);
  }



  // function populateTableData(){
  //   var params = searchFilters;
  //   var fieldSearchSet = resultFieldSet(results.colDef);
    
  //   console.debug(
  //     "%c⊙populateTableData",
  //     "color:#6200FF",
  //     "",
  //     params,
  //     page,
  //     pageSize,
  //     fieldSearchSet
  //   );
  //   // setTableLoading(true);
  //   api_search2(
  //     params,
  //     JSON.parse(localStorage.getItem("info")).groups_token,
  //     page * pageSize,
  //     results.rowCount,
  //     fieldSearchSet,
  //     "newTable"
  //   )
  //     .then((response) => {
  //       console.debug('%c⊙APISEARCHRES', 'color:rgb(0 140 255)',  response.total, response.results );
  //       if (response.status === 200) {
  //         if (response.total === 1) {
  //           // for single returned items, customize the columns to match
  //           // setColDef(response.results[0].entity_type);
  //           // which_cols_def = this.stateData.columnDefType();
  //         }
  //         console.debug(
  //           "%c⊙",
  //           "color:#00ff7b",
  //           "SETTING RESULTS",
  //           response.total,
  //           response.results
  //         );
  //         return response;
  //         // setRowCount(response.total);
  //         // setDataRows(response.results);
  //         // setColDef(columnDefType(response.results[0].entity_type));
  //         // setLoading(false);
  //         // setTableLoading(false);
  //       } else {
  //         var errStringMSG = "";
  //         var errString =
  //           response.results.data.error.root_cause[0].type +
  //           " | " +
  //           response.results.data.error.root_cause[0].reason;
  //         typeof errString.type === "string"
  //           ? (errStringMSG = "Error on Search")
  //           : (errStringMSG = errString);
  //         this.setState({
  //           errorState: true,
  //           error: errStringMSG,
  //         });
  //       }
  //     })
  //     .catch((error) => {
  //       props.reportError(error);
  //       console.debug("%c⭗", "color:#ff005d", "ERROR", error);
  //     });
  // }

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
    const { name, value } = e.target;
    console.debug("%c⊙", "color:#00ff7b", "HandleINputChange", name);
    switch (name) {
      case "group":
        if (value != "All Components") {
          setSearchFilters((prevValues) => ({
            ...prevValues,
            group: value,
          }));
        } else {
          setSearchFilters((prevValues) => ({
            ...prevValues,
            group: "",
          }));
        }
        break;
      case "entityType":
        setSearchFilters((prevValues) => ({
          ...prevValues,
          entityType: value,
        }));
        break;
      case "keywords":
        setSearchFilters((prevValues) => ({
          ...prevValues,
          keywords: value,
        }));
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
    // this.setState({
    //     filtered: false,
    //     dataRows: [],
    //     entityType: "----",
    //     group: "All Components",
    //     keywords: "",
    //     page: 0,
    //     searchFilters: {
    //       entity_type: "",
    //       group: "",
    //       keywords: "",
    //     },
    //   },() => {
    //     prepQueryParams();
    //   }
    // );
  }

  function renderView() {
    console.debug("%c⊙", "color:#00ff7b", "RENDERVIEW", results.dataRows, results.colDef);
    return (
      <div style={{ width: "100%" }}>
        {" "}
        AUTH BUT WHERE
        {renderFilterControls()}
        {loading && renderLoadingBar()}
        {results.dataRows && results.dataRows.length > 0 && renderTable()}
        {results.dataRows && results.dataRows.length === 0 && !loading && (
          <div className="text-center">No record found.</div>
        )}
      </div>
    );
  }

  function renderGroupOptions() {
    allGroups.map((group, index) => {
      console.debug("%c⊙", "color:#00ff7b", "group", group.shortName);
      return (
        <option key={index} value={group.uuid}>
          {group.shortname}
        </option>
      );
    });
  }

  function renderLoadingBar() {
    if (loading && !page > 0) {
      return (
        <div>
          <LinearProgress />
        </div>
      );
    }
  }

  function renderTable() {
    return (
      <div style={{ height: 590, width: "100%" }}>
        <DataGrid
          rows={results.dataRows}
          columns={results.colDef}
          disableColumnMenu={true}
          columnBuffer={2}
          columnThreshold={2}
          pageSizeOptions={[100]}
          pagination
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              csvOptions: {
                fileName: "hubmap_ingest_export",
              },
            },
          }}
          hideFooterSelectedRowCount
          rowCount={results.rowCount}
          paginationMode="server"
          onPaginationModelChange={(e) => handlePageChange(e)}
          // onPageChange={() => handlePageChange()}
          // onPageChange={(newPage) => setPage(newPage)}
          // onPageSizeChange={(page) => handlePageSizeSelection(page)}
          loading={tableLoading}
          onCellClick={props.select ? props.select : handleTableCellClick} // this allows a props handler to override the local handler
        />
      </div>
    );
  }

  function renderPreamble() {
    return (
      <Box
        sx={{
          flexDirection: "column",
          justifyContent: "center",
        }}>
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
          <Grid
            container
            spacing={3}
            pb={3}
            alignItems="center"
            sx={{
              display: "flex",
              justifyContent: "flex-start",
            }}>
            <Grid item xs={6}>
              <label htmlFor="group" className="portal-jss116">
                Group
              </label>
              <select
                name="group"
                id="group"
                className="select-css"
                onChange={() => handleInputChange()}
                value={searchFilters.group || ""}>
                <option value="">All Components</option>
                {allGroups.map((group, index) => {
                  return (
                    <option key={index + 1} value={Object.values(group)[1]}>
                      {Object.values(group)[0]}
                    </option>
                  );
                })}
              </select>
            </Grid>
            <Grid item xs={6}>
              <label htmlFor="entityType" className="portal-jss116">
                Type
              </label>
              <select
                name="entityType"
                id="entityType"
                className="select-css"
                disabled={
                  props.restrictions && props.restrictions.entityType
                    ? true
                    : false
                }
                onChange={handleInputChange}
                value={searchFilters.entityType || ""}>
                <option value=""></option>
                {entityTypeList.map((optgs, index) => {
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
              </select>
            </Grid>
            <Grid item xs={12}>
              <input
                type="text"
                className="form-control"
                name="keywords"
                id="keywords"
                placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                onChange={handleInputChange}
                //ref={keywords}
                value={searchFilters.keywords || ""}
              />
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
        </form>
      </div>
    );
  }


  return renderView();

  // console.debug(
  //   "%c⊙Initial, Can We Render?",
  //   "color:#FFBB00",
  //   "",
  //   loading,
  //   errorHandler,
  //   dataRows,
  //   colDef
  // );
  // if (!loading && errorHandler.isError === true) {
  //   return <ErrBox err={errorHandler} />;
  // } else if (loading) {
  //   return (
  //     <div className="card-body ">
  //       <div className="loader">Loading...</div>
  //     </div>);
  // } else {
  //   console.debug("%c⊙", "color:#00ff7b", "SHOULD BE RENDERIN");
    
  // }
}