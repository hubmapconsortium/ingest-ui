import React, { Component } from "react";
import Modal from "../modal";
import axios from "axios";
import { SAMPLE_TYPES } from "../../../constants";
import { flattenSampleType } from "../../../utils/constants_helper";
import IDSearchModalMultiSelect from "./idSearchModalMultiSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-solid-svg-icons";

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
    params["group"] = group;
    if (sample_type) {
      params["specimen_type"] = sample_type;
    }
    if (keywords) {
      params["search_term"] = keywords;
    }

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      },
      params: params
    };

    var specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`;
    if (this.props.parent === "dataset") {
      specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search?include_datasets=true`;
    }

    axios
      .get(`${specimen_url}`, config)
      .then(res => {
        let entities = {};
        if (this.props.parent === "dataset") {
          res.data.specimens.forEach(s => {
            if (entities[s.properties.uuid]) {
              entities[s.properties.uuid].push(s);
            } else {
              entities[s.properties.uuid] = [s];
            }
          });
        } else {
          entities = res.data.specimens;
        }
        this.setState({
          HuBMAPIDResults: Object.values(entities)
        });
      })
      .catch(error => {
        console.log(error);
      });
  };

  getUuidList = (new_uuid_list) => {
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
          <IDSearchModalMultiSelect
            show={this.state.LookUpShow}
            hide={this.hideLookUpModal}
            select={this.handleSelectClick}
            uuid_list={this.state.uuid_list}
            parentCallback = {this.getUuidList}
            currentSourceIds={this.props.currentSourceIds}
          />

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
                          <option value="All Groups">All Groups</option>
                          <option value="University of Florida TMC">
                            University of Florida TMC
                          </option>
                          <option value="California Institute of Technology TMC">
                            California Institute of Technology TMC
                          </option>
                          <option value="Vanderbilt TMC">Vanderbilt TMC</option>
                          <option value="Stanford TMC">Stanford TMC</option>
                          <option value="University of California San Diego TMC">
                            University of California San Diego TMC
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
                  <div className="col-sm-2 text-left">
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
                            <th>HuBMAP Display ID</th>
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
                            let first_lab_id = result.hubmap_identifier;
                            let last_lab_id = "";
                            if (es.length > 1) {
                              es.sort((a, b) => {
                                if (
                                  parseInt(
                                    a.hubmap_identifier.substring(
                                      a.hubmap_identifier.lastIndexOf("-") + 1
                                    )
                                  ) >
                                  parseInt(
                                    b.hubmap_identifier.substring(
                                      a.hubmap_identifier.lastIndexOf("-") + 1
                                    )
                                  )
                                ) {
                                  return 1;
                                }
                                if (
                                  parseInt(
                                    b.hubmap_identifier.substring(
                                      a.hubmap_identifier.lastIndexOf("-") + 1
                                    )
                                  ) >
                                  parseInt(
                                    a.hubmap_identifier.substring(
                                      a.hubmap_identifier.lastIndexOf("-") + 1
                                    )
                                  )
                                ) {
                                  return -1;
                                }
                                return 0;
                              });
                              first_lab_id = es[0].hubmap_identifier;
                              last_lab_id = es[es.length - 1].hubmap_identifier;
                            }
                            return (
                              <React.Fragment key={result.hubmap_identifier}>
                                <tr
                                  key={result.hubmap_identifier}
                                  onClick={e =>
                                    this.props.select(
                                      es.map(e => {
                                        return {
                                          hubmap_identifier:
                                            e.hubmap_identifier,
                                          datatype:
                                            result.datatype === "Sample"
                                              ? flattenSampleType(SAMPLE_TYPES)[
                                                  result.properties
                                                    .specimen_type
                                                ]
                                              : result.datatype
                                        };
                                      })
                                    )
                                  }
                                >
                                  <td>
                                    {es.length > 1 && (
                                      <React.Fragment key={result.hubmap_identifier}>
                                        <div className="row">
                                          <div
                                            className="col-sm-6"
                                          >
		                                       <FontAwesomeIcon icon={faCopy} key={result.hubmap_identifier}
				                                  onClick={e => {e.stopPropagation(); let temp_arr = es.map(e => {
				                                  
				                                     return { hubmap_identifier: e.hubmap_identifier };
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
                                    {result.datatype === "Sample"
                                      ? flattenSampleType(SAMPLE_TYPES)[
                                          result.properties.specimen_type
                                        ]
                                      : result.datatype}
                                  </td>
                                  <td>
                                    {result.properties.label ||
                                      result.properties.lab_tissue_id}
                                  </td>
                                  <td>
                                    {result.properties.provenance_user_email}
                                  </td>
                                </tr>
                                {this.state.showSibling && es.length > 1 && (
                                  <React.Fragment>
                                    {es.map(result => {
                                      return (
                                        <tr
                                          key={result.hubmap_identifier}
                                          className="table-dark"
                                        >
                                          <td>
                                            <React.Fragment>
                                              <div className="row">
                                                <div className="col-sm-6"></div>
                                                <div className="col-sm-6">
                                                  {result.hubmap_identifier}
                                                </div>
                                              </div>
                                            </React.Fragment>
                                          </td>
                                          <td>
                                            {result.datatype === "Sample"
                                              ? flattenSampleType(SAMPLE_TYPES)[
                                                  result.properties
                                                    .specimen_type
                                                ]
                                              : result.datatype}
                                          </td>
                                          <td>
                                            {result.properties.label ||
                                              result.properties.lab_tissue_id}
                                          </td>
                                          <td>
                                            {
                                              result.properties
                                                .provenance_user_email
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
