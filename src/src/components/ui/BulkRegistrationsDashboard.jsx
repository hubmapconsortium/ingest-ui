import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
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

const getAction = (row) => {
  if (row.failed_count > 0) {
    return <Button>Retry</Button>
  }
  return <Button>View All</Button>
}

function Row(props) {
  const { row } = props;
  const [open, setOpen] = useState(false);

  const getBadge = (status) => {
    const badge = batchStatusBadge(status)
    return NewBadge('', true, badge.cssBadge, badge.status);
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
        <TableCell>{row.created_at}</TableCell>
        <TableCell>{getBadge(row.status)}</TableCell>
        <TableCell>{row.completed_at}</TableCell>
        <TableCell align="right">{getAction(row)}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <div style={{display: 'flex'}} className='mb-3'>
                 <span style={{alignSelf: 'flex-start', flexGrow: '2'}}><Typography variant="h6" gutterBottom component="span">Batch Registrations</Typography> &nbsp;</span>
                 <span style={{alignSelf: 'flex-end', flexGrow: '2', textAlign: 'right'}}><span>{NewBadge('', true, 'VALID', row.success_count)} registered</span>, <span>{NewBadge('', true, 'ERROR', row.failed_count)} failed</span></span>
              </div>
              
              <Table size="small" aria-label="purchases">
                <TableHead>
                  <TableRow className='thead-dark border border-1'>
                    <TableCell>HuBMAP ID</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className='border'>
                  {row.jobs.map((job) => (
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

  const fetchData = async () => {
    ingest_api_bulk_batch_id_status(
        `batches/0cb897a594db11f1849f2629690aeea3`,
      )
        .then((resp) => {
          setRows([resp.data])
        })
        .catch((error) => {});
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
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
              <TableCell>Batch ID</TableCell>
              <TableCell>Created At</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Completed At</TableCell>
              <TableCell align="right">Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <Row key={row.batch_id} row={row} />
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
