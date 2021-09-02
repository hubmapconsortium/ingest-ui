import React, { Component } from "react";
import Paper from '@material-ui/core/Paper';
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@material-ui/core/Button';
import '../../App.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle, faSpinner } from "@fortawesome/free-solid-svg-icons";
import ReactTooltip from "react-tooltip";
//import IDSearchModal from "../uuid/tissue_form_components/idSearchModal";
//import CreateCollectionModal from "./createCollectionModal";
import HIPPA from "../uuid/HIPPA.jsx";
import { truncateString } from "../../utils/string_helper";
import { ORGAN_TYPES} from "../../constants";
import axios from "axios";
import { validateRequired } from "../../utils/validators";
import {
  faUserShield,
  faExternalLinkAlt,
  faSearch, faFolder
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../uuid/modal";
import GroupModal from "../uuid/groupModal";
import SearchComponent from "../search/SearchComponent";
import { ingest_api_allowable_edit_states, ingest_api_create_dataset, ingest_api_dataset_submit } from '../../service/ingest_api';
import { entity_api_update_entity } from '../../service/entity_api';

class DatasetEdit extends Component {
  state = {
    status: "",
    display_doi: "",
  //  doi: "",
    name: "",
    // collection: {
    //   uuid: "",
    //   label: "",
    //   description: "",
    // },
    source_uuid: undefined,
    source_uuid_list: [],
    contains_human_genetic_sequences: undefined,
    description: "",
    source_uuids: [],
    globus_path: "",
    writeable: true,
    has_submit_privs: false,
    has_submit: false,
    lookUpCancelled: false,
    LookUpShow: false,
    GroupSelectShow: false,
  //  is_curator: null,
    source_uuid_type: "",
    data_types: new Set(),
    has_other_datatype: false,
    other_dt: "",
   // is_protected: false,

    groups: [],
    data_type_dicts: [],

    formErrors: {
      name: "",
//      collection: "",
      source_uuid: "",
      data_types: "",
      other_dt: "",
      contains_human_genetic_sequences:""
    },
  };

  updateStateDataTypeInfo() {
    let data_types = null;
    let other_dt = undefined;
    if (this.props.hasOwnProperty('editingDataset')
	       && this.props.editingDataset
	       && this.props.editingDataset.data_types) {
      //////console.log('editingDataset.data_types', this.props.editingDataset.data_types)
      // data_types = JSON.parse(
      //   this.props.editingDataset.data_types
      //     .replace(/'/g, '"')
      //     .replace(/\\"/g, "'")
      // );
      //////console.log('this.state.data_type_dicts', this.state.data_type_dicts)
      const data_type_options = new Set(this.state.data_type_dicts.map((elt, idx) => {return elt.name}));
      //////console.log('data_type_options: ', data_type_options);
      other_dt = this.props.editingDataset.data_types.filter((dt) => !data_type_options.has(dt))[0];
      data_types = this.props.editingDataset.data_types.filter((dt) => data_type_options.has(dt));
      if (other_dt) {
        data_types.push(other_dt);
      }
    }
    this.setState({
      data_types: new Set(data_types),
      has_other_datatype: other_dt !== undefined,
      other_dt: other_dt,
    });
  }
  
  componentDidMount() {
    document.addEventListener("click", this.handleClickOutside);

    console.log('props', this.props)

    if (this.props.editingDataset) {
      if (this.props.editingDataset.uuid)
      // check to see which buttons to enable
       ingest_api_allowable_edit_states(this.props.editingDataset.uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
        .then((resp) => {
        if (resp.status === 200) {
          ////console.log('edit states...', resp.results);
    
          this.setState({
            writeable: resp.results.has_write_priv,
            has_submit: resp.results.has_submit_priv
            });
        }
      });
    }


    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
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

	         this.setState({data_type_dicts: dt_dict});
           //////console.log('set the data_type_dicts from service', dt_dict)
	         this.updateStateDataTypeInfo();
      })
      .catch(error => {
	////console.log(error);
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
        // this.setState({
        //   groups: display_names,
        // });
        const groups = res.data.groups.filter(
          g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID
        );
        this.setState({
          groups: groups
        });
      })
      .catch((err) => {
        if (err.response.status === 401) {
          localStorage.setItem("isAuthenticated", false);
          window.location.reload();
        }
      });

      if (this.props.editingDataset) {
	  
      //let source_uuids;
      try {
        // use only the first direct ancestor
         this.setState({
          source_uuids: this.props.editingDataset.direct_ancestors
        });
        
        //JSON.parse(
        //  this.props.editingDataset.properties.source_uuid.replace(/'/g, '"')
        //);
      } catch {
       // source_uuids = [this.props.editingDataset.properties.source_uuid];
      }
      // this.setState({
      //   is_protected: false,
      // });
      // if (this.props.editingDataset.properties.is_protected) {
      //   this.setState({
      //     is_protected:
      //       this.props.editingDataset.properties.is_protected.toLowerCase() ===
      //       "true"
      //         ? true
      //         : false,
      //   });
      // }

   
      this.updateStateDataTypeInfo();
      var savedGeneticsStatus = undefined;
      if(this.props.editingDataset ==='' ){
        savedGeneticsStatus = undefined;
      }else{
        savedGeneticsStatus = this.props.editingDataset.contains_human_genetic_sequences;
      }
        this.setState(
        {
          status: this.props.editingDataset.status.toUpperCase(),
          display_doi: this.props.editingDataset.hubmap_id,
          //doi: this.props.editingDataset.entity_doi,
          lab_dataset_id: this.props.editingDataset.lab_dataset_id,
          globus_path: "", //this.props.editingDataset.properties.globus_directory_url_path,
          // collection: this.props.editingDataset.properties.collection
          //   ? this.props.editingDataset.properties.collection
          //   : {
          //       uuid: "",
          //       label: "",
          //       description: "",
          //     },
          source_uuid: this.getSourceAncestor(this.props.editingDataset.direct_ancestors),
          source_uuid_list: this.props.editingDataset.direct_ancestors,
          source_entity: this.getSourceAncestorEntity(this.props.editingDataset.direct_ancestors),
          // source_uuid_type: this.props.editingDataset.properties.specimen_type,
          //contains_human_genetic_sequences: this.props.editingDataset.contains_human_genetic_sequences,
          contains_human_genetic_sequences: savedGeneticsStatus,
          description: this.props.editingDataset.description,
          // assay_metadata_status: this.props.editingDataset.properties
          //   .assay_metadata_status,
          // data_metric_availability: this.props.editingDataset.properties
          //   .data_metric_availability,
          // data_processing_level: this.props.editingDataset.properties
          //   .data_processing_level,
          // dataset_sign_off_status: this.props.editingDataset.properties
          //   .dataset_sign_off_status,
          errorMsgShow:
            this.props.editingDataset.status.toLowerCase() ===
              "error" && this.props.editingDataset.message
              ? true
              : false,
          statusErrorMsg: this.props.editingDataset.message,
        },
        () => {
          switch (this.state.status.toUpperCase()) {
            case "NEW":
              this.setState({
                badge_class: "badge-purple",
              });
              break;
            case "REOPENED":
              this.setState({
                badge_class: "badge-purple",
              });
              break;
            case "INVALID":
              this.setState({
                badge_class: "badge-warning",
              });
              break;
            case "QA":
              this.setState({
                badge_class: "badge-info",
              });
              break;
            case "LOCKED":
              this.setState({
                badge_class: "badge-secondary",
              });
              break;
            case "ERROR":
              this.setState({
                badge_class: "badge-danger",
              });
              break;
            case "PUBLISHED":
              this.setState({
                badge_class: "badge-success",
              });
              break;
            case "UNPUBLISHED":
              this.setState({
                badge_class: "badge-light",
              });
              break;
            case "DEPRECATED":
              break;
            default:
              break;
          }

          axios
            .get(
              `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${this.props.editingDataset.uuid}`,
              config
            )
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

  hideGroupSelectModal = () => {
    this.setState({
      GroupSelectShow: false
    });
  };

  handleLookUpClick = () => {
    //////console.debug('IM HERE TRYING TO SHOW THE DIALOG', this.state.source_uuid)
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
    //console.debug('**name', name)
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
        this.setState({ other_dt: value });
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
      //////console.log('ping!', id);
      if (id === "dt_other") {
        const data_types = this.state.data_types;
        this.setState({
          data_types: data_types,
          has_other_datatype: e.target.checked,
        });
        if (!e.target.checked) {
	         const data_type_options = new Set(this.state.data_type_dicts.map((elt, idx) => {return elt.name}));
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
        if (e.target.checked) {
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
        }
      
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
    // ////console.log('handleSelectClick', ids)
    //let id = this.getSourceAncestor(ids);
    //////console.log('Dataset selected', selection.row.uuid)
    var slist = [];
    slist.push({uuid: selection.row.uuid});
    ////console.debug('SLIST', slist)
    this.setState(
      {
        source_uuid: selection.row.hubmap_id, 
        source_uuid_list: slist,
        source_entity: selection.row,  // save the entire entity to use for information
        LookUpShow: false,
      }
    );
      this.cancelLookUpModal();
  };

  // handleSelectClick = (ids) => {
  //   // ////console.log('handleSelectClick', ids)
  //   let id = this.getSourceAncestor(ids);
  //   ////console.log('ive selected', ids)
  //   this.setState(
  //     {
  //       source_uuid: id, 
  //       source_uuid_list: ids,
  //       source_entity: ids[0].entity,  // save the entire entity to use for information
  //       LookUpShow: false,
  //     }
  //   );
  // };

  getUuidList = (new_uuid_list) => {
    //this.setState({uuid_list: new_uuid_list});
    //////console.log('**getUuidList', new_uuid_list)
    this.setState(
      {
        source_uuid: this.getSourceAncestor(new_uuid_list),
        source_uuid_list: new_uuid_list,

        LookUpShow: false,
      },
      () => {
        this.validateUUID();
      }
    );
  };

  handleAddNewCollection = () => {
    this.setState({
      AddCollectionShow: true,
    });
  };

  hideAddCollectionModal = (collection) => {
    this.setState({
      AddCollectionShow: false,
    });

    if (collection.label) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
          "Content-Type": "application/json",
        },
      };

      axios
        .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/collections`, config)
        .then((res) => {
          this.setState(
            {
              collections: res.data.collections,
            },
            () => {
              const ret = this.state.collections.filter((c) => {
                return c.label
                  .toLowerCase()
                  .includes(collection.label.toLowerCase());
              });
              this.setState({ collection: ret[0] });
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
    this.setState({
      showCollectionsDropDown: false,
    });
  };

  validateUUID = () => {
    let isValid = true;
    const uuid = this.state.source_uuid_list[0].hubmap_id
      ? this.state.source_uuid_list[0].hubmap_id
      : this.state.source_uuid_list[0];
    const uuid_type = this.state.source_uuid_list[0].datatype
      ? this.state.source_uuid_list[0].datatype
      : "";
    //const uuid_type = "Not dataset";
    const url_path = uuid_type === "Dataset" ? "datasets" : "specimens";
    const url_server =
      uuid_type === "Dataset"
        ? process.env.REACT_APP_DATAINGEST_API_URL
        : process.env.REACT_APP_SPECIMEN_API_URL;

    // const patt = new RegExp("^.{3}-.{4}-.{3}$");
    // if (patt.test(uuid)) {
    this.setState({
      validatingUUID: true,
    });
    if (true) {
      const config = {
        headers: {
          Authorization:
            "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
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
            this.setState((prevState) => ({
              source_entity: res.data,
              formErrors: { ...prevState.formErrors, source_uuid: "valid" },
            }));
            return isValid;
          } else {
            this.setState((prevState) => ({
              source_entity: null,
              formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
            }));
            isValid = false;
            alert("The Source UUID does not exist.");
            return isValid;
          }
        })
        .catch((err) => {
          this.setState((prevState) => ({
            source_entity: null,
            formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
          }));
          isValid = false;
          alert("The Source UUID does not exist.");
          return isValid;
        })
        .then(() => {
          this.setState({
            validatingUUID: false,
          });
          return isValid;
        });
    } else {
      this.setState((prevState) => ({
        formErrors: { ...prevState.formErrors, source_uuid: "invalid" },
      }));
      isValid = false;
      alert("The Source UUID is invalid.");
      return new Promise((resolve, reject) => {
        resolve(false);
      });
    }
  };

  handleButtonClick = (i) => {
    this.setState({
      new_status: i
    }, () => {
      this.handleSubmit(i);
    })
  };

  handleSubmit = (i) => {
    //////console.log('SUBMIT!!');
    const data_type_options = new Set(this.state.data_type_dicts.map((elt, idx) => {return elt.name}));
    const data_types = this.state.data_types;
    const other_dt = Array.from(data_types).filter(
      (dt) => !data_type_options.has(dt)
    )[0];
    data_types.delete(other_dt);

    //////console.log('submit: data_types',data_types)
    if (this.state.other_dt) {
      const data_types = this.state.data_types;
      data_types.add(this.state.other_dt);
      this.setState({ data_types: data_types });
    }

    //////console.log('submit: moving to validateForm')
    this.validateForm().then((isValid) => {
    
      if (isValid) {
        if (
          !this.props.editingDataset &&
          this.state.groups.length > 1 &&
          !this.state.GroupSelectShow
        ) {
          this.setState({ GroupSelectShow: true });
        } else {
          this.setState({
            GroupSelectShow: false,
            submitting: true,
          });
          this.setState({ submitting: true });
          const state_data_types = this.state.data_types;
          state_data_types.delete("other");
          let data_types = [...state_data_types];
          if (this.state.other_dt !== undefined && this.state.other_dt !== "") {
            data_types = [
              ...data_types,
              this.state.other_dt.replace(/'/g, "\\'"),
            ];
          }

          // package the data up
          let data = {
            lab_dataset_id: this.state.lab_dataset_id,
            //collection_uuid: this.state.collection.uuid,
            contains_human_genetic_sequences: this.state.contains_human_genetic_sequences,
            data_types: data_types,
            description: this.state.description,
            //status: this.state.new_status,
            //is_protected: this.state.is_protected,
          };
  
          ////console.log('SOURCE UUIDS', this.state.source_uuid_list)
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
                JSON.parse(localStorage.getItem("info")).nexus_token
            },
          };
         
          if (this.props.editingDataset) {
            // if user selected Publish
            if (i === "published") {
              let uri = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${this.props.editingDataset.uuid}/publish`;
              axios
                .put(uri, JSON.stringify(data), config)
                .then((res) => {
                  this.props.onUpdated(res.data);
                })
                .catch((error) => {
                  this.setState({ submit_error: true, submitting: false });
                });
            } else if (i === "processing") {
               ////console.log('Submit Dataset...');
                ingest_api_dataset_submit(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                  .then((response) => {
                    if (response.status === 200) {
                      ////console.log(response.results);
                      this.props.onUpdated(response.results);
                    } else {
                      this.setState({ submit_error: true, submitting: false });
                    }
                });
              } else { // just update
                    entity_api_update_entity(this.props.editingDataset.uuid, JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                      .then((response) => {
                          if (response.status === 200) {
                            ////console.log('Update Dataset...');
                             ////console.log(response.results);
                            this.props.onUpdated(response.results);
                          } else {
                            this.setState({ submit_error: true, submitting: false });
                          }
                });
              }
          } else {  // new creations

            if (this.state.lab_dataset_id) {
              data["lab_dataset_id"] = this.state.lab_dataset_id;
            }

            // the group info on a create, check for the defaults
              if (this.state.selected_group && this.state.selected_group.length > 0) {
                data["group_uuid"] = this.state.selected_group;
              } else {
                data["group_uuid"] = this.state.groups[0].uuid; // consider the first users group        
              }

              //////console.log('DATASET TO SAVE', JSON.stringify(data))
              // api_create_entity("dataset", JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
               ingest_api_create_dataset(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
                .then((response) => {
                  if (response.status === 200) {
                    //////console.log('create Dataset...', response.results);
                     this.setState({
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
                    this.setState({
                      globus_path: res.data,
                    }, () => {
                      console.debug('globus_path', res.data)
                      this.props.onCreated({entity: response.results, globus_path: res.data}); // set as an entity for the Results
                      this.onChangeGlobusURL();
                    });
                  })
                  .catch((err) => {
                    ////console.log('ERROR', err)
                    this.setState({
                      globus_path: "",
                      globus_path_tips: "Globus URL Unavailable",
                    });
                    if (err.response && err.response.status === 401) {
                      localStorage.setItem("isAuthenticated", false);
                      window.location.reload();
                    }
                  });
                  } else {
                    this.setState({ submit_error: true, submitting: false });
                  }
              });
          }  //else
        }
      }
    });
  };

  validateForm() {
    return new Promise((resolve, reject) => {
      let isValid = true;

      if (!validateRequired(this.state.source_uuid)) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid: "required" },
        }));
        isValid = false;
        resolve(isValid);
      } else {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, source_uuid: "" },
        }));
        // this.validateUUID().then((res) => {
        //   resolve(isValid && res);
        // });
      }
      
      if (this.state.data_types.size === 0 && this.state.other_dt === "") {
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

      if (this.state.contains_human_genetic_sequences === true ) {
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else if(this.state.contains_human_genetic_sequences === false){
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "" },
        }));
      } else {
        ////console.log("VALID gene is not filled in")
        this.setState((prevState) => ({
          formErrors: { ...prevState.formErrors, contains_human_genetic_sequences: "required" },
        }));
        isValid = false;       
      }
      resolve(isValid);
    });
  }

  // only handles one selection at this time
  getSourceAncestor(source_uuids){
    try {
      return source_uuids[0].hubmap_id;  // just get the first one
    } catch {
    }
    return ""
  }

    // only handles one selection at this time
  getSourceAncestorEntity(source_uuids){
    try {
      return source_uuids[0];  // just get the first one
    } catch {
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
    if (this.props.editingDataset) {
      if (this.state.writeable === false) {
        ////console.log("editing but not writeable",  this.state.writeable)
        return (
          <div className='row'>
            <div className='col-sm-2 offset-sm-10'>
              <button
                type='button'
                className='btn btn-secondary'
                onClick={() => this.props.handleCancel()}
              >
                Close
              </button>
            </div>
          </div>
        );
      } else {
        ////console.log("checking Has submit rights",  this.state.has_submit_privs)
        if (this.state.has_submit_privs) {
            
          if (this.state.status.toUpperCase() === "QA") {
            return (
              <div className='row'>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.status.toLowerCase())
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
                    {!this.state.submitting && "Save"}
                  </button>
                </div>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status='published'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className='col-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("reopened")}
                    data-status={this.state.status.toLowerCase()}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reopen"}
                  </button>
                </div>
                <div className='col-sm-3 text-center'>
                  <button
                    type='button'
                    className='btn btn-dark btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("hold")}
                    data-status='invalid'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Hold"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
            } else if (this.state.status.toUpperCase() === "PUBLISHED") {  // not QA if statement
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("reopened")}
                    data-status='reopened'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Reopen"}
                  </button>
                </div>
                <div className='col-sm-4 text-center'>
                  <button
                    type='button'
                    className='btn btn-danger btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("unpublished")}
                    data-status='unpublished'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Unpublish"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
            } else if (this.state.status.toUpperCase() === "UNPUBLISHED") {  // not PUBLISHED if stmt
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'></div>
                <div className='col-sm-4 text-center'>
                  <button
                    type='button'
                    className='btn btn-primary btn-block'
                    disabled={this.state.submitting}
                    onClick={() => this.handleButtonClick("published")}
                    data-status='published'
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Publish"}
                  </button>
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
            } else {  // not UNPUBLISHED
            return (
              <div className='row'>
                <div className='col-sm-2 offset-sm-10'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Close
                  </button>
                </div>
              </div>
            );
          }
        } else {
          
          if (
            ["NEW", "INVALID", "REOPENED", "ERROR"].includes(
              this.state.status.toUpperCase()
            )
          ) {
          
            return (
              <div className='row'>
                <div className='col-sm-3 offset-sm-2 text-center'>
                  <button
                    type='button'
                    className='btn btn-info btn-block mr-1'
                    disabled={this.state.submitting}
                    onClick={() =>
                      this.handleButtonClick(this.state.status.toLowerCase())
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
                    {!this.state.submitting && "Save"}
                  </button>
                </div>
                <div className='col-sm-4 text-center'>
                  {this.state.has_submit && (
                    <button
                      type='button'
                      className='btn btn-primary btn-block'
                      disabled={this.state.submitting}
                      onClick={() => this.handleButtonClick("processing")}
                      data-status={this.state.status.toLowerCase()}
                    >
                      {this.state.submitting && (
                        <FontAwesomeIcon
                          className='inline-icon mr-1'
                          icon={faSpinner}
                          spin
                        />
                      )}
                      {!this.state.submitting && "Submit"}
                    </button>
                  )}
                </div>
                <div className='col-sm-2 text-right'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          } else {
            return (
              <div className='row'>
                <div className='col-sm-2 offset-sm-10'>
                  <button
                    type='button'
                    className='btn btn-secondary'
                    onClick={() => this.props.handleCancel()}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            );
          }
        }
      }
    } else {  // buttons for a new record
    
      return (

        <div className='row'>
          <div className="col-sm-12">
          <Divider />
          </div>
          <div className='col-md-12 text-right pads'>
            <button
              type='button'
              className='btn btn-primary mr-1'
              disabled={this.state.submitting}
              onClick={() => this.handleButtonClick("new")}
              data-status='new'
            >
              {this.state.submitting && (
                <FontAwesomeIcon
                  className='inline-icon'
                  icon={faSpinner}
                  spin
                />
              )}
              {!this.state.submitting && "Create"}
            </button>
             <button
              type='button'
              className='btn btn-secondary'
              onClick={() => this.props.handleCancel()}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
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
    <input type='checkbox' className='form-check-input' name={val.name} key={idstr} id={idstr}
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
      } 
    } catch { }
   }

  renderAssayColumn(min, max) {
	 return (<div>
		{this.state.data_type_dicts.slice(min, max).map((val, idx) =>
								{return this.renderOneAssay(val, idx)})}</div>
	       )
    }
    
  renderAssayArray() {
	 if (this.state.data_type_dicts.length) {
	    var len = this.state.data_type_dicts.length;
	    var entries_per_col = Math.ceil(len / 3);
	    //var num_cols = Math.ceil(len / entries_per_col);
	    return (<>
		    <div className='col-sm-4'> {this.renderAssayColumn(0, entries_per_col)} </div>
		    <div className='col-sm-4'> {this.renderAssayColumn(entries_per_col, 2*entries_per_col)} </div>
		    <div className='col-sm-4'> {this.renderAssayColumn(2*entries_per_col, len+1)}
		    <div className='form-group form-check'>
                        <input
                          type='checkbox'
                          className='form-check-input'
                          name='dt_other'
                          id='dt_other'
                          onChange={this.handleInputChange}
                          checked={this.state.has_other_datatype}
                        />
                        <label className='form-check-label' htmlFor='dt_other'>
                          Other
                        </label>
                      </div>
		    {this.state.has_other_datatype && (
                  <div className='form-group'>
                    <input type='text' name='other_dt' id='other_dt'
			                   className={"form-control " +
				                  this.errorClass(this.state.formErrors.other_dt)
				                  }
			                   placeholder='Other Data Type'
			                   value={this.state.other_dt}
			                   onChange={this.handleInputChange}
	                   />
                  </div>
		      )}
		  </div>
		    </>
		   )
	}
	else {
	    return <h3>Loading assay types...</h3>;
	}
    }    
    
  // renderCollection() {
  //   if(this.state.collection)
  // }

    render() {
    return (
      <React.Fragment>
        <Paper className="paper-container">
        <form>
          <div>
            <div className='row mt-3 mb-3'>
              <div className='col-sm-2'>
                <h3 className='float-right'>
                  <span
                    className={"badge " + this.state.badge_class}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      this.showErrorMsgModal(
                        this.props.editingDataset.pipeline_message
                      )
                    }
                  >
                    {this.state.status}
                  </span>
                </h3>
              </div>
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
              <div className='col-sm-10'>
                <h3>
                  {this.props.editingDataset &&
                    "HuBMAP Dataset ID " +
                      this.state.display_doi}
                </h3>
                <div>
                  <p>
                    <strong>
                      <big>
                       
                        {this.state.globus_path && (

                          <a
                            href={this.state.globus_path}
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
              </div>
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
                      this.errorClass(this.state.formErrors.name)
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
                htmlFor='source_uuid'>
                Source ID <span className='text-danger px-2'>*</span>
              </label>
               <FontAwesomeIcon
                  icon={faQuestionCircle}
                  data-tip
                  data-for='source_uuid_tooltip'
                />
                <ReactTooltip
                  id='source_uuid_tooltip'
                  place='top'
                  type='info'
                  effect='solid'
                >
                  <p>
                    The HuBMAP Unique identifier of the direct origin entity,
                    <br />
                    other sample or doner, where this sample came from.
                  </p>
                </ReactTooltip>
              {this.state.writeable && (
                <React.Fragment>
                   <div className="input-group">
                    <input
                      type='text'
                      name='source_uuid'
                      id='source_uuid'
                      className={
                        "form-control " +
                        this.errorClass(this.state.formErrors.source_uuid)
                      }
                      value={this.state.source_uuid}
                      onChange={this.handleInputChange}
                      onFocus={this.handleLookUpClick}
                      autoComplete='off'
                    />      
                    <button
                      className='btn btn-outline-secondary'
                      type='button'
                      onClick={this.handleLookUpClick}
                    >
                       <FontAwesomeIcon
                          icon={faSearch}
                          data-tip
                          data-for="source_uuid_tooltip"
                      />
                    </button>
                  </div>
                  {/*
                   <Modal show={this.state.LookUpShow} handleClose={this.hideLookUpModal} scrollable={true}>
                    <SearchComponent
                      select={this.handleSelectClick}
                      custom_title="Search for a Source ID for your Dataset"
                      filter_type="Dataset"
                    />
                   </Modal>
                    */}
                    <Dialog fullWidth={true} maxWidth="lg" onClose={this.hideLookUpModal} aria-labelledby="source-lookup-dialog" open={this.state.LookUpShow}>
                     <DialogContent>
                    <SearchComponent
                      select={this.handleSelectClick}
                      custom_title="Search for a Source ID for your Dataset"
                      filter_type="Dataset"
                      modecheck="Source"
                    />
                    </DialogContent>
                     <DialogActions>
                      <Button onClick={this.cancelLookUpModal} color="primary">
                        Close
                     </Button>
                    </DialogActions>
                   </Dialog>
                </React.Fragment>
              )}
              {!this.state.writeable && (
                <React.Fragment>
                  <div className='col-sm-9 col-form-label'>
                    <p>{this.state.source_uuid}</p>
                  </div>{" "}
                </React.Fragment>
              )}
             
            </div>
            {this.state.source_entity && (   // this is the description box for source info
              <div className='form-group row'>
                <div className='col-sm-7 offset-sm-2'>
                  <div className='card'>
                    <div className='card-body'>
                      
                      <div className='row'>
                        <div className='col-sm-6'>
                          <b>Source Type:</b>{" "}
                          {this.state.source_entity.entity_type}
                        </div>
            
                        {this.state.source_entity.specimen &&
                          this.state.source_entity.specimen.specimen_type ===
                            "organ" && (
                            <div className='col-sm-12'>
                              <b>Organ Type:</b>{" "}
                              {this.state.source_entity.specimen &&
                                ORGAN_TYPES[
                                  this.state.source_entity.organ
                                ]}
                            </div>
                          )}
                      
                        {this.state.source_entity.submission_id && (
                            <div className="col-sm-12">
                              <b>Submission ID:</b>{" "}{this.state.source_entity.submission_id}
                            </div>
                        )}
                        {this.state.source_entity.lab_tissue_sample_id && (
                            <div className="col-sm-12">
                                <b>Lab Sample ID: </b>{" "}
                                {this.state.source_entity.lab_tissue_sample_id}     
                            </div>
                          )}
                        
                            {this.state.source_entity.group_name && (
                            <div className="col-sm-12">
                                <b>Group Name: </b>{" "}
                                {this.state.source_entity.group_name}
                            </div>
                          )}
                          {this.state.source_entity.description && (
                            <div className="col-sm-12">
                              <p>
                                <b>Description: </b>{" "}
                                {truncateString(this.state.source_entity.description, 230)}
                              </p>
                            </div>
                          )}

                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
              <div className='col-sm-9 col-form-label'>
                <p>{this.state.description}</p>
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
                      disabled={this.props.editingDataset}
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
                      disabled={this.props.editingDataset}
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
                    Will this data contain any human genomic sequence data?
                  </small>
                   { this.errorClass(this.state.formErrors.contains_human_genetic_sequences) && (
                      <div className='alert alert-danger'>
                      Genomic Sequences indicator is Required
                    </div>
                   )}
                 
                </div>
              )}

              {/*!this.state.writeable && (
                <div className='col-sm-9 col-form-label'>
                  <p>{this.state.contains_human_genetic_sequences}</p>
                </div>
              )*/}
            
            </div>
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
        {this.state.writeable&& (
		        <React.Fragment>
                <div className='col-sm-9'>
                <div className='row'>
		                {true && this.renderAssayArray()}
                </div>
                </div>
		
                <div className='col-sm-12'>
                {this.state.formErrors.data_types && (
			             <p className='text-danger'>
                        At least select one data type
                  </p>
                )}
                </div>
	             </React.Fragment>
            )}
            {!this.state.writeable && (
                <div className='col-sm-9'>
                <div className='row'>
                    {true && this.renderAssayArray()}
                </div>
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
          {this.state.submit_error && (
            <div className='alert alert-danger col-sm-12' role='alert'>
              Oops! Something went wrong. Please contact administrator for help.
            </div>
          )}
          {this.renderButtons()}
        </form>
        <GroupModal
          show={this.state.GroupSelectShow}
          hide={this.hideGroupSelectModal}
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
                {(this.props.editingDataset &&
                  this.props.editingDataset.status.toUpperCase()) ||
                  "STATUS"}
              </h4>
              <div
                dangerouslySetInnerHTML={{ __html: this.state.statusErrorMsg }}
              ></div>
            </div>
          </div>
        </Modal>
        </Paper>
      </React.Fragment>
    );
  }
}

export default DatasetEdit;
