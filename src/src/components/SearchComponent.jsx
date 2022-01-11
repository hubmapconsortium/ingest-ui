import React, { Component  } from "react";


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
import { DataGrid } from '@mui/x-data-grid';
import Paper from '@material-ui/core/Paper';
import axios from "axios";
import { SAMPLE_TYPES, ORGAN_TYPES } from "../utils/constants";

import Select from 'react-select'

import LinearProgress from '@material-ui/core/LinearProgress';
import { api_search2, search_api_search_group_list } from '../service/search_api';
import { COLUMN_DEF_DONOR, COLUMN_DEF_SAMPLE, COLUMN_DEF_DATASET, COLUMN_DEF_UPLOADS } from './ui/table_constants';

import { entity_api_get_entity } from '../service/entity_api';
import { ingest_api_allowable_edit_states, ingest_api_users_groups } from '../service/ingest_api';
// import 'url-search-params-polyfill';

// Creation donor_form_components

function OpenEntity(target) {
  let navigate = useNavigate();
  navigate(target, { replace: true });
 }

export const RenderSearch = props => {
  return <SearchComponent history={this.props.history} {...props} />
}

const SearchCellClick = (params) => {
  var selected = params.row;
  var targetPage = selected.entity_type + '/' + selected.entity_id;
  console.debug("SearchCellClick");
  console.debug(targetPage);  
  OpenEntity(targetPage);
}


