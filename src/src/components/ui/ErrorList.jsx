import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function ErrorList({ errors, onHover, onRowClick }) {
  if (!Array.isArray(errors)) return null;

  return (
    <Box className="renderErrorList">
      {errors.map((item, i) => {
        let rowStart;
        if (item?.row) {
          rowStart = (
            <>
              Row: {(item?.row) - 1} &nbsp;{item?.column?.toString()}
            </>
          );
        } else if (item?.name) {
          rowStart = <>{item?.name.toString()}</>;
        } else if (item?.column) {
          rowStart = <>{item?.column.toString()}</>;
        }

        const col = item?.column === 'organ_type' ? 'organ' : item?.column;
        const target = `${item?.row - 1}_${col}`;

        return (
          <Box
            id={"errListRow-" + item?.row}
            className={'errListRow'}
            data-column={item?.column}
            data-target={target}
            onMouseEnter={(e) => onHover(e, item)}
            onClick={(e) => {
              onRowClick(e, item, item?.row);
              // const el = document.getElementById(target);
            }}
            key={i}>
            <Typography variant="caption">
              <Typography variant="caption" component={'span'} className="bulk-error-chip">
                {rowStart}
              </Typography>
              &nbsp;
              {String(item?.error || '').replace(/^.*value "([^"]+)"/, 'value "$1"')}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
