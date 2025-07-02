import React,{Component} from "react";
import {
  faExternalLinkAlt,
  faPenToSquare,
  faPlus,
  faQuestionCircle,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ClearIcon from '@mui/icons-material/Clear';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import FormLabel from '@mui/material/FormLabel';
import {GridLoader} from "react-spinners";
import Paper from "@mui/material/Paper";
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from '@mui/material/TextField';
import ReactTooltip from "react-tooltip";
import "../../App.css";
import {
  entity_api_create_entity,
  entity_api_get_entity,
  entity_api_get_these_entities,
  entity_api_get_globus_url,
  entity_api_update_entity,
} from "../../service/entity_api";
import {
  ingest_api_allowable_edit_states,
  ingest_api_allowable_edit_states_statusless,
  ingest_api_create_publication,
  ingest_api_dataset_submit,
  ingest_api_notify_slack,
  ingest_api_users_groups,
} from "../../service/ingest_api";
import {VersionNavigation} from "../../utils/ui_elements";
import SearchComponent from "../search/SearchComponent";
import HIPPA from "../ui/HIPPA.jsx";
import GroupModal from "../uuid/groupModal";
import Modal from "../uuid/modal";
import {getPublishStatusColor} from "../../utils/badgeClasses";
import {removeEmptyValues} from "../../utils/constants_helper";
import {generateDisplaySubtype} from "../../utils/display_subtypes";
import {humanize} from "../../utils/string_helper";

import {styled} from "@mui/material/styles";
const StyledTextField = styled(TextField)`
  textarea {
    resize: both;
  }
`;

// function Alert(props) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class PublicationEdit extends Component {
  state = {
    // The Entity Itself
    newForm: this.props.newForm,
    dataset_type: "publication",
    dtl_primary: [],
    // dtl_all: [],
    selected_dt: "",
    dataset_info: "",
    description: "",
    dataTypeDropdown: [],
    display_doi: "",
    editingSource: [],
    source_uuid_list: [],
    source_uuid_type: "",
    source_uuid: undefined,
    status: "NEW",
    upload: [],
    writeable: true, 
    nextHubIDs: [],
    previousHubIDs: [],

    editingPublication: this.props.newForm ? {publication_status: undefined} : this.props.editingPublication,

    // User Privs & Info
    groups: [],
    has_admin_priv: false,
    has_submit_priv: false,
    has_publish_priv: false,
    has_version_priv: false,
    has_manual_priv: false,
    groupsToken: "",

    // Data that sets the scene
    assay_type_primary: true,
    data_type_dicts: this.props.dataTypeList,
    slist: [],

    // Page States
    showSubmitModal: false,
    badge_class: "badge-purple",
    groups_dataprovider: [],
    GroupSelectShow: false,
    lookUpCancelled: false,
    LookUpShow: false,
    other_dt: "",
    buttonSpinnerTarget: "",
    errorSnack: false,
    disableSelectDatatype: false,
    statusSetLabel: "Reset Status",
    toggleStatusSet: false,

    // Form Validation & processing
    newVersion: false,
    previousHID: undefined,
    nextHID: undefined,
    loadingPreviousVersions: true,
    loadingNextVersions: true,
    versioned: false,
    previous_revision_uuid: undefined,
    has_other_datatype: false,
    submitErrorResponse: "",
    submitErrorStatus: "",
    isValidData: true,
    fieldString: "",
    formErrors: {
      title: "",
      issue: "",
      volume: "",
      pages_or_article_num: "",
      description: "",
      source_uuid_list: "",
      source_uuid: "",
      publication_date: "",
      publication_venue: "",
      publication_doi: "",
      omap_doi: "",
      publication_url: "",
      publication_status: "",
    },
    validationStatus: {
      title: "",
      issue: "",
      volume: "",
      pages_or_article_num: "",
      description: "",
      source_uuid_list: "",
      source_uuid: "",
      publication_date: "",
      publication_venue: "",
      publication_doi: "",
      omap_doi: "",
      publication_url: "",
      publication_status: ""
    },
    fieldDescriptons: {
      title: "The title of the publication",
      issue: "The issue number of the journal that it was published in.",
      volume: "The volume number of a journal that it was published in.",
      pages_or_article_num: 'The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.',
      description: "Free text description of the publication",
      source_uuid_list: "",
      source_uuid: "",
      publication_date: "The date of publication",
      publication_venue: "The venue of the publication, journal, conference, preprint server, etc...",
      publication_doi: "The doi of the publication. (##.####/[alpha-numeric-string])",
      omap_doi: "A DOI pointing to an Organ Mapping Antibody Panel relevant to this publication",
      publication_url: "The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]",
      publication_status: "if the publication has been published yet or not",
    },
    hideUUIDList: true,
    loadUUIDList: true,
    dataset_uuids: [],
    dataset_uuids_string: "",
    sourceBulkError: "",
    sourceBulkWarning: "",
    sourceBulkStatus: "loading",
    fadeInBulkBox: false,
  };

  updateStateDataTypeInfo() {
    let other_dt = undefined;
    if (
      this.props.hasOwnProperty("editingPublication") &&
      this.props.editingPublication &&
      this.props.editingPublication.dataset_type
    ) {
    }

    this.setState({
      // dataset_type: new Set(this.props.editingPublication.dataset_type),
      dataset_type: this.props.editingPublication.dataset_type,
      has_other_datatype: other_dt !== undefined,
      other_dt: other_dt,
    });
  }

  componentDidMount() {
    //consoledebug("PublicationEdit: componentDidMount");
    // @TODO: Better way to listen for off-clicking a modal, seems to trigger rerender of entire page

    //consoledebug("this.state.validationStatus.publication_doi.length >0", this.state.validationStatus.publication_doi.length >0);
    // Modal state as flag for add/remove?
    document.addEventListener("click", this.handleClickOutside);
    // this.setAssayLists();
    var savedGeneticsStatus = undefined;
    try {
      var auth = JSON.parse(localStorage.getItem("info")).groups_token;
      this.setState({ groupsToken: auth });
    } catch {}

    if (localStorage.getItem("info")) {
      // @TODO: Evaluate best practices, pass token to Service from within form
      // Or consider another method for token/service auth handling
      // Configs should /only/ assembed in the service using the passed token for now
    } else {
      localStorage.setItem("isAuthenticated", false);
    }

    if (this.props.editingPublication) {
      
      // Populate the UUID ONLY source list
      let entity = this.props.editingPublication
      let uuidList = []
      let hidList = []
      if(entity.direct_ancestors){
        for (let i = 0; i < entity.direct_ancestors.length; i++) {
          if (entity.direct_ancestors[i].hasOwnProperty("uuid")) {
            console.debug('%c◉ entity.direct_ancestors[i].uuid ', 'color:#00ff7b', entity.direct_ancestors[i].uuid);
            uuidList.push(entity.direct_ancestors[i].uuid)
            hidList.push(entity.direct_ancestors[i].hubmap_id)
          }
        }
        this.setState({
          dataset_uuids: hidList,
          dataset_uuids_string: hidList.join(", ")
         },() => {
        this.setState({
           sourceBulkStatus: "complete",
        })
      })
      }
      
      if(!this.props.editingPublication.previous_revision_uuids){
        this.setState({loadingPreviousVersions: false});
      }
      if(!this.props.editingPublication.next_revision_uuids){
        this.setState({loadingNextVersions: false});
      }

      if (this.props.editingPublication.uuid)
        ingest_api_allowable_edit_states(
          this.props.editingPublication.uuid,
          JSON.parse(localStorage.getItem("info")).groups_token
        ).then((resp) => {
          //consoledebug("Write Check", resp);
          if (resp.status < 300) {
            this.setState({
              writeable: resp.results.has_write_priv,
              has_write_priv: resp.results.has_write_priv,
              has_submit_priv: resp.results.has_submit_priv,
              has_publish_priv: resp.results.has_publish_priv,
              has_admin_priv: resp.results.has_admin_priv,
            });
            ingest_api_allowable_edit_states_statusless(
              this.props.editingPublication.uuid,
              JSON.parse(localStorage.getItem("info")).groups_token)
              .then((resp) => {
                this.setState({
                  has_version_priv: resp.results.has_write_priv,
                });
                if(this.state.has_admin_priv && this.props.editingPublication.status.toUpperCase()!=="PUBLISHED"){
                  this.setState({has_manual_priv: true});
                }
              })
              .catch((err) => {
                this.props.reportError(err);
              });
          }
        })
        .catch(() => {	
          //consoledebug("Error Checking Permissions", err);
        });
    } else {
      setTimeout(() => {
        // Looks janky if it looks like it doesnt even try
        this.setState({ sourceBulkStatus: "complete", });
      }, 1000);
    }

    ingest_api_users_groups(auth)
      .then((res) => {
        const groups = res.results.filter((g) => g.data_provider === true);

        this.setState(
          {
            groups: groups,
            groups_dataprovider: groups,
          },
          () => {}
        );
      })
      .catch((err) => {
        if (err.response && err.response.status === 401) {
          this.props.reportError(err);
          // Rather than reload here, let's have a modal or such
          localStorage.setItem("isAuthenticated", false);
        } else if (err.status) {
          localStorage.setItem("isAuthenticated", false);
        }
      });

    // Sets up the Entity's info  if we're not new here
    if (this.props.editingPublication && !this.props.newForm) {

      if (this.props.editingPublication === "") {
        savedGeneticsStatus = false;
      } else {
        savedGeneticsStatus = false
      }

      this.setState(
        {
          status: this.props.editingPublication.hasOwnProperty("status")
            ? this.props.editingPublication.status.toUpperCase()
            : "NEW",
          display_doi: this.props.editingPublication.hubmap_id,
          source_uuid: this.getSourceAncestor(
            this.props.editingPublication.direct_ancestors
          ),
          source_uuid_list: this.assembleSourceAncestorData(
            this.props.editingPublication.direct_ancestors
          ),
          source_entity: this.getSourceAncestorEntity(
            this.props.editingPublication.direct_ancestors
          ), // Seems like it gets the multiples. Multiple are stored here anyways during selection/editing
          slist: this.getSourceAncestorEntity(
            this.props.editingPublication.direct_ancestors
          ),
          contains_human_genetic_sequences: savedGeneticsStatus,
          description: this.props.editingPublication.description,
          dataset_info: this.props.editingPublication.dataset_info,
          previous_revision_uuid: this.props.editingPublication.hasOwnProperty(
            "previous_revision_uuid"
          )
            ? this.props.editingPublication.previous_revision_uuid
            : undefined,
          errorMsgShow:
            this.props.editingPublication.status.toLowerCase() === "error" &&
              this.props.editingPublication.message
              ? true
              : false,
          statusErrorMsg: this.props.editingPublication.message,
        },
        () => {
          this.setState({
            badge_class: getPublishStatusColor(this.state.status.toUpperCase()),
          });
          entity_api_get_globus_url(
            this.props.editingPublication.uuid,
            this.state.groupsToken
          )
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

      //  NEXT/PREV REVISION LIST BUILD
      if(this.props.editingPublication && this.props.editingPublication.previous_revision_uuids && this.props.editingPublication.previous_revision_uuids.length >0){
        this.setState({versioned: true});
        var pHubIDs= [];
        this.props.editingPublication.previous_revision_uuids.forEach(function(uuid) {
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
              //consoledebug("UUIDCheck",error);
              this.props.reportError(error);
            })
        });
        this.setState({
          previousHubIDs: pHubIDs
        },() => {
          this.setState({loadingPreviousVersions: false});
        })
      }
      // NEXT
      if(this.props.editingPublication && this.props.editingPublication.next_revision_uuids && this.props.editingPublication.next_revision_uuids.length >0){
        this.setState({versioned: true});
        var nHubIDs= [];
        this.props.editingPublication.next_revision_uuids.forEach(function(uuid) {
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
              //consoledebug("UUIDCheck",error);
              this.props.reportError(error);
              nHubIDs.push(uuid)
            })
        });
        this.setState({
          nextHubIDs: nHubIDs
        },() => {
          this.setState({loadingNextVersions: false});
        })
      }
    }
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
  
  showSubmitModal = () => {
    this.setState({ showSubmitModal: true });
  };
  hideSubmitModal = () => {
    this.setState({
      showSubmitModal: false
    });
  };

  showConfirmDialog(row, index) {
    this.setState({
      confirmDialog: true,
      editingSource: row,
      editingSourceIndex: index,
    });
  }
  hideConfirmDialog = () => {
    this.setState({
      confirmDialog: false,
      editingSource: [],
    });
  };

  hideGroupSelectModal = () => {
    this.setState({
      LookUpShow: false,
      GroupSelectShow: false,
      submitting: false,
      buttonSpinnerTarget: "",
    });
  };

  handleLookUpClick = () => {
    if (!this.state.LookUpShow) {
      this.setState({
        LookUpShow: true,
        sourceBulkStatus: "loading",
      });
    }
  };

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false,
      sourceBulkStatus: "complete",
    });
  };
  
  cancelGroupModal = () => {
    this.setState({
      GroupSelectShow: false,
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

  handleDateChange = (date) => {
    this.setState({
      publication_date: date,
    });
  };

  handlePublicationStatus = (status) => {
    //consoledebug("handlePublicationStatus",status, typeof status);
    var pubVal = false;
    if(status === 'true'){pubVal = true}else{pubVal = false}
    this.setState(prev => ({
      editingPublication: {
        ...prev.editingPublication,
        publication_status: pubVal
      }
    }))
    
  };

  handleCloseBulk = (e) => {
    e.preventDefault();
      this.setState({
        hideUUIDList: true,
        fadeInBulkBox: false,
        sourceBulkStatus: "complete",
      })
  }

  handleInputChange = (e) => {
    var { id, value, name } = e.target;
    var checkName = (name==="publication_status") ? name : id;
    if (name==="dataset_uuids_string"){
      let cleanVal = [...new Set(value.split(",").map((item) => item.trim()))];
      cleanVal = removeEmptyValues(cleanVal);
      cleanVal = cleanVal.filter(val => val && val.trim && val.trim() !== "");
      console.debug('%c◉ cleanVal ', 'color:#00ff7b', cleanVal);
      // if(cleanVal.length>0){
      this.setState({
        dataset_uuids_string: value,
        dataset_uuids: value.split(",").map((item) => item.trim())
      })
      // }
      
    }else if(name==="groups"){
      this.setState(prev => ({
        selected_group: value,
        editingPublication: {
          ...prev.editingPublication,
          ["group"]: value
          // [id]: valCap
        }
      }))
    }else{
      if(checkName === "newStatus"){
        this.setState({newStatus: value});
      }else{
        this.setState(prev => ({
          editingPublication: {
            ...prev.editingPublication,
            [checkName]: value
            // [id]: valCap
          }
        }))
      }
    }
   
  };

  handleInputUUIDs = (e) => {
    console.debug('%c◉ e ', 'color:#00ff7b', e);  
    e.preventDefault();
    if(this.state.hideUUIDList){
      this.setState({
        sourceBulkStatus: "loading",
        // Lets make sure the field is freshest BEFORE opening it up
        dataset_uuids_string: this.state.dataset_uuids.join(", ")
      },() => {
        this.setState({
           hideUUIDList: false,
        })
      })
    }else{
      // Lets clear out the previous errors first
      this.setState(prevState => ({
        formErrors: { ...prevState.formErrors, ['source_uuid_list']: "" }, 
        sourceBulkError: "",
        // We still should close up, even if empty
        hideUUIDList: true,
        sourceBulkStatus: "complete"
      }));

      // Ok, we want to Save what's Stored for data in the Table
      let datasetTableRows = this.state.source_uuid_list;
      console.log("datasetTableRows", datasetTableRows);
    
      let cleanList = this.state.dataset_uuids_string.trim().split(", ")

      entity_api_get_these_entities(cleanList)
        .then((response) => {
          console.debug('%c◉ entity_api_get_these_entities response ', 'color:#00ff7b', response);
          let entities = response.results
          let entityDetails = entities.map(obj => obj.results)
          let entityHIDs = entityDetails.map(obj => obj.hubmap_id)
          let errors = (response.badList && response.badList.length > 0) ? response.badList.join(", ") : "";
          this.setState({
            source_uuid_list: entityDetails,
            dataset_uuids: entityHIDs,
            sourceBulkWarning: response.message ? response.message : "",
            sourceBulkError: errors? errors : "",
          },() => {
            this.setState({
              hideUUIDList: true,
              sourceBulkStatus: "complete"
            })
          })
        })
        .catch((error) => {
          console.debug('%c◉ ⚠️ CAUGHT ERROR ', 'background-color:#ff005d', error);
          this.props.reportError(error);
        });
    }
  }

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
    if (this.state.selectedSource !== selection.row.uuid) {
      this.setState({
          selectedSource: selection.row.uuid,
        },() => {
          var slist = this.state.source_uuid_list;
          slist.push(selection.row);
          let dlist = this.state.dataset_uuids;
          dlist.push(selection.row.hubmap_id);
          this.setState((prevState) => ({
            source_uuid: selection.row.hubmap_id,
            source_uuid_list: slist,
            slist: slist,
            source_entity: selection.row, // save the entire entity to use for information
            LookUpShow: false,
            validationStatus: { ...prevState.validationStatus, ['source_uuid_list']: "" },
            formErrors: { ...prevState.formErrors, ['source_uuid_list']: "" },  
            dataset_uuids: dlist,
            dataset_uuids_string: dlist.join(", "),
          },() => {
            setTimeout(() => {
              // Looks janky if it looks like it doesnt even try
              this.setState({ sourceBulkStatus: "complete", });
            }, 2000);
          }));
          
          this.hideLookUpModal();
        }
      );
    } else {
      //
    }
  };

  sourceRemover = (row) => {
    var slist = this.state.source_uuid_list;
    slist = slist.filter((source) => source.uuid !== row.uuid);
    this.setState(
      {
        source_uuid_list: slist,
        slist: slist,
      },
      () => {
        // this.hideConfirmDialog();
      }
    );
  };

  renderSources = () => {
    if (this.state.source_uuid_list || this.props.newForm === false) {
      return (
        <div className="w-100">
          <label htmlFor="source_uuid_list">
            Source(s) <span className="text-danger px-2">*</span>
          </label>
          <FontAwesomeIcon
            icon={faQuestionCircle}
            data-tip
            data-for="source_uuid_tooltip"
          />
          <ReactTooltip
            id="source_uuid_tooltip"
            className="zindex-tooltip"
            place="right"
            type="info"
            effect="solid">
            <p>
              The source tissue samples or data from which this data was
              derived. <br />
              At least <strong>one source </strong>is required, but multiple may
              be specified.
            </p>
          </ReactTooltip>

          <Box sx={{
            position: "relative",
            top: 0,
            transitionProperty: "height",
            transitionTimingFunction: "ease-in",
            transitionDuration: "1s"
            }}> 
              <Box clasName="sourceShade" sx={{
                opacity: this.state.sourceBulkStatus==="loading"?1:0, 
                background: "#444a65", 
                width: "100%", 
                height: "45px", 
                position: "absolute", 
                color: "white", 
                zIndex: 999, 
                padding: "10px", 
                boxSizing: "border-box" ,
                borderRadius: "0.375rem",
                transitionProperty: "opacity",
                transitionTimingFunction: "ease-in",
                transitionDuration: "0.5s"
                }}>
                  <GridLoader size="2px" color="white" width="30px"/> Loading ... 
              </Box> 
              <Box>
                <TableContainer
                  sx={this.state.formErrors.source_uuid_list ? {border: "1px solid red",} : {}}
                  component={Paper}
                  style={{ maxHeight: 450 }}>
                <Table
                  aria-label="Associated Publications"
                  size="small"
                  className="table table-striped table-hover mb-0">
                  <TableHead className="thead-dark font-size-sm">
                    <TableRow className="   ">
                      <TableCell> Source ID</TableCell>
                      <TableCell component="th">Subtype</TableCell>
                      <TableCell component="th">Group Name</TableCell>
                      <TableCell component="th">Status</TableCell>
                      {this.state.writeable && (
                        <TableCell component="th" align="right">
                          Action
                        </TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {this.state.source_uuid_list.map((row, index) => (
                      <TableRow
                        key={row.hubmap_id + "" + index} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data, but want to
                        // onClick={() => this.handleSourceCellSelection(row)}
                        className="row-selection">
                        <TableCell className="clicky-cell" scope="row">
                          {row.hubmap_id}
                        </TableCell>
                        <TableCell className="clicky-cell" scope="row">
                          {row.dataset_type ? row.dataset_type : row.display_subtype}
                        </TableCell>
                        <TableCell className="clicky-cell" scope="row">
                          {row.group_name}
                        </TableCell>
                        <TableCell className="clicky-cell" scope="row">
                          {row.status && (
                            <span
                              className={
                                "w-100 badge " +
                                getPublishStatusColor(row.status, row.uuid)
                              }>
                              {" "}
                              {row.status}
                            </span>
                          )}
                        </TableCell>
                        {this.state.writeable && (
                          <TableCell
                            className="clicky-cell"
                            align="right"
                            scope="row">
                              <React.Fragment>
                                <FontAwesomeIcon
                                  className="inline-icon interaction-icon "
                                  icon={faTrash}
                                  color="red"
                                  onClick={() => this.sourceRemover(row, index)}
                                />
                              </React.Fragment>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
          
          {this.state.writeable && (<>
            <Box className="w-100" width="100%">
              <Collapse
                in={this.state.sourceBulkError.length > 0}
                orientation="vertical">
                <Alert 
                  className="m-0"
                  severity="error" 
                  onClose={() => {this.setState({sourceBulkError: ""})}}>
                  <AlertTitle>Source Selection Error:</AlertTitle>
                  {this.state.sourceBulkError? this.state.sourceBulkError: ""} 
                </Alert>
              </Collapse>
              <Collapse
                in={this.state.sourceBulkWarning.length>0}
                orientation="vertical">
                <Alert severity="warning" className="m-0" onClose={() => {this.setState({sourceBulkWarning: false})}}>
                  <AlertTitle>Source Selection Warning:</AlertTitle>
                  {(this.state.sourceBulkWarning && this.state.sourceBulkWarning.length > 0)? this.state.sourceBulkWarning.split('\n').map(warn => <p>{warn}</p>): ""} 
                </Alert>
              </Collapse>
            </Box>

            <Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
              <Box p={1} className="m-0 text-right" id="bulkButtons" display="inline-flex" flexDirection="row" >
                <Button
                  sx={{maxHeight: "35px",verticalAlign: 'bottom',}}
                  variant="contained"
                  type="button"
                  size="small"
                  className="btn btn-neutral"
                  onClick={() => this.handleLookUpClick()}>
                  Add
                  <FontAwesomeIcon
                    className="fa button-icon m-2"
                    icon={faPlus}
                  />
                </Button>
                <Button
                  sx={{maxHeight: "35px",verticalAlign: 'bottom'}}
                  variant="text"
                  type='link'
                  size="small"
                  className='mx-2'
                  onClick={(event) => this.handleInputUUIDs(event)}>
                  {this.state.hideUUIDList && (<>Bulk</>)}
                  {!this.state.hideUUIDList && (<>UPDATE</>)}
                  <FontAwesomeIcon className='fa button-icon m-2' icon={faPenToSquare}/>
                </Button>
              </Box>
              <Box
                display="flex" 
                flexDirection="row"
                className="m-0 col-9 row"
                sx={{
                  overflowX: "visible",
                  overflowY: "visible",
                  padding: "0px",  
                  maxHeight: "45px",}}>
                <Collapse 
                  in={!this.state.hideUUIDList} 
                  orientation="horizontal" 
                  className="row"
                  width="100%"
                  addEndListener={() => {
                    console.log("fadeInBulkBox",this.state.fadeInBulkBox)
                    this.setState({fadeInBulkBox: true})
                  }}>
                  <Box
                    display="inline-flex"
                    flexDirection="row"
                    sx={{ 
                      overflow: "hidden",
                      width: "650px"}}>
                    <FormControl >
                      <StyledTextField
                        name="dataset_uuids_string"
                        display="flex"
                        id="dataset_uuids_string"
                        error={this.state.formErrors.dataset_uuids_string && this.state.formErrors.dataset_uuids_string.length > 0 ? true : false}
                        multiline
                        inputProps={{ 'aria-label': 'description' }}
                        placeholder="HBM123.ABC.456, HBM789.DEF.789, ..."
                        variant="standard"
                        size="small"
                        fullWidth={true}
                        onChange={(event) => this.handleInputChange(event)}
                        value={this.state.dataset_uuids_string}
                        sx={{
                          overflow: "hidden",
                          marginTop: '10px',
                          verticalAlign: 'bottom',
                          width: "100%",
                        }}/>
                        <FormHelperText id="component-helper-text" sx={{width:"100%", marginLeft:"0px"}}>
                          {"List of Dataset HuBMAP IDs or UUIDs, Comma Seperated " + (this.state.formErrors.dataset_uuids_string && this.state.formErrors.dataset_uuids_string.length > 0 ? " - " + this.state.formErrors.dataset_uuids_string : "")}
                        </FormHelperText>
                    </FormControl>
                    <Button
                      variant="text"
                      type='link'
                      size="small"
                      onClick={(e) => this.handleCloseBulk(e) }>
                      <ClearIcon size="small"/>
                    </Button>
                  </Box>
                </Collapse>
              </Box>
            </Box>
           
          </>
          )}

        </div>
      );
    } else if (this.state.writeable && this.state.editingPublication) {
    }
  };

  handleNewVersion = () => {
    this.setState({
      // newVersion: true,
      buttonSpinnerTarget: "version",
    });
    this.handleSubmit("newversion");
  };

  handleVersionNavigate = (direction) => {
    // @TODO Better process standardizing route navigation between forms
    if (direction === "next") {
      window.history.pushState(
        null,
        "",
        "/publication/" + this.props.editingPublication.next_revision_uuid
      );
    } else {
      window.history.pushState(
        null,
        "",
        "/publication/" + this.props.editingPublication.previous_revision_uuid
      );
    }
    window.location.reload();
  };

  handleAddNewCollection = () => {
    this.setState({
      AddCollectionShow: true,
    });
  };

  handleClickOutside = () => {
    this.setState({
      showCollectionsDropDown: false,
    });
  };

  handleCancelModal = () => {
    if (this.props && this.props.handleCancel) {
      // How is this happening???
      this.props.handleCancel();
    } else {
      window.history.back();
    }
  };

  handleReprocess = () => {
    Alert("Reprocessing feature not implemented");
  };

  handleProcess = () => {
    this.setState({
      // newVersion: true,
      buttonSpinnerTarget: "process",
    });
    this.handleSubmit("process");
  };

  handleButtonClick = (i, event) => {
    //consoledebug("handleButtonClick", i, event);
    if (event) {
    }
    this.setState(
      {
        new_status: i,
        buttonState: {
          i: true,
        },
      },
      () => {
        this.handleSubmit(i);
      }
    );
  };

  handlePublicationSelect = (e) => {
    e.preventDefault();
    // @TODO Better process standardizing route navigation between forms
    window.history.pushState(
      null,
      "",
      "/upload/" + this.props.editingPublication.upload.uuid
    );
    window.location.reload();
  };

  handleStatusSet = () => {
    this.setState({submittingUpdate: true});
    var newStatus = this.state.newStatus;
    entity_api_update_entity(
        this.props.editingPublication.uuid, 
        {"status": newStatus}, 
        JSON.parse(localStorage.getItem("info")).groups_token)
        .then((response) => {
          if (response.status < 300) {
            this.setState({ 
              submit_error: false, 
              submitting: false, 
              submittingUpdate: false,
              });
            this.props.onUpdated(response.results);
          } else {
            this.setState({ 
              submit_error: true, 
              submitting: false, 
              submittingUpdate: false,
              submitErrorResponse: response.results.statusText ? response.results.statusText : response.results.error,
              fieldString: response.results.statusText ? response.results.statusText : response.results.error,
            });
          }
        })
        .catch((error) => {
          this.setState({
            submit_error: true, 
            submitting: false,
            submitErrorResponse: error.toString(),
            fieldString: error.toString(),
          });
        });
  }

  handleSubmit = (submitIntention) => {
    
    this.setState({ 
      submitting: true,
      buttonSpinnerTarget: submitIntention.toLowerCase(), 
    });

    this.validateForm().then((isValid) => {

      // For whatever reason getting the set of invalid fields just Does Not Function in the validateForm func
      // Even though all of the data is there and dev tools SHOWS the state values,  everything else just ignores it because curses or whatever
      if(!isValid){
        console.log("NOTVALID CURR FRM ERR", this.state.formErrors);
        let errorSet = removeEmptyValues(this.state.formErrors);
        let result = Object.keys(errorSet);
        console.debug('%c◉ ERRORSET ', 'color:#ff005d',errorSet, result);
        let fieldString = "";
        for (let r in result) {
          console.debug('%c◉ result r ', 'color:#00ff7b', r, result[r]);
          if(result[r].length >0 ){
            let newString = humanize(result[r]);
            fieldString = fieldString+newString+", ";
            console.log(newString )
          }
        }
        fieldString = fieldString.replace(/,\s*$/, "");
        this.setState({ fieldString: fieldString}); 
      }

      if (isValid) {
        if (
          (!this.props.editingPublication ||
            this.props.editingPublication.length <= 0 ||
            !this.props.editingPublication.uuid) &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
          this.setState({ GroupSelectShow: true });
        } else {
          this.setState({
            GroupSelectShow: false,
            submitting: true,
          });

          // Status gets grabbed as a string not bool,
          // fixes format
          var pubVal = false;
          if(this.state.editingPublication.publication_status === 'true'){pubVal = true}else{pubVal = false}
        
          // package the data up
          var data = {
            description: this.state.editingPublication.description,
            title: this.state.editingPublication.title,
            publication_venue: this.state.editingPublication.publication_venue,
            publication_date: this.state.editingPublication.publication_date,
            publication_doi: this.state.editingPublication.publication_doi,
            omap_doi: this.state.editingPublication.omap_doi,
            // publication_status:this.state.editingPublication.publication_status,
            publication_status: pubVal,
            publication_url: this.state.editingPublication.publication_url,
            issue: parseInt(this.state.editingPublication.issue,),
            volume: parseInt(this.state.editingPublication.volume,),
            pages_or_article_num: this.state.editingPublication.pages_or_article_num,
            contains_human_genetic_sequences: false //Holdover from Dataset
          };
          if(isNaN(data.issue)){delete data.issue}
          if(isNaN(data.volume)){delete data.volume}

          //consoledebug("data", data);
          // throw new Error("TESTIME");
          // get the Source ancestor
          if (
            this.state.source_uuid_list &&
            this.state.source_uuid_list.length > 0
          ) {
            let direct_ancestor_uuid = this.state.source_uuid_list.map((su) => {
              return su.uuid || su.source_uuid;
            });
            if (direct_ancestor_uuid) {
              data["direct_ancestor_uuids"] = direct_ancestor_uuid;
            }
          }

          // Edits, not news
          if (this.props.editingPublication && !this.props.newForm) {

            if (submitIntention === "newversion") {
              // @TODO: Basically repeates what's in the Create fucntionality,
              // and the previous_revision_uuid is added
              data.previous_revision_uuid = this.props.editingPublication.uuid;

              // the group info on a create, check for the defaults
              if (
                this.state.selected_group &&
                this.state.selected_group.length > 0
              ) {
                data["group_uuid"] = this.state.selected_group;
              } else {
                // If none selected, we need to pick a default BUT
                // It must be from the data provviders, not permissions
                data["group_uuid"] = this.state.groups_dataprovider[0].uuid;
              }

              entity_api_create_entity(
                'publication',
                JSON.stringify(data),
                JSON.parse(localStorage.getItem("info")).groups_token
              )
              .then((response) => {
                //consoledebug("NEWVERSION response", response);
                if (response.status < 300) {
                  //
                  this.setState({
                    display_doi: response.results.display_doi,
                  });

                  entity_api_get_globus_url(
                    response.results.uuid,
                    this.state.groupsToken
                  )
                    .then((res) => {
                      this.setState(
                        {
                          globus_path: res.results,
                        },
                        () => {
                          this.props.onCreated({
                            entity: response.results,
                            globus_path: res.results,
                          }); // set as an entity for the Results
                          this.onChangeGlobusURL(
                            response.results,
                            res.results
                          );
                        }
                      );
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
                      submitErrorResponse: response.results.data.error,
                      buttonSpinnerTarget: "",
                    },
                    () => {}
                  );
                }
              })
              .catch((err) => {
                this.setState(
                  {
                    submit_error: true,
                    submitting: false,
                    submitErrorResponse: err,
                    buttonSpinnerTarget: "",
                  },
                  () => {
                    //
                  }
                );
              });
            
            }else if(submitIntention === "submit"){
              //consoledebug("SUBMITTING data", data);
              data.status = "Submitted"
              entity_api_update_entity(this.props.editingPublication.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                  //consoledebug("entity_api_update_entity  SUBMIT response", response);
                    if (response.status < 300 ) {
                      var ingestURL= process.env.REACT_APP_URL+"/publication/"+this.props.editingPublication.uuid
                      var slackMessage = {
                        "message": "Publication has been submitted ("+ingestURL+")"
                      }
                      ingest_api_notify_slack(slackMessage)
                        .then(() => {
                          //consoledebug("slackRes", slackRes);
                          if (response.status < 300) {
                            this.setState({ 
                              submit_error: false, 
                              submitting: false, 
                              });

                              this.props.onUpdated(response.results);
                          } else {
                            this.props.reportError(response);
                          }
                        })
                    } else {
                      //consoledebug("entity_api_update_entity SUBMITNONERR error", response);
                      this.setState({ 
                        submit_error: true, 
                        submitting: false, 
                        // submitErrorResponse:response.results.statusText,
                        submitErrorResponse: response,
                        buttonSpinnerTarget: "" });
                    }
                }) 
                .catch((error) => {
                  //consoledebug("entity_api_update_entity SUBMIT error", error);
                  this.props.reportError(error);
                  this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse: error.result.data,
                    buttonSpinnerTarget: "" 
                  });
                });
            
            }else if(submitIntention === "process"){
              ingest_api_dataset_submit(this.props.editingPublication.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                  .then((response) => {
                    if (response.status < 300) {
                      this.props.onUpdated(response.results);
                    } else {
                      var statusText = "";
                      //consoledebug("err", response, response.error);
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
                        submit_error: true, 
                        submitting: false,
                        buttonSpinnerTarget: "", 
                        submitErrorStatus: statusText,
                        submitErrorResponse: submitErrorResponse ,
                      });
                    }
                })
                .catch((error) => {
                    this.props.reportError(error);
                    this.setState({ 
                      submit_error: true, 
                      submitting: false, 
                      submitErrorResponse: error, 
                      submitErrorStatus: error,
                      buttonSpinnerTarget: "" });
                 });
            }else{
              //consoledebug("UPDATING data", data);
              // just update
              entity_api_update_entity(this.props.editingPublication.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).groups_token)
                .then((response) => {
                    if (response.status < 300 ) {
                      this.setState({ 
                        submit_error: false, 
                        submitting: false, 
                        });
                      this.props.onUpdated(response.results);
                    } else {
                      //consoledebug("entity_api_update_entity NONERR error", response);
                      this.setState({ 
                        submit_error: true, 
                        submitting: false, 
                        // submitErrorResponse:response.results.statusText,
                        submitErrorResponse: response,
                        buttonSpinnerTarget: "" });
                    }
                }) 
                .catch((error) => {
                    //consoledebug("entity_api_update_entity error", error);
                  this.props.reportError(error);
                    this.setState({ 
                    submit_error: true, 
                    submitting: false, 
                    submitErrorResponse: error.result.data,
                    buttonSpinnerTarget: "" });
                  });
            }

          // New, not edits
          }else{
            // the group info on a create, check for the defaults
            if (this.state.selected_group &&this.state.selected_group.length > 0){
              data["group_uuid"] = this.state.selected_group;
            } else {
              // No default here. Unline new versioning. Selection must be made before submit
              data["group_uuid"] = this.state.groups_dataprovider[0].uuid;
            }

            ingest_api_create_publication(
              JSON.stringify(data),
              JSON.parse(localStorage.getItem("info")).groups_token
            )
              .then((response) => {
                //consoledebug("response", response);
                if (response.status < 300) {
                  this.setState({
                    display_doi: response.results.display_doi,
                  });
                  entity_api_get_globus_url(
                    response.results.uuid,
                    this.state.groupsToken
                  )
                    .then((res) => {
                      this.setState({
                          globus_path: res.results,
                        },() => { 
                          this.props.onCreated({
                            entity: response.results,
                            globus_path: res.results,
                          }); // set as an entity for the Results
                          this.onChangeGlobusURL(response.results, res.results);
                        }
                      );
                    })
                    .catch((err) => {
                      if (err.response && err.response.status === 401) {
                        localStorage.setItem("isAuthenticated", false);
                        window.location.reload();
                      }
                    });
                } else {
                  if(response.response.data.error){
                    this.setState({
                        submit_error: true,
                        submitting: false,
                        submitErrorResponse: response.response.data.error,
                        buttonSpinnerTarget: "",
                      },() => {
                        this.props.reportError(response.response.data.error);
                    });
                  }else{
                    this.setState({
                      submit_error: true,
                      submitting: false,
                      submitErrorResponse: "Error Creating Publication",
                      buttonSpinnerTarget: "",
                    },() => {
                      this.props.reportError(response.response.data.error);
                    });
                  }
                }
              })
              .catch((err) => {
                this.setState({
                    submit_error: true,
                    submitting: false,
                    submitErrorResponse: err,
                    buttonSpinnerTarget: "",
                  }, () => {
                    this.props.reportError(err);
                  }
                );
              });
          }
        }
      } else {
        //
        this.setState({
          submit_error: true,
          submitting: false,
          buttonSpinnerTarget: "",
          submitErrorStatus: "There was a problem handling your form, and it is currently in an invalid state. Please review the marked items and try again."
        });
        // Alert("There was a problem handling your form. Please review the marked items and try again.");
      }
    });
  };

  validateProcessor(stateKey, errorMsg) {
    //consoledebug("validateProcessor", stateKey, this.state.editingPublication[stateKey]);
      if(!this.state.editingPublication[stateKey] || this.state.editingPublication[stateKey].length ===0) {
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, [stateKey]: errorMsg },
          formErrors: { ...prevState.formErrors, [stateKey]: "is-invalid" },
        }));
        return false;
      } else {
        //consoledebug("valid", stateKey, this.state.editingPublication[stateKey]);
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, [stateKey]: "" },
          formErrors: { ...prevState.formErrors, [stateKey]: "" },
        }));
        return true;
      }
  } 

  validateForm() {
    
    return new Promise((resolve) => {
      let isValid = true;

      // Check required fields
      // The Processor here will wipe the previosu error, so run it first
      var requiredFields = ["title","publication_venue","publication_date","publication_url","description" ];
      var errorMsg = "Field is Required"
      requiredFields.forEach((field) => {
        if(this.validateProcessor(field, errorMsg) === false) {
          isValid = false;
          resolve(isValid);
        }
      });

      // Because it can be False, pub status needs special handling
      var pubstat = this.state.editingPublication.publication_status;
      //consoledebug({pubstat});
      if(pubstat === undefined || pubstat === null || pubstat.length === 0){
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, ['publication_status']: "Status is Required" },
          formErrors: { ...prevState.formErrors, ['publication_status']: "is-invalid" },
        }));
        isValid = false;
        resolve(isValid);
      }else{
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, ['publication_status']: "" },
          formErrors: { ...prevState.formErrors, ['publication_status']: "" },
        }));
      }
      
      // Check for  at least one Source 
      if(this.state.source_uuid_list.length === 0) {
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, source_uuid_list: "Please select at least one source" },
          formErrors: { ...prevState.formErrors, source_uuid_list: "is-invalid" },
        }));
        isValid = false;
        resolve(isValid);
      }else{
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, 'source_uuid_list': "" },
          formErrors: { ...prevState.formErrors, 'source_uuid_list': "" },
          // Dupes Attached through Search still bug, but The bulk selector filters out dupes and Errored Datasets 
          sourceBulkError: "", 
          sourceBulkWarning: ""
        }));
      }
      
      // Check Int values are ints
      var intFields = ["issue", "volume"];
      intFields.forEach((field) => {
        if(this.state.editingPublication[field] && this.state.editingPublication[field].length >0 && isNaN(this.state.editingPublication[field])) {
          this.setState((prevState) => ({
            validationStatus: { ...prevState.validationStatus, [field]: "Must be a Number" },
            formErrors: { ...prevState.formErrors, [field]: "is-invalid" },
          }));
          isValid = false;
          resolve(isValid);
        }else{
          this.setState((prevState) => ({
            validationStatus: { ...prevState.validationStatus, [field]: "" },
            formErrors: { ...prevState.formErrors, [field]: "" },
          }));
        }
      });

      // is the Source Bulk erroring?
      if(this.state.sourceBulkError && this.state.sourceBulkError.length > 0){
        this.setState((prevState) => ({
          validationStatus: { ...prevState.validationStatus, ['source_uuid_list']: this.state.sourceBulkError },
          formErrors: { ...prevState.formErrors, ['source_uuid_list']: "is-invalid" },
        }));
        isValid = false;
        resolve(isValid);
      }
      
      // Not Resolved invalid, so clear validations
      this.setState({ isValidData: isValid });
      if (!isValid) {
        this.setState({
          submit_error: true,
          submitting: false,
          buttonSpinnerTarget: "",
          submitErrorResponse: toString(this.state.validationStatus),
        });
      }

      resolve(isValid);
    });
  }

  assembleSourceAncestorData(source_uuids) {
    for (var i = 0; i < source_uuids.length; i++) {
      var dst = generateDisplaySubtype(source_uuids[i]);
      source_uuids[i].display_subtype = dst;
    }
    try {
      return source_uuids;
    } catch {
      //
    }
  }

  // only handles one selection at this time
  getSourceAncestor(source_uuids) {
    try {
      return source_uuids[0].hubmap_id; // just get the first one
    } catch {
      //
    }
    return "";
  }

  // only handles one selection at this time
  getSourceAncestorTypes(type) {
    // Give it the type we're looking for
    var ancestorTypes = this.props.editingPublication.direct_ancestors.map(
      (ancestor) => ancestor.entity_type
    );
    //
    return ancestorTypes.includes(type);
  }

  // only handles one selection at this time
  getSourceAncestorEntity(source_uuids) {
    try {
      return source_uuids[0]; // just get the first one
    } catch {
      //
    }
    return "";
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
      if (source_uuids && source_uuids[0] && source_uuids[0].hubmap_id) {
        return source_uuids[0].hubmap_id;
      } else {
        return source_uuids[0];
      }
    }
  }

  renderSubmitModal = () => {
    // @TODO: Drop this into a Modals util (& stay in sync with datasets)
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

  renderButtonOverlay() {
    return (
      // @TODO: Improved form-bottom Control Overlay?
      // <Backdrop
      //   sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      //   open={true}
      // />
      <div className="overlay"></div>
    );
  }

  toggleStatSetView = () => {
    this.setState(prevState => ({
      statusSetLabel: prevState.statusSetLabel === "Reset Status" ? "Cancel" : "Reset Status",
      toggleStatusSet: !prevState.toggleStatusSet
    }));
  };

  renderManualStatusControl=()=>{
    return(  
      <div className="mt-1">
        <Button
          variant="text"
          className="mx-1"
          onClick={this.toggleStatSetView}>
         {this.state.statusSetLabel}
        </Button>
        {this.state.toggleStatusSet && (
          <LoadingButton 
            className="mx-1"
            loading={this.state.submittingUpdate}
            onClick={() => this.handleStatusSet()}
            variant="contained">
            Update
          </LoadingButton>  
          
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
    // @TODO: A lot of the combined checks are redundant 
    // IE (Admins Never Make Entities, so they never load the New forms)
    // Preserving the combos preserves/documents the Business logic, 
    // Let's document it in either comments or a real document ok?
    var latestCheck = !this.state.editingPublication.next_revision_uuid ||this.state.editingPublication.next_revision_uuid === undefined;
    var writeCheck = this.state.has_write_priv
    var adminCheck = this.state.has_admin_priv
    // var versCheck = this.state.has_version_priv
    var pubCheck = this.state.editingPublication.status === "Published"
    var subCheck = this.state.editingPublication.status === "Submitted"
    var newStateCheck = this.state.editingPublication.status === "New"
    var newFormCheck = this.props.newForm

    //consoletable("permMatrix",permMatrix)
    
    return (
      <div className="buttonWrapRight">
        {this.renderButtonOverlay()}
        {/* {pubCheck && versCheck && latestCheck && (
          <>{this.renderNewVersionButtons()}</>
        )} */}
        {(subCheck || newStateCheck) && adminCheck && latestCheck && (
          <>{this.processButton()}</>
        )}
        {writeCheck && !newFormCheck && newStateCheck &&(
          <>
            <Button 
              className="btn btn-primary mr-1" 
              variant="contained"
              onClick={ () => this.showSubmitModal() }>
                Submit
            </Button>
          </>
      )}
        {!pubCheck && writeCheck && (<>{this.saveButton()}</>)}
        {newFormCheck && (<>{this.saveButton()}</>)}
        {this.cancelModalButton()}
      </div>
    );
  }

  renderNewVersionButtons() {
    /*the entity pointed to for at least one dataset.direct_ancestory_uuids is of type sample (ancestor.entity_type == 'Source')
    dataset.status == 'Published'
    user has write access for the dataset.group_uuid/group_name
    dataset.next_revision_uuid is null (or missing altogether)*/
    // var sampleSource = this.getSourceAncestorTypes("Sample"); // Pubs only have dataset ancestors 
    // var datasetStatus = this.props.editingPublication.status === "Published";
    // var writability = true;
    // var writability = this.state.has_version_priv;
    // var latestVersion =
    //   !this.props.editingPublication.next_revision_uuid ||
    //   this.props.editingPublication.next_revision_uuid === undefined;
    // if (datasetStatus && writability && latestVersion) {

    // Checking before even calling this function now
      return (
        <Button
          variant="contained"
          sx={{ minWidth: "130px" }}
          onClick={() => this.handleNewVersion()}>
          {this.state.submitting && this.state.buttonSpinnerTarget==="newversion" && (
            <FontAwesomeIcon className="inline-icon" icon={faSpinner} spin />
          )}
          {!this.state.submitting && (
            <>New Version</>
          )}
        </Button>
      );
    // }
  }

  renderVersionNav() {
    return (VersionNavigation(this.state.previousHubIDs,this.state.nextHubIDs))
  }

  // @TODO: Give the button factory another go;
  // As a service along w/ eventual Permission service?

  // Cancel button
  cancelModalButton() {
    return (
      <Button
        type="button"
        variant="outlined"
        onClick={() => this.handleCancelModal()}>
        Cancel
      </Button>
    );
  }
  // Save button
  saveButton() {
    return (
      <Button
        type="button"
        variant="contained"
        onClick={() => this.handleSubmit("save")}>
        {this.state.buttonSpinnerTarget === "save" && (
          <span>
            <FontAwesomeIcon icon={faSpinner} spin />
          </span>
        )}
        {this.state.buttonSpinnerTarget !=="save" &&
         <>Save</>
        }
      </Button>
    );
  }
  submitButton() {
    return (
      <Button
        type="button"
        variant="contained"
        onClick={() => this.handleSubmit("submit")}>
        {this.state.buttonSpinnerTarget === "submit" && (
          <span>
            <FontAwesomeIcon icon={faSpinner} spin />
          </span>
        )}
        {this.state.buttonSpinnerTarget !=="submit" &&
         <>Submit</>
        }
      </Button>
    );
  }
  reprocessButton() {
    return (
      <React.Fragment>
        <div>
          <Button
            variant="contained"
            type="button"
            disabled={this.state.submitting}
            onClick={() => this.handleReprocess()}
            data-status={this.state.status.toLowerCase()}>
            {this.state.submitting && (
              <FontAwesomeIcon className="inline-icon" icon={faSpinner} spin />
            )}
            {!this.state.submitting && "Reprocess"}
          </Button>
        </div>
      </React.Fragment>
    );
  }
  processButton() {
    return (
      <React.Fragment>
        <div>
          <Button
            variant="contained"
            type="button"
            disabled={this.state.submitting}
            onClick={() => this.handleProcess()}
            data-status={this.state.status.toLowerCase()}>
            {this.state.buttonSpinnerTarget === "process" && (
              <FontAwesomeIcon className="inline-icon" icon={faSpinner} spin />
            )}
            {this.state.buttonSpinnerTarget !=="process" && "Process"}
          </Button>
        </div>
      </React.Fragment>
    );
  }

  errorClass(error) {
    //consoledebug("errorClass", error, e);
    if (error === "valid") return "is-valid";
    else if (error === "invalid" || error === "is-invalid") return "is-invalid";
    else if (error && error.length && error.length === 0) return "is-invalid";
    else return "";

  }

  onChangeGlobusLink(newLink, newPublication) {
    const { name, display_doi, doi } = newPublication;
    this.setState({
      globus_url: newLink,
      name: name,
      display_doi: display_doi,
      doi: doi,
      createSuccess: true,
    });
  }

  onChangeGlobusURL() {
    // REMEMBER the props from the new wrapper / Forms
    // Differs from Main wrapper

    this.props.changeLink(this.state.globus_path, {
      display_doi: this.state.display_doi,
      doi: this.state.doi,
    });
  }

  renderListAssay(val) {
    return <li key={val}>{val}</li>;
  }

  renderStringAssay(val) {
    return { val };
  }

  renderDisabledNonprimaryDT(val) {
    return <li key={val}>{val}</li>;
  }

  renderMultipleAssays() {
    var arr = Array.from(this.state.dataset_type);
    return arr.map((val) => {
      return this.renderListAssay(val);
    });
  }

  assay_contains_pii(assay) {
    let assay_val = [...assay.values()][0]; // only one assay can now be selected, the Set() is older code
    for (let i in this.props.dataTypeList) {
      let e = this.props.dataTypeList[i];
      if (e["name"] === assay_val) {
        return e["contains-pii"];
      }
    }
    return false;
  }

  render() {
    return (
      <React.Fragment>
        <form className="expanded-form">
          <div className="row">
            <div className="col-md-6">
              <h3>
                <span
                  className={"badge " + this.state.badge_class}
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    this.showErrorMsgModal(
                      this.props.editingPublication.pipeline_message
                    )
                  }>
                  {this.state.status}
                </span>

                {this.props.editingPublication && !this.props.newForm && (
                  <span className="mx-1">
                    {" "}
                    HuBMAP Publication ID {this.state.editingPublication.hubmap_id}{" "}
                  </span>
                )}

                {(!this.props.editingPublication || this.props.newForm) && (
                  <span className="mx-1">
                    Registering a Publication 
                  </span>
                )}
              </h3>
              <p>
                <strong>
                  <big>
                    {this.props.editingPublication &&
                      this.props.editingPublication.title}
                  </big>
                </strong>
              </p>

              <p>
                <strong>
                  {this.state.globus_path && (
                    <a
                      href={this.state.globus_path}
                      target="_blank"
                      rel="noopener noreferrer">
                      To add or modify data files go to the data repository
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        style={{ marginLeft: "5px" }}
                      />
                    </a>
                  )}
                </strong>
              </p>
            </div>
            <div className="col-md-6">
           
                <HIPPA />
              {this.props.editingPublication &&
                this.props.editingPublication.upload &&
                this.props.editingPublication.upload.uuid && (
                  <Box sx={{ display: "flex" }}>
                    <Box sx={{ width: "100%" }}>
                      <strong>
                        This Publication is contained in the data Upload{" "}
                      </strong>
                      <Button
                        variant="text"
                        onClick={this.handlePublicationSelect}>
                        {this.props.editingPublication.upload.hubmap_id}
                      </Button>
                    </Box>
                  </Box>
                )}
            </div>
          </div>

          <div className="row"></div>

          <div className="form-group">
            {this.renderSources()}

            <Dialog
              fullWidth={true}
              maxWidth="lg"
              onClose={this.hideLookUpModal}
              aria-labelledby="source-lookup-dialog"
              open={this.state.LookUpShow ? this.state.LookUpShow : false}>
              <DialogContent>
                {/* <SearchComponent
                  select={this.handleSelectClick}
                  custom_title="Search for a Source ID for your Publication"
                  // filter_type="Publication"
                  modecheck="Source"
                  // whitelist="dataset" 
                  restrictions={{ // Disables type selection entierly, vs just hiding options
                    entityType: "dataset"
                  }}
                /> */}
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={this.hideLookUpModal}
                  variant="contained"
                  color="primary">
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </div>

          {/* tITLE */} 
          <div className="form-gropup mb-4">
           
            <FormControl 
              fullWidth>
              {/* <InputLabel shrink htmlFor="title">Title*</InputLabel> */}
              <TextField
                required
                disabled={!this.state.writeable}
                error={this.state.validationStatus.title.length >0}
                label="Title"
                helperText={this.state.fieldDescriptons.title}
                variant="standard"
                id="title"
                name="title"
                //className={"form-control " +this.errorClass(this.state.formErrors.title) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.title}
              />
              {this.state.validationStatus.title.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.title}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Venue */}
          <div className="form-gropup mb-4">
            <FormControl 
              fullWidth>
              <TextField
                required
                disabled={!this.state.writeable}
                error={this.state.validationStatus.publication_venue.length >0}
                label="Venue"
                helperText={this.state.fieldDescriptons.publication_venue}
                variant="standard"
                id="publication_venue"
                name="publication_venue"
                //className={"form-control " +this.errorClass(this.state.formErrors.publication_venue) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_venue}
              />
              {this.state.validationStatus.publication_venue.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_venue}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Pub Date */}
          <div className="form-gropup mb-4">
            <FormControl >
              <TextField
                InputLabelProps={{ shrink: true }}
                required
                disabled={!this.state.writeable}
                // pattern="\d{4}-\d{2}-\d{2}"
                type="date"
                placeholder="YYYY-MM-DD"
                error={this.state.validationStatus.publication_date.length >0}
                label="Publication Date"
                helperText={this.state.fieldDescriptons.publication_date}
                variant="standard"
                id="publication_date"
                name="publication_date"
                //className={"form-control " +this.errorClass(this.state.formErrors.publication_date) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_date}
              />
              {this.state.validationStatus.publication_date.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_date}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* pub Status */}
          <div className={"form-gropup mb-4 "+this.state.formErrors.publication_status}>
            <FormControl
              error={ this.state.validationStatus.publication_status.length>0 ? true : false} >
              <FormLabel 
                id="publication_status"
                error={ this.state.validationStatus.publication_status.length>0 ? true : false }>
                  Has this Publication been Published? *
              </FormLabel>
              <RadioGroup
                row
                required
                disabled={!this.state.writeable}
                error={this.state.validationStatus.publication_status}
                aria-labelledby="publication_status"
                id="publication_status"
                name="publication_status"
                value={this.state.editingPublication.publication_status}
                //className={"form-control " +this.errorClass(this.state.formErrors.publication_status) +" "}
                onChange={this.handleInputChange}>
                <FormControlLabel value={true} className={""+this.state.formErrors.publication_status} error={this.state.validationStatus.publication_status} disabled={!this.state.writeable} control={<Radio />} label="Yes" />
                <FormControlLabel value={false} className={""+this.state.formErrors.publication_status} error={this.state.validationStatus.publication_status} disabled={!this.state.writeable} control={<Radio />} label="No" />
              </RadioGroup>
              {this.state.validationStatus.publication_doi.length >0 && ( 
                <FormHelperText className="component-error-text">{this.state.validationStatus.publication_status}</FormHelperText>
              )}
            </FormControl>
          </div>
          
          {/* pub URL */}
          <div className="form-gropup mb-4">
            <FormControl fullWidth>
              <TextField
                required
                disabled={!this.state.writeable}
                error={this.state.validationStatus.publication_url.length >0}
                label="Publication URL"
                helperText={this.state.fieldDescriptons.publication_url}
                variant="standard"
                id="publication_url"
                name="publication_url"
                //className={"form-control " +this.errorClass(this.state.formErrors.publication_url) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_url}
              />
              {this.state.validationStatus.publication_url.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_url}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Pub DOI */}
          <div className="form-gropup mb-4">
            <FormControl 
              fullWidth
              error={this.state.validationStatus.publication_doi.length >0}>
              <TextField
                disabled={!this.state.writeable}
                label="Publication DOI"
                helperText={this.state.fieldDescriptons.publication_doi}
                variant="standard"
                id="publication_doi"
                name="publication_doi"
                //className={"form-control " +this.errorClass(this.state.formErrors.publication_doi) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_doi}
              />
              {this.state.validationStatus.publication_doi.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_doi}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* OMAP DOI */}
          <div className="form-gropup mb-4"> 
            <FormControl 
              fullWidth>
              <TextField
                disabled={!this.state.writeable}
                error={this.state.validationStatus.omap_doi.length >0}
                label="OMAP DOI"
                helperText={this.state.fieldDescriptons.omap_doi}
                variant="standard"
                id="omap_doi"
                name="omap_doi"
                //className={"form-control " +this.errorClass(this.state.formErrors.omap_doi) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.omap_doi}
              />
              {this.state.validationStatus.omap_doi.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.omap_doi}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Issue  */}
          <div className="form-group mb-4">
            <FormControl>
              <TextField
                error={this.state.validationStatus.issue.length >0}
                label="Issue"
                disabled={!this.state.writeable}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText={this.state.fieldDescriptons.issue}
                variant="standard"
                id="issue"
                name="issue"
                //className={"form-control " +this.errorClass(this.state.formErrors.issue) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.issue}
              />
              {this.state.validationStatus.issue.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.issue}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Volume  */}
          <div className="form-group mb-4">
            <FormControl>
                <TextField
                  label="Volume"
                  disabled={!this.state.writeable}
                  error={this.state.validationStatus.volume.length >0}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  helperText={this.state.fieldDescriptons.volume}
                  variant="standard"
                  id="volume"
                  name="volume"
                  //className={"form-control " +this.errorClass(this.state.formErrors.volume) +" "}
                  onChange={this.handleInputChange}
                  value={this.state.editingPublication.volume}
                />
                {this.state.validationStatus.volume.length >0 && ( 
                  <FormHelperText className="component-error-text"> {this.state.validationStatus.volume}</FormHelperText>
                )}
              </FormControl>
          </div>

          {/* pages_or_article_num  */}
          <div className="form-group mb-4">
            <FormControl>
              <TextField
                disabled={!this.state.writeable}
                error={this.state.validationStatus.pages_or_article_num.length >0}
                label="Pages or Article Number"
                helperText={this.state.fieldDescriptons.pages_or_article_num}
                variant="standard"
                id="pages_or_article_num"
                name="pages_or_article_num"
                //className={"form-control " +this.errorClass(this.state.formErrors.pages_or_article_num) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.pages_or_article_num}
              />
              {this.state.validationStatus.pages_or_article_num.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.pages_or_article_num}</FormHelperText>
              )}
            </FormControl>         
          </div>

          {/* Description / Abstract */}
          <div className="form-group">
          <FormControl fullWidth>
              <TextField
                required
                error={this.state.validationStatus.description.length >0}
                label="Abstract"
                disabled={!this.state.writeable}
                helperText={this.state.fieldDescriptons.description}
                variant="standard"
                id="description"
                name="description"
                multiline
                rows={4}
                //className={"form-control " +this.errorClass(this.state.formErrors.description) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.description}
              />
              {this.state.validationStatus.description.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.description}</FormHelperText>
              )}
            </FormControl>  
          </div>

          <div className="col-8">
            
            {this.state.submit_error && (
              <Alert severity="error" className="mb-2" >
                {this.state.submitErrorResponse && (
                  <AlertTitle>{this.state.submitErrorStatus}</AlertTitle>
                )} <strong>Details:</strong> The following fields are Invalid: {this.state.fieldString} {" "}
                
              </Alert>
            )}
          </div>

          <div className="row">
            <div className="col-8">
              {this.state.has_manual_priv && (
                <>{this.renderManualStatusControl()}</>
              )}
            </div>
            <div className="col-4">{this.renderButtons()}</div>
          </div>
        </form>

        <GroupModal
          show={this.state.GroupSelectShow}
          groups={this.state.groups}
          hide={()=> this.hideGroupSelectModal()}
          submit={() => this.handleSubmit("save")} 
          handleInputChange={this.handleInputChange}
        />
        <Modal
          show={this.state.errorMsgShow}
          handleClose={this.hideErrorMsgModal}>
          <div className="row">
            <div className="col-sm-12 text-center alert">
              <h4>
                {(this.props.editingPublication &&
                  this.props.editingPublication.status &&
                  this.props.editingPublication.status.toUpperCase()) ||
                  "STATUS"}
              </h4>
              <div
                dangerouslySetInnerHTML={{
                  __html: this.state.statusErrorMsg,
                }}></div>
            </div>
          </div>
        </Modal>
        {this.renderSubmitModal()}
      </React.Fragment>
    );
  }
}

export default PublicationEdit;
