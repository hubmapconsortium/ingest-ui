import React, { useState } from "react";
import MultipleListModal from "../uuid/tissue_form_components/multipleListModal";
import Tooltip from '@mui/material/Tooltip';
import { Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolder,
  faLink
} from "@fortawesome/free-solid-svg-icons";
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

const Result = (props) => {

  const handleReturnClick = (e) => {
    console.debug("handleReturnClick", e);
    if (props.onReturn) {
      props.onReturn();
    } else {
      console.debug();
    }
  };

  function renderField(label, value) {
    return value ? (
      <div className="portal-jss116 col-sm-12 ml-2">
        {label}: {value}
      </div>
    ) : null;
  }

  function newSamplePreload() {
    let thisSource = props.result.entity;
    if(thisSource && thisSource.uuid) {
      let newURL = `${process.env.REACT_APP_URL}/new/sample?source=${thisSource.uuid}`;
      window.location.replace(newURL);
    }
  }

  return (
    <React.Fragment>
      {(props.result.entity?.new_samples && props.result.entity.new_samples.length > 1) && (
        <MultipleListModal
          ids={props.result.entity.new_samples}
          handleCancel={handleReturnClick}
        />
      )}

      {props.result !== undefined && (
        <>
          {props.result.entity && (
            <Typography>Save was successful</Typography>
          )}
          {props.result.entity.hubmap_id && (
            <div className="portal-jss116 col-sm-12 ml-2">
              HuBMAP ID: <Link variant="body2" href={"/" + props.result.entity.entity_type.toLowerCase() + "/" + props.result.entity.uuid}>{props.result.entity.hubmap_id}</Link>
            </div>
          )}
          {renderField("Submission ID", props.result.entity.submission_id)}
          {renderField("Type", props.result.entity.entity_type)}
          {props.result.globus_path && (
            <div className="portal-jss116 col-sm-12 ml-2">
              <a
                href={props.result.globus_path}
                target='_blank'
                rel='noopener noreferrer'
              ><FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip' /> Click here to go to the Globus data repository</a>
            </div>
          )}
          
          {props.result.entity.uuid && (
            <div className="d-none">
              <a
                href={props.result.entity.entity_type + "/" + props.result.entity.uuid}
              ><FontAwesomeIcon icon={faLink} data-tip data-for='link_tooltip' /> View in Ingest</a>
            </div>
          )}
        </>
      )}
      <div className="row">
        <div className="col-sm-12 mt-2 mr-2 mb-2 text-center">
          {props.result !== undefined && props.result.entity.entity_type === "Donor" && (
            // <Tooltip
            //   placement="bottom-start"
            //   title={
            //     <React.Fragment>
            //       <Typography variant="caption" color="inherit">Registering organs from a new Donor will return with the release of the new Sample form 🎉</Typography><br />
            //       <Typography variant="caption" color="inherit">To Register an organ choose "Sample" from the "INDIVIDUAL" menu and pick this Donor's ID as the "Source ID".</Typography>
            //     </React.Fragment>
            //   }>
              <span>
                <Button
                  className="btn btn-success m-2"
                  variant="contained"
                  color="primary"
                  onClick={(e) =>newSamplePreload(e)}>
                  Register an organ from this donor
                </Button>
              </span>
            // </Tooltip>
          )}
          {/* @TODO: this likely needs to update from specimen type */}
          {props.result !== undefined && props.result.organ && (
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
                    props.onCreateNext(
                      props.result.entity
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
            size="large"
            onClick={handleReturnClick}>
            Done
          </Button>
        </div>
      </div>
    </React.Fragment>
  );
};

export default Result;
