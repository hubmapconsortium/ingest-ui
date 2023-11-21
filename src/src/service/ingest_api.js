// Ingest specific APIs

import axios from "axios";
import FormData from "form-data";



/*
 * User Groups only those data provider groups are return
 *
 */
export function ingest_api_users_groups(auth) { 
   const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`, options)
 .then(res => {
  const group_list = res.data.groups
          .filter(g => g.data_provider)
          .map(g => {
            return g;
          });
    // console.debug('API USER GROUPs', group_list);
    return {status:res.status, results:group_list}
 })
 .catch(error => {
   console.debug("ERR ingest_api_users_groups", error, error.response);
   if (error.response.response === "User is not a member of group HuBMAP-read") {
     console.debug("User exists just not in the read group");
    //  it's not really an /error/ to have anaccount w/o read
    return {status:200, results:error.response.response} 
   }
    if(error.response){
      return {status:error.response.status, results:error.response.data}
    }else{
      return {error}
    }
  });
}



/*
 * Upload a file
 *
 */
export function ingest_api_file_upload(data, options) { 
  return axios 
  .get(
    `${process.env.REACT_APP_DATAINGEST_API_URL}/file-upload`, data, options)
    .then(res => {
      // console.debug("ingest_api_file_upload", res);
      return {status:res.status, results:res}
    })
    .catch(error => {
        return {error}
      });
}


/*
 * User Groups ALL groups are return (For that user only)
 *
 */
export function ingest_api_all_user_groups(auth) { 
   const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`, options)
 .then(res => {
  const group_list = res.data.groups;
    return {status:res.status, results:group_list}
 })
 .catch(error => {
        return {error}
 });
}

/*
 * ALL groups are returned
 *
 */
export function ingest_api_all_groups(auth) { 
   const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/data-provider-groups`, options)
 .then(res => {
  const group_list = res.data.groups;
    return {status:res.status, results:group_list}
 })
 .catch(error => {
        return {error}
 });
}

/*
 * Get whether a user can update the selected entity data
 * 
 * return:  { status, results}
 */
export function ingest_api_allowable_edit_states(uuid, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_METADATA_API_URL}/entities/${uuid}/allowable-edit-states`;
  return axios 
    .get(url,options)
      .then(res => {
        return {status:res.status, results:res.data}
      })
      .catch(error => {
        console.debug("ingest_api_allowable_edit_states", error, error.response);
        if(error.response){
          return {status:error.response.status, results:error.response.data}
        }else{
          return {error}
        }
      });
};

/*
 * Get whether a user can update the selected entity data Regardless of Current Status
 * 
 * return:  { status, results}
 */
export function ingest_api_allowable_edit_states_statusless(uuid, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_METADATA_API_URL}/entities/${uuid}/allowable-edit-states?ignore-publication-status=true`;
  return axios 
    .get(url,options)
      .then(res => {
        return {status:res.status, results:res.data}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * create a dataset
 *
 */
export function ingest_api_create_dataset(data, auth) { 
  // console.debug("ingest_api_create_dataset", data);
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
          return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * create a publication
 *
 */
export function ingest_api_create_publication(data, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/publications`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
          return {status:res.status, results:results}
      })
      .catch(error => {
        if(error.response){
          return {status:error.response.status, results:error.response.data}
        }else{
          return {error}
        }
      });
};

/* 
 * submit a dataset
 *
 */
export function ingest_api_dataset_submit(uuid, data, auth) { 
  // console.debug("ingest_api_dataset_submit", data);
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * Publish a dataset
 *
 */
export function ingest_api_dataset_publish(uuid, data, auth) { 
  // console.debug("ingest_api_dataset_submit", data);
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/publish`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
      
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * Derived dataset
 *
 */
export function ingest_api_derived_dataset(uuid, data, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`; // @TODO: Derived? 
        
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
      
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
     });
};


/* 
 * ingest_api_bulk_entities - create A file COntaining bulk entries on .TSF file upload
 *
 */
