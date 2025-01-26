import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button } from "@mui/material";
import oxyBackground from "../assets/bgQuiz2.webp";


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
          padding: { xs: "8px 16px", sm: "10px 20px", md: "12px 28px" },
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
          fontWeight: "bold",
          borderRadius: "25px",
          boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.3)",
          position: "absolute",
          bottom: { xs: "25%", sm: "30%" },
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}

export default HomeScreen;
