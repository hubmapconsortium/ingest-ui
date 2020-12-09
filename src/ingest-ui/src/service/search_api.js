import React from "react";
import axios from "axios";

  // const apiConfig = {
  //   headers: {
  //     Authorization:
  //       "Bearer " + JSON.parse(localStorage.getItem("info")).nexus_token,
  //     "Content-Type": "application/json"
  //   }
  // };


export default function apiGetUserGroups(apiConfig) {
 axios
 .get(
   `${process.env.REACT_APP_METADATA_API_URL}/metadata/usergroups`,
   apiConfig
 )
 .then(res => {
  const display_names = res.data.groups
          .filter(g => g.uuid !== process.env.REACT_APP_READ_ONLY_GROUP_ID)
          .map(g => {
            return g.displayname;
          });
 })
 .catch(err => {
     return err.response.status;
 });
}

//export {apiGetUserGroups, apiConfig}