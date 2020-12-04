import React, { Component } from "react";
import { SAMPLE_TYPES, ORGAN_TYPES } from "../../constants";
import { flattenSampleType } from "../../utils/constants_helper";
import LabIDsModal from "./labIdsModal";

class Result extends Component {
  state = { results: [] };

  handleCopyToClipboard = () => {
    var $body = document.getElementsByTagName("body")[0];
    var doi = document.getElementById("display_doi").innerHTML;

    var $tempInput = document.createElement("INPUT");
    $body.appendChild($tempInput);
    $tempInput.setAttribute("value", doi);
    $tempInput.select();
    document.execCommand("copy");
    $body.removeChild($tempInput);

    this.setState({
      copied: true
    });

    setTimeout(() => {
      this.setState({ copied: null });
    }, 5000);
  };

  handleReturnClick = e => {
    this.props.onReturn();
  };

  enterLabIDs = () => {
    this.setState({
      LabIDsModalShow: true
    });
  };

  hideLabIDsModal = () => {
    this.setState({
      LabIDsModalShow: false
    });
  };

  hideGroupSelectModal = () => {
    this.setState({
      LabIDsModalShow: false
    });
  };

  render() {
    return (
      <React.Fragment>
        {this.props.result && (
          <React.Fragment>
            {this.props.result["new_samples"].length > 1 && (
              <div className="alert alert-success" role="alert">
                {this.props.result["new_samples"].length} sample ids were
                generated:{" "}
                <b>
                  {this.props.result["new_samples"][0]["hubmap_identifier"]}
                </b>{" "}
                through{" "}
                <b>
                  {
                    this.props.result["new_samples"][
                    this.props.result["new_samples"].length - 1
                    ]["hubmap_identifier"]
                  }
                </b>
              </div>
            )}
            {this.props.result["new_samples"].length === 1 && (
              <div className="alert alert-success" role="alert">
                Sample id{" "}
                <b>
                  {this.props.result["new_samples"][0]["hubmap_identifier"]}
                </b>{" "}
                was generated
              </div>
            )}
            <div>
              <div className="card mb-5">
                <div className="card-body">
                  <div className="row">
                    <div className="col-sm-12">
                      <p>
                        <b>Type:</b>{" "}
                        {this.props.result.sample_metadata.specimen_type
                          ? this.props.result.sample_metadata.specimen_type ===
                            "other"
                            ? this.props.result.sample_metadata
                              .specimen_type_other
                            : flattenSampleType(SAMPLE_TYPES)[
                            this.props.result.sample_metadata.specimen_type
                            ]
                          : "Donor"}
                      </p>
                    </div>
                    {this.props.result.sample_metadata.specimen_type ===
                      "organ" && (
                        <div className="col-sm-12">
                          <b>Organ Type:</b>{" "}
                          {this.props.result.sample_metadata.organ === "OT"
                            ? this.props.result.sample_metadata.organ_other
                            : ORGAN_TYPES[
                            this.props.result.sample_metadata.organ
                            ]}
                        </div>
                      )}
                    {this.props.result.sample_metadata.label && (
                      <div className="col-sm-12">
                        <p>
                          <b>name:</b> {this.props.result.sample_metadata.label}
                        </p>
                      </div>
                    )}
                    {this.props.result.sample_metadata.description && (
                      <div className="col-sm-12">
                        <p>
                          <b>Description: </b>{" "}
                          {this.props.result.sample_metadata.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-sm-4 offset-sm-4 lab-id-modal">
                  {this.props.result["new_samples"].length > 1 &&
                   (["LK", "RK", "HT", "SP", "LI"].includes(this.props.result.sample_metadata.organ)) && (
                      <React.Fragment>
                        <button
                          className="btn btn-primary  btn-block"
                          onClick={this.enterLabIDs}
                        >
                          Assign Lab IDs and Sample Locations

                      </button>
                        <LabIDsModal
                          show={this.state.LabIDsModalShow}
                          hide={this.hideLabIDsModal}
                          ids={this.props.result["new_samples"]}
                          submit={this.handleSubmit}
                          metadata={this.props.result.sample_metadata}
                        />
                      </React.Fragment>
                    )
                  }
                  {this.props.result["new_samples"].length > 1 &&
                   (!["LK", "RK", "HT", "SP", "LI"].includes(this.props.result.sample_metadata.organ)) && (
                      <React.Fragment>
                        <button
                          className="btn btn-primary  btn-block"
                          onClick={this.enterLabIDs}
                        >
                          Assign Lab IDs

                      </button>

                        <LabIDsModal
                          show={this.state.LabIDsModalShow}
                          hide={this.hideLabIDsModal}
                          ids={this.props.result["new_samples"]}
                          submit={this.handleSubmit}
                          metadata={this.props.result.sample_metadata}
                        />
                      </React.Fragment>
                    )}
                  {!this.props.result.sample_metadata.specimen_type && (
                    <button
                      className="btn btn-success btn-block"
                      type="button"
                      onClick={() =>
                        this.props.onCreateNext(
                          this.props.result["new_samples"][0]
                        )
                      }
                    >
                      Register an organ from this donor
                    </button>
                  )}
                  {this.props.result.sample_metadata.specimen_type ===
                    "organ" && (
                      <button
                        className="btn btn-success btn-block"
                        type="button"
                        onClick={() =>
                          this.props.onCreateNext(
                            this.props.result["new_samples"][0]
                          )
                        }
                      >
                        Register tissue samples from this organ
                      </button>
                    )}
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-sm-4 offset-sm-4">
                <button
                  className="btn btn-link  btn-block"
                  type="button"
                  onClick={this.handleReturnClick}
                >
                  Return to Search
                </button>
              </div>
            </div>
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export default Result;
