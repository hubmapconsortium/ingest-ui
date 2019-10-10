import React, { Component } from "react";
import Modal from "./modal";

class GroupModal extends Component {
  state = {
    groups: []
  };

  componentWillReceiveProps(nextProps) {
    this.setState({ groups: nextProps.groups });
  }

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Please select a group</h5>
                <div className="form-group row">
                  <div className="col-sm-6 offset-sm-3">
                    <select
                      name="groups"
                      id="groups"
                      className="form-control"
                      onChange={this.props.handleInputChange}
                    >
                      {this.state.groups.map(g => {
                        return (
                          <option value={g.uuid} key={g.name}>
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
                      onClick={this.props.submit}
                    >
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
