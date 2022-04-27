import React, { Component  } from "react";
// import { withRouter } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
// import { DataGrid } from '@material-ui/data-grid';
import axios from "axios";

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography  from '@mui/material/Typography';
import LinearProgress from '@material-ui/core/LinearProgress';

import { SAMPLE_TYPES, ORGAN_TYPES } from "../../constants";

import { api_search2, search_api_search_group_list } from '../../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './table_constants';

import { ingest_api_users_groups, ingest_api_allowable_edit_states } from '../../service/ingest_api';
import { entity_api_get_entity } from '../../service/entity_api';
import { RenderError } from '../../utils/errorAlert'

// import 'url-search-params-polyfill';

// Creation donor_form_components

// import { browserHistory } from 'react-router'

function resultFieldSet(){
  var fieldObjects= [];
  var fieldArray = fieldObjects.concat(COLUMN_DEF_SAMPLE,COLUMN_DEF_DATASET,COLUMN_DEF_UPLOADS, COLUMN_DEF_DONOR)  
  const unique = [...new Set(fieldArray.map(item => item.field))]; // [ 'A', 'B']
  // fieldArray
  console.log("resultFieldSet", unique);
  return unique;
}

class SearchComponent extends Component {

  constructor(props) {
    super(props); 
    console.debug("SearchCompprops",props);
    this.state = {
      selectionModel: "",
      filtered_keywords: "",
      filtered: false,
      errorState:false,
      error:"",
      entity_type_list: SAMPLE_TYPES,
      column_def: COLUMN_DEF_DONOR, 
      show_info_panel: true,
      show_search: true,
      results_total: 0,
      page: 0,
      pageSize: 100,
      fieldSet:[],
      editForm: false,
      show_modal: false,
      hide_modal: true, 
      updateSuccess: false,
      globus_url: "",
      isAuthenticated: false,
      group: "All Components",
      sampleType: "----",
      keywords: "",
      last_keyword: "",
      loading: false,
      table_loading:false,
      search_title:"Search",
      modeCheck:"" //@TODO: Patch for loadingsearch within dataset edits, We should move this
    };
  }

