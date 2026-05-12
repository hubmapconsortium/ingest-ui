import { useState } from "react";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SyncProblemIcon from "@mui/icons-material/SyncProblem";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ddLog } from "../../utils/doglog";
import { useEffect } from "react";

const baseChevronStyle = {
  cursor: "pointer",
  color: "#fff",
  transition: "transform 200ms ease-in-out",
  height: "0.6em",
  marginLeft: "-3px",
  paddingBottom: "2px",
};

function APIErrorItem({ err, idx, setAPIErrQueue }) {
  const [openDetail, setOpenDetail] = useState(false);
  const [visible, setVisible] = useState(true);
  const ANIM_MS = 360;
  const title = err && err[0] ? err[0] : "API Error";
  const details = err && err[1] ? err[1] : "No Details could be extracted";
  const extra = err && err[2] ? err[2] : null;
  const hidePrefix = err && err[3] ? err[3] : false;

  useEffect(() => {
    try {
      const msg = `${title} - ${typeof details === 'string' ? details : JSON.stringify(details)}`;
      // try{ ddMeta.error = { kind: 'auth', message: errorObj.message, stack: errorObj.stack }; }catch(e){}

      // ddLog('error', loginError, ddMeta); 
      ddLog('error', msg, { api_alert: { title, details, extra } });
    } catch (e) {
      try { console.warn('ddLog for APIAlert failed', e); } catch (_) {}
    }
  }, []);

  const closeThisAlert = () => {
    // play exit animation, then remove from queue
    setVisible(false);
    setTimeout(() => {
      setAPIErrQueue((prev) => prev.filter((_, i) => i !== idx));
    }, ANIM_MS);
  };

  return (
    <div className={`api-alert-wrap ${visible ? 'enter' : 'exit'}`}>
      <Alert
        className="APIAlertCell"
        variant="filled"
        severity="error"
        icon={<SyncProblemIcon />}
        sx={{ mb: 1 }}
        action={
          <IconButton
            size="small"
            aria-label={`close-alert-${idx}`}
            color="inherit"
            onClick={closeThisAlert}
          >
            <FontAwesomeIcon icon={faTimes} />
          </IconButton>
        }
      >
        {!hidePrefix && <>{title}</>}
        {extra && <>&nbsp; {extra}</>}
        &nbsp;| Render full error details?
        <ArrowForwardIosIcon
          onClick={() => setOpenDetail(!openDetail)}
          sx={
            openDetail
              ? { ...baseChevronStyle, transform: "rotate(90deg)" }
              : baseChevronStyle
          }
        />
        <Collapse in={openDetail}>{details}</Collapse>
      </Alert>
    </div>
  );
}

export default function APIAlertHandler({ APIErrQueue, setAPIErrQueue }) {
  return (
    <Box
      className="ErrorPanel mb-2"
      sx={() => ({
        "& .APIAlertCell":
          APIErrQueue.length > 1
            ? {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
              }
            : {},
        "& .APIAlertCell:first-of-type":
          APIErrQueue.length > 1
            ? {
                borderTopLeftRadius: "0.375rem",
                borderTopRightRadius: "0.375rem",
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }
            : {},
        "& .APIAlertCell:not(:last-of-type)":
          APIErrQueue.length > 1
            ? {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
              }
            : {},
      })}
    >
      {APIErrQueue.map((err, idx) => (
        <APIErrorItem err={err} idx={idx} key={idx} setAPIErrQueue={setAPIErrQueue} />
      ))}
    </Box>
  );
}
