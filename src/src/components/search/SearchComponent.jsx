import {Component} from "react";
import {Link} from "react-router-dom";
import Typography from "@mui/material/Typography";
import LinearProgress from "@material-ui/core/LinearProgress";
import Alert from '@mui/material/Alert';
import {GridLoader} from "react-spinners";
import {SAMPLE_TYPES,ENTITY_TYPES,SAMPLE_CATEGORIES} from "../../constants";
import {ubkg_api_get_organ_type_set} from "../../service/ubkg_api";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_UPLOADS,
} from "./table_constants";
import {ingest_api_allowable_edit_states,ingest_api_all_groups} from "../../service/ingest_api";
import {entity_api_get_entity} from "../../service/entity_api";
import {toTitleCase} from "../../utils/string_helper";
import {RenderSearchTable} from "./searchTable";
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

      group: "All Components",
      allGroups: [""],
      groupsLoading: true,

      entityType: "",
      allTypes: SAMPLE_TYPES,
      entityListLoading: true,

      column_def: COLUMN_DEF_DONOR,
      editForm: false,
      error: "",
      errorState: false,
      fieldSet: [],
      filtered_keywords: "",
      filtered: false,
      globus_url: "",
      hide_modal: true,
      isAuthenticated: false,
      keywords: "",
      last_keyword: "",
      modecheck: "", //@TODO: Patch for loadingsearch within dataset edits, We should move this
      page: 0,
      pageSize: 100,
      results_total: 0,
      search_title: "Search",
      search_subtitle: "LIPSUM",
      selectionModel: "",
      show_info_panel: true,
      show_modal: false,
      show_search: true,
      loading: false,
      table_loading: false,
      data_loading: false,
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
        }, () => { 
          this.setState({
            groupsLoading: false,
          });
        });
      })
      .catch((err) => {
        // console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
      })
    } catch (error) {
      // console.debug("%c⭗", "color:#ff005d",error);
    }

    var organList = {};
    // console.debug('%c⊙', 'color:#00ff7b', "this.props.organList", this.props.organList );
    if (this.props.organList) {
      organList = this.props.organList;
      this.setState({ organ_types: this.handleSortOrgans(organList) }, () => {
        this.setFilterType();
      });
    } else {
      // console.debug('%c⊙', 'color:#00ff7b', "ubkg_api_get_organ_type_set" );
      ubkg_api_get_organ_type_set()
        .then((res) => {
          // console.debug('%c⊙', 'color:#00ff7b', "ubkg_api_get_organ_type_set", res );
          organList = res;
          this.setState({ organ_types: this.handleSortOrgans(res) }, () => {
            this.setFilterType();
          });
        })
        .catch((err) => {
          // console.debug(
          //   "%c⭗",
          //   "color:#ff005d",
          //   "ubkg_api_get_organ_type_set ERR",
          //   err
          // );
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
      // console.debug('%c◉ packagedQuery ', 'color:#00ff7b', this.props.packagedQuery);
      this.setState({
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
    this.setState({
      search_title: this.props.custom_title || this.state.search_title,
      custom_subtitle: this.props.custom_subtitle || this.state.custom_subtitle,
      fieldSet: resultFieldSet(),
    },() => {
      // console.debug('%c◉ Set Titles ', 'color:#00ff7b', );
    }
  );
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

  }

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
        allTypes: this.combinedTypeOptions(), //SAMPLE_TYPES
    }, () => {
      this.setState({
        data_loading: false,
        entityListLoading: false,
      },()=>{});
    });
  };

  combinedTypeOptions = () => {
    // Simplified to handle replacement of Types with Categories
    var combinedList = [];
    // FIRST: Main Entity Types
    if (this.props.whitelist) {
      // Not in use at this time
      // combinedList.push(entityList); // ALLoffem
    } else {
      // FIRST: Entity Types
      let filteredEntities = {};
      for (const [key, value] of Object.entries(ENTITY_TYPES)) {
        if (this.props.blacklist && !this.props.blacklist.includes(key)){
          // if we've got a Blacklist this isnt there, add it to our list
          filteredEntities[key] = value;
        }else if(!this.props.blacklist){
          // No blacklist? Just add it 
          filteredEntities[key] = value;
        }
      }
      // console.debug('%c◉ filteredEntities ', 'color:#00ff7b', filteredEntities);
      // If we have a blacklist, push the filtered version, otherwise full
      combinedList.push(filteredEntities);

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
        // And Wrap it up & send back
        return combinedList;
      } catch (error) {
        // console.debug("%c⭗", "color:#ff005d", "combinedList error", error);
        var errStringMSG = "";
        typeof error.type === "string"
          ? (errStringMSG = "Error on Organ Assembly")
          : (errStringMSG = error);
        this.setState({
          errorState: true,
          error: errStringMSG,
        });
      }

    }
  }

  handleSearchClick = () => {
    // Was deprecated, kept this to keep things from exploding I think
    // @TODO: Address the Search Components in the 2025techdebtcrunch  eventually
  }
  handleUrlChange = (targetPath) => {
    if ((!targetPath || targetPath === undefined || targetPath === "") &&
      this.props.modecheck !== "Source"
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

  handleSearchButtonClick = (event) => {
    // event.preventDefault();

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

  handleTableCellClick = (params, event ) => {
    // console.debug('%c◉ handleTableCellClick SC', 'color:#00ff7b', event, params);  
    if (params.field === "uuid") return; // skip this field
    if (params.hasOwnProperty("row")) {
      var typeText = params.row.entity_type.toLowerCase();
      this.props.urlChange(event, typeText + "/" + params.row.uuid);
    }
  };
  
  /**
    RENDER SECTION BELOW - All UI Components
  **/

  render() {
    // console.debug('%c⊙ SC RENDER packageQuery', 'color:#00ff7b', this.props.packagedQuery );
    if (this.state.data_loading) {
      return (
      <div style={{ width: "100%" }}>
        <Typography align={"center"} style={{marginBottom: "20px"}}>
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
      // console.debug('%c⊙', 'color:#00ff7b', "AUTHED" );
      return (
        <div style={{ width: "100%" }}>
          {this.props.routingMessage && (
            <Alert variant="filled" severity="error">
              <strong>Sorry</strong> {this.props.routingMessage[0]+" "} 
               Please use <Link to={this.props.routingMessage[1]} className="text-white">Uploads</Link> instead.
            </Alert>
          )}
          {/* {this.state.show_search && this.renderFilterControls()} */}
          {this.state.loading && this.renderLoadingBar()}
          {this.state.show_search &&
          !this.state.groupsLoading &&
          !this.state.entityListLoading && (
            // this.renderTable()}
            <div>
              <RenderSearchTable 
                // data={this.state.datarows} 
                modecheck={this.props.modecheck}
                packagedQuery={this.props.packagedQuery?this.props.packagedQuery:null}
                restrictions={this.props.restrictions}
                allGroups={this.state.allGroups}
                allTypes={this.state.allTypes}
                columns={this.state.column_def} 
                searchTitle={this.props.custom_title ? this.props.custom_title : null}
                searchSubtitle={this.props.custom_subtitle ? this.props.custom_subtitle : null}
                // handleTableCellClick={(params) => this.handleTableCellClick(params)}
                // handleSearchButtonClick={() => this.handleSearchButtonClick()}
                handleTableCellClick={this.props.select?(event, params, details)=>this.props.select(event, params, details):(event, params, details)=>this.handleTableCellClick(event, params, details)}
                // select={this.props.select?this.props.select:null}
                reportError={(error) => this.props.reportError(error)}
                urlChange={(target) => this.props.urlChange(target) } />
            </div>
          )}
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

  renderLoadingBar = () => {
    if (this.state.loading && !this.state.page > 0) {
      return (
        <div>
          <LinearProgress />
        </div>
      );
    }
  };

}

export default SearchComponent;
