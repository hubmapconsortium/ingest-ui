import React, { Component, useEffect, useState  } from "react";

import { , search_api_search_group_list } from '../service/search_api';

// defining useFetch hook
export const useFetch = (params, token) => {
  // state to keep track of loading
  const [loadingData, setLoadingData] = useState(false);

  // state for data itself
  const [data, setData] = useState(null);

  // effect to fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // set data to loading
        setLoadingData(true);

        // request to load data, you can use fetch API too
        // const { data } = await axios.get(url);
        const { data } = await api_search2(params, token, 0, 100);

        // set data in state and loading to false
        setLoadingData(false);
        setData(data);
      } catch (error) {
        console.log("error", error);
      }
    };

  }, []);

  // return the data and loading state from this hook
  return [loadingData, data];
};
