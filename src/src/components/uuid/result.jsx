import React, { Component } from "react";
import MultipleListModal from "./tissue_form_components/multipleListModal";
import Tooltip from '@mui/material/Tooltip';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faLink
} from "@fortawesome/free-solid-svg-icons";
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

class ResultLegacy extends Component {
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
    console.debug("handleReturnClick", e);
    if(this.props.onReturn){
      this.props.onReturn();
    }else{
      console.debug();
    }
  };

  render() {
    console.debug("Results");
    console.debug('RESULTS!!!!', this.props.result)
    return (
      <React.Fragment> 

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
          <div className="row" style={{padding:"10px 20px",margin:"auto"}}>
            {this.props.result.entity  && ( 
              <div className="portal-jss116 col-sm-12 ml-2 mb-2">Save was successful</div>
            )}
            {this.props.result.entity.hubmap_id && ( 
              <div className="portal-jss116 col-sm-12 ml-2">
                  HuBMAP ID: <Link variant="body2" href={"/"+this.props.result.entity.entity_type.toLowerCase()+"/"+this.props.result.entity.uuid}>{this.props.result.entity.hubmap_id}</Link>
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
                    href={this.props.result.globus_path}
                    target='_blank'
                    rel='noopener noreferrer'
                  ><FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/> Click here to go to the Globus data repository</a>
              </div>
            )}
            {this.props.result.entity.uuid && (
              <div className="d-none">
                <a
                  href={this.props.result.entity.entity_type+"/"+this.props.result.entity.uuid}
                ><FontAwesomeIcon icon={faLink} data-tip data-for='link_tooltip'/> View in Ingest</a>
              </div>
            )}
          </div>
        )}
        <div className="row">

          <div className="col-sm-12 mt-2 mr-2 mb-2 text-center">
            {this.props.result !== undefined  && this.props.result.entity.entity_type === "Donor" && (
              <Tooltip placement="top-start" title={"Registering organs from a new Donor will return with the release of the new Sample form 🎉"}>
                <span>
                  <Button
                    className="btn btn-success m-2"
                    variant="contained" 
                    disabled
                    color="primary"
                    onClick={() =>
                      this.props.onCreateNext(
                        this.props.result.entity
                      )
                    }>
                    Register an organ from this donor
                  </Button>
                </span>
              </Tooltip>
            )}
            {/* @TODO: this likely needs to update from specimen type */}
            { this.props.result !== undefined  && this.props.result.entity.specimen_type === "organ" && (
                <Tooltip placement="top-start" title={"Registering tisse samples from a new organ will return with the release of the new Sample form 🎉"}>
                  <span>
                    <Button
                      className="btn btn-primary m-2"
                      variant="contained" 
                      disabled
                      color="success"
                      sx={{ 
                        marginRight: '10px',
                      }}
                      type="button"
                      onClick={() =>
                        this.props.onCreateNext(
                          this.props.result.entity
                        )
                      }
                    >
                      Register tissue samples from this organ
                    </Button>
                  </span>
                </Tooltip>
              )}
            <Button
              className="btn btn-success"
              variant="contained" 
              color="primary"
              onClick={this.handleReturnClick}
            >
              Done
            </Button>
            </div>
        </div>
            
      </React.Fragment>
    );
  }
}

export default ResultLegacy;
