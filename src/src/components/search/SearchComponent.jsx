import React, { Component } from "react";
// import { withRouter } from 'react-router-dom';
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
// import { DataGrid } from '@material-ui/data-grid';

import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LinearProgress from "@material-ui/core/LinearProgress";
import {GridLoader} from "react-spinners";
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
import { RenderError } from "../../utils/errorAlert";
import { toTitleCase } from "../../utils/string_helper";
import {CSVLink} from "react-csv";

// Creation donor_form_components

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
  //
  // fieldArray

  return unique;
}

class SearchComponent extends Component {
  constructor(props) {
    super(props);
    //
    this.state = {
      allGroups: [],
      column_def: COLUMN_DEF_DONOR,
      editForm: false,
      entity_type_list: SAMPLE_TYPES,
      error: "",
      errorState: false,
      fieldSet: [],
      filtered_keywords: "",
      filtered: false,
      globus_url: "",
      group: "All Components",
      hide_modal: true,
      isAuthenticated: false,
      keywords: "",
      last_keyword: "",
      loading: false,
      modecheck: "", //@TODO: Patch for loadingsearch within dataset edits, We should move this
      page: 0,
      pageSize: 100,
      results_total: 0,
      entityType: "----",
      search_title: "Search",
      selectionModel: "",
      show_info_panel: true,
      show_modal: false,
      show_search: true,
      table_loading: true,
      data_loading: true,
      updateSuccess: false,
      restrictions: this.props.restrictions ? this.props.restrictions : {},
      search_filters: {
        entityType: "",
        keywords: "",
        group: "",
      },
    };
  }

  componentDidMount() {
    try {
      ingest_api_all_groups(JSON.parse(localStorage.getItem("info")).groups_token)
      .then((res) => {
        var allGroups = this.sortGroupsByDisplay(res.results);
        this.setState({
          allGroups: allGroups, 
          isAuthenticated: true
        }, () => { });
      })
      .catch((err) => {
        console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
      })
    } catch (error) {
      console.debug("%c⭗", "color:#ff005d",error);
    }

    var organList = {};
    if (this.props.organList) {
      organList = this.props.organList;
      this.setState({ organ_types: this.handleSortOrgans(organList) }, () => {
        this.setFilterType();
      });
    } else {
      ubkg_api_get_organ_type_set()
        .then((res) => {
          organList = res;
          this.setState({ organ_types: this.handleSortOrgans(res) }, () => {
            this.setFilterType();
          });
        })
        .catch((err) => {
          console.debug(
            "%c⭗",
            "color:#ff005d",
            "ubkg_api_get_organ_type_set ERR",
            err
          );
        });
    }

    if (this.props.restrictions) {
      // So we can apply the object right to the state instead of do parse tango
      var restrictedState = this.state.restrictions;
      restrictedState.search_filters = this.state.restrictions;
      this.setState(restrictedState, function () {
        this.handleSearchClick();
      });
    }

    if (this.props.packagedQuery) {
      this.setState(
        {
          entityType: this.props.packagedQuery.entityType,
          keywords: this.props.packagedQuery.keywords,
          search_filters: {
            entityType: this.props.packagedQuery.entityType,
            keywords: this.props.packagedQuery.keywords,
            group: this.props.packagedQuery.group,
          },
        },
        function () {
          this.handleSearchClick();
        }
      );
    }

    resultFieldSet();

    if (this.props.custom_title) {
      this.setState({ search_title: this.props.custom_title });
    }

    this.setState({
        fieldSet: resultFieldSet(),
      },
      function () {
        //
      }
    );

    //@TODO: Look into using the query/search functionality the search-api uses instead of all..... this
    var euuid;
    var type;
    var url = window.location.href;
    var urlPart = url.split("/");
    type = urlPart[3];
    euuid = urlPart[4];
    if (euuid && this.props.modeset !== "Source") {
      //
      // SHOULD NEVER LOAD FROM HERE AGAIN,
      // SEARCH NO LONGER WRAPS FORMS
      // this.handleLoadEntity(euuid)
    }

    //
    if (this.props.editNewEntity) {
      this.setState({
        loading: false,
        show_search: false,
      });
    }
    if (!this.props.match) {
      var urlProp = window.location.href;
      var urlsplit = urlProp.split("/");
      var lastSegment = urlsplit[3];
      euuid = urlsplit[4];

      //
      if (window.location.href.includes("/new")) {
        if (this.props.modecheck === "Source") {
        } else {
        }
      } else if (
        !this.props.modecheck &&
        (window.location.href.includes("donors") ||
          window.location.href.includes("samples") ||
          window.location.href.includes("datasets") ||
          window.location.href.includes("uploads"))
      ) {
        this.setState(
          {
            loading: false,
          },
          function () {
            this.setFilterType();
            if (euuid && euuid !== "new") {
              var params = {
                row: {
                  uuid: euuid,
                },
              };
              this.handleTableCellClick(params);
            } else {
              //
              this.handleSearchClick();
            }
          }
        );
      } else if (window.location.href.includes("/undefined")) {
        // We're running without filter props passed or URL routing
        this.handleClearFilter();
        this.handleUrlChange("");
      } else {
        // We're running without filter props passed or URL routing
        // Can't just clear filter, new Props through URL could be setting search vals
      }
    } else if (this.props.match) {
      // Ok so we're getting props match eveen w/o, lets switch to search?
      //
      type = this.props.match.params.type;
      euuid = this.props.match.params.uuid;
      if (type !== "new") {
        this.setState(
          {
            loading: false,
          },
          function () {
            if (euuid) {
              //
              var params = {
                row: { uuid: euuid },
              };
              this.handleTableCellClick(params);
            } else {
            }
          }
        );
      } else if (this.props.search) {
        //
      } else {
        this.setState({
          formType: euuid,
          show_search: false,
          creatingNewEntity: true,
        });
      }
    }
  }

