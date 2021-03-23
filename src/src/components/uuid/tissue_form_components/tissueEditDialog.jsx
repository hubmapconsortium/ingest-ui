import React, { Component } from "react";

import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import Forms from "../forms";

class TissueEditDialog extends Component {

  state = {
     submitting: false,
     formType: "sample"
  };

  componentDidMount() {
  }

  handleClose = e => {
    // this.setState({
    //   rui_show: false,
    //   rui_hide: true
    // });
  };

  render() {
      return (
      
      <Dialog  aria-labelledby="tissue-edit-dialog-title" >
        <DialogTitle id="tissue-edit-dialog-title">
            Editing
        </DialogTitle>
          <Forms formType={this.state.formType} onCancel={this.handleClose} />
        </Dialog>
      );
  }

}


export default TissueEditDialog