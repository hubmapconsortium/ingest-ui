import React, { Component } from "react";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';

import Paper from '@material-ui/core/Paper';
import Checkbox from '@material-ui/core/Checkbox';
import Snackbar from '@material-ui/core/Snackbar';
import IconButton from '@material-ui/core/IconButton';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import TissueForm from './tissueForm';
import { entity_api_get_entity } from '../../../service/entity_api';
import { ingest_api_allowable_edit_states } from '../../../service/ingest_api';
import { parseErrorMessage } from "../../../utils/string_helper";

class MultipleListModal extends Component {

  state = {
    multiples: this.props.ids,
    checked: false,
    edit_uuid: "",
    submitting: false,
    formType: "sample",
    editingEntity: "",
    updateSuccess: false,
    readOnly: true,
    currentEditList: "",
    error_message_detail: "",
    error_message: "Oops! Something went wrong. Please contact administrator for help.",
    setOpen: false,
    show_snack: false,
    snackmessage: ""
  };

  // constructor(props) {
  //   super(props);
  // }

  componentDidMount() {

    console.log('MultipleListModal', this.state.multiples)

    const first_lab_id = this.state.multiples[0].submission_id; 
    const last_lab_id = this.state.multiples[this.state.multiples.length-1].submission_id; 
    this.setState({
        submitting: false, 
        multiMessage: `${this.state.multiples.length} samples added ${first_lab_id} through ${last_lab_id}`
    });
    
  }

 // openSnack = () => {
 //  this.setState ({
 //    setOpen: true
 //  });
 //  };

 closeSnack = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState ({
      show_snack: false,
      snackmessage: ""
    });
  };

  // handleCancel = e => {
  //   // this.setState({
  //   //   rui_show: false,
  //   //   rui_hide: true
  //   // });
  // };

  handleOnUpdate = () => {
    ////console.debug('UPDATE Complete', this.state.currentEditList)
    
    // let cbs = document.getElementById("cb_"+this.state.currentEditList.uuid);
    // cbs.checked = true;

    // //console.debug('CHECK BOX', cbs)
    //this.openSnack();

    let m = this.setCheckIndicator(this.state.currentEditList.uuid, true);
    //console.debug('STATUS', m);
    
    this.setState({
        updateSuccess: true,
        editingEntity: null,
        checked: true,
        show_snack: true,
        snackmessage: "Save was succesful",
        multiples: m
      });
  }

  handleEdit = (selected) => {
    //console.debug('handleEdit', selected);
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
      //console.debug('setCheckIndicator ITEM', item)
      if(item.uuid === uuid ) {
        item.checked = status;
      }
      m.push(item);
    });
    //console.debug('setCheckIndicator', m);
    return m;
  }

  editForm = (uuid) => {
    //console.debug('in the editForm')
    
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
              show_snack: true,
              snackmessage: "Sample data was loaded"
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
        <div className='w-100'>
  
         <div className='col-sm-12 mb-2'>
          <span><b>Click on the ID below to edit information</b></span>
            <Paper style={{maxHeight: 700, overflow: 'auto'}}>

                  <ul className="no-bullets">
                
                    {this.state.multiples.map((item, index) => {
                        return (
                          <li>
                              <Checkbox id={`cb_${item.uuid}`}
                                  checked={item.checked}
                                  disabled 
                                  // color="secondary"
                                  size="small"
                                  inputProps={{ 'aria-label': 'checkbox with small size' }}
                                /> {" "} 
                                <button type="button" className="btn btn-link" onClick={(e) => this.handleEdit(item, e)}>{`${item.submission_id}`}</button>
                          </li>
                        );
                      })}
                  </ul>
              </Paper>
            </div>
            <div className='col-sm-12'>
                  <TissueForm
                    key={this.state.edit_uuid}
                    editingEntity={this.state.editingEntity}
                    readOnly={this.state.readOnly}
                    //handleCancel={this.handleCancel}
                    onUpdated={this.handleOnUpdate}
                    hideBackButton="true"
                    />
            </div>
          <div>
            <Snackbar open={this.state.show_snack} 
                      onClose={this.closeSnack}
                      anchorOrigin={{
                          vertical: 'top',
                          horizontal: 'right',
                      }}
                      autoHideDuration={6000} 
                      message={this.state.snackmessage}
                      action={
                            <React.Fragment>
                              <IconButton size="small" aria-label="close" color="inherit" onClick={this.closeSnack}>
                                 <FontAwesomeIcon icon={faTimes} size="1x" />
                              </IconButton>
                            </React.Fragment>
                          }
            /> 
            </div>
      </div>
    );
  }
}

export default MultipleListModal;
