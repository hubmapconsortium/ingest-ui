import React, { Component} from "react";
import Modal from "../modal";
import axios from "axios";

import { SelectionState } from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-bootstrap4';

import "@devexpress/dx-react-grid-bootstrap4/dist/dx-react-grid-bootstrap4.css";


class IDSearchModalMultiSelect extends Component {
  state = {};

   constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
    this.state = {
    	columns : [{name: 'hubmap_identifier', title: 'Sample Identifier'}],
    	//rows: [{hubmap_identifier: 'ID1'},{hubmap_identifier: 'ID2'}],
    	isInitialized : 'false'};
    	
         this.changeSelection = selection => {
             this.setState({ selectedRows: []});
            var newRows = []
            for (var i=0;i < selection.length; i++) {
              newRows.push(this.state.rows[selection[i]]);
            }
            this.setState({ selectedRows: newRows});
            this.setState({ selection: selection });
        };
    
  };
  
  tableHeaderComponent = (props: any) => (<TableHeaderRow.Content
				{...props}
				align='center'
				/>)
				
  componentDidMount() {
    this.setState({
      LookUpShow: false
    });
  };
  
  UNSAFE_componentWillReceiveProps(nextProps) {
	  //let {rows, columns} = this.state;
	  let  {selection, setSelection} = [];
	  let currSelected = [];
	  if (nextProps.uuid_list === undefined) {
	    return;
	  }
	  let rows = nextProps.uuid_list;
      if (nextProps.currentSourceIds !== undefined && nextProps.currentSourceIds.length > 0) {
          let  {selection, setSelection} = [];
	      let currSelected = [];
          for (var j=0;j<nextProps.currentSourceIds.length;j++) {
             if (nextProps.currentSourceIds[j] !== undefined) {
             	 let hubmap_id_list = rows.map(function(o) { return o.hubmap_identifier; })
             	 let idx = hubmap_id_list.indexOf(nextProps.currentSourceIds[j]);
	             if (idx > -1) {
	               currSelected.push(idx);
	               
	             }
             }
          }
          this.setState({selection: currSelected});
	      this.state.selection = currSelected;
	      //let {selection} = currSelected;
	      this.setState({isInitialized : 'true'});
          
          
      }
  };

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

  handleDoneClick = () => {

	  //sort the results before returning them
	  var sortedResults = this.state.selectedRows;
	  sortedResults.sort((a, b) => {
	    if (
	      parseInt(
	        a.hubmap_identifier.substring(
	          a.hubmap_identifier.lastIndexOf("-") + 1
	        )
	      ) >
	      parseInt(
	        b.hubmap_identifier.substring(
	          a.hubmap_identifier.lastIndexOf("-") + 1
	        )
	      )
	    ) {
	      return 1;
	    }
	    if (
	      parseInt(
	        b.hubmap_identifier.substring(
	          a.hubmap_identifier.lastIndexOf("-") + 1
	        )
	      ) >
	      parseInt(
	        a.hubmap_identifier.substring(
	          a.hubmap_identifier.lastIndexOf("-") + 1
	        )
	      )
	    ) {
	      return -1;
	    }
	    return 0;
	  });
      this.state.selectedRows = sortedResults;
	  this.props.parentCallback(this.state.selectedRows);
      this.setState({
      //HuBMAPIDResults: Object.values(this.state.selection),
      LookUpShow: false
    });
  };
  


  render() {
	   let {rows, columns} = this.state;
	   let  {selection, setSelection} = [];
        if (this.props.uuid_list === undefined) {
          return(<div></div>);
        } else {
          rows = this.props.uuid_list;
          this.state.rows = rows;
          
	       
        }
    return (
  
      <Modal show={this.props.show} handleClose={this.props.hide}>
        <div className="row">
          <div className="col-sm-12">
            <div className="card text-center">
              <div className="card-body">
                <h5 className="card-title">Choose the Sample(s) to Associate with this Dataset</h5>
                <div className="row">
                  <div className="col-sm-3"></div>
                  <div className="col-sm-6">
                    <div className="form-group row">

					{rows && (
					      <div className="scrollbar-div">
					      <Grid
					        rows={rows}
					        columns={columns}
					      >
					        <SelectionState
					          selection={this.state.selection}
					          onSelectionChange={this.changeSelection}
					        />
					        <Table />
					        <TableHeaderRow contentComponent={this.tableHeaderComponent} />
					        <TableSelection
					          selectByRowClick
					          highlightRow
					          showSelectionColumn={false}
					        />
					      </Grid>
					      </div>
					    )}
                    </div>
                  </div>
                </div>
                {this.state.HuBMAPIDResults &&
                  this.state.HuBMAPIDResults.length === 0 && (
                    <div className="text-center">No record found.</div>
                  )}
                <div className="row mb-5">
                  <div className="col-sm-3 offset-sm-3">
                    <button
                      className="btn btn-primary btn-block"
                      type="button"
                      onClick={this.handleDoneClick}
                    >
                      Done
                    </button>
                  </div>
                  <div className="col-sm-2 text-left">
                    <button
                      className="btn btn-outline-secondary btn-block"
                      type="button"
                      onClick={this.props.hide}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default IDSearchModalMultiSelect;
