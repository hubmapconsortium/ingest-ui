import React, { Component } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faFilter, faBan } from "@fortawesome/free-solid-svg-icons";
import DonorForm from "./donor_form_components/donorForm";
import TissueForm from "./tissue_form_components/tissueForm";
import { naturalLanguageJoin } from "../../utils/string_helper";
import { flattenSampleType } from "../../utils/constants_helper";
import { SAMPLE_TYPES } from "../../constants";

class EntityList extends Component {
  state = {
    editingEntity: null,
    viewingEntity: null,
    loading: true,
    entities: [],
    group_name: "IEC Testing Group",
    filter_group: "All Groups",
    filter_sample_type: "",
    filter_keywords: ""
  };

  constructor(props) {
    super(props);

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
      .then(res => {
        const display_names = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g.displayname;
          });
        this.setState(
          {
            group_name: naturalLanguageJoin(display_names),
            filter_group: display_names[0]
          },
          () => {
            this.filterEntity();
          }
        );
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    // axios
    //   .get(`${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`, config)
    //   .then(res => {
    //     let entities = {};
    //     res.data.specimens.forEach(s => {
    //       if (entities[s.properties.uuid]) {
    //         entities[s.properties.uuid].push(s);
    //       } else {
    //         entities[s.properties.uuid] = [s];
    //       }
    //     });
    //     this.setState({
    //       loading: false,
    //       entities: entities
    //     });
    //   })
    //   .catch(err => {
    //     if (err.response.status === 401) {
    //       localStorage.setItem("isAuthenticated", false);
    //       window.location.reload();
    //     }
    //   });
  }

