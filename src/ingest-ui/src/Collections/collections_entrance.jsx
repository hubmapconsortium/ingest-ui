import React, { Component } from "react";
import DataList from "../components/ingest/datalist";
import DatasetEdit from "../components/ingest/dataset_edit";
import Collections from "./Collections";
import Collection from "./Collection";
import axios from "axios";


class CollectionsEntrance extends Component {
  state = {
    viewingCollections: null,
    viewingCollection: null,
    viewingDataset: null,
    is_curator: false,
    filter_group: "",
    globus_url: ""
  };

  componentDidMount() {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      }
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
        this.setState({
          group: display_names[0]
        });
      })
      .catch(err => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });
  }

  

  cancelEdit = () => {
    this.setState({ creatingNewCollection: false, editingCollection: null });
  };

  handleViewCollections = e => {
    this.setState({ viewingCollections: e });
  };
  
  handleViewCollection = e => {
    this.setState({ viewingCollection: e });
  };

  handleViewDataset = e => {
    this.setState({ viewingDataset: e });
  };

  handleCollectionUpdated = () => {
    this.setState({
      updateSuccess: true,
      editingCollection: null
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);
  };

  handleCollectionCreated = () => {
    this.setState({
      creatingNewCollection: false,
      createSuccess: true,
      editingCollection: null
    });
    setTimeout(() => {
      this.setState({ createSuccess: null });
    }, 5000);
    this.setState({
           NewCollectionShow: true
        });
    
  };

  setFilter = (group, keywords) => {
    this.setState({
      filter_group: group,
      filter_keywords: keywords
    });
  };
  
  onChangeGlobusLink(newLink, newDataset) {
    const {name, display_doi, doi} = newDataset;
  	this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  }

  render() {
    return (
      <div>
        <br />
        <div className="row">
        {this.state.viewingCollections && (
          <Collections
            viewCollections={this.handleViewCollections}
            viewCollection={this.handleViewCollection}
            setFilter={this.setFilter}
            filterGroup={this.state.filter_group}
            filterKeywords={this.state.filter_keywords}
          />
        )}
    {/**    {this.state.viewingCollection && (
          <Collection
            handleCancel={this.cancelEdit}
            viewCollection={this.handleViewCollection}
            selected={this.state.selected}
          />
        )}
        {this.state.viewingDataset && (
          <DatasetEdit
            handleCancel={this.cancelEdit}
            viewDataset={this.handleViewDataset}
          />
        )} */}
        </div>
      </div>)}} 
      export default CollectionsEntrance;