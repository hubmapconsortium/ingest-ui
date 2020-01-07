import React, { Component} from "react";
import Modal from "../modal";
import axios from "axios";

import { SelectionState } from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  TableHeaderRow,
  TableSelection,
} from '@devexpress/dx-react-grid-material-ui';


class IDSearchModalMultiSelect extends Component {
  state = {};

   constructor(props) {
    super(props);
    this.group = React.createRef();
    this.sampleType = React.createRef();
    this.keywords = React.createRef();
    this.state = {
    	columns : [{name: 'hubmap_identifier', title: 'Identifier'}],
    	rows: [{hubmap_identifier: 'ID1'},{hubmap_identifier: 'ID2'}]};
    	
         this.changeSelection = selection => {
            //this.grid.deselectAll();
            this.setState({ selection: [0] });
            this.setState({ selection: selection });
            this.setState({ selectedRows: []});
            var newRows = []
            for (var i=0;i < selection.length; i++) {
              newRows.push(this.state.rows[selection[i]]);
            }
            this.setState({ selectedRows: newRows});
        };
    
  }

  componentDidMount() {
    this.setState({
      LookUpShow: false
    });
  }

  hideLookUpModal = () => {
    this.setState({
      LookUpShow: false
    });
  };

  handleDoneClick = () => {

	this.setState({uuid_list : this.state.selectedRows});
    this.setState({
      LookUpShow: false
    });
  };


  render() {
	   let {rows, columns} = this.state;
	   let  {selection, setSelection} = rows[0];
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
                <h5 className="card-title">Select Sibling IDs</h5>
                <div className="row">
                  <div className="col-sm-6">
                    <div className="form-group row">

					{rows && (
					      <div className="scrollbar-div">
					      <Grid
					        rows={rows}
					        columns={columns}
					      >
					        <SelectionState
					          selection={selection}
					          onSelectionChange={this.changeSelection}
					        />
					        <Table />
					        <TableHeaderRow />
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
                  <div className="col-sm-4 offset-sm-2">
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
