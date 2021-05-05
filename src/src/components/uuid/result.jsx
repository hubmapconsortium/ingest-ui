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
    //console.debug('RESULTS!!!!', this.props.result)
    return (
      <React.Fragment>
              <div className="row">
                <div className="col-sm-12 text-center">            
                  <h4>Save was Successful</h4>
                </div>
              </div>
              <div className="row">
                {(this.props.result["new_samples"] 
                      && this.props.result["new_samples"].length > 1) &&
                    //this.state.LabIDsModalShow &&
                    (
                      <React.Fragment>
                      <div>
                        <MultipleListModal
                          ids={this.props.result["new_samples"]}
                          //submit={this.handleSubmit}
                          handleCancel={this.props.handleReturnClick}
                        />
                        </div>
                      </React.Fragment>
                    )
                  }
              </div>
              <div className="row">
                <div className="col-sm-12 mt-2 mr-2 mb-2 text-center">
                  {this.props.result !== undefined  && 
                    this.props.result.entity.entity_type === "Donor" && (
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
                  { this.props.result !== undefined  && 
                      this.props.result.entity.specimen_type === "organ" && (
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
            
      </React.Fragment>
    );
  }
}

export default Result;
