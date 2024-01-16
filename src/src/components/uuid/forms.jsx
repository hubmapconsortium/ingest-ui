import React, { Component } from "react";
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
// Originally looked like these would pull in different forms, 
// given their management in this forms file. However, it 
// now looks like these load the same forms as elsewhere, 
import DonorForm from "./donor_form_components/donorForm";
import TissueForm from "./tissue_form_components/tissueForm";
import DatasetEdit from "../ingest/dataset_edit";
import Result from "./result";
// import NewDatasetModal from "../../ingest/newDatasetModal";
import NewDatasetModal from "../ingest/newDatasetModal";
import PublicationEdit from '../ingest/publications_edit';


class Forms extends Component { 
  state = { formType: "----",
    createSuccess: false,
    isDirty: false,
    isLoading: true,
    open:false,
    entity: null,
    dataTypeList:null,
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
    
  }

  prepDatatypes= () =>{

  }
  // @TODO: Since we're pulling the form in another wrapper when in edit mode, 
  //  all the prop stuff is effectively less than useless.
  // just populate the dt list in the dataset_edit form itself, 
  // Edit will still used whats passed in through props

 
  UNSAFE_componentWillMount() {
    var DTList = this.props.dtl_primary;
    
    this.setState({
      formType: this.props.formType,
        open: true,
        dataTypeList: DTList
    }, () => {   
    this.setState({ isLoading: false });
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevProps.formType !== this.props.formType) {
      this.setState({
        editForm: true,      
        createSuccess: false,
        show_search: false,
        showSearch: false,
        anchorEl: null,
        formType: this.props.formType,
      });
      
      // this.handleUrlChange("new/"+target);
    }
  };
    


  onCreated = data => {
    
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

  handleSingularty  = (target, size) => {
    // 
    if(target === 'uploads'){
      return "uploads" // Is always plural in our system
    }
    if(size === "plural"){
      // 
      if(target.slice(-1) === "s"){
        return target.toLowerCase();
      }else{
        return (target+"s").toLowerCase();
      }
    }else{ // we wanna singularize
      if(target.slice(-1) === "s"){
        return (target.slice(0, -1)).toLowerCase()
      }else{
        return target.toLowerCase();
      }
    } 
  }


  handleUrlChange = (targetPath) =>{
    
    var targetPathString = ""
    if(targetPath && targetPath !== undefined){
      targetPathString = targetPath
    }
    this.setState({
      loading: false
    })
    if(targetPath!=="----" && targetPath!=="undefined"){
      window.history.pushState(
        null,
        "", 
        "/"+targetPathString);
    }
  }

  onCreateNext = e => {
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
    
    const {name, display_doi, doi} = newDataset;
    this.setState({globus_url: newLink, name: name, display_doi: display_doi, doi: doi, createSuccess: true});
  }

  handleClose = () => {
    
  }

  renderForm() {
    // We're only using the form loader for New forms, 
    // Edit/View forms use updated wrappers 
    if (this.state.createSuccess) {
      return (
        <Dialog aria-labelledby="result-dialog" open={this.state.showSuccessDialog} maxWidth={this.state.result_dialog_size}>
        <DialogContent>
        <Result
          result={this.state.result}
          onReturn={this.props.onReturn}
          handleCancel={this.props.handleCancel}
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
          handleCancel={this.props.handleCancel}
        />
      );
    } else if (this.state.formType === "sample") {
      return (
        <TissueForm
          onCreated={this.onCreated}
          onReturn={this.props.onReturn}
          specimenType={this.state.specimenType}
          source_entity_type={this.state.source_entity_type}
          sourceUUID={this.state.sourceUUID}
          uuid={this.state.uuid}
          direct_ancestor={this.state.ancestor_entity}
          handleCancel={this.props.handleCancel}
        />
      );
    } else if (this.props.formType === "dataset"  ) {
      
      
        return (
         <DatasetEdit
            dataTypeList={this.props.dataTypeList}
            onCreated={this.onCreated}
            onReturn={this.props.handleCancel}
            changeLink={this.onChangeGlobusLink.bind(this)}
            newForm={true}
            dtl_primary={this.props.dtl_primary}
            dtl_all={this.props.dtl_all}
            dtl_status={false}
            editingDataset="{}"
          />
          
        )
    } else if (this.props.formType === "publication"  ) {
      
      
        return (
         <PublicationEdit
            // dataTypeList={this.props.dataTypeList}
            onCreated={this.onCreated}
            onReturn={this.props.handleCancel}
            changeLink={this.onChangeGlobusLink.bind(this)}
            newForm={true}
            reportError={this.props.reportError}
            // dtl_primary={this.props.dtl_primary}
            // dtl_all={this.props.dtl_all}
            // dtl_status={false}
            // editingPublication="{}"
          />
          
        )
    } else {
      return null;
    }
  }

  render() {
    return <div>


      {this.state.isLoading && (
        <>Loading</>
      )}

      {!this.state.isLoading && (

        this.renderForm()
      )}
      {this.state.showDatasetResultsDialog && ( // for results of a new Dataset
          <NewDatasetModal
            show={this.state.showDatasetResultsDialog}
            parent="dataset"
            globus_directory_url_path={this.state.globus_url}
            entity={this.state.entity}
            onDismiss={() => this.setState({ showDatasetResultsDialog: false, editingDataset: null })}
         />
         )}

    </div>;
  }
}

export default Forms;