  // @TODO: Possily move into groups service?
  //  Not actually reltated to the user so not going to user service
  // only used to assemblw dropdown though
  sortGroupsByDisplay = (obj) => {
    var result = {
      TMC: [],
      RTI: [],
      TTD: [],
      DP: [],
      TC: [],
      MC: [],
      EXT: [],
      IEC: [],
    };
    var sortedResult = [];
    // put em all in their right slots
    for (var key in obj) {
      var shortname = obj[key].shortname;
      // console.debug('%c⊙', 'color:#00ff7b', "shortname", shortname );
      var prefix = shortname.split(" ");
      if (
        ["TMC", "RTI", "TTD", "DP", "TC", "MC", "EXT", "IEC"].includes(
          prefix[0]
        )
      ) {
        result[prefix[0]].push({
          shortName: obj[key].shortname,
          uuid: obj[key].uuid,
        });
      }
    }
    // compile them by slot in specific order
    sortedResult.push(
      result["TMC"],
      result["RTI"],
      result["TTD"],
      result["DP"],
      result["TC"],
      result["MC"],
      result["EXT"],
      result["IEC"]
    );
    // FLatten it!
    var sortedResultFlat = sortedResult.flat();
    return sortedResultFlat;
  };

  handleSortOrgans = (organList) => {
    // console.debug('%c⊙', 'color:#00ff7b', "handleSortOrgans", organList );
    let sortedDataProp = {};
    let sortedDataArray = [];
    var sortedMap = new Map();
    for (let key in organList) {
      let value = organList[key];
      sortedDataProp[value] = key;
      sortedDataArray.push(value);
    }
    sortedDataArray = sortedDataArray.sort();
    for (const [index, element] of sortedDataArray.entries()) {
      sortedMap.set(element, sortedDataProp[element]);
    }
    return sortedMap;
  };

  handleShowSearch = (show) => {
    if (show === true) {
      this.setState({
        loading: false,
        show_search: true,
      });
    } else {
      this.setState({
        loading: false,
        show_search: false,
      });
    }
  };

