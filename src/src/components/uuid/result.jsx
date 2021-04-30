import React, { Component } from "react";
//import { SAMPLE_TYPES, ORGAN_TYPES } from "../../constants";
//import { flattenSampleType } from "../../utils/constants_helper";
//import LabIDsModal from "./labIdsModal";
import MultipleListModal from "./tissue_form_components/multipleListModal"
//import TissueForm from "./tissue_form_components/tissueForm";

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
                <div className="row">
                  <div className="col-sm-12 text-center">            
                  <h4>Save was Successful</h4>
              </div>
              </div>
            )}
            {/*this.props.result["new_samples"].length > 1 && (
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
            )*/}
            <div>
                <div className="row">
               
                  <div className="col-sm-12 mr-2 mb-2 text-center">
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
                      className="btn btn-primary"
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
                        className="btn btn-primary"
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
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={this.handleReturnClick}
                  >
                    Return to Search
                  </button>
                  </div>
              </div>
            </div>

          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}

export default Result;
