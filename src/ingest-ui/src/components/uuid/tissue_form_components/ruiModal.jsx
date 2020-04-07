import React, { Component }from "react";


class RUIModal extends Component {
  // UNSAFE_componentWillReceiveProps(nextProps) {
  //   this.setState({ ids: nextProps.ids });

  state = {};

 
  // }
  render() {
	const { handleClose, show } = this.props;
    const showHideClassname = show
      ? "locmodal display-block"
      : "locmodal display-none";

	
    return (
      
      <div className={showHideClassname}>
       <div className="modal-wrapper"
          style={{
          transform: this.props.show ? 'translateY(0vh)' : 'translateY(-100vh)',
          opacity: this.props.show ? '1' : '0'
          }}
        >
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
        </div>
      </div>
    );
  }
}

export default RUIModal;