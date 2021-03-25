import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { Link } from 'react-router-dom';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
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
import TissueEditDialog from "./tissueEditDialog";

//import RUIIntegration from "./ruiIntegration";
import { entity_api_update_multiple_entities } from '../../../service/entity_api';

class MultipleListModal extends Component {

  state = {
     submitting: false,
     formType: "sample"
    //rui_json: "",
    // rui_click: { name: '' },
    // rui_checks: { name: '' },
    // rui_view: false,
    // activate_input: true,
    // rui_locations: { name: '' },
    // sample_name: "",
    // update: false,
    // metadata: this.props.metadata,
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

  handleInputChange = selected => {
    console.log('handleInputChange', selected);

    // <TissueEditDialog />
    // this.setState(prevState => {
    //   let assigned_ids = Object.assign({}, prevState.assigned_ids);
    //   assigned_ids[name] = value;
    //   return { assigned_ids };
    // });
  };

  handleInputKeyPress = () => {
    console.log("Press");
  }

  // handleSubmit = () => {
  //   this.setState(
  //     {
  //       submitting: true,
  //       success: false
  //     },
  //     () => {
  
  //         // prepare the data
  //         //let data = this.createSampleList();
  //         console.log('MultipleListModal');
  //           // now update multiple lab id entities
  //             // entity_api_update_multiple_entities(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
  //             //     .then((resp) => {
  //             //       if (resp.status == 200) {
  //             //           this.setState(
  //             //       {
  //             //         submitting: false,
  //             //         success: true
  //             //       }, () => {
  //             //         if (this.props.onSaveLocation) {
  //             //             this.props.onSaveLocation(true);
  //             //         }
  //             //           this.props.hide();
  //             //         });
  //             //       } else {
  //             //         this.setState({ submitting: false, submit_error: true });
  //             //       }
  //             // });
  //     }
  //   );
  // };

  render() {
    return (
    
        <div className='row'>
          <div className='col-sm-12 text-center'>
          Use the list below to edit individual Sample information
          </div>
          <div className='col-sm-12'>
            <div className='card text-center'>
      
              <div className='card-body'>

                <List component="nav" aria-label="samples" >
                    {this.props.ids.map((idopt, index) => {
                        return (
                          <ListItem  key={idopt.submission_id} button component={Link} to={`/sample/${idopt.uuid}`}>
                            {/*<ListItemIcon>
                             <Checkbox
                                edge="start"
                                //checked={checked.indexOf(value) !== -1}
                                tabIndex={-1}
                                disableRipple
                                inputProps={{ 'aria-labelledby': idopt.submission_id }}
                                />
                            </ListItemIcon>
                            <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`} onClick={() => this.handleInputChange(idopt)}/>
                          */}
                             <ListItemText id={idopt.submission_id} primary={`${idopt.submission_id}`}/>
                          </ListItem>
                        );
                      })}
                </List>
    
              </div>
            </div>
          </div>
        </div>
    );
  }
}

export default MultipleListModal;
