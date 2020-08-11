import React, { Component } from "react";
//import { Router, Switch, Route, useParams } from "react-router-dom";
//import DatasetEdit from "../components/ingest/dataset_edit";
//import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import {
//  faQuestionCircle,
//  faSpinner,
//  faPlus
//} from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
////import { Button } from 'react-bootstrap';
import axios from "axios";
//import history from './../history';
//import "./Home.css";


export default class Collection extends Component {
	
	state = {
	    selected:false,
	    portal: `${process.env.REACT_APP_PORTAL_URL}`,
	    children: [],
	    creators: [],
	    display_doi:"",
	    description: "",
	    name: "",
	    collection: {
	      uuid: "",
	      label: "",
	      description: "",
    },
  };

  componentDidMount() {
    
    let uuid = "";
    if (this.props.match){
     //const { match: { params } } = this.props;
     uuid = this.props.match.params.uuid;
     console.log("Params:", uuid);
    }
    
    const config = {
      headers: {
        
              "Content-Type": "application/json"
      }
    };
    
    let uri = "";   
    uri = `${process.env.REACT_APP_ENTITY_API_URL}/collections/${uuid}`;
        
    axios
      .get(uri, config)
      .then(res => {
          this.setState({
            children: res.data.items,
            selected:true,
            display_doi: res.data.display_doi,
            creators: res.data.creators,
            name:res.data.name,
            description:res.data.description,
            uuid:uuid
          });
        })
      .catch(error => {
        this.setState({ 
          submit_error: true, 
          submitting: false });
      });
   
      
      if (this.state.children !== undefined)  {
       this.setState({
            viewCollection: true,
            viewCollections:false,
			
        });
      }

  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

 errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

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
      .get(`${process.env.REACT_APP_ENTITY_API_URL}/collections/${this.state.uuid}`, config)
      .then(res => {
        if (res.data) {
          this.setState({
            loading: false,
            display_doi: res.data.display_doi,
            creators: res.data.creators,
            name:res.data.name,
            description:res.data.description,
            children: res.data.items
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
          .get(`${process.env.REACT_APP_ENTITY_API_URL}/collections/${this.state.uuid}`, config)
          .then(res => {
            if (res.data) {
              this.setState({
                loading: false,
                display_doi: res.data.display_doi,
                creators: res.data.creators,
                name:res.data.name,
                description:res.data.description,
                children: res.data.items
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
          .get(`https://portal.hubmapcortiom.org/browse/dataset/${this.state.uuid}`, config)
          .then(res => {
            if (res.data) {
              this.setState({
                loading: false,
                children: res.data.items
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






  handleViewDataset = dataset => e => {
    this.setState({
      ViewDatasetShow: true,
      dataset:dataset
    });
  };


  cancelView = () => {
    this.setState({ viewDataset: false });
  };

  handleViewDataset = e => {
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
          .get(`${process.env.REACT_APP_ENTITY_API_URL}/datasets/${uuid}`, config)
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
      viewCollection:false,
      viewCollections:false
    });
 
    this.setState({ viewingDataset: true });
  };




  viewForm = (entity) => {
    this.setState({
	  ViewDatasetShow: true,
      updateSuccess: null,
      dataset: entity,
      readOnly: true
    });
    //this.props.onEdit();
  };


  hideViewDataset = () => {
    

    this.setState({
      ViewDatasetShow: false
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


  onChangeGlobusLink(newLink, newDataset) {
    const {name, display_doi, doi} = newDataset;
  	this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  }
  
  
  handleViewingDataset = e => {
    this.setState({ editingDataset: e });
  };



  render() {
    return ( 
      <div className="Collection">
       {!this.state.viewDataset  && (
        <div className="lander">
          <div className="col-sm-12"><br />
              <h4>Details for Collection {this.state.display_doi}</h4><br />
          </div>
          {this.state.selected && (
            <div className="row">
              <div className="col-sm-12">
                <div className="card">
                  <div className="card-body">
                     <div className="form-group">
                      
                             <h4>{this.state.name}</h4><br />
 						  <p>{this.state.description}</p>
                          {(!this.state.children || this.state.children.length <= 0) && (
							<div className="text-center col-sm-12">
							   <h5 className="text-center">There is no data attached to this collection</h5>
			                </div> 
                          )} 
					      {this.state.creators && this.state.creators.length > 0 && (
						     <React.Fragment>
							
							<h5>Creator(s): </h5>
							
							<div className="colcontainer">
						     {this.state.creators.map(creator => {
                                 return (
									<React.Fragment>
	                                  <span className="col-sm-2"><a className="ttip" data-tip={creator.orcid_id} data-for='name'>{creator.name}</a>,&nbsp;&nbsp;{creator.affiliation}</span><br />
										<ReactTooltip
						                  id="name"
						                  place="top"
						                  type="info"
						                  effect="solid"
										  getContent={dataTip => dataTip}
						                />
										{/**} {this.state.creators.map(cr => {
                             			   return (
											 <div key={cr.name}>
										     {creator.name === cr.name && (
												<span>
												  ORCID ID: {cr.orcid_id}
												</span>
											 )}
						                     </div>
										  )}
								        )} 
						                </ReactTooltip> */}
                                  </React.Fragment>
                             )})}









							</div> 
						  </React.Fragment>
				          )}
						<br />
					</div>
					<div>
                      {this.state.children.length > 0 && (
                       <div ><h5 className="dataset">Dataset(s): </h5>
                        {this.state.children.map(dataset => {
                          return (
                             <React.Fragment>
								<div key={dataset.uuid} >
                                {this.state.uuid === dataset.properties.collection_uuid && (
                                 <a
                                    className='btn btn-link'
                                    target='_blank'
                                    href= {this.state.portal + dataset.uuid}
                                    rel="noopener noreferrer"
                                    >
                                    {dataset.properties.name}
                                 </a>
                                )}
								</div> 
						    </React.Fragment>
                          
                        )})}
						</div>
					  )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
       )}
    </div>
    )}
       
    </div>
    );
  }
}
    
