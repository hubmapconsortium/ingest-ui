import React, { Component } from "react";

class PurposeQuestion extends Component {
  state = {};
  render() {
    return (
      <div className="form-group row">
        <label htmlFor="purpose" className="col-sm-3 col-form-label">
          What are you generating an id for?
        </label>
        <div className="col-sm-2">
          <select
            name="purpose"
            id="purpose"
            className="form-control"
            onChange={this.props.onChange}
            value={this.props.selectValue}
          >
            <option value="----">----</option>
            <option value="donor">Donor</option>
            <option value="sample">Sample</option>
          </select>
        </div>
      </div>
    );
  }
}

export default PurposeQuestion;
