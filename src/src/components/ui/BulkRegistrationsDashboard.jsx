import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import CopyToClipboard from './CopyToClipboard';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { ingest_api_bulk_batch_id_status, ingest_api_bulk_batch_id_retry } from 'src/service/ingest_api';
import { NewBadge } from './formParts';
import CircularProgress from '@mui/material/CircularProgress';
import { URLS } from '../../constants';
import { logger } from '../../utils/logger';

export const batchStatusBadge = (status) => {
  let cssBadge = 'NEW';
  if (status) {
     switch(status) {
      case 'success':
        cssBadge = 'VALID';
        break;
      case 'failed': 
        cssBadge = 'ERROR';
        break;
      default:
        cssBadge = 'PROCESSING';
        break;
    }
  }
  const normalizedStatus = (status ? status : 'NEW').toUpperCase()
 
  return {status: normalizedStatus, cssBadge}
}

const colSpan = 7

const getAction = (row, setOnRetry) => {

  const retryFailedJobs = () => {
    setOnRetry(new Date().getTime())
    ingest_api_bulk_batch_id_retry (row.batch_id)
        .then((resp) => {
          console.debug('retryFailedJobs', resp)
        })
        .catch((error) => {
          logger.all.error({
              message: `BulkRegistrationsDashboard.retryFailedJobs.ln60 ${row.batch_id}`,
              error_details: error,
            })
        });
  }

  if (row.failed_count > 0) {
    return <Button onClick={retryFailedJobs}>Retry</Button>
  }
}

  const SortableTableCell = ({order, orderBy, handleSortRequest, name, field, sx}) => {
    return (
      <TableCell sx={sx}>
        <TableSortLabel
          active={orderBy === field}
          direction={orderBy === field ? order : "asc"}
          onClick={() => handleSortRequest(field)}
        >
          {name}
        </TableSortLabel>
      </TableCell>
    );
  };

