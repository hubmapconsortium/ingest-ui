import React, { Component } from "react";
import ReactTooltip from "react-tooltip";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";
// import RUIModal from './ruiModal';
// import check from './check25.jpg';
import Modal from "../modal";
import axios from "axios";
//import RUIIntegration from "./ruiIntegration";
import { entity_api_update_multiple_entities } from '../../../service/entity_api';

class MultipleListModal extends Component {

  state = {
     submitting: false
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
    this.setState({
            submitting: false
            // metadata: {
            //   ...this.state.metadata.direct_ancestor,
            //   sex: this.getGender(this.state.metadata.direct_ancestor)
            // }
          });
  }




  handleClose = e => {
    // this.setState({
    //   rui_show: false,
    //   rui_hide: true
    // });
  };

  handleInputChange = e => {
    const { name, value } = e.target;
    console.log(name);
    console.log(value);
    this.setState(prevState => {
      let assigned_ids = Object.assign({}, prevState.assigned_ids);
      assigned_ids[name] = value;
      return { assigned_ids };
    });
  };

  handleInputKeyPress = () => {
    console.log("Press");
  }

  handleSubmit = () => {
    this.setState(
      {
        submitting: true,
        success: false
      },
      () => {
  
          // prepare the data
          let data = this.createSampleList();
          console.log('MultipleListModal', data);
            // now update multiple lab id entities
              // entity_api_update_multiple_entities(JSON.stringify(data), JSON.parse(localStorage.getItem("info")).nexus_token)
              //     .then((resp) => {
              //       if (resp.status == 200) {
              //           this.setState(
              //       {
              //         submitting: false,
              //         success: true
              //       }, () => {
              //         if (this.props.onSaveLocation) {
              //             this.props.onSaveLocation(true);
              //         }
              //           this.props.hide();
              //         });
              //       } else {
              //         this.setState({ submitting: false, submit_error: true });
              //       }
              // });
      }
    );
  };

  render() {
    return (
      <Modal
        dialogClassName="add-multi"
        show={this.props.show}
        handleClose={this.props.hide}
      >
        <div className='row'>
          <div className='col-sm-12'>
            <div className='card text-center'>
              <div className='card-body scrollbar-div'>

                <List component="nav" aria-label="samples">
                    {this.props.ids.map((idopt, index) => {
                        return (
                          <ListItem button>
                             <ListItemText primary={`${idopt.submission_id}`} />
                          </ListItem>
                        );
                      })}
                </List>
    
              </div>
              <hr />
            
              <div className='form-group row'>
                <div className='col-sm-12 text-center'>
                  <button
                    className='btn btn-primary'
                    onClick={this.handleSubmit}
                    disabled={this.state.submitting}
                  >
                    {this.state.submitting && (
                      <FontAwesomeIcon
                        className='inline-icon'
                        icon={faSpinner}
                        spin
                      />
                    )}
                    {!this.state.submitting && "Submit"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default MultipleListModal;
