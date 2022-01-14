import React, { Component, useEffect, useState  } from "react";
import Box from '@mui/material/Box';
import Select from 'react-select'
import { styled } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import {
  BrowserRouter,
  Routes,
  Route,
  useSearchParams,
  useNavigate,
  Navigate,
  useLocation} from "react-router-dom";

// import { DataGrid } from '@mui/x-data-grid';
// import { GridCellParams } from '@mui/x-data-grid';
// import { DataGrid } from '@material-ui/data-grid';
import { DataGrid, useGridApiRef, GridOverlay } from '@mui/x-data-grid';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import { SAMPLE_TYPES, ORGAN_TYPES } from "../utils/constants";

import LinearProgress from '@material-ui/core/LinearProgress';
import { api_search2, search_api_search_group_list } from '../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './ui/table_constants';

import { entity_api_get_entity } from '../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_users_groups } from '../service/ingest_api';
import { topHitsAggregation } from "elastic-builder";
// import 'url-search-params-polyfill';


// import {useFetch} from './hooks'`
// Creation donor_form_components


  
// Build the Data
function FetchResults(params){
  // (params: (Group, Sample Type, Keywords, Page Size), auth: any, from: any, size: any)
  
  var page_size = 10;
  if (!params || params.length == 0) {
    params={
      group: "All Components",
      keywords: '',
      sample_type:''
    }
  }
  // params["group_uuid"] = group;
  
}
  





export const RenderSearchComponent = (props) => {
  return(
    <div>
        <RenderFilterControls {...props} custom_title="Search"/>
        <RenderSearch  {...props} />
    </div>
  )
}


export function RenderDataGrid(props) {
  console.debug("BasicEditingGrid", props);
  return (
    <div style={{ height: 900, width: '100%' }}>
      <DataGrid rows={props.rows} columns={props.columns} />
    </div>
  );
}

export const RenderSearch = props => {
  console.debug("RenderSearch props", props);
  var authSet = JSON.parse(localStorage.getItem("info"));
  var token = authSet.groups_token;
  const [isLoading, setLoading] = useState(true);
  const [rowData, setRowData] = useState([]);
  var maualCol = true;
  let columns; 
  let params={
    group: "All Components",
    keywords: '',
    sample_type:''
  }
  if(props.sample_type){
    console.debug("sample_type", props.sample_type);
    params.sample_type = props.sample_type;
    columns = SetColumns(props.sample_type);
  }else{
    columns = SetColumns();
    
  }
console.debug("columns", columns);
  useEffect(() => {
    getEntities();
  }, []);

    
  const getEntities = () => {
    api_search2(params, JSON.parse(localStorage.getItem("info")).groups_token, 0, 100)
    .then((response) => {
        console.debug("getEntities Search Res", response.results);
        setRowData(response.results);
        setLoading(false);
      })
      .catch(error => {
          console.error(error);
          setLoading(false);
      });
  };
  
  if (isLoading) {
    return <div className="loader">Loading...</div>;
  }else{
    console.debug("rowData", rowData);
    return (
        <RenderDataGrid rows={rowData} columns={columns} />
    )
    // return <RenderTable rows={rowData} columns={columns} />
  }
  
}

// Cell Actions
function OpenEntity(target) {
  let navigate = useNavigate();
  navigate(target, { replace: true });
 }
const SearchCellClick = (params) => {
  var selected = params.row;
  var targetPage = selected.entity_type + '/' + selected.entity_id;
  console.debug("SearchCellClick");
  console.debug(targetPage);  
  OpenEntity(targetPage);
}
function SubscribeToEvents() {
  const apiRef = useGridApiRef();
  React.useEffect(() => {
    return apiRef.current.subscribeEvent('cellClick', (params) => {
      console.debug("CellClick", params);
    });
  }, [apiRef]);
}


function SetColumns(param) {
  switch(param) {
    case 'donors':
      return COLUMN_DEF_DONOR;
    case 'datasets':
      return COLUMN_DEF_DATASET;
    case 'uploads':
      return COLUMN_DEF_UPLOADS;
    case 'samples':
      return COLUMN_DEF_SAMPLE;
    default:
      return COLUMN_DEF_DONOR;
  }
}


// Rendering
function CustomLoadingOverlay() {
  return (
    <GridOverlay>
      <div style={{ position: 'absolute', top: 0, width: '100%' }}>
        <LinearProgress />
      </div>
    </GridOverlay>
  );
}


function renderLoadingBar () {
  return (<LinearProgress />)
}