export function ingest_api_bulk_entities_upload(type, data, auth) { 
  console.debug("Starting Data: ",data);
  console.debug("Going to : ",type);
  var dataForm = new FormData();
  dataForm.append('file', data);
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"multipart/form-data"},
      onUploadProgress:(ev: ProgressEvent) => {
        const progress = ev.loaded / ev.total * 100;
        console.debug("prog", Math.round(progress));
      }};
  let url =  `${process.env.REACT_APP_DATAINGEST_API_URL}/${type.toLowerCase()}/bulk-upload`;

  return axios 
    .post(url, dataForm, options)
      .then(res => {
        console.debug("ingest_api_bulk_entities",res);
        //There's a chance our data may pass the Entity validation, but not the Subsequent pre-insert Valudation
        // We might back back a 201 with an array of errors encountered. Let's check for that!  
        let results = res.data;
        console.debug("results",results);
        if(results[0]){
          console.debug("results DATA ",results[0]);
        }
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
     });
};


/* 
 * ingest_api_bulk_entities - Registers / Inserts bulk entries based on ID of .TSV file upload
 *
 */
export function ingest_api_bulk_entities_register(type, data, auth) { 
  console.debug("Starting Data: ",data);
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"},
      onUploadProgress:(ev: ProgressEvent) => {
        const progress = ev.loaded / ev.total * 100;
        console.debug("prog", Math.round(progress));
      }};
  let url =  `${process.env.REACT_APP_DATAINGEST_API_URL}/${type.toLowerCase()}/bulk`;
  console.debug("URL: ",url, "\n DATA",data,"\n OPTS", options);
  return axios 
     .post(url, data, options)
      .then(res => {
        console.debug('%c⭗ INGESTAPI BULK RES: ', 'color:#FF00FF',  res);
        // console.debug("ingest_ap i_bulk_entities",res);
          let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        // console.debug('%c‼️ INGESTAPI BULK ERR', 'color:#ff005d', error);
        // throw new Error(error);
        // var err = new Error(error);
        // throw err;
        return (error)
     });
};

/* gets a list of associated IDS if the entity has multiple records. 
   these are multi-labs records
*/
export function ingest_api_get_associated_ids(uuid, auth) {
   const options = {headers:{Authorization: "Bearer " + auth,
        "Content-Type":"application/json"}};
   return axios
        .get(
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${uuid}/ingest-group-ids`, options)
        .then(res => {
          if (res.data.ingest_group_ids.length > 1) {
            res.data.ingest_group_ids.sort((a, b) => {
              if (
                parseInt(
                  a.submission_id.substring(
                    a.submission_id.lastIndexOf("-") + 1
                  )
                ) >
                parseInt(
                  b.submission_id.substring(
                    a.submission_id.lastIndexOf("-") + 1
                  )
                )
              ) {
                return 1;
              }
              if (
                parseInt(
                  b.submission_id.substring(
                    a.submission_id.lastIndexOf("-") + 1
                  )
                ) >
                parseInt(
                  a.submission_id.substring(
                    a.submission_id.lastIndexOf("-") + 1
                  )
                )
              ) {
                return -1;
              }
              return 0;
            });
          }
          return {status:res.status, results:res.data.ingest_group_ids}
        })
        .catch(error => {
        return {error}
        });
}

export function ingest_api_get_globus_url(uuid, auth) {
  const config = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"multipart/form-data",},};

    return axios
      .get(
        `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url/`,
        config
      )
      .then((res) => {
        return {status:200, results:res.data}
      })
      .catch(error => {
        return {error}
      });
}



/* 
 * Create New Upload
 *
 */
export function ingest_api_create_upload(data, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"}};
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * Submit Uploads
 *
 */
export function ingest_api_submit_upload(uuid, data, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"}};
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/submit`;
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * Validate Upload
 *
 */
export function ingest_api_validate_upload(uuid, data, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"}};
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/validate`;
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
      
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * Reorganize or uploads
 *
 */
export function ingest_api_reorganize_upload(uuid, auth) { 
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"}};
  const data = {}
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/reorganize`;
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 *  Notify
 *
 */
export function ingest_api_notify_slack(auth, data) { 
  const options = {headers:{Authorization: "Bearer " + auth,
          "Content-Type":"application/json"}};
  data.send_to_email = true;
  // const data = ["data-testing-notificatons","Beep (O v O)!"]    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/notify`;
  return axios 
    .post(url,data,options)
    .then(res => {
      console.debug("ingest_api_notify_slack",res);
        let results = res.data;
        return {status:res.status, results:results}
      })
      .catch(error => {
        console.debug("ingest_api_notify_slack",error);
        return {error}
      });
};
