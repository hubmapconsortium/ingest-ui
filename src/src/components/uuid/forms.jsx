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

  UNSAFE_componentWillMount() {
    this.setState({
      formType: this.props.formType
    });
  }

  onCreateNext = e => {
    console.log('onCreateNext', e)
//    let ancestor = e
    this.setState({
      createSuccess: false,
      formType: "sample",
      specimenType: e.entity_type === "Sample" ? "" : "organ",
      source_entity_type: e.entity_type, 
      sourceUUID: e.hubmap_id,   // this is source hubmap id, which is for visual purpose
      uuid: e.uuid,      // send the true uuid
      ancestor_entity: e   // just sending this entire entity for now, which has alll the info;  REDSIGN NEEDED
     
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
          source_entity_type={this.state.source_entity_type}
          sourceUUID={this.state.sourceUUID}
          uuid={this.state.uuid}
          direct_ancestor={this.state.ancestor_entity}
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
