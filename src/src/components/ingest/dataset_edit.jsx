import {faPlus,faQuestionCircle,faSpinner,faTrash,faUserShield} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
// import Dialog from '@material-ui/core/Dialog';
// import DialogActions from '@material-ui/core/DialogActions';
// import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Dialog from '@mui/material/Dialog';
import Paper from '@material-ui/core/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import Collapse from '@mui/material/Collapse';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import React,{Component} from "react";
import ReactTooltip from "react-tooltip";
import '../../App.css';
import HIPPA from "../uuid/HIPPA.jsx";

import {faExternalLinkAlt} from "@fortawesome/free-solid-svg-icons";
import {entity_api_get_entity,entity_api_get_globus_url,entity_api_update_entity} from '../../service/entity_api';
import {
  ingest_api_allowable_edit_states,
  ingest_api_allowable_edit_states_statusless,
  ingest_api_create_dataset,
  ingest_api_dataset_publish,
  ingest_api_dataset_submit,
  ingest_api_notify_slack,
  ingest_api_users_groups,
  ingest_api_pipeline_test_privs
} from '../../service/ingest_api';
import {ubkg_api_generate_display_subtype} from "../../service/ubkg_api";
import {getPublishStatusColor} from "../../utils/badgeClasses";
import {RevertFeature} from "../../utils/revertModal";
import {VersionNavigation} from "../../utils/ui_elements";
import {validateRequired} from "../../utils/validators";
import SearchComponent from "../search/SearchComponent";
import GroupModal from "../uuid/groupModal";
import Modal from "../uuid/modal";

import {Typography} from "@material-ui/core";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import {Alert,AlertTitle} from '@material-ui/lab';


class DatasetEdit extends Component {
  state = {
    newForm:this.props.newForm,
    // The Entity Itself
    // Lets just give it the whole entity to reff from the prop
    // Remember this come time to clean up tech debt / refactor
    contains_human_genetic_sequences:this.props.editingDataset ? this.props.editingDataset.contains_human_genetic_sequences : undefined,
    editingDatasetProp:this.props.editingDataset ? this.props.editingDataset : {},
    dataset_type:this.props.editingDataset ? this.props.editingDataset.dataset_type : "",
    dtl_primary:[],
    dtl_all:[],
    dataset_info:"",
    description:"",
    dataTypeDropdown:[],
    display_doi:"",
    editingSource:[],
    // globus_path: "",
    source_uuid_list:[],
    source_uuid_type:"",
    source_uuid:undefined,
    source_uuids:[],
    status:"NEW",
    upload:[],
    writeable:true,
    // editingSourceIndex:0,  
    // name: "",

    // Admin task assignment
		allGroups:this.props.allGroups ? this.props.allGroups : {},
    assigned_to_group_name:"",
    ingest_task:"", 

    // User Privs & Info
    groups:[],
    has_admin_priv:false,
    has_submit_priv:false,
    has_publish_priv:false,
    has_version_priv:false,
    has_manual_priv:false,
    has_pipeline_testing_priv:false,
    groupsToken:"",

    // Data that sets the scene
    assay_type_primary:true,
    data_type_dicts:this.props.dataTypeList,
    slist:[], 

    // Page States 
    showSubmitModal:false,
    showRevertModal:false,
    badge_class:"badge-purple",
    groups_dataprovider:[],
    GroupSelectShow:false,
    lookUpCancelled:false,
    LookUpShow:false,
    other_dt:"",
    buttonSpinnerTarget:"",
    errorSnack:false,
    popperOpen:false,
    anchorEl:null,
    submitLoader:false,
    disableSelectDatatype:false,
    toggleStatusSet:false,
    statusSetLabel:"Reset Status",
    newStatus:"",
    // Form Validation & processing
    newVersion:false,
    previousHID:undefined,
    nextHID:undefined,
    loadingPreviousVersions:true,
    loadingNextVersions:true,
    versioned:false,
    previous_revision_uuid:undefined,
    has_other_datatype:false,
    submitErrorResponse:"",
    submitErrorStatus:"",
    isValidData:true,
    previousHubIDs:[],
    nextHubIDs:[],
    formErrors:{
      contains_human_genetic_sequences:"",
      dataset_type:"",
      lab_dataset_id:"",
      other_dt:"",
      source_uuid_list:"",
      source_uuid:"",
    },
  };

    
    componentDidMount() {
      var permChecks = [this.state.has_admin_priv,this.state.has_submit_priv,this.state.writeable,this.state.status.toUpperCase(),this.props.newForm]
      if(this.props.editingDataset && this.props.editingDataset.assigned_to_group_name){
        // console.debug('%c⊙ assigned_to_group_name', 'color:#00ff7b', this.props.editingDataset.assigned_to_group_name );
        this.setState({assigned_to_group_name:this.props.editingDataset.assigned_to_group_name})
      }
      if(this.props.editingDataset && this.props.editingDataset.ingest_task){
        // console.debug('%c⊙ ingest_task', 'color:#00ff7b', this.props.editingDataset.ingest_task );
        this.setState({ingest_task:this.props.editingDataset.ingest_task})
      }

      // Checking Permissions for Pipeline Testing
      ingest_api_pipeline_test_privs(JSON.parse(localStorage.getItem("info")).groups_token)
        .then((res) => {
          if(res.status >= 200  && res.status < 301){
            this.setState({has_pipeline_testing_priv:res.results.has_pipeline_test_privs});          }
        })
        .catch((err) => {
          if (err.response && err.response.status === 401) {
            this.props.reportError(err);
            localStorage.setItem("isAuthenticated", false);
          }else if(err.status){
            localStorage.setItem("isAuthenticated", false);
          }
        });

      // @TODO: Better way to listen for off-clicking a modal, seems to trigger rerender of entire page
      // Modal state as flag for add/remove? 
      document.addEventListener("click", this.handleClickOutside);
      // this.setAssayLists();
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
        const config = {headers:{Authorization:"Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
            "Content-Type":"application/json",},};
      }else{
        localStorage.setItem("isAuthenticated", false);
      }

   

