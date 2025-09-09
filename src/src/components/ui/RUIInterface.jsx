import React, {useEffect, useState, useRef} from "react";
import Box from "@mui/material/Box";
import { RUI_ORGAN_MAPPING } from "../../constants.jsx";

export const RUIInterface = ({organ, sex, tempSex, user, userEmail, location, register}) => {
  console.debug('%c◉ RUIInterface RUIInterface ', 'color:#00ff7b', organ, sex, user, location, register);
  const organList = localStorage.getItem('organs') ? JSON.parse(localStorage.getItem('organs')) : {};

  // Process Organ Info
  if(!organ || organ === "" || !organList[organ]) {
    throw new Error("RUIInterface: Missing or invalid organ");
  }
  const organ_id = RUI_ORGAN_MAPPING[organ];
  const organ_info = organList[organ].split("(");
  const organ_name = organ_info[0].toLowerCase().trim();
  const organ_side = organ_info[1]?.replace(/\(|\)/g, "").toLowerCase();

  // Process Location Info
  if(location && location !== "") {
    console.debug('%c◉ TYPEOF ', 'color:#00ff7b', typeof location, location);
    if(typeof location === "string"){
      location = JSON.parse(location);
    }else if(typeof location === "object") {
      location = location;
    }
  }else{
    location = null;
  }

  // const rui = document.getElementById('rui');
  let ruiData = useRef({
    "organ-options": localStorage.getItem('organs') ? JSON.parse(localStorage.getItem('organs')) : {},
    baseHref: `${process.env.REACT_APP_RUI_BASE_URL}ui/ccf-rui/`,
    // "use-download": false,
    consortium: "HuBMAP",
    register: function (tissueBlockSpatialData) {
      alert("SAVED")
        // console.log("tissueBlockSpatialData");
        // console.log(tissueBlockSpatialData);
        // self.props.setRuiLocation(tissueBlockSpatialData);
        // self.props.setShowRui(false);
    },
    editRegistration: location ? location : null,
    user:{
      firstName: user.split(" ")[0],
      lastName: user.split(" ")[1],
      email: userEmail ? userEmail : ""
    },
    organ: {
      ontologyId: organ_id,
      name: organ_name,
      sex: sex ? sex : tempSex,
      side: organ_side
    },
    cancelRegistration : (str) => cancelRegistration(str),
  });
  console.debug('%c◉ ruiData ', 'color:#00ff7b', ruiData.current);

  function cancelRegistration(str) {
     console.log("cancelRegistration ",str);
  }
  function saveRegistration(str) {
     console.log("saveRegistration ",str);
  }

  return(
    <Box id='unityContainer' className='webgl-content rui mat-typography' sx={{ height: '100%', width: '100%' }}>
      <ccf-rui
        ref={ruiData.current}
        base-href={ruiData.current.baseHref}
        useDownload={false}
        user={JSON.stringify(ruiData.current.user)}
        organ={JSON.stringify(ruiData.current.organ)}
        // register={alert("SAVE")}
        register={(str) => ruiData.register(str)}
        cancel-registration={(str) => alert("Cancelled"+str)}
        consortium={ruiData.current.consortium}
        edit-registration={ruiData.current.editRegistration ? JSON.stringify(ruiData.current.editRegistration) : null}
        organ-options={JSON.stringify(ruiData.current["organ-options"])}
        skip-unsaved-changes-confirmation="true">
      </ccf-rui>
    </Box>
  );
}
