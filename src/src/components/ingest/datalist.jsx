import React, { Component } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faFilter, faBan, faFolder } from "@fortawesome/free-solid-svg-icons";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TablePagination from '@material-ui/core/TablePagination';
import Paper from '@material-ui/core/Paper';
//import ViewCollectionModal from "./viewCollectionModal";
import axios from "axios";
import ReactTooltip from "react-tooltip";
import { truncateString } from "../../utils/string_helper";
import Modal from "../uuid/modal";
import { api_search } from '../../service/search_api';
import { entity_api_get_entity } from '../../service/entity_api';
import { getStatusBadge } from "../../utils/badgeClasses";

class DataList extends Component {
  state = {
    group: "",
    keywords: "",

    is_curator: false,
    datasets: [],
//    filtered_totals: 0,
    pages: [10, 25, 50],
    page: 0,
    setPage: 0,
    rowsPerPage: 10,
    setRowsPerPage: 10,
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
      keywords: this.props.filterKeywords ? this.props.filterKeywords : "",
    });

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data",
      },
      params: params,
    };

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/userroles`,
        config
      )
      .then((res) => {
        res.data.roles.map((r) => {
          if (r.name === "hubmap-data-curator") {
            this.setState({ is_curator: true });
          }
          return r;
        });
      })
      .catch((err) => {
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
      .then((res) => {
        const display_names = res.data.groups
          .filter((g) => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map((g) => {
            return g.displayname;
          });
        this.setState(
          {
            group: this.state.group || display_names[0],
          },
          () => {
            this.handleFilterClick();
          }
        );
      })
      .catch((err) => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
  }

handleChangePage = (event, newPage) => {
    this.setState({
        page: newPage
    });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({
        rowsPerPage: parseInt(event.target.value, 10),
        page: 0
    });
  };

  handleInputChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "group":
        this.setState({
          group: value,
        });
        break;
      case "keywords":
        this.setState({
          keywords: value,
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
    // if (group) {
    //   params["group"] = group;
    // }
    if (group && group !== 'All Groups') {
        params["group_name"] = group;
    }
    if (keywords) {
      params["search_term"] = keywords;
    }

    params["entity_type"] = "Dataset";

    // const config = {
    //   headers: {
    //     Authorization:
    //       "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
    //     "Content-Type": "multipart/form-data",
    //   },
    //   params: params,
    // };

    this.setState({ loading: true });

    // axios
    //   .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`, config)
    //   .then((res) => {
    //     if (res.data) {
    //       this.setState({
    //         loading: false,
    //         datasets: res.data.datasets,
    //       });
    //     }
    //   })
    //   .catch((err) => {
    //     if (err.response === undefined) {
    //     } else if (err.response.status === 401) {
    //       localStorage.setItem("isAuthenticated", false);
    //       window.location.reload();
    //     }
    //   });

    api_search(params, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {

      if (response.status == 200) {
      //console.log('Dataset Search results...');
      //console.log(response.results);
      this.setState(
          {
          loading: false,
          datasets: response.results,
//          filtered_totals: Object.keys(response.results).length,
          page: 0
          }
        );
      }
    });
  };

  handleClearClick = () => {
    this.setState(
      {
        group: "",
        keywords: "",
      },
      () => {
        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            "Content-Type": "multipart/form-data",
          },
        };

        axios
          .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`, config)
          .then((res) => {
            if (res.data) {
              this.setState({
                loading: false,
                datasets: res.data.datasets,
              });
            }
          })
          .catch((err) => {
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

  handleViewCollectionModal = (collection) => (e) => {
    this.setState({
      ViewCollectionShow: true,
      collection: collection,
    });
  };

  hideViewCollectionModal = () => {
    this.setState({
      ViewCollectionShow: false,
    });
  };

  handleActionClick = (e) => {

    entity_api_get_entity(e.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;
        //console.log('editing',entity_data)
        this.props.viewEdit(entity_data);
      }
    });
  };

  showErrorMsgModal = (msg) => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow: false });
  };

  handleDataClick = (dataset_uuid) => {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data",
      },
    };

    axios
      .get(
        `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${dataset_uuid}`,
        config
      )
      .then((res) => {
        this.setState({
          globusURLShow: true,
          dataset_url_text: "Go to Globus Data Repository",
          dataset_url: res.data,
        });
      })
      .catch((err) => {
        this.setState({
          globusURLShow: true,
          dataset_url_text: "Globus URL Unavailable",
          dataset_url: "",
        });
        // if (err.response && err.response.status === 401) {
        //   localStorage.setItem("isAuthenticated", false);
        //   window.location.reload();
        // }
      });
  };

  hideGlobusURLModal = () => {
    this.setState({
      globusURLShow: false,
    });
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
                  <option value='All Groups'>All Components</option>
                  <option value='Broad Institute RTI'>
                    &nbsp;&nbsp;RTI - Broad
                  </option>
                  <option value='General Electric RTI'>
                    &nbsp;&nbsp;RTI - GE
                  </option>
                  <option value='Northwestern RTI'>
                    &nbsp;&nbsp;RTI - Northwestern
                  </option>
                  <option value='Stanford RTI'>
                    &nbsp;&nbsp;RTI - Stanford
                  </option>
                  <option value='California Institute of Technology TMC'>
                    &nbsp;&nbsp;TMC - Cal Tech
                  </option>
                  <option value='Stanford TMC'>
                    &nbsp;&nbsp;TMC - Stanford
                  </option>
                  <option value='University of California San Diego TMC'>
                    &nbsp;&nbsp;TMC - UCSD
                  </option>
                  <option value='University of Florida TMC'>
                    &nbsp;&nbsp;TMC - UFlorida
                  </option>
                  <option value='Vanderbilt TMC'>
                    &nbsp;&nbsp;TMC - Vanderbilt
                  </option>
                  <option value='Cal Tech TTD'>
                    &nbsp;&nbsp;TTD - Cal Tech
                  </option>
                  <option value='Harvard TTD'>&nbsp;&nbsp;TTD - Harvard</option>
                  <option value='Purdue TTD'>&nbsp;&nbsp;TTD - Purdue</option>
                  <option value='Stanford TTD'>
                    &nbsp;&nbsp;TTD - Stanford
                  </option>
                  <option value='IEC Testing Group'>IEC Testing Group</option>
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
              className='btn btn-dark btn-sm mr-2'
              onClick={this.handleFilterClick}
            >
              <FontAwesomeIcon icon={faFilter} /> Filter
            </button>
            <button
              className='btn btn-secondary btn-sm'
              onClick={this.handleClearClick}
            >
              <FontAwesomeIcon icon={faBan} /> Clear
            </button>
          </div>
        </div>
        {this.renderLoadingSpinner()}
        {this.state.loading === false && (
          <div>
              {Object.values(this.state.datasets).length > 0 && (
              <TableContainer component={Paper}>
                <Table className="table-fmt" size="small" aria-label="Result table">
                  <TableHead>
                    <TableRow className="portal-jss120">
                      <TableCell align="center" width="50px">HuBMAP ID</TableCell>
                      <TableCell align="center">Dataset Name</TableCell>
                      <TableCell align="center">Lab Group</TableCell>
                      <TableCell align="center">Data Access Level</TableCell>
                      <TableCell align="center">Entered By</TableCell>
                      <TableCell align="center">Submission Status</TableCell>
                      <TableCell align="center">Data</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>      
                    { Object.values(this.state.datasets)
                      .slice(this.state.page * this.state.rowsPerPage, (this.state.page * this.state.rowsPerPage)+this.state.rowsPerPage)
                      .map((ds) => {
                        const dataset = ds[0];
                        //console.log(dataset);
                      const status = dataset.status
                        ? dataset.status.toUpperCase()
                        : "";
                      let badge_class = "";
                      let btn_text = dataset.writeable ? "Edit" : "View";
                      badge_class = getStatusBadge(status);
                          
                      if (!this.state.group) {
                        btn_text = "View";
                      }
                      return (
                      
                        <TableRow className="portal-jss300 portal-jss298" key={dataset.uuid}>
                           <TableCell align="left" className="nowrap">
                             <button
                              className='btn btn-link portal-links portal-jss298'
                              onClick={() => this.handleActionClick(dataset)}
                              data-uuid={dataset.uuid}
                            >
                              {dataset.display_doi}
                            </button>
                           </TableCell>
                          <TableCell align="left"><div style={{ wordBreak: "break-all", width: "15em"}}>{dataset.title}</div></TableCell>
                          <TableCell align="left">{dataset.group_name}</TableCell>
                          <TableCell align="left">
                            {dataset.data_access_level}
                          </TableCell>
                          <TableCell align="left">{dataset.created_by_user_email}</TableCell>
                          <TableCell align="left" className="nowrap">
                            <span
                              style={{
                                width: "100px",
                                cursor: status === "ERROR" && "pointer",
                              }}
                              className={"badge " + badge_class}
                              data-tip
                              data-for={"status_tooltip_" + dataset.uuid}
                              onClick={
                                status === "ERROR"
                                  ? () =>
                                      this.showErrorMsgModal(
                                        dataset.pipeline_message
                                      )
                                  : null
                              }
                            >
                              {status}
                              {status === "ERROR" && (
                                <ReactTooltip
                                  id={"status_tooltip_" + dataset.uuid}
                                  place='top'
                                  type='error'
                                  effect='solid'
                                >
                                  <div
                                    style={{
                                      width: "50em",
                                      whiteSpace: "initial",
                                    }}
                                  >
                                    {truncateString(
                                      dataset.pipeline_message,
                                      350
                                    ) || "Error"}
                                  </div>
                                </ReactTooltip>
                              )}
                            </span>
                          </TableCell>
                          
                          <TableCell align="left" className="nowrap">
                            <button
                              className='btn btn-link'
                              onClick={() => this.handleDataClick(dataset.uuid)}
                            >
                            <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/>

                            </button>                         
                              <ReactTooltip
                                  id='folder_tooltip'
                                  place='top'
                                  type='info'
                                  effect='solid'
                              >
                                <p>Click here to direct you to the data repository storage location</p>
                              </ReactTooltip>
                          </TableCell>
                        </TableRow> 
                      );
                    })}
                 </TableBody>
                  <tfoot>
                    {(Object.values(this.state.datasets).length  === 0 ) && (
                      <TableRow>
                        <TableCell align="left" colSpan="5">No records found</TableCell>
                      </TableRow>
                      )}
                  </tfoot>
                </Table>
            </TableContainer>

            )}
          <TablePagination
          rowsPerPageOptions={this.state.pages}
          component="div"
          count={Object.values(this.state.datasets).length}
          rowsPerPage={this.state.rowsPerPage}
          page={this.state.page}
          onChangePage={this.handleChangePage}
          onChangeRowsPerPage={this.handleChangeRowsPerPage}
          />
          </div>
        )}
        <Modal
          show={this.state.globusURLShow}
          handleClose={this.hideGlobusURLModal}
        >
          <div className='row'>
            <div
              className={`col-sm-12 text-center alert ${
                this.state.dataset_url === "" ? "alert-danger" : "alert-primary"
              }`}
              
            >
              {this.state.dataset_url === "" ? (
                <span>{this.state.dataset_url_text}</span>
              ) : (
                <a
                  className='btn btn-link'
                  target='_blank'
                  href={this.state.dataset_url}
                  rel='noopener noreferrer'
                >
                  {this.state.dataset_url_text}
                </a>
              )}
            </div>
          </div>
        </Modal>
        <Modal
          show={this.state.errorMsgShow}
          handleClose={this.hideErrorMsgModal}
        >
          <div className='row'>
            <div className='col-sm-12 text-center alert alert-danger'>
              <h4>ERROR</h4>
              <div
                dangerouslySetInnerHTML={{ __html: this.state.statusErrorMsg }}
              ></div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default DataList;
