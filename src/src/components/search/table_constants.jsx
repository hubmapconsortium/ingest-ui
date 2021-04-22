import * as React from 'react';
import Button from '@material-ui/core/Button';
import ReactTooltip from "react-tooltip";
import { flattenSampleType } from "../../utils/constants_helper";
import { SAMPLE_TYPES } from "../../constants";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

// table column definitions

// DONOR COLUMNS
export const COLUMN_DEF_DONOR = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 160 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 145 },
  	{ field: 'lab_name', headerName: 'Deidentified Name', width: 190 },
  	{ field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	{ field: 'lab_donor_id', headerName: 'LABID', hide: true}
];

// SAMPLE COLUMNS
export const COLUMN_DEF_SAMPLE = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 165 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 150 },
  	{
	    field: "computed_lab_id_type",
	    headerName: "Lab ID",
	    //description: "This column has a value getter and is not sortable.",
	    sortable: false,
	    width: 173,
	    valueGetter: getLabId
  	}, { field: 'display_subtype', headerName: 'Type', width: 200},
	// {
	//     field: "computed_submission_type",
	//     headerName: "Type",
	//     //description: "This column has a value getter and is not sortable.",
	//     sortable: false,
	//     width: 190,
	//     valueGetter: getSampleType
 //  	},   
    { field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	// hidden fields for computed fields below
  	{ field: 'lab_donor_id', headerName: 'LABID', hide: true},
  	{ field: 'lab_tissue_sample_id', headerName: 'LABID', hide: true},
  	{ field: 'entity_type', headerName: 'Type', hide: true },
	{ field: 'specimen_type', headerName: 'Specimen Type', hide: true},
 ];

// DATASET COLUMNS
export const COLUMN_DEF_DATASET = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 160 },
  	{ field: 'title', headerName: 'Dataset Name', width: 250,
  		renderCell:(params: ValueFormatterParams) => (
  			 <React.Fragment>
  				<span>{params.value}</span>
  			</React.Fragment>
  		)

  	},
  //	{ field: 'group_name', headerName: 'Group Name', width: 200},
	{ field: 'data_access_level', headerName: 'Access Level', width: 150},
	{ field: 'created_by_user_email', headerName: 'Created By', width: 210},
	{ field: 'status', headerName: 'Submission Status', width: 200,
		renderCell: (params: ValueFormatterParams) => (
			<span
              style={{
                width: "100px"
              }}
              className={"badge " + getPublishStatusColor(params.value)}>
              {params.value}
            </span>
			)
	},
	
	{ field: 'uuid', headerName: 'Data', width: 100,
	renderCell: (params: ValueFormatterParams) => (
		 <React.Fragment>
 			<button
              className='btn btn-link'
              onClick={() => handleDataClick(params.value)}>
            	<FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/>
            </button>                         
              <ReactTooltip
                  id='folder_tooltip'
                  //place='top'
                  type='info'
                  effect='solid'
              >
                <p>Click here to direct you to the data repository storage location</p>
              </ReactTooltip>
              </React.Fragment>
              )
	}
 ];


// Computed column functions

function getSampleType(params: ValueGetterParams) {

	if (params.getValue('entity_type') === 'Sample') {
		return flattenSampleType(SAMPLE_TYPES)[params.getValue("specimen_type")];
	}
  return params.getValue('entity_type');
}

function getLabId(params: ValueGetterParams) {
	return  params.getValue('lab_donor_id') || params.getValue('lab_tissue_sample_id')
}

function handleDataClick(dataset_uuid) {
	alert(dataset_uuid)
}

function getPublishStatusColor(status) {
	var badge_class = "";
	//console.log('status', status)
	switch (status.toUpperCase()) {
        case "NEW":
          badge_class = "badge-purple";
          break;
        case "REOPENED":
          badge_class = "badge-purple";
          break;
        case "INVALID":
          badge_class = "badge-warning";
          break;
        case "QA":
          badge_class = "badge-info";
          break;
        case "LOCKED":
          badge_class = "badge-secondary";
          break;
        case "PROCESSING":
          badge_class = "badge-secondary";
          break;
        case "PUBLISHED":
          badge_class = "badge-success";
          break;
        case "UNPUBLISHED":
          badge_class = "badge-light";
          break;
        case "DEPRECATED":
          break;
        case "ERROR":
          badge_class = "badge-danger";
          break;
        case "HOLD":
          badge_class = "badge-dark";
          break;
        default:
          break;
      }
      return badge_class;
}
