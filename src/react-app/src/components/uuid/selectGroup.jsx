import React, { Component } from "react";

class SelectGroup extends Component {
  state = {
    groups: []
  };

  render() {
    return (
      <div className="form-group row">
        <label htmlFor="group" className="col-sm-3 col-form-label">
          What group?
        </label>
        <div className="col-sm-4">
          <select
            name="group"
            id="group"
            className="form-control"
            onChange={this.props.onChange}
          >
            <option value="----">----</option>
            {this.props.groups.map(g => {
              return <option value={g}>{g}</option>;
            })}
          </select>
        </div>
      </div>
    );
  }
}

export default SelectGroup;
