import React, { useState } from "react";
import { useLocation } from 'react-router-dom'
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Item from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUserShield} from "@fortawesome/free-solid-svg-icons";

export const HIPPA = (props) => {
  let[show, setShow] = useState(props.show ? props.show : false);

  function toggleHippa(){
    setShow(!show);
  }
  const location = useLocation();
  console.log(location.pathname);

  return (
    <React.Fragment>

      {/* <Modal show={props.show} handleClose={props.handleClose}> */}

      <Alert
        id="HIPPAAlert"
        severity="error"  
        sx={{color: "rgb(97, 26, 21)", border: "1px solid #f1aeae", background: "rgb(253, 237, 237)!important"}}
        iconMapping={{error: <FontAwesomeIcon style={{fontSize: "2em"}} icon={faUserShield} /> }}>
        Do not provide any Protected Health Information. <br />
         This includes the 
        <span
          style={{cursor: "pointer"}}
          className="text-primary"
          onClick={() => toggleHippa()}>{" "}
          18 identifiers specified by HIPAA
        </span>
      </Alert>
      <Dialog
        open={show}
        // onClose={handleClose}
        fullWidth={true}
        maxWidth="md"
        aria-labelledby="HIPPA Identifiers"
        aria-describedby="HIPPA Identifiers">
          <DialogTitle sx={{background: "rgb(253, 237, 237)", "color": "rgb(95, 33, 32)"}}>
            <Typography id="Dialog-title" >
              <FontAwesomeIcon sx={{fontSize: "3em"}} icon={faUserShield} />  18 identifiers specified by HIPAA
            </Typography>
          </DialogTitle>
          <DialogContent >
              <Box sx={{
                color: "rgba(0, 0, 0, 0.6)",
                display: 'flex',
                flexDirection: 'column',
                m: 'auto',
                width: 'fit-content',}}>
                <Grid container spacing={2} style={{marginTop: "10px"}}>
                  <Grid item xs={12} sm={6}>
                      <ol style={{fontSize: ".8em"}}>
                        <li>Names.</li>
                        <li>
                          All geographic subdivisions smaller than a state, including street
                          address, city, county, precinct, ZIP Code, and their equivalent
                          geographical codes, except for the initial three digits of a ZIP
                          Code if, according to the current publicly available data from the
                          Bureau of the Census:
                          <ol type="a">
                            <li>
                              The geographic unit formed by combining all ZIP Codes with the
                              same three initial digits contains more than 20,000 people.
                            </li>
                            <li>
                              The initial three digits of a ZIP Code for all such geographic
                              units containing 20,000 or fewer people are changed to 000.
                            </li>
                          </ol>
                        </li>
                        <li>All elements of dates (except year) for dates directly related to an
                          individual, including birth date, admission date, discharge date,
                          date of death; and all ages over 89 and all elements of dates
                          (including year) indicative of such age, except that such ages and
                          elements may be aggregated into a single category of age 90 or
                          older.</li>
                        <li>Telephone numbers.</li>
                        <li>Facsimile numbers.</li>
                        <li>Electronic mail addresses.</li>
                        <li>Social security numbers.</li>
                      </ol>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                      <ol start="8" style={{fontSize: ".8em"}}>
                        <li>Medical record numbers.</li>
                        <li>Health plan beneficiary numbers.</li>
                        <li>Account numbers.</li>
                        <li>Certificate/license numbers.</li>
                        <li>Vehicle identifiers and serial numbers, including license plate
                          numbers.</li>
                        <li>Device identifiers and serial numbers.</li>
                        <li>Web universal resource locators (URLs).</li>
                        <li>Internet protocol (IP) address numbers.</li>
                        <li>Biometric identifiers, including fingerprints and voiceprints.</li>
                        <li>Full-face photographic images and any comparable images.</li>
                        <li>Any other unique identifying number, characteristic, or code, unless
                          otherwise permitted by the Privacy Rule for re-identification.</li>
                      </ol>
                  </Grid>
                </Grid>
              </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => toggleHippa()}>Close</Button>
          </DialogActions>
      </Dialog>

    </React.Fragment>
  );
}
// })
export default HIPPA;
