import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { toTitleCase } from "../../utils/string_helper";
import { ingest_api_get_globus_url } from '../../service/ingest_api';
import { getPublishStatusColor } from "../../utils/badgeClasses";
import Link from "@mui/material/Link";


// table column definitions

// DONOR COLUMNS
export const COLUMN_DEF_DONOR = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 145 },
  	{ field: 'lab_donor_id', headerName: 'Deidentified Name', width: 190,  hidden: true},
  	{ field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	// { field: 'lab_donor_id', headerName: 'LABID', hide: true}
];

// SAMPLE COLUMNS
export const COLUMN_DEF_SAMPLE = [
    { field: 'created_by_user_displayname', headerName: 'Created By', width: 210, hidden: true},
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 150 },
  	{
	    field: "computed_lab_id_type",
	    headerName: "Lab ID",
	    //description: "This column has a value getter and is not sortable.",
	    sortable: false,
	    width: 173,
	    valueGetter: getLabId
  	}, 
    { field: 'display_subtype', headerName: 'Type', width: 200},
    // { field: 'sample_category', headerName: 'Category',
    //   renderCell: (params: ValueFormatterParams) => (
    //     <React.Fragment>
    //       {toTitleCase(params.value)}                        
    //     </React.Fragment>
    //   )},
    { field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	// hidden fields for computed fields below
    { field: 'entity_type', headerName: 'Type', hide: true, filterable: false, sortable: false},
    { field: 'lab_donor_id', headerName: 'LABID', hide: true, filterable: false, sortable: false},
    { field: 'lab_tissue_sample_id', headerName: 'LABID', hide: true, filterable: false, sortable: false},
    { field: 'organ', headerName: 'OrganCode', hide: true, filterable: false, sortable: false},
    { field: 'specimen_type', headerName: 'Specimen Type', hide: true, filterable: false, sortable: false},
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
        className={"badge " + getPublishStatusColor(params.value,"NA")}>
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


// DATASET COLUMNS
export const COLUMN_DEF_PUBLICATION = [
  { field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'data_access_level', headerName: 'Access Level', width: 150},
  { field: 'status', headerName: 'Submission Status', width: 200,
    renderCell: (params: ValueFormatterParams) => (
      <span
              style={{
                width: "100px"
              }}
              className={"badge " + getPublishStatusColor(params.value,"NA")}>
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
              className={"badge " + getPublishStatusColor(params.value,"NA")}>
              {params.value}
            </span>
      )
  },
  
 ];

 // COLLECTIONS COLUMNS
 export const COLUMN_DEF_COLLECTION = [
  //   Created By
  //   HuBMAP ID
  //   Title *(see below for title)
  //   Group Name
  // DOI * (see below for DOI)

  { field: "created_by_user_email", headerName: "Created By", width: 210 },
  { field: "hubmap_id", headerName: "HubMAP ID", width: 180 },
  {
    field: "title",
    headerName: "Title",
    width: 250,
    renderCell: (params: ValueFormatterParams) => (
      <React.Fragment>
        <span>{params.value}</span>
      </React.Fragment>
    ),
  },{
  field: "datasets.group_name",
   width: 200,
   headerName: "Groups",
   valueGetter: ({ row }) => {
     if (row.datasets) {
       return groupNames(row);
     }
   },
 },{
    field: "doi_url",
    headerName: "DOI",
    width: 400,
    renderCell: (params: ValueFormatterParams) => (
      <React.Fragment>
       <span>{params.value}</span>
     </React.Fragment>
   ),
    valueGetter: ({ row }) => {
      if (row.doi_url && row.registered_doi) {
        return (doiLink(row.doi_url, row.registered_doi))
      }
    },
  },{
    // This is just so it's included in the requested columns
    field: "registered_doi",
    headerName: "registered_doi",
    hide: true,
  },
];


// Computed column functions

// function getSampleType(params: ValueGetterParams) {

// 	if (params.getValue('entity_type') === 'Sample') {
// 		return flattenSampleType(SAMPLE_TYPES)[params.getValue("specimen_type")];
// 	}
//   return params.getValue('entity_type');
// }

function prettyCase(string){
  // return toTitleCase(string)
  return "YES "+toTitleCase(string)
}

function getLabId(params: ValueGetterParams) {
 // console.debug('params:', params.row)
  try {
    return params.row['lab_donor_id'] || params.row['lab_tissue_sample_id'] || params.row['lab_dataset_id']
  } catch { }
return ""
//	return  params.getValue('lab_donor_id') || params.getValue('lab_tissue_sample_id')
}

function doiLink(doi_url,registered_doi) {
  try {
    return (
      <Link target="_blank" href={doi_url} rel="noreferrer">
        {registered_doi}
      </Link>
    );
  } catch(error) {
    console.debug('%c⭗', 'color:#ff005d', "doiLink Error: ", error  );
  }
  return "";
}


function handleDataClick(dataset_uuid) {
  ingest_api_get_globus_url(dataset_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((resp) => {
          if (resp.status === 200) {
             window.open(resp.results, "_blank");
          }
  });
}
function groupNames(entity) {
  let unique_values = [
    ...new Set(entity.datasets.map((entity) => entity.group_name)),
  ];
  return unique_values;
  
}
