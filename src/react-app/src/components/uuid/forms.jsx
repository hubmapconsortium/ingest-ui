import React, { Component } from "react";
import DonorForm from "./donor_form_components/donorForm";
import TissueForm from "./tissue_form_components/tissueForm";
import Result from "./result";

class Forms extends Component {
  state = { formType: "----", createSuccess: false };

  handleFormTypeChange = e => {
    this.setState({
      formType: e.target.value.toLowerCase(),
      createSuccess: false
    });
  };

  componentWillMount() {
    this.setState({
      formType: this.props.formType
    });
  }

  onCreateNext = e => {
    this.setState({
      createSuccess: false,
      formType: "sample",
      specimenType: e.entitytype === "Sample" ? "" : "organ",
      sourceUUID: e.display_doi
    });
  };

  renderForm() {
    if (this.state.createSuccess) {
      return (
        <Result
          result={this.state.result}
          onReturn={this.props.onCancel}
          onCreateNext={this.onCreateNext}
        />
      );
    }
    if (this.state.formType === "donor") {
      return (
        <DonorForm
          onCreated={this.onCreated}
          handleCancel={this.props.onCancel}
        />
      );
    } else if (this.state.formType === "sample") {
      return (
        <TissueForm
          onCreated={this.onCreated}
          handleCancel={this.props.onCancel}
          specimenType={this.state.specimenType}
          sourceUUID={this.state.sourceUUID}
        />
      );
    } else {
      return null;
    }
  }

  onCreated = data => {
    this.setState({
      result: data,
      formType: "----",
      createSuccess: true
    });
  };

  render() {
    return <div>{this.renderForm()}</div>;
  }
}

export default Forms;
