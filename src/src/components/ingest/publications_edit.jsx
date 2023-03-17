import React, { Component } from "react";
import Paper from "@material-ui/core/Paper";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import Button from "@mui/material/Button";
import Checkbox from '@mui/material/Checkbox';
import { DatePicker } from '@mui/x-date-pickers';

import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Input from '@mui/material/Input';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';

import "../../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner,
  faTrash,
  faPlus,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
//import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
//import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "../uuid/HIPPA.jsx";

import { validateRequired } from "../../utils/validators";
import { faExternalLinkAlt } from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";
import GroupModal from "../uuid/groupModal";
import SearchComponent from "../search/SearchComponent";
import {
  ingest_api_create_publication,
  ingest_api_create_dataset,
  ingest_api_allowable_edit_states,
  ingest_api_dataset_submit,
  ingest_api_dataset_publish,
  ingest_api_users_groups,
  ingest_api_allowable_edit_states_statusless,
} from "../../service/ingest_api";
import {
  entity_api_update_entity,
  entity_api_get_globus_url,
  entity_api_create_entity,
  entity_api_get_entity,
} from "../../service/entity_api";
//import { withRouter } from 'react-router-dom';
import { search_api_get_assay_set } from "../../service/search_api";
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { generateDisplaySubtype } from "../../utils/display_subtypes";

import { Alert, AlertTitle } from "@material-ui/lab";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";

import Box from "@material-ui/core/Box";

import Select from "@material-ui/core/Select";
import Result from '../uuid/result';

// function Alert(props) {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

class PublicationEdit extends Component {
  state = {
    ERIS:"nooo",
    // The Entity Itself
    newForm: this.props.newForm,
    data_types:["publication"],
    dtl_primary: [],
    dtl_all: [],
    selected_dt: "",
    dataset_info: "",
    description: "",
    dataTypeDropdown: [],
    display_doi: "",
    editingSource: [],
    source_uuid_list: [],
    source_uuid_type: "",
    source_uuid: undefined,
    source_uuids: [],
    status: "NEW",
    upload: [],
    writeable: true, 

    editingPublication: this.props.newForm ? {} : this.props.editingPublication,

    // User Privs & Info
    groups: [],
    has_admin_priv: false,
    has_submit_priv: false,
    has_publish_priv: false,
    has_version_priv: false,
    groupsToken: "",

    // Data that sets the scene
    assay_type_primary: true,
    data_type_dicts: this.props.dataTypeList,
    slist: [],

    // Page States
    badge_class: "badge-purple",
    groups_dataprovider: [],
    GroupSelectShow: false,
    lookUpCancelled: false,
    LookUpShow: false,
    other_dt: "",
    buttonSpinnerTarget: "",
    errorSnack: false,
    disableSelectDatatype: false,
    // Form Validation & processing
    newVersion: false,
    previousHID: undefined,
    nextHID: undefined,
    previous_revision_uuid: undefined,
    has_other_datatype: false,
    submitErrorResponse: "",
    submitErrorStatus: "",
    isValidData: true,
    formErrors: {
      title:"",
      issue:"",
      volume:"",
      pages_or_article_num:"",
      description:"",
      lab_dataset_id:"",
      source_uuid_list:"",
      source_uuid:"",
      publication_date:"",
      publication_venue:"",
      publication_doi:"",
      publication_url:"",
      publication_status:"",
    },
    validationStatus: {
      title:"",
      issue:"",
      volume:"",
      pages_or_article_num:"",
      description:"",
      lab_dataset_id: "",
      source_uuid_list: "",
      source_uuid: "",
      publication_date: "",
      publication_venue: "",
      publication_doi: "",
      publication_url: "",
      publication_status: ""
    },
    fieldDescriptons: {
      title:"The title of the publication",
      issue:"The issue number of the journal that it was published in.",
      volume:"The volume number of a journal that it was published in.",
      pages_or_article_num:'The pages or the article number in the publication journal e.g., "23", "23-49", "e1003424.',
      description:"Free text description of the publication",
      lab_dataset_id: "A name or identifier used by the lab who is uploading the data to cross reference the data locally",
      source_uuid_list: "",
      source_uuid: "",
      publication_date: "The date of publication",
      publication_venue: "The venue of the publication, journal, conference, preprint server, etc...",
      publication_doi: "The doi of the publication. (##.####/[alpha-numeric-string])",
      publication_url: "The URL at the publishers server for print/pre-print (http(s)://[alpha-numeric-string].[alpha-numeric-string].[...]",
      publication_status: "if the publication has been published yet or not",
    },
  };

