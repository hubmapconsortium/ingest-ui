import React, { Component } from "react";
import { DataGrid } from '@material-ui/data-grid';
import Paper from '@material-ui/core/Paper';

import axios from "axios";
import DonorForm from "../uuid/donor_form_components/donorForm";
import TissueForm from "../uuid/tissue_form_components/tissueForm";
import UploadsEdit from "../uploads/editUploads";
import DatasetEdit from "../ingest/dataset_edit";
import { SAMPLE_TYPES } from "../../constants";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api_search2, search_api_search_group_list } from '../../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './table_constants';

import { entity_api_get_entity } from '../../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_users_groups } from '../../service/ingest_api';

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
    pageSize: 25,
    editForm: false,
    show_modal: false,
    hide_modal: true, 
    updateSuccess: false,
    globus_url: "",
    isAuthenticated: false,
    group: "All Components",
    sampleType: "----",
    keywords: ""
  };

  // constructor(props) {
  //   super(props);
  //   // this.group = React.createRef();
  //   // this.sampleType = React.createRef();
  //   // this.keywords = React.createRef();
  // }

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

      // do an initial load using default criteria
      
      this.handleSearchClick();
   
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.editNewEntity !== this.props.editNewEntity) {
      // //console.log("PROP UPDATE");
      // //console.debug(this.props.editNewEntity);
      this.setState({
        editingEntity: this.props.editNewEntity,
        editForm: true,
        show_modal: true,
        show_search: false
        });
    }
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    //console.debug('handleInputChange', name)
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

    ////console.debug('FILTER TYPES', SAMPLE_TYPES)
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

    const group = this.state.group;
    const sample_type = this.state.sampleType;
    const keywords = this.state.keywords;
  
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
      if (sample_type === 'donor') {
        params["entity_type"] = "Donor";
        which_cols_def = COLUMN_DEF_DONOR;
      } else if (sample_type === 'dataset') {
            params["entity_type"] = "Dataset";
            which_cols_def = COLUMN_DEF_DATASET;
        } else if (sample_type === 'uploads') {
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

    //console.debug('params ', params);

    api_search2(params, JSON.parse(localStorage.getItem("info")).nexus_token, this.state.page, this.state.pageSize)
    .then((response) => {
      //console.debug("Serch Res", response.results);
      if (response.status === 200) {
      ////console.debug('SEARCH RESULTS', response);
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

  handlePageChange = (params) => {
    ////console.debug('Page changed', params)
    this.setState({
          page: params.page,
          pageSize: params.pageSize
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  
  }

  handleTableSelection = (row) => {
    ////console.debug('you selected a row', row)   // datagrid only provides single selection,  Array[0]
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
    //console.debug(this.props)
    this.setState({
      updateSuccess: true,
      editingEntity: null,
      show_search: true,
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

  handleTableCellClick = (params) => {

    //onsole.debug('handleTableCellClick', params)
    //if(params.field !== 'hubmap_id') {
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


        // check to see if user can edit
        
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
        keywords: ""
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
        
        <div style={{ width: '100%' }}>
          {/*
          this.state.show_search && this.state.show_info_panel &&
           !this.props.custom_title && (
            this.renderInfoPanel())
            */}
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
                    ////console.log('length>1', result)
                   this.handleTableSelection(result);
                } else {
                  ////console.log('length < 1',newSelectionModel )
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
       //   <div className="col-sm-6">
            <div className="card">
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
                          value={this.state.sampleType}
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
                        placeholder="Enter a keyword or HuBMAP/Submission/Lab ID"
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
