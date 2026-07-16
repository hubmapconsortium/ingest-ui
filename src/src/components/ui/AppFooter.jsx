import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import SvgIcon from "@mui/material/SvgIcon";
import Typography from "@mui/material/Typography";

function GitHubMark(props) {
  return (
    <SvgIcon viewBox="0 0 16 16" {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.62 7.62 0 0 1 8 3.86c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </SvgIcon>
  );
}

export default function AppFooter() {
  const version = process.env.npm_package_version;

  return (
    <Box component="footer" className="app-footer">
      <Box className="app-footer-inner">
        <Typography className="app-footer-funding" variant="body2">
          The Human Biomolecular Atlas Program is funded by the <br />{" "}
          <Link href="https://commonfund.nih.gov/HuBMAP" target="_blank" rel="noopener noreferrer">
            Common Fund at the National Institutes of Health
          </Link>
          .
        </Typography>
        <Typography className="app-footer-link" variant="caption">
          <Link href="https://hubmapconsortium.org/" target="_blank" rel="noopener noreferrer">
            Collaboration Portal
          </Link>
        </Typography>
        {version && (
          <Link
            className="app-footer-version-link"
            href="https://github.com/hubmapconsortium/ingest-ui"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHubMark className="app-footer-github-icon" aria-hidden="true" />
            <Typography className="app-footer-version" variant="caption" component="span">
              v{version}
            </Typography>
          </Link>
        )}
      </Box>
    </Box>
  );
}