  updateStateDataTypeInfo() {
    let data_types = null;
    let other_dt = undefined;
    if (
      this.props.hasOwnProperty("editingPublication") &&
      this.props.editingPublication &&
      this.props.editingPublication.data_types
    ) {
    }

    this.setState({
      data_types: new Set(this.props.editingPublication.data_types),
      has_other_datatype: other_dt !== undefined,
      other_dt: other_dt,
    });
  }

  componentDidMount() {
    console.debug("PublicationEdit: componentDidMount");
    // @TODO: Better way to listen for off-clicking a modal, seems to trigger rerender of entire page

    console.debug("this.state.validationStatus.publication_doi.length >0", this.state.validationStatus.publication_doi.length >0);
    // Modal state as flag for add/remove?
    document.addEventListener("click", this.handleClickOutside);
    this.setAssayLists();
    var savedGeneticsStatus = undefined;
    try {
      var auth = JSON.parse(localStorage.getItem("info")).groups_token;
      this.setState({ groupsToken: auth });
    } catch {}

    if (localStorage.getItem("info")) {
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
    } else {
      localStorage.setItem("isAuthenticated", false);
    }

    // Figure out our permissions
    // console.debug("CHECK PERM", this.props.editingPublication, this.props.editingPublication.uuid);
    console.debug("CHECK PERM", this.props.editingPublication, this.state.editingPublication);
    if (this.props.editingPublication) {
      if (this.props.editingPublication.uuid)
      // console.debug("Checking Permissions");
        // check to see which buttons to enable
        ingest_api_allowable_edit_states(
          this.props.editingPublication.uuid,
          JSON.parse(localStorage.getItem("info")).groups_token
        ).then((resp) => {
          console.debug("Write Check", resp);
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
              JSON.parse(localStorage.getItem("info")).groups_token
            )
              .then((resp) => {
                //
                this.setState({
                  has_version_priv: resp.results.has_write_priv,
                });
              })
              .catch((err) => {
                this.props.reportError(err);
              });
          }
        })
        .catch((err) => {	
          console.debug("Error Checking Permissions", err);
        });
    } else {
      //
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
      try {
        // use only the first direct ancestor
        this.setState({
          source_uuids: this.props.editingPublication.direct_ancestors,
        });
      } catch {}

      if (this.props.editingPublication === "") {
        savedGeneticsStatus = false;
      } else {
        savedGeneticsStatus =false
      }

      this.setState(
        {
          status: this.props.editingPublication.hasOwnProperty("status")
            ? this.props.editingPublication.status.toUpperCase()
            : "NEW",
          display_doi: this.props.editingPublication.hubmap_id,
          lab_dataset_id: this.props.editingPublication.lab_dataset_id,
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
      // Now tha we've got that all set,
      // Here's the hack that disables changing the datatype
      // if it's no longer a base primary type.
      var dtlStatus = this.props.dtl_status;

      if (dtlStatus) {
        // We are primary type, only priamries in Dropdown
        this.setState({
          disableSelectDatatype: false,
          dataTypeDropdown: this.props.dtl_primary,
        });
      } else {
        // Not primary type, uneditable dropdown should contain all
        this.setState({
          disableSelectDatatype: true,
          dataTypeDropdown: this.props.dtl_all,
        });
      }
      var selected = "";
      if (
        this.props.editingPublication &&
        this.props.editingPublication.data_types &&
        this.props.editingPublication.data_types.length === 1
      ) {
        // Set DT Select by state so it behaves as "controlled"
        selected = this.props.editingPublication.data_types[0];
        //
      }
      this.setState({
        selected_dt: selected,
      });

      // Sets the Hubmap ID labels for Previous and Next version Buttons
      if (this.props.editingPublication.next_revision_uuid) {
        entity_api_get_entity(
          this.props.editingPublication.next_revision_uuid,
          JSON.parse(localStorage.getItem("info")).groups_token
        )
          .then((response) => {
            this.setState({ nextHID: response.results.hubmap_id });
          })
          .catch((error) => {});
      }
      if (this.props.editingPublication.previous_revision_uuid) {
        entity_api_get_entity(
          this.props.editingPublication.previous_revision_uuid,
          JSON.parse(localStorage.getItem("info")).groups_token
        )
          .then((response) => {
            this.setState({ prevHID: response.results.hubmap_id });
          })
          .catch((error) => {});
      }
    }
  }

  setAssayLists() {
    search_api_get_assay_set()
      .then((res) => {
        this.setState({
          dtl_all: res.data.result.map((value, index) => {
            return value.name;
          }),
        });
      })
      .catch((err) => {});
    search_api_get_assay_set("primary")
      .then((res) => {
        this.setState({
          dtl_primary: res.data.result.map((value, index) => {
            return value.name;
          }),
        });
      })
      .catch((err) => {});
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
      GroupSelectShow: false,
    });
  };

  handleLookUpClick = () => {
    if (!this.state.lookUpCancelled) {
      this.setState({
        LookUpShow: true,
      });
    }
    this.setState({
      lookUpCancelled: false,
    });
  };

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false,
    });
  };

  cancelLookUpModal = () => {
    this.setState({
      LookUpShow: false,
      lookUpCancelled: true,
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
    console.debug("handlePublicationStatus",status);
    this.setState(prev => ({
      editingPublication: {
        ...prev.editingPublication,
        publication_status: status
      }
    }))
    
  };

  handleInputChange = (e) => {
    var { id, value, name } = e.target;

    console.debug("handleInputChange",name, id+": "+value);
    // Strugglin to get the ID from the radio group
    var checkName = (name==="publication_status") ? name : id;

    this.setState(prev => ({
      editingPublication: {
        ...prev.editingPublication,
        [checkName]: value
        // [id]: valCap
      }
    }))
    

    // switch (name) {
    //   case "lab_dataset_id":
    //     this.setState({
    //       lab_dataset_id: value,
    //     });
    //     break;
    //   case "description":
    //     this.setState({
    //       description: value,
    //     });
    //     break;
    //   case "publication_venue":
    //     this.setState({
    //       publication_venue: value,
    //     });
    //     break;
    //   case "publication_date":
    //     this.setState({
    //       publication_date: value,
    //     });
    //     break;
    //   case "publication_doi":
    //     this.setState({
    //       publication_doi: value,
    //     });
    //     break;
    //   case "publication_status":
    //     this.setState({
    //       publication_status: value,
    //     });
    //     break;
    //   case "publication_url":
    //     this.setState({
    //       publication_url: value,
    //     });
    //     break;
    //   default:
    //     break;
    // }
    
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
    if (this.state.selectedSource !== selection.row.uuid) {
      this.setState(
        {
          selectedSource: selection.row.uuid,
        },
        () => {
          var slist = this.state.source_uuid_list;
          slist.push(selection.row);
          this.setState({
            source_uuid: selection.row.hubmap_id,
            source_uuid_list: slist,
            slist: slist,
            source_entity: selection.row, // save the entire entity to use for information
            LookUpShow: false,
          });
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

          <TableContainer
            component={Paper}
            style={{ maxHeight: 450 }}
            className={this.errorClass(this.state.formErrors.source_uuid_list)}>
            <Table
              aria-label="Associated Publications"
              size="small"
              className="table table-striped table-hover mb-0">
              <TableHead className="thead-dark font-size-sm">
                <TableRow className="   ">
                  <TableCell> Source ID</TableCell>
                  <TableCell component="th">Submission ID</TableCell>
                  <TableCell component="th">Subtype</TableCell>
                  <TableCell component="th">Group Name</TableCell>
                  <TableCell component="th">Status</TableCell>
                  <TableCell component="th" align="right">
                    Action
                  </TableCell>
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
                      {" "}
                      {row.submission_id && row.submission_id}{" "}
                    </TableCell>
                    <TableCell className="clicky-cell" scope="row">
                      {row.display_subtype}
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
                    <TableCell
                      className="clicky-cell"
                      align="right"
                      scope="row">
                      {this.state.writeable && (
                        <React.Fragment>
                          <FontAwesomeIcon
                            className="inline-icon interaction-icon "
                            icon={faTrash}
                            color="red"
                            onClick={() => this.sourceRemover(row, index)}
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
              <Box className="mt-2 w-100" width="100%" display="flex">
                <Box p={1} className="m-0  text-right" flexShrink={0}>
                  <Button
                    variant="contained"
                    type="button"
                    size="small"
                    className="btn btn-neutral"
                    onClick={() => this.handleLookUpClick()}>
                    Add{" "}
                    {this.state.source_uuids &&
                      this.state.source_uuids.length >= 1 &&
                      "Another"}{" "}
                    Source
                    <FontAwesomeIcon
                      className="fa button-icon m-2"
                      icon={faPlus}
                    />
                  </Button>
                </Box>

                <Box p={1} width="100%">
                  {this.errorClass(this.state.formErrors.source_uuid_list) && (
                    <Alert severity="error" width="100% ">
                      {this.state.formErrors.source_uuid_list}{" "}
                      {this.state.formErrors.source_uuid}
                    </Alert>
                  )}
                </Box>

                {/*  */}
              </Box>
            </React.Fragment>
          )}
        </div>
      );
    } else if (this.state.writeable && this.state.editingPublication) {
    }
  };

  handleNewVersion = () => {
    this.setState({
      newVersion: true,
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

  handleClickOutside = (e) => {
    this.setState({
      showCollectionsDropDown: false,
    });
  };

  handleCancel = () => {
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

  handleButtonClick = (i, event) => {
    console.debug("handleButtonClick", i, event);
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

  handleSubmit = (submitIntention) => {
    
    this.setState({ 
      submitting: true,
      buttonSpinnerTarget: submitIntention, 
    });

    this.validateForm().then((isValid) => {
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
          let data = {
            lab_dataset_id: this.state.editingPublication.lab_dataset_id,
            data_types: ["publication"],
            description: this.state.editingPublication.description,
            title:this.state.editingPublication.title,
            publication_venue:this.state.editingPublication.publication_venue,
            publication_date:this.state.editingPublication.publication_date,
            publication_doi:this.state.editingPublication.publication_doi,
            // publication_status:this.state.editingPublication.publication_status,
            publication_status:pubVal,
            publication_url:this.state.editingPublication.publication_url,
            issue:parseInt(this.state.editingPublication.issue,),
            volume:parseInt(this.state.editingPublication.volume,),
            pages_or_article_num:this.state.editingPublication.pages_or_article_num,
            contains_human_genetic_sequences:false //Holdover from Dataset
          };
          console.debug("data", data);
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
          const config = {
            headers: {
              Authorization:
                "Bearer " +
                JSON.parse(localStorage.getItem("info")).groups_token,
            },
          };

          if (this.props.editingPublication && !this.props.newForm) {
            // If we';re making a new Version
            if (submitIntention === "newversion") {
              // @TODO: Basically repeates what's in the Create fucntionality,
              // and the previous_revision_uuid is added
              data.previous_revision_uuid = this.props.editingPublication.uuid;

              if (this.state.lab_dataset_id) {
                data["lab_dataset_id"] = this.state.lab_dataset_id;
              }
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


            }
            // if user selected Publish
            else if (submitIntention === "published") {
              // From State?
              ingest_api_dataset_publish(
                this.props.editingPublication.uuid,
                this.JSON.stringify(data),
                config
              )
                .then((res) => {
                  this.props.onUpdated(res.data);
                })
                .catch((error) => {
                  this.setState({
                    submit_error: true,
                    submitting: false,
                    submitErrorResponse: error.result.data,
                    buttonSpinnerTarget: "",
                  });
                });
            
            
            
            }else if (submitIntention === "processing") {
              ingest_api_dataset_submit(
                this.props.editingPublication.uuid,
                JSON.stringify(data),
                JSON.parse(localStorage.getItem("info")).groups_token
              )
                .then((response) => {
                  if (response.status < 300) {
                    this.props.onUpdated(response.results);
                  } else {
                    // @TODO: Update on the API's end to hand us a Real error back, not an error wrapped in a 200
                    var statusText =
                      response.err.response.status +
                      " " +
                      response.err.response.statusText;
                    this.setState({
                      submit_error: true,
                      submitting: false,
                      buttonSpinnerTarget: "",
                      submitErrorStatus: statusText,
                      submitErrorResponse: response.err.response.data,
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
                    buttonSpinnerTarget: "",
                  });
                });


                
            } else {
              // just update
              ingest_api_create_dataset(
                this.props.editingPublication.uuid,
                JSON.stringify(data),
                JSON.parse(localStorage.getItem("info")).groups_token
              )
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
                      submitErrorResponse: response,
                      // submitErrorResponse: response.results.statusText,
                      buttonSpinnerTarget: "",
                    });
                  }
                })
                .catch((error) => {
                  this.props.reportError(error);
                  this.setState({
                    submit_error: true,
                    submitting: false,
                    submitErrorResponse: error.result.data,
                    buttonSpinnerTarget: "",
                  });
                });
            }
          } else {
            // new creations

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

            ingest_api_create_publication(
              JSON.stringify(data),
              JSON.parse(localStorage.getItem("info")).groups_token
            )
              .then((response) => {
                console.debug("response", response);
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
                    //
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
          // submitErrorStatus:"There was a problem handling your form, and it is currently in an invalid state. Please review the marked items and try again."
        });
        // Alert("There was a problem handling your form. Please review the marked items and try again.");
      }
    });
  };

  validateProcessor(stateKey, errorMsg) { //data_types

    // var StateName = "ERIS";
    // var stateTarget = this.state[StateName]
    // console.debug("validateProcessor", StateName, stateTarget);

    console.debug("validateProcessor", stateKey, this.state.editingPublication[stateKey]);
    // console.debug(validateRequired(this.state.editingPublication[stateKey]));
    if(!this.state.editingPublication[stateKey] || this.state.editingPublication[stateKey].length ===0) {
      this.setState((prevState) => ({
        validationStatus:  { ...prevState.validationStatus, [stateKey]: errorMsg },
        formErrors: { ...prevState.formErrors, [stateKey]: "is-invalid" },
      }));
      return false;
    } else {
      console.debug("valid", stateKey, this.state.editingPublication[stateKey]);
      this.setState((prevState) => ({
        validationStatus:  { ...prevState.validationStatus, [stateKey]: "" },
        formErrors: { ...prevState.formErrors, [stateKey]: "" },
      }));
      return true;
    }
  
  }

  validateForm() {
    
    return new Promise((resolve, reject) => {
      let isValid =   true;

      var requiredFields = ["title","publication_venue","publication_date","publication_url", "publication_status" ];
      var errorMsg = "Field is Required"
      requiredFields.forEach((field) => {
        if(this.validateProcessor(field, errorMsg) ===  false) {
          isValid = false;
          resolve(isValid);
        }
      });
      
      if(this.state.source_uuid_list.length === 0) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid_list:"is-invalid" },
        }));
        isValid = false;
        resolve(isValid);
      }
       
      
      var intFields = ["issue", "volume"];
      intFields.forEach((field) => {
        if(this.state.editingPublication[field].length >0 && isNaN(this.state.editingPublication[field])) {
          this.setState((prevState) => ({
            validationStatus:  { ...prevState.validationStatus, [field]: "Must be a Number" },
            formErrors: { ...prevState.formErrors, [field]: "is-invalid" },
          }));
          isValid = false;
          resolve(isValid);
        }else{
          this.setState((prevState) => ({
            validationStatus:  { ...prevState.validationStatus, [field]: "" },
            formErrors: { ...prevState.formErrors, [field]: "" },
          }));
        }

        
      });
      
      this.setState({ isValidData: isValid });
      if (!isValid) {
        this.setState({
          submit_error: true,
          submitting: false,
          buttonSpinnerTarget: "",
          submitErrorResponse:toString(this.state.validationStatus),
        });
        var errorSet = this.state.validationStatus;
        console.debug("errorSet", errorSet);
        // var result = Object.keys(errorSet).find((e) => errorSet[e].length);
        // console.debug("result", result);
        
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

  renderButtons() {
    var latestCheck = !this.state.editingPublication.next_revision_uuid ||this.state.editingPublication.next_revision_uuid === undefined;
    var writeCheck = this.state.has_write_priv
    var versCheck = this.state.has_version_priv
    var pubCheck = this.state.editingPublication.status === "Published"

    return (
      <div className="buttonWrapRight">
        {this.renderButtonOverlay()}
        {pubCheck && versCheck && latestCheck && (
          <>{this.renderNewVersionButtons()}</>
        )}
        {!pubCheck && writeCheck && (<>{this.saveButton()}</>)}
        {this.props.newForm && (<>{this.saveButton()}</>)}
        {this.cancelButton()}
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
          {this.state.submitting && this.state.buttonSpinnerTarget==="newversion"(
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
    var next = "";
    var prev = "";

    return (
      <Box sx={{ width: "50%" }}>
        {this.props.editingPublication.next_revision_uuid && (
          <>
            -+Next Version:{" "}
            <Button
              variant="text"
              onClick={() => this.handleVersionNavigate("next")}>
              {" "}
              {this.state.nextHID}
            </Button>
          </>
        )}
        {this.props.editingPublication.previous_revision_uuid && (
          <>
            Previous Version:{" "}
            <Button
              variant="text"
              onClick={() => this.handleVersionNavigate("prev")}>
              {this.state.prevHID}
            </Button>
          </>
        )}
      </Box>
    );
  }

  // Cancel button
  cancelButton() {
    return (
      <Button
        type="button"
        variant="outlined"
        onClick={() => this.handleCancel()}>
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

  // General button
  aButton(newstate, which_button, event) {
    return (
      <React.Fragment>
        <div>
          <Button
            type="button"
            name={"button-" + which_button}
            variant="contained"
            disabled={this.state.submitting}
            onClick={(e) => {
              this.setState(
                {
                  buttonSpinnerTarget: which_button.toLowerCase(),
                },
                () => {
                  //
                }
              );
              this.handleButtonClick(newstate);
            }}
            data-status={newstate.toLowerCase()}
            // data-status={this.state.status.toLowerCase()} This just grabs what the current state is, not the goal state passed in?
          >
            {this.state.buttonSpinnerTarget === which_button.toLowerCase() && (
              <span>
                <FontAwesomeIcon icon={faSpinner} spin />
              </span>
            )}
            {this.state.buttonSpinnerTarget !== which_button.toLowerCase() &&
              which_button}
          </Button>
        </div>
      </React.Fragment>
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

  errorClass(error) {
    console.debug("errorClass", error);
    if (error === "valid") return "is-valid";
    if (error === "invalid" || error === "is-invalid") return "is-invalid";
    if (error && error.length && error.length === 0) return "is-invalid";

    // return error.length === 0 ? "" : "is-invalid";
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
      name: this.state.lab_dataset_id,
      display_doi: this.state.display_doi,
      doi: this.state.doi,
    });
  }

  renderOneAssay(val, idx) {
    var idstr = "dt_" + val.name.toLowerCase().replace(" ", "_");

    return (
      <div className="form-group form-check" key={idstr}>
        <input
          type="radio"
          className="form-check-input"
          name={val.name}
          key={idstr}
          id={idstr}
          onChange={this.handleInputChange}
          checked={this.state.data_types.has(val.name)}
        />
        <label className="form-check-label" htmlFor={idstr}>
          {val.description}
        </label>
      </div>
    );
  }

  isAssayCheckSet(assay) {
    try {
      if (this.props.editingPublication.data_types) {
        return this.props.editingPublication.data_types.includes(assay);
      } else {
        return false;
      }
    } catch {
      return "Error";
    }
  }

  renderAssayColumn(min, max) {
    // Hijacking Select options based on Primary DT status
    if (this.props.dtl_status || this.props.newForm) {
      // true = primary dt, set options to primary
      return this.props.dtl_primary.slice(min, max).map((val, idx) => {
        return this.renderAssay(val, idx);
      });
    } else {
      // false = Not primary DT, set options to full
      return this.props.dtl_all.slice(min, max).map((val, idx) => {
        return this.renderAssay(val, idx);
      });
    }
  }

  renderAssay(val) {
    return (
      <option key={val.name} value={val.name} id={val.name}>
        {val.description}
      </option>
    );
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
    var arr = Array.from(this.state.data_types);
    return arr.map((val) => {
      return this.renderListAssay(val);
    });
  }

  renderAssayArray() {
    var len = 0;
    var dtlistLen = this.state.dataTypeDropdown.length;
    if (this.props.newForm) {
      dtlistLen = this.props.dtl_primary.length;
    }
    if (
      this.props.editingPublication &&
      this.props.editingPublication.data_types
    ) {
      len = this.props.editingPublication.data_types.length;
    } else {
      //console.debug("no editingPublication");
    }

    if (len > 1) {
      return (
        <>
          <ul>{this.renderMultipleAssays()}</ul>
        </>
      );
    } else {
      return (
        <>
          <Select
            native
            name="dt_select"
            className="form-select"
            disabled={
              !this.state.writeable ||
              !this.state.assay_type_primary ||
              this.state.disableSelectDatatype
            }
            value={this.state.selected_dt}
            id="dt_select"
            onChange={this.handleInputChange}>
            <option></option>
            {this.renderAssayColumn(0, dtlistLen)}
          </Select>
        </>
      );
    }
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
              <Alert
                severity="error"
                className="alert alert-danger"
                role="alert">
                <FontAwesomeIcon icon={faUserShield} /> - Do not upload any data
                containing any of the{" "}
                <span
                  style={{ cursor: "pointer" }}
                  className="text-primary"
                  onClick={this.showModal}>
                  18 identifiers specified by HIPAA
                </span>
              </Alert>

              {this.props.editingPublication &&(
                <>{this.renderVersionNav()}</>
              )}

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
                <SearchComponent
                  select={this.handleSelectClick}
                  custom_title="Search for a Source ID for your Publication"
                  filter_type="Publication"
                  modecheck="Source"
                />
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={this.cancelLookUpModal}
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
              fullWidth
              disabled={this.state.readOnly}>
              {/* <InputLabel shrink htmlFor="title">Title*</InputLabel> */}
              <TextField
                required
                error={this.state.validationStatus.title.length >0}
                label="Title"
                helperText={this.state.fieldDescriptons.title}
                variant="standard"
                id="title"
                name="title"
                className={"form-control " +this.errorClass(this.state.formErrors.title) +" "}
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
              fullWidth
              disabled={this.state.readOnly}>
              <TextField
                required
                error={this.state.validationStatus.publication_venue.length >0}
                label="Venue"
                helperText={this.state.fieldDescriptons.publication_venue}
                variant="standard"
                id="publication_venue"
                name="publication_venue"
                className={"form-control " +this.errorClass(this.state.formErrors.publication_venue) +" "}
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
            {/* <DatePicker  value={this.state.editingPublication.publication_date} onChange={(newValue) => this.handleInputChange(newValue)} /> */}
            {/* <label htmlFor="publication_date">
              Publication Date <span className="text-danger">*</span>
              <span>
                <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for="publication_date"
                />
                <ReactTooltip
                  id="publication_date_tooltip"
                  className={"tooltip"}
                  place="top"
                  type="info"
                  effect="solid">
                  <p>Date Of Publication</p>
                </ReactTooltip>
              </span>
            </label>
            {!this.state.readOnly && (
              <div>
                <input
                  ref={this.publication_date}
                  type="text"
                  name="publication_date"
                  id="publication_date"
                  className={
                    "form-control " +
                    this.errorClass(this.state.formErrors.publication_date) +
                    " "
                  }
                  onChange={this.handleInputChange}
                  value={this.state.editingPublication.publication_date}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            )}
            {this.state.readOnly && (
              <div>
                <input
                  type="text"
                  readOnly
                  className="form-control"
                  id="yYYY-MM-DD"
                  value={
                    this.props.editingPublication.publication_date
                  }></input>
              </div>
            )} */}
            <FormControl 
              disabled={this.state.readOnly}>
              <TextField
                InputLabelProps={{ shrink: true }}
                required
                // pattern="\d{4}-\d{2}-\d{2}"
                type="date"
                placeholder="YYYY-MM-DD"
                error={this.state.validationStatus.publication_date.length >0}
                label="Publication Date"
                helperText={this.state.fieldDescriptons.publication_date}
                variant="standard"
                id="publication_date"
                name="publication_date"
                className={"form-control " +this.errorClass(this.state.formErrors.publication_date) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_date}
              />
              {this.state.validationStatus.publication_date.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_date}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* pub Status */}
          <div className="form-gropup mb-4">
            <FormControl error={this.state.validationStatus.publication_status} >
              <FormLabel id="publication_status">Has this Publication been Published?</FormLabel>
              <RadioGroup
                row
                required
                error={this.state.validationStatus.publication_status}
                aria-labelledby="publication_status"
                id="publication_status"
                name="publication_status"
                value={this.state.editingPublication.publication_status}
                className={"form-control " +this.errorClass(this.state.formErrors.publication_status) +" "}
                onChange={this.handleInputChange}>
                <FormControlLabel value={true} control={<Radio />} label="Yes" />
                <FormControlLabel value={false} control={<Radio />} label="No" />
              </RadioGroup>
              {this.state.validationStatus.publication_doi.length >0 && ( 
                <FormHelperText className="component-error-text">{this.state.validationStatus.publication_status}</FormHelperText>
              )}
            </FormControl>
          </div>
          
          {/* pub URL */}
          <div className="form-gropup mb-4">
            <FormControl 
              fullWidth
              disabled={this.state.readOnly}>
              <TextField
                required
                error={this.state.validationStatus.publication_url.length >0}
                label="Publication URL"
                helperText={this.state.fieldDescriptons.publication_url}
                variant="standard"
                id="publication_url"
                name="publication_url"
                className={"form-control " +this.errorClass(this.state.formErrors.publication_url) +" "}
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
              error={this.state.validationStatus.publication_doi.length >0}
              disabled={this.state.readOnly}>
              <TextField
                label="Publication DOI"
                helperText={this.state.fieldDescriptons.publication_doi}
                variant="standard"
                id="publication_doi"
                name="publication_doi"
                className={"form-control " +this.errorClass(this.state.formErrors.publication_doi) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.publication_doi}
              />
              {this.state.validationStatus.publication_doi.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.publication_doi}</FormHelperText>
              )}
            </FormControl>
          </div>

          {/* Issue  */}
          <div className="form-group mb-4">
            <FormControl 
              fullWidth
              disabled={this.state.readOnly}>
              <TextField
                error={this.state.validationStatus.issue.length >0}
                label="Issue"
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                helperText={this.state.fieldDescriptons.issue}
                variant="standard"
                id="issue"
                name="issue"
                className={"form-control " +this.errorClass(this.state.formErrors.issue) +" "}
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
            <FormControl 
                fullWidth
                disabled={this.state.readOnly}>
                <TextField
                  label="Volume"
                  error={this.state.validationStatus.volume.length >0}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  helperText={this.state.fieldDescriptons.volume}
                  variant="standard"
                  id="volume"
                  name="volume"
                  className={"form-control " +this.errorClass(this.state.formErrors.volume) +" "}
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
            <FormControl 
              fullWidth
              disabled={this.state.readOnly}>
              <TextField
                error={this.state.validationStatus.pages_or_article_num.length >0}
                label="Pages or Article Number"
                helperText={this.state.fieldDescriptons.pages_or_article_num}
                variant="standard"
                id="pages_or_article_num"
                name="pages_or_article_num"
                className={"form-control " +this.errorClass(this.state.formErrors.pages_or_article_num) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.pages_or_article_num}
              />
              {this.state.validationStatus.pages_or_article_num.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.pages_or_article_num}</FormHelperText>
              )}
            </FormControl>         
          </div>

          {/* Lab name or ID */}
          <div className="form-group">
            <FormControl 
              fullWidth
              error={this.state.validationStatus.lab_dataset_id.length >0}
              disabled={this.state.readOnly}>
              <TextField
                label="Lab Name or ID"
                helperText={this.state.fieldDescriptons.lab_dataset_id}
                variant="standard"
                id="lab_dataset_id"
                name="lab_dataset_id"
                className={"form-control " +this.errorClass(this.state.formErrors.lab_dataset_id) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.lab_dataset_id}
              />
              {this.state.validationStatus.lab_dataset_id.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.lab_dataset_id}</FormHelperText>
              )}
            </FormControl>  
          </div>
            
          {/* Description / Abstract */}
          <div className="form-group">
          <FormControl 
              fullWidth
              disabled={this.state.readOnly}>
              <TextField
                error={this.state.validationStatus.description.length >0}
                label="Abstract"
                helperText={this.state.fieldDescriptons.description}
                variant="standard"
                id="description"
                name="description"
                multiline
                // rows={4}
                className={"form-control " +this.errorClass(this.state.formErrors.description) +" "}
                onChange={this.handleInputChange}
                value={this.state.editingPublication.description}
              />
              {this.state.validationStatus.description.length >0 && ( 
                <FormHelperText className="component-error-text"> {this.state.validationStatus.description}</FormHelperText>
              )}
            </FormControl>  
          </div>

        
          <div className="row">
            <div className="col-8">
              {this.state.submit_error && (
                <Alert severity="error">
                  {this.state.submitErrorResponse && (
                    <AlertTitle>{this.state.submitErrorStatus}</AlertTitle>
                  )}
                  Oops! Something went wrong. Please contact administrator for
                  help. <br />
                  Details: <strong>{this.state.submitErrorStatus} </strong>{" "}
                  {this.state.submitErrorResponse}
                </Alert>
              )}
            </div>
            <div className="col-4">{this.renderButtons()}</div>
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
      </React.Fragment>
    );
  }
}

export default PublicationEdit;
