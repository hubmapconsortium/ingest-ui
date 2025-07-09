import React from "react";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from "@mui/material/Button";
import ClearIcon from "@mui/icons-material/Clear";
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from "@mui/material/TextField";
import Collapse from '@mui/material/Collapse';
import Alert from "@mui/material/Alert";
import AlertTitle from '@mui/material/AlertTitle';
import Box from "@mui/material/Box";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import GridLoader from "react-spinners/GridLoader";
import SearchComponent from "../search/SearchComponent";
import { getPublishStatusColor } from "../../utils/badgeClasses";

export function BulkSelector({
  showSearchDialog,
  setShowSearchDialog,
  sourceBulkStatus,
  bulkError,
  setBulkError,
  bulkWarning,
  setBulkWarning,
  showHIDList,
  setShowHIDList,
  selected_string,
  sourcesData,
  permissions,
  handleInputUUIDs,
  handleSelectClick,
  handleInputChange,
  sourceRemover,
  fieldError,
}) {
     
	return (<> 
		<Dialog
			fullWidth={true}
			maxWidth="lg"
			onClose={() => showSearchDialog(false)}
			aria-labelledby="source-lookup-dialog"
			open={showSearchDialog === true ? true : false}>
			<DialogContent>
			<SearchComponent
				select={(e) => handleSelectClick(e)}
				custom_title="Search for a Source ID for your Publication"
				modecheck="Source"
				restrictions={{
						entityType: "dataset"
				}}
			/>
			</DialogContent>
			<DialogActions>
				<Button
						onClick={() => setShowSearchDialog(false)}
						variant="contained"
						color="primary">
						Close
				</Button>
			</DialogActions>
		</Dialog>
		<Box sx={{
			position: "relative",
			top: 0,
			transitionProperty: "height",
			transitionTimingFunction: "ease-in",
			transitionDuration: "1s"}}> 
			<Box className="sourceShade" sx={{
				opacity: sourceBulkStatus==="loading"?1:0, 
				background: "#444a65", 
				width: "100%", 
				height: "45px", 
				position: "absolute", 
				color: "white", 
				zIndex: 999, 
				padding: "10px", 
				boxSizing: "border-box" ,
				borderRadius: "0.375rem",
				transitionProperty: "opacity",
				transitionTimingFunction: "ease-in",
				transitionDuration: "0.5s"}}>
				<GridLoader size="2px" color="white" width="30px"/> Loading ... 
			</Box> 
			<Box>
				<TableContainer style={{maxHeight: 450, border: fieldError?"1px solid red":"1px solid rgba(68, 74, 101,.20)"}}>
					<Table
						stickyHeader
						
						aria-label="Associated Publications"
						size="small"
						className="table table-striped table-hover mb-0">
						<TableHead className="thead-dark font-size-sm">
							<TableRow className="   ">
							<TableCell> Source ID</TableCell>
							<TableCell component="th">Subtype</TableCell>
							<TableCell component="th">Group Name</TableCell>
							<TableCell component="th">Status</TableCell>
							{permissions.has_write_priv && (
								<TableCell component="th" align="right">
								Action
								</TableCell>
							)}
							</TableRow>
						</TableHead>
						<TableBody>
							{(!sourcesData || sourcesData.length === 0) && (
								<TableRow sx={{borderBottom: "0px!important"}}>
									<TableCell colSpan={6} sx={{textAlign: "center"}}>No data loaded</TableCell>
								</TableRow>
							)}
							{sourcesData.map((row, index) => (
							<TableRow
								key={row.hubmap_id + "" + index} // Tweaked the key to avoid Errors RE uniqueness. SHould Never happen w/ proper data
								// onClick={() => handleSourceCellSelection(row)}
								className="row-selection">
								<TableCell className="clicky-cell" scope="row">
									{row.hubmap_id}
								</TableCell>
								<TableCell className="clicky-cell" scope="row">
									{row.dataset_type ? row.dataset_type : row.display_subtype}
								</TableCell>
								<TableCell className="clicky-cell" scope="row">
									{row.group_name}
								</TableCell>
								<TableCell className="clicky-cell" scope="row">
								{row.status && (
									<span className={"w-100 badge " +getPublishStatusColor(row.status, row.uuid)}>
									{" "}{row.status}
									</span>
								)}
								</TableCell>
								{permissions.has_write_priv && (
								<TableCell
									className="clicky-cell"
									align="right"
									name="source_delete"
									scope="row">
									<React.Fragment>
										<FontAwesomeIcon
											className="inline-icon interaction-icon "
											icon={faTrash}
											color="red"
											onClick={() => sourceRemover(row.uuid, row.hubmap_id)}
										/>
									</React.Fragment>
								</TableCell>
								)}
							</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer> 
			</Box> 
		</Box>
		<Box className="mt-2 mb-4" display="inline-flex" flexDirection={"column"} >
			<Box className="w-100" width="100%" flexDirection="row" display="inline-flex" >
				<Collapse in={(bulkError && bulkError.length > 0)} orientation="vertical">
					<Alert 
						className="m-0"
						severity="error" 
						onClose={() => {setBulkError("")}}>
					<AlertTitle>Source Selection Error:</AlertTitle>
						{bulkError? bulkError: ""} 
					</Alert>
				</Collapse>
				<Collapse in={(bulkWarning && bulkWarning.length>0)} orientation="vertical">
					<Alert severity="warning" className="m-0" onClose={() => {setBulkWarning("")}}>
					<AlertTitle>Source Selection Warning:</AlertTitle>
					{(bulkWarning && bulkWarning.length > 0)? bulkWarning.split('\n').map(warn => <p>{warn}</p>): ""} 
					</Alert>
				</Collapse>
			</Box>
			<Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
				<Box p={1} className="m-0 text-right" id="bulkButtons" display="inline-flex" flexDirection="row" >
					<Button
						sx={{maxHeight: "35px",verticalAlign: 'bottom',}}
						variant="contained"
						type="button"
						size="small"
						className="btn btn-neutral"
						onClick={() => setShowSearchDialog(true)}>
						Add
						<FontAwesomeIcon
							className="fa button-icon m-2"
							icon={faPlus}/>
						</Button>
						<Button
						sx={{maxHeight: "35px",verticalAlign: 'bottom'}}
						variant="text"
						type='link'
						size="small"
						className='mx-2'
						onClick={(e) => handleInputUUIDs(e)}>
						{!showHIDList && (<>Bulk</>)}
						{showHIDList && (<>UPDATE</>)}
						<FontAwesomeIcon className='fa button-icon m-2' icon={faPenToSquare}/>
						</Button>
				</Box>
				<Box
					display="flex" 
					flexDirection="row"
					className="m-0 col-9 row"
					sx={{
						overflowX: "visible",
						overflowY: "visible",
						padding: "0px",  
						maxHeight: "45px",}}>
					<Collapse 
						in={showHIDList} 
						orientation="horizontal" 
						className="row"
						width="100%">
						<Box
							display="inline-flex"
							flexDirection="row"
							sx={{ 
								overflow: "hidden",
								width: "650px"}}>
							<FormControl >
								<TextField
									name="dataset_uuids_string"
									display="flex"
									id="dataset_uuids_string"
									// error={props?.fields?dataset_uuids_string?.error && props?.dataset_uuids_string?.error.length > 0 ? true : false}
									multiline
									placeholder="HBM123.ABC.456, HBM789.DEF.789, ..."
									variant="standard"
									size="small"
									fullWidth={true}
									onChange={(event) => handleInputChange(event)}
									value={selected_string}
									sx={{
										overflow: "hidden",
										marginTop: '10px',
										verticalAlign: 'bottom',
										width: "100%",
									}}/>
								<FormHelperText id="component-helper-text" sx={{width: "100%", marginLeft: "0px"}}>
									{"List of Dataset HuBMAP IDs or UUIDs, Comma Seperated " }
								</FormHelperText>
							</FormControl>
							<Button
								variant="text"
								type='link'
								size="small"
								onClick={(e) => {
									e.preventDefault();
									setShowHIDList(false);
								}}>
								<ClearIcon size="small"/>
							</Button>
						</Box>
					</Collapse>
				</Box>
			</Box>
		</Box> 
	</>)
}