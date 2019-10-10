import React, { Component } from "react";
import DataList from "./datalist";
import DatasetEdit from "./dataset_edit";
import axios from "axios";

class IngestEntrance extends Component {
  state = {
    editingDataset: null,
    is_curator: false,
    filter_group: ""
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
      editingDataset: null
    });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);
  };

  handleDatasetCreated = () => {
    this.setState({
      creatingNewDataset: false,
      createSuccess: true,
      editingDataset: null
    });
    setTimeout(() => {
      this.setState({ createSuccess: null });
    }, 5000);
  };

  setFilter = (group, keywords) => {
    this.setState({
      filter_group: group,
      filter_keywords: keywords
    });
  };

  render() {
    return (
      <div>
        {/* {!this.state.editingDataset && (
          <div className="form-group row">
            <label
              htmlFor="group"
              className="offset-sm-5 col-sm-3 col-form-label text-right"
            >
              You can edit data sets for:{" "}
            </label>
            <div className="col-sm-4">
              <select className="form-control" id="group" name="group">
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
                <option value="IEC Testing Group">IEC Testing Group</option>
              </select>
            </div>
          </div>
        )} */}
        <div className="row">
          <div className="col-sm-12">
            {!this.state.creatingNewDataset &&
              !this.state.editingDataset &&
              this.state.is_curator === false && (
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
        {this.state.createSuccess === true && (
          <div className="alert alert-success">Created!</div>
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
          />
        )}
      </div>
    );
  }
}

export default IngestEntrance;
