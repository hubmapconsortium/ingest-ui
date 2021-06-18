import React, { Component } from "react";
import MultipleListModal from "./tissue_form_components/multipleListModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder, 
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";

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
              {this.props.result !== undefined  && (
              <div className="row">
                    {this.props.result.entity  && ( 
                      <div className="portal-jss116 col-sm-12 ml-2 mb-2">Save was successful</div>
                    )}
                    {this.props.result.entity.hubmap_id && ( 
                      <div className="portal-jss116 col-sm-12 ml-2">
                          HuBMAP ID: {this.props.result.entity.hubmap_id}
                      </div>
                    )}
                    {this.props.result.entity.submission_id && (
                      <div className="portal-jss116 col-sm-12 ml-2">
                          Submission ID: {this.props.result.entity.submission_id}
                      </div>
                    )}
                    {this.props.result.entity.entity_type && (
                      <div className="portal-jss116 col-sm-12 ml-2">
                          Type: {this.props.result.entity.entity_type}
                      </div>
                    )}
                     {this.props.result.globus_path && (
                      <div className="portal-jss116 col-sm-12 ml-2">
                           <a
                            href={this.state.globus_path}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                              <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/> To add or modify data files go to the data repository{" "}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                        )}
                      </div>
                    )}
              </div>
              )}
              <div className="row">

                <div className="col-sm-12 mt-2 mr-2 mb-2 text-center">
                  {this.props.result !== undefined  && 
                    this.props.result.entity.entity_type === "Donor" && (
                    <button
                      className="btn btn-primary mr-2"
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
                        className="btn btn-primary mr-2"
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
                    className="btn btn-success"
                    type="button"
                    onClick={this.handleReturnClick}
                  >
                    Done
                  </button>
                  </div>
              </div>
            
      </React.Fragment>
    );
  }
}

export default Result;
