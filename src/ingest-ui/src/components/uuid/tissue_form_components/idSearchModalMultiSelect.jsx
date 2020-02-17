import React, { Component} from "react";
import Modal from "../modal";
import axios from "axios";

import { SelectionState } from '@devexpress/dx-react-grid';
import {
  TemplateConnector,
} from '@devexpress/dx-react-core';

import {
  Grid,
  Table,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-bootstrap4';


let isCtrlKeyPressed = false;
let isShiftKeyPressed = false;
let firstSelectedRow = null;

class Row extends React.Component {
  handleClick({ getRowId, selection, rows, toggleSelection }, e) {
    const { row } = this.props;
    if (e.shiftKey && selection.length) {
      const firstSelectedIndex = rows.findIndex(row => getRowId(row) === selection[0])
      const rowIndex = rows.indexOf(row);
      toggleSelection({
        rowIds: rows
          .slice(Math.min(firstSelectedIndex + 1, rowIndex), Math.max(firstSelectedIndex - 1, rowIndex) + 1)
          .map(row => getRowId(row)),
        state: true,
      })
    } else if (e.ctrlKey || e.metaKey) {
      toggleSelection({ rowIds: [getRowId(row)] })
    } else {
      toggleSelection({ rowIds: selection, state: false });
      toggleSelection({ rowIds: [getRowId(row)], state: true });
    }
  }
  render() {
    const { row, children } = this.props;
    return (
      <TemplateConnector>
        {({ selection, getRowId, rows }, { toggleSelection }) => (
          <Table.Row
            className={selection.indexOf(getRowId(row)) > -1 ? 'active bg-secondary text-white' : ''}
            onClick={this.handleClick
              .bind(this, { selection, rows, getRowId, toggleSelection })}
          >
            {children}
          </Table.Row>
        )}
      </TemplateConnector>
    );
  }
}


class IDSearchModalMultiSelect extends Component {
  state = {};

   constructor(props) {
    super(props);
    isCtrlKeyPressed = false;
    isShiftKeyPressed = false;
    firstSelectedRow = null;
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
    //this variable is quite important.  This key is associated with the
    //grid shown on the screen.  The key is incremented each time the grid contents
    //change.  This causes the grid to be redrawn to ensure it is showing the proper data.
    this.childKey = 0;
    this.state = {
    	columns : [{name: 'hubmap_identifier', title: 'Sample Identifier'}],
    	//rows: [{hubmap_identifier: 'ID1'},{hubmap_identifier: 'ID2'}],
    	isInitialized : 'false'};
    	
         this.changeSelection = selection => {
             //this.setState({ selectedRows: []});
            //var newRows = []
           // for (var i=0;i < selection.length; i++) {
            //  newRows.push(this.state.rows[selection[i]]);
            //}
            
            
            //this.setState({ selectedRows: selection});
            //this.setState({ selection: selection });
            
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
             	 let hubmap_id_list = rows.map(function(o) { return o.hubmap_identifier; });
             	 let curr_identifier = null;
             	 if (typeof(nextProps.currentSourceIds[j]) === "string") {
             	   curr_identifier = nextProps.currentSourceIds[j];
             	 } else {
             	   curr_identifier = nextProps.currentSourceIds[j].hubmap_identifier;
             	 }
             	 let idx = hubmap_id_list.indexOf(curr_identifier);
	             if (idx > -1) {
	               currSelected.push(idx);
	               
	             }
             }
          }
          this.setState({selection: currSelected});
	      this.state.selection = currSelected;
	      this.changeSelection(currSelected);
	      this.setState({isInitialized : 'true'});
         ++this.childKey;
          
          
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
					      <Grid key={this.childKey}
					        rows={rows}
					        columns={columns}
					      >
					        <SelectionState
					          selection={selection}
					          onSelectionChange={this.changeSelection}
					        />
					        <Table
					          rowComponent={Row}
					        />
					        <TableHeaderRow contentComponent={this.tableHeaderComponent} />
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
