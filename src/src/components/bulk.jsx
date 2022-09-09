import React from "react";
import BulkCreation from "./ingest/bulk";
// import {useNavigate} from "react-router-dom";



export const RenderBulk = (props) => {
  // let navigate = useNavigate();

  function handleCancel(){
    if(this.props.handleCancel){
      // How is this happening???
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };

      return (
        <div>
          <BulkCreation bulkType={props.bulkType} handleCancel={handleCancel} />
        </div>
      )
    
  }
  

