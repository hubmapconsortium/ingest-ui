// Ingest specific APIs

import axios from "axios";
import FormData from "form-data";

var globalToken = localStorage.getItem("info") ? JSON.parse(localStorage.getItem("info")).groups_token : null;
const options = {headers: {Authorization: "Bearer " + globalToken,
        "Content-Type": "application/json"}};
/*
 * User Groups only those data provider groups are return
 *
 */
export function ingest_api_users_groups(auth) { 
  console.debug('%c◉ Global: ', 'color:#00ff7b', globalToken);
  return axios
    .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/metadata/usergroups`, options)
      .then(res => {
        const group_list = res.data.groups
          .filter(g => g.data_provider)
          .map(g => {
            return g;
          });
        return {status: res.status, results: group_list}
      })
      .catch(error => {
        console.debug("ERR ingest_api_users_groups", error, error.response);
        if (error && error.response && error.response.response && error.response.response === "User is not a member of group HuBMAP-read") {
          console.debug("User exists just not in the read group");
          //  it's not really an /error/ to have anaccount w/o read
          return {status: 200, results: error.response.response} 
        }
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        }else{
          console.error('%c⊙ Off Format err', 'color:#ff007b', error); 
          return {error}
        }
      });
}


/*
 * Is User Admin
 *
 */
export function ingest_api_user_admin(auth) { 
  return axios 
  .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/metadata/usergroups`, options)
  .then(res => {
    console.debug('%c◉ res ', 'color:#00ff7b', res);
    let groups = res.data.groups;
    console.debug('%c◉ ADMIN Check:', 'color:#FF227b', groups);
    for (let group in groups) {
      let groupName = groups[group].name
      console.debug('%c◉ groupName ', 'color:#ffe921', groupName);
      if(groupName.includes("hubmap-data-admin")){
        return true
      }
    }
    return false
  })
  .catch(error => {
    console.debug("ERR ingest_api_users_groups", error, error.response);
    return {error}
  });
}

/*
 * User Groups ALL groups are return (For that user only)
 *
 */
