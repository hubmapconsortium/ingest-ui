import React, { useEffect, useRef, useState } from "react";
import { RUI_ORGAN_MAPPING } from "../constants.jsx";
import { entity_api_get_entity_ancestor_list } from "../service/entity_api";

import LinearProgress from "@mui/material/LinearProgress";

export const RUI = (props) => {
  let[isLoading, setLoading] = useState(true);
  // let[ruiDetail, setRuiDetail] = useState(false);
  const ruiRef = useRef(null);
  
  useEffect(() => {
    const source = props.source;
    console.debug('%c◉ "RUI LOADING ', 'color:#00ff7b', props, source.uuid);

    // Fetch donor metadata and build the RUI object
    entity_api_get_entity_ancestor_list(source.uuid)
      .then((res) => {
        const donorDetails =
          res.results.length === 1
            ? res.results[0]
            : res.results.find((d) => d.entity_type === "Donor");

        const donorMeta =
          donorDetails.metadata.organ_donor_data ||
          donorDetails.metadata.living_donor_data;

        // Get Sex Details
        const donorSexDetails = donorMeta.find(
          (m) => m.grouping_code === "57312000"
        );

        // Get Organ Details
        const organList = JSON.parse(localStorage.getItem("organs"));
        const organInfo = organList[props.organ].split("(");

        // Parse location
        const location =
          props.location === "" ? null : JSON.parse(props.location);

        // Build the RUI object
        const rui = ruiRef.current;
        rui.baseHref = process.env.REACT_APP_RUI_BASE_URL;
        rui.user = {
          firstName: props.user.split(" ")[0],
          lastName: props.user.split(" ")[1],
        };

        rui.organ = {
          ontologyId: RUI_ORGAN_MAPPING[props.organ],
          name: organInfo[0].toLowerCase().trim(),
          sex: donorSexDetails?.preferred_term || "female",
          side: organInfo[1]?.replace(/\(|\)/g, "").toLowerCase(),
        };

        rui.register = (str) => {
          console.log(str);
          handleJsonRUI(str);
        };
        rui.fetchPreviousRegistrations = () => {
          // IEC TODO: Fetch previous registrations for this user/organization to the same organ
          return [];
        };
        rui.cancelRegistration = () => {
          rui.register(props.location);
        };
        if (
          location &&
          (!rui.editRegistration ||
            location["@id"] !== rui.editRegistration["@id"])
        ) {
          rui.editRegistration = location;
        }
        rui.useDownload = false;
        console.debug('%c◉ rui ', 'color:#00ff7b', rui);
        setLoading(false);
      })
      .catch((err) => {
        console.debug("ERR entity_api_get_entity_ancestor_list", err);
      });
  }, [props]);

  function handleJsonRUI(dataFromChild){
    this.setState({
      rui_location: dataFromChild,
      rui_check: true,
      rui_view: true,
      rui_click: false
    });
  };
  
  if(isLoading){
    return(<LinearProgress />);
  }else{
    return(
      <div className='webgl-content rui mat-typography'>
        <div 
          id='unityContainer'
          style={{ 
            width: 1000, 
            height: 1000, 
            marginLeft: 25}}>
          <ccf-rui ref={ruiRef} />
        </div>
      </div>
    );
  }
}

