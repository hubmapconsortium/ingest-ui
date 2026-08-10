import React from 'react'
import Tooltip from '@mui/material/Tooltip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

function CopyToClipboard({text, timeout = 3000}) {
  const [open, setOpen] = React.useState(false);
  let st

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    navigator.clipboard.writeText(text)
    clearTimeout(st)
    setOpen(true);
    st = setTimeout(() => {
      setOpen(false)
    }, timeout)
  };
  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
            <span>
              <Tooltip
                describeChild
                onClose={handleTooltipClose}
                open={open}
                disableFocusListener
                disableHoverListener
                disableTouchListener
                title="Copied!"
                slotProps={{
                  popper: {
                    disablePortal: true,
                  },
                }}
              >
                <sup onClick={handleTooltipOpen}><ContentCopyIcon /></sup>
              </Tooltip>
            </span>
          </ClickAwayListener>
  )
}

export default CopyToClipboard