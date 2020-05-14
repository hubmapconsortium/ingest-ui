import React, { Component } from "react";

class Modal extends Component {
  state = {};

  render() {
    const { handleClose, show, children } = this.props;
    const showHideClassname = show
      ? "mymodal display-block"
      : "mymodal display-none";

    return (
      <div className={showHideClassname}>
        <section className="modal-main">
          {children}
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
        </section>
      </div>
    );
  }
}

export default Modal;
