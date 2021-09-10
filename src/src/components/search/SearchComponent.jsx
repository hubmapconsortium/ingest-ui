import React, { Component  } from "react";
import { withRouter } from 'react-router-dom';
import { DataGrid } from '@material-ui/data-grid';
import Paper from '@material-ui/core/Paper';

import axios from "axios";
import DonorForm from "../uuid/donor_form_components/donorForm";
import TissueForm from "../uuid/tissue_form_components/tissueForm";
import UploadsEdit from "../uploads/editUploads";
import DatasetEdit from "../ingest/dataset_edit";
import { SAMPLE_TYPES } from "../../constants";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LinearProgress from '@material-ui/core/LinearProgress';
import { api_search2, search_api_search_group_list } from '../../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './table_constants';

import { entity_api_get_entity } from '../../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_users_groups } from '../../service/ingest_api';

// Creation donor_form_components
import Forms from "../uuid/forms";

// import { browserHistory } from 'react-router'

class SearchComponent extends Component {
  state = {
    selectionModel: "",
    filtered_keywords: "",
    filtered: false,
    entity_type_list: SAMPLE_TYPES,
    column_def: COLUMN_DEF_DONOR,
    show_info_panel: true,
    show_search: true,
    results_total: 0,
    page: 0,
    pageSize: 100,
    editForm: false,
    show_modal: false,
    hide_modal: true, 
    updateSuccess: false,
    globus_url: "",
    isAuthenticated: false,
    group: "All Components",
    sampleType: "----",
    keywords: "",
    last_keyword: "",
    loading: false,
    modeCheck:"" //@TODO: Patch for loadingsearch within dataset edits, We should move this
  };

  constructor(props) {
    super(props);
    console.debug("SearchCompprops",props);
  }

