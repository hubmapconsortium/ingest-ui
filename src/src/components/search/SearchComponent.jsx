import {Component} from "react";
import {Link} from "react-router-dom";
import Typography from "@mui/material/Typography";
import LinearProgress from "@material-ui/core/LinearProgress";
import Alert from '@mui/material/Alert';
import {GridLoader} from "react-spinners";
import {SAMPLE_TYPES,ENTITY_TYPES,SAMPLE_CATEGORIES} from "../../constants";
import {sortGroupsByDisplay} from "../../service/user_service";
import {ubkg_api_get_organ_type_set} from "../../service/ubkg_api";
import {
  COLUMN_DEF_DONOR,
  COLUMN_DEF_COLLECTION,
  COLUMN_DEF_SAMPLE,
  COLUMN_DEF_DATASET,
  COLUMN_DEF_UPLOADS,
  COLUMN_DEF_MIXED,
} from "./table_constants";
import {RenderSearchTable} from "./searchTable";
// Creation donor_form_components

function resultFieldSet() {
  var fieldObjects = [];
  var fieldArray = fieldObjects.concat(
    COLUMN_DEF_SAMPLE,
    COLUMN_DEF_COLLECTION,
    COLUMN_DEF_DATASET,
    COLUMN_DEF_UPLOADS,
    COLUMN_DEF_DONOR,
    COLUMN_DEF_MIXED,
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
      // allGroups: localStorage.getItem("allGroups") ? this.sortGroupsByDisplay(JSON.parse(localStorage.getItem("allGroups"))) : [],
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
      if(!this.state.allGroups || (this.state.allGroups && this.state.allGroups.length > 0)){
        let sorted = sortGroupsByDisplay(this.state.allGroups)
        console.debug('%c◉ sorted ', 'color:#00ff7b', sorted);
        this.setState({
          allGroups: sortGroupsByDisplay(this.state.allGroups),
          groupsLoading: false,
        });
      }

    } catch (error) {
      console.debug("%c⭗", "color:#ff005d",error);
    }

    this.setState({ organ_types: this.handleSortOrgans(JSON.parse(localStorage.getItem("organs"))) }, () => {
      this.setFilterType();
    });

    if (this.props.restrictions) {
      // So we can apply the object right to the state instead of do parse tango
      var restrictedState = this.state.restrictions;
      restrictedState.search_filters = this.state.restrictions;
      this.setState(restrictedState, function () {
        this.handleSearchClick();
      });
    }

    if (this.props.packagedQuery) {
      console.debug('%c◉ packagedQuery ', 'color:#00ff7b', this.props.packagedQuery);
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
      console.debug('%c◉ Set Titles ', 'color:#00ff7b', );
    }
  );
  }

  // };

  handleSortOrgans = () => {
    let organList = JSON.parse(localStorage.getItem("organs"));
    let sortedDataProp = {};
    let sortedDataArray = [];
    var sortedMap = new Map();
    for (let key in organList) {
      let value = organList[key];
      sortedDataProp[value] = key;
      sortedDataArray.push(value);
      console.debug('%c◉ OL: ', 'color:#00ff7b', key,value);
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
      },()=>{
        console.debug('%c◉ SETTING FILTER TYPSES DONE LOADING ', 'color:#00ff7b', this.state.allTypes);
      });
    });
  };

  combinedTypeOptions = () => {
    // Simplified to handle replacement of Types with Categories
    var combinedList = [];
    let combinedCheck = [false,false,false];
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
    var organList = this.handleSortOrgans() ;
    try {
      organList.forEach((value, key) => {
        organs[value] = "\u00A0\u00A0\u00A0\u00A0\u00A0" + key;
      });
      combinedList.push(organs.sort());
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
    // Was deprecated, kept this to keep things from exploding I think
    // @TODO: Address the Search Components in the 2025techdebtcrunch 
    // eventually
  }

  handleUrlChange = (targetPath) => {
    if ((!targetPath || targetPath === undefined || targetPath === "") &&
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

  handleTableCellClick = (params) => {
    // The one already inside the tbale component is *way* cleaner
    console.debug("%c⊙ SC Wrapper handleTableCellClick? How'd you get here?", 'color:#FF00B7');
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
    if (this.state.show_search) {
      // console.debug('%c⊙', 'color:#00ff7b', "AUTHED" );
      return (
        <div style={{ width: "100%" }}>
          {/* loading: {JSON.stringify(this.state.loading)} |
          entityListLoading: {JSON.stringify(this.state.entityListLoading)} |
          groupsLoading: {JSON.stringify(this.state.groupsLoading)} | */}
          {this.props.routingMessage && (
            <Alert variant="filled" severity="error">
              <strong>Sorry</strong> {this.props.routingMessage[0]+" "} 
               Please use <Link to={this.props.routingMessage[1]} className="text-white">Uploads</Link> instead.
            </Alert>
          )}
          {/* {this.state.show_search && this.renderFilterControls()} */}
          {this.state.loading && this.renderLoadingBar()}
          {this.state.show_search && (
            // this.renderTable()}
            <div>
              <RenderSearchTable 
                // data={this.state.datarows} 
                packagedQuery={this.props.packagedQuery?this.props.packagedQuery:null}
                restrictions={this.props.restrictions}
                columns={this.state.column_def} 
                allTypes={this.state.allTypes}
                searchTitle={this.props.custom_title ? this.props.custom_title : null}
                searchSubtitle={this.props.custom_subtitle ? this.props.custom_subtitle : null}
                handleTableCellClick={this.props.select?(e)=>this.props.select(e):null}
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
