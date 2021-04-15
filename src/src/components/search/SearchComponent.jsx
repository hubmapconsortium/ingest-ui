import React, { Component } from "react";
import { DataGrid } from '@material-ui/data-grid';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
//import Modal from "../modal";

import { SAMPLE_TYPES, GROUPS } from "../../constants";
import { flattenSampleType } from "../../utils/constants_helper";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { api_search2, search_api_search_group_list } from '../../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET } from './table_constants';
import axios from "axios";


class SearchComponent extends Component {
  state = {
    selectionModel: "",
    filtered_keywords: "",
    filtered: false
  };

  constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
  }

  componentDidMount() {

    this.setState({
      LookUpShow: false,
      column_def: COLUMN_DEF_DONOR,
      keywords: ""
    });
  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };
  
  //handleSiblingClick = 

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

    console.debug('search parm', params)

    api_search2(params, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {

      if (response.status === 200) {
      console.log('Model Search results...');
      console.log(response.results);
      this.setState(
          {
          datarows: response.results, // Object.values(response.results)
          column_def: which_cols_def
          }
        );
      }
       this.setState({ loading: false });
    });
  };

  handleTableSelection = (row) => {
    console.debug('you selected a row', row)   // datagrid only provides single selection,  Array[0]
    if (row.length > 0) {
      alert(row)
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

  render() {
    return (
        <div style={{ width: '100%' }}>
          {this.renderFilterControls()}

          {this.state.datarows &&
                    this.state.datarows.length > 0 && (
              this.renderTable())
          }
          {this.renderLoadingSpinner()}

        </div>
      );

  }

  renderLoadingSpinner() {
    if (this.state.loading) {
      return (
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="6x" />
        </div>
      );
    }
  }

  renderTable() {
  return (
      <Paper className="paper-container">
      <div style={{ height: 700, width: '100%' }}>
        <DataGrid rows={this.state.datarows} columns={this.state.column_def} 
              pageSize={25} 
              onSelectionModelChange={(newSelection) => {
                  this.handleTableSelection(newSelection.selectionModel);
              }}
              selectionModel={this.state.selectionModel}
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
  
              <div className="card-body search-filter">
      
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label htmlFor="group" className="col-sm-3 portal-jss116">Group</label>
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
                      <label htmlFor="specimen_type" className="col-sm-3 portal-jss116">Type</label>
                      <div className="col-sm-9">
                        <select
                          name="specimen_type"
                          id="specimen_type"
                          className="select-css"
                          onChange={this.handleInputChange}
                          ref={this.sampleType}
                        >
                          <option value="">----</option>
                          {SAMPLE_TYPES.map((optgs, index) => {
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
