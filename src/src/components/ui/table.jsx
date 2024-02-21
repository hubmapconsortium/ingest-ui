import React, { useState, useEffect } from 'react'

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';


export const renderTableBody = props => {
    // console.debug("typeof", this.state.uploadedSources, typeof this.state.uploadedSources);
    if(this.props.bulkType.toLowerCase() === "samples" && this.state.uploadedSources){
      return(
        <TableBody>
          {this.state.uploadedSources && this.state.uploadedSources.map((row, index) => (
            <TableRow  key={(row.id+""+index)}>
              {/* {console.debug("row", row)} */}
              {this.state.registeredStatus === true && (
                <TableCell  className="" scope="row"> {row.hubmap_id}</TableCell>
              )}
              <TableCell  className="" scope="row"> {row.lab_id ? row.lab_id : row.lab_tissue_sample_id}</TableCell>
              <TableCell  className="" scope="row"> {row.sample_category ? row.sample_category : row.specimen_type}</TableCell>
              <TableCell  className="" scope="row"> {row.organ_type ? row.organ_type : ""}</TableCell>
              <TableCell  className="" scope="row"> {row.sample_protocol ? row.sample_protocol : row.protocol_url}</TableCell>
              <TableCell  className="" scope="row"> {this.renderTrimDescription(row.description)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        );
    }else if(this.props.bulkType.toLowerCase() === "donors" && this.state.uploadedSources){
      return(
      <TableBody>
        {this.state.uploadedSources.map((row, index) => (
          <TableRow  key={(row.hubmap_id+""+index)}>
            {this.state.registeredStatus === true && (
              <TableCell  className="" scope="row"> {row.hubmap_id}</TableCell>
            )}
            <TableCell  className="" scope="row"> {row.lab_id ? row.lab_id : row.lab_donor_id}</TableCell>
            <TableCell  className="" scope="row"> {row.lab_name ? row.lab_name : row.label}</TableCell>
            <TableCell  className="" scope="row"> {row.selection_protocol ? row.selection_protocol : row.protocol_url}</TableCell>
            <TableCell  className="" scope="row"> {this.renderTrimDescription(row.description)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    );
  }    
}


export const InvalidTable = props => {
  return(
    <TableContainer 
      component={Paper} 
      style={{ maxHeight:450 }}
      >
    <Table 
      aria-label={"Uploaded Errors"+this.props.type }
      size="small"
      stickyHeader 
      className="table table-striped table-hover mb-0 uploadedTable ">
      <TableHead  className="thead-dark font-size-sm">
        <TableRow >
          <TableCell  component="th" variant="head" width="7%">Row</TableCell>
          <TableCell  component="th" variant="head">Error</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {this.props.errors.map((item, index) => (
          <TableRow  key={("rowitem_"+index)} >
            <TableCell  className="" scope="row"> 
              {item.row}
            </TableCell>
            <TableCell  className="" scope="row"> 
              {item.message}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
      
  ) 
}