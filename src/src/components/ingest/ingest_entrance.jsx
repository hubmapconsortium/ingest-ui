import React, { Component } from "react";
import DataList from "./datalist";
import DatasetEdit from "./dataset_edit";
import axios from "axios";
import NewDatasetModal from "./newDatasetModal";

class IngestEntrance extends Component {
  state = {
    editingDataset: "",
    is_curator: false,
    filter_group: "",
    globus_url: ""
  };

  componentDidMount() {
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
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

  handleNewDataSetClick = () => {
    this.setState({
      creatingNewDataset: true
    });
  };

  cancelEdit = () => {
    this.setState({ creatingNewDataset: false, editingDataset: null });
  };

  handleEditDataset = e => {
    this.setState({ editingDataset: e });
  };

  handleDatasetUpdated = () => {
    this.setState({
      updateSuccess: true,
      editingDataset: null,
      NewDatasetShow: false
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);
  };

  handleDatasetCreated = (entity) => {
    console.debug('handleDatasetCreated', entity)
    this.setState({
      creatingNewDataset: false,
      createSuccess: true,
      editingDataset: entity
    });
    setTimeout(() => {
      this.setState({ createSuccess: null });
    }, 5000);
    this.setState({
           NewDatasetShow: true
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
    console.debug("IngestEntrance", this.state)
    return (
      <div>
      <h3>Dataset Submission</h3>
        <div className="row">
          <div className="col-sm-12">
            {!this.state.creatingNewDataset &&
              !this.state.editingDataset &&
              this.state.is_curator === false &&
              this.state.group && (
                <button
                  className="btn btn-primary"
                  onClick={this.handleNewDataSetClick}
                >
                  New Dataset
                </button>
              )}
          </div>
        </div>
        {this.state.updateSuccess === true && (
          <div className="alert alert-success">Updated!</div>
        )}
        {this.state.updateSuccess === false && (
          <div className="alert alert-danger">Update failed!</div>
        )}
        {!this.state.creatingNewDataset && !this.state.editingDataset && (
          <DataList
            viewEdit={this.handleEditDataset}
            setFilter={this.setFilter}
            filterGroup={this.state.filter_group}
            filterKeywords={this.state.filter_keywords}
          />
        )}
        {(this.state.creatingNewDataset || this.state.editingDataset) && (
          <DatasetEdit
            handleCancel={this.cancelEdit}
            editingDataset={this.state.editingDataset}
            onUpdated={this.handleDatasetUpdated}
            onCreated={this.handleDatasetCreated}
            changeLink={this.onChangeGlobusLink.bind(this)}
          />
        )}
        {this.state.NewDatasetShow && (
          <NewDatasetModal
            show={this.state.NewDatasetShow}
            //hide={this.hideNewDatasetModal}
            //select={this.handleSelectClick}
            parent="dataset"
            globus_directory_url_path={this.state.globus_url}
            entity={this.state.editingDataset}
            //name={this.state.editingDataset.description}
            //display_doi={this.state.editingDataset.display_doi}
            //doi={this.state.doi}
            onDismiss={() => this.setState({ NewDatasetShow: false, editingDataset: null })}
         />
         )}
      </div>
    );
  }
}

export default IngestEntrance;
