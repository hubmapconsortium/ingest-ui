import { useCallback, useEffect, useRef, useState } from "react";

import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { useIdleTimer } from "react-idle-timer";

const SESSION_TIMEOUT_IDLE_TIME = 30 * 60 * 1000;

const Timer = ({ logout }) => {
  const [show, setShow] = useState(false);
  const [logoutIn, setLogoutIn] = useState(60);
  const countdownRef = useRef();
  const activeRef = useRef(false);

  const stopCountdown = useCallback(() => {
    window.clearTimeout(countdownRef.current);
    countdownRef.current = undefined;
  }, []);

  const resetTimer = useCallback(() => {
    stopCountdown();
    activeRef.current = true;
    setShow(false);
    setLogoutIn(60);
  }, [stopCountdown]);

  const onIdle = useCallback(() => {
    if (localStorage.getItem("isAuthenticated") !== "true") {
      return;
    }

    activeRef.current = false;
    setShow(true);
    setLogoutIn(60);

    const countDown = () => {
      setLogoutIn((remaining) => {
        if (remaining <= 1) {
          if (!activeRef.current) {
            logout();
          }
          return 0;
        }

        countdownRef.current = window.setTimeout(countDown, 1000);
        return remaining - 1;
      });
    };

    countdownRef.current = window.setTimeout(countDown, 500);
  }, [logout]);

  const { reset } = useIdleTimer({
    timeout: SESSION_TIMEOUT_IDLE_TIME,
    onIdle,
    onActive: resetTimer,
    onAction: resetTimer,
    debounce: 250,
  });

  useEffect(() => stopCountdown, [stopCountdown]);

  const hideModal = () => {
    resetTimer();
    reset();
  };

  return (
    <Dialog
      maxWidth="sm"
      aria-labelledby="idle-dialog"
      open={show}
    >
      <IconButton
        sx={(theme) => ({
          position: "absolute",
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
        aria-label="close"
        onClick={hideModal}
      >
        <CloseIcon />
      </IconButton>
      <DialogTitle id="idle-dialog">Are you still there?</DialogTitle>
      <DialogContent dividers>
        The application will automatically log out in {logoutIn} seconds. If
        you want to stay logged in, please click &quot;Close&quot; below.
      </DialogContent>
      <DialogActions>
        <Button sx={{ margin: "0 10px" }} onClick={hideModal}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Timer;
