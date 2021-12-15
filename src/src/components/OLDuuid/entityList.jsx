import React, { Component } from "react";
import '../../App.css';

//import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faFilter, faBan } from "@fortawesome/free-solid-svg-icons";
import DonorForm from "./donor_form_components/donorForm";
import TissueForm from "./tissue_form_components/tissueForm";
//import { naturalLanguageJoin } from "../../utils/string_helper";
import { flattenSampleType } from "../../utils/constants_helper";
import { SAMPLE_TYPES } from "../../constants";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';
import { api_search } from '../service/search_api';
import { entity_api_get_entity } from '../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_get_associated_ids } from '../service/ingest_api';
//import MultipleListModal from "./tissue_form_components/multipleListModal";

import {ReactComponent as DONOR_IMAGE} from "../../assets/img/donor.svg"
import {ReactComponent as SAMPLE_IMAGE} from "../../assets/img/sample.svg"


class EntityList extends Component {
  state = {
    editingEntity: null,
    viewingEntity: null,
    isDirty: false,
    loading: false,
    entities: [],
    // group_name: "IEC Testing Group",
    filter_group: "All Groups",
    filter_sample_type: "",
    filter_keywords: "",
    filtered_totals: 0,
    filtered: false,
    pages: [10, 25, 50],
    page: 0,
    setPage: 0,
    rowsPerPage: 25,
    setRowsPerPage: 25,
    authToken: JSON.parse(localStorage.getItem("info")).groups_token,
    // showAsMultipleFormat: "",
    // multiples: []
  };

  constructor(props) {
    super(props);

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
 handleChangePage = (event, newPage) => {
    this.setState({
        page: newPage
    });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({
        rowsPerPage: parseInt(event.target.value),
        page: 0
    });
  };

   handleDirty = (isDirty) => {
    this.setState({
      isDirty: isDirty
    });
    console.debug('EntityList:isDirty', isDirty);
  }

  // selectClassforDataType(dataType) {
  //   dataType = dataType.toLowerCase();
  //   if (dataType === "donor") {
  //     return "table-primary";
  //   } else if (dataType === "sample") {
  //     return "table-success";
  //   } else {
  //     return "table-secondary";
  //   }
  // }

  // whatDataType(dataType) {
  //    dataType = dataType.toLowerCase();
  //   if (dataType === "donor") {
  //     return DONOR_IMAGE
  //   } else if (dataType === "sample") {
  //     return SAMPLE_IMAGE 
  //   } 
  //   return ""
  // }
  // getEntityData = (uuid) => {

  //   console.debug(uuid);
  //   entity_api_get_entity(uuid, this.state.authToken)
  //   .then((response) => {
  //     if (response.status === 200) {
  //     console.debug('Entity results...');
  //     console.debug(response.results);
  //     return response.results;
  //     }
  //     console.debug(response.status);
  //   });
  // }

 editForm = (entity, display_id, es) => {
    console.debug('in the editForm')
    
    entity_api_get_entity(entity.uuid, this.state.authToken)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;

        // check to see if user can edit
        ingest_api_allowable_edit_states(entity.uuid, this.state.authToken)
          .then((resp) => {
          if (resp.status === 200) {
            console.debug('api_allowable_edit_states...');
            console.debug(resp.results);
            let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
            this.setState({
              updateSuccess: null,
              editingEntity: entity_data,
              editingDisplayId: display_id,
              editingEntities: es,
              readOnly: read_only_state   // used for hidding UI components
              });
        this.props.onEdit();

          }
        });
      }
    });
  };

