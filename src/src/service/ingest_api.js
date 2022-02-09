// Ingest specific APIs

import axios from "axios";
import FormData from "form-data"

/*
 * User Groups only those data provider groups are return
 *
 */
export function ingest_api_users_groups(auth) { 
   const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`, options)
 .then(res => {
  //////console.debug(res.data)
  const group_list = res.data.groups
          .filter(g => g.data_provider)
          .map(g => {
            return g;
          });
    //console.debug('API USER GROUPs', group_list);
    return {status: res.status, results: group_list}
 })
 .catch(err => {
    return {status: err.response.status, results: err.response}
     //return err.response.status;
 });
}

/*
 * User Groups ALL groups are return
 *
 */
export function ingest_api_all_user_groups(auth) { 
   const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  return axios 
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`, options)
 .then(res => {
  //////console.debug(res.data)
  const group_list = res.data.groups;
         
    //console.debug('API USER GROUPs', group_list);
    return {status: res.status, results: group_list}
 })
 .catch(err => {
    return {status: err.response.status, results: err.response}
     //return err.response.status;
 });
}

/*
 * Get whether a user can update the selected entity data
 * 
 * return:  { status, results}
 */
export function ingest_api_allowable_edit_states(uuid, auth) { 
  //console.debug(uuid, auth);
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_METADATA_API_URL}/entities/${uuid}/allowable-edit-states`;
        
  return axios 
    .get(url,options)
      .then(res => {
        //console.debug("res");
        //console.debug(res);
          //let results = res.data.has_write;
      
        return {status: res.status, results: res.data}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};

/* 
 * create a dataset
 *
 */
export function ingest_api_create_dataset(data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets`;
        
  return axios 
     .post(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};

/* 
 * submit a dataset
 *
 */
export function ingest_api_dataset_submit(uuid, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};

/* 
 * submit a dataset
 *
 */
export function ingest_api_derived_dataset(uuid, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/datasets/${uuid}/submit`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
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
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "multipart/form-data"
      },
      onUploadProgress: (ev: ProgressEvent) => {
        const progress = ev.loaded / ev.total * 100;
        console.debug("prog", Math.round(progress));
      }
    };
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
        return {status: res.status, results: results}
      })
      .catch(err => {
        console.debug(err);
        return {status: err.response.status, results: err.response.data}
      });
};


/* 
 * ingest_api_bulk_entities - Registers / Inserts bulk entries based on ID of .TSV file upload
 *
 */
export function ingest_api_bulk_entities_register(type, data, auth) { 
  console.debug("Starting Data: ",data);
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
          "Content-Type": "application/json"
      },
      onUploadProgress: (ev: ProgressEvent) => {
        const progress = ev.loaded / ev.total * 100;
        console.debug("prog", Math.round(progress));
      }
    };
  let url =  `${process.env.REACT_APP_DATAINGEST_API_URL}/${type.toLowerCase()}/bulk`;
  console.debug("URL: ",url, "\n DATA",data,"\n OPTS", options);
  
  return axios 
     .post(url, data, options)
      .then(res => {
        console.debug("ingest_api_bulk_entities",res);
          let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(err => {
        console.debug(err);
        return {status: err.response.status, results: err.response.data}
      });
};


/* gets a list of associated IDS if the entity has multiple records. 
   these are multi-labs records
*/
export function ingest_api_get_associated_ids(uuid, auth) {
   const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

    ////console.debug("ASSOC UUID", uuid)
   return axios
        .get(
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${uuid}/ingest-group-ids`, options)
        .then(res => {
          if (res.data.ingest_group_ids.length > 1) {
            ////console.debug("pre siblingid_list", res.data.ingest_group_ids);
            // res.data.ingest_group_ids.push({
            //   hubmap_identifier: this.props.editingEntity.hubmap_id,
            //   uuid: this.props.editingEntity.uuid,
            //   lab_tissue_id: this.props.editingEntity.lab_tissue_sample_id || "",
            //   rui_location: this.props.editingEntity.rui_location || ""
            // });
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
          return {status: res.status, results: res.data.ingest_group_ids}
        })
        .catch(err => {
          return {status: 500, results: err.response}
        });
}

export function ingest_api_get_globus_url(uuid, auth) {
  const config = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "multipart/form-data",
      },
    };

    return axios
      .get(
        `${process.env.REACT_APP_ENTITY_API_URL}/entities/dataset/globus-url/${uuid}`,
        config
      )
      .then((res) => {
        return {status: 200, results: res.data}
      })
      .catch((err) => {
        return {status: 500, results: err.response}
      });
}




/* 
 * Submit
 *
 */
export function ingest_api_submit_upload(uuid, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/submit`;
//console.debug(data);
  return axios 
     .put(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};



/* 
 * Validate
 *
 */
export function ingest_api_validate_upload(uuid, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/validate`;
//console.debug(data);
  return axios 
     .put(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};


/* 
 * Reorganize or uploads
 *
 */
export function ingest_api_reorganize_upload(uuid, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
  const data = {}
    
  let url = `${process.env.REACT_APP_DATAINGEST_API_URL}/uploads/${uuid}/reorganize`;

//console.debug(data);
  return axios 
     .put(url, data, options)
      .then(res => {
        ////console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
      });
};
