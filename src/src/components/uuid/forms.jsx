import React, { Component } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DonorForm from "./donor_form_components/donorForm";
import TissueForm from "./tissue_form_components/tissueForm";
import DatasetEdit from "../ingest/dataset_edit";
import Result from "./result";
import NewDatasetModal from "../ingest/newDatasetModal";


class Forms extends Component {
  state = { formType: "----",
    createSuccess: false,
    isDirty: false,
    open:false,
    entity: null,
    showDatasetResultsDialog: false,
    showSuccessDialog: false,
    result_dialog_size: "xs"
  };

  handleFormTypeChange = e => {
    this.setState({
      formType: e.target.value.toLowerCase(),
      createSuccess: false
    });
  };

 handleDirty = (isDirty) => {
    this.setState({
      isDirty: isDirty
    });
    console.debug('Forms:isDirty', isDirty);
  }

  UNSAFE_componentWillMount() {
    this.setState({
      formType: this.props.formType,
        open: true
    });
    console.debug('FORMS', this.props.formType);
  }
  onCreated = data => {
    console.debug('FORMS onCreated:', data);
    if (data["new_samples"]) {  // means that we need to show a larger screen
      this.setState({
        result_dialog_size: "xl"
      });
    }
    this.setState({
      entity: data.entity,
      result: data,
      formType: "----",
      createSuccess: true,
      showSuccessDialog: true
    });
  };

  onCreateNext = e => {
    console.log('onCreateNext', e)
//    let ancestor = e
    this.setState({
      createSuccess: false,
      showSuccessDialog: true,
      formType: "sample",
      specimenType: e.entity_type === "Sample" ? "" : "organ",
      source_entity_type: e.entity_type, 
      sourceUUID: e.hubmap_id,   // this is source hubmap id, which is for visual purpose
      uuid: e.uuid,      // send the true uuid
      ancestor_entity: e   // just sending this entire entity for now, which has alll the info;  REDSIGN NEEDED
     
    });
  };

  onChangeGlobusLink(newLink, newDataset) {
    console.debug(newDataset)
    const {name, display_doi, doi} = newDataset;
    this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi, createSuccess: true});
  }

  handleClose = () => {
    console.debug('CLOSED');
  }

  renderForm() {
    if (this.state.createSuccess) {
      return (
        <Dialog aria-labelledby="result-dialog" open={this.state.showSuccessDialog} maxWidth={this.state.result_dialog_size}>
        <DialogContent>
        <Result
          result={this.state.result}
          onReturn={this.props.onCancel}
          onCreateNext={this.onCreateNext}
          entity={this.state.entity}
        />
        </DialogContent>
        </Dialog>
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
    } else if (this.state.formType === "dataset") {
        return (
         <DatasetEdit
            onCreated={this.onCreated}
            handleCancel={this.props.onCancel}
            changeLink={this.onChangeGlobusLink.bind(this)}
          />
        )
    } else if (this.state.formType === "dataset") {
        // return (
        // //  <UploadsForm  // Loads from a dialog in app.js
        // //     handleCancel={this.props.onCancel}
        // //     uuid={this.state.uuid}
        // //     //onUpdated={this.handleDatasetUpdated}
        // //     onCreated={this.onCreated}
        // //     changeLink={this.onChangeGlobusLink.bind(this)}
        // //   />
        // )
    } else {
      return null;
    }
  }

  render() {
    return <div>
      {this.renderForm()}
      {this.state.showDatasetResultsDialog && ( // for results of a new Dataset
          <NewDatasetModal
            show={this.state.showDatasetResultsDialog}
            //hide={this.hideNewDatasetModal}
            //select={this.handleSelectClick}
            parent="dataset"
            globus_directory_url_path={this.state.globus_url}
            entity={this.state.entity}
            //name={this.state.editingDataset.description}
            //display_doi={this.state.editingDataset.display_doi}
            //doi={this.state.doi}
            onDismiss={() => this.setState({ showDatasetResultsDialog: false, editingDataset: null })}
         />
         )}

    </div>;
  }
}

export default Forms;