/*  editForm = (entity, display_id, es) => {
    console.debug('in the editForm')
    let et = this.getEntityData(entity.uuid);
    console.debug(et)

    this.setState({
      updateSuccess: null,
      editingEntity: entity,
      editingDisplayId: display_id,
      editingEntities: es,
      readOnly: false
    });
    this.props.onEdit();
  };
*/
  viewForm = (entity, display_id, es) => {
    this.setState({
      updateSuccess: null,
      editingEntity: entity,
      editingDisplayId: display_id,
      editingEntities: es,
      readOnly: true
    });
    this.props.onEdit();
  };

  cancelEdit = () => {
    this.setState({ editingEntity: null });
    this.filterEntity();
    this.props.onCancel();
  };

  onUpdated = data => {
    this.filterEntity();
    this.setState({
      updateSuccess: true,
      editingEntity: null
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);
    this.props.onCancel();
  };

  handleFilterInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "group":
        this.setState({
          filter_group: value
        });
        break;
      case "sample_type":
        this.setState({
          filter_sample_type: value
        });
        break;
      case "keywords":
        this.setState({
          filter_keywords: value
        });
        break;
      default:
        break;
    }
  };

  filterEntity = () => {
    const group = this.state.filter_group;
    const sample_type = this.state.filter_sample_type;
    const keywords = this.state.filter_keywords;
    this.setState({ loading: true });
//     let requestBody = esb.requestBodySearch().query(
//       esb.boolQuery()
//           .must(esb.matchQuery('group_name', group))
//           .filter(esb.matchQuery('entity_type', 'sample_type'))
// );
//     requestBody.query(esb.matchQuery('group_name', fields[f]));
    let params = {};

    if (group && group !== 'All Groups') {
        params["group_name"] = group;
    }
  
    if (sample_type) {
      if (sample_type === 'donor') {
        params["entity_type"] = "Donor";
      } else if (sample_type === 'dataset') {
            params["entity_type"] = "Dataset";
        } else {
          params["specimen_type"] = sample_type;
      } 
    }  
     else {
       params["entity_type"] = "DonorSample";  // for dual search
    }
    if (keywords) {
      params["search_term"] = keywords;
    }
    console.debug(' filterEntity....')
    console.debug(params);

    // let query = api_es_query_builder(params);

    api_search(params, this.state.authToken)
    .then((response) => {

      if (response.status === 200) {
      //console.debug('Search results...');
      //console.debug(entities);
      this.setState(
          {
          loading: false,
          entities: response.results,
          filtered_totals: Object.keys(response.results).length,
          filtered: true,
          page: 0
          }
        );
      }
    });
  };

  clearFilterEntity = () => {

    this.setState(
      {
        filter_group: "All Groups",
        filter_sample_type: "",
        filter_keywords: "",
        filtered: false,
        entities: [],
        loading: false,
        filtered_totals: 0
      }
      // () => {
      //   this.renderLoadingSpinner();
      //   //this.filterEntity();
      // }
    );
  };


  renderFilterControls() {

    //const classes = useStyles();
    if (!this.state.editingEntity) {
      return (
        <div>
          <div className="card mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-sm-4">
                  <div className="form-group row">
                    <label
                      htmlFor="group"
                      className="col-sm-3 portal-jss116 text-right">
                      Group
                    </label>
                    <div className="col-sm-9">
                      <select
                        name="group"
                        id="group"
                        className="form-control"
                        value={this.state.filter_group}
                        onChange={this.handleFilterInputChange}
                      >
                        <option value="All Groups">All Components</option>
                        <option value="Broad Institute RTI">
                          &nbsp;&nbsp;RTI - Broad
                        </option>
                        <option value="General Electric RTI">
                          &nbsp;&nbsp;RTI - GE
                        </option>
                        <option value="Northwestern RTI">
                          &nbsp;&nbsp;RTI - Northwestern
                        </option>
                        <option value="Stanford RTI">
                          &nbsp;&nbsp;RTI - Stanford
                        </option>
                        <option value="California Institute of Technology TMC">
                          &nbsp;&nbsp;TMC - Cal Tech
                        </option>
                        <option value="Stanford TMC">
                          &nbsp;&nbsp;TMC - Stanford
                        </option>
                        <option value="University of California San Diego TMC">
                          &nbsp;&nbsp;TMC - UCSD
                        </option>
                        <option value="University of Florida TMC">
                          &nbsp;&nbsp;TMC - UFlorida
                        </option>
                        <option value="Vanderbilt TMC">
                          &nbsp;&nbsp;TMC - Vanderbilt
                        </option>
                        <option value="Cal Tech TTD">
                          &nbsp;&nbsp;TTD - Cal Tech
                        </option>
                        <option value="Harvard TTD">
                          &nbsp;&nbsp;TTD - Harvard
                        </option>
                        <option value="Purdue TTD">
                          &nbsp;&nbsp;TTD - Purdue
                        </option>
                        <option value="Stanford TTD">
                          &nbsp;&nbsp;TTD - Stanford
                        </option>
                        <option value="IEC Testing Group">
                          IEC Testing Group
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="col-sm-5">
                  <div className="form-group row">
                    <label
                      htmlFor="sample_type"
                      className="col-sm-4 portal-jss116 text-right">
                      Type
                    </label>
                    <div className="col-sm-8">
                      <select
                        name="sample_type"
                        id="sample_type"
                        className="form-control"
                        value={this.state.filter_sample_type}
                        onChange={this.handleFilterInputChange}
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
              <div className="row">
                <div className="col-sm-9">
                  <input
                    type="text"
                    className="form-control"
                    name="keywords"
                    id="keywords"
                    placeholder="Search by keywords or HuBMAP ID"
                    value={this.state.filter_keywords}
                    onChange={this.handleFilterInputChange}
                  />
                </div>
                <div className="col-sm-3">
                  <button
                    className="btn btn-dark mr-2"
                    type="button"
                    onClick={this.filterEntity}
                  >
                    <FontAwesomeIcon icon={faFilter} /> Filter
                  </button>
                  {this.state.filtered && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={this.clearFilterEntity}
                    >
                      <FontAwesomeIcon icon={faBan} /> Clear
                    </button>
                  )}
                </div>
              </div> 
            </div>
          </div>
          </div>
      );
    }
  }

