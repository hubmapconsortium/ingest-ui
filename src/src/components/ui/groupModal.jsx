import React, { Component } from "react";
//import Modal from "./modal";
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Button from '@mui/material/Button';

class GroupModal extends Component {
  state = {
    groups: []
  };

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ groups: nextProps.groups });
    //console.debug('groups', nextProps.groups)
  }

  render() {
    return (
    
       <Dialog aria-labelledby="group-dialog" open={this.props.show}>
       <DialogContent>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">You currently have multiple group assignments, Please select a primary group for submission</h5>
                <div className="form-group row">
                  <div className="col-sm-6 offset-sm-3">
                    <select
                      name="groups"
                      id="groups"
                      className="form-control"
                      onChange={this.props.handleInputChange}>
                      {this.state.groups
                        .filter((g) => g.data_provider)  // only show those designated as data providers
                        .map(g => {
                        return (
                          <option id={g.uuid} value={g.uuid} key={g.name}>
                            {g.displayname}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
  
              </div>
            </div>
          </div>
        </div>
         </DialogContent>
           <DialogActions>
            <Button
            className="btn btn-primary mr-1"
            onClick={this.props.submit}>
            Submit
          </Button>
          <Button
            className="btn btn-secondary"
            onClick={this.props.hide}>
            Cancel
          </Button>          
          </DialogActions>
        </Dialog>
    
    );
  }
}

export default GroupModal;