  refreshList() {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "application/json"
      }
    };

    axios
      .get(`${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`, config)
      .then(res => {
        this.setState({
          loading: false,
          entities: res.data.specimens
        });
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
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

  selectClassforDataType(dataType) {
    dataType = dataType.toLowerCase();
    if (dataType === "donor") {
      return "table-primary";
    } else if (dataType === "sample") {
      return "table-success";
    } else {
      return "table-secondary";
    }
  }

  editForm = (entity, display_id, es) => {
    this.setState({
      updateSuccess: null,
      editingEntity: entity,
      editingDisplayId: display_id,
      editingEntities: es,
      readOnly: false
    });
    this.props.onEdit();
  };

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

    axios
      .get(`${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`, config)
      .then(res => {
        let entities = {};
        res.data.specimens.forEach(s => {
          if (entities[s.properties.uuid]) {
            entities[s.properties.uuid].push(s);
          } else {
            entities[s.properties.uuid] = [s];
          }
        });
        this.setState({
          loading: false,
          entities: entities
        });
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

    this.setState({
      filtered: true
    });
  };

  clearFilterEntity = () => {
    this.setState({
      filter_group: "All Groups",
      filter_sample_type: "",
      filter_keywords: ""
    });
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      }
    };

    axios
      .get(`${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`, config)
      .then(res => {
        this.setState({
          loading: false,
          entities: res.data.specimens
        });
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
    this.setState({
      filtered: false
    });
  };

  renderTable() {
    if (!this.state.loading && !this.state.editingEntity) {
      return (
        <div>
          <div className="card mt-2">
            <div className="card-body">
              <div className="row">
                <div className="col-sm-4">
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
                        value={this.state.filter_group}
                        onChange={this.handleFilterInputChange}
                      >
                        <option value="All Groups">All Components</option>
                        <option value="University of Florida TMC">
                          &nbsp;&nbsp;University of Florida TMC
                        </option>
                        <option value="California Institute of Technology TMC">
                          &nbsp;&nbsp;California Institute of Technology TMC
                        </option>
                        <option value="Vanderbilt TMC">
                          &nbsp;&nbsp;Vanderbilt TMC
                        </option>
                        <option value="Stanford TMC">
                          &nbsp;&nbsp;Stanford TMC
                        </option>
                        <option value="University of California San Diego TMC">
                          &nbsp;&nbsp;University of California San Diego TMC
                        </option>
                        <option value="Broad Institute RTI">
                          &nbsp;&nbsp;Broad Institute RTI
                        </option>
                        <option value="General Electric RTI">
                          &nbsp;&nbsp;General Electric RTI
                        </option>
                        <option value="Northwestern RTI">
                          &nbsp;&nbsp;Northwestern RTI
                        </option>
                        <option value="Stanford RTI">
                          &nbsp;&nbsp;Stanford RTI
                        </option>
                        <option value="Cal Tech TTD">
                          &nbsp;&nbsp;Cal Tech TTD
                        </option>
                        <option value="Harvard TTD">
                          &nbsp;&nbsp;Harvard TTD
                        </option>
                        <option value="Purdue TTD">
                          &nbsp;&nbsp;Purdue TTD
                        </option>
                        <option value="Stanford TTD">
                          &nbsp;&nbsp;Stanford TTD
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
                      className="col-sm-4 col-form-label text-right"
                    >
                      Sample Type
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
                    placeholder="Search HuBMAP ID by Keywords"
                    value={this.state.filter_keywords}
                    onChange={this.handleFilterInputChange}
                  />
                </div>
                <div className="col-sm-3">
                  <button
                    className="btn btn-primary mr-2"
                    type="button"
                    onClick={this.filterEntity}
                  >
                    <FontAwesomeIcon icon={faFilter} /> Filter
                  </button>
                  {this.state.filtered && (
                    <button
                      className="btn btn-danger"
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
          <table className="table table-bordered">
            <thead>
              <tr>
                <th scope="col" width="200">
                  ID
                </th>
                <th scope="col">Lab Group</th>
                <th scope="col" width="200">
                  Type
                </th>
                <th scope="col">Lab's Non-PHI Name/id</th>
                <th scope="col" width="200">
                  Entered By
                </th>
                <th scope="col" />
              </tr>
            </thead>
            <tbody>
              {Object.values(this.state.entities).map(es => {
                const entity = es[0];
                let first_lab_id = entity.hubmap_identifier;
                let last_lab_id = "";
                let id_common_part = first_lab_id.substring(
                  0,
                  first_lab_id.lastIndexOf("-") + 1
                );
                let first_lab_id_num = "";
                let last_lab_id_num = "";
                let display_id = entity.hubmap_identifier;

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
                    <tr
                      className={es.length > 1 ? "font-weight-bold" : ""}
                      key={entity.hubmap_identifier}
                    >
                      <td className="nowrap">
                        {es.length > 1 && (
                          <React.Fragment>
                            {id_common_part} [{first_lab_id_num}{" "}
                            <small>through</small> {last_lab_id_num}]
                          </React.Fragment>
                        )}
                        {es.length === 1 && first_lab_id}
                      </td>
                      <td>{entity.properties.provenance_group_name}</td>
                      <td
                        className={this.selectClassforDataType(entity.datatype)}
                      >
                        {entity.datatype === "Sample"
                          ? flattenSampleType(SAMPLE_TYPES)[
                              entity.properties.specimen_type
                            ]
                          : entity.datatype}
                      </td>
                      <td>
                        {entity.properties.label ||
                          entity.properties.lab_tissue_id}
                      </td>
                      <td>{entity.properties.provenance_user_email}</td>
                      <td className="nowrap">
                        {entity.writeable && (
                          <button
                            className="btn btn-primary btn-sm mr-1"
                            onClick={() =>
                              this.editForm(entity, display_id, es)
                            }
                          >
                            Edit
                          </button>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => this.viewForm(entity, display_id, es)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              {this.state.entities.length === 0 && (
                <tr>
                  <td colSpan="5">No record found</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      );
    }
  }

  renderEditForm() {
    if (this.state.editingEntity) {
      const dataType = this.state.editingEntity.datatype.toLowerCase();
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
        {this.renderLoadingSpinner()}
        {this.state.updateSuccess === true && (
          <div className="alert alert-success">Updated!</div>
        )}
        {this.state.updateSuccess === false && (
          <div className="alert alert-danger">Update failed!</div>
        )}
        {this.renderTable()}
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
