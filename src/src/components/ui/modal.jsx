import React, { Component } from "react";

class Modal extends Component {
  state = {};

  render() {
    const { organ, handleClose, show, children } = this.props;
    const  showRUILocation = organ 
      ? "modal-organ"
      : "modal-main";
    const showHideClassname = show
      ? "mymodal display-block"
      : "mymodal display-none";

    return (
      <div className={showHideClassname}>
        <section className={showRUILocation}>
          {children}
          <div className="row">
            <div className="col-sm-12 pads text-center">
              <button
                className="btn btn-secondary"
                type="button"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

export default Modal;
