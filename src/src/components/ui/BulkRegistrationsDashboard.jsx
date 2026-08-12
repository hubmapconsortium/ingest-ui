import { useEffect, useState } from 'react';
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
import CopyToClipboard from './CopyToClipboard';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { ingest_api_bulk_batch_id_status, ingest_api_bulk_batch_id_retry } from 'src/service/ingest_api';
import { NewBadge } from './formParts';
import CircularProgress from '@mui/material/CircularProgress';

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

const getAction = (row) => {
  const retryFailedJobs = () => {
    ingest_api_bulk_batch_id_retry (row.batch_id,)
        .then((resp) => {
          window.location.reload()
        })
        .catch((error) => {});
  }

  const getPortalLink = () => {
    const ids = JSON.stringify(row.jobs.map((r) => r.hubmap_id))
    const query = LZString.compressToEncodedURIComponent(`{"search":"","sortField":{"field":"created_timestamp","direction":"desc"},"filters":{"hubmap_id":{"values":${ids},"type":"TERM"}},"includeSupersededEntities":false}`)
    window.location = `https://portal.hubmapconsortium.org/search/${row.entity_type}?q=${query}`
  }

  if (row.failed_count > 0) {
    return <Button onClick={retryFailedJobs}>Retry</Button>
  }
  return <Button onClick={getPortalLink}>View All</Button>
}

  const SortableTableCell = ({order, orderBy, handleSortRequest, name, field}) => {
    return (
      <TableCell>
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

function Row(props) {
  const { row } = props;
  const [open, setOpen] = useState(false);

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

  const sortableTableCell = (name, field) => {
    return <SortableTableCell order={order} orderBy={orderBy} handleSortRequest={handleSortRequest} name={name} field={field} />
  }


  return (
    <>
      <TableRow sx={{ '& > .MuiTableCell-root': { borderBottom: 'unset' } }} className='border-bottom'>
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
        <TableCell>{row.entity_type.charAt(0).toUpperCase() + row.entity_type.slice(1)}</TableCell>
        <TableCell>{row.created_at}</TableCell>
        <TableCell>{getBadge(row.status)}</TableCell>
        <TableCell>{row.completed_at}</TableCell>
        <TableCell align="right">{getAction(row)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={colSpan}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <div style={{display: 'flex'}} className='mb-3'>
                 <span style={{alignSelf: 'flex-start', flexGrow: '2'}}><Typography variant="h6" gutterBottom component="span">Batch Registrations</Typography> &nbsp;</span>
                 <span style={{alignSelf: 'flex-end', flexGrow: '2', textAlign: 'right'}}><span>{NewBadge('', true, 'VALID', row.success_count)} registered</span>, <span>{NewBadge('', true, 'ERROR', row.failed_count)} failed</span></span>
              </div>
              
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow className='thead-dark border border-1'>
                    {sortableTableCell('HuBMAP ID', 'hubmap_id')}
                    {sortableTableCell('Status', 'status')}
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className='border'>
                  {sortData(row.jobs, orderBy, order).map((job) => (
                    <TableRow key={job.entity_uuid}>
                      <TableCell component="th" scope="row">
                        <a target='_blank' href={`https://portal.hubmapconsortium.org/browse/sample/${job.entity_uuid}`}>{job.hubmap_id}<ArrowOutwardIcon sx={{ fontSize: 16 }} /></a> 
                      </TableCell>
                      <TableCell>{getBadge(job.status)}</TableCell>
                      <TableCell align="right">{job.error_detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('batch_id')


  const handleSortRequest = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedRows = sortData(rows, orderBy, order);

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
        setRows(validResults)
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
    fetchData()
    return () => clearInterval(intervalId);
  }, [])

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
              <TableCell>Completed At</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row) => (
              <Row key={row.batch_id} row={row} />
            ))}
            <TableRow ><TableCell colSpan={colSpan} className='text-center'>{sortedRows.length <= 0 && <div className='mx-auto'><CircularProgress aria-label="Loading..." /></div>}</TableCell></TableRow >
            
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
