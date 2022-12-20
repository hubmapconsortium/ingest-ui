import React, { Component } from "react";
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@mui/material/Button';

import '../../App.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
//import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
//import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "../uuid/HIPPA.jsx";

import { validateRequired } from "../../utils/validators";
import {
  faExternalLinkAlt
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";
import GroupModal from "../uuid/groupModal";
import SearchComponent from "../search/SearchComponent";
import { ingest_api_allowable_edit_states, 
    ingest_api_create_dataset, 
    ingest_api_dataset_submit, 
    ingest_api_dataset_publish,
    ingest_api_users_groups } from '../../service/ingest_api';
import { entity_api_update_entity, entity_api_get_globus_url } from '../../service/entity_api';
//import { withRouter } from 'react-router-dom';
import {  search_api_get_assay_type,  search_api_get_primary_assays, search_api_get_assay_set } from '../../service/search_api';
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { generateDisplaySubtype } from "../../utils/display_subtypes";

import { Alert, AlertTitle } from '@material-ui/lab';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import Box from '@material-ui/core/Box';


import Select from '@material-ui/core/Select';

// function Alert(props) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class DatasetEdit extends Component {
  state = {
   // The Entity Itself
   newForm: this.props.newForm,
    data_types: this.props.editingDataset ? this.props.editingDataset.data_types : {},
    dtl_primary:[],
    dtl_all:[],
    selected_dt:"",
    //  data_types: this.props.dataTypeList,
    // data_types: new Set(),
    dataset_info: "",
    description: "",
    dataTypeDropdown: [],
    display_doi: "",
    editingSource:[],
    globus_path: "",
    source_uuid_list: [],
    source_uuid_type: "",
    source_uuid: undefined,
    source_uuids: [],
    status: "NEW",
    writeable: true,
    // editingSourceIndex:0,  
    // name: "",
    
    // User Privs & Info
    groups: [],
    has_admin_priv: false,
    has_submit_priv: false,
    has_publish_priv: false,
    
    // Data that sets the scene
    assay_type_primary: true,
    data_type_dicts: this.props.dataTypeList,
    slist:[], 
    
    // Page States 
    badge_class: "badge-purple",
    groups_dataprovider:[],
    GroupSelectShow: false,
    lookUpCancelled: false,
    LookUpShow: false,
    other_dt: "",
    previous_revision_uuid: undefined,
    buttonSpinnerTarget: "",
    errorSnack:false,
    disableSelectDatatype:false,
    // Form Validation & processing
    has_other_datatype: false,
    submitErrorResponse:"",
    submitErrorStatus:"",
    isValidData:true,
    formErrors: {
      contains_human_genetic_sequences:"",
      data_types: "",
      lab_dataset_id: "",
      other_dt: "",
      source_uuid_list:"",
      source_uuid: "",
    },
  };

  updateStateDataTypeInfo() {
    // console.debug("updateStateDataTypeInfo");
    let data_types = null;
    let other_dt = undefined;
    //console.debug("this.props", this.props);
    if (this.props.hasOwnProperty('editingDataset')
      && this.props.editingDataset
      && this.props.editingDataset.data_types) {
      }

      this.setState({
        data_types: new Set(this.props.editingDataset.data_types),
        has_other_datatype: other_dt !== undefined,
        other_dt: other_dt,
      });
    }
    
    componentDidMount() {
      // @TODO: Better way to listen for off-clicking a modal, seems to trigger rerender of entire page
      // Modal state as flag for add/remove? 
      document.addEventListener("click", this.handleClickOutside);
      this.setAssayLists();
      var savedGeneticsStatus = undefined;
      const auth = "";
      if (localStorage.getItem("info")){
        const auth = JSON.parse(localStorage.getItem("info")).groups_token;
        const config = {
          headers: {
            Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
            "Content-Type": "application/json",
          },
        };
      }else{
        localStorage.setItem("isAuthenticated", false);
      }
      
  

    // Fills in selectable Data Typw List  
    // Now from Wrapper/Props
      // this.updateStateDataTypeInfo();
    
      // Figure out our permissions
      if (this.props.editingDataset) {
        //console.debug("Editing Dataset", this.props.editingDataset);
        if (this.props.editingDataset.uuid)
        // check to see which buttons to enable
        ingest_api_allowable_edit_states(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((resp) => {
          if (resp.status < 300) {
            //console.log('edit states...', resp.results);    
            this.setState({
              writeable: resp.results.has_write_priv,
              has_submit_priv: resp.results.has_submit_priv,
              has_publish_priv: resp.results.has_publish_priv,
              has_admin_priv: resp.results.has_admin_priv
              });
          }
        });
      }else{
      //console.debug("No editingDataset Prop, Must be a New Form")
      }

    ingest_api_users_groups(auth)
      .then((res) => {
        const groups = res.results.filter(
          g => g.data_provider === true
        );
        this.setState({
          groups: groups,
          groups_dataprovider: groups,
        });
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          this.props.passError(err);
          // Rather than reload here, let's have a modal or such
          localStorage.setItem("isAuthenticated", false);
        }else if(err.status){
          localStorage.setItem("isAuthenticated", false);
        }
      });

    // Sets up the Entity's info  if we're not new here
    if (this.props.editingDataset && !this.props.newForm) {      //
      // let source_uuids;
      try {
        // use only the first direct ancestor
         this.setState({
          source_uuids: this.props.editingDataset.direct_ancestors
        });
      } catch {
       //console.debug("editingDataset Prop Not Found")
      }

      if(this.props.editingDataset ==='' ){
        savedGeneticsStatus = undefined;
      }else{
        savedGeneticsStatus = this.props.editingDataset.contains_human_genetic_sequences;
      }

      this.setState(
        {
          status: this.props.editingDataset.hasOwnProperty('status') ? this.props.editingDataset.status.toUpperCase() : "NEW",
          display_doi: this.props.editingDataset.hubmap_id,
          //doi: this.props.editingDataset.entity_doi,
          lab_dataset_id: this.props.editingDataset.lab_dataset_id,
          globus_path: "", //this.props.editingDataset.properties.globus_directory_url_path,
          source_uuid: this.getSourceAncestor(this.props.editingDataset.direct_ancestors),
          source_uuid_list:this.assembleSourceAncestorData(this.props.editingDataset.direct_ancestors),
          source_entity: this.getSourceAncestorEntity(this.props.editingDataset.direct_ancestors), // Seems like it gets the multiples. Multiple are stored here anyways during selection/editing
          slist: this.getSourceAncestorEntity(this.props.editingDataset.direct_ancestors),
          contains_human_genetic_sequences: savedGeneticsStatus,
          description: this.props.editingDataset.description,
          dataset_info: this.props.editingDataset.dataset_info,
          previous_revision_uuid: this.props.editingDataset.hasOwnProperty('previous_revision_uuid') ? this.props.editingDataset.previous_revision_uuid : undefined,
          errorMsgShow:
            this.props.editingDataset.status.toLowerCase() ===
              "error" && this.props.editingDataset.message
              ? true
              : false,
          statusErrorMsg: this.props.editingDataset.message,
        },
        () => {
          this.setState({
            badge_class: getPublishStatusColor(this.state.status.toUpperCase()),
          });
          // axios
          //   .get(
          //     `${process.env.REACT_APP_ENTITY_API_URL}/entities/${this.props.editingDataset.uuid}/globus-url`,
          //     config
          //   )
          entity_api_get_globus_url(this.props.editingDataset.uuid)
            .then((res) => {
              this.setState({
                globus_path: res.data,
              });
            })
            .catch((err) => {
              this.setState({
                globus_path: "",
                globus_path_tips: "Globus URL Unavailable",
              });
              if (err.response && err.response.status === 401) {
                localStorage.setItem("isAuthenticated", false);
                window.location.reload();
              }
            });
        }
      );
       // Now tha we've got that all set, 
      // Here's the hack that disables changing the datatype 
      // if it's no longer a base primary type.  


      var dtlStatus = this.props.dtl_status;
      console.debug("dtlStatus", dtlStatus);
      if(dtlStatus){
        // We are primary type, only priamries in Dropdown
        this.setState({
          disableSelectDatatype: false,
          dataTypeDropdown:this.props.dtl_primary
        });
      }else{
        // Not primary type, uneditable dropdown should contain all
        this.setState({
          disableSelectDatatype: true,
          dataTypeDropdown:this.props.dtl_all
        });

      }

        var selected = ""
        if(this.props.editingDataset  && this.props.editingDataset.data_types && this.props.editingDataset.data_types.length === 1){
          // Set DT Select by state so it behaves as "controlled"
          selected = this.props.editingDataset.data_types[0];
          //console.debug("SELECTED FORMATTED", selected);
        }
        this.setState({
          selected_dt: selected,
        })
  

      
      // let primaryNames = primaryDTs.map((value, index) => { return value.name });
      // // console.debug("primaryNames",primaryNames);
      // var thisDT = "AF"; 

      // var primInv = primaryDTs.find(({ name }) => name === thisDT);
      // console.debug("looking for "+thisDT+" in primaryDTs",primInv);

      
     
    }
  }

  setAssayLists(){
    //console.debug("setAssayList");
    search_api_get_assay_set()
    .then((res) => {
      console.debug("Assay Set", res);
      this.setState({
        dtl_all: res.data.result.map((value, index) => { return value.name })
      });
    })
    .catch((err) => {
      console.debug("Error getting ALL assay set", err);
    })
    search_api_get_assay_set("primary")
    .then((res) => {
      console.debug("Assay Set", res);
      this.setState({
        dtl_primary: res.data.result.map((value, index) => { return value.name })
      });
    })
    .catch((err) => {
      console.debug("Error getting Primary assay set", err);
    })
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
  }

  showModal = () => {
    this.setState({ show: true });
  };

  hideModal = () => {
    this.setState({ show: false });
  };

  showErrorMsgModal = (msg) => {
    this.setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow: false });
  };

  showConfirmDialog(row,index) {
   //console.debug("ShowConfDia")

   //console.debug("row", row)
   //console.debug("row index", index)
    this.setState({ 
        confirmDialog: true,
        editingSource: row,
        editingSourceIndex: index
    });
  };

  hideConfirmDialog = () => {
    this.setState({ 
        confirmDialog: false ,
        editingSource: []
    });
  };

  hideGroupSelectModal = () => {
    this.setState({
      GroupSelectShow: false
    });
  };

  handleLookUpClick = () => {
   //console.debug('IM HERE TRYING TO SHOW THE DIALOG', this.state.lookUpCancelled, this.state.LookUpShow)
    if (!this.state.lookUpCancelled) {
      this.setState({
        LookUpShow: true
      });
    }
     this.setState({
        lookUpCancelled: false
      });
  };

  hideLookUpModal = () => {
    //////console.debug('IM HERE TRYING TO HIDE THE DIALOG')
    this.setState({
      LookUpShow: false
    });
  };

  cancelLookUpModal = () => {
    //////console.debug('IM HERE TRYING TO HIDE THE DIALOG')
    this.setState({
      LookUpShow: false,
      lookUpCancelled: true
    });
  };

  handler = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (this.state.collection_candidates.length > 0) {
        this.setState({
          collection: this.state.collection_candidates[0],
          showCollectionsDropDown: false,
        });
      }
    }
  }; 

  handleInputChange = (e) => {
    const { id, name, value } = e.target;
    // console.debug('INPUT:', name, id, value)
    switch (name) {
      case "lab_dataset_id":
        this.setState({
          lab_dataset_id: value,
        });
        //console.debug('*** lab_dataset_id', value)
        break;
      // case "source_uuid":
      //   this.setState({
      //     source_uuid: value,
      //   });
      //   break;
      case "contains_human_genetic_sequences":  
        let gene_seq = undefined; 
        if (value === 'yes') {
          gene_seq = true;
        } else if(value === 'no'){
          gene_seq = false;
        }
        this.setState({
          contains_human_genetic_sequences: gene_seq,  // need to convert to a boolean
        });
        break;
      case "description":
        this.setState({
          description: value,
        });
        break;
      case "dataset_info":
        this.setState({
          dataset_info: value,
        });
      break;
      case "status":
        this.setState({
          new_status: value,
        });
        break;
      // case "is_protected":
      //   this.setState({
      //     is_protected: e.target.checked,
      //   });
      //   break;
      
      case "other_dt":
        console.debug("OTHER DT", value);
        this.setState({ other_dt: value });
        break;
      case "dt_select":
        console.debug("DT SELECT", value);
        var data_types = [];  
        data_types.push(value);
        // data_types.push(value);
        this.setState({
          has_other_datatype: false,
          data_types: data_types,
          selected_dt: value,
        });
        console.debug("data_types", data_types);
          break;
      case "groups":
        this.setState({
          selected_group: value
        });
        break;
      default:
        break;
    }
    if (id.startsWith("dt")) {
     //console.log('ping!', id);
      if (id === "dt_other") {
        const data_types = this.state.data_types;
        this.setState({
          data_types: data_types,
          has_other_datatype: e.target.checked,
        });
        if (!e.target.checked) {
	         const data_type_options = new Set(this.props.dataTypeList.map((elt, idx) => {return elt.name}));
            const data_types = this.state.data_types;
            const other_dt = Array.from(data_types).filter(
              (dt) => !data_type_options.has(dt)
              )[0];
            data_types.delete(other_dt);
            this.setState({
              data_types: data_types,
              other_dt: "",
            });
        }
      } else {
        //////console.log(id, e.target.checked)
        if (value === "other") {
          // const data_types = this.state.data_types;
          // data_types.clear();
          // data_types.add(value);
          this.setState({
            data_types: data_types,
            has_other_datatype: value === "other",
          });
      
        } else {
          //console.debug("value", value);

          this.setState({
            has_other_datatype: false,
            selected_dt: value,
          });

        }/*if (e.target.checked) {
          const data_types = this.state.data_types;
          data_types.add(name);
          this.setState({
            data_types: data_types,
          });
        } else {
          const data_types = this.state.data_types;
          data_types.delete(name);
          this.setState({
            data_types: data_types,
          });
        }*/
      
      }
      //////console.log('data_types', this.state.data_types)
    }
  };

  handleInputFocus = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "collection":
        let ret = this.state.collections.filter((c) => {
          return c.name.toLowerCase().includes(value.toLowerCase());
        });
        this.setState({
          collection: value,
          showCollectionsDropDown: true,
          collection_candidates: ret,
        });
        break;
      default:
        break;
    }
  };

  handleInputBlur = (e) => {
    const { name } = e.target;
    switch (name) {
      case "collection":
        this.setState({
          showCollectionsDropDown: false,
        });
        break;
      default:
        break;
    }
  };

  handleCollectionClick = (collection) => {
    this.setState({
      collection: collection,
      showCollectionsDropDown: false,
    });
  };

  // this is used to handle the row selection from the SOURCE ID search (idSearchModal)
  handleSelectClick = (selection) => {
    
   //console.debug("handleSelectClick",this.state.selectedSource,  selection.uuid, this.state.selectedSource !== selection.uuid, selection);
      if(this.state.selectedSource !== selection.row.uuid){
        this.setState({
          selectedSource: selection.row.uuid
        } ,() => {    
        var slist=this.state.source_uuid_list;
        slist.push(selection.row);
        this.setState({
          source_uuid: selection.row.hubmap_id, 
          source_uuid_list: slist,
          slist: slist,
          source_entity:selection.row,  // save the entire entity to use for information
          LookUpShow: false
        });
        this.hideLookUpModal();
        // this.cancelLookUpModal();
      });
    }else{
     //console.debug("Not adding to slist; already added");
    }
  };

  sourceRemover = (row) => {
   //console.debug("Removing Source ",row.uuid)
    var slist=this.state.source_uuid_list;
    slist =  slist.filter(source => source.uuid !== row.uuid)
      this.setState( {
        source_uuid_list: slist,
        slist: slist,
      } ,() => {
       //console.log("NEW LIST ",this.state.source_uuid_list);
        // this.hideConfirmDialog();
        
      });
  }

  renderSources = () => {
    if(this.state.source_uuid_list ||  this.props.newForm===false){
      return (
        <div className="w-100">
          
          <label htmlFor='source_uuid_list'>
            Source(s) <span className='text-danger px-2'>*</span>
          </label>
          <FontAwesomeIcon
            icon={faQuestionCircle}
            data-tip
            data-for='source_uuid_tooltip'
          />
          <ReactTooltip
            id='source_uuid_tooltip'
            className='zindex-tooltip'
            place='right'
            type='info'
            effect='solid'
          >
            <p>
              The source tissue samples or data from which this data was derived.  <br />
              At least <strong>one source </strong>is required, but multiple may be specified.
            </p>
          </ReactTooltip>

        <TableContainer 
          component={Paper} 
          style={{ maxHeight: 450 }}
          className={
            this.errorClass(this.state.formErrors.source_uuid_list)
          }>
        <Table aria-label="Associated Datasets" size="small" className="table table-striped table-hover mb-0">
          <TableHead className="thead-dark font-size-sm">
            <TableRow className="   " >
              <TableCell> Source ID</TableCell>
              <TableCell component="th">Submission ID</TableCell>
              <TableCell component="th">Subtype</TableCell>
              <TableCell component="th">Group Name</TableCell>
              <TableCell component="th">Status</TableCell>
              <TableCell component="th" align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {this.state.source_uuid_list.map((row, index) => (
              <TableRow 
                key={(row.hubmap_id+""+index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                // onClick={() => this.handleSourceCellSelection(row)}
                className="row-selection"
                >
                <TableCell  className="clicky-cell" scope="row">{row.hubmap_id}</TableCell>
                <TableCell  className="clicky-cell" scope="row"> {row.submission_id && ( row.submission_id)} </TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.display_subtype}</TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.group_name}</TableCell>
                <TableCell  className="clicky-cell" scope="row">{row.status && (
                    <span className={"w-100 badge " + getPublishStatusColor(row.status,row.uuid)}> {row.status}</span>   
                )}</TableCell>
                <TableCell  className="clicky-cell" align="right" scope="row"> 
                {this.state.writeable && (
                  <React.Fragment>
                    <FontAwesomeIcon
                      className='inline-icon interaction-icon '
                      icon={faTrash}
                      color="red"  
                      onClick={() => this.sourceRemover(row,index)}
                    />
                  </React.Fragment>
                  )}
                  {!this.state.writeable && (
                  <small className="text-muted">N/A</small>
                  )}
                
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
        
                 
        {this.state.writeable && (
        <React.Fragment>
          <Box className="mt-2 w-100" width="100%"  display="flex">
            
              <Box p={1} className="m-0  text-right" flexShrink={0}  >
                <Button
                  variant="contained"
                  type='button'
                  size="small"
                  className='btn btn-neutral'
                  onClick={() => this.handleLookUpClick()} 
                  >
                  Add {this.state.source_uuids && this.state.source_uuids.length>=1 && (
                    "Another"
                    )} Source 
                  <FontAwesomeIcon
                    className='fa button-icon m-2'
                    icon={faPlus}
                  />
                </Button>
              </Box>

              <Box p={1} width="100%"   >
              {this.errorClass(this.state.formErrors.source_uuid_list) && (
                    <Alert severity="error" width="100% " >
                      {this.state.formErrors.source_uuid_list}  {this.state.formErrors.source_uuid} 
                    </Alert>
                )}
              </Box>
              
              {/*  */}
          </Box>
        </React.Fragment>
        )}
      </div>
    )}else if(this.state.writeable && this.state.editingDataset){

    }
    
  }

  // getUuidList = (new_uuid_list) => {
  //   //this.setState({uuid_list: new_uuid_list});
  // //console.log('**getUuidList', new_uuid_list)
  //   this.setState(
  //     {
  //       source_uuid: this.getSourceAncestor(new_uuid_list),
  //       source_uuid_list: new_uuid_list,
  //       LookUpShow: false,
  //     },
  //     () => {
  //       this.validateUUID(); // Only place this is called, wrapper func depricated?
  //     }
  //   );
  // };

  handleAddNewCollection = () => {
    this.setState({
      AddCollectionShow: true,
    });
  };

  // hideAddCollectionModal = (collection) => {
  //   this.setState({
  //     AddCollectionShow: false,
  //   });

  //   if (collection.label) {
  //     const config = {
  //       headers: {
  //         Authorization:
  //           "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
  //         "Content-Type": "application/json",
  //       },
  //     };

  //     axios
  //       .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections`, config)
  //       .then((res) => {
  //         this.setState(
  //           {
  //             collections: res.data.collections,
  //           },
  //           () => {
  //             const ret = this.state.collections.filter((c) => {
  //               return c.label
  //                 .toLowerCase()
  //                 .includes(collection.label.toLowerCase());
  //             });
  //             this.setState({ collection: ret[0] });
  //           }
  //         );
  //       })
  //       .catch((err) => {
  //         if (err.response === undefined) {
  //         } else if (err.response.status === 401) {
  //           localStorage.setItem("isAuthenticated", false);
  //           window.location.reload();
  //         }
  //       });
  //   }
  // };

  handleClickOutside = (e) => {
    this.setState({
      showCollectionsDropDown: false,
    });
  };

  // validateUUID = () => {
  //   let isValid = true;
  //   const uuid = this.state.source_uuid_list[0].hubmap_id
  //     ? this.state.source_uuid_list[0].hubmap_id
  //     : this.state.source_uuid_list[0];
  //   const uuid_type = this.state.source_uuid_list[0].datatype
  //     ? this.state.source_uuid_list[0].datatype
  //     : "";
  //   //const uuid_type = "Not dataset";
  //   const url_path = uuid_type === "Dataset" ? "datasets" : "specimens";
  //   const url_server =
  //     uuid_type === "Dataset"
  //       ? process.env.REACT_APP_DATAINGEST_API_URL
  //       : process.env.REACT_APP_SPECIMEN_API_URL;

  //   // const patt = new RegExp("^.{3}-.{4}-.{3}$");
  //   // if (patt.test(uuid)) {
  //   this.setState({
  //     validatingUUID: true,
  //   });
  //   if (true) {
  //     const config = {
  //       headers: {
  //         Authorization:
  //           "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
  //         "Content-Type": "multipart/form-data",
  //       },
  //     };

  //     return axios
  //       .get(`${url_server}/${url_path}/${uuid}`, config)
  //       .then((res) => {
  //         if (res.data) {
  //           if (
  //             res.data.specimen &&
  //             res.data.specimen.entitytype === "Dataset"
  //           ) {
  //             res.data.dataset = res.data.specimen;
  //             res.data.specimen = null;
  //           }
  //           this.setState((prevState) => ({
  //             source_entity: res.data,
  //             formErrors: { ...prevState.formErrors, source_uuid: "valid" },
  //           }));
  //           return isValid;
  //         } else {
  //           this.setState((prevState) => ({
  //             source_entity: null,
  //             formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
  //           }));
  //           isValid = false;
  //           Alert("The Source UUID does not exist.");
  //           return isValid;
  //         }
  //       })
  //       .catch((err) => {
  //        //console.debug("Err Caught in validateUUID catch for then Catch")
  //         this.setState((prevState) => ({
  //           submitErrorResponse:err,
  //           source_entity: null,
  //           formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
  //         }));
  //         isValid = false;
          
  //         Alert("The Source UUID does not exist.");
  //         return isValid;
  //       })
  //       .then(() => {
  //         this.setState({
  //           validatingUUID: false,
  //         });
  //         return isValid;
  //       });
  //   } else {
  //    //console.debug("Err Caught in validateUUID Return")
  //     this.setState((prevState) => ({
  //       formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
  //     }));
  //     isValid = false;
  //     Alert("The Source UUID is invalid.");
  //     return new Promise((resolve, reject) => {
  //       resolve(false);
  //     });
  //   }
  // };

  handleCancel = () => {
    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  }

  handleReprocess = () => {
    Alert("Reprocessing feature not implemented")
  }

  handleButtonClick = (i, event) => {
    //console.debug("handleButtonClick", i);
    if(event){
      //console.debug([event.target.name]);
    }

    this.setState({
      new_status: i,
      buttonState:{
        i:true
      }
    }, () => {
      this.handleSubmit(i);
    })
  };

  handleSubmit = (submitIntention) => {

    // const data_type_options = new Set(this.props.dataTypeList.map((elt, idx) => {return elt.name}));
    // const data_types = this.state.data_types;
    // const other_dt = Array.from(data_types).filter(
    //   (dt) => !data_type_options.has(dt)
    //   )[0];
    // data_types.delete(other_dt);
    // // //////console.log('submit: data_types',data_types)
    // if (this.state.other_dt) {
    //   data_types.add(this.state.other_dt);
    // }
    
    // this.setState({ data_types: data_types });
    //////console.log('submit: moving to validateForm')
    this.validateForm().then((isValid) => {
    console.debug("GroupSelectShow", this.state.GroupSelectShow);
    //console.debug("editingDataset", this.props.editingDataset);
      if (isValid) {
        if (
          (!this.props.editingDataset || 
            this.props.editingDataset.length<=0||
            !this.props.editingDataset.uuid) &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
          //console.debug("showing Group Select!!");
          this.setState({ GroupSelectShow: true });
        } else {


          console.debug("NO MODAL...",
          "Editi Mode:",!this.props.editingDataset,
          "| Dataset:",this.props.editingDataset,
          "| length:",this.props.editingDataset.length,
          "| & ",
          this.state.groups.length, 
          !this.state.GroupSelectShow
           );

          this.setState({
            GroupSelectShow: false,
            submitting: true,
          });
          const state_data_types = this.state.data_types;
          // state_data_types.delete("other");
          let data_types = [...state_data_types];
          if (this.state.other_dt !== undefined && this.state.other_dt !== "") {
            data_types = [
              ...data_types,
              this.state.other_dt.replace(/'/g, "\\'"),
            ];
          }

          // Lets make sure the data types array is unique
          // Wait why are we adding new set of all DTs ????
          // var uniqueDT = Array.from(new Set(data_types));
          // console.debug("Orig data_types", data_types);
          // console.debug("uniqueDT", uniqueDT);
          // this.setState({
          //   data_types: uniqueDT,
          // })


          // Can't stringify a set within json
          var dataTypeArray = Array.from(this.state.data_types);
          console.debug("data_types", dataTypeArray);
          // package the data up
          let data = {
            lab_dataset_id: this.state.lab_dataset_id,
            contains_human_genetic_sequences: this.state.contains_human_genetic_sequences,
            data_types: dataTypeArray,
            description: this.state.description,
            dataset_info: this.state.dataset_info,
          };
          console.debug("Compiled data: ", data);
  
          // get the Source ancestor
          if (this.state.source_uuid_list && this.state.source_uuid_list.length > 0) {
            let direct_ancestor_uuid = this.state.source_uuid_list.map((su) => {
                          return su.uuid || su.source_uuid;
            });
            if (direct_ancestor_uuid) {
              data["direct_ancestor_uuids"] = direct_ancestor_uuid;
            }
          }
          // var formData = new FormData();
          // formData.append("data", JSON.stringify(data));
          const config = {
            headers: {
              Authorization:
                "Bearer " +
                JSON.parse(localStorage.getItem("info")).groups_token
            },
          };
         
          // @TODO: Should be using services for this instead of Axios
          //console.debug(" !this.props.newForm",  !this.props.newForm);
          if (this.props.editingDataset && !this.props.newForm) {

            //console.debug("submitIntention is our status as passed into handleSubmit", submitIntention);
            //console.log("data is ", data)
            // if user selected Publish
            if (submitIntention === "published") { // From State? 
              //console.debug("about to publish with data ", data); 
              // let uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${this.props.editingDataset.uuid}/publish`;
              // axios
              //   .put(uri, JSON.stringify(data), config)

                ingest_api_dataset_publish(this.props.editingDataset.uuid, this.JSON.stringify(data),  config)
                .then((res) => {
                  this.props.onUpdated(res.data);
                })
                .catch((error) => {
                 //console.error("published ERROR ", error)
                  // this.props.passError(error);
                  this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"", });
                });
            } else if (submitIntention === "processing") {
               ////console.log('Submit Dataset...');
              //console.log("data is ", data)
                ingest_api_dataset_submit(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((response) => {
                    //console.debug("response is ", response, response.err.response);
                    if (response.status < 300) {
                      ////console.log(response.results);
                      this.props.onUpdated(response.results);
                    } else { // @TODO: Update on the API's end to hand us a Real error back, not an error wrapped in a 200 
                     var statusText = response.err.response.status+" "+response.err.response.statusText;
                    //  this.props.passError(statusText, response.err.response.data );
                      this.setState({ 
                        submit_error: true, 
                        submitting: false,
                        buttonSpinnerTarget:"", 
                        submitErrorStatus:statusText,
                        submitErrorResponse:response.err.response.data ,
                      });
                    }
                })
                .catch((error) => {
                    //console.error("processing ERROR ", error)
                    this.props.passError(error);
                    this.setState({ 
                      submit_error: true, 
                      submitting: false, 
                      submitErrorResponse:error, 
                      submitErrorStatus:error,
                      buttonSpinnerTarget:"" });
                 });
              } else { // just update
                    entity_api_update_entity(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                      .then((response) => {
                          if (response.status < 300) {
                            this.setState({ 
                              submit_error: false, 
                              submitting: false, 
                              });
                            ////console.log('Update Dataset...');
                             ////console.log(response.results);
                            this.props.onUpdated(response.results);
                          } else {
                           //console.debug("ERROR ",response)
                            this.setState({ 
                              submit_error: true, 
                              submitting: false, 
                              submitErrorResponse:response.results.statusText,
                              buttonSpinnerTarget:"" });
                          }
                }) 
                .catch((error) => {
                  //console.error("else ERROR ", error)
                  this.props.passError(error);
                   this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"" });
                 });;
              }
          } else {  // new creations

            if (this.state.lab_dataset_id) {
              data["lab_dataset_id"] = this.state.lab_dataset_id;
            }

            // the group info on a create, check for the defaults
              if (this.state.selected_group && this.state.selected_group.length > 0) {
                data["group_uuid"] = this.state.selected_group;
              } else {
                // If none selected, we need to pick a default BUT
                // It must be from the data provviders, not permissions
                data["group_uuid"] = this.state.groups_dataprovider[0].uuid; 
                // data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
              }

             //console.log('DATASET TO SAVE', JSON.stringify(data))
              // api_create_entity("dataset", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
               ingest_api_create_dataset(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status < 300) {
                   //console.log('create Dataset...', response.results);
                     this.setState({
                        //globus_path: res.data.globus_directory_url_path,
                        display_doi: response.results.display_doi,
                        //doi: res.data.doi,
                      });
                    //  axios
                    //  .get(
                    //   `${process.env.REACT_APP_ENTITY_API_URL}/entities/${response.results.uuid}/globus-url`,
                    //   config
                    // )
                    entity_api_get_globus_url(response.results.uuid)
                    .then((res) => {
                      this.setState({
                        globus_path: res.data,
                      }, () => {
                       //console.debug('globus_path', res.data)
                        this.props.onCreated({entity: response.results, globus_path: res.data}); // set as an entity for the Results
                        this.onChangeGlobusURL();
                      });
                    })
                    .catch((err) => {
                      //console.log('ERROR catch', err)
                      if (err.response && err.response.status === 401) {
                        localStorage.setItem("isAuthenticated", false);
                        window.location.reload();
                      }
                    });
                  } else {
                   //console.debug("Error response", response) 
                    this.setState({ 
                      submit_error: true, 
                      submitting: false, 
                      submitErrorResponse:response.results.data.error,
                      buttonSpinnerTarget:""} ,
                      () => {
                       //console.debug("this.state.submitErrorResponse", this.state.submitErrorResponse) 
                      });
                   
                  }
                
              })
              .catch((err) => {
               //console.debug("err", err)
                this.setState({ submit_error: true, submitting: false, submitErrorResponse:err, buttonSpinnerTarget:"" } ,
                  () => {
                   //console.debug("CATCH ", err) 
                  });
              });
          }  //else
        }
      }else{
        //console.debug("Is Not Valid");
        // console.debug("There was a problem handling your form. Please review the marked items and try again.");
        this.setState({ 
          submit_error: true, 
          submitting: false, 
          buttonSpinnerTarget:""
          // submitErrorStatus:"There was a problem handling your form, and it is currently in an invalid state. Please review the marked items and try again." 
        });

        // Alert("There was a problem handling your form. Please review the marked items and try again.");
      }
    });
  };

  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;
     //console.debug("data_types", this.state.data_types);
      // if (!validateRequired(this.state.lab_dataset_id)) {
      //   this.setState((prevState) => ({
      //     formErrors: { ...prevState.formErrors, lab_dataset_id: "required" },
      //   }));
      //   isValid = false;
      //   resolve(isValid);
      // } else {
      //   this.setState((prevState) => ({
      //     formErrors: { ...prevState.formErrors, lab_dataset_id: "" },
      //   }));
      //   // this.validateUUID().then((res) => {
      //   //   resolve(isValid && res);
      //   // });
      // }
      
      if (!validateRequired(this.state.source_uuid_list)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid_list: "At least one Source is required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid_list: "" },
        }));
        // this.validateUUID().then((res) => {
        //   resolve(isValid && res);
        // });
      }
      
      if (this.state.data_types && (this.state.data_types.size === 0 || this.state.data_types === "")) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, data_types: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, data_types: "" },
        }));
      }

      if (this.state.has_other_datatype && !validateRequired(this.state.other_dt)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, other_dt: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, other_dt: "" },
        }));
      }

      // do a check to on the data type to see what if it normally contains pii
      let pii_check = this.assay_contains_pii(this.state.data_types);

     //console.debug('VALIDATE: pii_check', pii_check)
      if (this.state.contains_human_genetic_sequences === true && pii_check === true) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else if(this.state.contains_human_genetic_sequences === false && pii_check === false){
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else {
          let emsg = "Human Genetic Sequences is required"
          if (this.state.contains_human_genetic_sequences === false && pii_check === true) {
            emsg = "The selected data type contains gene sequence information, please select Yes or change the data type."
          } else if (this.state.contains_human_genetic_sequences === true && pii_check === false) {
            emsg = "The selected data type doesn’t contain gene sequence information, please select No or change the data type."
          } 
          //console.debug('VALIDATE: emsg', emsg)
          
          this.setState((prevState) => ({
              formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: emsg },              
          }));
     
          isValid = false;       
      }
      this.setState({ isValidData: isValid});
      if(!isValid){
        this.setState({ 
          submit_error: true, 
          submitting: false,  
          buttonSpinnerTarget:""
        });
        var errorSet = this.state.formErrors;
        var result = Object.keys(errorSet).find(e => errorSet[e].length);
        //console.debug('VALIDATE: result', result);


      }
      resolve(isValid);
    });
  }

  assembleSourceAncestorData(source_uuids){
    for (var i = 0; i < source_uuids.length; i++) {
      //console.debug("LOOPUING ASAD");
      var dst = generateDisplaySubtype(source_uuids[i]);
      source_uuids[i].display_subtype=dst;
    }
  try {
    return source_uuids
  } catch {
   //console.debug("getSourceAncestory Not Found?! ",source_uuids)
  }
 
}

  // only handles one selection at this time
  getSourceAncestor(source_uuids){
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
     //console.debug("getSourceAncestory Not Found?! ",source_uuids)
    }
    return ""
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    try {
      return source_uuids[0];  // just get the first one
    } catch {
     //console.debug("getSourceAncestorEntity Not Found?! ",source_uuids)
    }
    return ""
  }

  //note: this code assumes that source_uuids is a sorted list or a single value
  generateDisplaySourceId(source_uuids) {
    // console.debug("~~~~~~~~~~` generateDisplaySourceId", source_uuids);
    //check if the source_uuids represents a list or a single value
    if (source_uuids.length > 1) {
     //console.debug("source_uuids.length > 1")
      //is_subset is a flag indicating if the source_uuid list is
      //a consecutive set of values (ex: 1-5) or a subset of values (ex: 1,3,5)
      var is_subset = "";
      //first, determine if the numbers are a complete sequence or a subset
      //loop through all the values and extract the last number from the label (ex: TEST0001-RK-3)
      for (var i = 1; i < source_uuids.length; i++) {
        //assume the label is just a string
        var first_lab_id_subset_string = source_uuids[i - 1];
        //in some instances, the label is not a string but an object
        //in this case, use the hubmap_identifier as the string
        if (typeof source_uuids[i - 1] != "string") {
          first_lab_id_subset_string = source_uuids[i - 1].hubmap_id;
        }
        //extract the last digit from the string
        var first_lab_id_subset = first_lab_id_subset_string.substring(
          first_lab_id_subset_string.lastIndexOf("-") + 1,
          first_lab_id_subset_string.length
        );

        //in some instances, the label is not a string but an object
        //in this case, use the hubmap_identifier as the string
        var next_lab_id_subset_string = source_uuids[i];
        if (typeof source_uuids[i] != "string") {
          next_lab_id_subset_string = source_uuids[i].hubmap_id;
        }
        //extract the last digit from the string
        var next_lab_id_subset = next_lab_id_subset_string.substring(
          next_lab_id_subset_string.lastIndexOf("-") + 1,
          next_lab_id_subset_string.length
        );
        //finally, compare the digits.  If any consecutive digits are more than
        //one number apart, then these values represent a subset
        if (next_lab_id_subset - first_lab_id_subset !== 1) {
          is_subset = "subset";
          break;
        }
      }
      //extract the first and last values
      let first_lab_id = source_uuids[0].hubmap_id
        ? source_uuids[0].hubmap_id
        : source_uuids[0];
      let last_lab_id = source_uuids[source_uuids.length - 1].hubmap_id
        ? source_uuids[source_uuids.length - 1].hubmap_id
        : source_uuids[source_uuids.length - 1];
      //let first_lab_id = source_uuids[0];
      //let last_lab_id = source_uuids[source_uuids.length - 1];
      let id_common_part = first_lab_id.substring(
        0,
        first_lab_id.lastIndexOf("-") + 1
      );
      let first_lab_id_num = "";
      let last_lab_id_num = "";
      let display_source_id = first_lab_id;

      first_lab_id_num = first_lab_id.substring(
        first_lab_id.lastIndexOf("-") + 1,
        first_lab_id.length
      );

      last_lab_id_num = last_lab_id.substring(
        last_lab_id.lastIndexOf("-") + 1,
        last_lab_id.length
      );

      display_source_id = `${id_common_part}[${first_lab_id_num} through ${last_lab_id_num}]`;
      if (is_subset === "subset") {
        display_source_id = `a subset of ${id_common_part}[ between ${first_lab_id_num} and ${last_lab_id_num}]`;
      }
      return display_source_id;
      //in this case there is only one value
    } else {
      if (
        source_uuids &&
        source_uuids[0] &&
        source_uuids[0].hubmap_id
      ) {
        return source_uuids[0].hubmap_id;
      } else {
        return source_uuids[0];
      }
    }
  }

  renderButtons() {
    // console.debug("renderButtons",this.state.status.toLowerCase());

    if (this.state.has_admin_priv === true && this.state.assay_type_primary === false
            && this.state.previous_revision_uuid === undefined 
            && this.state.status.toUpperCase() === "PUBLISHED") {
         return (
           <div className="buttonWrapRight">
                {this.reprocessButton()}
                {this.aButton(this.state.status.toLowerCase(), "Save")}
                {this.cancelButton()}
            </div>
          )
    }
            
    if (this.state.writeable === false) {            
      return (
            <div className="buttonWrapRight">
                {this.cancelButton()}
            </div>
          )
    } else {

      if (["NEW", "INVALID", "REOPENED", "ERROR"].includes( 
              this.state.status.toUpperCase())) {
        return (
            <div className="buttonWrapRight">
                {this.aButton(this.state.status.toLowerCase(), "Save")}
                {this.state.has_submit_priv && (
                  this.aButton("processing", "Submit"))
                }
                {this.cancelButton()}
            </div>
          )
      }
      if (this.state.status.toUpperCase() === 'UNPUBLISHED' && this.state.has_publish_priv) {
        return (
            <div className="buttonWrapRight">
                {this.aButton("published", "Publish")}
                {this.cancelButton()}
            </div>
          )
      }   
      if (this.state.status.toUpperCase() === 'PUBLISHED') {
        return (
            <div className="buttonWrapRight">
                {this.aButton("reopened", "Reopen")}
                {this.aButton("unpublished", "UnPublish")}
                {this.cancelButton()}
            </div>
          )
      } 
      if (this.state.status.toUpperCase() === 'QA') {
        return (
            <div className="buttonWrapRight">
                {this.aButton("hold", "Hold")}
                {this.aButton("reopened", "Reopen")}
                {this.state.has_publish_priv && (this.aButton("published", "Publish"))}
                {this.aButton(this.state.status.toLowerCase(), "Save")}
                {this.cancelButton()}
            </div>
          )
      }      
    }
  }

  // Cancel button
  cancelButton() {
    return(<React.Fragment>
        <div >
          <Button
              type='button'
              variant="outlined"
              onClick={() => this.handleCancel()}>
              Cancel
          </Button>
      </div>
       </React.Fragment>
      )
  }

  // General button
  aButton(newstate, which_button, event) {
    // console.debug("aButton", newstate, which_button);
    return (<React.Fragment>
      <div >
        <Button
          type='button'
          name={"button-" + which_button}
          variant="contained"
          // className='btn btn-info btn-block'
          disabled={this.state.submitting}
          // onClick={(e) =>
          //   this.handleButtonClick(newstate)
          // }
          onClick={ 
            (e) => {
              // console.debug("buttonOnclick from aButton Factory");
              // console.debug("which_button.toLowerCase()", which_button.toLowerCase());
                  // e.preventDefault();
                // var thisButton = which_button;
                this.setState({ 
                  buttonSpinnerTarget:which_button.toLowerCase()
                },() => {  
                  //console.debug("Button State Saved, ",this.state.buttonSpinnerTarget);
                })
                // console.debug("onClick", e); 
                this.handleButtonClick(newstate)
            }
        }
          data-status={newstate.toLowerCase()} 
          // data-status={this.state.status.toLowerCase()} This just grabs what the current state is, not the goal state passed in? 
        >
          {this.state.buttonSpinnerTarget===which_button.toLowerCase()  && (
            <span>              
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                />
            </span>
          )}
          {this.state.buttonSpinnerTarget!==which_button.toLowerCase()&& which_button}
        </Button>
        </div>
        </React.Fragment>
      )
  }

  reprocessButton() {
    // console.debug("reprocessButton");
    return (<React.Fragment>
      <div >
        <Button
          variant="contained"
          type='button'
          // className='btn btn-warning btn-block'
          disabled={this.state.submitting}
          onClick={() =>
            this.handleReprocess()
          }
          data-status={this.state.status.toLowerCase()}
        >
          {this.state.submitting && (
            <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {!this.state.submitting && "Reprocess"}
        </Button>
        </div>
        </React.Fragment>
      )
  }



  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  onChangeGlobusURL() {
    this.props.changeLink(this.state.globus_path, {
      name: this.state.lab_dataset_id,
      display_doi: this.state.display_doi,
      doi: this.state.doi,
    });
  }

 renderOneAssay(val, idx) {
  var idstr = 'dt_' + val.name.toLowerCase().replace(' ','_');

  return (<div className='form-group form-check' key={idstr}>
    <input type='radio' className='form-check-input' name={val.name} key={idstr} id={idstr}

    onChange={this.handleInputChange} checked={this.state.data_types.has(val.name)}
    />
    <label className='form-check-label' htmlFor={idstr}>{val.description}</label>
    </div>
         )
    }

  // renderOneAssay(val, idx) {
	 //   let idstr = 'dt_' + val.name.toLowerCase().replace(' ','_');

	 //   return (<div className='form-group form-check'>
		//                 <input type='checkbox' className='form-check-input' name={val.name} id={idstr} key={idstr}
		//                     onChange={this.handleInputChange} checked={this.isAssayCheckSet(val.name)}
		//                 />
		//                 <label className='form-check-label' htmlFor={idstr}>{val.description}</label>
		//                 </div>
	 //       )
  //   }

  isAssayCheckSet(assay) {
    ////console.log('isAssayCheckSet',assay)
    try {    
      if (this.props.editingDataset.data_types) {
        return this.props.editingDataset.data_types.includes(assay);
      } else{
        return false
      }
    } catch {
      return ("Error");
     }
   }

  renderAssayColumn(min, max) {
    // Hijacking Select options based on Primary DT status
    console.debug(this.props.dtl_status);
    if(this.props.dtl_status) { // true = primary dt, set options to primary
      return (
        this.props.dtl_primary.slice(min, max).map((val, idx) =>
                    {return this.renderAssay(val, idx)})
             )
    }else{  // false = Not primary DT, set options to full
      return (
        this.props.dtl_all.slice(min, max).map((val, idx) =>{
          return this.renderAssay(val, idx)
        })
      )
    }

	 
    }


  renderAssay(val) {
    return (
      <option key={val.name} value={val.name} id={val.name}>{val.description}</option>
      )
  }

  renderListAssay(val) {
    return (
      <li key={val}>{val}</li>
      )
  }

  renderStringAssay(val) {
    return (
      {val}
      )
  }

  renderDisabledNonprimaryDT(val) {
    return (
      <li key={val}>{val}</li>
      )
  }


  renderMultipleAssays() {
    var arr = Array.from(this.state.data_types)
    return (
      arr.map((val) =>
          {return this.renderListAssay(val)})
         )
    }

   
  renderAssayArray() {
      var len = 0;
      // var dtlistLen = this.props.dataTypeList.length;
      var dtlistLen = this.state.dataTypeDropdown.length;
      if(this.props.editingDataset && this.props.editingDataset.data_types) {
        //console.debug("this.props.editingDataset", this.props.editingDataset);
        len = this.props.editingDataset.data_types.length;
      }else{
        //console.debug("no editingDataset");
      }

       if (len > 1) {
        //console.debug("Multiple DTs", len);
        return (<>
          <ul>
            {this.renderMultipleAssays()}
          </ul>

          </>)
      }else{ 
        //  var selectedID = null;
        //   if(this.props.editingDataset && this.props.editingDataset.data_types){
        //     //console.debug("this.props.editingDataset.data_types[0]", this.props.editingDataset.data_types[0]);
        //     // If we're not in the list yet, add us!
        //     // if(!this.state.assay_type_primary){
        //     //   //console.debug("Not in the list yet, add us!");
        //     // }
        //     // selectedID = 'dt_' + this.props.editingDataset.data_types[0].toLowerCase().replace(' ','_');
        //     selectedID = this.props.editingDataset.data_types[0];
        //   }
          // console.debug("selectedID", selectedID);
        // console.debug("this.sate.data_types.values().next().value", this.state.data_types.values().next().value);
  	    return (<>
  		    <Select 
            native
            name="dt_select"
            className="form-select" 
            disabled={ (!this.state.writeable || !this.state.assay_type_primary) || this.state.disableSelectDatatype }
            value={this.state.selected_dt} 
            // defaultValue={this.state.selected_dt} 
            // value={this.props.editingDataset.data_types} 
            id="dt_select" 
            onChange={this.handleInputChange}>
  		    {/* <select className="form-select" value={this.props.dataTypeList.values().next().value} id="dt_select" onChange={this.handleInputChange}> */}
            <option></option>
            {this.renderAssayColumn(0, dtlistLen)}
            {/* <option value="other">Other</option> */}
          </Select>
          </> )
   
      }    
    }
   
  assay_contains_pii(assay) {
    let assay_val = [...assay.values()][0]   // only one assay can now be selected, the Set() is older code
   //console.debug('assay_contains_pii', assay_val)
    for (let i in this.props.dataTypeList) {
      let e = this.props.dataTypeList[i]

      if (e['name'] === assay_val) {
       //console.debug('assay_contains_pii?', e['contains-pii'])
          return e['contains-pii']
      }
    }
    return false
  }

  render() {
    return (
      <React.Fragment>
        <form className="expanded-form">
          <div className='row'>
          <div className='col-md-6'>
            <h3>
              <span
                className={"badge " + this.state.badge_class}
                style={{ cursor: "pointer" }}
                onClick={() =>
                  this.showErrorMsgModal(
                    this.props.editingDataset.pipeline_message
                )}> 
                  {this.state.status}
              </span>
                
                
              {this.props.editingDataset && !this.props.newForm &&(
                <span className="mx-1"> HuBMAP Dataset ID  {this.state.display_doi} </span>
              )}
                
              {(!this.props.editingDataset || this.props.newForm) && (
                <span className="mx-1">Registering a Dataset  {this.state.display_doi} </span>
              )}

              </h3>
              <p>
              <strong>
                  <big>

                    {this.props.editingDataset &&
                      this.props.editingDataset.title}
                  </big>
                </strong>
              </p>

              <p>
              <strong>
                {/* <big> */}
                  
                  {this.state.globus_path && (

                    <a
                      href={this.state.globus_path}
                      target='_blank'
                      rel='noopener noreferrer'
                    >
                        To add or modify data files go to the data repository
                      <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft: "5px" }} />
                    </a>
                  )}
                  
                {/* </big> */}
              </strong>
            </p> 


         
          </div>

          <div className='col-md-6'>
          
          
          <div className='alert alert-danger' role='alert'>
        <FontAwesomeIcon icon={faUserShield} /> - Do not upload any
        data containing any of the{" "}
        <span
          style={{ cursor: "pointer" }}
          className='text-primary'
          onClick={this.showModal}
        >
          18 identifiers specified by HIPAA
        </span>
        .
      </div>
           
          </div>  


              
          </div>


          <div className='row'>
                  
          </div>

          
          <div className='form-group'>
              {this.renderSources()}
              
              
              <Dialog fullWidth={true} maxWidth="lg" onClose={this.hideLookUpModal} aria-labelledby="source-lookup-dialog" open={this.state.LookUpShow ? this.state.LookUpShow : false}>
                <DialogContent>
                  <SearchComponent
                    select={this.handleSelectClick}
                    custom_title="Search for a Source ID for your Dataset"
                    filter_type="Dataset"
                    modecheck="Source"
                  />
                </DialogContent>  
                <DialogActions>
                  <Button onClick={this.cancelLookUpModal} variant="contained" color="primary">
                    Close
                  </Button>
                </DialogActions>
              </Dialog>
            </div>

          <div className='form-group'>
            <label htmlFor='lab_dataset_id'>
              Lab Name or ID
            </label>
              <span className="px-2">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='lab_dataset_id_tooltip'
                />
                <ReactTooltip
                  id='lab_dataset_id_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Lab Name or ID</p>
                </ReactTooltip>
                </span>
            {this.state.writeable && (
                <input
                  type='text'
                  name='lab_dataset_id'
                  id='lab_dataset_id'
                  className={
                    "form-control " +
                    this.errorClass(this.state.formErrors.lab_dataset_id)
                  }
                  placeholder='Lab Name or ID'
                  onChange={this.handleInputChange}
                  value={this.state.lab_dataset_id}
                />
            )}
            {/* {this.errorClass(this.state.formErrors.source_uuid_list) && (
              <div className='alert alert-danger'>
              Lab Name or ID is Required
            </div>
            )} */}
            {!this.state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.lab_dataset_id}</p>
              </div>
            )}
          </div>


            <div className='form-group'>
            <label
              htmlFor='description'>
              Description 
            </label>
            <span className="px-2">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='description_tooltip'
                />
                <ReactTooltip
                  id='description_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Description Tips</p>
                </ReactTooltip>
              </span>
            {this.state.writeable && (
              <React.Fragment>
                <div>
                  <textarea
                    type='text'
                    name='description'
                    id='description'
                    cols='30'
                    rows='5'
                    className='form-control'
                    placeholder='Description'
                    onChange={this.handleInputChange}
                    value={this.state.description}
                  />
                </div>
              </React.Fragment>
            )}
            {!this.state.writeable && (
              <div className='col-sm-12 col-form-label'>
                <p>{this.state.description}</p>
              </div>
            )}
           
          </div>
          <div className="form-group">
            <label
              htmlFor='additional-info'>
              Additional Information
            </label>
            <span className="px-2">
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='description_tooltip'
                />
                <ReactTooltip
                  id='description_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Add information here which can be used to find this data, 
                  including lab specific (non-PHI) identifiers.</p>
                </ReactTooltip>
              </span>
              {this.state.writeable && (
                <React.Fragment>
                  <div>
                    <textarea
                      type='text'
                      name='dataset_info'
                      id='dataset_info'
                      cols='30'
                      rows='5'
                      className='form-control'
                      placeholder='Additional Info'
                      onChange={this.handleInputChange}
                      value={this.state.dataset_info}
                    />
                  </div>
                </React.Fragment>
              )}
              {!this.state.writeable && (
              <div className='col-sm-12 col-form-label'>
                <p>{this.state.dataset_info}</p>
              </div>
            )}
          </div>
          
          {/* <div className={ this.state.formErrors.contains_human_genetic_sequences.length>0 ? 'form-group alert alert-danger' : 'form-group' } >
            <div className='formRowWrapper p-2'>   */}
            <div className='form-group  '>  
                <label
                  htmlFor='contains_human_genetic_sequences'
                  className='col-sm-2 col-form-label text-right '
                >
                  Gene Sequences <span className='text-danger'> * </span>
                </label>
                
                <FontAwesomeIcon
                      icon={faQuestionCircle}
                      data-tip
                      data-for='contains_human_genetic_sequences_tooltip'
                    />
                    <ReactTooltip
                      id='contains_human_genetic_sequences_tooltip'
                      place='top'
                      type='info'
                      effect='solid'
                    >

                      <p>Gene Sequences Tips</p>
                    </ReactTooltip>
                <div className="row">
                  {this.props.editingDataset && (
                    <div className='col-sm-9'>
                      <div className='form-check form-check-inline'>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='contains_human_genetic_sequences'
                          id='contains_human_genetic_sequences_no'
                          value='no'
                          // defaultChecked={true}
                          checked={this.state.contains_human_genetic_sequences === false && this.props.editingDataset}
                          onChange={this.handleInputChange}
                          disabled={!this.state.writeable}
                        />
                        <label className='form-check-label' htmlFor='contains_human_genetic_sequences_no'>
                          No
                        </label>
                      </div>
                      <div className='form-check form-check-inline'>
                        <input
                          className='form-check-input'
                          type='radio'
                          name='contains_human_genetic_sequences'
                          id='contains_human_genetic_sequences_yes'
                          value='yes'
                          checked={this.state.contains_human_genetic_sequences  === true && this.props.editingDataset}
                          onChange={this.handleInputChange}
                          disabled={!this.state.writeable}
                        />
                        <label className='form-check-label' htmlFor='contains_human_genetic_sequences_yes'>
                          Yes
                        </label>
                      </div>
                      <small id='PHIHelpBlock' className='form-text text-muted'>
                        Will this data contain any human genomic sequence data?
                      </small>
                    </div>
                  )}
                  {!this.props.editingDataset && (
                    <div className="col-sm-9 ">
                      <div className='form-check form-check-inline'>
                        <input 
                          className={
                            "form-check-input " +
                            this.errorClass(this.state.formErrors.contains_human_genetic_sequences)
                          }
                          type='radio'
                          name='contains_human_genetic_sequences'
                          id='contains_human_genetic_sequences_no'
                          value='no'
                          // defaultChecked={true}
                          //checked={this.state.contains_human_genetic_sequences == false && this.props.editingDataset}
                          onChange={this.handleInputChange}
                          //disabled={this.props.editingDataset}
                          //required
                        />
                        <label className='form-check-label' htmlFor='contains_human_genetic_sequences_no'>
                          No
                        </label>
                      </div>
                      <div className='form-check form-check-inline'>
                        <input 
                          className={
                            "form-check-input " +
                            this.errorClass(this.state.formErrors.contains_human_genetic_sequences)
                          }
                          type='radio'
                          name='contains_human_genetic_sequences'
                          id='contains_human_genetic_sequences_yes'
                          value='yes'
                          //checked={this.state.contains_human_genetic_sequences  == true && this.props.editingDataset}
                          onChange={this.handleInputChange}
                          //disabled={this.props.editingDataset}
                          //required
                        />
                        <label className='form-check-label' htmlFor='contains_human_genetic_sequences_yes'>
                          Yes
                        </label>
                      </div>
                      <small id='PHIHelpBlock' className='form-text text-muted'>
                        Will this data contain any human genomic sequence data? TEST
                      </small>
                      
                    
                    </div>
                  )}

                  {/*!this.state.writeable && (
                    <div className='col-sm-9 col-form-label'>
                      <p>{this.state.contains_human_genetic_sequences}</p>
                    </div>
                  )*/}
                  {this.errorClass(this.state.formErrors.contains_human_genetic_sequences) && (
                        <Alert severity="error">
                          {this.state.formErrors.contains_human_genetic_sequences}
                        </Alert>
                    )}
                
                </div>


            </div>
          
          {/* <div className={ this.state.formErrors.contains_human_genetic_sequences.length>0 ? 'form-group alert alert-danger' : 'form-group' } >
            <div className='formRowWrapper p-2'> */}
            <div className= 'form-group'>
              <label
                htmlFor='dt_select'
                className='col col-form-label text-right'
              >
                Data Type <span className='text-danger'>* </span>
              </label>
              <span>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='datatype_tooltip'
                  style={{ marginLeft: "10px" }}
                />
                <ReactTooltip
                  id='datatype_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Data Type Tips</p>
                </ReactTooltip>
              </span>
              {this.state.writeable&& (
                <React.Fragment>
                  
                  <div className='col-sm-12'>
                        { this.renderAssayArray()}
                  </div>
      
                  <div className='col-sm-12'>
                  {this.state.formErrors.data_types && (
                    <div className='alert alert-danger'>
                      At least one Data Type is Required.
                    </div>
                  )}
                  </div>
                </React.Fragment>
              )}
              {!this.state.writeable && (
                  <div className='col-sm-12'>
                        {true && this.renderAssayArray()}
                  </div>
              )}
            
          </div>
 
          {this.state.assay_metadata_status !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='assay_metadata_status'
                className='col-sm-2 col-form-label text-right'
              >
                Assay Metadata Status
              </label>
              <div className='col-sm-9 my-auto'>
                {this.state.assay_metadata_status === 0 && (
                  <span className='badge badge-secondary'>No metadata</span>
                )}
                {this.state.assay_metadata_status === 1 && (
                  <span className='badge badge-primary'>Metadata provided</span>
                )}
                {this.state.assay_metadata_status === 2 && (
                  <span className='badge badge-primary'>Metadata curated</span>
                )}
              </div>
            </div>
          )}
          {this.state.data_metric_availability !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='data_metric_availability'
                className='col-sm-2 col-form-label text-right'
              >
                Data Metric Availability
              </label>
              <div className='col-sm-9 my-auto'>
                {this.state.data_metric_availability === 0 && (
                  <span className='badge badge-secondary'>
                    No quality metrics are available
                  </span>
                )}
                {this.state.data_metric_availability === 1 && (
                  <span className='badge badge-primary'>
                    Quality metrics are available
                  </span>
                )}
              </div>
            </div>
          )}
          {this.state.data_processing_level !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='data_processing_level'
                className='col-sm-2 col-form-label text-right'
              >
                Data Proccessing Level
              </label>
              <div className='col-sm-9 my-auto'>
                {this.state.data_processing_level === 0 && (
                  <span className='badge badge-secondary'>
                    Uploaded data. No standardized processing has been performed
                    by the HIVE.
                  </span>
                )}
                {this.state.data_processing_level === 1 && (
                  <span className='badge badge-primary'>
                    Processing has been performed with a standard HIVE pipeline.
                  </span>
                )}
                {this.state.data_processing_level === 2 && (
                  <span className='badge badge-primary'>
                    Additional processing has been performed.
                  </span>
                )}
              </div>
            </div>
          )}
          {this.state.dataset_sign_off_status !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='dataset_sign_off_status'
                className='col-sm-2 col-form-label text-right'
              >
                Dataset Sign Off Status
              </label>
              <div className='col-sm-9 my-auto'>
                {this.state.dataset_sign_off_status === 0 && (
                  <span className='badge badge-secondary'>
                    Expert has not signed off on the data
                  </span>
                )}
                {this.state.dataset_sign_off_status === 1 && (
                  <span className='badge badge-primary'>
                    Expert has signed off on the data
                  </span>
                )}
              </div>
            </div>
          )}

          
          <div className='row'>

            <div className="col-8">
              {this.state.submit_error && (
                <Alert severity="error" >
                  {this.state.submitErrorResponse &&(
                    <AlertTitle>{this.state.submitErrorStatus}</AlertTitle>
                  )}
                  Oops! Something went wrong. Please contact administrator for help. <br />
                  {/* {this.state.submitErrorResponse || this.state.submitErrorStatus || this.state. &&( */}
                    <>
                      Details:  <strong>{this.state.submitErrorStatus} </strong> {this.state.submitErrorResponse}
                    </>
                  {/* )} */}
                </Alert>
              )}
            </div>
            <div className="col-4">  
              {this.renderButtons()}
            </div>
          </div>
        </form>
        <GroupModal
          show={this.state.GroupSelectShow}
          // hide={this.hideGroupSelectModal}
          groups={this.state.groups}
          submit={this.handleSubmit}
          handleInputChange={this.handleInputChange}
        />
        <HIPPA show={this.state.show} handleClose={this.hideModal} />
        <Modal
          show={this.state.errorMsgShow}
          handleClose={this.hideErrorMsgModal}
        >
          <div className='row'>
            <div className='col-sm-12 text-center alert'>
              <h4>
                {(this.props.editingDataset && this.props.editingDataset.status &&
                  this.props.editingDataset.status.toUpperCase()) ||
                  "STATUS"}
              </h4>
              <div
                dangerouslySetInnerHTML={{ __html: this.state.statusErrorMsg }}
              ></div>
            </div>
          </div>
        </Modal>
      </React.Fragment>
    );
  }
}

export default DatasetEdit;