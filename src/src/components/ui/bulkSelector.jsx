import React, { useState, useEffect, useCallback } from "react";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from "@mui/material/Button";
import ClearIcon from "@mui/icons-material/Clear";
import FormControl from '@mui/material/FormControl';
import DialogTitle from '@mui/material/DialogTitle';
import FormHelperText from '@mui/material/FormHelperText';
import { Typography } from "@mui/material";
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faPenToSquare, faFolderTree, faTrash, faCircleExclamation, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import GridLoader from "react-spinners/GridLoader";
import SearchComponent from "../search/SearchComponent";
import { getPublishStatusColor } from "../../utils/badgeClasses";
import { FeedbackDialog } from "./formParts";
import { search_api_es_query_ids } from "../../service/search_api";
import {ubkg_api_generate_display_subtype} from "../../service/ubkg_api";

export function BulkSelector({
  dialogTitle = "Associated Dataset IDs",
  dialogSubtitle = "Datasets that are associated with this Publication",
  permissions,
  initialSelectedHIDs = [],
  initialSelectedUUIDs = [],
  initialSelectedString = "",
  initialSourcesData = [],
  onBulkSelectionChange,
	searchFilters,
  readOnly,
  preLoad,
}) {
  // Bulk selection state
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showHIDList, setShowHIDList] = useState(false);
  const [bulkError, setBulkError] = useState([]);
  const [bulkWarning, setBulkWarning] = useState([]);
  const [showBulkError, setShowBulkError] = useState(false);
  const [showBulkWarning, setShowBulkWarning] = useState(false);
  const [sourceBulkStatus, setSourceBulkStatus] = useState("idle");
  const [sourceTableError, setSourceTableError] = useState(false);

  const [selected_HIDs, setSelectedHIDs] = useState(initialSelectedHIDs);
  const [selected_UUIDs, setSelectedUUIDs] = useState(initialSelectedUUIDs);
  const [selected_string, setSelectedString] = useState(initialSelectedString);
  const [sourcesData, setSourcesData] = useState(initialSourcesData);
  
  let readOnlyState = readOnly || (permissions && permissions.has_write_priv === false);
  let [loadingState, setLoadingState] = useState(preLoad)

  // Sync sourcesData with prop changes
  useEffect(() => {
    setSourcesData(initialSourcesData);
  }, [initialSourcesData]);

	console.log("BulkSelector SOurces:  ",initialSourcesData, sourcesData)
  // Keep parent in sync
  useEffect(() => {
    if (onBulkSelectionChange) {
      onBulkSelectionChange(selected_UUIDs, selected_HIDs, selected_string, sourcesData);
    }
  }, [selected_UUIDs, selected_HIDs, selected_string, sourcesData]);

  // Bulk dialog input
  let [stringIDs, setStringIDs] = useState(selected_string ? selected_string : "");
  useEffect(() => {
    setStringIDs(selected_string);
  }, [selected_string]);

  // Validation helpers
  function preValidateSources(results, originalStringArr) {
    let errorArray = [];
    let warnArray = [];
    let goodArray = [];
    let typeArray = [];
    let originalString = originalStringArr || selected_string.split(",").map(s => s.trim());

    // Warnings: duplicated strings
    let seen = new Set();
    let duplicates = new Set();
    for (let id of originalString) {
      if (seen.has(id)) {
        duplicates.add(id);
      } else {
        seen.add(id);
      }
    }
    duplicates = Array.from(duplicates);

    // Entities requested by both UUID and HuBMAP ID
    const entitiesWithBoth = results.filter(
      entity =>
        originalString.includes(entity.uuid) && originalString.includes(entity.hubmap_id)
    );
    let dupeEntList = entitiesWithBoth.map(entity => `${entity.hubmap_id} (${entity.uuid})`);
    let combined = [...dupeEntList, ...duplicates];
    if (combined.length > 0) {
      warnArray.push([`The following  ${combined.length} Entit${combined.length > 1 ? 'ies' : 'y'} ${combined.length > 1 ? 'were' : 'was'} referenced more than once:`, combined]);
      setBulkWarning(warnArray);
      setShowBulkWarning(true);
    }

    // Errors: missing IDs
    const missingIds = originalString
      .filter(id => !results
        .some(entity => entity.uuid === id || entity.hubmap_id === id)
      );
    if (missingIds.length > 0) {
      errorArray.push([`The following Entit${missingIds.length > 1 ? 'ies' : 'y'} ${missingIds.length > 1 ? 'were' : 'was'} not found, either because ${missingIds.length > 1 ? 'they do' : 'it does'} not exist or ${missingIds.length > 1 ? 'their' : 'its'} ${missingIds.length > 1 ? 'IDs are' : 'ID is'} not formatted correctly:`, missingIds]);
    }

    // Type check
    for (let entity of results) {
      if (entity.entity_type !== "Dataset") {
        typeArray.push(`${entity.hubmap_id} (Invalid Type: ${entity.entity_type})`);
      } else { goodArray.push(entity); }
    }
    if (typeArray.length > 0) {
      errorArray.push([`The following ${typeArray.length} ID${typeArray.length > 1 ? 's' : ''} ${typeArray.length > 1 ? 'are' : 'is'} of the wrong Type:`, typeArray]);
    }
    if (errorArray.length > 0) {
      setBulkError(errorArray);
      setShowBulkError(true);
    }
    return goodArray;
  }

  // Handle bulk input dialog update
  const handleInputUUIDs = useCallback((e) => {
    if (e) e.preventDefault();
    setSourceTableError(false);
    if (!showHIDList) {
      setShowHIDList(true);
      setStringIDs(selected_HIDs.join(", "));
      setSourceBulkStatus("Waiting for Input...");
    } else {
      setShowHIDList(false);
      setSourceBulkStatus("loading");
      let cleanList = Array.from(new Set(
        stringIDs
          .split(",")
          .map(s => s.trim())
          .filter(s => s.length > 0)
      ));
      if (stringIDs.length <= 0) {
        setSourcesData([]);
        setSelectedHIDs([]);
        setSelectedString("");
        setBulkError([]);
        setBulkWarning([]);
        setSourceBulkStatus("complete");
        setSelectedUUIDs([]);
        setLoadingState(false);
      } else {
        let cols = ["hubmap_id", "uuid", "entity_type", "subtype", "group_name", "status", "dataset_type", "display_subtype"];
        search_api_es_query_ids(cleanList, ['datasets'], cols)
          .then((response) => {
            if (response.status >= 300) {
              setSourceBulkStatus("error");
              setBulkError([["Search error", [response.statusText || "Unknown error"]]]);
              return;
            } else if (response.results.length <= 0) {
              setBulkError([["No Datasets Found for the provided IDs", []]]);
            } else {
              let validatedSources = preValidateSources(response.results, cleanList);
              let entityHIDs = validatedSources.map(obj => obj.hubmap_id);
              let entityUUIDs = validatedSources.map(obj => obj.uuid);
              setSourcesData(validatedSources);
              setSelectedHIDs(entityHIDs);
              setSelectedUUIDs(entityUUIDs);
              setSelectedString(entityHIDs.join(", "));
              setShowHIDList(false);
              setSourceBulkStatus("complete");
            }
          })
          .catch((error) => {
            setBulkError([["Error", [error?.message || "Unknown error"]]]);
            setSourceBulkStatus("error");
          });
      }
    }
    // eslint-disable-next-line
  }, [showHIDList, stringIDs, selected_HIDs]);

  // Remove a source from the table
  const sourceRemover = (row_uuid, hubmap_id) => {
    setSelectedUUIDs((prev) => prev.filter((uuid) => uuid !== row_uuid));
    setSelectedHIDs((prev) => prev.filter((id) => id !== hubmap_id));
    setSourcesData((prev) => prev.filter((item) => item.hubmap_id !== hubmap_id));
    setSelectedString((prev) => {
      const filtered = prev
        .split(",")
        .map((s) => s.trim())
        .filter((id) => id && id !== hubmap_id);
      return filtered.join(", ");
    });
  };

  // Handle row selection from search dialog
  const handleSelectClick = (event) => {
    setSourceTableError(false);
    if (!selected_HIDs.includes(event.row.hubmap_id)) {
      setSelectedUUIDs((rows) => [...rows, event.row.uuid]);
      setSelectedHIDs((ids) => [...ids, event.row.hubmap_id]);
      setSelectedString((str) => str + (str ? ", " : "") + event.row.hubmap_id);
      setSourcesData((rows) => [...rows, event.row]);
      setShowSearchDialog(false);
    }
  };

  // Bulk dialog
  function renderBulkDialog() {
    return (
      <Dialog
        open={showHIDList === true}
        sx={{ margin: "auto", border: "1px solid #444A65" }}
        fullWidth={true}>
        <DialogTitle sx={{
          background: "#444A65",
          background: "linear-gradient(180deg,rgba(68, 74, 101, 1) 0%, rgba(88, 94, 122, 1) 100%)",
          borderBottom: "1px solid #444A65",
          color: "white", padding: "2px 10px",
          marginBottom: "10px"
        }}>
          <FontAwesomeIcon icon={faFolderTree} sx={{ marginRight: "10px" }} /> Providing {dialogTitle}
        </DialogTitle>
        <DialogContent>
          <FormControl sx={{ width: "100%", }} >
            <TextField
              name="dataset_uuids_string"
              fullWidth={true}
              sx={{ marginBottom: "0.5em", width: "100%" }}
              display="flex"
              id="dataset_uuids_string"
              error={sourceTableError}
              multiline
              placeholder="HBM123.ABC.456, HBM789.DEF.789, ..."
              variant="standard"
              size="small"
              onChange={(event) => setStringIDs(event.target.value)}
              value={stringIDs} />
            <FormHelperText id="component-helper-text" sx={{ width: "100%", marginLeft: "0px" }}>
              {"List of Dataset HuBMAP IDs or UUIDs, Comma Separated "}
            </FormHelperText>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{
          background: "rgb(207, 211, 226)",
          padding: "6px 10px",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #444A6540"
        }}>
          <Button
            size="small"
            sx={{ background: "white", color: "#444a65" }}
            onClick={() => setShowHIDList(false)}
            variant="contained"
            startIcon={<ClearIcon />}
            color="primary">
            Close
          </Button>
          <Button
            size="small"
            onClick={handleInputUUIDs}
            variant="contained"
            endIcon={<PublishIcon />}
            color="primary">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderFeedbackDialog() {
    return (<>
      <FeedbackDialog
        showMessage={showBulkError}
        setShowMessage={setShowBulkError}
        message={bulkError}
        title={"Bulk Selection Error"}
        color={"#d32f2f"}
        summary={(bulkError && bulkError.length > 0 ? "" : "There are no errors at this time")}
        note={"Acceptable results have already been attached to the table, and no further action is needed for them."}
        icon={faCircleExclamation} />
      <FeedbackDialog
        showMessage={showBulkWarning}
        setShowMessage={setShowBulkWarning}
        message={bulkWarning}
        title={"Bulk Selection Warning"}
        summary={(bulkWarning && bulkWarning.length > 0 ? "" : "There are no warnings at this time")}
        color={"#D3C52F"}
        icon={faTriangleExclamation} />
    </>);
  }


  function handleOpenPage(e,row) {
    console.log("row",row)
    e.preventDefault()    
    let url = `${process.env.REACT_APP_URL}/${row.entity_type}/${row.uuid}/`
    window.open(url, "_blank");
  }

  let totalWarnings = 0;
  if (bulkWarning && bulkWarning.length > 0) {
    for (let warningSets of bulkWarning) {
      totalWarnings += warningSets[1].length;
    }
  }
  let totalErrors = 0;
  if (bulkError && bulkError.length > 0) {
    for (let errorSets of bulkError) {
      totalErrors += errorSets[1] ? errorSets[1].length : 0;
    }
  }
  let totalRejected = totalWarnings + totalErrors;

  return (<>
    {/* Search Dialog */}
    <Dialog
      fullWidth={true}
      maxWidth="lg"
      onClose={() => setShowSearchDialog(false)}
      aria-labelledby="source-lookup-dialog"
      open={showSearchDialog === true}>
      <DialogContent>
        <SearchComponent
          select={handleSelectClick}
          modecheck="Source"
					custom_title={searchFilters.custom_title ? searchFilters.custom_title :"Select a Source Entity"}
					custom_subtitle={searchFilters.custom_subtitle ? searchFilters.custom_subtitle : null}
					restrictions={ searchFilters.restrictions ? searchFilters.restrictions : null}
					blacklist={searchFilters.blacklist ? searchFilters.blacklist : null}
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
      transitionDuration: "1s"
    }}>
      <Box sx={{ color: "#444a65", display: "inline-block", width: "100%;" }}>
        <Typography sx={{ fontWeight: "bold", fontSize: "1rem", display: "inline-block", marginRight: "10px" }}><TableChartIcon sx={{ marginRight: "2px", fontSize: "1.5em", "verticalAlign": "text-bottom" }} /> {dialogTitle}</Typography>
        <Typography variant="caption">{dialogSubtitle}</Typography>
      </Box>
      <Box className="sourceShade" sx={{
        opacity: sourceBulkStatus === "loading" ? 1 : 0,
        background: "#444a65",
        background: "linear-gradient(180deg, rgba(88, 94, 122, 1) 0%,  rgba(68, 74, 101, 1) 100%)",
        width: "100%",
        height: "48px",
        position: "absolute",
        color: "white",
        zIndex: 999,
        padding: "10px",
        boxSizing: "border-box",
        borderRadius: "0.375rem",
        transitionProperty: "opacity",
        transitionTimingFunction: "ease-in",
        transitionDuration: "0.5s"
      }}>
        <GridLoader size="2px" color="white" width="30px" /> Loading ...
      </Box>

      <Box id="bulkTableWrapper" sx={{ borderRadius: "4px", border: "4px solid #444a65" }}>
        <TableContainer
          style={{ border: sourceTableError ? "2px solid red" : "" }}
          sx={{
            maxHeight: "450px",
            scrollbarColor: "#cbcbcb #444a65",
            overflowY: "scroll",
            background: "#444a65"
          }}>
          <Table
            sx={{ borderLeft: "12px solid #444a65" }}
            stickyHeader
            aria-label={{ dialogTitle }}
            size="small"
            className="bulk-table table table-striped table-hover mb-0">
            <TableHead className="thead-dark font-size-sm" sx={{
              background: "linear-gradient(180deg,rgba(68, 74, 101, 1) 0%, rgba(88, 94, 122, 1) 100%)",
              color: "white",
              padding: "2rem .0rem"
            }}>
              <TableRow className="   ">
                <TableCell sx={{ width: "166px" }}> Source ID</TableCell>
                <TableCell component="th">Subtype</TableCell>
                <TableCell component="th" sx={{ maxWidth: "200px" }}>Group Name</TableCell>
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
                <TableRow sx={{ borderBottom: "0px!important" }}>
                  <TableCell colSpan={6} sx={{ textAlign: "center" }}>
                    No Data Loaded
                    {loadingState === true && (<> <br />Loading...</>)}
                  </TableCell>
                </TableRow>
              )}
              {(sourceBulkStatus === "loading") && (
                <TableRow sx={{ borderBottom: "0px!important" }}>
                  <TableCell colSpan={6} sx={{ textAlign: "center" }}><GridLoader size="2px" color="#444a65" width="30px" />  </TableCell>
                </TableRow>
              )}
              {sourcesData.map((row, index) => (
                <TableRow
                  key={row.hubmap_id + "" + index}
                  className="row-selection">
                  <TableCell className="clicky-cell" sx={{ width: "166px" }} scope="row">
                      <a onClick={(e) => handleOpenPage(e,row)} style={{cursor:"pointer"}} >
                      {row.hubmap_id}
                      </a>
                  </TableCell>
                  <TableCell className="clicky-cell" scope="row" sx={{ maxWidth: "210px" }}>
                    {row.dataset_type ? row.dataset_type : row.display_subtype}
                  </TableCell>
                  <TableCell sx={{ maxWidth: "250px" }} className="clicky-cell" scope="row">
                    {row.group_name}
                  </TableCell>
                  <TableCell className="clicky-cell" scope="row">
                    {row.status && (
                      <span className={"w-100 badge " + getPublishStatusColor(row.status, row.uuid)}>
                        {" "}{row.status}
                      </span>
                    )}
                  </TableCell>
                  {permissions.has_write_priv && !readOnlyState && (
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
      <Box sx={{ color: "#444a65", display: "inline-block", width: "100%;" }}>
        <Typography sx={{ fontSize: "0.8rem", float: "left" }}>Total Selected: {sourcesData.length}
          {(permissions.has_write_priv && totalRejected > 0) && (
            <Tooltip arrow title={
              <React.Fragment>
                <Typography color="inherit">{totalRejected} Rejected</Typography>
                {"Explore the Warning and Error details for more information"}
              </React.Fragment>}>
              &nbsp;| <Typography component="span" sx={{ fontSize: "0.8rem", textDecoration: "underline" }}>Total Rejected: {totalRejected}</Typography>
            </Tooltip>
          )}
        </Typography>
        <Typography sx={{ fontSize: "0.8rem", float: "right" }}>
          <Tooltip arrow title={
            <React.Fragment>
              <Typography color="inherit">{totalWarnings} Warning{bulkWarning.length > 1 ? "s" : ""}</Typography>
              {"Click to view Details"}
            </React.Fragment>
          }>
            <span
              onClick={() => setShowBulkWarning(true)}
              style={
                bulkWarning && bulkWarning.length > 0 ? {
                  textDecoration: "underline #D3C52F",
                  marginLeft: "10px",
                  cursor: "pointer"
                } : { marginLeft: "10px" }
              }>
              <FontAwesomeIcon
                icon={faTriangleExclamation}
                color={bulkWarning && bulkWarning.length > 0 ? "#D3C52F " : "rgb(68, 74, 101)"} />
              &nbsp;{totalWarnings}
            </span>
          </Tooltip>
          &nbsp;
          <Tooltip arrow title={
            <React.Fragment>
              <Typography color="inherit">{totalErrors} Error{bulkError.length > 1 ? "s" : ""}</Typography>
              {"Click to view Details"}
            </React.Fragment>}>
            <span
              onClick={() => setShowBulkError(true)}
              style={
                bulkError && bulkError.length > 0 ? {
                  textDecoration: "underline #ff3028",
                  marginLeft: "15px",
                  cursor: "pointer"
                } : { marginLeft: "10px" }}>
              <FontAwesomeIcon
                sx={{ paddingLeft: "1.2em" }}
                icon={faCircleExclamation}
                color={bulkError && bulkError.length > 0 ? "red " : "rgb(68, 74, 101)"} />
              &nbsp;{totalErrors}
            </span>
          </Tooltip>
        </Typography>
      </Box>
    </Box>

    <Box className="mt-0 mb-4" >
      <Box className="mt-2" display="inline-flex" flexDirection={"row"} width="100%" >
        <Box className="m-0 text-right" id="bulkButtons" display={(!permissions.has_write_priv || readOnlyState)? "none" : "inline-flex"} flexDirection="row" >
          <Button
            sx={{ maxHeight: "35px", verticalAlign: 'bottom', background: "#444a65!important" }}
            variant="contained"
            type="button"
            size="small"
            disabled={!permissions.has_write_priv}
            className="btn btn-neutral"
            onClick={() => setShowSearchDialog(true)}>
            Add
            <FontAwesomeIcon
              className="fa button-icon m-2"
              icon={faPlus} />
          </Button>
          <Button
            sx={{ maxHeight: "35px", verticalAlign: 'bottom', color: "#444a65" }}
            variant="text"
            type='link'
            disabled={!permissions.has_write_priv}
            size="small"
            className='mx-2'
            onClick={handleInputUUIDs}>
            {!showHIDList && (<>Bulk</>)}
            {showHIDList && (<>UPDATE</>)}
            <FontAwesomeIcon className='fa button-icon m-2' icon={faPenToSquare} />
          </Button>
        </Box>
      </Box>
    </Box>
  </>);
}