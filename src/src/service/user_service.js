import { createContext } from 'react';
import {ingest_api_all_groups} from './ingest_api'

export const UserContext = createContext('Default Value');

export function getAllGroups(auth){
    try {
        ingest_api_all_groups(auth)
            .then((res) => {
                console.debug('%c⊙ userService allGroups!!', 'color:#00ff7b', res.results );
                return(sortGroupsByDisplay(res.results))
            })
            .catch((err) => {
                console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
            })
    }catch (error) {
      console.debug("%c⭗", "color:#ff005d",error);
    }
}

export function getAllSortedGrouops(auth){
    try {
        ingest_api_all_groups(auth)
            .then((res) => {
                console.debug('%c⊙ userService allGroups!!', 'color:#00ff7b', res.results );
                return(sortGroupsByDisplay(res.results))
            })
            .catch((err) => {
                console.debug('%c⭗', 'color:#ff005d', "GROUPS ERR", err );
            })
    }
    catch (error) {
      console.debug("%c⭗", "color:#ff005d",error);
    }
}

// @TODO: Possily move into groups service?
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
