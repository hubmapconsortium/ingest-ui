import React, { useEffect, useState  } from "react";
import BulkCreation from "./ingest/bulk";




export const RenderBulk = (props) => {

      return (
        <div>
          <BulkCreation bulkType={props.bulkType} />
        </div>
      )
    
  }
  

