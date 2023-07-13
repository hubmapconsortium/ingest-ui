import axios from "axios";

/*
 * Search Entity method
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity(uuid, auth) { 
  console.debug("entity_api_get_entity", auth);
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
  return axios 
    .get(url,options)
      .then(res => {
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(error => {
        console.debug("entity_api_get_entity", error, error.response);
        if(error.response){
          return {status: error.response.status, results: error.response.data}
        }else{
          return {error}
        }
      });
};

/* 
 * update_entity - updates data of an existing entity
 *
 */
export function entity_api_update_entity(uuid, data, auth) { 
  // console.debug("entity_api_update_entity", data);
  const options = {
      headers: {
        'X-Hubmap-Application': 'ingest-api',
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}`;
        
  return axios 
     .put(url, data, options)
      .then(res => {
          console.debug("entity_api_update_entity", res);
          let results = res.data;
          return {status: res.status, results: results}
      })
      .catch(error => {
        if(error.response){
          console.debug("entity_api_update_entity Error", error.response.status, error.response.data);
          return {status: error.response.status, results: error.response.data}
        }else{
          return {error:error.response}
        }
      });
};

/* 
 * create_entity - create a new entity
 *
 */
export function entity_api_create_entity(entitytype, data, auth) { 
  const options = {
      headers: {
        'X-Hubmap-Application': 'ingest-api',
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${entitytype}`;
        
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
        return {status: res.status, results: results}
      })
      .catch((error) => {
        console.debug("entity_api_create_entity error", error);
        return {error}
      });
};

/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_create_multiple_entities(count, data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples/${count}`;
  return axios 
     .post(url, data, options)
      .then(res => {
          let results = res.data;
          let fin = [];
           results.forEach( element => {
              element.checked = false; // add a checked attribute for later UI usage
              fin.push(element);
            });
        return {status: res.status, results: fin}
      })
      .catch(error => {
        return {error}
      });
};


/* 
 * entity_api_create_multiple_entities - create multiple entities
 *
 */
export function entity_api_update_multiple_entities(data, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };

  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/multiple-samples`;
        
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
 * get ancestor-organs for the specified Entity 
 * 
 * return:  { status, results}
 */
export function entity_api_get_entity_ancestor(uuid, auth) { 
  const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/ancestor-organs`;
  return axios 
    .get(url,options)
      .then(res => {
        console.debug(res);
        let results = res.data;
        return {status: res.status, results: results}
      })
      .catch(error => {
        return {error}
      });
};

/*
 * get Globus URL
 * 
 * return:  { status, results}
 */
export function entity_api_get_globus_url(uuid, auth) { 
  console.debug("entity_api_get_globus_url", auth);
  let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/${uuid}/globus-url`;
  const options = {
    headers: {
      Authorization:
        "Bearer " + auth,
      "Content-Type": "application/json"
    }
  };
  return axios
    .get(url, options)
      .then((res) => {
        console.debug("entity_api_get_globus_url", res);
        return {status: res.status, results: res.data}
      })
      .catch((error) => {
        return {error}
      });
};

/*
 * Faux Entity Fill
 * 
 * return:  {results}
 */

// const timer = setTimeout(() => console.log('Initial timeout!'), 1000);
export function entity_api_get_entity_faux(auth) { 
  console.debug("entity_api_get_entity_faux");
  var editingCollection ={
    "hubmap_id": "HBM0001",
      "title": "TitleHere",
      "description": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book",
      "file": null,
      "dataset_uuids": [
        {
          "created_by_user_displayname": "Marda Jorgensen",
          "created_by_user_email": "marda@ufl.edu",
          "data_access_level": "public",
          "display_subtype": "Block",
          "entity_type": "Sample",
          "group_name": "University of Florida TMC",
          "hubmap_id": "HBM579.CMHL.343",
          "lab_tissue_sample_id": "19-003 Spleen CC-3",
          "submission_id": "UFL0001-SP-3",
          "uuid": "8e4f27d75768d026235b8eb1e7d6a007",
          "id": "8e4f27d75768d026235b8eb1e7d6a007"
        }
      ],
      "contributors": [
        {
          "Name": "Dr Jeff Hynes",
          "Role": "Lead Scientist",
          "Contact": ""
        },
        {
          "Name": "Dr. Eris Bacchaus",
          "Role": "Specialist",
          "Contact": "erisDBachus@aol.com"
        }
      ]
    }

    let url = `${process.env.REACT_APP_ENTITY_API_URL}/entities/565dfcde50745914f4613b9ff6a8b001`;
    const options = {
      headers: {
        Authorization:
          "Bearer " + auth,
        "Content-Type": "application/json"
      }
    };
    return axios
      .get(url, options)
        .then((res) => {

          return {status: res.status, results:editingCollection}
        })
        .catch((error) => {
          return {error}
        });
        
};