const StyledGridOverlay = styled(GridOverlay)(({ theme }) => ({
  flexDirection: 'column',
  '& .ant-empty-img-1': {
    fill: theme.palette.mode === 'light' ? '#aeb8c2' : '#262626',
  },
  '& .ant-empty-img-2': {
    fill: theme.palette.mode === 'light' ? '#f5f5f7' : '#595959',
  },
  '& .ant-empty-img-3': {
    fill: theme.palette.mode === 'light' ? '#dce0e6' : '#434343',
  },
  '& .ant-empty-img-4': {
    fill: theme.palette.mode === 'light' ? '#fff' : '#1c1c1c',
  },
  '& .ant-empty-img-5': {
    fillOpacity: theme.palette.mode === 'light' ? '0.8' : '0.08',
    fill: theme.palette.mode === 'light' ? '#f5f5f5' : '#fff',
  },
}));

function CustomNoRowsOverlay() {
  return (
    <StyledGridOverlay>
      <svg
        width="120"
        height="100"
        viewBox="0 0 184 152"
        aria-hidden
        focusable="false"
      >
        <g fill="none" fillRule="evenodd">
          <g transform="translate(24 31.67)">
            <ellipse
              className="ant-empty-img-5"
              cx="67.797"
              cy="106.89"
              rx="67.797"
              ry="12.668"
            />
            <path
              className="ant-empty-img-1"
              d="M122.034 69.674L98.109 40.229c-1.148-1.386-2.826-2.225-4.593-2.225h-51.44c-1.766 0-3.444.839-4.592 2.225L13.56 69.674v15.383h108.475V69.674z"
            />
            <path
              className="ant-empty-img-2"
              d="M33.83 0h67.933a4 4 0 0 1 4 4v93.344a4 4 0 0 1-4 4H33.83a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4z"
            />
            <path
              className="ant-empty-img-3"
              d="M42.678 9.953h50.237a2 2 0 0 1 2 2V36.91a2 2 0 0 1-2 2H42.678a2 2 0 0 1-2-2V11.953a2 2 0 0 1 2-2zM42.94 49.767h49.713a2.262 2.262 0 1 1 0 4.524H42.94a2.262 2.262 0 0 1 0-4.524zM42.94 61.53h49.713a2.262 2.262 0 1 1 0 4.525H42.94a2.262 2.262 0 0 1 0-4.525zM121.813 105.032c-.775 3.071-3.497 5.36-6.735 5.36H20.515c-3.238 0-5.96-2.29-6.734-5.36a7.309 7.309 0 0 1-.222-1.79V69.675h26.318c2.907 0 5.25 2.448 5.25 5.42v.04c0 2.971 2.37 5.37 5.277 5.37h34.785c2.907 0 5.277-2.421 5.277-5.393V75.1c0-2.972 2.343-5.426 5.25-5.426h26.318v33.569c0 .617-.077 1.216-.221 1.789z"
            />
          </g>
          <path
            className="ant-empty-img-3"
            d="M149.121 33.292l-6.83 2.65a1 1 0 0 1-1.317-1.23l1.937-6.207c-2.589-2.944-4.109-6.534-4.109-10.408C138.802 8.102 148.92 0 161.402 0 173.881 0 184 8.102 184 18.097c0 9.995-10.118 18.097-22.599 18.097-4.528 0-8.744-1.066-12.28-2.902z"
          />
          <g className="ant-empty-img-4" transform="translate(149.65 15.383)">
            <ellipse cx="20.654" cy="3.167" rx="2.849" ry="2.815" />
            <path d="M5.698 5.63H0L2.898.704zM9.259.704h4.985V5.63H9.259z" />
          </g>
        </g>
      </svg>
      <Box sx={{ mt: 1 }}>No Rows</Box>
    </StyledGridOverlay>
  );
}

function GroupSelect() {
  const [inputValue, setValue] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);

  // const handleInputChange = value => {
  //   setValue(value);
  //   console.debug("inputValue", inputValue);
  // };
 
  // handle selection
  const handleChange = value => {
    setSelectedValue(value);
  }

  let groupList = [];
  search_api_search_group_list().map(function(item, i){
    groupList.push({
      label: item.shortname,
      value: item.uuid
    });
  })
  console.debug("groupList", groupList);
  return (
  <Select         
      cacheOptions
      defaultOptions
      placeholder={"------"}
      value={selectedValue}
      options={groupList}

      // onInputChange={handleInputChange}
      // onChange={handleChange}
      >
  </Select>
  )

}
  