const sortData = (array, comparator, orderDirection) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      if (a[0][comparator] < b[0][comparator]) return orderDirection === 'asc' ? -1 : 1;
      if (a[0][comparator] > b[0][comparator]) return orderDirection === 'asc' ? 1 : -1;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function Row(props) {
  const { row, setOnRetry } = props;
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const hasInitialized = useRef(false)

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const batchId = query.get('batchId')
    if (row.batch_id === batchId && !hasInitialized.current) {
      hasInitialized.current = true
      setOpen(true)
    }
  }, [])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getBadge = (status) => {
    const badge = batchStatusBadge(status)
    return NewBadge('', true, badge.cssBadge, badge.status);
  }

  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('entity_uuid')


  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortableTableCell = (name, field, sx) => {
    return <SortableTableCell sx={sx} order={order} orderBy={orderBy} handleSortRequest={handleSortRequest} name={name} field={field} />
  }

  const getRows = useCallback((rows) => {
    return [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
  }, [order, orderBy, page, rowsPerPage]);



  return (
    <>
      <TableRow
        sx={{ "& > .MuiTableCell-root": { borderBottom: "unset" } }}
        className="border-bottom"
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th">
          {row.batch_id} <CopyToClipboard text={row.batch_id} />
        </TableCell>
        <TableCell>
          {row.entity_type.charAt(0).toUpperCase() + row.entity_type.slice(1)}
        </TableCell>
        <TableCell>{row.created_at}</TableCell>
        <TableCell>{getBadge(row.status)}</TableCell>
        <TableCell>{row.completed_at}</TableCell>
        <TableCell align="right">{getAction(row, setOnRetry)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{ paddingBottom: 0, paddingTop: 0 }}
          colSpan={colSpan}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <div style={{ display: "flex" }} className="mb-3">
                <span style={{ alignSelf: "flex-start", flexGrow: "2" }}>
                  <Typography variant="h6" gutterBottom component="span">
                    Batch Registrations
                  </Typography>{" "}
                  &nbsp;
                </span>
                <span
                  style={{
                    alignSelf: "flex-end",
                    flexGrow: "2",
                    textAlign: "right",
                  }}
                >
                  <span>
                    {NewBadge("", true, "VALID", row.success_count)} registered
                  </span>
                  ,{" "}
                  <span>
                    {NewBadge("", true, "ERROR", row.failed_count)} failed
                  </span>
                </span>
              </div>

              <Table size="small" aria-label="Submitted Registrations">
                <TableHead>
                  <TableRow className="thead-dark border border-1">
                    
                    {sortableTableCell("HuBMAP ID", "hubmap_id", {width: 200})}
                    {sortableTableCell("Status", "status", {width: 150})}
                    <TableCell>Edit</TableCell>
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="border">
                  {row.status === 'running' && <TableRow ><TableCell colSpan={4} className='text-center'>
                      <div className='mx-auto'><CircularProgress size={16} aria-label="Running..." /></div></TableCell></TableRow >}
                  {getRows(sortData(row.jobs, orderBy, order)).map((job) => (
                    <TableRow key={job.entity_uuid}>
                      <TableCell component="th" scope="row">
                        {job.hubmap_id && <Tooltip title={`View ${job.hubmap_id} on the Data Portal`}><a
                          target="_blank"
                          href={`${URLS.dataPortal.base}/browse/${row.entity_type}/${job.entity_uuid}`}
                        >
                          {job.hubmap_id}
                          <ArrowOutwardIcon sx={{ fontSize: 16 }} />
                        </a></Tooltip>}
                        
                      </TableCell>
                      <TableCell>{getBadge(job.status)}</TableCell>
                      <TableCell>{!job.error_detail && job.status === 'success' && <Tooltip title={`Edit ${job.hubmap_id}`}><a href={`/${row.entity_type}/${job.entity_uuid}`}><EditIcon sx={{fontSize: 16}} /></a></Tooltip>}</TableCell>
                      <TableCell align="right" style={{overflowY: 'auto', maxHeight: 200}}><code>{job.error_detail}</code></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="SearchGridWrap HDT">
                <div className="MuiDataGrid-footerContainer">
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={row.jobs.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                  />
                </div>
              </div>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

Row.propTypes = {
  row: PropTypes.shape({
    batch_id: PropTypes.number.isRequired,
    created_at: PropTypes.string.isRequired,
    jobs: PropTypes.arrayOf(
      PropTypes.shape({
        entity_uuid: PropTypes.string,
        internal_id: PropTypes.string,
        error_detail: PropTypes.string,
        hubmap_id: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
      }),
    ).isRequired,
    status: PropTypes.string.isRequired,
    entity_type: PropTypes.string,
    completed_at: PropTypes.string,
    success_count: PropTypes.number.isRequired,
    failed_count: PropTypes.number.isRequired,
    total_jobs: PropTypes.number.isRequired,
  }).isRequired,
};


export default function BulkRegistrationsDashboard({}) {
  const [rows, setRows] = useState([])
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('created_at')
  const [onRetry, setOnRetry] = useState(null)

  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = sortData(rows, orderBy, order);
  const [rowMessage, setRowMessage] = useState(null);

  const fetchData = async () => {
    ingest_api_bulk_batch_id_status(`batches`)
      .then(async (resp) => {
        const batches = resp.data.batches
        const batchIds = []
        const batchIdToEntityType = {}
        for (const b of batches) {
          batchIds.push(b.batch_id)
          batchIdToEntityType[b.batch_id] = b.entity_type
        }
        
        const promises = []
        for (const id of batchIds) {
          promises.push(ingest_api_bulk_batch_id_status(
          `batches/${id}`,
        ))
        }
        const results = await Promise.allSettled(promises)
        const validResults = []
        for (const r of results) {
          if (r.status === 'fulfilled') {
            validResults.push({...r.value.data, entity_type: batchIdToEntityType[r.value.data.batch_id]})
          }
        }
        if (validResults.length <= 0) {
          setRowMessage('No submitted registrations.')
        }
        setRows(validResults)
        setOnRetry(false)
        
      })
      .catch((error) => {
        console.error('BulkRegistrationsDashboard.fetchData.Error', error)
      });
  };

  const seconds = 10
  useEffect(() => {
   const intervalId = setInterval(() => {
      fetchData()
    }, 1000 * seconds) // every 10 seconds grab fresh results
    
    return () => clearInterval(intervalId);
  }, [])

  useEffect(() => {
    if (onRetry !== false) {
      fetchData()
    }
  }, [onRetry])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortableTableCell = (name, field) => {
    return <SortableTableCell order={order} orderBy={orderBy} handleSortRequest={handleSortRequest} name={name} field={field} />
  }

   const visibleRows = useMemo(
    () =>
      [...sortedRows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, sortedRows],
  );

  
  
  return (
    <div>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Submitted Registrations</Typography>
      </Box>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table" className="SearchGridWrap HDT">
          <TableHead>
            <TableRow className="thead-dark">
              <TableCell />
              {sortableTableCell('Batch ID', 'batch_id')}
              {sortableTableCell('Entity Type', 'entity_type')}
              {sortableTableCell('Created At', 'created_at')}
              {sortableTableCell('Status', 'status')}
              {sortableTableCell('Completed At', 'completed_at')}
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(sortedRows.length <= 0 || onRetry !== false) && (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center">
                  <div className="mx-auto">
                    {!rowMessage && <CircularProgress aria-label="Loading..." />}
                    {rowMessage && <span>{rowMessage}</span>}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {visibleRows.map((row) => (
              <Row key={row.batch_id} row={row} setOnRetry={setOnRetry} />
            ))}
          </TableBody>
        </Table>
        <div className="SearchGridWrap HDT">
          <div className="MuiDataGrid-footerContainer">
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </div>
        </div>
      </TableContainer>
    </div>
  );
}
