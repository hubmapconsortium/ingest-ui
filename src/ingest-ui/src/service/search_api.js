import React from "react";
import useAxios from "axios-hooks";

function SearchService() {

 const [{ data: getData, loading: getLoading, error: getError }] = useAxios(
    "https://api.myjson.com/bins/820fc"
  );

  const [
    { data: putData, loading: putLoading, error: putError },
    executePut
  ] = useAxios(
    {
      url: "https://api.myjson.com/bins/820fc",
      method: "PUT"
    },
    { manual: true }
  );


}