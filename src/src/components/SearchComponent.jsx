import React, { useEffect, useState  } from "react";
import Select from 'react-select'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';
import {
  useNavigate} from "react-router-dom";

// import { DataGrid } from '@mui/x-data-grid';
// import { GridCellParams } from '@mui/x-data-grid';
// import { DataGrid } from '@material-ui/data-grid';
import { DataGrid, useGridApiRef } from '@mui/x-data-grid';
import { toTitleCase, toSingular, toPlural } from "../utils/string_helper";
import { compiledTypes } from "../utils/display_subtypes";

import { api_search2, search_api_search_group_list } from '../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './ui/table_constants';



export const RenderSearchComponent = (props) => {
//console.debug("RenderSearchComponent", props);
  var authSet = JSON.parse(localStorage.getItem("info"));
  var [isLoading, setLoading] = useState(true);
  var [rowData, setRowData] = useState([]);
  var [columnData, setColumnData] = useState([]);
  var [searchContent, setSearchContent] = useState([]);
  var [queryParams, setQueryParams] = useState();

 
  
  useEffect(() => {
    fetchDataset({
      group_uuid: "",
      keywords: '',
      entity_type: ""
    });
  }, []);

  function fetchDataset(queryParams){
    if(!queryParams && !props.entity_type){
      console.debug("No queryParams and no entity_type");
      queryParams = {
        group_uuid: "",
        keywords: '',
        entity_type: ""
      }
    }else if(props.entity_type && !queryParams){
      queryParams = {
        group_uuid: "",
        keywords: '',
        entity_type:  toTitleCase(toSingular(props.entity_type))
      }
    }
    
    api_search2(queryParams, JSON.parse(localStorage.getItem("info")).groups_token, 0, 100)
    .then((response) => {
      console.debug("fetchDataset Search Res", response.results);
        setColumnData( columnDefs(queryParams.entity_type));
        setRowData(response.results);
        setLoading(false);
      })
      .catch(error => {
          console.error(error);
          setLoading(false);
      });
    };

    if (isLoading) {
      return (
      <div className="card-body search-filter">
        <Preamble {...props} custom_title={props.custom_title} />
        <RenderFilterControls {...props} entity_type={props.entity_type} searchHandler={fetchDataset}/>
        <div className="loader">Loading...</div>
      </div>
      );
    }else{
      return (
        <div className="card-body search-filter">
          <Preamble {...props} custom_title="Search" />
          <RenderFilterControls {...props} custom_title={props.custom_title} entity_type={props.entity_type} searchHandler={fetchDataset}/>
          <Box sx={{ height: 400, bgcolor: 'background.paper' }}>
            <DataGrid rows={rowData} columns={columnData} onCellClick={OpenEntity}/>
          </Box>
        </div>
      )
      // return <RenderTable rows={rowData} columns={columns} />
    }
}


function OpenEntity(params){
  let navigate = useNavigate();
  console.debug("openEntity", params.row);
  console.debug(params.row.entity_type, params.row.id);
  var entity = (params.row.entity_type).toLowerCase();
  navigate(`/${entity}/${params.row.id}`);
}


function Preamble(props) {
  return( 
    <div>
    {props.custom_title && (
        <span className="portal-label text-center display-block">{props.custom_title}</span>
      )}
      {!props.custom_title && (
        <span className="portal-label text-center display-block">Search</span>
      )}
      <span className="text-center mb-2 display-block">      
      Use the filter controls to search for   s, Samples, Datasets or Data Uploads.
      If you know a specific ID you can enter it into the keyword field to locate individual entities.
      </span>
    </div>
  );
  
}

// Cell Actions
// function OpenEntity(target) {
//   navigate("/samples");
//  }


function columnDefs(param) {
  var formattedParam = "";
  if(param && param.length > 1){
    console.debug("columnDefs", param);
    formattedParam = toPlural(param.toLowerCase());
  }
  

//console.debug("columnDefs", formattedParam);
  switch(formattedParam) {
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

function GroupSelect(props) {
  const [selectedValue, setSelectedValue] = useState(null);
  let groupList = [];

 // handle selection
  const handleChange = value => {
    setSelectedValue(value);
  }
  search_api_search_group_list().map(function(item){
    groupList.push({
      label: item.shortname,
      value: item.uuid
    });
  })

  return (
  <Select         
      placeholder={"------"}
      name="group_uuid"
      value={selectedValue}
      options={groupList}
      onChange={handleChange}
      >
  </Select>
  )

}
  

function TypeSelect(props) {
  const [selectedValue, setSelectedValue] = useState(null);
  // const [defaultValue, setDefaultValue] = useState(null);
  const [options] = useState(compiledTypes);
  let defaultValue;
  let defaults = props.entity_type;

  useEffect(() => {
    // console.debug("TypeSelect", props, defaults);
    if(defaults && defaults.length > 1){
      // setDefaultValue({"value": props.entity_type, "label": toTitleCase(toSingular(props.entity_type))});
      defaultValue = {"value": props.entity_type, "label": toTitleCase(toSingular(props.entity_type))};
      setSelectedValue(defaultValue)
      console.debug("defaultValue", defaultValue);
    }
  }, []);
  

  const handleChange = value => {
    setSelectedValue(value);
  }

  return (
    <Select    
        name="entity_type"
        options={options}
        value ={selectedValue}
        defaultValue={defaultValue}
        onChange={handleChange}
        >
    </Select>
  )
}


function KeywordInput(props) {
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


function RenderFilterControls(props){


  
  function handleClear(){
  //console.debug("ClearMe!");
  //console.debug("selectedValue", value);
  }
  const handleSubmit= (e) => {
    e.preventDefault();
    var  queryParams ={
      "group_uuid":"",
      "keywords":"",
      "entity_type":""
    }
    const body = new FormData(e.currentTarget);
    for (const entry of body.entries()) {
      console.log(`${entry[0]}: ${entry[1]}`);
      queryParams[entry[0]] = entry[1];
    }
    if(queryParams.entity_type){
      var sm_type = toSingular(queryParams.entity_type)
      queryParams.entity_type=toTitleCase(sm_type)
    }
  //console.debug("searchHandler", queryParams);
    props.searchHandler(queryParams);
  }


  return (      
            
           
    
              <form onSubmit={e => {handleSubmit(e)}}>
                <div className="row">
                  <div className="col">
                  <div className="form-group">
                    <label htmlFor="group" className="">Group</label>
                    <GroupSelect />
                  </div>
                  </div>
                <div className="col">
                  <div className="form-group">
                    <label htmlFor="sample_type" className="">Type</label>
                      <TypeSelect entity_type={props.entity_type} {...props} />
                  </div>
                  </div>
                </div>
                <div className="row">
                    <div className="col-12 m-2">
                    <div className="form-group">
                     <KeywordInput  />
                     </div>
                  </div>
                </div>
                <div className="row mb-5 pads">
                  <div className="col">
                    <Button
                      fullWidth
                      className="btn btn-primary "
                      type="submit"
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
           </form>

  );
}


export default RenderSearchComponent;