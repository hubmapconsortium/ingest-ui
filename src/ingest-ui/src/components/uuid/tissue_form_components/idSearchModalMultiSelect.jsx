import React, { Component, useState } from "react";
import Modal from "../modal";
import axios from "axios";

//import Paper from '@material-ui/core/Paper';
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

  handleSearchClick = () => {
    const group = this.group.current.value;
    const sample_type = this.sampleType.current.value;
    const keywords = this.keywords.current.value;
    let params = {};
    params["group"] = group;
    if (sample_type) {
      params["specimen_type"] = sample_type;
    }
    if (keywords) {
      params["search_term"] = keywords;
    }

    const config = {
      headers: {
        Authorization:
          "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
        "Content-Type": "multipart/form-data"
      },
      params: params
    };

    var specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search`;
    if (this.props.parent === "dataset") {
      specimen_url = `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/search?include_datasets=true`;
    }

    axios
      .get(`${specimen_url}`, config)
      .then(res => {
        let entities = {};
        if (this.props.parent === "dataset") {
          res.data.specimens.forEach(s => {
            if (entities[s.properties.uuid]) {
              entities[s.properties.uuid].push(s);
            } else {
              entities[s.properties.uuid] = [s];
            }
          });
        } else {
          entities = res.data.specimens;
        }
        this.setState({
          HuBMAPIDResults: Object.values(entities)
        });
      })
      .catch(error => {
        console.log(error);
      });
  };

  showSibling = e => {
    // e.stopPropagation();
    // this.setState({
    //   showSibling: !this.state.showSibling
    // });
  };
  
  getRows = () => {
    if (this.props.uuid_list !== undefined) {
       return this.props.uuid_list;
    } else {
       return [];
    }
  }
  
  getColumns = () => {
    if (this.state.columns !== undefined) {
       return this.state.columns;
    } else {
       return [];
    }
  }


  render() {
        //const [rows] = this.props.uuid_list;  
       //const  [columns] = this.state.columns;
       //const  [columns] = React.useState([{name: 'hubmap_identifier', title: 'Identifier'}]);
       //const [rows] = React.useState([{hubmap_identifier: 'ID1'},{hubmap_identifier: 'ID2'}]);
	   //const  [selection, setSelection] = React.useState([1]);  
	   //var columns =   useState(this.state.columns);
	   //var rows = useState([{hubmap_identifier: 'ID1'},{hubmap_identifier: 'ID2'}]);
	   //var [selection, setSelection] = useState([1]);
	   let {rows, columns} = this.state;
	   let  {selection, setSelection} = rows[0];
        if (this.props.uuid_list === undefined) {
          return(<div></div>);
        } else {
          rows = this.props.uuid_list;
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
          onSelectionChange={setSelection}
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
                      onClick={this.handleSearchClick}
                    >
                      Search
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