  handleLoadEntity(euuid) {
    this.setFilterType();
    if (euuid && euuid !== "new" && this.props.modecheck !== "Source") {
      var params = {
        row: {
          uuid: euuid,
        },
      };
      this.handleTableCellClick(params);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.editNewEntity !== this.props.editNewEntity) {
      //
      this.setState({
        editingEntity: this.props.editNewEntity,
        editForm: true,
        show_modal: true,
        show_search: false,
        loading: false,
      });
    }

    if (prevProps.showSearch !== this.props.showSearch) {
      this.setState({
        show_search: this.props.showSearch,
      });
    }
    if (
      prevState.editEntity !== this.state.editEntity &&
      (!this.state.editEntity || this.state.editEntity === null)
    ) {
      this.setState(
        {
          editForm: false,
          show_modal: false,
          show_search: true,
          showSearch: true,
        },
        () => {}
      );
    }
    // console.debug('%c⊙', 'color:#00ff7b', "AllGroups", prevState.allGroups, this.state.allGroups );
    // if (prevState.allGroups !== this.state.allGroups) {
    //   this.setState({
    //     allGroups: ["Test"]
    //   }, () => {
    //     console.debug('%c⊙', 'color:#00ff7b', "STATE RESET ALLGROUPS" );
    //   });
    // }
  }


    

  handleSingularty = (target, size) => {
    if (target === "uploads") {
      return "uploads"; // Is always plural in our system
    }
    if (size === "plural") {
      if (target.slice(-1) === "s") {
        return target.toLowerCase();
      } else {
        return (target + "s").toLowerCase();
      }
    } else {
      // we wanna singularize
      if (target.slice(-1) === "s") {
        return target.slice(0, -1); //.toLowerCase()
      } else {
        return target;
      }
    }
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;

    switch (name) {
      case "group":
        if (value != "All Components") {
          this.setState((prev) => ({
            search_filters: {
              ...prev.search_filters,
              group: value,
            },
          }));
        } else {
          this.setState((prev) => ({
            search_filters: {
              ...prev.search_filters,
              group: "",
            },
          }));
        }
        break;
      case "entityType":
        this.setState((prev) => ({
          search_filters: {
            ...prev.search_filters,
            entityType: value,
          },
        }));
        break;
      case "keywords":
        this.setState((prev) => ({
          search_filters: {
            ...prev.search_filters,
            keywords: value,
          },
        }));
        break;
      default:
        break;
    }
    //
  };

  /*
  set filter fo the Types dropdown, which depends on the propos.filter_type, if avaliable
  Depricated now by whitelist/blackist?
  */
  setFilterType = () => {
    // var new_filter_list = [];
    this.setState({
        entity_type_list: this.combinedTypeOptions(), //SAMPLE_TYPES
    }, () => {
      this.setState({
        data_loading: false,
      },()=>{});
    });
  };

  combinedTypeOptions = () => {
    // Simplified to handle replacement of Types with Categories
    var combinedList = [];
    // FIRST: Main Entity Types
    // We're either going to use a whitelist, blacklist or all of em
    var entityList = ENTITY_TYPES;
    if (!this.props.blacklist && !this.props.whitelist) {
      combinedList.push(entityList); // ALLoffem
    } else {
      for (const [key, value] of Object.entries(entityList)) {
        if (
          // if we've got a Blacklist this IS on it, nix it from the entity types, OR
          (this.props.blacklist &&
            this.props.blacklist.includes(key.toLowerCase())) ||
          // If we've got a whitelist and this is NOT on it, nix it from the entity types
          (this.props.whitelist &&
            !this.props.whitelist.includes(key.toLowerCase()))
        ) {
          delete entityList[key];
        }
      }
      combinedList.push(entityList);
    }

    // NEXT: Sample Categories
    combinedList.push(SAMPLE_CATEGORIES);
    // @TODO: Switch these to UBKG too?

    // LAST: Organs
    var organs = [];
    var organList = this.state.organ_types;
    try {
      organList.forEach((value, key) => {
        organs[value] = "\u00A0\u00A0\u00A0\u00A0\u00A0" + key;
      });
      combinedList.push(organs.sort());
      // console.debug('%c⊙', 'color:#00ff7b', "combinedList", combinedList );
      return combinedList;
    } catch (error) {
      console.debug("%c⭗", "color:#ff005d", "combinedList error", error);
      var errStringMSG = "";
      typeof error.type === "string"
        ? (errStringMSG = "Error on Organ Assembly")
        : (errStringMSG = error);
      this.setState({
        errorState: true,
        error: errStringMSG,
      });
    }
  };

