import React from "react";
import { Box, Typography, Button } from "@mui/material";
import WarningIcon from '@mui/icons-material/Warning';
import { useNavigate } from "react-router-dom";
import HealingIcon from '@mui/icons-material/Healing';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HomeIcon from '@mui/icons-material/Home';

export default function NotFound() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const entityID = params.get('entityID');
  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "stretch",
        justifyContent: "center",
        // border: "1px solid linear-gradient(180deg, #444a65 0%, #585e7a 100%)",
        color: "#444a65",
        borderRadius: "12px",
        // boxShadow:0,
        margin: "40px auto",
        // maxWidth: 
        width:"100%",
        padding: 4}}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          pr: { sm: 4, xs: 0 },
          color:"#ff005d",
          borderRight: { sm: "2px solid #ff005d", xs: "none" },
          mb: { xs: 3, sm: 0 }}}>
        
        <Typography variant="h5" sx={{ mb: 2 }}>
          Entity Not Found
        </Typography>
      </Box>
      <Box
        sx={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          pl: { sm: 4, xs: 0 },
        }}>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Sorry, the Entity you are looking for  {entityID ? (<Typography variant="caption" component="span" sx={{background:"#ff005d", color:"#fff", padding:"5px", borderRadius:"1em",fontWeight:"bold"}}>({entityID})</Typography>) : ""}  was not found in HuBMAP. Please check the ID value again, return to the homepage, or try searching for it.
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            sx={{ background: "#444a65", color: "#fff", fontWeight: "bold" }}
            onClick={() => navigate("/")}>
            Go Home
          </Button>
          {/* {entityID && (
            <Button
              variant="outlined"
              endIcon={<KeyboardArrowRightIcon />}
              sx={{ color: "#444a65",  borderColor:"#444a65",  }}
              onClick={() => navigate(`/?keywords=${entityID}`)}>
              Search for {entityID}
            </Button>
          )} */}
        </Box>
        
      </Box>
    </Box>
  );
}
