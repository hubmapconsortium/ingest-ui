import React from "react";
import { Formik, Form, Field, ErrorMessage, useFormik } from 'formik';
import * as yup from 'yup';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Dialog from '@material-ui/core/Dialog';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {faUserShield } from "@fortawesome/free-solid-svg-icons";

import SearchComponent from "../search/SearchComponent";


export const PublicationForm = (props) => {
  const [showSourceSearch, setShowSourceSearch] = React.useState(false);
  
  function onClick(data){
    console.debug("Eeek! I'm Not ready yet!");
  }
  function onSelectSource(data){
    console.debug("Source acquired!", data);
  }
  function showModal() {
    setShowSourceSearch(true)
  };
  
  function hideModal() {
    setShowSourceSearch(false)
  };


  return (
    <div className="expanded-form">
      <div className='row'>
        <div className='col-md-6'>
          <h3>
            <Chip label="NEW" color="primary" />
            <span className="mx-1"> HuBMAP Published ID </span>
          </h3>
          <p>
            <strong>
              <big>HBM.MSFG.9546</big>
            </strong>
          </p>
        </div>
        <div className='col-md-6'>
          <Alert severity="error" className='alert alert-danger' role='alert'>
            <FontAwesomeIcon icon={faUserShield} /> - Do not upload any
            data containing any of the{" "}
            <span
              style={{ cursor: "pointer" }}
              className='text-primary'
              onClick={onClick}
            >
              18 identifiers specified by HIPAA
            </span>
          </Alert>
          {/* {this.renderVersionNav()} */}
        </div>  
      </div>

      <div className='row'></div>

      <div className='form-group'>
        {/* {this.renderSources()} */}
        <Dialog 
          fullWidth={true} 
          maxWidth="lg" 
          onClose={hideModal} 
          aria-labelledby="source-lookup-dialog" 
          open={showSourceSearch}>
          <DialogContent>
            <SearchComponent
              select={onSelectSource}
              custom_title="Search for a Source ID for your Dataset"
              filter_type="Dataset"
              modecheck="Source"
            />
          </DialogContent>  
          <DialogActions>
            <Button onClick={onClick} variant="contained" color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <Formik
        // See "List of required fields for publication dataset subclass and constraints"
        // https://docs.google.com/document/d/1wQxP3JMmPAgkFSmOajiVuGibGIUCRLh4LJlV4FCp6LI/
        initialValues={{
          Title: '',
          Authors: '',
          Souce: '',
          Publication_date: '',
          DOI: '',
          URL: '',
          Venue: '',
          Volume: '',
          Issue: '',
          Pages: '',
          Article_number: '',
          Status: '',
        }}
        onSubmit={async (values) => {
          await new Promise((r) => setTimeout(r, 500));
          alert(JSON.stringify(values, null, 2));
        }}>
        <Form>
          
          <label htmlFor="title">Title</label>
          <Field id="title" name="title" placeholder="" />

          <label htmlFor="authors">Authors</label>
          <Field id="authors" name="title" placeholder="" />

          <label htmlFor="souce">Souce</label>
          <Field id="souce" name="title" placeholder="" />

          <label htmlFor="publication_date">Publication Date</label>
          <Field id="publication_date" name="title" placeholder="" />

          <label htmlFor="doi">DOI</label>
          <Field id="doi" name="title" placeholder="" />

          <label htmlFor="url">URL</label>
          <Field id="url" name="title" placeholder="" />

          <label htmlFor="venue">Venue</label>
          <Field id="venue" name="title" placeholder="" />

          <label htmlFor="volume">Volume</label>
          <Field id="volume" name="title" placeholder="" />

          <label htmlFor="issue">Issue</label>
          <Field id="issue" name="title" placeholder="" />

          <label htmlFor="pages">Pages</label>
          <Field id="pages" name="title" placeholder="" />

          <label htmlFor="article_number">Article_number</label>
          <Field id="article_number" name="title" placeholder="" />

          <label htmlFor="contributors">Contributors</label>
          <Field id="contributors" name="contributors" placeholder="" />

          <label htmlFor="contacts">Contacts</label>
          <Field id="contacts" name="contacts" placeholder="" />

          <label htmlFor="abstract">Abstract</label>
          <Field id="abstract" name="abstract" placeholder="" />

          <label htmlFor="datasets">Datasets</label>
          <Field id="datasets" name="datasets" placeholder="" />

          <label htmlFor="samples">Samples</label>
          <Field id="samples" name="samples" placeholder="" />

          <label htmlFor="donors">Donors</label>
          <Field id="donors" name="donors" placeholder="" />

        <hr />

        


          <Button type="submit">Submit</Button>
        </Form>

      </Formik>

    </div>
  )}
  