  handleSearchClick = () => {
    var group = this.state.search_filters.group;
    var entityType = this.state.search_filters.entityType;
    var keywords = this.state.search_filters.keywords;

    // COLUMN setting
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

    let params = {};
    var url = new URL(window.location);
    if (keywords) {
      params["keywords"] = keywords;
      if (!this.props.modecheck) {
        url.searchParams.set("keywords", keywords);
      }
    } else {
      url.searchParams.delete("keywords");
    }

    if (group && group !== "All Components") {
      params["group_uuid"] = group;
      if (!this.props.modecheck) {
        url.searchParams.set("group", group);
      }
    } else {
      url.searchParams.delete("group");
    }

    if (entityType && entityType !== "----") {
      if (!this.props.modecheck) {
        url.searchParams.set("entityType", entityType);
      }

      if (ENTITY_TYPES.hasOwnProperty(entityType)) {
        params["entity_type"] = toTitleCase(entityType);
      } else if (SAMPLE_CATEGORIES.hasOwnProperty(entityType)) {
        params["sample_category"] = entityType;
      } else {
        params["organ"] = entityType;
      }
    } else {
      url.searchParams.delete("entityType");
    }

    if (this.state.page !== 0) {
      this.setState({
        table_loading: true,
      });
    }
    window.history.pushState({}, "", url);
    this.setState({
        loading: true,
        filtered: true,
      },() => {
        api_search2(
          params,
          JSON.parse(localStorage.getItem("info")).groups_token,
          this.state.page * this.state.pageSize,
          this.state.pageSize,
          this.state.fieldSet
        ).then((response) => {
          if (response.status === 200) {
            if (response.total === 1) {
              // for single returned items, customize the columns to match
              which_cols_def = this.columnDefType(
                response.results[0].entity_type
              );
            }
            this.setState({
              datarows: response.results, // Object.values(response.results)
              results_total: response.total,
              column_def: which_cols_def,
              loading: false,
              table_loading: false,
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
            this.setState({
              errorState: true,
              error: errStringMSG,
            });
          }
        });
      }
    );
  };

  columnDefType = (et) => {
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
  };

  handleUrlChange = (targetPath) => {
    if (
      (!targetPath || targetPath === undefined || targetPath === "") &&
      this.state.modecheck !== "Source"
    ) {
      targetPath = "";
    }
    this.setState({
      loading: false
    })
    if(targetPath!=="----" && targetPath!=="undefined" && targetPath.length>0){
      this.props.urlChange(targetPath);
    }
  };

  handlePageChange = (page) => {
    this.setState({
        page: page,
        table_loading: true,
        pageSize: this.state.pageSize,
      },() => {
        // need to do this in order for it to execute after setting the state or state won't be available
        this.handleSearchClick();
      }
    );
  };

  handlePageSizeSelection = (pagesize) => {
    this.setState({
      pageSize: pagesize,
    });
  };

  handleSearchButtonClick = (event) => {
    event.preventDefault();

    this.setState({
        datarows: [],
        loading: true,
        page: 0, // reset the page
      },() => {
        // need to do this in order for it to execute after setting the state or state won't be available
        this.handleSearchClick();
      }
    );
  };

  handleTableSelection = (row) => {
    if (row.length > 0) {
      alert(row);
    }
  };

  cancelEdit = () => {
    this.setState({
      editingEntity: null,
      show_modal: false,
      show_search: true,
      loading: false,
    });
  };

  onUpdated = (data) => {
    this.setState({
        updateSuccess: true,
        editingEntity: data,
        show_search: false,
        loading: false,
      },() => {
        this.cancelEdit();
        // ONLY works for functional components and all oura are class components
        // this.props.history.push("/"+this.state.formType+"/"+this.state.editNewEntity.uuid)
        this.setState({ redirect: true });
      }
    );
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);

    if (!this.state.editingEntity && this.props.editNewEntity) {
      this.setState({
        editingEntity: this.props.editNewEntity,
      });
      //
    }
  };

  handleClose = () => {
    this.setState({
      creatingNewUpload: false,
      anchorEl: null,
      show_menu_popup: false,
      open_edit_dialog: false,
      creatingNewEntity: false,
      showSearch: true,
      show_search: true,
      loading: false,
    });
  };

  handleTableCellClick = (params) => {
    if (params.field === "uuid") return; // skip this field

    if (params.hasOwnProperty("row")) {
      var typeText = params.row.entity_type.toLowerCase();
      this.props.urlChange(typeText + "/" + params.row.uuid);

      /* We're controlling the Routing and Most other views from the outer App wrapping, not within the SearchComponent Itself Anymore */
      // Exception being Uploads
      entity_api_get_entity(
        params.row.uuid,
        JSON.parse(localStorage.getItem("info")).groups_token
      ).then((response) => {
        if (response.status === 200) {
          let entity_data = response.results;

          if (entity_data.read_only_state) {
            ingest_api_allowable_edit_states(
              params.row.uuid,
              JSON.parse(localStorage.getItem("info")).groups_token
            ).then((resp) => {
              //
              let read_only_state = false;
              if (resp.status === 200) {
                read_only_state = !resp.results.has_write_priv; //results map opposite for UI
              }

              this.setState({
                updateSuccess: null,
                editingEntity: entity_data,
                readOnly: read_only_state, // used for hidding UI components
                editForm: true,
                show_modal: true,
                show_search: false,
                loading: false,
              });
            });
          } else {
            this.setState({
              updateSuccess: null,
              editingEntity: entity_data,
              readOnly: "read_only_state", // used for hidding UI components
              editForm: true,
              show_modal: true,
              show_search: false,
              loading: false,
            });
          }
          this.handleUrlChange(
            entity_data.entity_type + "/" + entity_data.uuid
          );
        }
      });
    }
  };

  handleClearFilter = () => {
    this.setState({
        filtered: false,
        datarows: [],
        entityType: "----",
        group: "All Components",
        keywords: "",
        page: 0,
        search_filters: {
          entity_type: "",
          group: "",
          keywords: "",
        },
      },() => {
        this.handleSearchClick();
      }
    );
  };

  onChangeGlobusLink(newLink, newDataset) {
    const { name, display_doi, doi } = newDataset;
    this.setState({
      globus_url: newLink,
      name: name,
      display_doi: display_doi,
      doi: doi,
    });
  }

  /**
    RENDER SECTION BELOW - All UI Components
  **/

  render() {
    if (this.state.data_loading) {
      return (
      <div style={{ width: "100%" }}>
        <Typography align={"center"}  style={{marginBottom:"20px"}}>
          Loading System Data
        </Typography>
        <Typography align={"center"}>
          <GridLoader
            color="#444a65"
            size={20}
            loading={true}
            cssOverride={{
              margin: '0, auto'
            }}
          />
        </Typography>
        </div>
      )
    }
    if (this.state.isAuthenticated) {
      return (
        <div style={{ width: "100%" }}>
          {this.state.show_search && this.renderFilterControls()}
          {this.state.loading && this.renderLoadingBar()}
          {this.state.show_search &&
            this.state.datarows &&
            this.state.datarows.length > 0 &&
            this.renderTable()}
          {this.state.datarows &&
            this.state.datarows.length === 0 &&
            this.state.filtered &&
            !this.state.loading && (
              <div className="text-center">No record found.</div>
            )}
        </div>
      );
    }
    return null;
  }

  renderProps() {
    //
    return (
      <div>
        <span className="portal-jss116 text-center">
          Found Props: {this.state.preset.entityType}{" "}
          {this.state.preset.entityUuid}
        </span>{" "}
        <br />
        <br />
      </div>
    );
  }

  renderInfoPanel() {
    return (
      <div>
        <span className="portal-jss116 text-center">
          ** To register new items, use the REGISTER NEW ITEM menu above to
          select which type you wish to create.
        </span>{" "}
        <br />
        <br />
      </div>
    );
  }

  renderGroupOptions = () => {
    this.state.allGroups.map((group, index) => {
      console.debug("%c⊙", "color:#00ff7b", "group", group.shortName);
      return (
        <option key={index} value={group.uuid}>
          {group.shortname}
        </option>
      );
    });
  };

  renderLoadingBar = () => {
    if (this.state.loading && !this.state.page > 0) {
      return (
        <div>
          <LinearProgress />
        </div>
      );
    }
  };

  renderTable() {
    return (
      <div style={{ height: 590, width: "100%" }}>
        <DataGrid
          rows={this.state.datarows}
          columns={this.state.column_def}
          disableColumnMenu={true}
          columnBuffer={2}
          columnThreshold={2}
          pagination
          slots={{ toolbar: GridToolbar }}
          csvOptions={csvOptions}
          hideFooterSelectedRowCount
          rowCount={this.state.results_total}
          paginationMode="server"
          onPageChange={(params) => this.handlePageChange(params)}
          onPageSizeChange={(page) => this.handlePageSizeSelection(page)}
          loading={this.state.table_loading}
          onCellClick={
            this.props.select ? this.props.select : this.handleTableCellClick
          } // this allows a props handler to override the local handler
        />
      </div>
    );
  }

  renderPreamble() {
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
          {this.state.search_title}
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

  renderFilterControls() {
    return (
      <div className="m-2">
        {this.renderPreamble()}

        {this.state.errorState && <RenderError error={this.state.error} />}

        <form onSubmit={this.handleSearchButtonClick}>
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
                onChange={this.handleInputChange}
                value={this.state.search_filters.group || ""}>
                <option value="">All Components</option>
                {this.state.allGroups.map((group, index) => {
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
                  this.props.restrictions && this.props.restrictions.entityType
                    ? true
                    : false
                }
                onChange={this.handleInputChange}
                value={this.state.search_filters.entityType || ""}>
                <option value=""></option>
                {this.state.entity_type_list.map((optgs, index) => {
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
                onChange={this.handleInputChange}
                //ref={this.keywords}
                value={this.state.search_filters.keywords || ""}
              />
            </Grid>

            <Grid item xs={2}></Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                color="primary"
                variant="contained"
                size="large"
                onClick={this.handleSearchButtonClick}>
                Search
              </Button>
            </Grid>
            <Grid item xs={4}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                size="large"
                onClick={this.handleClearFilter}>
                Clear
              </Button>
            </Grid>

            <Grid item xs={2}></Grid>
          </Grid>
        </form>
      </div>
    );
  }

  // @TODO: Can we move this & the one in bulk to the file_helper util?
  // renderResultDownload = e => {
  //   return (
  //     <CSVLink 
  //       style={{
  //         float: "right",
  //         padding: "12px",
  //       }}
  //       headers={headers}
  //       data={this.state.uploadedSources}>
  //       <Button
  //         variant="outlined"
  //         startIcon={<DownloadIcon />}>
  //         Download These Results
  //       </Button>       
  //     </CSVLink>
  //   )
  // }
}

export default SearchComponent;
