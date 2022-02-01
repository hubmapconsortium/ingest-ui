/* This is the NEW SearchComponent that's destined for the main index page. Currently using the Legacy SearchComponent (/components/search/SearchComponent) Due to struggles with negotiating Pagination with Elastic Search Constraints
@TODO: Fix that 
UPDATE: Maybe not? Applying newer MUI components to the legacy view is modernizing w/o rewriting!*/

import React, { useEffect, useState } from "react";
import Select from 'react-select'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { useFormControl } from '@mui/material/FormControl';
import Box from '@mui/material/Box';
import {
  useNavigate} from "react-router-dom";

// import { DataGrid } from '@mui/x-data-grid';
// import { GridCellParams } from '@mui/x-data-grid';
// import { DataGrid } from '@material-ui/data-grid';
import { DataGrid, GridOverlay } from '@mui/x-data-grid';
import { toTitleCase, toSingular, toPlural } from "../utils/string_helper";
import { compiledTypes } from "../utils/display_subtypes";

import { api_search2, search_api_search_group_list } from '../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './ui/table_constants';



import LinearProgress from '@mui/material/LinearProgress';
import { FormData } from 'form-data';
export const RenderSearchComponent = (props) => {

  let navigate = useNavigate();
//console.debug("RenderSearchComponent", props);
  // const apiRef = useGridApiRef();
  // var authSet = JSON.parse(localStorage.getItem("info"));
  var [isLoading, setLoading] = useState(true);
  var [queryParams, setQueryParams] = useState({
    group_uuid: "",
    keywords: '',
    entity_type: ""
  });
  var [rowData, setRowData] = useState([]);
  var [columnData, setColumnData] = useState([]);
  var [gridLoading, setGridLoading] = useState(true);
  var [gridPage, setGridPage] = useState(0);
  var [pageSize, setPageSize] = useState(100);
  var [resultCount, setResultCount] = useState(100);
  var [formData, setFormData] = useState({
      keywords: '',
      sample_type: ""
  });

  // React.useEffect(() => {
  //   apiRef.current.subscribeEvent("cellClick", (params) => {
  //     props.Intent(params);
  //   });
  // }, [apiRef]);

  function CustomLoadingOverlay() {
    return (
      <GridOverlay>
        <div style={{ position: 'absolute', top: 0, width: '100%' }}>
          <LinearProgress />
        </div>
      </GridOverlay>
    );
  }
 
  function OpenEntity(params){
  //console.debug("openEntity", params.row);
  //console.debug(params.row.entity_type, params.row.id);
    var entity = (params.row.entity_type).toLowerCase();
    navigate(`/${entity}/${params.row.id}`, { replace: true });
    // 
  }

  useEffect(() => {

    if(window.location && window.location.search){
        var queryJson=HandleQueryURL();
        setQueryParams(queryJson);
        setFormData(queryJson);
        fetchDataset(HandleQueryURL());
        console.debug("queryJson", queryJson);
    }else{
      fetchDataset({
        group_uuid: "",
        keywords: '',
        entity_type: "",
        sample_type: ""
      });
    }
    // if(props.uploadsDialog){
    //   // console.debug("uploadsDialog", props.uploadsDialog);
    //   props.CallUploadsDialog(true);
    // }
  }, []);

  function fetchDataset(queryParams){

    setGridLoading(true);
  //console.debug("fetchDataset", queryParams);
    if(!queryParams && !props.entity_type){
    //console.debug("No queryParams and no entity_type");
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
    if(gridPage<=0){
      setGridPage(1);
    }
    api_search2(queryParams, JSON.parse(localStorage.getItem("info")).groups_token, gridPage, pageSize)
      .then((response) => {
        console.debug("fetchDataset Search Res", response.results);
        console.debug("fetchDataset Search Res", response);
        var results_total = response.total;
        console.debug("RESULTS TOTAL", results_total);
        setResultCount(results_total);
        setColumnData( columnDefs(queryParams.entity_type));
        setRowData(response.results);
        setLoading(false);
        setGridLoading(false);
      })
      .catch(error => {
          console.error(error);
          setLoading(false);
      });
    };

    function handlePageChange (page){
      console.debug('Page changed', page)
      setGridLoading(true);
      setGridPage(page);
      fetchDataset();
      
    }

    if (isLoading) {
    //console.debug("isLoading");
      return (
      <div className=" search-filter">
        <Preamble  custom_title={props.custom_title} />
        <RenderFilterControls keywords_url={formData.keywords} formData={formData} entity_type={props.entity_type} searchHandler={fetchDataset}/>
        <div className="loader">Loading...</div>
      </div>
      );
    }else{
    //console.debug("isLoading", isLoading);
      return (
        <div>
          <Preamble  custom_title={props.custom_title} />
          <RenderFilterControls  keywords_url={formData.keywords} formData={formData} custom_title={props.custom_title} entity_type={props.entity_type} searchHandler={fetchDataset}/>
          <Box sx={{ height: 400, bgcolor: 'background.paper' }}>
            <DataGrid 
              page={gridPage}
              onPageChange={(newPage) => handlePageChange(newPage)}
              pageSize={pageSize}
              onPageSizeChange={(newPageSz) => setPageSize(newPageSz)}
              // paginationMode="server"
              loading={gridLoading}
              rows={rowData} 
              rowCount={resultCount}
              columns={columnData} 
              onCellClick={OpenEntity}
              components={{
                LoadingOverlay: CustomLoadingOverlay,
              }}
            />
          </Box>
        </div>
      )
      // return <RenderTable rows={rowData} columns={columns} />
    }
}





function Preamble(props) {
  return( 
    <div className=""> 
    {props.custom_title && (
        <span className="portal-label text-center display-block">{props.custom_title}</span>
      )}
      {!props.custom_title && (
        <span className="portal-label text-center display-block">Search</span>
      )}
      <span className="text-center mb-2 display-block">      
      Use the filter controls to search for   s, Samples, Datasets or Data Uploads. <br />
      If you know a specific ID you can enter it into the keyword field to locate individual entities.
      </span>
    </div>
  );
  
}

function HandleQueryURL(){
  var querySet = {
    group_uuid: "",
    keywords: '',
    entity_type: "",
    sample_type: ""
  };
  var searchProp = window.location.search
  let searchParams = new URLSearchParams(searchProp);
  if(searchParams.has('sampleType')){
    querySet.sample_type = searchParams.get('sampleType');
  }
  if(searchParams.has('entityType')){
    querySet.entity_type = searchParams.get('entityType');
  }
  if(searchParams.has('keywords')){
    querySet.keywords = searchParams.get('keywords');
  }
  return querySet;
}


// Cell Actions
// function OpenEntity(target) {
//   navigate("/samples");
//  }


function columnDefs(param) {
  var formattedParam = "";
  if(param && param.length > 1){
  //console.debug("columnDefs", param);
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
  const [selectedValue, setSelectedValue] = useState({});
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
  const [selectedValue, setSelectedValue] = useState("");
  const [options] = useState(compiledTypes);
  console.debug("TypeSelect", props);
  // let defaultValue;
  useEffect(() => {
    if(props.formData.entity_type && props.formData.entity_type.length > 1){
      console.debug("We Could get either Entity type or sample tye from the URL");
      if(props.formData.entity_type[0].length >0){
        setSelectedValue({"value": props.formData.entity_type, "label": toTitleCase(toSingular(props.formData.entity_type[0]))})
      }else{
        setSelectedValue({"value": props.formData.entity_type[1], "label": toTitleCase(toSingular(props.formData.entity_type[1]))})
      }
      
    }
  }, [props.formData.entity_type]);
  const handleChange = value => {
    setSelectedValue(value);
  }

  return (
    <Select    
        placeholder={"------"}
        name="entity_type"
        options={options}
        value ={selectedValue}
        // defaultValue={defaultValue}
        onChange={handleChange}
        style={{zIndex: '100'}} 
        >
    </Select>
  )
}


function KeywordInput(props) {
  const [keywordValue, setKeywordValue] = useState("");
  // console.debug("KeywordInput", props, props.url_keyword, props.url_keyword.length);
  useEffect(() => {
    if(props.url_keyword && props.url_keyword.length > 1){
      // console.debug("URLFOUND", props.url_keyword);
      setKeywordValue(props.url_keyword);
    }
  }, [props.url_keyword]);
  
  const handleChange = value => {
    // console.debug("handleChange", value);
    // setProvidedValue(value);
  }

return (
    <TextField 
      fullWidth
      id="keywords" 
      name="keywords"
      label="Keywords" 
      value={keywordValue}
      onChange={handleChange}
      // variant="filled" 
      style={{zIndex: '0'}} 
      helperText="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"/>
  )
}


function RenderFilterControls(props){

console.debug("RenderFilterControls", props);
  
  function handleClear(){
  //console.debug("ClearMe!");
  //console.debug("selectedValue", value);
  }
  const handleSubmit= (e) => {
    e.preventDefault();
    console.debug("handleSubmit", e);
    var  queryParams ={
      "group_uuid":"",
      "keywords":"",
      "entity_type":"",
      "sample_type":""
    }
    console.debug("handleSubmit", e.currentTarget);
    const body = new FormData();
    for (var input of e.currentTarget.elements) {
      console.debug("input", input)
      body.append(input.name, input.value);
    }

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
                      <TypeSelect entity_type={[props.formData.entity_type,props.formData.sample_type]} {...props} />
                  </div>
                  </div>
                </div>
                <div className="row my-3">
                    <div className="col">
                    <div className="px-0 mx-0">
                     <KeywordInput url_keyword={props.formData.keywords} />
                     </div>
                  </div>
                </div>
                <div className="row mb-5 pads">
                  <div className="col">
                    <Button
                      fullWidth
                      className="btn btn-primary py-3 "
                      type="submit"
                      variant="contained"
                      
                    >
                      Search
                    </Button>
                  </div>
                  <div className="col">
                    <Button
                      fullWidth
                      className="btn btn-outline-secondary py-3"
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