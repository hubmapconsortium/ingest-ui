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

const HOVER_SPIN_MS = 420;
const RELOAD_SPIN_MS = 300;

function APIErrorItem({ err, idx, setAPIErrQueue }) {
  const [openDetail, setOpenDetail] = useState(false);
  const [reloadSpinning, setReloadSpinning] = useState(false);
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

  const reloadPage = () => {
    if (reloadSpinning) return;
    setReloadSpinning(true);
    setTimeout(() => {
      window.location.reload();
    }, RELOAD_SPIN_MS);
  };

  return (
    <Box className={`api-alert-wrap ${visible ? 'enter' : 'exit'}`}>
      <Alert
        className="APIAlertCell mb-1"
        variant="filled"
        severity="error"
        icon={
          <IconButton
            size="small"
            aria-label="refresh-page"
            color="inherit"
            className={`api-alert-refresh ${reloadSpinning ? 'click-spin' : ''}`}
            onClick={reloadPage}
          >
            <SyncProblemIcon fontSize="small" />
          </IconButton>
        }
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
    </Box>
  );
}

export default function APIAlertHandler({ APIErrQueue, setAPIErrQueue }) {
  return (
    <Box
      className="ErrorPanel mb-2"
      sx={() => ({
        "@keyframes apiAlertRefreshHoverSpin": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "65%": { transform: "rotate(375deg) scale(1.08)" },
          "82%": { transform: "rotate(345deg) scale(0.98)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },
        "@keyframes apiAlertRefreshClickSpin": {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "72%": { transform: "rotate(710deg) scale(1.08)" },
          "100%": { transform: "rotate(720deg) scale(1)" },
        },
        "& .MuiAlert-icon": {
          alignItems: "center",
          padding: 0,
        },
        "& .api-alert-refresh": {
          color: "#fff",
          margin: "-3px 0",
          padding: "3px",
          transition: "background-color 120ms ease-in-out",
        },
        "& .api-alert-refresh:hover": {
          animation: `apiAlertRefreshHoverSpin ${HOVER_SPIN_MS}ms cubic-bezier(.24, 1.35, .45, 1) both`,
          backgroundColor: "rgba(255, 255, 255, 0.16)",
        },
        "& .api-alert-refresh.click-spin": {
          animation: `apiAlertRefreshClickSpin ${RELOAD_SPIN_MS}ms cubic-bezier(.17, .84, .44, 1) both`,
          backgroundColor: "rgba(255, 255, 255, 0.24)",
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& .api-alert-refresh:hover, & .api-alert-refresh.click-spin": {
            animation: "none",
          },
        },
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
