import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder,faTrash } from "@fortawesome/free-solid-svg-icons";
import { toTitleCase } from "../../utils/string_helper";
import { ingest_api_get_globus_url } from '../../service/ingest_api';
import { getPublishStatusColor } from "../../utils/badgeClasses";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import { ValueFormatterParams, ValueGetterParams } from "@mui/x-data-grid";

// table column definitions

// DONOR COLUMNS
export const COLUMN_DEF_DONOR = [
  	{ field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  	{ field: 'submission_id', headerName: 'Submission ID', width: 145 },
  	{ field: 'lab_donor_id', headerName: 'Lab ID', width: 190},
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
    { field: 'group_name', headerName: 'Group Name', width: 250},
  	{ field: 'created_by_user_email', headerName: 'Created By', width: 250},
  	// hidden fields for computed fields below
    { field: 'entity_type', headerName: 'Type', hide: true, filterable: false, sortable: false},
    { field: 'lab_donor_id', headerName: 'LABID', hide: true, filterable: false, sortable: false},
    { field: 'lab_tissue_sample_id', headerName: 'LABID', hide: true, filterable: false, sortable: false},
    { field: 'organ', headerName: 'OrganCode', hide: true, filterable: false, sortable: false},
    { field: 'sample_category', headerName: 'Sample Category', hide: true, filterable: false, sortable: false},
 ];

// DATASET COLUMNS
export const COLUMN_DEF_DATASET = [
  { field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  { field: 'lab_dataset_id', headerName: 'Lab Name/ID', width: 200},
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'data_access_level', headerName: 'Access Level', width: 150},
  {
    field: 'status', headerName: 'Submission Status', width: 200,
    renderCell: (params: ValueFormatterParams) => (
      <span
        className={"badge " + getPublishStatusColor(params.value,"NA")}
        style={{width: "100px"}}>
        {params.value}
      </span>
      )
  },{
    field: 'uuid', headerName: 'Data', width: 100,
    renderCell: (params: ValueFormatterParams) => (
      <React.Fragment>
        <button
          className='btn btn-link'
          onClick={() => handleDataClick(params.value)}>
          <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/>
        </button>                         
        </React.Fragment>
      )
  },{
    field: 'dataset_type', hide: true,},
];

// DATASET COLUMNS FOR THE UPLOADS VIEW / MINIFIED
export const COLUMN_DEF_DATASET_MINI = [
  { field: 'hubmap_id', headerName: 'HubMAP ID',width: 220,
    renderCell: (params: ValueFormatterParams) => (
      <Button
        fullWidth
        variant="contained"
        className="m-2"
        onClick={(e) => handleOpenPage(e,params.value)}>
       {params.value}
      </Button>     
      )
   },
  { field: 'lab_dataset_id', headerName: 'Lab Name/ID', flex: 0.5},
  { field: 'group_name', headerName: 'Group Name', flex: 0.4},
  { field: 'status', headerName: 'Submission Status', flex: 0.3,
    renderCell: (params: ValueFormatterParams) => (
      <span
        className={"badge " + getPublishStatusColor(params.value,"NA")}
        style={{width: "100px",margin: "0px auto"}}>
        {params.value}
      </span>
      )
  },
  { field: 'uuid', headerName: 'UUID', hide: true, filterable: false, sortable: false},
];
// PUBLICATION COLUMNS
export const COLUMN_DEF_PUBLICATION = [
  { field: 'hubmap_id', headerName: 'HubMAP ID', width: 180 },
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  { field: 'data_access_level', headerName: 'Access Level', width: 150},
  {
 field: 'status', headerName: 'Submission Status', width: 200,
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
  {
 field: 'uuid', headerName: 'Data', width: 100,
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
  {
 field: 'title', headerName: 'Upload Name', width: 250,
    renderCell: (params: ValueFormatterParams) => (
      <React.Fragment>
        <span>{params.value}</span>
      </React.Fragment>
    )
  },
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: 'created_by_user_email', headerName: 'Created By', width: 210},
  {
 field: 'status', headerName: 'Submission Status', width: 160,
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
  },
  { field: "group_name", headerName: "Group", width: 210 },
  {field: "doi_url",
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

// EPICOLLECTIONS COLUMNS
export const COLUMN_DEF_EPICOLLECTIONS = [
  { field: 'hubmap_id', headerName: 'HuBMAP ID', width: 180},
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: "statusAccess",
    width: 180,
    headerName: "Status / Access Level",
    sortable: false,
    valueGetter: getStatusAccess,
    renderCell: renderStatusAccess
  }, 
  { field: "uuid",
    headerName: "Action",
    sortable: false,
    renderCell: (params: ValueFormatterParams) => (
      <div sx={{width: "100%"}} className="actionButton" data-target={params.row.uuid} >
        <FontAwesomeIcon
          className='inline-icon interaction-icon'
          icon={faTrash}
          color="red"
          // onClick={() => sourceRemover(row, index)}
        />
    </div>
   ), 
  }, 
];

// CONTRIBUTORS COLUMNS
export const COLUMN_DEF_CONTRIBUTORS = [
  { field: "display_name", headerName:"Name", flex:1.1},
  { field: "affiliation", headerName:"Affiliation", flex:1},
  { field: "orcid", headerName:"Orcid", flex:1},
  { field: "email", headerName:"Email", flex:1},
  { field: "is_contact", headerName:"Contact", flex:0.4},
  { field: "is_principal_investigator", headerName:"Principal Investigator", flex:0.4},
  { field: "is_operator", headerName:"Operator",  flex:0.4},
  { field: "metadata_schema_id", headerName:"Metadata", flex:1}
];

// MIXED TYPE COLUMNS
export const COLUMN_DEF_MIXED = [
  { field: 'hubmap_id', headerName: 'HuBMAP ID', width: 180},
  { field: "computed_lab_id_type",
    headerName: "Lab Name/ID",
    width: 160,
    //description: "This column has a value getter and is not sortable.",
    sortable: false,
    valueGetter: getLabId
  }, 
  { field: 'submission_id', headerName: 'Submission ID', width: 100 },
  { field: "type",
    headerName: "Type",
    width: 180,
    sortable: false,
    valueGetter: getTypeValue
  }, 
  { field: 'entity_type', headerName: 'Entity Type', width: 200},
  { field: 'group_name', headerName: 'Group Name', width: 200},
  { field: "statusAccess",
    width: 180,
    headerName: "Status / Access Level",
    sortable: false,
    valueGetter: getStatusAccess,
    renderCell: renderStatusAccess
  }, 
  { field: "uuid",
    headerName: "Action",
    sortable: false,
    renderCell: (params: ValueFormatterParams) => (
      <div sx={{width: "100%"}} className="actionButton" data-target={params.row.uuid} >
        <FontAwesomeIcon
          className='inline-icon interaction-icon'
          icon={faTrash}
          color="red"
          // onClick={() => sourceRemover(row, index)}
        />
    </div>
   ), 
  }, 
];

// LIMITED DATASET TYPE COLUMNS (FOR SOURCE DISPLAY)
export const COLUMN_DEF_MIXED_SM = shrinkCols;

// Computed column functions

// function getSampleType(params: ValueGetterParams) {
// 	if (params.getValue('entity_type') === 'Sample') {
// 		return flattenSampleType(SAMPLE_TYPES)[params.getValue("specimen_type")];
// 	}
//   return params.getValue('entity_type');
// }

// Strips the Submission ID column from COLUMN_DEF_MIXED
function shrinkCols(string){
  var stripped = COLUMN_DEF_MIXED.delete('submission_id');
  return stripped
}

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
function getTypeValue(params: ValueGetterParams) {
  // console.debug('%c◉ getTypeValue params ', 'color:#00ff7b', params);
  try {
    return params.row['display_subtype'] || params.row['organ'] || params.row['specimen_type'] || params.row['entity_type']
   }catch{
    return ""
  }
}
function getStatusAccess(params: ValueGetterParams) {
  // console.debug('%c◉ getStatusAccess params ', 'color:#00ff7b', params);
  if(params.row['status']){
    return ['status', params.row['status']]
  }else if(params.row['data_access_level']){
    return ["access", params.row['data_access_level']]
  }else{
    return ["", ""]
  }
}

// function renderActionButton(params: ValueFormatterParams) {
//   // console.debug('%c◉ params ', 'color:#00ff7b', params, params.row.uuid);
//   return(
    
//   )
// }

function renderStatusAccess(params: ValueFormatterParams) {
  // console.debug('%c◉ renderStatusAccess params ', 'color:#996eff', params);
  if (params.value[0]==="status") {
    return (
      <span
        className={"badge " + getPublishStatusColor(params.value[1],"NA")}
        style={{width: "100px"}}>
        {params.value[1]}
      </span>
    )
  }else{
    return (params.value[1])
  }
 
}

function doiLink(doi_url,registered_doi) {
  try {
    return (
      <Link target="_blank" href={doi_url} rel="noreferrer">
        {registered_doi}
      </Link>
    );
  } catch(error) {
    // console.debug('%c⭗', 'color:#ff005d', "doiLink Error: ", error );
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

function handleOpenPage(e,dataset_uuid) {
  e.preventDefault()    
  let url = `${process.env.REACT_APP_URL}/dataset/${dataset_uuid}/`
  window.open(url, "_blank");
}

function groupNames(entity) {
  let unique_values = [
    ...new Set(entity.datasets.map((entity) => entity.group_name)),
  ];
  return unique_values;
  
}
