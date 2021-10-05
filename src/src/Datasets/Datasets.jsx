import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faFilter, faBan } from "@fortawesome/free-solid-svg-icons";
//import ViewCollectionModal from "../components/ingest/viewCollectionModal";
import axios from "axios";
import ReactTooltip from "react-tooltip";
import { truncateString } from "../utils/string_helper";
import { getStatusBadge } from "../../utils/badgeClasses";
import Modal from "../components/uuid/modal";



class Datasets extends Component {
  state = {
    group: "",
    keywords: "",

    is_curator: false,
    datasets: []
  };

  componentDidMount() {
    let params = {};
    if (this.props.filterGroup) {
      params["group"] = this.props.filterGroup;
    }
    if (this.props.filterKeywords) {
      params["keywords"] = this.props.filterKeywords;
    }

    this.setState({
      group: this.props.filterGroup ? this.props.filterGroup : "",
      keywords: this.props.filterKeywords ? this.props.filterKeywords : ""
    });

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      },
      params: params
    };

    // axios
    //   .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`, config)
    //   .then(res => {
    //     if (res.data) {
    //       this.setState({
    //         loading: false,
    //         datasets: res.data.datasets
    //       });
    //     }
    //   })
    //   .catch(err => {
    //     if (err.response === undefined) {
    //     } else if (err.response.status === 401) {
    //       localStorage.setItem("isAuthenticated", false);
    //       window.location.reload();
    //     }
    //   });

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/userroles`,
        config
      )
      .then(res => {
        res.data.roles.map(r => {
          if (r.name === "hubmap-data-curator") {
            this.setState({ is_curator: true });
          }
          return r;
        });
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

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
            group: display_names[0]
          },
          () => {
            this.handleFilterClick();
          }
        );
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "group":
        this.setState({
          group: value
        });
        break;
      case "keywords":
        this.setState({
          keywords: value
        });
        break;
      default:
        break;
    }
  };

  handleFilterClick = () => {
    const group = this.state.group;
    const keywords = this.state.keywords;

    this.props.setFilter(group, keywords);

    let params = {};
    if (group) {
      params["group"] = group;
    }
    if (keywords) {
      params["keywords"] = keywords;
    }

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      },
      params: params
    };

    this.setState({ loading: true });

    axios
      .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`, config)
      .then(res => {
        if (res.data) {
          this.setState({
            loading: false,
            datasets: res.data.datasets
          });
        }
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
  };

  handleClearClick = () => {
    this.setState(
      {
        group: "",
        keywords: ""
      },
      () => {
        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            "Content-Type": "multipart/form-data"
          }
        };

        axios
          .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`, config)
          .then(res => {
            if (res.data) {
              this.setState({
                loading: false,
                datasets: res.data.datasets
              });
            }
          })
          .catch(err => {
            if (err.response === undefined) {
            } else if (err.response.status === 401) {
              localStorage.setItem("isAuthenticated", false);
              window.location.reload();
            }
          });
      }
    );
  };

  renderLoadingSpinner() {
    if (this.state.loading) {
      return (
        <div className='text-center'>
          <FontAwesomeIcon icon={faSpinner} spin size='6x' />
        </div>
      );
    }
  }

  handleViewCollectionModal = collection => e => {
    this.setState({
      ViewCollectionShow: true,
      collection:collection
    });
    {/*const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        MAuthorization: "MBearer " + localStorage.getItem("info"),
        "Content-Type": "application/json"
      }
    };

    axios
      .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections/${collection}`, config)
      .then(res => {
        this.setState({
          collection: res.data
        });
      })
      .catch(err => {
        if (err.response === undefined) {
        } else if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });*/}    
  };

  hideViewCollectionModal = () => {
    this.setState({
      ViewCollectionShow: false
    });
  };

  handleActionClick = e => {
    
    this.props.viewEdit(e);
  };

  showErrorMsgModal = msg => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow: false });
  };

  render() {
    return (
      <React.Fragment>
        <div className='row mt-2'>
          <div className='col-sm-4'>
            <div className='row form-group'>
              <label htmlFor='group' className='col-sm-2 col-form-label'>
                Group
              </label>
              <div className='col-sm-10'>
                <select
                  className='form-control'
                  id='group'
                  name='group'
                  value={this.state.group}
                  onChange={this.handleInputChange}
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
          <div className='col-sm-6'>
            <div className='row form-group'>
              <input
                type='text'
                className='form-control'
                name='keywords'
                id='keywords'
                placeholder='Search Dataset by Keywords'
                value={this.state.keywords}
                onChange={this.handleInputChange}
              />
            </div>
          </div>
          <div className='col-sm-2 text-right'>
            <button
              className='btn btn-primary btn-sm mr-2'
              onClick={this.handleFilterClick}
            >
              <FontAwesomeIcon icon={faFilter} /> Filter
            </button>
            <button
              className='btn btn-danger btn-sm'
              onClick={this.handleClearClick}
            >
              <FontAwesomeIcon icon={faBan} /> Clear
            </button>
          </div>
        </div>
        {this.renderLoadingSpinner()}
        {this.state.loading === false && (
          <div className='row'>
            <div className='col-sm-12 text-center'>
              {this.state.datasets.length > 0 && (
                <table className='table table-bordered'>
                  <thead>
                    <tr>
                      <th scope='col'>ID</th>
                      <th scope='col'>Dataset Name</th>
                      <th scope='col'>Lab</th>
                      <th scope='col'>Collection</th>
                      <th scope='col'>Created By</th>
                      <th scope='col'>Status</th>
                      <th scope='col'>Action</th>
                      <th scope='col'>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.datasets.map(dataset => {
                      const status = dataset.properties.status
                        ? dataset.properties.status.toUpperCase()
                        : "";
                      let badge_class = "";
                      let btn_text = dataset.writeable ? "Edit" : "View";
                      badge_class = getStatusBadge(status);

                      if (!this.state.group) {
                        btn_text = "View";
                      }
                      return (
                        <tr key={dataset.uuid}>
                          <td>{dataset.entity_display_doi}</td>
                          <td><div style={{ wordBreak: "break-all", width: "20em"}}>{dataset.title}</div></td>
                          <td>{dataset.properties.provenance_group_name}</td>
                          <td>
                            <button
                              className='btn btn-link'
                              type='button'
                              onClick={this.handleViewCollectionModal(dataset.properties.collection)}
                            >
                            {dataset.properties.collection ? dataset.properties.collection.label: ""}
                            </button>
                          {/**  {this.state.ViewCollectionShow & (
                              <ViewCollectionModal
                                show={this.state.ViewCollectionShow}
                                hide={this.hideViewCollectionModal}
                                collection={this.state.collection}
                              />
                            )} */} 
                          </td>
                          <td>{dataset.created_by}</td>
                          <td>
                            <span
                              style={{
                                width: "100px",
                                cursor: status === "ERROR" && "pointer"
                              }}
                              className={"badge " + badge_class}
                              data-tip
                              data-for={"status_tooltip_" + dataset.uuid}
                              onClick={status === 'ERROR' ? () =>
                                this.showErrorMsgModal(
                                  dataset.properties.message
                                ) : null
                              }
                            >
                              {status}
                              {status === "ERROR" && (
                                <ReactTooltip
                                  id={"status_tooltip_" + dataset.uuid}
                                  place="top"
                                  type="error"
                                  effect="solid"
                                >
                                  <p>
                                    {truncateString(
                                      dataset.properties.message,
                                      250
                                    ) || "Error"}
                                  </p>
                                </ReactTooltip>
                              )}
                            </span>
                          </td>
                          <td>
                            <button
                              className='btn btn-primary btn-sm btn-block'
                              onClick={() => this.handleActionClick(dataset)}  
                              data-uuid={dataset.uuid}
                            >
                              {btn_text}
                            </button>
                          </td>
                          <td>
                            <a
                              className='btn btn-link'
                              target='_blank'
                              href={
                                dataset.properties.globus_directory_url_path
                              }
                              rel="noopener noreferrer"
                            >
                              Data
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              {this.state.datasets.length === 0 && <p>Records not found</p>}
            </div>
          </div>
        )}
        <Modal
          show={this.state.errorMsgShow}
          handleClose={this.hideErrorMsgModal}
        >
          <div className="row">
            <div className="col-sm-12 text-center alert alert-danger">
              <h4>ERROR</h4>
              <div dangerouslySetInnerHTML={{__html: this.state.statusErrorMsg}}></div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default Datasets;
