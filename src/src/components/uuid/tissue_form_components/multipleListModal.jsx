import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
//import CheckIcon from '@material-ui/icons/Check';
import { Link } from 'react-router-dom';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner, 
  faCheck
} from "@fortawesome/free-solid-svg-icons";
// import RUIModal from './ruiModal';
// import check from './check25.jpg';
import Modal from "../modal";
import axios from "axios";
import Forms from "../forms";

import Grid from '@material-ui/core/Grid';
import TissueForm from './tissueForm';
import { entity_api_get_entity, 
    entity_api_update_entity, 
    entity_api_create_entity,
    entity_api_create_multiple_entities, 
    entity_api_get_entity_ancestor 
} from '../../../service/entity_api';
import { ingest_api_allowable_edit_states } from '../../../service/ingest_api';
import { truncateString, parseErrorMessage } from "../../../utils/string_helper";

class MultipleListModal extends Component {

  state = {
    multiples: [],
    checked: false,
    edit_uuid: "",
    submitting: false,
    formType: "sample",
    editingEntity: "",
    updateSuccess: false,
    readOnly: true,
    currentEditList: "",
    error_message_detail: "",
    error_message: "Oops! Something went wrong. Please contact administrator for help."
  };

  constructor(props) {
    super(props);
    // create a ref to store the file Input DOM element   
    //this.protocolFile = React.createRef();
    //this.protocol = React.createRef();
    // this.handleSavedLocations = this.handleSavedLocations.bind(this);

// loop through ids and add a check indicator for ui/list box
    let new_multi = []
    this.props.ids.forEach( element => {
      element.checked = false;

      new_multi.push(element);
    })
    
    console.debug(new_multi)
     this.setState({
        multiples: new_multi
    });
   
  }

  componentDidMount() {

    console.log('MultipleListModal', this.props)

    const first_lab_id = this.props.ids[0].submission_id; 
    const last_lab_id = this.props.ids[this.props.ids.length-1].submission_id; 
    this.setState({
        submitting: false, 
        multiMessage: `${this.props.ids.length} samples added ${first_lab_id} through ${last_lab_id}`
    });
    
  }

  handleClose = e => {
    // this.setState({
    //   rui_show: false,
    //   rui_hide: true
    // });
  };

  handleOnUpdate = () => {
    console.debug('UPDATE Complete', this.state.currentEditList)
    
    // let cbs = document.getElementById("cb_"+this.state.currentEditList.uuid);
    // cbs.checked = true;

    // console.debug('CHECK BOX', cbs)
    let m = this.setCheckIndicator(this.state.currentEditList.uuid, true);
    console.debug('STATUS', m);
    
    setTimeout(() => {
    
      this.setState({
        updateSuccess: true,
        editingEntity: null,
        checked: true,
        multiples: m
      });


    }, 5000);
  }

  handleEdit = (selected) => {
    console.debug('handleEdit', selected);
    this.setState ({
      currentEditList: selected
    });
    this.editForm(selected.uuid);  
  };

  handleInputKeyPress = () => {
    console.log("Press");
  }

  setCheckIndicator = (uuid, status) => {
    let m = [];
    this.state.multiples.forEach((item,index)=> {
      console.debug('setCheckIndicator ITEM', item)
      if(item.uuid == uuid ) {
        item.checked = status;
      }
      m.push(item);
    });
    console.debug('setCheckIndicator', m);
    return m;
  }

  editForm = (uuid) => {
    console.debug('in the editForm')
    
    entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      if (response.status === 200) {
        this.setState({
              edit_uuid: response.results.uuid,
              editingEntity: response.results,
              });
        // check to see if user can edit
        ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
          .then((resp) => {
          if (resp.status === 200) {

            let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
            this.setState({ 
              readOnly: read_only_state,   // used for hidding UI components 
              });
        //this.props.onEdit();

          } else if (resp.status === 400) {
            this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(resp.results) });
          } 
        });
      } else if (response.status === 400) {
          this.setState({ submit_error: true, submitting: false, error_message_detail: parseErrorMessage(response.results) });
        } 
    });
  };

  render() {
    return (
        <div className='row'>
         {this.state.submit_error && (
              <div className="alert alert-danger col-sm-12" role="alert">
                <p>
                {this.state.error_message_detail}
                </p>
                {this.state.error_message}
              </div>
            )}
          <div className='col-sm-3'>
          <Paper style={{maxHeight: 700, overflow: 'auto'}}>
                
                <List component="nav" aria-label="samples" subheader={
                    <ListSubheader component="div" id="nested-list-subheader">
                        Sample ID List
                    </ListSubheader>
                       }>
                
                    {this.props.ids.map((idopt, index) => {
                        return (
                    
                           <ListItem  key={idopt.submission_id} button>
                            {/*

                            <ListItem  key={idopt.submission_id} button component={Link} to={`/sample/${idopt.uuid}`}>
                            <ListItemIcon>
                             <Checkbox
                                edge="start"
                                //checked={checked.indexOf(value) !== -1}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': idopt.submission_id }}
                                />
                            </ListItemIcon>
                             <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`}/>
                            <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`} onClick={() => this.handleInputChange(idopt)}/>


                             <ListItemIcon>
                                  <CheckIcon />
                                </ListItemIcon>
                          */}
                            <ListItemIcon>
                              <Checkbox id={`cb_${idopt.uuid}`}
                                  checked={idopt.checked}
                                  //onChange={handleChange}
                                  color="secondary"
                                />
                                </ListItemIcon>
                              <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`} onClick={(e) => this.handleEdit(idopt, e)}/>
                          </ListItem>
                        );
                      })}
                </List>
              </Paper>
              </div>
            <div className='col-sm-9'>
              <div>
              <Paper>

                  <TissueForm
                    key={this.state.edit_uuid}
                    editingEntity={this.state.editingEntity}
                    readOnly={this.state.readOnly}
                    //handleCancel={this.cancelEdit}
                    onUpdated={this.handleOnUpdate}
                    />
                 </Paper>
              </div>  
            </div>
        </div>
    );
  }
}

export default MultipleListModal;
