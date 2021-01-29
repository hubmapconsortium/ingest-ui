import React, { Component } from "react";
import Modal from "../modal";
import axios from "axios";
import { SAMPLE_TYPES } from "../../../constants";
import { flattenSampleType } from "../../../utils/constants_helper";
import IDSearchModalMultiSelect from "./idSearchModalMultiSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";
import { api_search } from '../../../service/search_api';

class IDSearchModal extends Component {
  state = {};

  constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
    //this.uuid_list = [];
    //this.handleSiblingClick = this.handleSiblingClick.bind(this);
  }

  componentDidMount() {
    this.setState({
      LookUpShow: false
    });
  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };
  
  //handleSiblingClick = 

  handleSearchClick = () => {
    const group = this.group.current.value;
    const sample_type = this.sampleType.current.value;
    const keywords = this.keywords.current.value;
    let params = {};
    params["group_name"] = group;
    if (sample_type) {
      params["specimen_type"] = sample_type;
    }  else {
      params["entity_type"] = sample_type;
    }
    if (keywords) {
      params["search_term"] = keywords;
    }


    api_search(params, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {

      if (response.status == 200) {
      console.log('Model Search results...');
      console.log(response.results);
      this.setState(
          {
          HuBMAPIDResults: Object.values(response.results)
          }
        );
      }
    });


    // const config = {
    //   headers: {
    //     Authorization:
    //       "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
    //     "Content-Type": "multipart/form-data"
    //   },
    //   params: params
    // };

    // var specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`;
    // if (this.props.parent === "dataset") {
    //   specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search?include_datasets=true`;
    // }

    // axios
    //   .get(`${specimen_url}`, config)
    //   .then(res => {
    //     let entities = {};
    //     if (this.props.parent === "dataset") {
    //       res.data.specimens.forEach(s => {
    //         if (entities[s.properties.uuid]) {
    //           entities[s.properties.uuid].push(s);
    //         } else {
    //           entities[s.properties.uuid] = [s];
    //         }
    //       });
    //     } else {
    //       entities = res.data.specimens;
    //     }
    //     this.setState({
    //       HuBMAPIDResults: Object.values(entities)
    //     });
    //   })
    //   .catch(error => {
    //     console.log(error);
    //   });
  };

  getUuidList = (new_uuid_list) => {
    console.log('deep inidSearchModel', new_uuid_list)
    this.setState({uuid_list: new_uuid_list}); 
	this.props.parentCallback(new_uuid_list);
  };
  
  showSibling = e => {
    // e.stopPropagation();
    // this.setState({
    //   showSibling: !this.state.showSibling
    // });
  };

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          {this.state.LookUpShow && <IDSearchModalMultiSelect
            show={this.state.LookUpShow}
            //hide={this.hideLookUpModal}
            select={this.handleSelectClick}
            uuid_list={this.state.uuid_list}
            parentCallback = {this.getUuidList}
            currentSourceIds={this.props.currentSourceIds}
          />}

          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">HuBMAP ID Look Up</h5>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label
                        htmlFor="group"
                        className="col-sm-3 col-form-label text-right"
                      >
                        Group
                      </label>
                      <div className="col-sm-9">
                        <select
                          name="group"
                          id="group"
                          className="form-control"
                          ref={this.group}
                          value={this.state.group}
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
                  <div className="col-sm-6">
                    <div className="form-group row">
                      <label
                        htmlFor="specimen_type"
                        className="col-sm-3 col-form-label text-right"
                      >
                        Type
                      </label>
                      <div className="col-sm-9">
                        <select
                          name="specimen_type"
                          id="specimen_type"
                          className="form-control"
                          onChange={this.handleInputChange}
                          ref={this.sampleType}
                        >
                          <option value="">----</option>
                          {this.props.parent === "dataset" && (
                            <optgroup label="____________________________________________________________">
                              <option value="dataset">Dataset</option>
                            </optgroup>
                          )}
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
                  <div className="col-sm-10 offset-sm-1">
                    <div className="form-group row">
                      <input
                        type="text"
                        className="form-control"
                        name="keyworkds"
                        id="keywords"
                        placeholder="Search HuBMAP ID by Keywords"
                        ref={this.keywords}
                      />
                    </div>
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
                      onClick={this.props.hide}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                {this.state.HuBMAPIDResults &&
                  this.state.HuBMAPIDResults.length === 0 && (
                    <div className="text-center">No record found.</div>
                  )}
                {this.state.HuBMAPIDResults &&
                  this.state.HuBMAPIDResults.length > 0 && (
                    <div className="scrollbar-div">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>HuBMAP ID</th>
                            <th>Type</th>
                            <th>Name</th>
                            <th>Entered By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.HuBMAPIDResults.map(es => {
                            if (!Array.isArray(es)) {
                              es = [es];
                            }
                            const result = es[0];
                            let first_lab_id = result.display_doi;
                            let last_lab_id = "";
                            if (es.length > 1) {
                              es.sort((a, b) => {
                                if (
                                  parseInt(
                                    a.display_doi.substring(
                                      a.display_doi.lastIndexOf("-") + 1
                                    )
                                  ) >
                                  parseInt(
                                    b.display_doi.substring(
                                      a.display_doi.lastIndexOf("-") + 1
                                    )
                                  )
                                ) {
                                  return 1;
                                }
                                if (
                                  parseInt(
                                    b.display_doi.substring(
                                      a.display_doi.lastIndexOf("-") + 1
                                    )
                                  ) >
                                  parseInt(
                                    a.display_doi.substring(
                                      a.display_doi.lastIndexOf("-") + 1
                                    )
                                  )
                                ) {
                                  return -1;
                                }
                                return 0;
                              });
                              first_lab_id = es[0].display_doi;
                              last_lab_id = es[es.length - 1].display_doi;
                            }
                            return (
                              <React.Fragment key={result.display_doi}>
                                <tr
                                  key={result.display_doi}
                                  onClick={e =>
                                    this.props.select(
                                      es.map(e => {
                                        return {
                                          display_doi: e.display_doi,
                                          source_uuid: e.uuid,
                                          datatype:
                                            result.entity_type === "Sample"
                                              ? flattenSampleType(SAMPLE_TYPES)[
                                                  result.specimen_type
                                                ]
                                              : result.entity_type
                                        };
                                      })
                                    )
                                  }
                                >
                                  <td>
                                    {es.length > 1 && (
                                      <React.Fragment key={result.display_doi}>
                                        <div className="row">
                                          <div
                                            className="col-sm-6"
                                          >
		                                       <FontAwesomeIcon icon={faCopy} key={result.display_doi}
				                                  onClick={e => {e.stopPropagation(); let temp_arr = es.map(e => {
				                                  
				                                     return { display_doi: e.display_doi };
				                                  });
				                                     this.setState({uuid_list: temp_arr, LookUpShow: true});
				                                     
				                                     //alert(temp_arr);
				                                  } }
                                              /> 
                                          </div>
                                          <div className="col-sm-6">
                                            {first_lab_id} <br />
                                            <span className="badge badge-secondary">
                                              <small>through</small>
                                            </span>
                                            <br />
                                            {last_lab_id}
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    )}
                                    {es.length === 1 && (
                                      <React.Fragment>
                                        <div className="row">
                                          <div className="col-sm-6"></div>
                                          <div className="col-sm-6">
                                            {first_lab_id}
                                          </div>
                                        </div>
                                      </React.Fragment>
                                    )}
                                  </td>
                                  <td>
                                    {result.entity_type === "Sample"
                                      ? flattenSampleType(SAMPLE_TYPES)[
                                          result.specimen_type
                                        ]
                                      : result.entity_type}
                                  </td>
                                  <td>
                                    {result.lab_donor_id ||
                                        result.lab_tissue_sample_id}
                                  </td>
                                  <td>
                                    {result.create_by_user_email}
                                  </td>
                                </tr>
                                {this.state.showSibling && es.length > 1 && (
                                  <React.Fragment>
                                    {es.map(result => {
                                      return (
                                        <tr
                                          key={result.display_doi}
                                          className="table-dark"
                                        >
                                          <td>
                                            <React.Fragment>
                                              <div className="row">
                                                <div className="col-sm-6"></div>
                                                <div className="col-sm-6">
                                                  {result.display_doi}
                                                </div>
                                              </div>
                                            </React.Fragment>
                                          </td>
                                          <td>
                                            {result.entity_type === "Sample"
                                              ? flattenSampleType(SAMPLE_TYPES)[
                                                  result.specimen_type
                                                ]
                                              : result.entity_type}
                                          </td>
                                          <td>
                                            {result.lab_donor_id ||
                                                result.lab_tissue_sample_id}
                                          </td>
                                          <td>
                                            {
                                              result.create_by_user_email
                                            }
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </React.Fragment>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default IDSearchModal;
