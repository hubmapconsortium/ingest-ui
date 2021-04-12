import React, { Component } from "react";
//import { SAMPLE_TYPES, ORGAN_TYPES } from "../../constants";
//import { flattenSampleType } from "../../utils/constants_helper";
//import LabIDsModal from "./labIdsModal";
import MultipleListModal from "./tissue_form_components/multipleListModal"

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

  render() {
    //console.debug('Multiples RESULTS!!!!', this.props.result)
    return (
      <React.Fragment>
        {this.props.result["new_samples"] && (
          <React.Fragment>
            {this.props.result["new_samples"].length < 1 && (
              <div className="alert alert-success" role="alert">
                Save Successful
              </div>
            )}
            {this.props.result["new_samples"].length > 1 && (
              <div className="alert alert-info" role="alert">
              You have generated multiples samples:{" "}
                <b>
                  {this.props.result["new_samples"][0]["submission_id"]}
                </b>{" "}
                through{" "}
                <b>
                  {
                    this.props.result["new_samples"][
                    this.props.result["new_samples"].length - 1
                    ]["submission_id"]
                  }
                </b>
              </div>
            )}
            <div>
            
              {/*<div className="row mb-2">
                <div className="col-sm-4 offset-sm-4 lab-id-modal">
              */}
                <div className="row">
               
                 
                  {(this.props.result["new_samples"] && this.props.result["new_samples"].length > 1) &&
                    //this.state.LabIDsModalShow &&
                    (
                      <React.Fragment>

                        <MultipleListModal
                          ids={this.props.result["new_samples"]}
                          //submit={this.handleSubmit}
                          handleCancel={this.props.handleReturnClick}
                        />
                      </React.Fragment>
                    )
                  }
                  {this.props.result.entity.entity_type === "Donor" && (
                    <button
                      className="btn btn-success btn-block"
                      type="button"
                      onClick={() =>
                        this.props.onCreateNext(
                          this.props.result.entity
                        )
                      }
                    >
                      Register an organ from this donor
                    </button>
                  )}
                  { this.props.result.entity.specimen_type === "organ" && (
                      <button
                        className="btn btn-success btn-block"
                        type="button"
                        onClick={() =>
                          this.props.onCreateNext(
                            this.props.result.entity
                          )
                        }
                      >
                        Register tissue samples from this organ
                      </button>
                    )}
               
              </div>
            </div>
            <div className="row">
              <div className="col-sm-7 offset-sm-3 mt-4">
                <button
                  className="btn btn-secondary btn-block"
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