  componentDidMount() {    
    resultFieldSet(); 

    if(this.props.custom_title){
      this.setState({search_title:this.props.custom_title});
    }

    this.setState({
      fieldSet: resultFieldSet()
    },function(){ 
      console.debug("FieldSetState",this.state.fieldSet);
    })

    console.debug("SEARCH componentDidMount")
    var euuid;
    var type
    // If we can switch to Query string for url, would be nice
    // let url = new URL(window.location.href);
    // let uuid = url.searchParams.get("uuid");
    // console.debug("UUID", uuid)
    // if(uuid){
    //   this.handleLoadEntity(uuid)
    // }
    this.setState({
      fieldSet: resultFieldSet()
    },function(){ 
      console.debug("FieldSetState",this.state.fieldSet);
    })

    //@TODO: Look into using the query/search functionality the search-api uses instead of all..... this
    var url = window.location.href;
    var urlPart = url.split("/");
    type = urlPart[3];
    euuid = urlPart[4];
    if(euuid && this.props.modeset!=="Source"){
      console.debug("Loadingfrom URL");
      this.handleLoadEntity(euuid)
    }
 

    console.debug("modecheck ",this.props.modecheck);
    if(this.props.editNewEntity){
        this.setState({
          loading:false,
          show_search:false
        });
    }
    if(!this.props.match){
      var urlProp = window.location.href;
      var urlsplit = urlProp.split("/");
      var lastSegment = (urlsplit[3]);
      euuid = urlsplit[4];

     console.debug(lastSegment, euuid)
      if(window.location.href.includes("/new")){
        console.debug("NEW FROM R ", this.props.modecheck)
        if(this.props.modecheck === "Source" ){
          console.debug("modecheck Source");
          this.handleShowSearch(true);
        }else{
          console.debug("modecheck NOT");
          this.handleShowSearch(false);
        }
       
      }else if( !this.props.modecheck && 
              (window.location.href.includes("donors") || 
              window.location.href.includes("samples") || 
              window.location.href.includes("datasets") || 
              window.location.href.includes("uploads"))){
        // this.setState({
        //   sampleType: lastSegment,
        //   sample_type: lastSegment,
        //   loading: false
        // },function(){ 
        this.setState({
          sampleType: lastSegment,
          sample_type: lastSegment,
          loading: false
        },function(){ 


          console.debug("euuid",euuid);
          this.setFilterType();
          if(euuid && euuid !== "new"){
            var params = {
              row:{
                uuid:euuid
              }
            }
            // this.handleSearchClick();
            this.handleTableCellClick(params);
          }else{
            console.log("No UUID in URL");
            this.handleSearchClick();
          }
        });
      }else if(window.location.href.includes("/undefined")){
        // We're running without filter props passed or URL routing 
        console.log("Undefined?!")
        this.handleClearFilter();

        this.handleUrlChange("");
       
      }else{
        // We're running without filter props passed or URL routing 
        console.log("No Props Or URL, Clear Filter")
        this.handleClearFilter();
      }
    }else if (this.props.match ){ // Ok so we're getting props match eveen w/o, lets switch to search? 
      console.debug("this.props.match",this.props.match);
      type = this.props.match.params.type;
      euuid = this.props.match.params.uuid;
      if(type !== "new"){
        // console.log("NOT NEW PAGE");
        // console.log(type+" | "+euuid);
        this.setState({
          sampleType: type,
          loading: false
        },function(){ 
          if(euuid){
            console.log("UUID PROVIDED: "+euuid);
            var params = {
              row:{
                uuid:euuid
              }
            }
            // this.handleSearchClick();
            this.handleTableCellClick(params);
          }else{
            // console.log("No UUID in URL");
            this.handleSearchClick();
          }
        }); 
      }else if(this.props.search){
        console.log("Props Search",this.props.search);
      }
      else{
        this.setState({
          formType: euuid,
          show_search:false,
          creatingNewEntity:true
        });
      }

      if(this.props.location.search){
        //@TODO: Polyfilling fixes the IE sorrows for URLSearchParams 
        //@TODO TOO: Uh using would make the URL cacophony way more streamlined! 
        // Hooks into search_api.js :O 
        var searchProp = this.props.location.search
        let searchParams = new URLSearchParams(searchProp);


        var searchQueryType = searchParams.has('sampleType')
        console.debug("searchQueryType", searchQueryType);
        if(searchQueryType){
          var searchType = searchParams.get('sampleType');
          console.debug("searchType", searchType);
          this.setState({
            sampleType: searchType
          });
        }
        
        var searchQueryKeyword = searchParams.has('keywords')
        console.debug("searchQueryKeyword", searchQueryKeyword);
        if(searchQueryKeyword){
          var searchKeyword = searchParams.get('keywords');
          console.debug("searchKeyword", searchKeyword);
          this.setState({
            keywords: searchKeyword
          });
        }
      }
    }


    try {
      ingest_api_users_groups(JSON.parse(localStorage.getItem("info")).groups_token).then((results) => {
        console.debug("ingest_api_users_groups", results);

      if (results && results.status && results.status === 200) { 
        this.setState({
          isAuthenticated: true
        }, () => {
          this.setFilterType();
        });
      } else if (results && results.status &&  results.status === 401) {
          this.setState({
            isAuthenticated: false
          });
          window.location.reload();
        }
    });
  } catch {
    this.setState({
        isAuthenticated: false
      });
  }

  const config = {
    headers: {
      Authorization:
        "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
      "Content-Type": "application/json"
    }
  };
  axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then((res) => {
        //console.debug("groups RES: ", res);
        // const display_names = res.data.groups
        //   .filter((g) => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
        //   .map((g) => {
        //     return g.displayname;
        //   });
        // this.setState({
        //   groups: display_names,
        // });
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );

        //console.debug(groups);
        this.setState({
          groups: groups
        });
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }else{
          console.debug("Error getting user groups", err);
        }
      });
  }


  handleExtractQuery= () =>{
    //@TODO: Using a polyfill to solve IE woes instead 
    var queryObject = window.location.search
    .slice(1)
    .split('&')
    .map(p => p.split('='))
    .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
    console.debug("queryObject", queryObject);
    return queryObject;

  }

  handleAddQuery = (key,value) =>{
    // searchParams.append('topic', 'webdev');
  }

  handleShowSearch  = (show) => {
    if ( show === true ){
      this.setState({
        loading:false,
        show_search:true,
      });
    }else{
      this.setState({
        loading:false,
        show_search:false
      });
    }
   
  }


  handleLoadEntity(euuid){
    this.setFilterType();
    if(euuid && euuid !== "new" && this.props.modecheck!=="Source"){
      var params = {
        row:{
          uuid:euuid
        }
      }
      // this.handleSearchClick();
      this.handleTableCellClick(params);
  }
}

  componentDidUpdate(prevProps, prevState) {
    // console.debug("componentDidUpdate");
    // // console.debug(prevProps, this.props);
    // console.debug(this.props.show_search);
    // console.debug(this.state.show_search);
    // console.debug(prevState, this.state);
    if (prevProps.editNewEntity !== this.props.editNewEntity) {
      console.debug("prevProps.editNewEntity !== this.props.editNewEntity", this.props.editNewEntity)
      this.setState({
        editingEntity: this.props.editNewEntity,
        editForm: true,
        show_modal: true,
        show_search: false,
        loading: false
        });
    }
    
    if (prevProps.showSearch !== this.props.showSearch) {
      console.log("UPDATE this.props.showSearch");
      this.setState({
        show_search: this.props.showSearch
        });
    }

//    console.debug("San Check",prevState.editEntity !== this.state.editEntity, this.state.editEntity)
    if (prevState.editEntity !== this.state.editEntity && (!this.state.editEntity || this.state.editEntity === null)) {
      // console.debug("Saved, Time to Reload Search", this.state.editNewEntity)
      this.setState({
        editForm: false,
        show_modal: false,
        show_search: true,
        showSearch: true
        }, () => {   
          console.debug("Saved State set state settled")
      });
    }
    
  }

  handleSingularty  = (target, size) => {
     console.debug("handleSingularty target: ",target);
    if(target === 'uploads'){
      return "uploads" // Is always plural in our system
    }
    if(size === "plural"){
      // console.debug(target.slice(-1));
      if(target.slice(-1) === "s"){
        return target.toLowerCase();
      }else{
        return (target+"s").toLowerCase();
      }
    }else{ // we wanna singularize
      if(target.slice(-1) === "s"){
        console.debug('here 1', target.slice(0, -1))
        return (target.slice(0, -1))  //.toLowerCase()
      }else{
        console.debug('here 2', target)
        return target;
      }
    } 
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    // console.debug('handleInputChange', name)
    switch (name) {
      case "group":
        this.setState({ group: value });
        break;
      case "sampleType":
        this.setState({ sampleType: value });        
        break;
      case "keywords":
        this.setState({ keywords: value });
        break;
      default:
        break;
    }
  };
  
  /*
  set filter fo the Types dropdown, which depends on the propos.filter_type, if avaliable
  */
  setFilterType = () => {

    var new_filter_list = [];

    //console.debug('FILTER TYPES', SAMPLE_TYPES)
    //console.debug('FILTER TYPES', this.props.filter_type)
    if (this.props.filter_type) {
      if (this.props.filter_type === 'Dataset') {
        SAMPLE_TYPES.forEach((type)=>{
          if (!type.donor) {
            new_filter_list.push(type)
          }
        });
        this.setState({
          entity_type_list: new_filter_list
        })
      } else if (this.props.filter_type === 'Sample') {
            SAMPLE_TYPES.forEach((type)=>{
                if (!type.dataset) {
                  new_filter_list.push(type)
                }
              });
            this.setState({
              entity_type_list: new_filter_list
            })
      }
    } else {
      this.setState({
        entity_type_list: this.combinedTypeOptions()  //SAMPLE_TYPES
      })
    }


  } 

  // combine the organ types with the other samples type listing
  // combinedTypeOptions = () => {
  //   var combinedList = [];

  //   SAMPLE_TYPES.forEach((x)=>{
  //     combinedList.push(x)
  //   });

  //   combinedList.push(ORGAN_TYPES) 

  //   // var organs = {}
  //   // for (let k in ORGAN_TYPES) {
  //   //   organs[k] = " - " + ORGAN_TYPES[k]
  //   // }
  //   // combinedList.push(organs)

  //   //console.debug('combinedList', combinedList)
  //   return combinedList
  // }

  combinedTypeOptions = () => {
    var combinedList = [];

    // this is NOT the best way to do this.
    // the index numbers match the elements in SAMPLE_TYPES
    combinedList.push(SAMPLE_TYPES[0])
    combinedList.push(SAMPLE_TYPES[1])
    combinedList.push(SAMPLE_TYPES[2])
    combinedList.push(SAMPLE_TYPES[3])
    combinedList.push(SAMPLE_TYPES[4])
    // insert organs in between
    var organs = {}
    for (let k in ORGAN_TYPES) {
       organs[k] = "\u00A0\u00A0\u00A0\u00A0\u00A0" + ORGAN_TYPES[k]
    }
    combinedList.push(organs)
    combinedList.push(SAMPLE_TYPES[5])
    combinedList.push(SAMPLE_TYPES[6])
    combinedList.push(SAMPLE_TYPES[7])
    combinedList.push(SAMPLE_TYPES[8])

    return combinedList
  }
  handleSearchClick = () => {
    //this.setState({ loading: true, filtered: true, page: 0 });
    console.debug("handleSearchClick")
    const group = this.state.group;
    const sample_type = this.state.sampleType;
    const keywords = this.state.keywords;


    var url = new URL(window.location);

    // console.debug("handleSearchClick")
    // console.debug(group,sample_type,keywords)
    // console.debug(this.state)

    // reset the page to zero, to deal with slight bug regarding
    // if you do searches and change pages then search for a new keyword
    //if (this.state.last_keyword !== keywords) {
    //  this.setState({ page: 0 });  
    //}
  
    this.setState({
      last_keyword: keywords
    })

    // const group = this.group.current.value;
    // const sample_type = this.sampleType.current.value;
    // const keywords = this.keywords.current.value;

    let params = {};
    let which_cols_def = COLUMN_DEF_SAMPLE;  //default


    if (group && group !== 'All Components') {
        params["group_uuid"] = group;
    }

    if (sample_type) {

      // console.debug("sample_type", sample_type);
      // console.debug(this.props);
      if(!this.state.uuid && sample_type !=="----"){ 
        url.searchParams.set('sampleType',sample_type);
        //this.handleUrlChange(this.handleSingularty(sample_type, "plural"));
      }
      

      if (sample_type === 'donor' || sample_type === 'donors') {
        params["entity_type"] = "Donor";
        which_cols_def = COLUMN_DEF_DONOR;
      } 
      else if (sample_type === 'sample' || sample_type === 'samples') {
            params["entity_type"] = "Sample";
            which_cols_def = COLUMN_DEF_SAMPLE;
      }
      else if (sample_type === 'dataset' || sample_type === 'datasets') {
            params["entity_type"] = "Dataset";
            which_cols_def = COLUMN_DEF_DATASET;
      } else if (sample_type === 'upload' || sample_type === 'uploads') {
            params["entity_type"] = "Upload";
            which_cols_def = COLUMN_DEF_UPLOADS;
      } 
      else {
          if (sample_type !== '----') {
            //console.debug('sample_type', sample_type)
            // check to see if this is an actual organ
            if (ORGAN_TYPES.hasOwnProperty(sample_type)) {
              params["organ"] = sample_type;
            } else { 
              params["specimen_type"] = sample_type;
            }
        }
      } 
    } 
    if (keywords) {
      params["keywords"] = keywords;
      url.searchParams.set('keywords',keywords);
    }

    console.debug('results_total  ', this.state.results_total);
    console.debug('From Page ', this.state.page);
    console.debug('From Page size', this.state.pageSize);
    console.debug("this.state.page", this.state.page);
    if(this.state.page !== 0 ){
      this.setState({
        table_loading:true, 
      });
    }
    window.history.pushState({}, '', url);
    //window.history.pushState({}, '', search);
    // window.location.search = window.location.search.replace(/file=[^&$]*/i, 'file=filename');

    this.setState({ 
      loading: true,
      filtered: true
    },() => {
      console.debug("SEARCHCOM this.state.pageSize", this.state.pageSize);
      api_search2(params, JSON.parse(localStorage.getItem("info")).groups_token, 
          (this.state.page*this.state.pageSize), this.state.pageSize, this.state.fieldSet)
      .then((response) => {
        // console.debug("Search Res", response.results);
        
        if (response.status === 200) {
          if (response.total === 1) {  // for single returned items, customize the columns to match
            which_cols_def = this.columnDefType(response.results[0].entity_type);
            ////console.debug("which_cols_def: ", which_cols_def);
          }else if(response.total <= 0 ){
            
              console.log("0 results not mid-load");
            }
          
        this.setState({
          datarows: response.results, // Object.values(response.results)
          results_total: response.total,
          column_def: which_cols_def,
          loading: false,
          table_loading:false, 
        });
      }else{
        console.debug("Error on Search ", response)
        var errString = response.results.data.error.root_cause[0].type+" | "+response.results.data.error.root_cause[0].reason
        typeof errString.type === 'string' ? errString = "Error on Search" : errString = errString
        console.debug("errString",errString);
        this.setState({
          errorState:true,
          error: errString
        })
      }
    })
  
    });
      
    
  };

  columnDefType = (et) => {
    //console.debug("ET ", et);
    if (et === 'Donor') {
        return COLUMN_DEF_DONOR;
    } 
    if (et === 'Dataset') {
        return COLUMN_DEF_DATASET;
    } 
    if (et === 'Upload') {
        return COLUMN_DEF_UPLOADS;
    } 
    return COLUMN_DEF_SAMPLE;
  }

  handleUrlChange = (targetPath) =>{
    console.debug("handleUrlChange "+targetPath)
    if( (!targetPath || targetPath === undefined || targetPath === "") && this.state.modeCheck!=="Source" ){
      targetPath = ""
    }
    this.setState({
      loading: false
    })
    if(targetPath!=="----" && targetPath!=="undefined" && targetPath.length>0){
      console.debug("Changing to "+targetPath);
      this.props.onPageChange(targetPath);
    }
  }
  // handleUrlChange = (targetPath) =>{
  //   console.debug("handleUrlChange "+targetPath)
  //   if( (!targetPath || targetPath === undefined || targetPath === "") && this.state.modeCheck!=="Source" ){
  //     targetPath = ""
  //   }
  //   this.setState({
  //     loading: false
  //   })
  //   if(targetPath!=="----" && targetPath!=="undefined"){
  //     window.history.pushState(
  //       null,
  //       "", 
  //       "/"+targetPath);
  //   }
  // }

  handlePageChange = (page) => {
    console.debug('Page changed', page)
    this.setState({
          page: page,
          table_loading:true, 
//          pageSize: params.pageSize
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  }

  handlePageSizeSelection = (pagesize) => {
    this.setState({
      pageSize: pagesize
    })
  }

  handleSearchButtonClick = () => {
    console.debug("handleSearchButtonClick")
    this.setState({
          datarows: [],
          loading: true,
          page: 0    // reset the page
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  
  }

  handleTableSelection = (row) => {
    ////console.debug('you selected a row', row)   // datagrid only provides single selection,  Array[0]
    if (row.length > 0) {
      alert(row)
    }
  }

 cancelEdit = () => {
    this.setState({ 
      editingEntity: null, 
      show_modal: false,  
      show_search: true,
      loading: false
    });
    // console.debug("cancelEdit")
    // console.debug(this.props.match)
    // console.debug(this.props.match.params.type)
    // this.handleClearFilter();
    // this.props.urlChange("-1");
    // this.handleSearchClick();
    //this.filterEntity();
    //this.props.onCancel();
  };

  
  onUpdated = data => {
    //this.filterEntity();
    console.debug("onUpdated SC", data)
    this.setState({
      updateSuccess: true,
      editingEntity: data,
      show_search: false,
      loading: false
    }, () => {   
      console.debug("onUpdated state", this.state)
      // this.handleSearchClick();
      this.cancelEdit();
      // ONLY works for functional components and all oura are class components
       // this.props.history.push("/"+this.state.formType+"/"+this.state.editNewEntity.uuid)
       this.setState({ redirect: true })
   });
    setTimeout(() => {
      this.setState({ updateSuccess: null });
    }, 5000);

    if(!this.state.editingEntity && this.props.editNewEntity){
      this.setState({ 
        editingEntity: this.props.editNewEntity
      });
      console.debug("EditNewEntity")
    }
    
    //this.props.onCancel();
  };

  handleClose = () => {
    //console.log("App.js handleClose");
    this.setState({
      creatingNewUpload: false,
      anchorEl: null,
      show_menu_popup: false,
      open_edit_dialog: false, 
      creatingNewEntity: false,
      showSearch: true,
      show_search:true,
      loading: false
    });
    //this.handleUrlChange("");
  };

  handleTableCellClick = (params) => {
    console.debug("handleTableCellClick");
    console.debug(params);
    
    if(params.field === 'uuid') return; // skip this field

    if (params.hasOwnProperty('row')) {
    // ////console.debug('CELL CLICK: entity', params.row.entity_type);
    console.debug('Local CELL CLICK: uuid', params.row.uuid, params.row);
      var typeText = (params.row.entity_type).toLowerCase();
    this.props.urlChange( typeText+"/"+params.row.uuid);

    /* We're controlling the Routing and Most other views from the outer App wrapping, not within the SearchComponent Itself Anymore */
    // Exception being Uploads
    entity_api_get_entity(params.row.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;

        if(entity_data.read_only_state){
          ingest_api_allowable_edit_states(params.row.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
            .then((resp) => {
              //console.debug('ingest_api_allowable_edit_states done', resp)
            let read_only_state = false
            if (resp.status === 200) {
              read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
            }

              this.setState({
                updateSuccess: null,
                editingEntity: entity_data,
                //editingDisplayId: display_id,
                readOnly: read_only_state,   // used for hidding UI components
                editForm: true,
                show_modal: true,
                show_search: false,
                loading: false
                });
          //this.props.onEdit();
          });
        }else{
          this.setState({
            updateSuccess: null,
            editingEntity: entity_data,
            //editingDisplayId: display_id,
            readOnly: "read_only_state",   // used for hidding UI components
            editForm: true,
            show_modal: true,
            show_search: false,
            loading: false
            });
        }
      this.handleUrlChange(entity_data.entity_type+"/"+entity_data.uuid);
      }
    });
    }
    }
  

  handleClearFilter = () => {

    this.setState(
      {
        filtered: false,
        datarows: [],
        sampleType: "----",
        group: "All Components",
        keywords: "",
        page: 0,
      }, () => {
        this.handleSearchClick();
    });
  };

 onChangeGlobusLink(newLink, newDataset) {
    const {name, display_doi, doi} = newDataset;
    this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi});
  }


  /**
    RENDER SECTION BELOW - All UI Components
  **/

  render() {
       

    // const { redirect } = this.state;
    if (this.state.isAuthenticated) {
    return  (
        
        <div style={{ width: '100%' }}>



          {this.state.show_search && (
            // this.renderFilterControls()
            this.renderFilterControls()
            )}

            
          {this.state.loading &&(
             this.renderLoadingBar()
          )}
            
          {/* {this.state.loading &&(
             <span>Loading...</span>
          )} */}


          {this.state.show_search && this.state.datarows &&
                    this.state.datarows.length > 0 && (
              this.renderTable())
          }
          {this.state.datarows &&
          this.state.datarows.length === 0 && 
          this.state.filtered && 
          !this.state.loading && (
            <div className="text-center">No record found.</div>
          )}


          {/* {!this.state.show_search && (
            // this.renderEditForm()
            this.props.urlChange()
          )} */}
  
          
          

        </div>
      );
    }
    return null;
  }

  renderProps() {
    // console.debug("INITIALSTATE",this.initialState);
    return (
      <div>
      <span className="portal-jss116 text-center">
      Found Props: {this.state.preset.entityType} {this.state.preset.entityUuid}
      </span> <br /><br />
      </div>
      );
}




  renderEditForm  = () => {
    console.debug("START rendereditForm",this.state)
    console.debug("Render Modecheck",this.props, this.props.modecheck)
        /* We're controlling the forms & other components from the outer App wrapping, not within the SearchComponent Itself Anymore */

    // if (this.state.editingEntity && !this.props.modeCheck) {
    //   console.debug("editingEntity: ", this.state.editingEntity)
    //    // Loads in for editing things, not new things
    //   const dataType = this.state.editingEntity.entity_type;
    //   if (dataType === "Donor") {
    //     return (
    //       <DonorForm
    //         //displayId={this.state.editingDisplayId}
    //         editingEntity={this.state.editingEntity}
    //         readOnly={this.state.readOnly}
    //         handleCancel={this.cancelEdit}
    //         onUpdated={this.onUpdated}
    //       />
    //     );
    //   } else if (dataType === "Sample") {
    //     return (
    //       <TissueForm
    //         displayId={this.state.editingDisplayId}
    //         editingEntity={this.state.editingEntity}
    //         editingEntities={this.state.editingEntities}
    //         readOnly={this.state.readOnly}
    //         handleCancel={this.cancelEdit}
    //         onUpdated={this.onUpdated}
    //         handleDirty={this.handleDirty}
    //       />
    //     );
    //   } else if (dataType === "Dataset") {
    //       return (
    //         <DatasetEdit
    //           handleCancel={this.cancelEdit}
    //           editingDataset={this.state.editingEntity}
    //           onUpdated={this.onUpdated}
    //           newForm={true}
    //           //onCreated={this.handleDatasetCreated}
    //           changeLink={this.onChangeGlobusLink.bind(this)}
    //         />
    //       );
    //   } else if (dataType === "Upload") {
    //       return (
    //         <UploadsEdit
    //         handleCancel={this.cancelEdit}
    //         editingUpload={this.state.editingEntity}
    //         onUpdated={this.onUpdated}
    //         groups={this.state.groups}
    //         changeLink={this.onChangeGlobusLink.bind(this)}
    //       />
    //       );
    //   } else {
    //     return <div />;
    //   }
    // }
  }


renderInfoPanel() {
      return (
        <div>
        <span className="portal-jss116 text-center">
              ** To register new items, use the REGISTER NEW ITEM menu above to select which type you wish to create.
        </span> <br /><br />
        </div>
        );
  }

  renderLoadingBar = () => {

    if( this.state.loading && !this.state.page > 0 ){
      return (
        <div>
          <LinearProgress />
        </div>
      )
    }
      
  }

  renderTable() {
  return ( 
      <div style={{ height: 590, width: '100%' }}>
        

        <DataGrid 
              rows={this.state.datarows}
              columns={this.state.column_def}
              columnVisibilityModel={{
                created_by_user_displayname: false,
              }}
              disableColumnMenu={true}
              pagination
              hideFooterSelectedRowCount
              rowCount={this.state.results_total}
              paginationMode="server"
              onPageChange={(params) => 
                this.handlePageChange(params)
              }
              onPageSizeChange={(page) =>
                this.handlePageSizeSelection(page)
              }
              loading={this.state.table_loading}
              onCellClick={this.props.select ? this.props.select : this.handleTableCellClick}  // this allows a props handler to override the local handler
        />
      </div>
    );
  }

  renderPreamble() {
 
    
    return(
      <Box sx={{
         flexDirection: 'column' ,
         justifyContent: 'center',
        }}>
        <Typography  component={"h1"} variant={"h4"} fontWeight={500} align={"center"} >
          {this.state.search_title}
        </Typography>
  
        <Typography align={"center"} variant="subtitle1"  gutterBottom>
        Use the filter controls to search for Donors, Samples, Datasets or Data Uploads. <br />
        If you know a specific ID you can enter it into the keyword field to locate individual entities.
        </Typography>
      </Box>
    )
  
  }

  renderFilterControls() {
    return (
//      <Modal show={this.props.show} handleClose={this.props.hide} scrollable={true}>
       // <div className="row">
       //   <div className="col-sm-6">

            <div className="m-2">
              {this.renderPreamble()}

              {this.state.errorState && (
                <RenderError error={this.state.error} />
                // <Alert severity="error" variant="filled"> {this.state.error}</Alert>
              )} 
              
              <form>
                <Grid 
                  container 
                  spacing={3}
                  pb={3}
                  alignItems="center"
                  sx={{ 
                    display: 'flex',
                    justifyContent: 'flex-start' 
                  }}
                >
                  <Grid item  xs={6}>
                    <label htmlFor="group" className="portal-jss116">Group</label>
                      <select
                        name="group"
                        id="group"
                        className="select-css"
                        onChange={this.handleInputChange}
                        //ref={this.group}
                        value={this.state.group}
                        >
                      {search_api_search_group_list().map((group, index) => {
                              return (
                                <option key={group.uuid} value={group.uuid}>
                                  {group.shortname}
                                </option>
                              ); 
                      })}
                    </select>
                  </Grid>
                  <Grid item xs={6}>
                      <label htmlFor="sampleType" className="portal-jss116">Type</label>
                        <select
                          name="sampleType"
                          id="sampleType"
                          className="select-css"
                          onChange={this.handleInputChange}
                          //ref={this.sampleType}
                          value={this.state.sampleType}
                        >
                          <option value="">----</option>
                          {this.state.entity_type_list.map((optgs, index) => {
                            return (
                              <optgroup
                                key={index}
                                label="____________________________________________________________"
                              >
                                {Object.entries(optgs).map(op => {
                                  return (
                                    <option key={op[0]} value={op[0]}>
                                      {op[1]}
                                    </option>
                                  );
                                })}
                              </optgroup>
                            );
                          })}
                        </select>
                  </Grid>
                  <Grid item xs={12}>
                        <input
                          type="text"
                          className="form-control"
                          name="keywords"
                          id="keywords"
                          placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                          onChange={this.handleInputChange}
                          //ref={this.keywords}
                          value={this.state.keywords}
                        />
                  </Grid>
                  
                  <Grid item xs={2}></Grid>
                <Grid item xs={4}>
                    <Button
                      fullWidth
                      color="primary"
                      variant="contained"
                      size="large"
                      onClick={this.handleSearchButtonClick}
                    >
                      Search
                    </Button>
                </Grid>
                <Grid item xs={4}>
                    <Button
                      fullWidth
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={this.handleClearFilter}
                    >
                      Clear
                    </Button>
                </Grid>
                  
                <Grid item xs={2}></Grid>
              </Grid>
            </form>
            </div>
          //</div>
       // </div>
      //</Modal>
    );
  }
  

  renderFilterControlsAlt() {
    return(
      <Box > 
        <Typography  component={"h1"} variant={"h4"} pb={3} fontWeight={500} >
            {this.state.search_title}
          </Typography>
        <Grid 
          container 
          sx={{
            flexDirection: 'column'
          }}
          justifyContent="center"
          spacing={2}
          mx={1}
          pb={3}>

            

          <Grid container spacing={2}>
          <Grid item xs={4}>
              <Typography variant="subtitle1" pt={3} gutterBottom>
              Use the filter controls to search for Donors, Samples, Datasets or Data Uploads. <br />
              If you know a specific ID you can enter it into the keyword field to locate individual entities.
              </Typography>
            </Grid>
            <Grid item xs={8}>
              <form>
                    <Grid 
                      container 
                      justifyContent="center"
                      alignItems="center"
                      spacing={3}
                      pb={3}
                    >
                      <Grid item  xs={6}>
                        <label htmlFor="group" className="portal-jss116">Group</label>
                          <select
                            name="group"
                            id="group"
                            className="select-css"
                            onChange={this.handleInputChange}
                            //ref={this.group}
                            value={this.state.group}
                            >
                          {search_api_search_group_list().map((group, index) => {
                                  return (
                                    <option key={group.uuid} value={group.uuid}>
                                      {group.shortname}
                                    </option>
                                  ); 
                          })}
                        </select>
                      </Grid>
                      <Grid item xs={6}>
                          <label htmlFor="sampleType" className="portal-jss116">Type</label>
                            <select
                              name="sampleType"
                              id="sampleType"
                              className="select-css"
                              onChange={this.handleInputChange}
                              //ref={this.sampleType}
                              value={this.state.sampleType}
                            >
                              <option value="">----</option>
                              {this.state.entity_type_list.map((optgs, index) => {
                                return (
                                  <optgroup
                                    key={index}
                                    label="____________________________________________________________"
                                  >
                                    {Object.entries(optgs).map(op => {
                                      return (
                                        <option key={op[0]} value={op[0]}>
                                          {op[1]}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                );
                              })}
                            </select>
                      </Grid>
                      <Grid item xs={12}>
                            <input
                              type="text"
                              className="form-control"
                              name="keywords"
                              id="keywords"
                              placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                              onChange={this.handleInputChange}
                              //ref={this.keywords}
                              value={this.state.keywords}
                            />
                      </Grid>
                      
              
                    <Grid item xs={4}>
                        <Button
                          fullWidth
                          color="primary"
                          variant="contained"
                          size="large"
                          onClick={this.handleSearchButtonClick}
                        >
                          Search
                        </Button>
                    </Grid>
                    <Grid item xs={4}>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="primary"
                          size="large"
                          onClick={this.handleClearFilter}
                        >
                          Clear
                        </Button>
                    </Grid>
                      
                  </Grid>
              </form>
            </Grid>
            
           

          </Grid>
        
      </Grid>
    </Box>
    )

  }
}

export default (SearchComponent);