export function ingest_api_all_user_groups(auth) { 
  return axios 
  .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/metadata/usergroups`, options)
  .then(res => {
    const group_list = res.data.groups;
    return {status: res.status, results: group_list}
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
  return axios 
    .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/metadata/data-provider-groups`, options)
    .then(res => {
      const group_list = res.data.groups;
      return {status: res.status, results: group_list}
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
export function ingest_api_allowable_edit_states(uuid) { 
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/entities/${uuid}/allowable-edit-states`;
  return axios 
    .get(url,options)
      .then(res => {
        return {status: res.status, results: res.data}
      })
      .catch(error => {
        console.debug("ingest_api_allowable_edit_states", error, error.response);
        if(error.response){
          return {status: error.response.status, results: error.response.data}
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
export function ingest_api_allowable_edit_states_statusless(uuid) { 
  
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/entities/${uuid}/allowable-edit-states?ignore-publication-status=true`;
  return axios 
    .get(url,options)
      .then(res => {
        return {status: res.status, results: res.data}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * create a dataset
 *
 */
export function ingest_api_create_dataset(data) { 
  // console.debug("ingest_api_create_dataset", data);
  

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * create a publication
 *
 */
export function ingest_api_create_publication(data) { 
  

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/publications`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(error => {
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        }else{
          return {error}
        }
      });
};

/* 
 * submit a dataset
 *
 */
export function ingest_api_dataset_submit(uuid, data) { 
  // console.debug("ingest_api_dataset_submit", data);
  
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * Publish a dataset
 *
 */
export function ingest_api_dataset_publish(uuid, data) { 
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/publish`;
  return axios 
     .put(url, data, options)
      .then(res => {
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * Derived dataset
 *
 */
export function ingest_api_derived_dataset(uuid, data) { 
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`; // @TODO: Derived? 
  return axios 
     .put(url, data, options)
      .then(res => {
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * ingest_api_bulk_entities - create A file COntaining bulk entries on .TSF file upload
 *
 */
export function ingest_api_bulk_entities_upload(type, data) { 
  var dataForm = new FormData();
  dataForm.append('file', data);
  let optionsMultipart = {
    headers: {
      Authorization: `Bearer ${globalToken}`,
      "Content-Type": "multipart/form-data"
    },
    // This hasnt been working (github.com/axios/axios/issues/5149#issuecomment-1705809606)
    onUploadProgress:(ev: ProgressEvent) => { 
      const progress = ev.loaded / ev.total * 100;
      console.debug("prog", Math.round(progress));
    }};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/${type.toLowerCase()}/bulk-upload`;
  return axios 
    .post(url, dataForm, optionsMultipart)
      .then(res => {
        console.debug("ingest_api_bulk_entities",res);
        //There's a chance our data may pass the Entity validation, but not the Subsequent pre-insert Valudation
        // We might back back a 201 with an array of errors encountered. Let's check for that!  
        let results = res.data;
        console.debug("results",results);
        if(results[0]){
          console.debug("results DATA ",results[0]);
        }
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * ingest_api_bulk_entities - Registers / Inserts bulk entries based on ID of .TSV file upload
 *
 */
export function ingest_api_bulk_entities_register(type, data) { 
  console.debug("Starting Data: ",data);
  const options = {
    headers: {
      Authorization: `Bearer ${globalToken}`,
      "Content-Type": "application/json"
    },
    // This hasnt been working (github.com/axios/axios/issues/5149#issuecomment-1705809606)
    onUploadProgress:(ev: ProgressEvent) => { 
      const progress = ev.loaded / ev.total * 100;
      console.debug("prog", Math.round(progress));
    }};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/${type.toLowerCase()}/bulk`;
  console.debug("URL: ",url, "\n DATA",data,"\n OPTS", options);
  return axios 
     .post(url, data, options)
      .then(res => {
        console.debug('%c⭗ INGESTAPI BULK RES: ', 'color:#FF00FF',  res);
        // console.debug("ingest_ap i_bulk_entities",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return (error)
     });
};

/* gets a list of associated IDS if the entity has multiple records. 
   these are multi-labs records
*/
export function ingest_api_get_associated_ids(uuid) {
   return axios
        .get(`${process.env.REACT_APP_DATAINGEST_API_URL}/specimens/${uuid}/ingest-group-ids`, options)
        .then(res => {
          if (res.data.ingest_group_ids.length > 1) { 
            res.data.ingest_group_ids.sort((a, b) => {
              if (
                parseInt(a.submission_id.substring(a.submission_id.lastIndexOf("-") + 1)) >
                parseInt(b.submission_id.substring(a.submission_id.lastIndexOf("-") + 1))
              ){
                return 1;
              }
              if (parseInt(b.submission_id.substring(a.submission_id.lastIndexOf("-") + 1)) >
                parseInt(a.submission_id.substring(a.submission_id.lastIndexOf("-") + 1))
              ){
                return -1;
              }
              return 0;
            });
          }
          return {status: res.status, results: res.data.ingest_group_ids}
        })
        .catch(error => {
        return {error}
        });
}

export function ingest_api_get_globus_url(uuid) {
  const configMultipart = {
    headers: {
      Authorization: `Bearer ${globalToken}`,
      "Content-Type":"multipart/form-data"
    }
  };
  return axios
    .get(`${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url/`,configMultipart)
    .then((res) => {
      return {status: 200, results: res.data}
    })
    .catch(error => {
      return {error}
    });
}

/* 
 * Create New Upload
 *
 */
export function ingest_api_create_upload(data) { 
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads`;
  return axios 
     .post(url, data, options)
      .then(res => {
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * Submit Uploads
 *
 */
export function ingest_api_submit_upload(uuid, data) { 
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/submit`;
  return axios 
     .put(url, data, options)
      .then(res => {
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 * Validate Upload
 *
 */
// changed from validate_upload to account for both Uploads and Datasets
export function ingest_api_validate_entity(uuid,type) { 
  let data = [uuid]
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/${type}/validate`;
  return axios 
    .post(url, data, options)
      .then(res => {
        console.debug('%c◉ ingest_api_validate_upload res ', 'color:#00ff7b', res);
        let results = res.data;
        console.debug('%c◉ ingest_api_validate_upload results ', 'color:#00ff7b', results);
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug('%c◉ ingest_api_validate_upload error ', 'color:#ff005d', error);
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        }else{
          console.error('%c⊙ Off Format err', 'color:#ff007b', error); 
          return {error}
        }
      });
};

/* 
 * Reorganize or uploads
 *
 */
export function ingest_api_reorganize_upload(uuid) { 
  const data = {}
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/reorganize`;
  return axios 
     .put(url, data, options)
      .then(res => {
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/* 
 *  Notify
 *
 */
export function ingest_api_notify_slack(data) { 
  
  data.send_to_email = true;
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/notify`;
  return axios 
    .post(url,data,options)
    .then(res => {
      console.debug("ingest_api_notify_slack",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug("ingest_api_notify_slack",error);
        return {error}
      });
};

/* 
 *  Bulk Metadata
 *
 */
export function ingest_api_upload_bulk_metadata(type, dataFile) { 
  console.debug('%c⭗', 'color:#ff005d', "ingest_api_upload_bulk_metadata", dataFile, type);
  const options = {headers: { Authorization: "Bearer " + globalToken,"Content-Type": "multipart/form-data"}};
  var formData = new FormData();
  formData.append('metadata', new Blob([dataFile],{type: 'file' }),dataFile.name);
  formData.append('entity_type', "Sample")
  formData.append('sub_type', type)
  formData.append('validate_uuids', 1)
  console.debug('%c⊙ DATA', 'color:#00ff7b', formData );
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/sample-bulk-metadata`;
  // console.debug('%c⊙ url,dataForm,options', 'color:#00ff7b', url,formData,options );
  return axios 
    .put(url,formData,options)
    .then(res => {
      console.debug("ingest_api_upload_bulk_metadata",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug('%c⭗  ingest_api_upload_bulk_metadata', 'color:#ff005d',error );
        // Is it a server error or just a Validation error? 
        console.debug('%c◉ error ', 'color:#00ff7b', error, error.status);
        // throw new Error(error);
        return {error}
      });
};

/* 
 *  Notify
 *
 */
export function ingest_api_publish_collection(auth, data) { 
  const options = {headers: {Authorization: `Bearer ${globalToken}`,"Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/collections/${data}/register-doi`;
  console.debug('%c◉ publish ', 'color:#00ff7b', url,options);
  return axios 
     .put(url, data, options)
      .then(res => {
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(error => {
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        }else{
          return {error}
        }
      });
};

/* 
 *  Pipeline Testing Privledges
 *
 */
export function ingest_api_pipeline_test_privs(auth) { 
  const options = {headers: {Authorization: "Bearer " + globalToken,"Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/has-pipeline-test-privs`;
  return axios 
    .get(url, options)
    .then(res => {
      console.debug("ingest_api_pipeline_test_privs",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug('%c⭗  ingest_api_pipeline_test_privs', 'color:#ff005d',error );
        // throw new Error(error);
        return {error}
      });
};

/* 
 *  Pipeline Testing Submit
 *
 */
export function ingest_api_pipeline_test_submit(auth, data) { 
  const options = {headers: {Authorization: "Bearer " + globalToken,"Content-Type":"application/json"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${data['uuid']}/submit-for-pipeline-testing`;
  console.debug('%c◉ url ', 'color:#00ff7b', url);
  return axios 
    .post(url, {}, options)
    .then(res => {
      console.debug("ingest_api_pipeline_test_submit",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug('%c⭗  ingest_api_pipeline_test_submit', 'color:#ff005d',error );
        // throw new Error(error);
        return {error}
      });
};

/* 
 * Contibutor TSV Validation
 *
 */
export function ingest_api_validate_contributors(auth,dataFile) { 
  const options = {headers: {Authorization: "Bearer " + globalToken,"Content-Type":"multipart/form-data"}};
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/metadata/validate?ensure-latest-cedar-version=true`;
  var formData = new FormData();
  formData.append('metadata', new Blob([dataFile],{type: 'text/tab-separated-values' }),dataFile.name);
  formData.append('entity_type', "contributors")

  return axios 
    .post(url, formData, options)
    .then(res => {
      console.debug("ingest_api_validate_contributors",res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug('%c⭗  ingest_api_validate_contributors', 'color:#ff005d',error );
        // throw new Error(error);
        return {error}
      });
};

