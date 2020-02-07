import React, { Component } from "react";
import Modal from "./modal";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

class LabIDsModal extends Component {
  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   this.setState({ ids: nextProps.ids });
  // }
  state = {};

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.ids !== props.ids) {
      let assigned_ids = {};
      if (props.ids) {
        props.ids.map(x => {
          assigned_ids[x.uuid] = x.lab_tissue_id;
          return x;
        });
      }

      return { ids: props.ids, assigned_ids: assigned_ids };
    }
    return null;
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    this.setState(prevState => {
      let assigned_ids = Object.assign({}, prevState.assigned_ids);
      assigned_ids[name] = value;
      return { assigned_ids };
    });
  };

  handleSubmit = () => {
    this.setState(
      {
        submitting: true,
        success: false
      },
      () => {
        const config = {
          headers: {
            Authorization:
              "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
            MAuthorization: "MBearer " + localStorage.getItem("info"),
            "Content-Type": "application/json"
          }
        };
        let formData = this.state.assigned_ids;
        axios
          .put(
            `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens`,
            formData,
            config
          )
          .then(res => {
            this.setState(
              {
                submitting: false,
                success: true
              }
            ,() => {
              this.props.hide();
              // this.props.update(formData);
            });
          })
          .catch(error => {
            this.setState({ submitting: false, submit_error: true });
          });
      }
    );
  };

  render() {
    return (
      <Modal
        show={this.props.show}
        handleClose={this.props.hide}
      >
        <div className='row'>
          <div className='col-sm-12'>
            <div className='card text-center'>
              <div className='card-body scrollbar-div'>
                <h5 className='card-title'>Assign Lab IDs</h5>
                {this.state.ids &&
                  this.state.ids.map(id => (
                    <div key={id.hubmap_identifier} className='form-group row'>
                      <label className='col-sm-4 col-form-label text-right'>
                        {id.hubmap_identifier}
                      </label>
                      <div className='col-sm-8'>
                        <input
                          type='text'
                          name={id.uuid}
                          className='form-control'
                          id={id.uuid}
                          value={this.state.assigned_ids[id.uuid]}
                          onChange={this.handleInputChange}
                        />
                      </div>
                    </div>
                  ))}
                {this.state.submit_error && (
                  <div className='row'>
                    <div className='col-sm-12 text-center'>
                      <p className='text-danger'>Error</p>
                    </div>
                  </div>
                )}
              </div>
              <hr />
              {this.state.success && (
                <div className='row'>
                  <div className='col-sm-12 text-center'>
                    <p className='text-success'>Lab IDs updated!</p>
                  </div>
                </div>
              )}
              <div className='form-group row'>
                <div className='col-sm-12 text-center'>
                  <button
                    className='btn btn-primary'
                    onClick={this.handleSubmit}
                    disabled={this.state.submitting}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Submit"}
                  </button>
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