renderTable() {
  if (!this.state.loading && !this.state.editingEntity) {

      return (
        <div>
            <TableContainer component={Paper}>
      <Table className="table-fmt" size="small" aria-label="Result table">
        <TableHead>
          <TableRow className="portal-jss120">
       
             <TableCell align="center">HuBMAP ID</TableCell>
             <TableCell align="center">Submission ID</TableCell>
            <TableCell align="center">Submission Type</TableCell>    
            <TableCell align="center">Lab Group</TableCell>
            <TableCell align="center">Lab's Non-PHI Name/ID</TableCell>
            <TableCell align="center">Entered By</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>      
              {Object.values(this.state.entities)
                .slice(this.state.page * this.state.rowsPerPage, this.state.page * this.state.rowsPerPage + this.state.rowsPerPage)
                .map(es => {
                const entity = es[0];
                //console.debug(entity)
                let first_lab_id = entity.hubmap_display_id ? entity.hubmap_display_id : "Unavailable";   // hack because data inconsistencies
                //console.debug(entity.hubmap_display_id);
                let last_lab_id = "";
                let id_common_part = first_lab_id.substring(
                  0,
                  first_lab_id.lastIndexOf("-") + 1
                );
                let first_lab_id_num = "";
                let last_lab_id_num = ""; 
                let display_id = entity.hubmap_display_id;

                if (es.length > 1) {
                  es.sort((a, b) => {
                    if (
                      parseInt(
                        a.hubmap_display_id.substring(
                          a.hubmap_display_id.lastIndexOf("-") + 1
                        )
                      ) >
                      parseInt(
                        b.hubmap_display_id.substring(
                          a.hubmap_display_id.lastIndexOf("-") + 1
                        )
                      )
                    ) {
                      return 1;
                    }
                    if (
                      parseInt(
                        b.hubmap_display_id.substring(
                          a.hubmap_display_id.lastIndexOf("-") + 1
                        )
                      ) >
                      parseInt(
                        a.hubmap_display_id.substring(
                          a.hubmap_display_id.lastIndexOf("-") + 1
                        )
                      )
                    ) {
                      return -1;
                    }
                    return 0;
                  });
                  first_lab_id = es[0].hubmap_display_id;
                  last_lab_id = es[es.length - 1].hubmap_display_id;

                  first_lab_id_num = first_lab_id.substring(
                    first_lab_id.lastIndexOf("-") + 1,
                    first_lab_id.length
                  );

                  last_lab_id_num = last_lab_id.substring(
                    last_lab_id.lastIndexOf("-") + 1,
                    last_lab_id.length
                  );

                  display_id = `${id_common_part}[${first_lab_id_num} through ${last_lab_id_num}]`;
                }
                return (
                  <React.Fragment key={display_id}>
                     <TableRow className="portal-jss300 portal-jss298" key={entity.hubmap_display_id}>
                      
                    
                      <TableCell align="left" className="nowrap">
                        
                        <button
                            className="btn btn-link portal-links portal-jss298"
                            onClick={() =>
                              this.editForm(entity, display_id, es)
                            }>
                            {entity.display_doi}
                          </button>
                      
                      </TableCell>
                      <TableCell align="left" className="nowrap">
                      {es.length > 1 && (
                          <React.Fragment>
                            {id_common_part} [{first_lab_id_num}{" "}
                            <small>through</small> {last_lab_id_num}]
                          </React.Fragment>
                        )}
                        {es.length === 1 && first_lab_id}
                        </TableCell>
    
                      <TableCell align="left">
                      {entity.entity_type === "Sample" ? <SAMPLE_IMAGE />
                          : <DONOR_IMAGE />
                          } 
                        {entity.entity_type === "Sample"
                          ? flattenSampleType(SAMPLE_TYPES)[
                              entity.specimen_type
                            ]
                          : entity.entity_type}
                      </TableCell>
                       <TableCell align="left" className="nowrap">{entity.group_name}</TableCell>
                      <TableCell align="left">
                        {entity.lab_donor_id ||
                          entity.lab_tissue_sample_id}
                      </TableCell>
                      <TableCell align="left">{entity.created_by_user_email}</TableCell>
                    </TableRow> 
                  </React.Fragment>
                );
              })}
            </TableBody>
            <tfoot>
              {(this.state.filtered_totals === 0 && this.state.filtered) && (
                <TableRow>
                  <TableCell align="left" colSpan="5">No records found</TableCell>
                </TableRow>
               
              )}
            
            </tfoot>
         </Table>
    </TableContainer>
    <TablePagination
          rowsPerPageOptions={this.state.pages}
          component="div"
          count={this.state.filtered_totals}
          rowsPerPage={this.state.rowsPerPage}
          page={this.state.page}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
          />
        </div>
        );
    }
}

  donorImage() {
    //return <svg className='portal-jss64 sc-fzqNJr cPhlSY portal-jss65' width='36px' height='36px' focusable='false' viewBox='0 0 24 24' aria-hidden='true' role='presentation' style='font-size: 36px;'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v1c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-1c0-2.66-5.33-4-8-4z'></path></svg>
    return DONOR_IMAGE;
      }
  sampleImage() {
    //return <svg className="portal-jss64 sc-fzoyAV lgNqAS portal-jss65" width="36px" height="36px" focusable="false" viewBox="0 0 24 24" aria-hidden="true" role="presentation"><circle cx="7.2" cy="14.4" r="3.2"></circle><circle cx="14.8" cy="18" r="2"></circle><circle cx="15.2" cy="8.8" r="4.8"></circle></svg>                      
    return SAMPLE_IMAGE;
  }

  renderKey() {
    return (<div>
      </div>
      );
  }

  // checkForMultiples(entity) {

  //   ingest_api_get_associated_ids(entity.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
  //    .then((resp) => {
  //         if (resp.status === 200) {
  //           console.debug('checkForMultiples', resp.results);

  //           if (resp.results.length > 1) {
  //             var multi = {new_samples: resp.results, entity: entity}
  //             this.setState({
  //               showAsMultipleFormat: 'SINGLE',
  //               multiples: multi
  //             });
  //             return true;
              
  //           } else {
  //             console.debug('SINGLE -NO MULTIPLES')
  //             return false;
  //           }
  //         }
  //       });
  // }

renderEditForm() {
    if (this.state.editingEntity) {
      const dataType = this.state.editingEntity.entity_type.toLowerCase();
      if (dataType === "donor") {
        return (
          <DonorForm
            displayId={this.state.editingDisplayId}
            editingEntity={this.state.editingEntity}
            readOnly={this.state.readOnly}
            handleCancel={this.cancelEdit}
            onUpdated={this.onUpdated}
          />
        );
      } else if (dataType === "sample") {
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
      } else {
        return <div />;
      }
    }
  }

  render() {
    return (
      <div>
 
        {this.state.updateSuccess === true && (
          <div className="alert alert-success">Updated!</div>
        )}
        {this.state.updateSuccess === false && (
          <div className="alert alert-danger">Update failed!</div>
        )}
        {this.renderFilterControls()}
       {/* {this.renderKey()}*/}
        {this.renderTable()}
        {this.renderLoadingSpinner()}
        {this.renderEditForm()}
        {/* <Modal
          show={this.state.show}
          handleClose={this.hideModal}
          children={this.renderEditForm()}
        /> */}
      </div>
    );
  }
}

export default EntityList;
