import React, { useState, useEffect } from 'react'

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faTrash } from "@fortawesome/free-solid-svg-icons"; 
const SourceTable = (headers,rows,cellAction,writeable) => {
  // const mapped = Object.entries(headers).map(([k,v]) => `${k}_${v}`);
  console.debug("SourceTable",headers,rows,cellAction,writeable);
  return (

    <TableContainer 
      component={Paper} 
      style={{ maxHeight: 450 }}
      >
      <Table aria-label="Associated Collaborators" size="small" className="table table-striped table-hover mb-0">
        <TableHead className="thead-dark font-size-sm">
          <TableRow className="   " >
          {headers.map((item, i) => (
            <TableCell component="th">{item}</TableCell>
          ))}
          </TableRow>
        </TableHead>
        <TableBody>
          
          {rows.map((row, index) => (
            <TableRow 
              key={("rowName_"+index)}
              className="row-selection"
              >
              <TableCell  className="clicky-cell" scope="row">{row.name}</TableCell>
              <TableCell  className="clicky-cell" scope="row">{row.affiliation}</TableCell>
              <TableCell  className="clicky-cell" scope="row"> {row.ordid_id} </TableCell>
              <TableCell  className="clicky-cell" align="right" scope="row"> 
              {writeable && (
                <React.Fragment>
                  <FontAwesomeIcon
                    className='inline-icon interaction-icon '
                    icon={faTrash}
                    color="red"  
                    onClick={() => cellAction(row,index)}
                  />
                </React.Fragment>
                )}
                {writeable && (
                  <small className="text-muted">N/A</small>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer> 
  )
};

export default SourceTable;


