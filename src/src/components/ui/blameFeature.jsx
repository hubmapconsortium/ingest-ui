import React, { useEffect, useState,useContext  } from "react";
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormHelperText from '@mui/material/FormHelperText';
import TextField from '@mui/material/TextField';
import {useNavigate,Routes,Route,Link,useLocation,} from "react-router-dom";
import { HuBMAPContext } from "../hubmapContext";


export const BlameFeature = (props) => {
  const navigate = useNavigate();
  const { allGroups } = useContext(HuBMAPContext);
  const [uuid] = useState(props.uuid);
  const [propGroup] = useState(props.assignedGroup);
  const [assignedGroup,setAssignedGroup] = useState("nah");
  const [ingestTask] = useState("");
  const [submittingUpdate, setSubmittingUpdate] = useState(false);
  const updateBlameData = props.updateBlameData


  useState(() => {
    console.debug('%c◉ propGroup ', 'color:#FFff7b', propGroup);
    if(!propGroup ){
      setAssignedGroup("nah")
      console.debug('%c◉ NAH ', 'color:#ff005d' );
    }
  }, [assignedGroup]);


  
	return (
    <>
      <div className="row mt-4  ">
        <div className='form-group col-6'> 
            <label htmlFor='assigned_to_group_name'>Assigned to Group Name </label>
            <Select
                fullWidth
                labelid="group_label"
                id="assigned_to_group_name"
                name="assigned_to_group_name"
                label="Assigned to Group Name"
                value={props.assignedGroup}
                onChange={(event) => props.updateBlameData(event)}>
                <MenuItem value="undefined"></MenuItem>
                {allGroups.map((group, index) => {
                    return (
                    <MenuItem key={index + 1} value={Object.values(group)[0]}>
                        {Object.values(group)[0]}
                    </MenuItem>
                    );
                })}
            </Select>
            <FormHelperText>The group responsible for the next step in the data ingest process.</FormHelperText>
        </div>
        <div className='form-group col-6'> 
            <label htmlFor='ingest_task'>Ingest Task </label>
              <TextField
                labelid="ingest_task_label"
                name="ingest_task"
                id="ingest_task"
                helperText="The next task in the data ingest process."
                // placeholder="Enter a keyword or HuBMAP/Submission/Lab ID;  For wildcard searches use *  e.g., VAN004*"
                fullWidth
                value={props.ingestTask}
                onChange={(event) => props.updateBlameData(event)}/>
        </div>
      </div>
    </>
	);
  
}