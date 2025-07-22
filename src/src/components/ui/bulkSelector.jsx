import React,{useState} from "react";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from "@mui/material/Button";
import ClearIcon from "@mui/icons-material/Clear";
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import {Typography} from "@mui/material";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import TableContainer from "@mui/material/TableContainer";
import Tooltip from '@mui/material/Tooltip';
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableChartIcon from '@mui/icons-material/TableChart';
import PublishIcon from '@mui/icons-material/Publish';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faPlus, faPenToSquare, faFolderTree,faTrash,faCircleExclamation,faTriangleExclamation} from "@fortawesome/free-solid-svg-icons";
import GridLoader from "react-spinners/GridLoader";
import SearchComponent from "../search/SearchComponent";
import {getPublishStatusColor} from "../../utils/badgeClasses";
import {FeedbackDialog} from "./formParts";

export function BulkSelector( {
	dialogTitle,
	dialogSubtitle,
	setShowSearchDialog,
	showSearchDialog,
	bulkError,
	// setBulkError,
	bulkWarning,
	// setBulkWarning,
	sourceBulkStatus,
	showHIDList,
	setShowHIDList,
	selected_string,
	sourcesData,
	permissions,
	handleInputUUIDs,
	handleSelectClick,
	handleInputChange,
	sourceRemover,
	sourceTableError,
	showBulkError,
	setShowBulkError,
	showBulkWarning,
	setShowBulkWarning,
	
} ){

	let [stringIDs, setStringIDs] = useState(selected_string ? selected_string : "")
	if(stringIDs !== selected_string){
		setStringIDs(selected_string);
	}
	
	function renderBulkDialog(){
		return (
			<Dialog 
				open={showHIDList === true ? true : false} 
				sx={{margin: "auto",border: "1px solid #444A65"}}
				fullWidth={true}>
				<DialogTitle sx={{
					background: "#444A65", 
					background: "linear-gradient(180deg,rgba(68, 74, 101, 1) 0%, rgba(88, 94, 122, 1) 100%)", 
					borderBottom: "1px solid #444A65",
					color: "white", padding: "2px 10px", 
					marginBottom: "10px"}}> 
					<FontAwesomeIcon icon={faFolderTree} sx={{marginRight: "10px"}} /> Providing {dialogTitle}</DialogTitle>
				<DialogContent > 
					<FormControl sx={{width: "100%",}} >
						<TextField
							name="dataset_uuids_string"
							fullWidth={true}
							sx={{marginBottom: "0.5em", width: "100%"}}
							display="flex"
							id="dataset_uuids_string"
							error={sourceTableError}
							multiline
							placeholder="HBM123.ABC.456, HBM789.DEF.789, ..."
							variant="standard"
							size="small"
							onChange={(event) => handleInputChange(event)}
							value={stringIDs}/>
						<FormHelperText id="component-helper-text" sx={{width: "100%", marginLeft: "0px"}}>
							{"List of Dataset HuBMAP IDs or UUIDs, Comma Seperated " }
						</FormHelperText>
					</FormControl>
				</DialogContent>
				<DialogActions sx={{
					background: "rgb(207, 211, 226)", 
					padding: "6px 10px", 
					display: "flex", 
					justifyContent: "space-between",
					borderTop: "1px solid #444A6540"}}>
					<Button
						size="small"
						sx={{background: "white", color: "#444a65"}}
						onClick={() => setShowHIDList(false)}
						variant="contained"
						startIcon={<ClearIcon />}
						color="primary">
						Close
					</Button>
					<Button
						size="small"
						onClick={(e) => handleInputUUIDs(e)}
						variant="contained"
						endIcon={<PublishIcon />}
						color="primary">
						Update
					</Button>
				</DialogActions>
			</Dialog>
		)
	}

	function renderFeedbackDialog(){
		
		return (<>
			<FeedbackDialog 
				showBulkMessage={showBulkError}
				setShowBulkMessage={setShowBulkError}
				bulkMessage={bulkError}
				// title={title},
				// summary={summary},
				// color={color},
				// icon={icon}
 			/>
			<FeedbackDialog 
				showBulkMessage={showBulkWarning}
				setShowBulkMessage={setShowBulkWarning}
				bulkMessage={bulkWarning}
				title={"Bulk Selection Warning"}
				summary={(bulkWarning && bulkWarning.length>0 ? "" :	"There are no warnings at this time" )}
				color={"#D3C52F"}
				icon={faTriangleExclamation}
 			/>
		</>
		)
	}

	let totalWarnings = 0;
	if (bulkWarning && bulkWarning.length > 0){
		for(let warningSets of bulkWarning){
			console.log("warningSets", warningSets[1].length);
			totalWarnings += warningSets[1].length;
		}
	}
	let totalErrors = 0;
	if (bulkError && bulkError.length > 0){
		for(let errorSets of bulkError){
			// console.log("errorSets", errorSets[1].length);
			totalErrors += errorSets[1]?errorSets[1].length:0;
		}
	}
	let totalRejected = totalWarnings + totalErrors;
	
	return (<>
		{/* Search Dialog */}
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
		{/* Bulk Input Field Dialog */}
		{renderBulkDialog()}
		{/* Feedback Dialogs */}
		{renderFeedbackDialog()}
		<Box sx={{
			position: "relative",
			top: 0,
			transitionProperty: "height",
			transitionTimingFunction: "ease-in",
			transitionDuration: "1s"}}> 
			<Box sx={{color: "#444a65", display: "inline-block",width: "100%;"}}>
					<Typography sx={{fontWeight: "bold", fontSize: "1rem",display: "inline-block", marginRight: "10px"}}><TableChartIcon sx={{marginRight: "2px", fontSize: "1.5em", "verticalAlign": "text-bottom"}} /> {dialogTitle}</Typography>
					<Typography variant="caption">{dialogSubtitle}</Typography>
				</Box>
			<Box className="sourceShade" sx={{
				opacity: sourceBulkStatus==="loading"?1:0, 
				background: "#444a65",
				background: "linear-gradient(180deg, rgba(88, 94, 122, 1) 0%,  rgba(68, 74, 101, 1) 100%)", 
				width: "100%", 
				height: "48px", 
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

			<Box id="bulkTableWrapper" sx={{borderRadius:"4px",border: "4px solid #444a65"}}>
				<TableContainer 
					style={{ border: sourceTableError?"2px solid red":""}}
					sx={{
						maxHeight: "450px", 
						scrollbarColor: "#cbcbcb #444a65", 
						overflowY: "scroll", 
						background: "#444a65"}}>
					<Table
						sx={{borderLeft: "12px solid #444a65"}} // Left Border up visually for the scrollbar on the right
						stickyHeader
						aria-label={{dialogTitle}}
						size="small"
						className="bulk-table table table-striped table-hover mb-0">
						<TableHead className="thead-dark font-size-sm" sx={{
							background: "linear-gradient(180deg,rgba(68, 74, 101, 1) 0%, rgba(88, 94, 122, 1) 100%)", 
							color: "white",
							padding:"2rem .0rem"}}>
							<TableRow className="   ">
							<TableCell sx={{width: "166px"}}> Source ID</TableCell>
							<TableCell component="th">Subtype</TableCell>
							<TableCell component="th" sx={{maxWidth: "200px"}}>Group Name</TableCell>
							<TableCell component="th">Status</TableCell>
							{permissions.has_write_priv && (
								<TableCell component="th" align="right">
								Action
								</TableCell>
							)}
							</TableRow>
						</TableHead>
						<TableBody >
							{(!sourcesData || sourcesData.length === 0) && (
								<TableRow sx={{borderBottom: "0px!important"}}>
									<TableCell colSpan={6} sx={{textAlign: "center"}}>
										No Data Loaded
									</TableCell>
								</TableRow>
							)}
							{(sourceBulkStatus ==="loading") && (
								<TableRow sx={{borderBottom: "0px!important"}}>
									<TableCell colSpan={6} sx={{textAlign: "center"}}><GridLoader size="2px" color="#444a65" width="30px"/>  </TableCell>
								</TableRow>
							)}
							{sourcesData.map((row, index) => (
							<TableRow
								key={row.hubmap_id + "" + index} 
								// onClick={() => handleSourceCellSelection(row)}
								className="row-selection">
								<TableCell className="clicky-cell" sx={{width: "166px"}} scope="row">
									{row.hubmap_id}
								</TableCell>
								<TableCell className="clicky-cell" scope="row" sx={{maxWidth: "210px"}}>
									{row.dataset_type ? row.dataset_type : row.display_subtype}
								</TableCell>
								<TableCell sx={{maxWidth: "250px"}} className="clicky-cell" scope="row">
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
			<Box sx={{color: "#444a65", display: "inline-block",width: "100%;"}}>
					<Typography sx={{fontSize: "0.8rem", float: "left"}}>Total Selected: {sourcesData.length} 
						{(permissions.has_write_priv && totalRejected >0) && (
							<Tooltip arrow title={
								<React.Fragment>
									<Typography color="inherit">{totalRejected} Rejected</Typography>
									{"Explore the Warning and Error details for more information"}
								</React.Fragment>}>
									 &nbsp;| <Typography component="span" sx={{fontSize: "0.8rem", textDecoration:"underline"}}>Total Rejected: {totalRejected}</Typography>
							</Tooltip>
						)}
					</Typography>
					<Typography sx={{fontSize: "0.8rem", float: "right"}}> 
						<Tooltip arrow title={
							<React.Fragment>
								<Typography color="inherit">{totalWarnings} Warning{bulkWarning.length>1?"s":""}</Typography>
								{"Click to view Details"}
							</React.Fragment>
						}>
							<span 
								onClick={() =>setShowBulkWarning(true)}
								style={
									bulkWarning && bulkWarning.length>0 ? {
										textDecoration: "underline #D3C52F",
										marginLeft: "10px",
										cursor: "pointer"
									}:{marginLeft: "10px"}
								}>
								<FontAwesomeIcon 
									icon={faTriangleExclamation} 
									color={bulkWarning && bulkWarning.length>0 ? "#D3C52F " : "rgb(68, 74, 101)"}/>  
								&nbsp;{totalWarnings}
							</span>
						</Tooltip>
						&nbsp;
						<Tooltip arrow title={
							<React.Fragment>
								<Typography color="inherit">{totalErrors} Error{bulkError.length>1?"s":""}</Typography>
								{"Click to view Details"}
							</React.Fragment>}>
							<span 
								onClick={() =>setShowBulkError(true)}
								style={
									bulkError && bulkError.length>0 ? {
										textDecoration: "underline #ff3028",
										marginLeft: "15px",
										cursor: "pointer"
									}:{marginLeft: "10px"}}>
								<FontAwesomeIcon 
									sx={{paddingLeft: "1.2em"}}  
									icon={faCircleExclamation} 
									color={bulkError && bulkError.length>0 ? "red " : "rgb(68, 74, 101)"}/> 
								&nbsp;{totalErrors}
							</span>
						</Tooltip>
					</Typography>
				</Box> 
		</Box>

		<Box className="mt-0 mb-4" >
			<Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
				<Box className="m-0 text-right" id="bulkButtons" display={!permissions.has_write_priv ? "none" :"inline-flex" } flexDirection="row" >
					<Button
						sx={{maxHeight: "35px", verticalAlign: 'bottom', background: "#444a65!important"}}
						variant="contained"
						type="button"
						size="small"
						disabled={!permissions.has_write_priv}
						className="btn btn-neutral"
						onClick={() => setShowSearchDialog(true)}>
						Add
						<FontAwesomeIcon
							className="fa button-icon m-2"
							icon={faPlus}/>
					</Button>
					<Button
						sx={{maxHeight: "35px",verticalAlign: 'bottom', color:"#444a65"}}
						variant="text"
						type='link'
						disabled={!permissions.has_write_priv}
						size="small"
						className='mx-2'
						onClick={(e) => handleInputUUIDs(e)}>
						{!showHIDList && (<>Bulk</>)}
						{showHIDList && (<>UPDATE</>)}
						<FontAwesomeIcon className='fa button-icon m-2' icon={faPenToSquare}/>
					</Button>
				</Box>

			</Box>
		</Box> 
	</>)
}