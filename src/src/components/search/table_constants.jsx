import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";

import { ingest_api_get_globus_url } from '../../service/ingest_api';


// table column definitions

// DONOR COLUMNS
export const COLUMN_DEF_DONOR = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 145 },
  	{ field: 'lab_name', headerName: 'Deidentified Name', width: 190 },
  	{ field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	{ field: 'lab_donor_id', headerName: 'LABID', hide: true}
];

// SAMPLE COLUMNS
export const COLUMN_DEF_SAMPLE = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
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
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  	{ field: 'lab_dataset_id', headerName: 'Lab Name/ID', width: 200},
  	{ field: 'group_name', headerName: 'Group Name', width: 200},
	{ field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'data_access_level', headerName: 'Access Level', width: 150},
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
      </React.Fragment>
    )
	}
 ];

// UPLOADS COLUMNS
export const COLUMN_DEF_UPLOADS = [
    { field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
    { field: 'title', headerName: 'Upload Name', width: 250,
      renderCell:(params: ValueFormatterParams) => (
         <React.Fragment>
          <span>{params.value}</span>
        </React.Fragment>
      )

    },
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'status', headerName: 'Submission Status', width: 160,
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
  
  { field: 'uuid', headerName: 'Directory', width: 100,
  renderCell: (params: ValueFormatterParams) => (
     <React.Fragment>
      <button
              className='btn btn-link'
              onClick={() => handleDataClick(params.value)}>
              <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/>
      </button>                         
      </React.Fragment>
    )
  }
 ];


// Computed column functions

// function getSampleType(params: ValueGetterParams) {

// 	if (params.getValue('entity_type') === 'Sample') {
// 		return flattenSampleType(SAMPLE_TYPES)[params.getValue("specimen_type")];
// 	}
//   return params.getValue('entity_type');
// }

function getLabId(params: ValueGetterParams) {

 // console.debug('params:', params.row)
  try {
    return params.row['lab_donor_id'] || params.row['lab_tissue_sample_id'] || params.row['lab_dataset_id']
  } catch { }
return ""

//	return  params.getValue('lab_donor_id') || params.getValue('lab_tissue_sample_id')
}

function handleDataClick(dataset_uuid) {

  ingest_api_get_globus_url(dataset_uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
          .then((resp) => {
            console.debug('ingest_api_get_globus_url', resp)
          if (resp.status === 200) {
             window.open(resp.results, "_blank");
          }
  });
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
        case "REORGANIZED":
          badge_class = "badge-info";
          break;
        case "VALID":
          badge_class = "badge-success";
          break;
        case "INVALID":
          badge_class = "badge-danger";
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
