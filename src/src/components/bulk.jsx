import React from "react";
import BulkCreation from "./ingest/bulk";
export const RenderBulk = (props) => {

  function handleCancel(){
    if(this.props.handleCancel){
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };

  return (
    <div>
      <BulkCreation bulkType={props.bulkType} reportError={props.reportError} handleCancel={handleCancel} />
    </div>
  )
    
  }
  