function TypeSelect(props) {
  const [inputValue, setValue] = useState('');
  const [selectedValue, setSelectedValue] = useState(null);
  const [defaultValue, setDefaultValue] = useState();

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);


  const loadFromUrl = () => {
    console.debug("loadFromUrl", props.sample_type);
    setDefaultValue({value: props.sample_type, label: props.sample_type});
  }

  console.debug("TypeSelect props", props);

  const handleInputChange = value => {
    setValue(value);
  };
 
  // handle selection
  const handleChange = value => {
    setSelectedValue(value);
    console.debug("selectedValue", selectedValue);
  }

  // if(params.sample_type){
  //     setSelectedValue(params.sample_type);
  // }

  const  compileTypeList = () =>{
    // Ok, we have all the:
    //  Core Sample Types
    //  Organ Types
    // Tissue Types
    // Cell Types
    var core_types=[]
    var organ_types=[]
    var tissue_types=[]
    var cell_types=[]
    var misc_types=[]

    SAMPLE_TYPES.map((optgs, index) => {
      // console.debug("optgs", optgs)
      Object.entries(optgs).map(op => {
        var type = {
          label: op[1],
          value: op[0]
        }
        
        if(index<5){
          core_types.push(type);
        }else if (index === 5) {
          organ_types.push(type)
        }else if (index === 6) {
          tissue_types.push(type)
        }else if (index === 7) {  
          cell_types.push(type)
        }else if (index === 8) {
          misc_types.push(type)
        }
      })
      
    })
    var groupedOption = [{
      label: '',
      options: core_types,
    },{
      label: 'Organs',
      options: organ_types,
    },{
      label: 'Tissues',
      options: tissue_types,
    },{
      label: 'Cells',
      options: cell_types,
    },{
      label: 'Other',
      options: misc_types,
    }];
    // console.debug("groupedOption", groupedOption);
    return groupedOption;
  };
  var urlValue = {"value": props.sample_type, "label": props.sample_type}
console.debug("urlValue", urlValue);
 
  
  return (
    <Select    
    
    {...props}     
        cacheOptions
        // placeholder={"------"}]
        options={compileTypeList()}
        value={urlValue}
        // defaultValue={["value": props.sample_type, "label": props.sample_type]}
        // defaultValue={["value": props.sample_type, "label": props.sample_type]}
        onInputChange={handleInputChange}
        // onChange={handleChange}
        onChange={option => console.log(option)}
        >
    </Select>
  )
}


function KeywordInput(params) {
return (
    <TextField 
      fullWidth
      id="keywords" 
      name="keywords"
      label="Keywords" 
      variant="filled" 
      placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"/>
  )
                
}

function RenderButtons(){
  const handleSearch = () => {}
  const handleClear = () => {}


  return( 
    <div className="row mb-5 pads">
      <div className="col">
        <Button
          fullWidth
          className="btn btn-primary "
          type="button"
          onClick={handleSearch}
          variant="contained"
        >
          Search
        </Button>
      </div>
      <div className="col">
        <Button
          fullWidth
          className="btn btn-outline-secondary "
          type="button"
          onClick={handleClear}
          variant="outlined"
        >
          Clear
        </Button>
      </div>
  </div>
  );
}



function RenderFilterControls(props){

  const [typeValue, setValue] = useState(null);
  return (
          <div className="paper pt-2">
            {props.custom_title && (
              <span className="portal-label text-center">{props.custom_title}</span>
            )}
            {!props.custom_title && (
              <span className="portal-label text-center">Search</span>
            )}
            <span className="portal-jss116 text-center">

            <h1>{props.test}</h1>
            Use the filter controls to search for Donors, Samples, Datasets or Data Uploads.
            If you know a specific ID you can enter it into the keyword field to locate individual entities.
            </span>
            <div className="card-body search-filter">
    
              <form>
                <div className="row">
                  <div className="col">
                  <div className="form-group">
                    <label htmlFor="group" className="portal-jss116">Group</label>
                    <GroupSelect />
                  </div>
                  </div>
                <div className="col">
                  <div className="form-group">
                    <label htmlFor="sample_type" className="portal-jss116">Type</label>
                      <TypeSelect {...props} />
                  </div>
                  </div>
                </div>
                <div className="row">
                    <div className="col-12 m-2">
                    <div className="form-group">
                     <KeywordInput />
                     </div>
                  </div>
                </div>
                <RenderButtons />
           </form>
            </div>
          </div>

  );
}


export default RenderSearchComponent;