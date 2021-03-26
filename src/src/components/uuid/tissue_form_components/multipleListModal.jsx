import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import { Link } from 'react-router-dom';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner
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

class MultipleListModal extends Component {

  state = {
    edit_uuid: "",
    submitting: false,
    formType: "sample",
    editingEntity: "",
    readOnly: true,
    currentEditList: ""
  };

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
  }

  handleEdit = selected => {
    console.log('handleEdit', selected);
    this.setState ({
      currentEditList: selected
    });
    this.editForm(selected.uuid);  
  };

  handleInputKeyPress = () => {
    console.log("Press");
  }

  editForm = (uuid) => {
    console.debug('in the editForm')
    
    entity_api_get_entity(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
    .then((response) => {
      if (response.status === 200) {
        let entity_data = response.results;

        // check to see if user can edit
        ingest_api_allowable_edit_states(uuid, JSON.parse(localStorage.getItem("info")).nexus_token)
          .then((resp) => {
          if (resp.status === 200) {
            let read_only_state = !resp.results.has_write_priv;      //toggle this value sense results are actually opposite for UI
            this.setState({
              edit_uuid: entity_data.uuid,
              editingEntity: entity_data,
              readOnly: read_only_state,   // used for hidding UI components
              });
        //this.props.onEdit();

          }
        });
      }
    });
  };

  render() {
    return (
        <div className='row'>
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
                          */}
    
                              <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`} onClick={() => this.handleEdit(idopt)}/>
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