export default function SubscribeToEvents() {
  const apiRef = useGridApiRef();
  const [message, setMessage] = React.useState('');
  const { data } = useDemoData({
    dataSet: 'Commodity',
    rowLength: 1,
    maxColumns: 6,
  });

  React.useEffect(() => {
    return apiRef.current.subscribeEvent('cellClick', (params) => {
      console.debug("CellClick", params);
    });
  }, [apiRef]);



// const RenderTable = (dataRows, column_def, results_total, table_loading) => {
//   return ( 
//       <Paper className="paper-container pt-2 ">
//       <div style={{ height: 590, width: '100%' }}>
//         <DataGrid 
//               rows={dataRows}
//               columns={column_def}
//               disableColumnMenu={true}
//               pagination
//               hideFooterSelectedRowCount
//               rowCount={results_total}
//               paginationMode="server"
//               // onPageChange={(params) => 
//               //   this.handlePageChange(params)
//               // }
//               // onPageSizeChange={(page) =>
//               //   this.handlePageSizeSelection(page)
//               // }
//               loading={table_loading}
//               onCellClick={SearchCellClick}  // this allows a props handler to override the local handler
//              // onCellClick={this.props.select ? this.props.select : SearchCellClick}  // this allows a props handler to override the local handler

//         />
//       </div>
//       </Paper>
//     );
//   }



export class SearchComponent extends Component {

  state = {
      selectionModel: "",
      filtered_keywords: "",
      filtered: false,
      entity_type_list: SAMPLE_TYPES,
      column_def: COLUMN_DEF_DONOR, 
      show_info_panel: true,
      show_search: true,
      results_total: 0,
      page: 0,
      pageSize: 100,
      editForm: false,
      show_modal: false,
      hide_modal: true, 
      updateSuccess: false,
      globus_url: "",
      isAuthenticated: false,
      group: "All Components",
      sample_type: this.props.sample_type ? this.props.sample_type:"----",
      keywords: "",
      last_keyword: "",
      loading: false,
      dropdown_test: [
        { value: 'chocolate', label: 'Chocolate' },
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'vanilla', label: 'Vanilla' }
      ],
      
      table_loading:false,
      modeCheck:"" //@TODO: Patch for loadingsearch within dataset edits, We should move this
    };

  

  componentDidMount() {     
    console.debug("SEARCH componentDidMount")
    console.debug("SearchComponent Props: ",this.props);
    var listTest = this.handleTypeDropdownMap();
    console.debug("listTest",listTest);


    if(this.props.sample_type){
      console.debug("Sample Type from prop", this.props.sample_type);
      this.setState({
        sample_type: this.props.sample_type
      },
      () => {
        console.debug("Sample Type Prop set to State");
        this.setFilterType();
        this.handleSearchClick();
      });

      
    }

    if(this.props.blank_search === "true"){
      this.handleClearFilter();
    }

  }


  handleTypeDropdownMap = () => {
    let sampleList = [];
      for (const[ key, value] in SAMPLE_TYPES){
        console.debug(key, value);
        console.debug(SAMPLE_TYPES[key], SAMPLE_TYPES[value]);
        sampleList.push({
          // label: value:SAMPLE_TYPES[value]
          "test":"yes"
        });
      }
      console.log("sampleList",sampleList);
      return sampleList;
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


  componentDidUpdate(prevProps, prevState) {
    console.debug("componentDidUpdate");
    
  }

  handleInputChange = e => {
    const { name, value } = e.target;
    console.debug('handleInputChange', name)
    switch (name) {
      case "group":
        this.setState({ group: value });
        break;
      case "sample_type":
        this.setState({ sample_type: value });        
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
    
    //@TODO #REFACTOR we have URL routes for the the search by type at least now~
    // UPDATE: so react routing ONLY handles search Querys in the URL through Functional components now,
    // the by-class workaround has been stripped out. 


    const group = this.state.group;
    var sample_type= this.props.sample_type ? this.props.sample_type:this.state.sample_type
    //var sample_type = this.state.sampleType;
    const keywords = this.state.keywords;
    //@TODO #REFACTOR use improved url handling
    var url = new URL(window.location);
    
    console.debug("handleSearchClick", sample_type);
    
    this.setState({
      last_keyword: keywords
    })

    let params = {};
    let which_cols_def = COLUMN_DEF_SAMPLE;  //default
    if (group && group !== 'All Components') {
        params["group_uuid"] = group;
    }


    if (sample_type) {
      console.debug("Sample_type for URL Search ",sample_type);
      //@TODO #REFACTOR we have URLS nowm see where sample_type is set;
        url.searchParams.set('sample_type',sample_type);
      }

      if (sample_type === 'donors') {
        params["entity_type"] = "Donor";
        which_cols_def = COLUMN_DEF_DONOR;
      } 
      else if (sample_type === 'samples') {
            params["entity_type"] = "Sample";
            which_cols_def = COLUMN_DEF_SAMPLE;
      }
      else if (sample_type === 'datasets') {
            params["entity_type"] = "Dataset";
            which_cols_def = COLUMN_DEF_DATASET;
      } else if (sample_type === 'uploads') {
            params["entity_type"] = "Upload";
            which_cols_def = COLUMN_DEF_UPLOADS;
      } 
      else {
          if (sample_type !== '----') {
            console.debug('sample_type', sample_type)
            // check to see if this is an actual organ
            if (ORGAN_TYPES.hasOwnProperty(sample_type)) {
              params["organ"] = sample_type;
            } else { 
              params["specimen_type"] = sample_type;
            }
        }
      } 
     
    if (keywords) {
      params["keywords"] = keywords;
      url.searchParams.set('keywords',keywords);
    }
    if(this.state.page !== 0 ){
      this.setState({
        table_loading:true, 
      });
    }
     window.history.pushState({}, '', url);


    // window.history.pushState({}, '', url);
    //window.history.pushState({}, '', search);
    // window.location.search = window.location.search.replace(/file=[^&$]*/i, 'file=filename');

    this.setState({ 
      loading: true,
      filtered: true
    },() => {
      api_search2(params, JSON.parse(localStorage.getItem("info")).groups_token, 
          (this.state.page*this.state.pageSize), this.state.pageSize)
      .then((response) => {
        console.debug("Search Res", response.results);
        
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
    console.debug("Changes to URL Management! ps: ", targetPath);

    if(targetPath!=="----" && targetPath!=="undefined"){
      OpenEntity(targetPath);
      // window.history.pushState(
      //   null,
      //   "", 
      //   "/"+targetPath);
    }
  }

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
//          page: 0    // reset the page
        }, () => {   // need to do this in order for it to execute after setting the state or state won't be available
            this.handleSearchClick();
        });
  
  }

  
 cancelEdit = () => {
    this.setState({ 
      editingEntity: null, 
      show_modal: false,  
      show_search: true,
      loading: false
    });
    this.handleUrlChange();
    this.handleSearchClick();
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
    console.debug('Local CELL CLICK: uuid', params.row.uuid);

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
      this.handleUrlChange(entity_data.entity_type.toLowerCase()+"s/"+entity_data.uuid);
      }
    });
    }
  }

  handleClearFilter = () => {
    console.debug("handleClearFilter");
    this.setState(
      {
        filtered: false,
        datarows: [],
        sample_type: "",
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
 
    return  (
        
        <div className={"searchWrapper"} style={{ width: '100%' }}>
          {this.renderFilterControls()}
          {this.state.loading &&(
             this.renderLoadingBar()
          )}
          {this.state.datarows &&
            this.state.datarows.length > 0 && (
              this.renderTable())
          }
         

        </div>
      );
    
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
      <Paper className="paper-container pt-2 ">
      <div style={{ height: 590, width: '100%' }}>
        <DataGrid 
              rows={this.state.datarows}
              columns={this.state.column_def}
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
              //onCellClick={this.props.select ? this.props.select : this.handleTableCellClick}  // this allows a props handler to override the local handler
              // onCellClick={() =>
              //   SearchCellClick()
              // }
              onCellClick={this.props.select ? this.props.select : SearchCellClick}  // this allows a props handler to override the local handler

        />
      </div>
      </Paper>
    );
  }

  renderFilterControls() {
    return (
//      <Modal show={this.props.show} handleClose={this.props.hide} scrollable={true}>
       // <div className="row">
       //   <div className="col-sm-6">

            <div className="card pt-2">
              {this.props.custom_title && (
                <span className="portal-label text-center">{this.props.custom_title}</span>
              )}
              {!this.props.custom_title && (
                <span className="portal-label text-center">Search</span>
              )}
              <span className="portal-jss116 text-center">

              <h1>{this.props.test}</h1>
              Use the filter controls to search for Donors, Samples, Datasets or Data Uploads.
              If you know a specific ID you can enter it into the keyword field to locate individual entities.
              </span>
              <div className="card-body search-filter">
      
                <form>
                  <div className="row">
                    <div className="col">
                    <div className="form-group">
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
                    </div>
                    </div>
                  
                  <div className="col">
                    <div className="form-group">
                      <label htmlFor="sample_type" className="portal-jss116">Type</label>
                      {/* <Select 
                                               options={this.state.entity_type_list} 

                       // options={this.state.dropdown_test} 
                      /> */}
                        <select
                          name="sample_type"
                          id="sample_type"
                          className="select-css"
                          onChange={this.handleInputChange}
                          //ref={this.sampleType}
                          value={this.state.sample_type}
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
                    </div>
                    </div>
 
                  </div>
                  <div className="row">
                      <div className="col-sm-12">
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
                     </div>
                  
                  </div>
          
                <div className="row mb-5 pads">
                  <div className="col-sm-4 offset-sm-2">
                    <button
                      className="btn btn-primary btn-block"
                      type="button"
                      onClick={this.handleSearchButtonClick}
                    >
                      Search
                    </button>
                  </div>
                  <div className="col-sm-4">
                    <button
                      className="btn btn-outline-secondary btn-block"
                      type="button"
                      onClick={this.handleClearFilter}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {this.state.datarows &&
                  this.state.datarows.length === 0 && 
                  this.state.filtered && 
                  !this.state.loading && (
                    <div className="text-center">No record found.</div>
                  )}
             </form>
              </div>
            </div>

          //</div>
       // </div>
      //</Modal>
    );
  }
}

export default SearchComponent;
