// Ingest specific APIs

import axios from "axios";


/*
 * User Group API
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
  ////console.debug(res.data)
  const group_list = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g;
          });
    ////console.debug(group_list);
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
        ////console.debug(res);
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
        //console.debug(res);
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
        //console.debug(res);
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
        //console.debug(res);
          let results = res.data;
      
        return {status: res.status, results: results}
      })
      .catch(err => {
        return {status: 500, results: err.response}
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

    //console.debug("ASSOC UUID", uuid)
   return axios
        .get(
          `${process.env.REACT_APP_SPECIMEN_API_URL}/specimens/${uuid}/ingest-group-ids`, options)
        .then(res => {
          if (res.data.ingest_group_ids.length > 1) {
            //console.debug("pre siblingid_list", res.data.ingest_group_ids);
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