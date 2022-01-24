import React, { Component } from "react";
import Modal from "../uuid/modal";
import axios from "axios";
import { validateRequired } from "../../utils/validators";

class CreateCollectionModal extends Component {
  state = {
    name: "",
    description: "",

    formErrors: {
      name: ""
    }
  };

  componentDidMount() {
    this.setState({
      LookUpShow: false
    });
  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

  handleInputChange = e => {
    const { name, value } = e.target;
    switch (name) {
      case "name":
        this.setState({
          name: value
        });
        break;
      case "description":
        this.setState({
          description: value
        });
        break;
      default:
        break;
    }
  };

  handleCreateCollection = e => {
    e.preventDefault();

    if (this.isFormValid()) {
      let data = {
        label: this.state.name,
        description: this.state.description
      };

      var formData = new FormData();
      formData.append("data", JSON.stringify(data));
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
          "Content-Type": "multipart/form-data"
        }
      };

      axios
        .post(
          `${process.env.REACT_APP_DATAINGEST_API_URL}/collections`,
          formData,
          config
        )
        .then(res => {
          this.props.hide(data);
        })
        .catch(error => {
          this.setState({ submit_error: true, submitting: false });
        });
    }
  };

  isFormValid() {
    let isValid = true;
    if (!validateRequired(this.state.name)) {
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, name: "required" }
      }));
      isValid = false;
    } else {
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, name: "" }
      }));
    }

    return isValid;
  }

  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  render() {
    return (
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Add New Collection</h5>
                <div className="form-group row">
                  <label
                    htmlFor="name"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Name <span className="text-danger">*</span>
                  </label>
                  <div className="col-sm-9">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.name)
                      }
                      onChange={this.handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <label
                    htmlFor="description"
                    className="col-sm-2 col-form-label text-right"
                  >
                    Description
                  </label>
                  <div className="col-sm-9">
                    <textarea
                      name="description"
                      id="description"
                      cols="30"
                      rows="5"
                      className="form-control"
                      onChange={this.handleInputChange}
                    />
                  </div>
                </div>
                <div className="form-group row">
                  <div className="col-sm-12 text-center">
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={this.handleCreateCollection}
                    >
                      Create
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

export default CreateCollectionModal;
