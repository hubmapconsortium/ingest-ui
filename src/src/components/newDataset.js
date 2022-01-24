import React, { Component } from "react";

import { Routes, Route, useParams } from "react-router-dom";

import Paper from '@material-ui/core/Paper';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import '../App.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner, faTrash, faPlus, faUserShield } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
//import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
//import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "./ui/HIPPA.jsx";
import axios from "axios";
import { validateRequired } from "../utils/validators";
import {
  faExternalLinkAlt,
  faFolder
} from "@fortawesome/free-solid-svg-icons";
import Modal from "./ui/modal";
import GroupModal from "./ui/groupModal";
import SearchComponent from "./SearchComponent";
import { ingest_api_allowable_edit_states, ingest_api_create_dataset, ingest_api_dataset_submit } from '../service/ingest_api';
import { entity_api_update_entity } from '../service/entity_api';
// import { withRouter } from 'react-router-dom';
import { get_assay_type } from '../service/search_api';
import { getPublishStatusColor } from "./ui/badgeClasses";
import { generateDisplaySubtype } from "../utils/display_subtypes";


import MuiAlert from '@material-ui/lab/Alert';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}



function FetchDataset() {
  let params = useParams();
  return <h1>Invoice {params.uuid}</h1>;
}


function DatasetEdit()  {
  state = {
    status: "NEW",
    collection_candidates:"",
    badge_class: "badge-purple",
    display_doi: "",
  //  doi: "",
    name: "",
    // collection: {
    //   uuid: "",
    //   label: "",
    //   description: "",
    // },
    source_uuid: undefined,
    editingSource:[],
    editingSourceIndex:0,
    submitErrorResponse:"",
    source_uuid_list: [],
    contains_human_genetic_sequences: undefined,
    description: "",
    dataset_info: "",
    source_uuids: [],
    globus_path: "",
    writeable: true,
    handleSelectionLoading:false,
    has_submit_priv: false,
    has_publish_priv: false,
    has_admin_priv: false,
    lookUpCancelled: false,
    LookUpShow: false,
    GroupSelectShow: false,
    //  is_curator: null,
    source_uuid_type: "",
    previous_revision_uuid: undefined,
    assay_type_primary: true,
    data_types: new Set(),
    has_other_datatype: false,
    other_dt: "",
    slist:[],
   // is_protected: false,

    groups: [],
    data_type_dicts: [],
    data_type_false_dicts: [],

    formErrors: {
      lab_dataset_id: "",
//      collection: "",
      source_uuid: "",
      data_types: "",
      other_dt: "",
      source_uuid_list:"",
      contains_human_genetic_sequences:""
    },
  };

  const updateStateDataTypeInfo= (e) => {
    let data_types = null;
    let other_dt = undefined;
    if (props.hasOwnProperty('editingDataset')
	       && props.editingDataset
	       && props.editingDataset.data_types) {
      //////console.log('editingDataset.data_types', props.editingDataset.data_types)
      // data_types = JSON.parse(
      //   props.editingDataset.data_types
      //     .replace(/'/g, '"')
      //     .replace(/\\"/g, "'")
      // );
      //////console.log('state.data_type_dicts', state.data_type_dicts)
      const data_type_options = new Set(state.data_type_dicts.map((elt, idx) => {return elt.name}));
      //////console.log('data_type_options: ', data_type_options);
      other_dt = props.editingDataset.data_types.filter((dt) => !data_type_options.has(dt))[0];
      data_types = props.editingDataset.data_types.filter((dt) => data_type_options.has(dt));
      if (other_dt) {
        data_types.push(other_dt);
      }
      

      get_assay_type(other_dt, JSON.parse(localStorage.getItem("info")).groups_token)
        .then((resp) => {
        if (resp.status === 200) {
          //console.log('Assay Type info...', resp.results);
    
          if (resp.results) {
            setState({
              assay_type_primary: resp.results.primary
            });
          }
        }
      });

    }
    setState({
      data_types: new Set(data_types),
      has_other_datatype: other_dt !== undefined,
      other_dt: other_dt,
    });
  }

  const componentDidMount= (e) => {
    document.addEventListener("click", handleClickOutside);

    //console.log('props', props)

    if (props.editingDataset) {
      if (props.editingDataset.uuid)
      // check to see which buttons to enable
       ingest_api_allowable_edit_states(props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).groups_token)
        .then((resp) => {
        if (resp.status === 200) {
          //console.log('edit states...', resp.results);
    
          setState({
            writeable: resp.results.has_write_priv,
            has_submit_priv: resp.results.has_submit_priv,
            has_publish_priv: resp.results.has_publish_priv,
            has_admin_priv: resp.results.has_admin_priv
            });
        }
      });
    }else{
      console.debug("No editingDataset Prop, Must be a New Form")
    }

    console.log("info is ", localStorage.getItem("info"));
    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
        "Content-Type": "application/json",
      },
    };

    axios
      .get(`${process.env.REACT_APP_SEARCH_API_URL}/assaytype`, 
	   {headers: {"Content-Type": "application/json"},
	    params: {"primary": "true"}})
      .then((response) => {
	         let data = response.data;
           var dt_dict = data.result.map((value, index) => { return value });

	         setState({data_type_dicts: dt_dict});
           //console.log('set the data_type_dicts from service', dt_dict)
	         updateStateDataTypeInfo();
      })
      .catch(error => {
	         return Promise.reject(error);
      });

    axios
      .get(
        `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
        config
      )
      .then((res) => {
        // const display_names = res.data.groups
        //   .filter((g) => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
        //   .map((g) => {
        //     return g.displayname;
        //   });
        // setState({
        //   groups: display_names,
        // });
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        setState({
          groups: groups
        });
      })
      .catch((err) => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

      if (props.editingDataset) {
	  
      //let source_uuids;
      try {
        // use only the first direct ancestor
         setState({
          source_uuids: props.editingDataset.direct_ancestors
        });
      } catch {
        console.debug("editingDataset Prop Not Found")
      }

   
      updateStateDataTypeInfo();
      var savedGeneticsStatus = undefined;
      if(props.editingDataset ==='' ){
        savedGeneticsStatus = undefined;
      }else{
        savedGeneticsStatus = props.editingDataset.contains_human_genetic_sequences;
      }

      setState(
        {
          status: props.editingDataset.hasOwnProperty('status') ? props.editingDataset.status.toUpperCase() : "NEW",
          display_doi: props.editingDataset.hubmap_id,
          //doi: props.editingDataset.entity_doi,
          lab_dataset_id: props.editingDataset.lab_dataset_id,
          globus_path: "", //props.editingDataset.properties.globus_directory_url_path,
          // collection: props.editingDataset.properties.collection
          //   ? props.editingDataset.properties.collection
          //   : {
          //       uuid: "",
          //       label: "",
          //       description: "",
          //     },
          source_uuid: getSourceAncestor(props.editingDataset.direct_ancestors),
          source_uuid_list:assembleSourceAncestorData(props.editingDataset.direct_ancestors),
          source_entity: getSourceAncestorEntity(props.editingDataset.direct_ancestors), // Seems like it gets the multiples. Multiple are stored here anyways during selection/editing
          slist: getSourceAncestorEntity(props.editingDataset.direct_ancestors),
          // source_uuid_type: props.editingDataset.properties.specimen_type,
          //contains_human_genetic_sequences: props.editingDataset.contains_human_genetic_sequences,
          contains_human_genetic_sequences: savedGeneticsStatus,
          description: props.editingDataset.description,
          dataset_info: props.editingDataset.dataset_info,
          previous_revision_uuid: props.editingDataset.hasOwnProperty('previous_revision_uuid') ? props.editingDataset.previous_revision_uuid : undefined,
          // assay_metadata_status: props.editingDataset.properties
          //   .assay_metadata_status,
          // data_metric_availability: props.editingDataset.properties
          //   .data_metric_availability,
          // data_processing_level: props.editingDataset.properties
          //   .data_processing_level,
          // dataset_sign_off_status: props.editingDataset.properties
          //   .dataset_sign_off_status,
          errorMsgShow:
            props.editingDataset.status.toLowerCase() ===
              "error" && props.editingDataset.message
              ? true
              : false,
          statusErrorMsg: props.editingDataset.message,
        },
        () => {
          setState({
            badge_class: getPublishStatusColor(state.status.toUpperCase()),
          });
          axios
            .get(
              `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${props.editingDataset.uuid}`,
              config
            )
            .then((res) => {
              setState({
                globus_path: res.data,
              });
            })
            .catch((err) => {
              setState({
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
    }
  }

  componentWillUnmount= (e) => {
    document.removeEventListener("click", handleClickOutside, true);
  }

  showModal = () => {
    setState({ show: true });
  };

  hideModal = () => {
    setState({ show: false });
  };

  showErrorMsgModal = (msg) => {
    setState({ errorMsgShow: true, statusErrorMsg: msg });
  };

  hideErrorMsgModal = () => {
    setState({ errorMsgShow: false });
  };

  showConfirmDialog(row,index) {
    console.debug("ShowConfDia")

    console.debug("row", row)
    console.debug("row index", index)
    setState({ 
        confirmDialog: true,
        editingSource: row,
        editingSourceIndex: index
    });
  };

  hideConfirmDialog = () => {
    setState({ 
        confirmDialog: false ,
        editingSource: []
    });
  };

  hideGroupSelectModal = () => {
    setState({
      GroupSelectShow: false
    });
  };

  handleLookUpClick = () => {
    console.debug('IM HERE TRYING TO SHOW THE DIALOG', state.lookUpCancelled, state.LookUpShow)
    if (!state.lookUpCancelled) {
      setState({
        LookUpShow: true
      });
    }
     setState({
        lookUpCancelled: false
      });
  };

  hideLookUpModal = () => {
    //////console.debug('IM HERE TRYING TO HIDE THE DIALOG')
    setState({
      LookUpShow: false
    });
  };

  cancelLookUpModal = () => {
    //////console.debug('IM HERE TRYING TO HIDE THE DIALOG')
    setState({
      LookUpShow: false,
      lookUpCancelled: true
    });
  };

  handler = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (state.collection_candidates.length > 0) {
        setState({
          collection: state.collection_candidates[0],
          showCollectionsDropDown: false,
        });
      }
    }
  };

  handleInputChange = (e) => {
    const { id, name, value } = e.target;
    //console.debug('**name', name)
    switch (name) {
      case "lab_dataset_id":
        setState({
          lab_dataset_id: value,
        });
        //console.debug('*** lab_dataset_id', value)
        break;
      // case "source_uuid":
      //   setState({
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
        setState({
          contains_human_genetic_sequences: gene_seq,  // need to convert to a boolean
        });
        break;
      case "description":
        setState({
          description: value,
        });
        break;
      case "dataset_info":
        setState({
          dataset_info: value,
        });
      break;
      case "status":
        setState({
          new_status: value,
        });
        break;
      // case "is_protected":
      //   setState({
      //     is_protected: e.target.checked,
      //   });
      //   break;
      case "other_dt":
        setState({ other_dt: value });
        break;
      case "groups":
        setState({
          selected_group: value
        });
        break;
      default:
        break;
    }
    if (id.startsWith("dt")) {
      console.log('ping!', id);
      if (id === "dt_other") {
        const data_types = state.data_types;
        setState({
          data_types: data_types,
          has_other_datatype: e.target.checked,
        });
        if (!e.target.checked) {
	         const data_type_options = new Set(state.data_type_dicts.map((elt, idx) => {return elt.name}));
            const data_types = state.data_types;
            const other_dt = Array.from(data_types).filter(
              (dt) => !data_type_options.has(dt)
              )[0];
            data_types.delete(other_dt);
            setState({
              data_types: data_types,
              other_dt: "",
            });
        }
      } else {
        //////console.log(id, e.target.checked)
        if (value === "other") {
          const data_types = state.data_types;
          data_types.clear();
          data_types.add(value);
          setState({
            data_types: data_types,
            has_other_datatype: value === "other",
          });
          console.log("other", state.has_other_datatype);
          if (value !== "other") {
            const data_type_options = new Set(state.data_type_dicts.map((elt, idx) => {return elt.name}));
            const data_types = state.data_types;
            const other_dt = Array.from(data_types).filter(
              (dt) => !data_type_options.has(dt)
              )[0];
            data_types.delete(other_dt);
            setState({
              data_types: data_types,
              other_dt: "",
            });
          }
          
        } else {

          const data_types = state.data_types;
          data_types.clear();
          data_types.add(value);
          setState({
            has_other_datatype: false,
            data_types: data_types,
          });

        }/*if (e.target.checked) {
          const data_types = state.data_types;
          data_types.add(name);
          setState({
            data_types: data_types,
          });
        } else {
          const data_types = state.data_types;
          data_types.delete(name);
          setState({
            data_types: data_types,
          });
        }*/
      
      }
      //////console.log('data_types', state.data_types)
    }
  };

  handleInputFocus = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case "collection":
        let ret = state.collections.filter((c) => {
          return c.name.toLowerCase().includes(value.toLowerCase());
        });
        setState({
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
        setState({
          showCollectionsDropDown: false,
        });
        break;
      default:
        break;
    }
  };

  handleCollectionClick = (collection) => {
    setState({
      collection: collection,
      showCollectionsDropDown: false,
    });
  };

  // this is used to handle the row selection from the SOURCE ID search (idSearchModal)
  handleSelectClick = (selection) => {
    
    console.debug("handleSelectClick",state.selectedSource,  selection.uuid, state.selectedSource !== selection.uuid, selection);
      if(state.selectedSource !== selection.row.uuid){
        setState({
          selectedSource: selection.row.uuid
        } ,() => {    
        var slist=state.source_uuid_list;
        slist.push(selection.row);
        setState({
          source_uuid: selection.row.hubmap_id, 
          source_uuid_list: slist,
          slist: slist,
          source_entity:selection.row,  // save the entire entity to use for information
          LookUpShow: false
        });
        hideLookUpModal();
        // cancelLookUpModal();
      });
    }else{
      console.debug("Not adding to slist; already added");
    }
  };

  sourceRemover = (row) => {
    console.debug("Removing Source ",row.uuid)
    var slist=state.source_uuid_list;
    slist =  slist.filter(source => source.uuid !== row.uuid)
      setState( {
        source_uuid_list: slist,
        slist: slist,
      } ,() => {
        console.log("NEW LIST ",state.source_uuid_list);
        // hideConfirmDialog();
        
      });
  }

  renderSources = () => {
    if(state.source_uuid_list ||  props.newForm===false){
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
          {errorClass(state.formErrors.source_uuid_list) && (
            <div className='alert alert-danger'>
            At least one source is Required
          </div>
          )}
        <TableContainer 
          component={Paper} 
          style={{ maxHeight: 450 }}
          className={
            errorClass(state.formErrors.source_uuid_list)
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
            {state.source_uuid_list.map((row, index) => (
              <TableRow 
                key={(row.hubmap_id+""+index)} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to 
                // onClick={() => handleSourceCellSelection(row)}
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
                {state.writeable && (
                  <React.Fragment>
                    <FontAwesomeIcon
                      className='inline-icon interaction-icon '
                      icon={faTrash}
                      color="red"  
                      onClick={() => sourceRemover(row,index)}
                    />
                  </React.Fragment>
                  )}
                  {!state.writeable && (
                  <small className="text-muted">N/A</small>
                  )}
                
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
        
                 
        {state.writeable && (
        <React.Fragment>
          <div className="mt-2 text-right">
            <button
              type='button'
              className='btn btn-secondary'
              onClick={() => handleLookUpClick()} 
              >
              Add {props.newForm === true && (
                "Another"
                )} Source 
              <FontAwesomeIcon
                className='fa button-icon ml-2'
                icon={faPlus}
              />
            </button>
          </div>
        </React.Fragment>
        )}
      </div>
    )}else if(state.writeable && state.editingDataset){

    }
    
  }

  getUuidList = (new_uuid_list) => {
    //setState({uuid_list: new_uuid_list});
   console.log('**getUuidList', new_uuid_list)
    setState(
      {
        source_uuid: getSourceAncestor(new_uuid_list),
        source_uuid_list: new_uuid_list,
        LookUpShow: false,
      },
      () => {
        validateUUID();
      }
    );
  };

  handleAddNewCollection = () => {
    setState({
      AddCollectionShow: true,
    });
  };

  hideAddCollectionModal = (collection) => {
    setState({
      AddCollectionShow: false,
    });

    if (collection.label) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
          "Content-Type": "application/json",
        },
      };

      axios
        .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections`, config)
        .then((res) => {
          setState(
            {
              collections: res.data.collections,
            },
            () => {
              const ret = state.collections.filter((c) => {
                return c.label
                  .toLowerCase()
                  .includes(collection.label.toLowerCase());
              });
              setState({ collection: ret[0] });
            }
          );
        })
        .catch((err) => {
          if (err.response === undefined) {
          } else if (err.response.status === 401) {
            localStorage.setItem("isAuthenticated", false);
            window.location.reload();
          }
        });
    }
  };

  handleClickOutside = (e) => {
    setState({
      showCollectionsDropDown: false,
    });
  };

  validateUUID = () => {
    let isValid = true;
    const uuid = state.source_uuid_list[0].hubmap_id
      ? state.source_uuid_list[0].hubmap_id
      : state.source_uuid_list[0];
    const uuid_type = state.source_uuid_list[0].datatype
      ? state.source_uuid_list[0].datatype
      : "";
    //const uuid_type = "Not dataset";
    const url_path = uuid_type === "Dataset" ? "datasets" : "specimens";
    const url_server =
      uuid_type === "Dataset"
        ? process.env.REACT_APP_DATAINGEST_API_URL
        : process.env.REACT_APP_SPECIMEN_API_URL;

    // const patt = new RegExp("^.{3}-.{4}-.{3}$");
    // if (patt.test(uuid)) {
    setState({
      validatingUUID: true,
    });
    if (true) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).groups_token,
          "Content-Type": "multipart/form-data",
        },
      };

      return axios
        .get(`${url_server}/${url_path}/${uuid}`, config)
        .then((res) => {
          if (res.data) {
            if (
              res.data.specimen &&
              res.data.specimen.entitytype === "Dataset"
            ) {
              res.data.dataset = res.data.specimen;
              res.data.specimen = null;
            }
            setState((prevState) => ({
              source_entity: res.data,
              formErrors: { ...prevState.formErrors, source_uuid: "valid" },
            }));
            return isValid;
          } else {
            setState((prevState) => ({
              source_entity: null,
              formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
            }));
            isValid = false;
            Alert("The Source UUID does not exist.");
            return isValid;
          }
        })
        .catch((err) => {
          console.debug("Err Caught in validateUUID catch for then Catch")
          setState((prevState) => ({
            submitErrorResponse:err,
            source_entity: null,
            formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
          }));
          isValid = false;
          
          Alert("The Source UUID does not exist.");
          return isValid;
        })
        .then(() => {
          setState({
            validatingUUID: false,
          });
          return isValid;
        });
    } else {
      console.debug("Err Caught in validateUUID Return")
      setState((prevState) => ({
        formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
      }));
      isValid = false;
      Alert("The Source UUID is invalid.");
      return new Promise((resolve, reject) => {
        resolve(false);
      });
    }
  };

  handleReprocess = () => {
    Alert("Reprocessing feature not implemented")
  }

  handleButtonClick = (i) => {
    setState({
      new_status: i
    }, () => {
      handleSubmit(i);
    })
  };

  handleSubmit = (i) => {
    console.log('SUBMIT STATE', state)
    console.log('SOURCE UUIDS', state.source_uuid_list)
    const data_type_options = new Set(state.data_type_dicts.map((elt, idx) => {return elt.name}));
    const data_types = state.data_types;
    const other_dt = Array.from(data_types).filter(
      (dt) => !data_type_options.has(dt)
    )[0];
    data_types.delete(other_dt);

    //////console.log('submit: data_types',data_types)
    if (state.other_dt) {
      const data_types = state.data_types;
      data_types.add(state.other_dt);
      setState({ data_types: data_types });
    }

    //////console.log('submit: moving to validateForm')
    validateForm().then((isValid) => {
    
      if (isValid) {
        if (
          !props.editingDataset &&
          state.groups.length > 1 &&
          !state.GroupSelectShow
        ) {
          setState({ GroupSelectShow: true });
        } else {
          setState({
            GroupSelectShow: false,
            submitting: true,
          });
          setState({ submitting: true });
          const state_data_types = state.data_types;
          state_data_types.delete("other");
          let data_types = [...state_data_types];
          if (state.other_dt !== undefined && state.other_dt !== "") {
            data_types = [
              ...data_types,
              state.other_dt.replace(/'/g, "\\'"),
            ];
          }

          // package the data up
          let data = {
            lab_dataset_id: state.lab_dataset_id,
            //collection_uuid: state.collection.uuid,
            contains_human_genetic_sequences: state.contains_human_genetic_sequences,
            data_types: data_types,
            description: state.description,
            dataset_info: state.dataset_info,
            //status: state.new_status,
            //is_protected: state.is_protected,
          };
  
          // get the Source ancestor
          if (state.source_uuid_list && state.source_uuid_list.length > 0) {
            let direct_ancestor_uuid = state.source_uuid_list.map((su) => {
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
         
          if (props.editingDataset) {
            // if user selected Publish
            if (i === "published") {
              let uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${props.editingDataset.uuid}/publish`;
              axios
                .put(uri, JSON.stringify(data), config)
                .then((res) => {
                  props.onUpdated(res.data);
                })
                .catch((error) => {
                  console.debug("ERROR ", error)
                  setState({ submit_error: true, submitting: false, submitErrorResponse:error.result.data });
                });
            } else if (i === "processing") {
               ////console.log('Submit Dataset...');
               console.log("data is ", data)
                ingest_api_dataset_submit(props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((response) => {
                    if (response.status === 200) {
                      ////console.log(response.results);
                      props.onUpdated(response.results);
                    } else {
                      console.log("ERR response");
                      console.log(response);
                      setState({ submit_error: true, submitting: false, submitErrorResponse:response.results.statusText });
                    }
                });
              } else { // just update
                    entity_api_update_entity(props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                      .then((response) => {
                          if (response.status === 200) {
                            setState({ 
                              submit_error: false, 
                              submitting: false, 
                              });
                            ////console.log('Update Dataset...');
                             ////console.log(response.results);
                            props.onUpdated(response.results);
                          } else {
                            console.debug("ERROR ",response)
                            setState({ submit_error: true, submitting: false, submitErrorResponse:response.results.statusText });
                          }
                });
              }
          } else {  // new creations

            if (state.lab_dataset_id) {
              data["lab_dataset_id"] = state.lab_dataset_id;
            }

            // the group info on a create, check for the defaults
              if (state.selected_group && state.selected_group.length > 0) {
                data["group_uuid"] = state.selected_group;
              } else {
                data["group_uuid"] = state.groups[0].uuid; // consider the first users group        
              }

              console.log('DATASET TO SAVE', JSON.stringify(data))
              // api_create_entity("dataset", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
               ingest_api_create_dataset(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  if (response.status === 200) {
                    console.log('create Dataset...', response.results);
                     setState({
                        //globus_path: res.data.globus_directory_url_path,
                        display_doi: response.results.display_doi,
                        //doi: res.data.doi,
                      });
                     axios
                     .get(
                      `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${response.results.uuid}`,
                      config
                    )
                    .then((res) => {
                      setState({
                        globus_path: res.data,
                      }, () => {
                        console.debug('globus_path', res.data)
                        props.onCreated({entity: response.results, globus_path: res.data}); // set as an entity for the Results
                        onChangeGlobusURL();
                      });
                    })
                    .catch((err) => {
                     console.log('ERROR catch', err)
                      if (err.response && err.response.status === 401) {
                        localStorage.setItem("isAuthenticated", false);
                        window.location.reload();
                      }
                    });
                  } else {
                    console.debug("Error response", response) 
                    setState({ submit_error: true, submitting: false, submitErrorResponse:response.results.data.error} ,
                      () => {
                        console.debug("state.submitErrorResponse", state.submitErrorResponse) 
                      });
                   
                  }
                
              })
              .catch((err) => {
                console.debug("err", err)
                setState({ submit_error: true, submitting: false, submitErrorResponse:err } ,
                  () => {
                    console.debug("CATCH ", err) 
                  });
              });
          }  //else
        }
      }
    });
  };

  validateForm= (e) => {
    return new Promise((resolve, reject) => {
      let isValid = true;
      console.debug("data_types", state.data_types);
      // if (!validateRequired(state.lab_dataset_id)) {
      //   setState((prevState) => ({
      //     formErrors: { ...prevState.formErrors, lab_dataset_id: "required" },
      //   }));
      //   isValid = false;
      //   resolve(isValid);
      // } else {
      //   setState((prevState) => ({
      //     formErrors: { ...prevState.formErrors, lab_dataset_id: "" },
      //   }));
      //   // validateUUID().then((res) => {
      //   //   resolve(isValid && res);
      //   // });
      // }
      
      if (!validateRequired(state.source_uuid_list)) {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid_list: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid_list: "" },
        }));
        // validateUUID().then((res) => {
        //   resolve(isValid && res);
        // });
      }
      
      if (state.data_types.size === 0 || state.data_types === "") {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, data_types: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, data_types: "" },
        }));
      }

      if (state.has_other_datatype && !validateRequired(state.other_dt)) {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, other_dt: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, other_dt: "" },
        }));
      }

      // do a check to on the data type to see what if it normally contains pii
      let pii_check = assay_contains_pii(state.data_types);

      console.debug('VALIDATE: pii_check', pii_check)
      if (state.contains_human_genetic_sequences === true && pii_check === true) {
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else if(state.contains_human_genetic_sequences === false && pii_check === false){
        setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else {
          let emsg = "Human Genetic Sequences is required"
          if (state.contains_human_genetic_sequences === false && pii_check === true) {
            emsg = "The selected data type contains gene sequence information, please select Yes or change the data type."
          } else if (state.contains_human_genetic_sequences === true && pii_check === false) {
            emsg = "The selected data type doesn’t contain gene sequence information, please select No or change the data type."
          } 
          setState((prevState) => ({
              formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: emsg },
          }));
     
          isValid = false;       
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
    console.debug("getSourceAncestory Not Found?! ",source_uuids)
  }
 
}

  // only handles one selection at this time
  getSourceAncestor(source_uuids){
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
      console.debug("getSourceAncestory Not Found?! ",source_uuids)
    }
    return ""
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    try {
      return source_uuids[0];  // just get the first one
    } catch {
      console.debug("getSourceAncestorEntity Not Found?! ",source_uuids)
    }
    return ""
  }

  //note: this code assumes that source_uuids is a sorted list or a single value
  generateDisplaySourceId(source_uuids) {
    // console.debug("~~~~~~~~~~` generateDisplaySourceId", source_uuids);
    //check if the source_uuids represents a list or a single value
    if (source_uuids.length > 1) {
      console.debug("source_uuids.length > 1")
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

  renderButtons= (e) => {

    if (state.has_admin_priv === true && state.assay_type_primary === false
            && state.previous_revision_uuid === undefined 
            && state.status.toUpperCase() === "PUBLISHED") {
         return (
           <div className="row">
                {reprocessButton()}
                {aButton(state.status.toLowerCase(), "Save")}
                {cancelButton()}
            </div>
          )
    }
            
    if (state.writeable === false) {            
      return (
            <div className="row">
                {cancelButton()}
            </div>
          )
    } else {

      if (["NEW", "INVALID", "REOPENED", "ERROR"].includes(
              state.status.toUpperCase())) {
        return (
            <div className="row">
                {aButton(state.status.toLowerCase(), "Save")}
                {state.has_submit_priv && (
                  aButton("processing", "Submit"))
                }
                {cancelButton()}
            </div>
          )
      }
      if (state.status.toUpperCase() === 'UNPUBLISHED' && state.has_publish_priv) {
        return (
            <div className="row">
                {aButton("published", "Publish")}
                {cancelButton()}
            </div>
          )
      }   
      if (state.status.toUpperCase() === 'PUBLISHED') {
        return (
            <div className="row">
                {aButton("reopened", "Reopen")}
                {aButton("unpublished", "UnPublish")}
                {cancelButton()}
            </div>
          )
      } 
      if (state.status.toUpperCase() === 'QA') {
        return (
            <div className="row">
                {aButton("hold", "Hold")}
                {aButton("reopened", "Reopen")}
                {state.has_publish_priv && (aButton("published", "Publish"))}
                {aButton(state.status.toLowerCase(), "Save")}
                {cancelButton()}
            </div>
          )
      }      
    }
  }

  // Cancel button
  cancelButton= (e) => {
    return(<React.Fragment>
        <div className="col-sm">
          <button
              type='button'
              className='btn btn-secondary btn-block'
              onClick={() => props.HandleCancel()}>
              Cancel
          </button>
      </div>
       </React.Fragment>
      )
  }

  // General button
  aButton(state, which_button) {
    return (<React.Fragment>
      <div className="col-sm">
        <button
          type='button'
          className='btn btn-info btn-block'
          disabled={state.submitting}
          onClick={() =>
            handleButtonClick(state)
          }
          data-status={state.status.toLowerCase()}
        >
          {state.submitting && (
            <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {!state.submitting && which_button}
        </button>
        </div>
        </React.Fragment>
      )
  }

  reprocessButton= (e) => {
    return (<React.Fragment>
      <div className="col-sm">
        <button
          type='button'
          className='btn btn-warning btn-block'
          disabled={state.submitting}
          onClick={() =>
            handleReprocess()
          }
          data-status={state.status.toLowerCase()}
        >
          {state.submitting && (
            <FontAwesomeIcon
              className='inline-icon'
              icon={faSpinner}
              spin
            />
          )}
          {!state.submitting && "Reprocess"}
        </button>
        </div>
        </React.Fragment>
      )
  }



  errorClass(error) {
    if (error === "valid") return "is-valid";
    return error.length === 0 ? "" : "is-invalid";
  }

  onChangeGlobusURL= (e) => {
    props.changeLink(state.globus_path, {
      name: state.lab_dataset_id,
      display_doi: state.display_doi,
      doi: state.doi,
    });
  }

 renderOneAssay(val, idx) {
  var idstr = 'dt_' + val.name.toLowerCase().replace(' ','_');

  return (<div className='form-group form-check' key={idstr}>
    <input type='radio' className='form-check-input' name={val.name} key={idstr} id={idstr}

    onChange={handleInputChange} checked={state.data_types.has(val.name)}
    />
    <label className='form-check-label' htmlFor={idstr}>{val.description}</label>
    </div>
         )
    }

  // renderOneAssay(val, idx) {
	 //   let idstr = 'dt_' + val.name.toLowerCase().replace(' ','_');

	 //   return (<div className='form-group form-check'>
		//                 <input type='checkbox' className='form-check-input' name={val.name} id={idstr} key={idstr}
		//                     onChange={handleInputChange} checked={isAssayCheckSet(val.name)}
		//                 />
		//                 <label className='form-check-label' htmlFor={idstr}>{val.description}</label>
		//                 </div>
	 //       )
  //   }

  isAssayCheckSet(assay) {
    ////console.log('isAssayCheckSet',assay)
    try {    
      if (props.editingDataset.data_types) {
        return props.editingDataset.data_types.includes(assay);
      } 
    } catch { }
   }

  renderAssayColumn(min, max) {
	 return (
		state.data_type_dicts.slice(min, max).map((val, idx) =>
								{return renderAssay(val, idx)})
	       )
    }

  renderAssay(val, idx) {
    var idstr = 'dt_' + val.name.toLowerCase().replace(' ','_');
    return (
      <option value={val.name} onChange={handleInputChange} id={idstr}>{val.description}</option>
      )
  }

  renderListAssay(val) {
    return (
      <li>{val}</li>
      )
  }

  renderMultipleAssays= (e) => {
    var arr = Array.from(state.data_types)
    return (
      arr.map((val) =>
          {return renderListAssay(val)})
         )
    }

   
  renderAssayArray= (e) => {
	 if (state.data_type_dicts.length) {
	    var len = state.data_type_dicts.length;

	    //var entries_per_col = Math.ceil(len / 3);
	    //var num_cols = Math.ceil(len / entries_per_col);
      console.log("data_type_dicts", state.data_type_dicts)

      if (state.data_types.size === 1 && state.has_other_datatype) {
        return (<>

        <select className="form-select" value={state.data_types.values().next().value} id="dt_select" onChange={handleInputChange}>
          <option></option>
          {renderAssayColumn(0, len)}
          <option value="other">Other</option>
        </select>

        {state.has_other_datatype && (

                  <div className='form-group'>
                    <input type='text' name='other_dt' id='other_dt'
                         className={"form-control " +
                          errorClass(state.formErrors.other_dt)
                          }
                         placeholder='Other Data Type'
                         value={state.other_dt}
                         onChange={handleInputChange}
                     />
                  </div>
          )}
        </>
       )
      } else if (state.data_types.size === 1 || state.data_types.size === 0) {

  	    return (<>

  		    <select className="form-select" value={state.data_types.values().next().value} id="dt_select" onChange={handleInputChange}>
            <option></option>
            {renderAssayColumn(0, len)}
            <option value="other">Other</option>
          </select>

  		    {state.has_other_datatype && (

                    <div className='form-group'>
                      <input type='text' name='other_dt' id='other_dt'
  			                   className={"form-control " +
  				                  errorClass(state.formErrors.other_dt)
  				                  }
  			                   placeholder='Other Data Type'
  			                   value={state.other_dt}
  			                   onChange={handleInputChange}
  	                   />
                    </div>
  		      )}
          </>
  		   )
      } else if (state.data_types.size > 1) {
        return (<>

          <ul>
            {renderMultipleAssays()}
          </ul>

          </>)
      }

	}
	else {
	    return <h3>Loading assay types...</h3>;
	}
  }    
   
  assay_contains_pii(assay) {
    let assay_val = [...assay.values()][0]   // only one assay can now be selected, the Set() is older code
    console.debug('assay_contains_pii', assay_val)
    for (let i in state.data_type_dicts) {
      let e = state.data_type_dicts[i]

      if (e['name'] === assay_val) {
        console.debug('assay_contains_pii?', e['contains-pii'])
          return e['contains-pii']
      }
    }
    return false
  }

    return (
      <React.Fragment>
        <Paper className="paper-container">
          {FetchDataset()}
        <form>
          <div className='row m-0'>
                <h3 className='float-left mr-1'>
                  <span
                    className={"badge " + state.badge_class}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      showErrorMsgModal(
                        props.editingDataset.pipeline_message
                      )
                    }
                  >
                    {state.status}
                  </span>
                </h3>

            <div className='alert alert-danger' role='alert'>
              <FontAwesomeIcon icon={faUserShield} /> - Do not upload any
              data containing any of the{" "}
              <span
                style={{ cursor: "pointer" }}
                className='text-primary'
                onClick={showModal}
              >
                18 identifiers specified by HIPAA
              </span>
              .
            </div>
            <div className='col-sm-10'>
              <h3>
                {props.editingDataset &&
                  "HuBMAP Dataset ID " +
                    state.display_doi}
              </h3>
            </div>
          </div>

          <div className='row m-0'>
                  <p>
                    <strong>
                      <big>

                        {props.editingDataset &&
                          props.editingDataset.title}
                      </big>
                    </strong>
                  </p>
                </div>
                <div>
                  <p>
                    <strong>
                      <big>
                       
                        {state.globus_path && (

                          <a
                            href={state.globus_path}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                              <FontAwesomeIcon icon={faFolder} data-tip data-for='folder_tooltip'/> To add or modify data files go to the data repository{" "}
                            <FontAwesomeIcon icon={faExternalLinkAlt} />
                          </a>
                        )}
                       
                      </big>
                    </strong>
                  </p>
          </div>

          
          <div className='form-group'>
              {renderSources()}
              
              <Dialog fullWidth={true} maxWidth="lg" onClose={hideLookUpModal} aria-labelledby="source-lookup-dialog" open={state.LookUpShow ? state.LookUpShow : false}>
                <DialogContent>
                  <SearchComponent
                    select={handleSelectClick}
                    custom_title="Search for a Source ID for your Dataset"
                    filter_type="Dataset"
                    modecheck="Source"
                  />
                </DialogContent>  
                <DialogActions>
                  <Button onClick={cancelLookUpModal} color="primary">
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
            {state.writeable && (
                <input
                  type='text'
                  name='lab_dataset_id'
                  id='lab_dataset_id'
                  className={
                    "form-control " +
                    errorClass(state.formErrors.lab_dataset_id)
                  }
                  placeholder='Lab Name or ID'
                  onChange={handleInputChange}
                  value={state.lab_dataset_id}
                />
            )}
            {/* {errorClass(state.formErrors.source_uuid_list) && (
              <div className='alert alert-danger'>
              Lab Name or ID is Required
            </div>
            )} */}
            {!state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{state.lab_dataset_id}</p>
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
            {state.writeable && (
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
                    onChange={handleInputChange}
                    value={state.description}
                  />
                </div>
              </React.Fragment>
            )}
            {!state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{state.description}</p>
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
              {state.writeable && (
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
                      onChange={handleInputChange}
                      value={state.dataset_info}
                    />
                  </div>
                </React.Fragment>
              )}
              {!state.writeable && (
              <div className='col-sm-9 col-form-label'>
                <p>{state.dataset_info}</p>
              </div>
            )}
          </div>
            <div className='form-group row'>
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
              {props.editingDataset && (
                <div className='col-sm-9'>
                  <div className='form-check form-check-inline'>
                    <input
                      className='form-check-input'
                      type='radio'
                      name='contains_human_genetic_sequences'
                      id='contains_human_genetic_sequences_no'
                      value='no'
                      // defaultChecked={true}
                      checked={state.contains_human_genetic_sequences === false && props.editingDataset}
                      onChange={handleInputChange}
                      disabled={props.editingDataset}
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
                      checked={state.contains_human_genetic_sequences  === true && props.editingDataset}
                      onChange={handleInputChange}
                      disabled={props.editingDataset}
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
              {!props.editingDataset && (
                <div className="col-sm-9 ">
                  <div className='form-check form-check-inline'>
                    <input 
                      className={
                        "form-check-input " +
                        errorClass(state.formErrors.contains_human_genetic_sequences)
                      }
                      type='radio'
                      name='contains_human_genetic_sequences'
                      id='contains_human_genetic_sequences_no'
                      value='no'
                      // defaultChecked={true}
                      //checked={state.contains_human_genetic_sequences == false && props.editingDataset}
                      onChange={handleInputChange}
                      //disabled={props.editingDataset}
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
                        errorClass(state.formErrors.contains_human_genetic_sequences)
                      }
                      type='radio'
                      name='contains_human_genetic_sequences'
                      id='contains_human_genetic_sequences_yes'
                      value='yes'
                      //checked={state.contains_human_genetic_sequences  == true && props.editingDataset}
                      onChange={handleInputChange}
                      //disabled={props.editingDataset}
                      //required
                    />
                    <label className='form-check-label' htmlFor='contains_human_genetic_sequences_yes'>
                      Yes
                    </label>
                  </div>
                  <small id='PHIHelpBlock' className='form-text text-muted'>
                    Will this data contain any human genomic sequence data?
                  </small>
                   { errorClass(state.formErrors.contains_human_genetic_sequences) && (
                      <div className='alert alert-danger'>
                      
                      {state.formErrors.contains_human_genetic_sequences}
                    </div>
                   )}
                 
                </div>
              )}

              {/*!state.writeable && (
                <div className='col-sm-9 col-form-label'>
                  <p>{state.contains_human_genetic_sequences}</p>
                </div>
              )*/}
            
            </div>
          
          <div className='form-group row'>
            <label
              htmlFor='description'
              className='col-sm-2 col-form-label text-right'
            >
              Data Type <span className='text-danger'>*</span>
            </label>
            <span>
              <FontAwesomeIcon
                icon={faQuestionCircle}
                data-tip
                data-for='datatype_tooltip'
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
            {state.writeable&& (
		          <React.Fragment>
                <div className='col-sm-9'>
                  <div className='row'>
                      {true && renderAssayArray()}
                  </div>
                </div>
		
                <div className='col-sm-12'>
                {state.formErrors.data_types && (
                  <div className='alert alert-danger'>
                    At least one Data Type is Required.
                  </div>
                )}
                </div>
	             </React.Fragment>
            )}
            {!state.writeable && (
                <div className='col-sm-9'>
                  <div className='row'>
                      {true && renderAssayArray()}
                  </div>
                </div>
            )}
            
          </div>
 
          {state.assay_metadata_status !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='assay_metadata_status'
                className='col-sm-2 col-form-label text-right'
              >
                Assay Metadata Status
              </label>
              <div className='col-sm-9 my-auto'>
                {state.assay_metadata_status === 0 && (
                  <span className='badge badge-secondary'>No metadata</span>
                )}
                {state.assay_metadata_status === 1 && (
                  <span className='badge badge-primary'>Metadata provided</span>
                )}
                {state.assay_metadata_status === 2 && (
                  <span className='badge badge-primary'>Metadata curated</span>
                )}
              </div>
            </div>
          )}
          {state.data_metric_availability !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='data_metric_availability'
                className='col-sm-2 col-form-label text-right'
              >
                Data Metric Availability
              </label>
              <div className='col-sm-9 my-auto'>
                {state.data_metric_availability === 0 && (
                  <span className='badge badge-secondary'>
                    No quality metrics are available
                  </span>
                )}
                {state.data_metric_availability === 1 && (
                  <span className='badge badge-primary'>
                    Quality metrics are available
                  </span>
                )}
              </div>
            </div>
          )}
          {state.data_processing_level !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='data_processing_level'
                className='col-sm-2 col-form-label text-right'
              >
                Data Proccessing Level
              </label>
              <div className='col-sm-9 my-auto'>
                {state.data_processing_level === 0 && (
                  <span className='badge badge-secondary'>
                    Uploaded data. No standardized processing has been performed
                    by the HIVE.
                  </span>
                )}
                {state.data_processing_level === 1 && (
                  <span className='badge badge-primary'>
                    Processing has been performed with a standard HIVE pipeline.
                  </span>
                )}
                {state.data_processing_level === 2 && (
                  <span className='badge badge-primary'>
                    Additional processing has been performed.
                  </span>
                )}
              </div>
            </div>
          )}
          {state.dataset_sign_off_status !== undefined && (
            <div className='form-group row'>
              <label
                htmlFor='dataset_sign_off_status'
                className='col-sm-2 col-form-label text-right'
              >
                Dataset Sign Off Status
              </label>
              <div className='col-sm-9 my-auto'>
                {state.dataset_sign_off_status === 0 && (
                  <span className='badge badge-secondary'>
                    Expert has not signed off on the data
                  </span>
                )}
                {state.dataset_sign_off_status === 1 && (
                  <span className='badge badge-primary'>
                    Expert has signed off on the data
                  </span>
                )}
              </div>
            </div>
          )}
          {state.submit_error && (
            <div className='alert alert-danger col-sm-12' role='alert'>
              Oops! Something went wrong. Please contact administrator for help. <br />
              {state.submitErrorResponse &&(
                <small><strong>Details:</strong> {state.submitErrorResponse}</small>
              )}
            </div>
          )}
          {renderButtons()}
        </form>
        <GroupModal
          show={state.GroupSelectShow}
          hide={hideGroupSelectModal}
          groups={state.groups}
          submit={handleSubmit}
          handleInputChange={handleInputChange}
        />
        <HIPPA show={state.show} handleClose={hideModal} />
        <Modal
          show={state.errorMsgShow}
          handleClose={hideErrorMsgModal}
        >
          <div className='row'>
            <div className='col-sm-12 text-center alert'>
              <h4>
                {(props.editingDataset &&
                  props.editingDataset.status.toUpperCase()) ||
                  "STATUS"}
              </h4>
              <div
                dangerouslySetInnerHTML={{ __html: state.statusErrorMsg }}
              ></div>
            </div>
          </div>
        </Modal>
        </Paper>
      </React.Fragment>
    );
  
}

export default DatasetEdit;
