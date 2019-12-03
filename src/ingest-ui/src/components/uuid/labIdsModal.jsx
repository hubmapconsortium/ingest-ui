import React, { Component } from "react";
import Modal from "./modal";
import axios from "axios";

class LabIDsModal extends Component {
  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   this.setState({ ids: nextProps.ids });
  // }
  UNSAFE_componentWillMount() {
    this.setState({ ids: this.props.ids, assigned_ids: [] });
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    this.setState(prevState => {
      let assigned_ids = Object.assign({}, prevState.assigned_ids);
      assigned_ids[name] = value;
      return { assigned_ids };
    });
  };

  handleSubmit() {
    // const config = {
    //   headers: {
    //     Authorization:
    //       "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
    //     MAuthorization: "MBearer " + localStorage.getItem("info"),
    //     "Content-Type": "multipart/form-data"
    //   }
    // };
    // let formData = {};
    // axios
    //   .put(
    //     `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${this.props.editingEntity.uuid}`,
    //     formData,
    //     config
    //   )
    //   .then(res => {
    //     this.props.submit();
    //   })
    //   .catch(error => {
    //     this.setState({ submit_error: true });
    //   });
  }

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Assign Lab IDs</h5>
                {this.state.ids &&
                  this.state.ids.map(id => (
                    <div key={id.hubmap_identifier} className="form-group row">
                      <label className="col-sm-4 col-form-label text-right">
                        {id.hubmap_identifier}
                      </label>
                      <div className="col-sm-8">
                        <input
                          type="text"
                          name={id.hubmap_identifier}
                          className="form-control"
                          id={id.hubmap_identifier}
                          onChange={this.handleInputChange}
                        />
                      </div>
                    </div>
                  ))}
                <div className="form-group row">
                  <div className="col-sm-12 text-center">
                    <button
                      className="btn btn-primary"
                      onClick={this.handleSubmit}
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

export default LabIDsModal;
