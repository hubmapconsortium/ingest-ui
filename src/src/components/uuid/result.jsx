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
    console.debug('Multiples RESULTS!!!!', this.props.result)
    return (
      <React.Fragment>
        {this.props.result["new_samples"] && (
          <React.Fragment>
            {this.props.result && (
              <div className="alert alert-success" role="alert">
                Save Successful
                {/* Here are your new IDs for reference: <br/><br/><b>HubMAP ID:</b>&nbsp;{this.props.result.entity.hubmap_id}<br/>
                <b>Submission ID:</b>&nbsp;{this.props.result.entity.submission_id}
              */}
               
              </div>
            )}
            {this.props.result["new_samples"].length > 1 && (
              <div className="alert alert-success" role="alert">
                {this.props.result["new_samples"].length} sample ids were
                generated:{" "}
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
            
              <div className="row mb-2">
                <div className="col-sm-4 offset-sm-4 lab-id-modal">
                 
                  {(this.props.result["new_samples"] && this.props.result["new_samples"].length > 1) &&
                    (
                      <React.Fragment>
      
                        <button
                          className="btn btn-primary  btn-block"
                          onClick={this.enterLabIDs}>
                           Click To View Sample List
                      </button>

                        <MultipleListModal
                          show={this.state.LabIDsModalShow}
                          hide={this.hideLabIDsModal}
                          ids={this.props.result["new_samples"]}
                          submit={this.handleSubmit}
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
                  {this.props.result.entity.specimen_type === "organ" && (
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