  componentDidMount() {     
    console.debug("SEARCH componentDidMount")
    var euuid;
    console.debug("modecheck ",this.props.modecheck);
    if(!this.props.match){
      var url = window.location.href;
      var urlsplit = url.split("/");
      var lastSegment = (urlsplit[3]);
      euuid = urlsplit[4];

      // console.debug(lastSegment, euuid)
      if(window.location.href.includes("/new")){
        console.debug("NEW FROM R ", this.props.modecheck)
        if(this.props.modecheck === "Source"){
          this.setState({
            loading:false,
            show_search:true
          });
        }else{
          this.setState({
            loading:false,
            show_search:false
          });
        }
       
      }else if( !this.props.modecheck && 
              (window.location.href.includes("/donor") || 
              window.location.href.includes("/sample") || 
              window.location.href.includes("/dataset") || 
              window.location.href.includes("/upload"))){
        this.setState({
          sampleType: lastSegment,
          sample_type: lastSegment,
        },function(){ 
          this.setFilterType();
          if(euuid && euuid !== "new"){
            var params = {
              row:{
                uuid:euuid
              }
            }
            // this.handleSearchClick();
            this.handleTableCellClick(params);
          }else{
            console.log("No UUID in URL");
            this.handleSearchClick();
          }
        });
      }else{
        // We're running without filter props passed or URL routing 
        console.log("No Props Or URL, Clear Filter")
        this.handleClearFilter();
      }
    }
    if (this.props.match && !this.props.modecheck){
      console.debug(this.props.match);
      var type = this.props.match.params.type;
      euuid = this.props.match.params.uuid;
      if(type !== "new"){

        // console.log("NOT NEW PAGE");
        // console.log(type+" | "+euuid);
        this.setState({
          sampleType: type,
        },function(){ 
          if(euuid){
            // console.log("UUID PROVIDED: "+euuid);
            var params = {
              row:{
                uuid:euuid
              }
            }
            // this.handleSearchClick();
            this.handleTableCellClick(params);
          }else{
            // console.log("No UUID in URL");
            this.handleSearchClick();
          }
        });
      }else{
        this.setState({
          formType: euuid,
          show_search:false,
          creatingNewEntity:true
        });
      }
      
    }

    // console.log(this.state);
    

    try {
      ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).nexus_token).then((results) => {

      if (results.status === 200) { 
        this.setState({
          isAuthenticated: true
        }, () => {
          this.setFilterType();
        });
      } else if (results.status === 401) {
          this.setState({
            isAuthenticated: false
          });
        }
    });
  } catch {
    this.setState({
        isAuthenticated: false
      });
  }

  const config = {
    headers: {
      Authorization:
        "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
      "Content-Type": "application/json"
    }
  };
  axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then((res) => {
        //console.debug("groups RES: ", res);
        // const display_names = res.data.groups
        //   .filter((g) => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
        //   .map((g) => {
        //     return g.displayname;
        //   });
        // this.setState({
        //   groups: display_names,
        // });
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );

        //console.debug(groups);
        this.setState({
          groups: groups
        });
      })
      .catch((err) => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
     
  
  }

  componentDidUpdate(prevProps, prevState) {
    // console.debug("componentDidUpdate");
    // // console.debug(prevProps, this.props);
    // console.debug(this.props.show_search);
    // console.debug(this.state.show_search);
    // console.debug(prevState, this.state);
    if (prevProps.editNewEntity !== this.props.editNewEntity) {
      this.setState({
        editingEntity: this.props.editNewEntity,
        editForm: true,
        show_modal: true,
        show_search: false
        });
    }
    
    if (prevProps.showSearch !== this.props.showSearch) {
      console.log("UPDATE this.props.showSearch");
      this.setState({
        show_search: this.props.showSearch
        });
    }
    
  }

  handleSingularty  = (target, size) => {
    // console.debug("handleSingularty target: ",target);
    if(target === 'uploads'){
      return "uploads" // Is always plural in our system
    }
    if(size === "plural"){
      // console.debug(target.slice(-1));
      if(target.slice(-1) === "s"){
        return target.toLowerCase();
      }else{
        return (target+"s").toLowerCase();
      }
    }else{ // we wanna singularize
      if(target.slice(-1) === "s"){
        return (target.slice(0, -1)).toLowerCase()
      }else{
        return target.toLowerCase();
      }
    } 
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    // console.debug('handleInputChange', name)
    switch (name) {
      case "group":
        this.setState({ group: value });
        break;
      case "sampleType":
        this.setState({ sampleType: value });
        break;
      case "keywords":
        this.setState({ keywords: value });
        break;
      default:
        break;
    }
  };
  
  /*
  set filter fo the Types dropdown, which depends on the propos.filter_type, if avaliable
  */
  setFilterType = () => {

    var new_filter_list = [];

    //console.debug('FILTER TYPES', SAMPLE_TYPES)
    //console.debug('FILTER TYPES', this.props.filter_type)
    if (this.props.filter_type) {
      if (this.props.filter_type === 'Dataset') {
        SAMPLE_TYPES.forEach((type)=>{
          if (!type.donor) {
            new_filter_list.push(type)
          }
        });
        this.setState({
          entity_type_list: new_filter_list
        })
      } else if (this.props.filter_type === 'Sample') {
            SAMPLE_TYPES.forEach((type)=>{
                if (!type.dataset) {
                  new_filter_list.push(type)
                }
              });
            this.setState({
              entity_type_list: new_filter_list
            })
      }
    } else {

      this.setState({
        entity_type_list: SAMPLE_TYPES
      })
    }


  } 

  handleSearchClick = () => {
    //this.setState({ loading: true, filtered: true, page: 0 });
    this.setState({ loading: true, filtered: true});

    const group = this.state.group;
    const sample_type = this.state.sampleType;
    const keywords = this.state.keywords;
    // console.debug("handleSearchClick")
    // console.debug(group,sample_type,keywords)
    // console.debug(this.state)

    // reset the page to zero, to deal with slight bug regarding
    // if you do searches and change pages then search for a new keyword
    //if (this.state.last_keyword !== keywords) {
    //  this.setState({ page: 0 });  
    //}
  
    this.setState({
      last_keyword: keywords
    })

    // const group = this.group.current.value;
    // const sample_type = this.sampleType.current.value;
    // const keywords = this.keywords.current.value;

    let params = {};
    let which_cols_def = COLUMN_DEF_SAMPLE;  //default


    if (group && group !== 'All Components') {
        params["group_uuid"] = group;
    }

    if (sample_type) {
      //console.debug(sample_type);
      console.debug(this.props);
      if(!this.state.uuid && sample_type !=="----"){
        this.handleUrlChange(this.handleSingularty(sample_type, "plural"));
      }
      

      if (sample_type === 'donor' || sample_type === 'donors') {
        params["entity_type"] = "Donor";
        which_cols_def = COLUMN_DEF_DONOR;
      } else if (sample_type === 'dataset' || sample_type === 'datasets') {
            params["entity_type"] = "Dataset";
            which_cols_def = COLUMN_DEF_DATASET;
        } else if (sample_type === 'upload' || sample_type === 'uploads') {
            params["entity_type"] = "Upload";
            which_cols_def = COLUMN_DEF_UPLOADS;
        } 
        else {
          if (sample_type !== '----') {
            params["specimen_type"] = sample_type;
          }
      } 
    } 
    if (keywords) {
      params["search_term"] = keywords;
    }

    console.debug('From Page ', this.state.page);
    console.debug('From Page size', this.state.pageSize);

    api_search2(params, JSON.parse(localStorage.getItem("info")).nexus_token, this.state.page, this.state.pageSize)
    .then((response) => {
      console.debug("Search Res", response.results);
      if (response.status === 200) {
      //console.debug('SEARCH RESULTS', response);
        if (response.total === 1) {  // for single returned items, customize the columns to match
          which_cols_def = this.columnDefType(response.results[0].entity_type);
          ////console.debug("which_cols_def: ", which_cols_def);
        }
      this.setState(
          {
          datarows: response.results, // Object.values(response.results)
          results_total: response.total,
          column_def: which_cols_def
          }
        );
        
        
      }
      this.setState({ loading: false });
    });
  };

  columnDefType = (et) => {
    //console.debug("ET ", et);
    if (et === 'Donor') {
        return COLUMN_DEF_DONOR;
    } 
    if (et === 'Dataset') {
        return COLUMN_DEF_DATASET;
    } 
    if (et === 'Upload') {
        return COLUMN_DEF_UPLOADS;
    } 
    return COLUMN_DEF_SAMPLE;
  }

  handleUrlChange = (targetPath) =>{
    console.debug("handleUrlChange "+targetPath)
    if(targetPath!=="----"){
      window.history.pushState(
        null,
        "", 
        "/"+targetPath);
    }
  }

  handlePageChange = (page) => {
    console.debug('Page changed', page)
    this.setState({
          page: page,
//          pageSize: params.pageSize
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  }

  handlePageSizeSelection = (pagesize) => {
    this.setState({
      pageSize: pagesize
    })
  }

  handleSearchButtonClick = () => {
    this.setState({
          datarows: [],
          page: 0    // reset the page
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  
  }

  handleTableSelection = (row) => {
    ////console.debug('you selected a row', row)   // datagrid only provides single selection,  Array[0]
    if (row.length > 0) {
      alert(row)
    }
  }

 cancelEdit = () => {
    this.setState({ editingEntity: null, 
      show_modal: false,  
      show_search: true
    });
    // console.debug("cancelEdit")
    // console.debug(this.props.match)
    // console.debug(this.props.match.params.type)
    this.handleUrlChange();
    this.handleSearchClick();
    //this.filterEntity();
    //this.props.onCancel();
  };

  onUpdated = data => {
    //this.filterEntity();
    //console.debug(this.props)
    this.setState({
      updateSuccess: true,
      // editingEntity: null,
      // show_search: true,
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);

    if(!this.state.editingEntity && this.props.editNewEntity){
      this.setState({ 
        editingEntity: this.props.editNewEntity
      });
    }
    //this.props.onCancel();
  };

  handleClose = () => {
    //console.log("App.js handleClose");
    this.setState({
      creatingNewUpload: false,
      anchorEl: null,
      show_menu_popup: false,
      open_edit_dialog: false, 
      creatingNewEntity: false,
      showSearch: true,
      show_search:true
    });
    //this.handleUrlChange("");
  };

  handleTableCellClick = (params) => {
    console.debug("handleTableCellClick");
    console.debug(params);
    
    if(params.field === 'uuid') return; // skip this field

    if (params.row) {
    // ////console.debug('CELL CLICK: entity', params.row.entity_type);
    ////console.debug('Local CELL CLICK: uuid', params.row.uuid);

    entity_api_get_entity(params.row.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;

        if(entity_data.read_only_state){
          ingest_api_allowable_edit_states(params.row.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
            .then((resp) => {
              //console.debug('ingest_api_allowable_edit_states done', resp)
            if (resp.status === 200) {
              let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
              this.setState({
                updateSuccess: null,
                editingEntity: entity_data,
                //editingDisplayId: display_id,
                readOnly: read_only_state,   // used for hidding UI components
                editForm: true,
                show_modal: true,
                show_search: false,
                });
          //this.props.onEdit();
            }
          });
        }else{
          this.setState({
            updateSuccess: null,
            editingEntity: entity_data,
            //editingDisplayId: display_id,
            readOnly: "read_only_state",   // used for hidding UI components
            editForm: true,
            show_modal: true,
            show_search: false,
            });
        }
      this.handleUrlChange(this.handleSingularty(entity_data.entity_type, "plural")+"/"+entity_data.uuid);
      }
    });
    }
  }

  handleClearFilter = () => {

    this.setState(
      {
        filtered: false,
        datarows: [],
        sampleType: "----",
        group: "All Components",
        keywords: "",
        page: 0
        //pageSize: PAGE_SIZE
      }, () => {
        this.handleSearchClick();
    });
  };

 onChangeGlobusLink(newLink, newDataset) {
    const {name, display_doi, doi} = newDataset;
    this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  }


  /**
    RENDER SECTION BELOW - All UI Components
  **/

  render() {
    if (this.state.isAuthenticated) {
    return  (
        
        <div className={"searchWrapper"+this.state.show_search} style={{ width: '100%' }}>

          {!this.state.show_search && (
             <Forms formType={this.state.formType} onCancel={this.handleClose} />
          )}
       
          
          {/*
          this.state.show_search && this.state.show_info_panel &&
           !this.props.custom_title && (
            this.renderInfoPanel())
            */}
          {this.state.show_search && (
            this.renderFilterControls()
            )}
          {this.renderLoadingBar()}
          {this.state.show_search && this.state.datarows &&
                    this.state.datarows.length > 0 && (
              this.renderTable())
          }
          
          {this.renderEditForm()}

        </div>
      );
    }
    return null;
  }

  renderProps() {
    // console.debug("INITIALSTATE",this.initialState);
    return (
      <div>
      {/* <span className="portal-jss116 text-center">
      Found Props: {this.state.preset.entityType} {this.state.preset.entityUuid}
      </span> <br /><br /> */}
      </div>
      );
}



  renderEditForm() {
    if (this.state.editingEntity) {

     
      const dataType = this.state.editingEntity.entity_type;
      if (dataType === "Donor") {
        return (
          <DonorForm
            //displayId={this.state.editingDisplayId}
            editingEntity={this.state.editingEntity}
            readOnly={this.state.readOnly}
            handleCancel={this.cancelEdit}
            onUpdated={this.onUpdated}
          />
        );
      } else if (dataType === "Sample") {
        return (
          <TissueForm
            displayId={this.state.editingDisplayId}
            editingEntity={this.state.editingEntity}
            editingEntities={this.state.editingEntities}
            readOnly={this.state.readOnly}
            handleCancel={this.cancelEdit}
            onUpdated={this.onUpdated}
            handleDirty={this.handleDirty}
          />
        );
      } else if (dataType === "Dataset") {
          return (
            <DatasetEdit
              handleCancel={this.cancelEdit}
              editingDataset={this.state.editingEntity}
              onUpdated={this.onUpdated}
              //onCreated={this.handleDatasetCreated}
              changeLink={this.onChangeGlobusLink.bind(this)}
            />
          );
      } else if (dataType === "Upload") {
          return (
            <UploadsEdit
            handleCancel={this.cancelEdit}
            editingUpload={this.state.editingEntity}
            onUpdated={this.onUpdated}
            groups={this.state.groups}
            changeLink={this.onChangeGlobusLink.bind(this)}
          />
          );
      } else {
        return <div />;
      }
    }
  }


renderInfoPanel() {
      return (
        <div>
        <span className="portal-jss116 text-center">
              ** To register new items, use the REGISTER NEW ITEM menu above to select which type you wish to create.
        </span> <br /><br />
        </div>
        );
  }

  renderLoadingBar() {
    console.debug("renderLoadingBar", this.state.loading);
    if (this.state.loading) {
      return (<div>
        <LinearProgress />
      </div>
      );
    }
  }

  renderTable() {
  return ( 
      <Paper className="paper-container">
      <div style={{ height: 590, width: '100%' }}>
        <DataGrid 
              rows={this.state.datarows}
              columns={this.state.column_def}
              disableColumnMenu={true}
              pagination
              hideFooterSelectedRowCount
              rowCount={this.state.results_total}
              paginationMode="server"
              onPageChange={(params) => 
                this.handlePageChange(params)
              }
              onPageSizeChange={(page) =>
                this.handlePageSizeSelection(page)
              }
              loading={this.state.loading}
              onCellClick={this.props.select ? this.props.select : this.handleTableCellClick}  // this allows a props handler to override the local handler
        />
      </div>
      </Paper>
    );
  }

  renderFilterControls() {
    return (
//      <Modal show={this.props.show} handleClose={this.props.hide} scrollable={true}>
       // <div className="row">
       //   <div className="col-sm-6">
            <div className="card pt-2">
              {this.props.custom_title && (
                <span className="portal-label text-center">{this.props.custom_title}</span>
              )}
              {!this.props.custom_title && (
                <span className="portal-label text-center">Search</span>
              )}
              <span className="portal-jss116 text-center">

              <h1>{this.props.test}</h1>
              Use the filter controls to search for Donors, Samples, Datasets or Data Uploads.
              If you know a specific ID you can enter it into the keyword field to locate individual entities.
              </span>
              <div className="card-body search-filter">
      
                <form>
                  <div className="row">
                    <div className="col">
                    <div className="form-group">
                      <label htmlFor="group" className="portal-jss116">Group</label>
                        <select
                          name="group"
                          id="group"
                          className="select-css"
                          onChange={this.handleInputChange}
                          //ref={this.group}
                          value={this.state.group}
                          >
          
                         {search_api_search_group_list().map((group, index) => {
                                  return (
                                    <option key={group.uuid} value={group.uuid}>
                                      {group.shortname}
                                    </option>
                                  ); 
                          })}
                        </select>
                    </div>
                    </div>
                  
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="sampleType" className="portal-jss116">Type</label>
                        <select
                          name="sampleType"
                          id="sampleType"
                          className="select-css"
                          onChange={this.handleInputChange}
                          //ref={this.sampleType}
                          value={this.handleSingularty(this.state.sampleType, "singular")}
                        >
                          <option value="">----</option>
                          {this.state.entity_type_list.map((optgs, index) => {
                            return (
                              <optgroup
                                key={index}
                                label="____________________________________________________________"
                              >
                                {Object.entries(optgs).map(op => {
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
                    </div>
                    </div>
 
                  </div>
                  <div className="row">
                      <div className="col-sm-12">
                       <input
                        type="text"
                        className="form-control"
                        name="keywords"
                        id="keywords"
                        placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                        onChange={this.handleInputChange}
                        //ref={this.keywords}
                        value={this.state.keywords}
                      />
                     </div>
                  
                  </div>
          
                <div className="row mb-5 pads">
                  <div className="col-sm-4 offset-sm-2">
                    <button
                      className="btn btn-primary btn-block"
                      type="button"
                      onClick={this.handleSearchButtonClick}
                    >
                      Search
                    </button>
                  </div>
                  <div className="col-sm-4">
                    <button
                      className="btn btn-outline-secondary btn-block"
                      type="button"
                      onClick={this.handleClearFilter}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {this.state.datarows &&
                  this.state.datarows.length === 0 && 
                  this.state.filtered && 
                  !this.state.loading && (
                    <div className="text-center">No record found.</div>
                  )}
             </form>
              </div>
            </div>

          //</div>
       // </div>
      //</Modal>
    );
  }
}

export default SearchComponent;
