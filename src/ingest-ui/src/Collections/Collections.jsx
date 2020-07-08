import React, { Component } from "react";
//import { Button } from 'react-bootstrap';
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
//import ReactTooltip from "react-tooltip";
//import Collection from "./Collection";
//import DatasetEdit from "../components/ingest/dataset_edit";
//import DataList from "../components/ingest/datalist";
import Modal from "../components/uuid/modal";
//import history from './../history';
//import "./Home.css";

export default class Collections extends Component {
  
  state = {
    viewingDataset: null,
    viewingCollection:null,
    group: "",
    keywords: "",
    system: "Collections",
    is_curator: false,
    collections: []
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

    //this.props.setFilter(group, keywords);

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
      .get(`${process.env.REACT_APP_ENTITY_API_URL}/collections`, config)
      .then(res => {
        if (res.data) {
          this.setState({
            loading: false,
            collections: res.data,
            viewCollection:false,
            viewCollections:true
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
          .get(`${process.env.REACT_APP_ENTITY_API_URL}/collections`, config)
          .then(res => {
            if (res.data) {
              this.setState({
                loading: false,
                collections: res.data.items,
                viewCollection:false,
                viewCollections:true
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

  handleViewCollection = e => {
    //this.props.viewCollection(e);
    let uuid = e.uuid;
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
          .get(`${process.env.REACT_APP_ENTITY_API_URL}/collections/${uuid}`, config)
          .then(res => {
            if (res.data) {
              this.setState({
                loading: false,
                children: res.data.items,
                viewCollection:true,
                viewCollections:false,
                selected:e.uuid
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
    this.setState({
      viewCollection:true,
      viewCollections:false
    });
  };

  handleViewDataset = e => {
    this.setState({ viewingDataset: e });
  };

  viewForm = (entity) => {
    this.setState({
	  ViewCollectionShow: true,
      updateSuccess: null,
      collection: entity,
      readOnly: true
    });
    //this.props.onEdit();
  };


  hideViewCollection = () => {
    this.setState({
      ViewCollectionShow: false
    });
  };

  handleActionClick = e => {
    this.props.viewCollection(e);
  };

  showErrorMsgModal = msg => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow: false });
  };

  cancelView = () => {
    this.setState({ viewingDataset: false });
  };

  createCollectionUrl = connection => {
	let conn = connection.uuid;
	let url = 'connections/'+ conn;
    this.setState({curl:url});
    return this.state.curl;
  };


  render() {
    return (
        <div className="Collections">
          {this.state.viewCollections && !this.state.viewCollection  &&(
            <div className="lander main-content"><br />
              <div className="col-sm-12">
                  <h3>HuBMAP Collections</h3>
                </div>
              <React.Fragment>
              {this.renderLoadingSpinner()}
              {this.state.loading === false && (
                <div className='row'>
                  <div className='col-sm-12'>
                    {this.state.collections.length > 0 && (
                      <table className='table table-bordered'>
                        <thead>
                          <tr>
                            <th scope='col'>Collection</th>
                            <th scope='col'>Description</th>
                            <th scope='col'>View Collection</th>
                            
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.collections.map(collection => {
                            return (
                              <tr key={collection.uuid}>
                                <td>{collection.name}</td>
                                <td>{collection.description}</td>
                                <td>
                                  
								  <a
                              		className='btn btn-link'
                              		
                              		href= {'/collections/' + collection.uuid}
                                
                             		
                              		rel="noopener noreferrer"
                           		  > View </a>
                                 {/** <button
                                    className='btn  btn-link btn-sm'
                                    onClick={() => this.handleViewCollection(collection)}
                                    data-uuid={collection.uuid}
                                  >View</button>   */}
                                </td>
                                
                                
                              {/**   <td>
                                   <a
                              		className='btn btn-link'
                              		
                              		href= {'/err-response?description=This is an error message&details=These are the error message details.'}
                                
                             		
                              		rel="noopener noreferrer"
                           		  > View Collection </a>
                               </td>*/}
                              </tr>
                            )}  
                            )
                          }
                        </tbody>
                      </table>
                    )}
                    {this.state.collections.length === 0 && <p>Records not found</p>}
                  </div>
                </div>
              )}
              <Modal
                show={this.state.errorMsgShow}
                handleClose={this.hideErrorMsgModal}
              >
                <div className="row">
                  <div className="col-sm-12 alert alert-danger">
                    <h4>ERROR</h4>
                    <div dangerouslySetInnerHTML={{__html: this.state.statusErrorMsg}}></div>
                  </div>
                </div>
              </Modal>
            </React.Fragment>
        </div>
        )}
        
      </div>
    );
  }
}