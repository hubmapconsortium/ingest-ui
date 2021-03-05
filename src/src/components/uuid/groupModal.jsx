import React, { Component } from "react";
import Modal from "./modal";

class GroupModal extends Component {
  state = {
    groups: []
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ groups: nextProps.groups });
  }

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">You are currently have multiple group assignments, Please select a primary group for submission</h5>
                <div className="form-group row">
                  <div className="col-sm-6 offset-sm-3">
                    <select
                      name="groups"
                      id="groups"
                      className="form-control"
                      onChange={this.props.handleInputChange}>
                      {this.state.groups
                        .filter((g) => g.data_provider)  // only show those designated as data providers
                        .map(g => {
                        return (
                          <option id={g.uuid} value={g.uuid} key={g.name}>
                            {g.displayname}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-12 text-center">
                    <button
                      className="btn btn-primary"
                      onClick={this.props.submit}>
                      Submit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default GroupModal;
