import React, { Component } from "react";
import axios from "axios";
//import Intro from "./intro";
import EntityList from "./entityList";
import Forms from "./forms";
import {ReactComponent as DONOR_IMAGE} from "../../assets/img/donor.svg"
import {ReactComponent as SAMPLE_IMAGE} from "../../assets/img/sample.svg"

class UUIDEntrance extends Component {
  state = {};

  componentDidUpdate(prevProps, prevState) {
    if (localStorage.getItem("info") !== null) {
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
          if (display_names.length === 0) {
            this.setState({
              read_only_member: true
            });
          }
        })
        .catch(err => {
          if (err.response === undefined) {
            this.setState({
              web_services_error: true
            });
          } else if (err.response.status === 401) {
            localStorage.setItem("isAuthenticated", false);
            window.location.reload();
          }
        });
    }
  }

  handleCreateNewEntityClick = type => {
    this.setState({
      creatingNewEntity: true,
      formType: type
    });
  };

  handleCancelClick = e => {
    this.setState({
      creatingNewEntity: false,
      editingEntity: false,
      showDropDown: false
    });
  };

  handleEditClick = () => {
    this.setState({ editingEntity: true });
  };

  handleSelectGroup = e => {
    if (e.target.value.toLowerCase()) {
      this.setState({
        selectedGroup: e.target.value.toLowerCase()
      });
    }
  };

  showDropDwon = () => {
    this.setState(prevState => ({
      showDropDown: !prevState.showDropDown
    }));
  };

  onCancel = () => {
    this.setState({
      creatingNewEntity: false,
      editingEntity: false,
      showDropDown: false
    });
  };

  render() {
    return (
      <React.Fragment>
        {/*<Intro />*/}
        <h3>Donor and Sample Submission</h3>
        <div className="row">
          {!this.state.read_only_member && (
            <div className="col-sm-12">
              {!this.state.creatingNewEntity && !this.state.editingEntity && (
                <div className="dropdown">
                  <button
                    className="btn btn-primary"
                    type="button"
                    id="dropdownMenuButton"
                    data-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                    onClick={this.showDropDwon}
                  >
                    New Registration
                  </button>
                  {this.state.showDropDown && (
                    <div
                      className="dropdown-menu display-block"
                      aria-labelledby="dropdownMenuButton"
                    >
                      <button
                        className="dropdown-item"
                        onClick={() => this.handleCreateNewEntityClick("donor")}
                      >
                        <DONOR_IMAGE /> Donor
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          this.handleCreateNewEntityClick("sample");
                        }}
                      >
                        <SAMPLE_IMAGE /> Sample
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="col-sm-12">
            {!this.state.creatingNewEntity && (
              <EntityList
                onEdit={this.handleEditClick}
                onCancel={this.onCancel}
              />
            )}
            {this.state.creatingNewEntity && (
              <Forms formType={this.state.formType} onCancel={this.onCancel} />
            )}
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default UUIDEntrance;