      // Figure out our permissions
      if (this.props.editingDataset) {
        // console.debug("DatasetEdit: componentDidMount: editingDataset: " + this.props.editingDataset.uuid);
        if(!this.props.editingDataset.previous_revision_uuids){
          this.setState({loadingPreviousVersions:false});
        }
        if(!this.props.editingDataset.next_revision_uuids){
          this.setState({loadingNextVersions:false});
        }
        if (this.props.editingDataset.uuid)
        // check to see which buttons to enable
        ingest_api_allowable_edit_states(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
          .then((resp) => {
          if (resp.status < 300) {
            console.debug("Perms",resp.results);
            this.setState({
              writeable:resp.results.has_write_priv,
              has_write_priv:resp.results.has_write_priv,
              has_submit_priv:resp.results.has_submit_priv,
              has_publish_priv:resp.results.has_publish_priv,
              has_admin_priv:resp.results.has_admin_priv
              });

              ingest_api_allowable_edit_states_statusless(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
                .then((resp) => {
                  // 
                  console.debug("Perms SL",resp.results);
                  this.setState({has_version_priv:resp.results.has_write_priv});
                  if(this.state.has_admin_priv && (
                    this.state.status.toUpperCase()==="ERROR" || 
                    this.state.status.toUpperCase()==="INVALID")){
                    this.setState({has_manual_priv:true});
                  }
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
        
        this.setState({groups:groups,
          groups_dataprovider:groups,},() => {
          
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
        this.setState({source_uuid_list: this.assembleSourceAncestorData(this.props.editingDataset.direct_ancestors)});  
      } catch(error) {
        console.debug('%c⭗ ancestorList', 'color:#ff005d', error );
      }

      if(this.props.editingDataset ==='' || !this.props.editingDataset ){
        console.debug("EDITINGDATASET UNDEFINED");
        savedGeneticsStatus = undefined;
      }else{
        console.debug("EDITING DATASET FOUND", this.props.editingDataset);
        savedGeneticsStatus = this.props.editingDataset.contains_human_genetic_sequences;
      }

      var ancestorList = []
      if(this.props.editingDataset.direct_ancestors){
        console.debug('%c⊙ direct_ancestors', 'color:#5900FF', this.props.editingDataset.direct_ancestors );
        // Might have to assemble here for promise reasons?
        // ancestorList = this.assembleSourceAncestorData(this.props.editingDataset.direct_ancestors);
        this.assembleSourceAncestorData(this.props.editingDataset.direct_ancestors)
      }
      // var sourceList = this.assembleSourceAncestorData(this.props.editingDataset.direct_ancestors);
      this.setState(
        {
          status:this.props.editingDataset.hasOwnProperty('status') ? this.props.editingDataset.status.toUpperCase() : "NEW",
          display_doi:this.props.editingDataset.hubmap_id,
          lab_dataset_id:this.props.editingDataset.lab_dataset_id,
          source_uuid:this.getSourceAncestor(this.props.editingDataset.direct_ancestors),
          // source_uuid_list:sourceList,
          source_entity:this.getSourceAncestorEntity(this.props.editingDataset.direct_ancestors), // Seems like it gets the multiples. Multiple are stored here anyways during selection/editing
          slist:this.getSourceAncestorEntity(this.props.editingDataset.direct_ancestors),
          contains_human_genetic_sequences:savedGeneticsStatus,
          description:this.props.editingDataset.description,
          dataset_info:this.props.editingDataset.dataset_info,
          previous_revision_uuid:this.props.editingDataset.hasOwnProperty('previous_revision_uuid') ? this.props.editingDataset.previous_revision_uuid : undefined,
          errorMsgShow:this.props.editingDataset.status.toLowerCase() ===
              "error" && this.props.editingDataset.message
              ? true
              : false,
          statusErrorMsg:this.props.editingDataset.message,
        },
        () => {
          this.setState({badge_class:getPublishStatusColor(this.state.status.toUpperCase()),});
          entity_api_get_globus_url(this.props.editingDataset.uuid, this.state.groupsToken)
            .then((res) => {
              
              this.setState({globus_path:res.results,});
            })
            .catch((err) => {
              this.setState({globus_path:"",
                globus_path_tips:"Globus URL Unavailable",});
              if (err.response && err.response.status === 401) {
                localStorage.setItem("isAuthenticated", false);
                window.location.reload();
              }
            });
        }
      );

      this.setState({
        dataset_type:this.props.editingDataset.dataset_type,
        dataTypeDropdown:this.props.dtl_all
      })


      //  NEXT/PREV REVISION LIST BUILD
      if(this.props.editingDataset && this.props.editingDataset.previous_revision_uuids && this.props.editingDataset.previous_revision_uuids.length >0){
        this.setState({versioned:true});
        var pHubIDs= [];
        this.props.editingDataset.previous_revision_uuids.forEach(function(uuid, index) {
          entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
            .then((response) => {
              if(response.results.hubmap_id){
                pHubIDs.push({
                  type: response.results.entity_type, 
                  hubmapID: response.results.hubmap_id
                })
              }else{
                pHubIDs.push(uuid)
              }
            })
            .catch((error) => {
              pHubIDs.push(uuid)
              console.debug("UUIDCheck",error);
              this.props.reportError(error);
            })
        });
        this.setState({
          previousHubIDs:pHubIDs
        },() => {
          this.setState({loadingPreviousVersions:false});
        })
      }
      // NEXT
      if(this.props.editingDataset && this.props.editingDataset.next_revision_uuids && this.props.editingDataset.next_revision_uuids.length >0){
        this.setState({versioned:true});
        var nHubIDs= [];
        this.props.editingDataset.next_revision_uuids.forEach(function(uuid, index) {
          entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
            .then((response) => {
              if(response.results.hubmap_id){
                nHubIDs.push({
                  type: response.results.entity_type, 
                  hubmapID: response.results.hubmap_id
                })
              }else{
                nHubIDs.push(uuid)
              }
            })
            .catch((error) => {
              console.debug("UUIDCheck",error);
              this.props.reportError(error);
              nHubIDs.push(uuid)
            })
        });
        this.setState({
          nextHubIDs:nHubIDs
        },() => {
          this.setState({loadingNextVersions:false});
        })
      }
    }
  }

  uncapError(response){

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
      submit_error:true, 
      submitting:false, 
      submitErrorResponse:submitErrorResponse,
      buttonSpinnerTarget:"" 
}, () => {
        this.props.reportError();
      });
  }


  componentWillUnmount() {
    document.removeEventListener("click", this.handleClickOutside, true);
  }

  showModal = () => {
    this.setState({ show:true });
  };

  launchSubmitModal = () => {
    this.setState({ showSubmitModal:true });
  };

  hideModal = () => {
    console.debug('%c⊙ Hiding Modal', 'color:#00ff7b' );
    this.setState({ 
      GroupSelectShow:false,
      buttonSpinnerTarget:""
     });
  };
  hideRevertModal = () => {
    this.setState({ showRevertModal:false});
  };

  showErrorMsgModal = (msg) => {
    this.setState({ errorMsgShow:true, statusErrorMsg:msg });
  };

  hideErrorMsgModal = () => {
    this.setState({ errorMsgShow:false });
  };

  showConfirmDialog(row,index) {
    this.setState({ 
        confirmDialog:true,
        editingSource:row,
        editingSourceIndex:index
    });
  };

  hideConfirmDialog = () => {
    this.setState({confirmDialog:false ,
        editingSource:[]});
  };

  
  toggleStatSetView = () => {
    this.setState(prevState => ({statusSetLabel:prevState.statusSetLabel === "Reset Status" ? "Cancel" : "Reset Status",
      toggleStatusSet:!prevState.toggleStatusSet}));
  };



  hideGroupSelectModal = () => {
    this.setState({GroupSelectShow:false});
  };
  hideSubmitModal = () => {
    this.setState({showSubmitModal:false});
  };  
  
  handleLookUpClick = () => {
    if (!this.state.lookUpCancelled) {
      this.setState({LookUpShow:true});
    }
     this.setState({lookUpCancelled:false});
  };

  hideLookUpModal = () => {
    this.setState({LookUpShow:false});
  };

  cancelLookUpModal = () => {
    this.setState({LookUpShow:false,
      lookUpCancelled:true});
  };

  handler = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (this.state.collection_candidates.length > 0) {
        this.setState({collection:this.state.collection_candidates[0],
          showCollectionsDropDown:false,});
      }
    }
  }; 

  handleInputChange = (e) => {
    const {id, name, value} = e.target;
    console.debug('%c⊙ handleInputChange', 'color:#00ff7b', id, value  );
      switch (name) {
      case "lab_dataset_id":
        this.setState({lab_dataset_id:value,});
        break;
      case "contains_human_genetic_sequences":  
        let gene_seq = undefined; 
        if (value === 'yes') {
          gene_seq = true;
        } else if(value === 'no'){
          gene_seq = false;
        }
        this.setState({contains_human_genetic_sequences:gene_seq,  // need to convert to a boolean
        });
        break;
      case "description":
        this.setState({description:value,});
        break;
      case "dataset_info":
        this.setState({dataset_info:value,});
      break;
      case "status":
        this.setState({new_status:value,});
        break;
      case "other_dt":
        this.setState({ other_dt:value });
        break;
      case "newStatus":
        this.setState({ newStatus:value });
        break;
      case "assigned_to_group_name":
        this.setState({ assigned_to_group_name:value });
        break;
      case "ingest_task":
        this.setState({ ingest_task:value });
        break;
      case "dt_select":
        this.setState({
          has_other_datatype:false,
          dataset_type:value,
          dataset_type:value,
        });
          break;
      case "groups":
        this.setState({selected_group:value});
        break;
      default:
        this.setState({name:value});
        break;
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
          collection:value,
          showCollectionsDropDown:true,
          collection_candidates:ret,
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
        this.setState({showCollectionsDropDown:false,});
        break;
      default:
        break;
    }
  };

  handlePopoverOpen = (event) => {
    console.debug('%c◉ handlePopoverOpen ', 'color:#ffe921', event.currentTarget);
    this.setState({showRevertModal:true});
    //setAnchorEl(event.currentTarget);
  };

  handlePopoverClose = () => {
    console.debug('%c◉ handlePopoverClose ', 'color:#ffe921');
    this.setState({
      popperOpen:false,
      anchorEl:null
    });
    // setAnchorEl(null);
  };


  handleCollectionClick = (collection) => {
    this.setState({collection:collection,
      showCollectionsDropDown:false,});
  };

  // this is used to handle the row selection from the SOURCE ID search (idSearchModal)
  handleSelectClick = (selection) => {
      if(this.state.selectedSource !== selection.row.uuid){
        this.setState({selectedSource:selection.row.uuid} ,() => {    
        var slist=this.state.source_uuid_list;
        slist.push(selection.row);
        this.setState({
          source_uuid:selection.row.hubmap_id, 
          source_uuid_list:slist,
          slist:slist,
          source_entity:selection.row,  // save the entire entity to use for information
          LookUpShow:false
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
      this.setState( {source_uuid_list:slist,
        slist:slist,} ,() => {
        // this.hideConfirmDialog();
      });
  }

  renderGroupAssignment = () => {
      return (
        <Select
          fullWidth
          labelid="group_label"
          id="assigned_to_group_name"
          name="assigned_to_group_name"
          label="Assigned to Group Name"
          value={this.state.assigned_to_group_name}
          onChange={(event) => this.handleInputChange(event)}>

          <MenuItem value=""></MenuItem>
          {this.props.allGroups.map((group, index) => {
            return (
              <MenuItem key={index + 1} value={Object.values(group)[0]}>
                {Object.values(group)[0]}
              </MenuItem>
            );
          })}
        </Select>
      )
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
          style={{ maxHeight:450 }}
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
                {this.state.writeable && (this.props.editingDataset.creation_action !== "Multi-Assay Split" && this.props.editingDataset.creation_action !=="Central Process") && (
                  <React.Fragment>
                    <FontAwesomeIcon
                      className='inline-icon interaction-icon '
                      icon={faTrash}
                      color="red"  
                      onClick={() => this.sourceRemover(row,index)}
                    />
                  </React.Fragment>
                  )}
                  {(!this.state.writeable || 
                    this.props.editingDataset.creation_action === "Multi-Assay Split" || 
                    this.props.editingDataset.creation_action ==="Central Process") && (
                  <small className="text-muted">N/A</small>
                  )}
                
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
        
                 
        {this.state.writeable && (this.props.editingDataset.creation_action !== "Multi-Assay Split" && this.props.editingDataset.creation_action !=="Central Process") && (
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
    )
}else if(this.state.writeable && this.state.editingDataset){

    }
    
  }

  handleNewVersion = () => {
    this.setState({newVersion:true});
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
    this.setState({AddCollectionShow:true,});
  };

  handleClickOutside = (e) => {
    this.setState({showCollectionsDropDown:false,});
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
      submit_error:true, 
      submitting:false, 
      submitErrorResponse:"Reprocessing feature not implemented",
      buttonSpinnerTarget:""
} ,
      () => {
       
      });
    // Alert()
  }

  handleButtonClick = (i, event) => {
    if(event){
    }

    this.setState({new_status:i,
      buttonState:{i:true}}, () => {
      this.handleSubmit(i);
    })
  };

  handleDatasetSelect = (e) => {
    
    e.preventDefault();
    // @TODO Better process standardizing route navigation between forms 
    window.history.pushState( null,"", "/upload/"+this.props.editingDataset.upload.uuid);
    window.location.reload()
  }

  handleStatusSet = (e) => {
    this.setState({submittingUpdate:true});
   var newStatus = this.state.newStatus;
    entity_api_update_entity(
      this.props.editingDataset.uuid, 
      {"status":newStatus}, 
      JSON.parse(localStorage.getItem("info")).groups_token)
    .then((response) => {
        if (response.status < 300) {
          this.setState({ 
            submit_error:false, 
            submitting:false, 
            submittingUpdate:false,
            });
          this.props.onUpdated(response.results);
        } else {
          this.setState({ 
            submit_error:true, 
            submitting:false, 
            submittingUpdate:false,
            submitErrorResponse:response.results.statusText
});
          }
    })
    .catch((error) => {
      this.setState({submit_error:true, 
        submitting:false,});
    });
  }

  handleSubmit = (submitIntention) => {
    this.setState({submitting:true});

    this.validateForm().then((isValid) => {
    
      if (isValid) {
        if ((!this.props.editingDataset || 
          this.props.editingDataset.length<=0||
          !this.props.editingDataset.uuid) &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
          this.setState({ GroupSelectShow:true });
        } else {
          this.setState({
            GroupSelectShow:false,
            submitting:true,
          });

          // const state_dataset_type = this.state.dataset_type;
          // let dataset_type = [...state_dataset_type];
          // if (this.state.other_dt !== undefined && this.state.other_dt !== "") {
          //   dataset_type = [
          //     ...dataset_type,
          //     this.state.other_dt.replace(/'/g, "\\'"),
          //   ];
          // }

          // Can't stringify a set within json
          // var dataTypeArray = Array.from(this.state.dataset_type);
          
          // package the data up
          // console.debug(this.state);
          let data = {
            lab_dataset_id:this.state.lab_dataset_id,
            contains_human_genetic_sequences:this.state.contains_human_genetic_sequences,
            // dataset_type:this.state.dataset_type, Added To Create Dataset function; change no longer supported in other entity operations
            description:this.state.description, 
            dataset_info:this.state.dataset_info
          };
          if(this.state.has_admin_priv){
            console.debug('%c⊙', 'color:#8b1fff', this.state.assigned_to_group_name, this.state.ingest_task );
            if (this.state.assigned_to_group_name && this.state.assigned_to_group_name.length > 0){
              data["assigned_to_group_name"]=this.state.assigned_to_group_name;
            }
            if (this.state.ingest_task && this.state.ingest_task.length > 0){
              data["ingest_task"]=this.state.ingest_task;
            }
          }
          console.debug('%c⭗ Data', 'color:#00ff7b',data  );
          
  
          // get the Source ancestor
          if (this.state.source_uuid_list && this.state.source_uuid_list.length > 0) {
            let direct_ancestor_uuid = this.state.source_uuid_list.map((su) => {
                          return su.uuid || su.source_uuid;
            });
            if (direct_ancestor_uuid && (this.props.editingDataset.creation_action !== "Multi-Assay Split" && this.props.editingDataset.creation_action !=="Central Process")) {
              data["direct_ancestor_uuids"] = direct_ancestor_uuid;
            }
          }
          const config = {headers:{Authorization:"Bearer " +
                JSON.parse(localStorage.getItem("info")).groups_token},};


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
                      this.setState({display_doi:response.results.display_doi,});
                      entity_api_get_globus_url(response.results.uuid, this.state.groupsToken)
                      .then((res) => {
                        this.setState({globus_path:res.results,}, () => {
                          this.props.onCreated({entity:response.results, globus_path:res.results}); // set as an entity for the Results
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
                        submit_error:true, 
                        submitting:false, 
                        submitErrorResponse:response.results.data.error,
                        buttonSpinnerTarget:""},
                        () => {});
                    }
                  
                })
                .catch((err) => {
                  this.setState({
                    submit_error:true, 
                    submitting:false, 
                    submitErrorResponse:err, 
                    buttonSpinnerTarget:"" } ,
                    () => {});
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
                    submit_error:true, 
                    submitting:false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"", 
                  });
                });
            } else if (submitIntention === "submit") {
              // this.setState({submit_error: true}, () => {
                var dataSubmit = {"status":"Submitted"}
                entity_api_update_entity(this.props.editingDataset.uuid, JSON.stringify(dataSubmit), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  console.debug("entity_api_update_entity response", response);
                  var ingestURL= process.env.REACT_APP_URL+"/dataset/"+this.props.editingDataset.uuid
                  var slackMessage = {"message":"Dataset has been submitted ("+ingestURL+")"}
                  ingest_api_notify_slack(JSON.parse(localStorage.getItem("info")).groups_token, slackMessage)
                  .then((slackRes) => {
                    console.debug("slackRes", slackRes);
                    if (response.status < 300) {
                      this.setState({submit_error:false, 
                        submitting:false,});
                        console.debug("submitting");
                        this.props.onUpdated(response.results);
                    } else {
                      this.setState({ 
                        submit_error:true, 
                        submitting:false,
                        submitLoader:false, 
                        submitErrorResponse:response,
                        buttonSpinnerTarget:"" 
                      });
                      this.props.reportError(response);
                    }
                    // this.props.onUpdated(res.data);
                  })
                  .catch((error) => {
                    this.setState({ 
                      submit_error:true, 
                      submitting:false,   
                      submitLoader:false, 
                      submitErrorResponse:error.result.data,
                      buttonSpinnerTarget:"", 
});
                  });
                
                }) 
                .catch((error) => {
                  this.props.reportError(error);
                  this.setState({ 
                    submit_error:true, 
                    submitting:false,   
                    submitLoader:false, 
                    submitErrorResponse:error.result.data,
                    buttonSpinnerTarget:"" 
                });
              });
              // })

            }else if (submitIntention === "processing") {
              this.setState({submit_error:false}, () => {
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
                        statusText = response.err.response.status+" "+response.err.response.statusText;
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
                        submit_error:true, 
                        submitting:false,
                        buttonSpinnerTarget:"", 
                        submitErrorStatus:statusText,
                        submitErrorResponse:submitErrorResponse ,
                      });
                    }
                })
                .catch((error) => {
                    this.props.reportError(error);
                    this.setState({ 
                      submit_error:true, 
                      submitting:false, 
                      submitLoader:false,
                      submitErrorResponse:error, 
                      submitErrorStatus:error,
                      buttonSpinnerTarget:"" 
                    });
                 });
            } else { // just update
                  entity_api_update_entity(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                    .then((response) => {
                        if (response.status < 300) {
                          this.setState({submit_error:false, 
                            submitting:false,});
                          this.props.onUpdated(response.results);
                        } else {
                          this.setState({ 
                            submit_error:true, 
                            submitting:false, 
                            submitErrorResponse:response.results.statusText,
                            buttonSpinnerTarget:"" 
                          });
                        }
              }) 
              .catch((error) => {
                this.props.reportError(error);
                  this.setState({ 
                  submit_error:true, 
                  submitting:false, 
                  submitLoader:false,
                  submitErrorResponse:error.result.data,
                  buttonSpinnerTarget:"" 
                });
              });
            }
          } else {  // new creations
            
            data['dataset_type']=this.state.dataset_type

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
                     this.setState({display_doi:response.results.display_doi,});
                    entity_api_get_globus_url(response.results.uuid, this.state.groupsToken)
                    .then((res) => {
                      
                      this.setState({globus_path:res.results,}, () => {
                       
                        this.props.onCreated({entity:response.results, globus_path:res.results}); // set as an entity for the Results
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
                      submit_error:true, 
                      submitting:false, 
                      submitErrorResponse:response.results.data.error,
                      buttonSpinnerTarget:""
                      } ,() => {});
                  }
                
              })
              .catch((err) => {
                this.setState({
                  submit_error:true, 
                  submitting:false, 
                  submitErrorResponse:err, 
                  buttonSpinnerTarget:"" 
                } ,() => {});
              });
          }  
        }
      }else{
        //
        this.setState({ 
          submit_error:true, 
          submitting:false, 
          buttonSpinnerTarget:""
          // submitErrorStatus:"There was a problem handling your form, and it is currently in an invalid state. Please review the marked items and try again." 
        });
        // Alert("There was a problem handling your form. Please review the marked items and try again.");
      }
    })
    .catch((err) => {
      console.debug("validateForm err", err);
      this.setState({
        submit_error:true, 
        submitting:false, 
        submitErrorResponse:err, 
        buttonSpinnerTarget:"" } ,
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
        this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, source_uuid_list:"At least one Source is required" },}));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, source_uuid_list:"" },}));
      }
      
      if ((this.state.dataset_type && (this.state.dataset_type.size === 0 || this.state.dataset_type === "")) || !this.state.dataset_type) {
        this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, dataset_type:"required" },}));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, dataset_type:"" },}));
      }

      // if (this.state.has_other_datatype && !validateRequired(this.state.other_dt)) {
      //   this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, other_dt:"required" },}));
      //   isValid = false;
      //   resolve(isValid);
      // } else {
      //   this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, other_dt:"" },}));
      // }

      // do a check to on the data type to see what if it normally contains pii
      // let pii_check = this.assay_contains_pii(this.state.dataset_type);
      // let pii_check = false;
      // console.debug('%c⊙', 'color:#00ff7b', "pii_check", pii_check, this.state.contains_human_genetic_sequences);
      // if (this.state.contains_human_genetic_sequences  === true && pii_check === true) {
      //   this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, contains_human_genetic_sequences:"" },}));
      // } else if(this.state.contains_human_genetic_sequences === false && pii_check === false){
      //   this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, contains_human_genetic_sequences:"" },}));
      // } else {
      //     let emsg = "Human Genetic Sequences is required"
      //     if (this.state.contains_human_genetic_sequences === false && pii_check === true) {
      //       emsg = "The selected data type contains gene sequence information, please select Yes or change the data type."
      //     } else if (this.state.contains_human_genetic_sequences === true && pii_check === false) {
      //       emsg = "The selected data type doesn’t contain gene sequence information, please select No or change the data type."
      //     } 
      //     this.setState((prevState) => ({formErrors:{ ...prevState.formErrors, contains_human_genetic_sequences:emsg },}));
      //     isValid = false;       
      // }
      this.setState({ isValidData:isValid});
      if(!isValid){
        this.setState({ 
          submit_error:true, 
          submitting:false,  
          buttonSpinnerTarget:""
        });
        var errorSet = this.state.formErrors;
        // var result = Object.keys(errorSet).find(e => errorSet[e].length);
      }
      resolve(isValid);
    });
  }

  assembleSourceAncestorData(source_uuids){   
    var dst="";
    source_uuids.forEach(function(row, index) {
      dst=ubkg_api_generate_display_subtype(row);
      console.debug("dst", dst);
      source_uuids[index].display_subtype=dst;
    });
    
    this.setState({source_uuid_list:source_uuids});  
    return (source_uuids)
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


  renderManualStatusControl=()=>{
    return(  
      <div className="mt-1">
        
        {this.state.toggleStatusSet  && (
          <Button
            variant="contained"
            className="mx-1"
            onClick={() => this.handleStatusSet() }>
            {this.state.submitting && (
              <FontAwesomeIcon
                className='inline-icon'
                icon={faSpinner}
                spin
              />
            )}
          {!this.state.submittingUpdate && "Update"}         
          </Button>
        )}
        <Collapse in={this.state.toggleStatusSet} className="col-7">
          <FormGroup controlId="status">
              <Select 
                native
                size="small"
                name="newStatus"
                className="form-select col-3 mt-3 " 
                required aria-label="status-select"
                value={this.state.newStatus}
                id="newStatus"
                onChange={this.handleInputChange}>
                  <option value="">----</option>
                  <option>New</option>
                  <option>Submitted</option>
              </Select>
              <FormHelperText>Select the desired status, then click [Update] to apply your changes.</FormHelperText>
          </FormGroup>
        </Collapse>
      </div>
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
      // console.table([this.state.has_admin_priv, this.state.assay_type_primary, this.state.previous_revision_uuid, this.state.status]);

// @TODO: Handling in a utility will optimize this a bunch
    var writeCheck = this.state.has_write_priv
    var adminCheck = this.state.has_admin_priv
    var manualCheck = this.state.has_manual_priv
    var versCheck = this.state.has_version_priv
    var pubCheck = this.state.status === "Published"
    var newFormCheck = this.props.newForm
    var newStateCheck = this.state.status === "New"

    var permMatrix = {
      "writeCheck":writeCheck,
      "adminCheck":adminCheck,
      "versCheck":versCheck,
      "pubCheck":pubCheck,
      "newFormCheck":newFormCheck,
      "newStateCheck":newStateCheck,
      "manualCheck":manualCheck,
    }
    // console.debug("permMatrix")
    // console.table(permMatrix)


    if (this.state.has_admin_priv === true 
            && (!this.state.previous_revision_uuid || this.state.previous_revision_uuid === undefined )
            && this.state.status.toUpperCase() === "PUBLISHED") {
        //  return (
        //    <div className="buttonWrapRight">
        //         {this.reprocessButton()}
        //         {this.cancelButton()}
        //     </div>
        //   )
    }
    // console.debug("CheckTwo",this.state.writeable === false && this.state.has_version_priv === false);
    if (this.state.writeable === false ){            
      return (
            <div className="buttonWrapRight">
                {this.cancelButton()} 
            </div>
          )
    } else {
      if (["NEW", "INVALID", "REOPENED", "ERROR", "SUBMITTED"].includes( 
              this.state.status.toUpperCase())) {
        return (
          <div className="buttonWrapRight">
              {this.aButton(this.state.status.toLowerCase(), "Save")}
              {this.state.has_admin_priv && (this.state.status.toUpperCase() ==="NEW" || this.state.status.toUpperCase() ==="SUBMITTED" ) &&(
                this.aButton("processing", "Process"))
              }
              {this.state.has_write_priv && !this.props.newForm && this.state.status.toUpperCase() === "NEW" &&(
                  <div>
                    <Button 
                      className="btn btn-primary mr-1" 
                      variant="contained"
                      onClick={ () => this.launchSubmitModal() }>
                        Submit
                    </Button>
                  </div>
              )}
              {this.cancelButton()}
            </div>
          )
      }
      if (this.state.status.toUpperCase() === 'PUBLISHED' ) {
        return (
            <div className="buttonWrapRight">
                {/* {this.renderNewVersionButtons()}  */}
                {this.aButton("reopened", "Reopen")}
                {this.aButton("unpublished", "UnPublish")}
                {this.cancelButton()}
            </div>
          )
      }else{
        return(
          <div className="buttonWrapRight">
            {this.cancelButton()}
          </div>
        )
      }   
    }
  }

  renderSubmitModal = () => {
    // @TODO: Drop this into a Modals util (& stay in sync with publications)
      return (
          <Dialog
            sx={{ '& .MuiDialog-paper': { width: '80%', maxHeight: 435 } }}
            maxWidth="xs" 
            // sx={{width:"600px!important"}}    
            aria-labelledby="submit-dialog" 
            open={this.state.showSubmitModal}>
            <DialogContent>
              <h4>Preparing to Submit</h4>
              <div>  Has all data for this dataset been <br/>
                1	&#41; validated locally, and  <br/>
                2	&#41; uploaded to the globus folder?</div>
           </DialogContent>
             <DialogActions>
             <LoadingButton loading={this.state.submitting} sx={{width:"150px"}} loadingIndicator="Submitting..." variant="outlined" onClick={ () => this.handleSubmit("submit")} submitLoader>
              Submit
             </LoadingButton>
              {/* <Button
              className="btn btn-primary mr-1"
              onClick={ () => this.handleSubmit("submit")}>
              Submit
            </Button> */}
            <Button
              className="btn btn-secondary"
              onClick={this.hideSubmitModal}>
              Cancel
            </Button>          
            </DialogActions>
          </Dialog>
      
      );
    }
  
  renderListItem(uuid){
    console.debug('%c◉ data ', 'color:#00ff7b', uuid);
      entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).groups_token)
      .then((response) => {
        console.debug('%c◉ response ', 'color:#00ff7b',response.results.hubmap_id );
        if(response.results.hubmap_id){
          return response.results.hubmap_id
        }else{
          return uuid
        }
      })
      .catch((error) => {
        console.debug("UUIDCheck",error);
        this.props.reportError(error);
      })   

    
  }

  renderVersionNav() {
    return (VersionNavigation(this.state.previousHubIDs,this.state.nextHubIDs))
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
    return (<React.Fragment>
      <div >
        <Button
          type='button'
          name={"button-" + which_button}
          variant="contained"
          disabled={this.state.submitting}
          onClick={ 
            (e) => {
              this.setState({buttonSpinnerTarget:which_button.toLowerCase()},() => {});
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
    
    const {
name, display_doi, doi
} = newDataset;
    this.setState({
      globus_url:newLink,
       name:name, 
       display_doi:display_doi, 
       doi:doi, 
       createSuccess:true
    });
  }


  onChangeGlobusURL() {
    // REMEMBER the props from the new wrapper / Forms
    // Differs from Main wrapper
    
    this.props.changeLink(this.state.globus_path, { 
      name:this.state.lab_dataset_id,
      display_doi:this.state.display_doi,
      doi:this.state.doi,
    });
  }

   renderDatsetTypeDropdown(){
    return (
      <Select
        native 
        fullWidth
        name="dt_select"
        className="form-select" 
        value={this.state.dataset_type} 
        id="dt_select" 
        labelid="type_label"
        label="Dataset Type"
        onChange={this.handleInputChange}
        // disabled={ (!this.state.writeable || !this.state.assay_type_primary) || this.state.disableSelectDatatype }
        disabled={ !this.state.writeable || this.state.disableSelectDatatype }>
        <option value=""></option>
        {this.props.dtl_all.map((type, index) => {
          return (
            <option key={index + 1} value={type.dataset_type}>
              {type.dataset_type}
            </option>
          );
        })}
      </Select>
    )
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
                style={{ cursor:"pointer" }}
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
                      rel='noopener noreferrer'>
                        To add or modify data files go to the data repository
                      <FontAwesomeIcon icon={faExternalLinkAlt} style={{ marginLeft:"5px" }} />
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
                style={{ cursor:"pointer" }}
                className='text-primary'
                onClick={this.showModal}>
                18 identifiers specified by HIPAA
              </span>
            </Alert>
            {/* {this.state.versioned && (this.state.loadingPreviousVersions===false && this.state.loadingNextVersions===false) && (this.state.previousHubIDs.length > 0 || this.state.nextHubIDs.length > 0)  && (
                <>{this.renderVersionNav()}</>
            )} */}
            {/* {this.state.versioned && (this.state.loadingPreviousVersions===true || this.state.loadingNextVersions===true) && (
              <Grid container spacing={2} sx={{display:"flex",justifyContent:"flex-start",textAlign:"left"}}>      
                <Grid item xs={6}>
                  <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <Skeleton variant="rounded"  height={60} />
                </Grid>
                <Grid item xs={6}>
                <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
                  <Skeleton variant="rounded"  height={60} />
                </Grid>
              </Grid>
            )} */}

            {this.props.editingDataset && this.props.editingDataset.upload && this.props.editingDataset.upload.uuid  && (
              <Box sx={{ display:'flex'}} >
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
                blacklist={['collection']}
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
                  data-for='description_tooltip'/>
                <ReactTooltip
                  id='description_tooltip'
                  place='top'
                  type='info'
                  effect='solid'>
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
                Dataset Type <span className='text-danger'>* </span>
              </label>
              <span>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='datatype_tooltip'
                  style={{ marginLeft:"10px" }}
                />
                <ReactTooltip
                  id='datatype_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>Dataset Type Tips</p>
                </ReactTooltip>
              </span>
              {this.props.newForm&& (
                <React.Fragment>
                  <div className='col-sm-12'>
                        { this.renderDatsetTypeDropdown()}
                  </div>
                  <div className='col-sm-12'>
                  {this.state.formErrors.dataset_type && (
                    <div className='alert alert-danger'>
                      One Dataset Type is Required.
                    </div>
                  )}
                  </div>
                </React.Fragment>
              )}
              {!this.props.newForm && this.props.editingDataset.dataset_type &&(
                  <div className='col-sm-12'>
                        {this.props.editingDataset.dataset_type.toString()}
                  </div>
              )}
            
          </div>
					
					{/* Make this check admin when finished */}
					{this.props.allGroups && this.state.has_admin_priv && (
            <div className="row mt-4  ">
              <div className='form-group col-6'> 
                <label htmlFor='assigned_to_group_name'>Assigned to Group Name </label>
                {this.renderGroupAssignment()}
                <FormHelperText>The group responsible for the next step in the data ingest process.</FormHelperText>
              </div>
              <div className='form-group col-6'> 
                <label htmlFor='ingest_task'>Ingest Task </label>
                <TextField
                  labelid="ingest_task_label"
                  name="ingest_task"
                  id="ingest_task"
                  helperText="The next task in the data ingest process."
                  // placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                  fullWidth
                  value={this.state.ingest_task}
                  onChange={(event) => this.handleInputChange(event)}/>
              </div>
            </div>
          )}

          {!this.state.has_admin_priv && this.state.assigned_to_group_name && this.state.ingest_task && (
            <div className="row mt-4  ">
              <div className='form-group col-6'> 
                <label htmlFor='assigned_to_group_name'>Assigned to Group Name </label>
                <Typography >{this.state.assigned_to_group_name}</Typography>
              </div>
              <div className='form-group col-6'> 
                <label htmlFor='ingest_task'>Ingest Task </label>
                <Typography >{this.state.ingest_task}</Typography>
              </div>
            </div>
          )}

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

          <div className='row'>
            <div className="col-8">
            {this.state.has_admin_priv && (
                <RevertFeature 
                  uuid={this.props.editingDataset ? this.props.editingDataset.uuid : null}
                  type={this.props.editingDataset ? this.props.editingDataset.entity_type : 'entity'}
                />
              )}
              {/* {this.state.has_admin_priv &&(
                <BlameFeature
                  admin={this.state.has_admin_priv}
                  group={this.props.editingDataset.assigned_to_group_name}
                  task={this.props.editingDataset.ingest_task}
                  uuid={this.props.editingDataset ? this.props.editingDataset.uuid : null}
                  type={this.props.editingDataset ? this.props.editingDataset.entity_type : 'entity'}
                />
              )} */}
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
          hide={() => this.hideModal()}
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
                dangerouslySetInnerHTML={{ __html:this.state.statusErrorMsg }}
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