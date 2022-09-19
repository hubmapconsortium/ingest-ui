import React, { Component }from "react";
import Dialog from '@material-ui/core/Dialog';

class RUIModal extends Component {
  
  state = {};

  render() {
	const { handleClose, show } = this.props;
    const showHideClassname = show
      ? "locmodal display-block"
      : "locmodal display-none";

    return (      
      <div className={showHideClassname}>
         <Dialog aria-labelledby="rui-info-dialog" open={show}>
        <div >      
          <h3>Sample Location Information</h3>
        </div>
        <div className="modal-body">
           <pre> 
		      {this.props.children}
		    </pre>
        </div>
        <div className="row">
            <div className="col-sm-12 text-center">
              <button
                className="btn btn-link"
                type="button"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
      </Dialog>
      </div>
    );
  }
}

export default RUIModal;