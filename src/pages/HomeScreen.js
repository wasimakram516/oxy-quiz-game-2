import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import oxyBackground from "../assets/Oxy-bg-start1.webp";


function HomeScreen() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/game");
  };
  
  return (
    <Box
      sx={{
        height: "100vh",
        backgroundImage: `url(${oxyBackground})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        position: "relative",
      }}
    >
      {/* Get Started Button */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleGetStarted}
        sx={{
          position: "absolute",
          top: "60%",
          padding: "12px 28px",
          fontSize: "2.5rem",
          fontWeight: "bold",
          borderRadius: "25px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}

export default HomeScreen;
