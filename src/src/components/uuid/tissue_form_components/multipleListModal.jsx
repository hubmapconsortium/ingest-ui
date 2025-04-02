import React, { Component } from "react";
import Alert from "@mui/material/Alert";
import Button from '@mui/material/Button';

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
    show_dirty_warning: false,
    snackmessage: "", 
    isDirty: false
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
        multiMessage: `${this.state.multiples.length} samples added ${first_lab_id} through ${last_lab_id}`,
        edit_uuid: this.state.multiples[0].uuid
    });

    // this.editForm(this.state.multiples[0].uuid);
    
  }

  render() {
    return (
      <div className='w-100'>
       
          {/* <Alert className='alert alert-primary'> */}
          <Alert severity="info" className="col-sm-12 mb-2 " role="alert">
            You have generated multiples samples. Select one of the additoinal samples below to edit in a new tab,  or click done to return to the Main page.
          </Alert>

          <ul className="no-bullets" >
            {this.state.multiples.map((item, index) => {
              return (
                <li>
                  <Button 
                    // style={{border: "1px solid #ccc ", padding: "5px", margin: "5px"}}
                    small={true}
                    target="_blank"
                    href={"/sample/"+item.uuid}>
                    {`${item.submission_id}`}
                  </Button>
                </li>
              );
              })}
          </ul>

        {/* We dont open edit views in Modals over the Search anymore, but instead on their own URL-loaded full Pages  */}
       
      </div>
    );
  }
}

export default MultipleListModal;
