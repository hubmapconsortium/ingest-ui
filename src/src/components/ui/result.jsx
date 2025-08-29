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
  console.debug('%c◉ props ', 'color:#00ff7b', props);
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

  function newSampleSourcePreload() {
    let thisSource = props.result.entity;
    console.debug('%c◉ thisSource ', 'color:#001AFF', thisSource);
    if(thisSource && thisSource.uuid) {
      let newURL = `${process.env.REACT_APP_URL}/new/sample?direct_ancestor_uuid=${thisSource.uuid}`;
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
          {props.result !== undefined && (props.result.entity.entity_type === "Donor" || props.result.entity.sample_category === "organ" ) && (
            <span>
              <Button
                className="btn btn-success m-2"
                variant="contained"
                color="primary"
                onClick={(e) =>newSampleSourcePreload(e)}>
                  {props.result.entity.entity_type === "Donor" 
                    ? "Register an Organ from this Donor" 
                    : "Register a new Sample from this Organ"}
              </Button>
            </span>
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
