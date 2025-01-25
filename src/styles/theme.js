import { createTheme } from "@mui/material/styles";

// Custom fonts
const theme = createTheme({
  typography: {
    fontFamily: "Montserrat, Arial, sans-serif",
    h1: {
      fontWeight: 700,
      fontSize: "3.5rem",
    },
    h2: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "2.25rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "2rem",
    },
    h5: {
      fontWeight: 600,
      fontSize: "1.75rem",
    },
    h6: {
      fontWeight: 400,
      fontSize: "1.5rem",
    },
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#e1705d",
    },
    text: {
      secondary: "#e1705d",
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          textTransform: "none",
        },
      },
    },
  },
});

export default theme;
