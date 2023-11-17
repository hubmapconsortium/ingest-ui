import React, {useEffect, useState} from "react";
import {DataGrid, GridToolbar } from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import LinearProgress from "@material-ui/core/LinearProgress";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { RenderError } from "../../utils/errorAlert";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_PUBLICATION,
  COLUMN_DEF_UPLOADS,
} from "./table_constants";
import { api_search2 } from "../../service/search_api";

export const RenderSearchTable = (props) => {
  // var [isAuthenticated, setIsauthenticated] = useState(props.isAuthenticated ? props.isAuthenticated : [""]);
  var [search_title] = useState(props.search_title ? props.search_title : [""]);
  // var [rlc, setRLC] = useState(0);

  // TABLE & FILTER VALUES
  var [allGroups] = useState(props.allGroups ? props.allGroups : []);
  var [entityTypeList] = useState(props.allTypes ? props.allTypes : []);
  var [searchFilters, setSearchFilters] = useState(props.searchFilters ? props.searchFilters : {});
  // var [colDef, setColDef] = useState(COLUMN_DEF_SAMPLE);
  var [page, setPage] = useState(0);
  var [pageSize] = useState(100);
  // var [sortOrder, setSortOrder] = useState("asc");
  // const [paginationModel, setPaginationModel] = React.useState({
  //   pageSize:25,
  //   page:    0,
  // });

  // TABLE DATA
  // var [dataRows, setDataRows] = useState(props.data ? props.data : null);
  // var [rowCount, setRowCount] = React.useState(10000);
  var [results, setResults] = React.useState({
    dataRows:null,
    rowCount:0,
    colDef:  COLUMN_DEF_SAMPLE,
  });

  //  LOADERS
  var [loading, setLoading] = useState(true);
  // var [dataLoading, setDataLoading] = useState(true);
  var [tableLoading, setTableLoading] = useState(true);

  // ERROR THINGS
  var [error, setError] = useState();
  var [errorState, setErrorState] = useState();
  // var [errorHandler, setErrorHandler] = useState({
  //   status: "",
  //   message:"",
  //   isError:null,
  // });

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

  useEffect(() => {
    //console.debug("useEffect");

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
        //console.debug('%c⊙USEEFAPISEARCHRES', 'color:rgb(0 140 255)',  response.total, response.results );
        if (response.total > 0 && response.status === 200) {
          setResults({
            dataRows:response.results,
            rowCount:response.total,
            colDef:  columnDefType(response.results[0].entity_type),
          });
        } else if (response.total === 0) {
          //console.debug('%c⊙', 'color:#00ff7b', "NORES" );
          setResults({
            dataRows:response.results,
            rowCount:response.total,
            colDef:  COLUMN_DEF_SAMPLE,
          });
        } else {
          var errStringMSG = "";
          var errString =
            response.results.data.error.root_cause[0].type +
            " | " +
            response.results.data.error.root_cause[0].reason;
          typeof errString.type === "string"
            ? (errStringMSG = "Error on Search")
            : (errStringMSG = errString);
          
          
            setErrorState(true)
            setError(errStringMSG)
          }
      })
      .catch((error) => {
        setTableLoading(false);
        // props.reportError(error);
        //console.debug("%c⭗", "color:#ff005d", "ERROR", error);
      });
  }, [page, pageSize, searchFilters]);

  // useEffect(() => {
  //   populateTableData();
  // }, [populateTableData]);

  // const handleSortModelChange = useCallback((sortModel) => {
  //   setSortOrder(sortModel[0].sort);
  // }, []);

  function handlePageChange(pageInfo) {
    //console.debug("%c⭗", "color:#ff005d", "AAAAAAAAAAAAAAAAAAA", pageInfo);
    // var currentPage = page;
    // var nextPage = page + 1;
    setPage(pageInfo.page);
    // prepQueryParams();
  }

  function handleSearchButtonClick(event) {
    event.preventDefault();
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
    const {
 name, value 
} = e.target;
    //console.debug("%c⊙", "color:#00ff7b", "HandleINputChange", name);
    switch (name) {
      case "group":
        if (value != "All Components") {
          setSearchFilters((prevValues) => ({
            ...prevValues,
            group:value,
          }));
        } else {
          setSearchFilters((prevValues) => ({
            ...prevValues,
            group:"",
          }));
        }
        break;
      case "entityType":
        setSearchFilters((prevValues) => ({
          ...prevValues,
          entityType:value,
        }));
        break;
      case "keywords":
        setSearchFilters((prevValues) => ({
          ...prevValues,
          keywords:value,
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
    //console.debug("%c⊙", "color:#00ff7b", "RENDERVIEW", results.dataRows, results.colDef);
    return (
      <div style={{ width:"100%" }}>
        {renderFilterControls()}
        {tableLoading && renderLoadingBar()}
        {results.dataRows && results.dataRows.length > 0 && renderTable()}
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
      <div style={{
 height:590, width:"100%" 
}}>
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
          justifyContent:"center",
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
              display:       "flex",
              justifyContent:"flex-start",
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
