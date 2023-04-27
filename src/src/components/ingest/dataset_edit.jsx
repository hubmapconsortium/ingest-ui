import React, { Component } from "react";
import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import Pagination from '@mui/material/Pagination';
import LinearProgress from '@mui/material/LinearProgress';

import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';

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
    ingest_api_users_groups, 
    ingest_api_allowable_edit_states_statusless} from '../../service/ingest_api';
import { entity_api_update_entity, entity_api_get_globus_url, entity_api_get_entity } from '../../service/entity_api';
//import { withRouter } from 'react-router-dom';
import { ubkg_api_get_assay_type_set } from "../../service/ubkg_api";
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
    // globus_path: "",
    source_uuid_list: [],
    source_uuid_type: "",
    source_uuid: undefined,
    source_uuids: [],
    status: "NEW",
    upload:[],
    writeable: true,
    // editingSourceIndex:0,  
    // name: "",
    
    // User Privs & Info
    groups: [],
    has_admin_priv: false,
    has_submit_priv: false,
    has_publish_priv: false,
    has_version_priv: false,
    groupsToken:"",
    
    // Data that sets the scene
    assay_type_primary: true,
    data_type_dicts: this.props.dataTypeList,
    slist:[], 
    
    // Page States 
    showSubmitModal:false,
    badge_class: "badge-purple",
    groups_dataprovider:[],
    GroupSelectShow: false,
    lookUpCancelled: false,
    LookUpShow: false,
    other_dt: "",
    buttonSpinnerTarget: "",
    errorSnack:false,
    disableSelectDatatype:false,
    // Form Validation & processing
    newVersion:false,
    previousHID: undefined,
    nextHID: undefined,
    previous_revision_uuid: undefined,
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
    let data_types = null;
    let other_dt = undefined;
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
      var permChecks = [this.state.has_admin_priv,this.state.has_submit_priv,this.state.writeable,this.state.assay_type_primary,this.state.status.toUpperCase(),this.props.newForm]
      console.table({permChecks});

      // @TODO: Better way to listen for off-clicking a modal, seems to trigger rerender of entire page
      // Modal state as flag for add/remove? 
      document.addEventListener("click", this.handleClickOutside);
      this.setAssayLists();
      var savedGeneticsStatus = undefined;
      try {
        var auth = JSON.parse(localStorage.getItem("info")).groups_token;
        this.setState({groupsToken:auth});
      } catch {
       
       var auth = "";
      }

      if (localStorage.getItem("info")){
        // @TODO: Evaluate best practices, pass token to Service from within form
        // Or consider another method for token/service auth handling
        // Configs should /only/ assembed in the service using the passed token for now
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

   

      // Figure out our permissions
      if (this.props.editingDataset) {
        console.debug("DatasetEdit: componentDidMount: editingDataset: " + this.props.editingDataset.uuid);
        if (this.props.editingDataset.uuid)
        // check to see which buttons to enable
        ingest_api_allowable_edit_states(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((resp) => {
          if (resp.status < 300) {
            //
            this.setState({
              writeable: resp.results.has_write_priv,
              has_submit_priv: resp.results.has_submit_priv,
              has_publish_priv: resp.results.has_publish_priv,
              has_admin_priv: resp.results.has_admin_priv
              });

              ingest_api_allowable_edit_states_statusless(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                .then((resp) => {
                  // 
                  this.setState({has_version_priv: resp.results.has_write_priv});
                })
                .catch((err) => {
                  
                });   
          }
          
        });

       
      }else{
      //
      }

    ingest_api_users_groups(auth)
      .then((res) => {
        
        const groups = res.results.filter(
          g => g.data_provider === true
        );
        
        this.setState({
          groups: groups,
          groups_dataprovider: groups,
        },() => {
          
        });
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          this.props.reportError(err);
          // Rather than reload here, let's have a modal or such
          localStorage.setItem("isAuthenticated", false);
        }else if(err.status){
          localStorage.setItem("isAuthenticated", false);
        }
      });

    // Sets up the Entity's info  if we're not new here
    if (this.props.editingDataset && !this.props.newForm) {      
      try {
        // use only the first direct ancestor
         this.setState({
          source_uuids: this.props.editingDataset.direct_ancestors
        });
      } catch {
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
          lab_dataset_id: this.props.editingDataset.lab_dataset_id,
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
          entity_api_get_globus_url(this.props.editingDataset.uuid, this.state.groupsToken)
            .then((res) => {
              
              this.setState({
                globus_path: res.results,
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
        //
      }
      this.setState({
        selected_dt: selected,
      })


        // Sets the Hubmap ID labels for Previous and Next version Buttons  
        if(this.props.editingDataset.next_revision_uuid){
          console.debug("next_revision_uuid",this.props.editingDataset.next_revision_uuid);
          entity_api_get_entity(this.props.editingDataset.next_revision_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((response) => {
            if(response.hubmap_id){
              this.setState({nextHID: response.results.hubmap_id})
            }else{
              console.debug("next_revision_uuid",response);
            }
          })
          .catch((error) => {
            console.debug("next_revision_uuid",error);
            this.props.reportError(error);
          })   
        }
        if(this.props.editingDataset.previous_revision_uuid){
          console.debug("prev_revision_uuid",this.props.editingDataset.previous_revision_uuid);
          entity_api_get_entity(this.props.editingDataset.previous_revision_uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((response) => {
            this.setState({prevHID: response.results.hubmap_id})
          })
          .catch((error) => {
            console.debug("porev",error);
            this.props.reportError(error);
          })   
        }
    
    }
  }

  setAssayLists(){
    ubkg_api_get_assay_type_set()
    .then((res) => {
      
      this.setState({
        dtl_all: res.data.result.map((value, index) => { return value.name })
      });
    })
    .catch((err) => {
      
    })
    ubkg_api_get_assay_type_set("primary")
    .then((res) => {
      
      this.setState({
        dtl_primary: res.data.result.map((value, index) => { return value.name })
      });
    })
    .catch((err) => {
      
    })
  }


  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
  }

  showModal = () => {
    this.setState({ show: true });
  };

  showSubmitModal = () => {
    this.setState({ showSubmitModal: true });
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
  hideSubmitModal = () => {
    this.setState({
      showSubmitModal: false
    });
  };

  handleLookUpClick = () => {
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
    this.setState({
      LookUpShow: false
    });
  };

  cancelLookUpModal = () => {
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
    switch (name) {
      case "lab_dataset_id":
        this.setState({
          lab_dataset_id: value,
        });
        break;
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
      case "other_dt":
        
        this.setState({ other_dt: value });
        break;
      case "dt_select":
        
        var data_types = [];  
        data_types.push(value);
        // data_types.push(value);
        this.setState({
          has_other_datatype: false,
          data_types: data_types,
          selected_dt: value,
        });
        
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
        if (value === "other") {
          this.setState({
            data_types: data_types,
            has_other_datatype: value === "other",
          });
      
        } else {
          this.setState({
            has_other_datatype: false,
            selected_dt: value,
          });

        }
      
      }
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
      });
    }else{
     //
    }
  };

  sourceRemover = (row) => {
    var slist=this.state.source_uuid_list;
    slist =  slist.filter(source => source.uuid !== row.uuid)
      this.setState( {
        source_uuid_list: slist,
        slist: slist,
      } ,() => {
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

  handleNewVersion = () => {
    this.setState({
      newVersion:true
    });
    this.handleSubmit("newversion");
  };

  handleVersionNavigate = (direction) => {
    
    // @TODO Better process standardizing route navigation between forms 
    if(direction==='next'){
      window.history.pushState( null,"", "/dataset/"+this.props.editingDataset.next_revision_uuid);
    }else{
      window.history.pushState( null,"", "/dataset/"+this.props.editingDataset.previous_revision_uuid);
    }
    window.location.reload()
  }

  handleAddNewCollection = () => {
    this.setState({
      AddCollectionShow: true,
    });
  };

  handleClickOutside = (e) => {
    this.setState({
      showCollectionsDropDown: false,
    });
  };


  handleCancel = () => {
    if(this.props && this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  }

  handleReprocess = () => {
    this.setState({ 
      submit_error: true, 
      submitting: false, 
      submitErrorResponse:"Reprocessing feature not implemented",
      buttonSpinnerTarget:""} ,
      () => {
       
      });
    // Alert()
  }

  handleButtonClick = (i, event) => {
    if(event){
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

  handleDatasetSelect = (e) => {
    
    e.preventDefault();
    // @TODO Better process standardizing route navigation between forms 
    window.history.pushState( null,"", "/upload/"+this.props.editingDataset.upload.uuid);
    window.location.reload()
  }

  

  handleSubmit = (submitIntention) => {

    this.validateForm().then((isValid) => {
    
      if (isValid) {
        if (
          (!this.props.editingDataset || 
            this.props.editingDataset.length<=0||
            !this.props.editingDataset.uuid) &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
          this.setState({ GroupSelectShow: true });
        } else {

          this.setState({
            GroupSelectShow: false,
            submitting: true,
          });
          const state_data_types = this.state.data_types;
          let data_types = [...state_data_types];
          if (this.state.other_dt !== undefined && this.state.other_dt !== "") {
            data_types = [
              ...data_types,
              this.state.other_dt.replace(/'/g, "\\'"),
            ];
          }

          // Can't stringify a set within json
          var dataTypeArray = Array.from(this.state.data_types);
          
          // package the data up
          let data = {
            lab_dataset_id: this.state.lab_dataset_id,
            contains_human_genetic_sequences: this.state.contains_human_genetic_sequences,
            data_types: dataTypeArray,
            description: this.state.description,
            dataset_info: this.state.dataset_info,
          };
          
          
  
          // get the Source ancestor
          if (this.state.source_uuid_list && this.state.source_uuid_list.length > 0) {
            let direct_ancestor_uuid = this.state.source_uuid_list.map((su) => {
                          return su.uuid || su.source_uuid;
            });
            if (direct_ancestor_uuid) {
              data["direct_ancestor_uuids"] = direct_ancestor_uuid;
            }
          }
          const config = {
            headers: {
              Authorization:
                "Bearer " +
                JSON.parse(localStorage.getItem("info")).groups_token
            },
          };


          if (this.props.editingDataset && !this.props.newForm) {
            // If we';re making a new Version
            if (submitIntention === "newversion") {
              
              // @TODO: Basically repeates what's in the Create fucntionality, 
              // and the previous_revision_uuid is added  
              data.previous_revision_uuid = this.props.editingDataset.uuid;

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
                }
            
                 ingest_api_create_dataset(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((response) => {
                    if (response.status < 300) {
                     //
                       this.setState({
                          display_doi: response.results.display_doi,
                        });

                      entity_api_get_globus_url(response.results.uuid, this.state.groupsToken)
                      .then((res) => {
                        this.setState({
                          globus_path: res.results,
                        }, () => {
                          this.props.onCreated({entity: response.results, globus_path: res.results}); // set as an entity for the Results
                          this.onChangeGlobusURL(response.results, res.results);
                        });
                      })
                      .catch((err) => {
                        //
                        if (err.response && err.response.status === 401) {
                          localStorage.setItem("isAuthenticated", false);
                        }
                      });
                    } else {
                      this.setState({ 
                        submit_error: true, 
                        submitting: false, 
                        submitErrorResponse:response.results.data.error,
                        buttonSpinnerTarget:""} ,
                        () => {
                         
                        });
                     
                    }
                  
                })
                .catch((err) => {
                  this.setState({ submit_error: true, submitting: false, submitErrorResponse:err, buttonSpinnerTarget:"" } ,
                    () => {
                     //
                    });
                });
            }
            // if user selected Publish
            else if (submitIntention === "published") { // From State? 
                ingest_api_dataset_publish(this.props.editingDataset.uuid, this.JSON.stringify(data),  config)
                .then((res) => {
                  this.props.onUpdated(res.data);
                })
                .catch((error) => {
                  this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"", });
                });
            } else if (submitIntention === "submit") {
              this.setState({submit_error: true}, () => {
                var dataSubmit = {
                  "status": "Submitted"
                }
                // Dnt actually submit till we confrm in the modal.
                entity_api_update_entity(this.props.editingDataset.uuid, JSON.stringify(dataSubmit), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                    if (response.status < 300) {
                      this.setState({ 
                        submit_error: false, 
                        submitting: false, 
                        });
                      this.props.onUpdated(response.results);
                    } else {

                      var submitErrorResponse="Uncaptured Error";
                      if(response.err && response.err.response.data ){
                        submitErrorResponse = response.err.response.data 
                      }
                      if(response.error && response.error.response.data ){
                        submitErrorResponse = response.error.response.data 
                      }
                      if(typeof response === "string"){
                        submitErrorResponse = response;
                      }
                      this.setState({ 
                        showSubmitModal:false,
                        submit_error: true, 
                        submitting: false, 
                        submitErrorResponse:submitErrorResponse,
                        buttonSpinnerTarget:"" }, () => {
                          this.props.reportError();
                        });
                    }
                }) 
                .catch((error) => {
                  this.props.reportError(error);
                  this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"" });
                });
              })

            }else if (submitIntention === "processing") {
              this.setState({submit_error: false}, () => {
                // Dnt actually submit till we confrm in the modal.
              })
                ingest_api_dataset_submit(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((response) => {
                    if (response.status < 300) {
                      this.props.onUpdated(response.results);
                    } else { // @TODO: Update on the API's end to hand us a Real error back, not an error wrapped in a 200 
                      var statusText = "";
                      console.debug("err", response, response.error);
                      if(response.err){
                        statusText = response.err.response.statkus+" "+response.err.response.statusText;
                      }else if(response.error){
                        statusText = response.error.response.status+" "+response.error.response.statusText;
                      }
                      var submitErrorResponse="Uncaptured Error";
                      if(response.err && response.err.response.data ){
                        submitErrorResponse = response.err.response.data 
                      }
                      if(response.error && response.error.response.data ){
                        submitErrorResponse = response.error.response.data 
                      }
                      this.setState({ 
                        submit_error: true, 
                        submitting: false,
                        buttonSpinnerTarget:"", 
                        submitErrorStatus:statusText,
                        submitErrorResponse:submitErrorResponse ,
                      });
                    }
                })
                .catch((error) => {
                    this.props.reportError(error);
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
                          this.props.onUpdated(response.results);
                        } else {
                          this.setState({ 
                            submit_error: true, 
                            submitting: false, 
                            submitErrorResponse:response.results.statusText,
                            buttonSpinnerTarget:"" });
                        }
              }) 
              .catch((error) => {
                this.props.reportError(error);
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
              }

               ingest_api_create_dataset(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status < 300) {
                   //
                     this.setState({
                        display_doi: response.results.display_doi,
                      });
                    entity_api_get_globus_url(response.results.uuid, this.state.groupsToken)
                    .then((res) => {
                      
                      this.setState({
                        globus_path: res.results,
                      }, () => {
                       
                        this.props.onCreated({entity: response.results, globus_path: res.results}); // set as an entity for the Results
                        this.onChangeGlobusURL(response.results, res.results);
                      });
                    })
                    .catch((err) => {
                      if (err.response && err.response.status === 401) {
                        localStorage.setItem("isAuthenticated", false);
                        window.location.reload();
                      }
                    });
                  } else {
                    this.setState({ 
                      submit_error: true, 
                      submitting: false, 
                      submitErrorResponse:response.results.data.error,
                      buttonSpinnerTarget:""} ,
                      () => {
                       //
                      });
                   
                  }
                
              })
              .catch((err) => {
                this.setState({ submit_error: true, submitting: false, submitErrorResponse:err, buttonSpinnerTarget:"" } ,
                  () => {
                   //
                  });
              });
          }  
        }
      }else{
        //
        this.setState({ 
          submit_error: true, 
          submitting: false, 
          buttonSpinnerTarget:""
          // submitErrorStatus:"There was a problem handling your form, and it is currently in an invalid state. Please review the marked items and try again." 
        });
        // Alert("There was a problem handling your form. Please review the marked items and try again.");
      }
    })
    .catch((err) => {
      console.debug("validateForm err", err);
      this.setState({ submit_error: true, submitting: false, submitErrorResponse:err, buttonSpinnerTarget:"" } ,
        () => {
         //
        });
    }); 
  }

  validateForm() {
    console.debug("validateForm");
    return new Promise((resolve, reject) => {
      
      let isValid = true;
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
      }
      console.debug("validateForm 2", isValid);
      
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
      }
      resolve(isValid);
    });
  }

  assembleSourceAncestorData(source_uuids){
    for (var i = 0; i < source_uuids.length; i++) {
      var dst = generateDisplaySubtype(source_uuids[i]);
      source_uuids[i].display_subtype=dst;
    }
  try {
    return source_uuids
  } catch {
   //
  }
 
}

  // only handles one selection at this time
  getSourceAncestor(source_uuids){
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
     //
    }
    return ""
  }


  // only handles one selection at this time
  getSourceAncestorTypes(type){
    // Give it the type we're looking for
    var ancestorTypes = this.props.editingDataset.direct_ancestors.map((ancestor) => ancestor.entity_type);
    // 
    return ancestorTypes.includes(type)
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    try {
      return source_uuids[0];  // just get the first one
    } catch {
     //
    }
    return ""
  }

  //note: this code assumes that source_uuids is a sorted list or a single value
  generateDisplaySourceId(source_uuids) {
    //check if the source_uuids represents a list or a single value
    if (source_uuids.length > 1) {
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

  renderButtonOverlay(){
    return ( // @TODO: Improved form-bottom Control Overlay?
      <></>
    )
  }

  renderButtons() {

    /* The Buttons:
     {this.reprocessButton()}
     {this.cancelButton()}
     {this.aButton("submit", "Submit"))}
     {this.aButton("published", "Publish")} 
     {this.aButton("reopened", "Reopen")}
     {this.aButton("unpublished", "UnPublish")}
     {this.aButton("hold", "Hold")}
    */

// @TODO Let's maybe wrap the buttons in checks vs Building a button set for each possible state?
// & also Drop the "aButton" factory, and just use the button component directly

    // console.debug("CheckOne",this.state.has_admin_priv === true && this.state.assay_type_primary === false
      // && this.state.previous_revision_uuid === undefined 
      // && this.state.status.toUpperCase() === "PUBLISHED");
      console.table([this.state.has_admin_priv, this.state.assay_type_primary, this.state.previous_revision_uuid, this.state.status]);

    if (this.state.has_admin_priv === true 
            && (!this.state.previous_revision_uuid || this.state.previous_revision_uuid === undefined )
            && this.state.status.toUpperCase() === "PUBLISHED") {
         return (
           <div className="buttonWrapRight">
                {this.reprocessButton()}
                {this.cancelButton()}
            </div>
          )
    }
    
    
    // console.debug("CheckTwo",this.state.writeable === false && this.state.has_version_priv === false);
    if (this.state.writeable === false ){            
      return (
            <div className="buttonWrapRight">
                {this.cancelButton()} 
            </div>
          )
    } else {
    // console.debug("CheckThree",["NEW", "INVALID", "REOPENED", "ERROR"].includes( this.state.status.toUpperCase()));
    // console.debug("CheckFour",this.state.has_submit_priv,this.state.writeable && !this.props.newForm && this.state.status.toUpperCase() === "NEW" );
      if (["NEW", "INVALID", "REOPENED", "ERROR"].includes( 
              this.state.status.toUpperCase())) {
        return (
            <div className="buttonWrapRight">
                {this.aButton(this.state.status.toLowerCase(), "Save")}
                {this.state.has_submit_priv && (
                  this.aButton("processing", "Process"))
                }
                {this.state.writeable && !this.props.newForm && this.state.status.toUpperCase() === "NEW" &&(
                    <div>
                      <Button 
                        className="btn btn-primary mr-1" 
                        variant="contained"
                        onClick={ () => this.showSubmitModal() }>
                          Submit
                      </Button>
                    </div>
                )}
                {/* {this.state.has_write_priv && this.state.status.toUpperCase() === "NEW" && (
                  this.aButton("submit", "Submit"))
                } */}
                {this.cancelButton()}
            </div>
          )
      }
      // console.debug("CheckFive",this.state.status.toUpperCase() === 'UNPUBLISHED' && this.state.has_publish_priv);
      if (this.state.status.toUpperCase() === 'UNPUBLISHED' && this.state.has_publish_priv) {
        return (
            <div className="buttonWrapRight">
                {this.aButton("published", "Publish")}
                {this.cancelButton()}
            </div>
          )
      }   
      if (this.state.status.toUpperCase() === 'PUBLISHED' ) {
        return (
            <div className="buttonWrapRight">
                {this.renderNewVersionButtons()}
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
                {/* {this.state.has_publish_priv && (this.aButton("published", "Publish"))} */}
                {this.aButton(this.state.status.toLowerCase(), "Save")}
                {this.cancelButton()}
            </div>
          )
      }   
      else{
        <div className="buttonWrapRight">
          {this.cancelButton()}
        </div>
      }   
    }
  }

  renderSubmitModal = () => {
  
      return (
          <Dialog aria-labelledby="submit-dialog" open={this.state.showSubmitModal}>
            <DialogContent>
              <h4>Preparing to Submit</h4>
              <div>  Has all data for this dataset been <br/>
                1	&#41; validated locally, and  <br/>
                2	&#41; uploaded to the globus folder?</div>
           </DialogContent>
             <DialogActions>
              <Button
              className="btn btn-primary mr-1"
              onClick={ () => this.handleSubmit("submit")}>
              Submit
            </Button>
            <Button
              className="btn btn-secondary"
              onClick={this.hideSubmitModal}>
              Cancel
            </Button>          
            </DialogActions>
          </Dialog>
      
      );
    }
  

  renderNewVersionButtons() {
    /*the entity pointed to for at least one dataset.direct_ancestory_uuids is of type sample (ancestor.entity_type == 'Source')
    dataset.status == 'Published'
    user has write access for the dataset.group_uuid/group_name
    dataset.next_revision_uuid is null (or missing altogether)*/
  
    var sampleSource = this.getSourceAncestorTypes("Sample");  
    var datasetStatus = this.props.editingDataset.status === "Published";
    var writability = this.state.has_version_priv;
    var latestVersion = (!this.props.editingDataset.next_revision_uuid  ||  this.props.editingDataset.next_revision_uuid === undefined);
    if(sampleSource && datasetStatus && writability && latestVersion){
    // if(true===true){
      return (
        <Button variant="contained" sx={{minWidth:"130px"}} onClick={() => this.handleNewVersion()}> 
          {this.state.submitting && (
            <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {!this.state.submitting && "New Version"}         
        </Button> )
    } 
  }



  renderVersionNav() {
    var next = "";
    var prev = "";
    return (
      <Box sx={{width:"50%"}}>
        {this.props.editingDataset.next_revision_uuid  && (
          <>Next Version: <Button variant="text" onClick={() => this.handleVersionNavigate('next')}>   {this.state.nextHID}</Button></>
        )}
        {this.props.editingDataset.previous_revision_uuid  && (
          <>Previous Version: <Button variant="text" onClick={() => this.handleVersionNavigate('prev')}>{this.state.prevHID}</Button></>
        )}
      </Box>
    )}

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
    return (<React.Fragment>
      <div >
        <Button
          type='button'
          name={"button-" + which_button}
          variant="contained"
          disabled={this.state.submitting}
          onClick={ 
            (e) => {
                this.setState({ 
                  buttonSpinnerTarget:which_button.toLowerCase()
                },() => {  
                  //
                })
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
    return (<React.Fragment>
      <div >
        <Button
          variant="contained"
          type='button'
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

  onChangeGlobusLink(newLink, newDataset) {
    
    const {name, display_doi, doi} = newDataset;
    this.setState({
      
      globus_url: newLink,
       name: name, 
       display_doi: display_doi, 
       doi: doi, 
       createSuccess: true});
  }


  onChangeGlobusURL() {
    // REMEMBER the props from the new wrapper / Forms
    // Differs from Main wrapper
    
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

  isAssayCheckSet(assay) {
    ////
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
    if(this.props.dtl_status || this.props.newForm) { // true = primary dt, set options to primary
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
      var dtlistLen = this.state.dataTypeDropdown.length;
      if(this.props.newForm){
        dtlistLen = this.props.dtl_primary.length;
      }
      if(this.props.editingDataset && this.props.editingDataset.data_types) {
        len = this.props.editingDataset.data_types.length;
      }else{
        //console.debug("no editingDataset");
      }

       if (len > 1) {
        return (<>
          <ul>
            {this.renderMultipleAssays()}
          </ul>

          </>)
      }else{ 
       
  	    return (<>
  		    <Select 
            native
            name="dt_select"
            className="form-select" 
            disabled={ (!this.state.writeable || !this.state.assay_type_primary) || this.state.disableSelectDatatype }
            value={this.state.selected_dt} 
            id="dt_select" 
            onChange={this.handleInputChange}>
            <option></option>
            {this.renderAssayColumn(0, dtlistLen)}
          </Select>
          </> )
   
      }    
    }
   
  assay_contains_pii(assay) {
    let assay_val = [...assay.values()][0]   // only one assay can now be selected, the Set() is older code
    for (let i in this.props.dataTypeList) {
      let e = this.props.dataTypeList[i]
      if (e['name'] === assay_val) {
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
              </strong>
            </p> 


         
          </div>
          <div className='col-md-6'>
          
          
            
          <Alert severity="error" className='alert alert-danger' role='alert'>
          <FontAwesomeIcon icon={faUserShield} /> - Do not upload any
          data containing any of the{" "}
          <span
            style={{ cursor: "pointer" }}
            className='text-primary'
            onClick={this.showModal}
          >
            18 identifiers specified by HIPAA
          </span>
        </Alert>
        

        {this.renderVersionNav()}

        



      {this.props.editingDataset && this.props.editingDataset.upload && this.props.editingDataset.upload.uuid  && (
        <Box sx={{ display: 'flex'}} >
          <Box  sx={{ width:"100%" }}><strong>This Dataset is contained in the data Upload </strong> 
            <Button 
              variant="text"
              onClick={this.handleDatasetSelect}>  
              {this.props.editingDataset.upload.hubmap_id}
            </Button>
          </Box>
        </Box>
    )}
      
        

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
                          onChange={this.handleInputChange}
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
                          onChange={this.handleInputChange}
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
                  {this.errorClass(this.state.formErrors.contains_human_genetic_sequences) && (
                        <Alert severity="error">
                          {this.state.formErrors.contains_human_genetic_sequences}
                        </Alert>
                    )}
                
                </div>

            </div>
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
                      Details:  <strong>{this.state.submitErrorStatus} </strong> {this.state.submitErrorResponse}
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
      {this.renderSubmitModal()}
      </React.Fragment>
    );
  }
}

export default DatasetEdit;