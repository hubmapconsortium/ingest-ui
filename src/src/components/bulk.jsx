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

  console.debug('%c⊙', 'color:#00ff7b', "BULK PROPS",props );
  return (
    <div>
      <BulkCreation bulkType={props.bulkType} reportError={props.reportError} handleCancel={handleCancel} />
    </div>
  )
    
  }
  

