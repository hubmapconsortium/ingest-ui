import React, { Component } from "react";
import { DataGrid, GridToolbar} from '@material-ui/data-grid';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import Forms from "../uuid/forms";
import Modal from "../uuid/modal";

import DonorForm from "../uuid/donor_form_components/donorForm";
import TissueForm from "../uuid/tissue_form_components/tissueForm";
import DatasetEdit from "../ingest/dataset_edit";
import { SAMPLE_TYPES, GROUPS } from "../../constants";
import { flattenSampleType } from "../../utils/constants_helper";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faInfoCircle, faFilter, faPlus } from "@fortawesome/free-solid-svg-icons";
import { api_search2, search_api_search_group_list } from '../../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET } from './table_constants';

import { entity_api_get_entity } from '../../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_users_groups } from '../../service/ingest_api';

class SearchComponent extends Component {
  state = {
    selectionModel: "",
    filtered_keywords: "",
    filtered: false,
    entity_type_list: SAMPLE_TYPES,
    column_def: COLUMN_DEF_DONOR,
    keywords: "",
    show_info_panel: true,
    show_search: true,
    results_total: 0,
    page: 0,
    pageSize: 25,
    editForm: false,
    show_modal: false,
    hide_modal: true, 
    updateSuccess: false,
    globus_url: "",
    isAuthenticated: false
  };

  constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
  }

  componentDidMount() { 

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
  }
  
  /*
  set filter fo the Types dropdown, which depends on the propos.filter_type, if avaliable
  */
  setFilterType = () => {

    var new_filter_list = [];

    //console.debug('FILTER TYPES', SAMPLE_TYPES)
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
    this.setState({ loading: true, filtered: true });

    const group = this.group.current.value;
    const sample_type = this.sampleType.current.value;
    const keywords = this.keywords.current.value;
    let params = {};
    let which_cols_def = COLUMN_DEF_SAMPLE;  //default


    if (group && group !== 'All Components') {
        params["group_uuid"] = group;
    }

    if (sample_type) {
      if (sample_type === 'donor') {
        params["entity_type"] = "Donor";
        which_cols_def = COLUMN_DEF_DONOR;
      } else if (sample_type === 'dataset') {
            params["entity_type"] = "Dataset";
            which_cols_def = COLUMN_DEF_DATASET;
        } else {
          params["specimen_type"] = sample_type;
      } 
    } 
    if (keywords) {
      params["search_term"] = keywords;
    }

    //console.debug('search page size: ', this.state.pageSize);

    api_search2(params, JSON.parse(localStorage.getItem("info")).nexus_token, this.state.page, this.state.pageSize)
    .then((response) => {

      if (response.status === 200) {
      //console.debug('SEARCH RESULTS', response);
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

  handlePageChange = (params) => {
    //console.debug('Page changed', params)
    this.setState({
          page: params.page,
          pageSize: params.pageSize
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  
  }

  handleTableSelection = (row) => {
    //console.debug('you selected a row', row)   // datagrid only provides single selection,  Array[0]
    // if (row.length > 0) {
    //   alert(row)
    // }
  }

 cancelEdit = () => {
    this.setState({ editingEntity: null, 
      show_modal: false,  
      show_search: true
    });
    //this.filterEntity();
    //this.props.onCancel();
  };

  onUpdated = data => {
    //this.filterEntity();
    this.setState({
      updateSuccess: true,
      editingEntity: null,
      show_search: true,
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);
    //this.props.onCancel();
  };

  handleTableCellClick = (params) => {

    //onsole.debug('handleTableCellClick', params)
    //if(params.field !== 'hubmap_id') {
    if(params.field === 'uuid') return; // skip this field

    if (params.row) {
    // //console.debug('CELL CLICK: entity', params.row.entity_type);
   //console.debug('Local CELL CLICK: uuid', params.row.uuid);

    entity_api_get_entity(params.row.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;

        // check to see if user can edit
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
      }
    });
    }
  }

  handleClearFilter = () => {

    this.setState(
      {
        filtered: false,
        datarows: []
      }
    );
    //this.group.current.value = "All Components";
    this.sampleType.current.value = "----";
    this.keywords.current.value = "";
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
        
        <div style={{ width: '100%' }}>
          {
          this.state.show_search && this.state.show_info_panel &&
           !this.props.custom_title && (
            this.renderInfoPanel())}
          {this.state.show_search && (
            this.renderFilterControls()
            )}

          {this.state.show_search && this.state.datarows &&
                    this.state.datarows.length > 0 && (
              this.renderTable())
          }
          {this.renderLoadingSpinner()}
          {this.renderEditForm()}

        </div>
      );
    }
    return null;
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

  renderLoadingSpinner() {
    if (this.state.loading) {
      return (
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" />
        </div>
      );
    }
  }

  renderTable() {
  return ( 
      <Paper className="paper-container">
      <div style={{ height: 590, width: '100%' }}>
        <DataGrid rows={this.state.datarows}
              columns={this.state.column_def}
              //columns={this.state.column_def.map((column) => ({
              //    ...column,
              //    disableClickEventBubbling: true
              //}))}
              disableColumnMenu={true}
              pageSize={this.state.pageSize} 
              pagination
              hideFooterSelectedRowCount
              rowCount={this.state.results_total}
              paginationMode="server"
              onPageChange={this.handlePageChange}
              onPageSizeChange={this.handlePageChange}
              loading={this.state.loading}
              //checkboxSelection
              //components={{
              //  Toolbar: GridToolbar,
              //}}
              /*onSelectionModelChange={(selection) => {
    
                  const newSelectionModel = selection.selectionModel;
                  if (newSelectionModel.length > 1) {
                    const selectionSet = new Set(this.state.selectionModel);
                    const result = newSelectionModel.filter(
                      (s) => !selectionSet.has(s)
                     );
                    //console.log('length>1', result)
                   this.handleTableSelection(result);
                } else {
                  //console.log('length < 1',newSelectionModel )
                    this.handleTableSelection(newSelectionModel);
                }
              }}*/
              //selectionModel={this.state.selectionModel}
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
       //   <div className="col-sm-12">
            <div className="card text-center">
              {this.props.custom_title && (
                <span className="portal-label">{this.props.custom_title}</span>
              )}
              {!this.props.custom_title && (
                <span className="portal-label">Search</span>
              )}
              <span className="portal-jss117">
              Use the filter controls to search for Donors, Samples, Datasets or Data Uploads.
              If you know a specific ID you can enter it into the keyword field to locate individual entities.
        </span>
              <div className="card-body search-filter">
      
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label htmlFor="group" className="offset-sm-2 portal-jss116">Group</label>
                       <div className="col-sm-9">
                        <select
                          name="group"
                          id="group"
                          className="select-css"
                          ref={this.group}
                          //value={this.state.group}
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
                  </div>
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label htmlFor="specimen_type" className="portal-jss116">Type</label>
                      <div className="col-sm-9">
                        <select
                          name="specimen_type"
                          id="specimen_type"
                          className="select-css"
                          onChange={this.handleInputChange}
                          ref={this.sampleType}
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
                </div>
                <div className="row pads">
                  <div className="col-sm-12">
                    <input
                        type="text"
                        className="form-control"
                        name="keyworkds"
                        id="keywords"
                        placeholder="Enter a keyword or HuBMAP/Submission/Lab ID"
                        ref={this.keywords}
                      />
                  </div>
                </div>

                <div className="row mb-5">
                  <div className="col-sm-4 offset-sm-2">
                    <button
                      className="btn btn-primary btn-block"
                      type="button"
                      onClick={this.handleSearchClick}
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
            
              </div>
            </div>
          //</div>
       // </div>
      //</Modal>
    );
  }
}

export default SearchComponent;
