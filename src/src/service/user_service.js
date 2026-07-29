import { createContext } from 'react';
import {ingest_api_all_groups, ingest_api_user_admin} from './ingest_api'

export const UserContext = createContext('Default Value');
export const userInfo = JSON.parse(localStorage.getItem("info")); 

export function getAllGroups(auth){
    try {
        ingest_api_all_groups(auth)
            .then((res) => {
                return(sortGroupsByDisplay(res.results))
            })
            .catch(() => {
            })
    }catch {
    }
}

export function getAllSortedGrouops(auth){
    try {
        ingest_api_all_groups(auth)
            .then((res) => {
                return(sortGroupsByDisplay(res.results))
            })
            .catch(() => {
            })
    }
    catch {
    }
}

export function sortGroupsByDisplay(obj) {
    var result = {
      TMC: [],
      RTI: [],
      TTD: [],
      DP: [],
      TC: [],
      MC: [],
      EXT: [],
      IEC: [],
    };
    var sortedResult = [];
    for (var key in obj) {
      var shortname = obj[key].shortname;
      var prefix = shortname.split(" ");
      if (["TMC", "RTI", "TTD", "DP", "TC", "MC", "EXT", "IEC"].includes(prefix[0])){
        result[prefix[0]].push({
          shortName: obj[key].shortname,
          displayname: obj[key].displayname,
          uuid: obj[key].uuid,
        });
      }
    }
    sortedResult.push(
      result["TMC"],
      result["RTI"],
      result["TTD"],
      result["DP"],
      result["TC"],
      result["MC"],
      result["EXT"],
      result["IEC"]
    );
    var sortedResultFlat = sortedResult.flat();
    return sortedResultFlat;
};

export function adminStatusValidation() {
  return ingest_api_user_admin(userInfo.groups_token)
    .then((results) => {
      return results
    })
    .catch((err) => {
      return new Error(err)
    })
}
