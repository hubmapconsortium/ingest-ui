import React from "react";
import BulkCreation from "./ingest/bulk";
import {useNavigate} from "react-router-dom";



export const RenderBulk = (props) => {
  let navigate = useNavigate();

  function HandleCancel(){
    navigate(-1);  
  };

      return (
        <div>
          <BulkCreation bulkType={props.bulkType} onCancel={HandleCancel} />
        </div>
      )
    
  }
  

