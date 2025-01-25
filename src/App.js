import React from "react";
import { HashRouter as Router } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import AppRoutes from "./routes";
import theme from "./styles/theme"; // Import the custom theme

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline /> {/* Resets and normalizes CSS */}
      <Router>
        <AppRoutes />
      </Router>
    </ThemeProvider>
  );
}

export default App;
