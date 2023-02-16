import React from "react";
import {PublicationForm} from "./publications/publications";
export const RenderPub = (props) => {
  function handleCancel(){
    if(this.props.handleCancel){
     this.props.handleCancel();
    }else{
      window.history.back();
    }
  };

      return (
        <div>
          <PublicationForm  handleCancel={handleCancel} />
        </div>
      )
    
  }
  

