import React, { useState, useEffect } from "react";
import {
  DndContext,
  TouchSensor,
  PointerSensor,
  useSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Favorite, ArrowCircleDown } from "@mui/icons-material";
import celebrateSound from "../assets/celebrateLeaderboard.mp3";
import correctSound from "../assets/correct.wav";
import wrongSound from "../assets/wrong.wav";
import oxyLogo from "../assets/oxy-logo-color.webp";
import Background from "../assets/Background.webp";

/** 1) Define a STATIC correct sequence that never changes */
const CORRECT_SEQUENCE = [
  "Organizational Goals & Development Focused Areas Identification",
  "Performance Goals & IDP Discussion with Direct Manager & Assessors",
  "Learning Solutions Implementation & Ongoing Feedback",
  "Performance Rating Calibration & Communication",
];

/** 2) Helper function to shuffle an array (randomize) */
function shuffleArray(array) {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

/** 3) Draggable Component */
function Draggable({ id, children, rotation = 0, margin = "0px" }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    transform: `${
      transform ? `translate(${transform.x}px, ${transform.y}px)` : ""
    } rotate(${rotation}deg)`,
    padding: "20px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: "grab",
    textAlign: "center",
    margin: margin,
  };

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </Box>
  );
}

/** 4) Droppable Component */
function Droppable({ id, children }) {
  const { setNodeRef } = useDroppable({ id });

  const style = {
    padding: "40px",
    backgroundColor: children ? "#d4edda" : "#e0e0e0",
    border: "2px dashed #aaa",
    borderRadius: "8px",
    minHeight: "100px",
    textAlign: "center",
    position: "relative",
    transition: "background-color 0.3s ease",
  };

  return (
    <Box ref={setNodeRef} style={style} data-id={id}>
      {children || "Drop Here"}
    </Box>
  );
}

/** 5) Main Game Component */
function GameScreen() {
  const navigate = useNavigate();

  // State: number of lives
  const [lives, setLives] = useState(3);

  // State: scattered draggable options (initially shuffled)
  const [options, setOptions] = useState(() => shuffleArray(CORRECT_SEQUENCE));

  // State: which option is placed in which drop zone (initially none)
  const [placedOptions, setPlacedOptions] = useState(Array(4).fill(null));

  // State: game status
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // State: disable draggables
  const [disableDraggables, setDisableDraggables] = useState(false);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
    preventDefault: true,
  });

  // Decide which sensor to use (mouse or touch)
  const [currentSensor, setCurrentSensor] = useState(pointerSensor);
  useEffect(() => {
    const handleTouchStart = () => setCurrentSensor(touchSensor);
    const handleMouseDown = () => setCurrentSensor(pointerSensor);

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [touchSensor, pointerSensor]);

  /** Play audio and manage disableDraggables */
  const playSound = async (sound) => {
    setDisableDraggables(true); // Disable draggables
    const audio = new Audio(sound);
    await new Promise((resolve) => {
      audio.onended = () => {
        setDisableDraggables(false); // Re-enable draggables after sound ends
        resolve();
      };
      audio.play();
    });
  };

  /** 7) Handle drop event */
  const handleDragEnd = async ({ active, over }) => {
    if (!over || disableDraggables) return; // Ignore if sound is playing

    const draggedOption = active.id; // The text of the dragged item
    const dropZoneIndex = parseInt(over.id, 10); // 0,1,2,3

    // If the drop zone is empty
    if (placedOptions[dropZoneIndex] === null) {
      // Check if correct option is dropped
      if (draggedOption === CORRECT_SEQUENCE[dropZoneIndex]) {
        // CORRECT DROP
        const newPlacedOptions = [...placedOptions];
        newPlacedOptions[dropZoneIndex] = draggedOption;

        // Remove the dragged item from scattered options
        const newScatteredOptions = options.filter(
          (opt) => opt !== draggedOption
        );

        // Update state
        setPlacedOptions(newPlacedOptions);
        setOptions(newScatteredOptions);

        // Check if all 4 are correct => Game won
        if (
          newPlacedOptions.every((opt, idx) => opt === CORRECT_SEQUENCE[idx])
        ) {
          setGameWon(true); // Display the win overlay
          await playSound(celebrateSound); // Play win sound and disable draggables
          return; // Stop further execution
        }

        // Play correct sound for individual correct placement
        await playSound(correctSound);
      } else {
        // INCORRECT DROP
        const dropZoneElement = document.querySelector(
          `[data-id='${over.id}']`
        );
        if (dropZoneElement) {
          dropZoneElement.classList.add("shake");
          setTimeout(() => dropZoneElement.classList.remove("shake"), 500);
        }

        await playSound(wrongSound);

        // Reset everything:
        setPlacedOptions(Array(4).fill(null)); // Clear all drop zones
        setOptions(shuffleArray(CORRECT_SEQUENCE)); // Shuffle and reset scattered options

        // Deduct life
        if (lives > 1) {
          setLives((prevLives) => prevLives - 1);
        } else {
          setGameOver(true);
        }
      }
    }
  };

  /** 8) Reset the game completely */
  const resetGame = () => {
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setPlacedOptions(Array(4).fill(null));
    setOptions(shuffleArray(CORRECT_SEQUENCE)); // fresh shuffle
    navigate("/");
  };

  return (
    <DndContext sensors={[currentSensor]} onDragEnd={handleDragEnd}>
      {/* OVERLAY: Game Over or Game Won */}
      {(gameOver || gameWon) && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <Typography textAlign="center" variant="h3" gutterBottom>
            {gameWon ? "Congratulations! You Won!" : "Game Over! Try Again."}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={resetGame}
            sx={{
              padding: "10px 20px",
              fontSize: "1.2rem",
            }}
          >
            {gameWon ? "Play Again" : "Try Again"}
          </Button>
        </Box>
      )}

      {/* MAIN CONTENT (only show if not gameOver or gameWon) */}
      {!gameOver && !gameWon && (
        <Box
          sx={{
            position: "relative",
            height: "100vh",
            overflowY: "auto",
            backgroundImage: `url(${Background})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: { xs: "10px", sm: "20px" },
          }}
        >
          {/* Logo */}
          <Box
            component="img"
            src={oxyLogo}
            alt="OXY Logo"
            sx={{
              width: { xs: "120px", sm: "300px" },
              height: "auto",
              marginBottom: "20px",
            }}
          />

          {/* Lives Display */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              justifyContent: "flex-start",
              gap: "10px",
              marginBottom: "40px",
              position: "absolute",
              top: { xs: "60px", sm: "150px" },
              right: { xs: "10px", sm: "20px" },
            }}
          >
            <Typography
              variant={"h5"}
              fontWeight="bold"
              sx={{ fontSize: { xs: "1.25rem", sm: "3rem" } }}
            >
              Lives Left
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: "5px",
              }}
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <Favorite
                  key={index}
                  sx={{
                    color: index < lives ? "red" : "grey",
                    fontSize: { xs: "1.5rem", sm: "3rem" },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Main Content: Drop Zones + Draggables */}
          <Box
            sx={{
              flex: 1,
              mt: 4,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "40px",
            }}
          >
            {/* Drop Zones in a column, with arrows in between */}
            <Box display="flex" flexDirection="column" gap="40px">
              {placedOptions.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    width: { xs: "300px", sm: "500px" },
                  }}
                >
                  <Droppable id={`${index}`}>{item}</Droppable>
                  {index < placedOptions.length - 1 && (
                    <>
                      <ArrowCircleDown
                        sx={{
                          fontSize: "3rem",
                          color: "#007bff",
                          position: "absolute",
                          bottom: "-45px",
                          left: "10%",
                        }}
                      />
                      <ArrowCircleDown
                        sx={{
                          fontSize: "3rem",
                          color: "#007bff",
                          position: "absolute",
                          bottom: "-45px",
                          right: "10%",
                        }}
                      />
                    </>
                  )}
                </Box>
              ))}
            </Box>

            {/* Scattered Draggables */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
                width: "100%",
                maxWidth: "800px",
                margin: "0 auto",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "20px",
              }}
            >
              {options.map((item) => (
                <Draggable
                  key={item}
                  id={item}
                  rotation={Math.random() * 30 - 15}
                  margin={`${Math.random() * 20}px`}
                  disabled={disableDraggables} // Disable when sound is playing
                >
                  {item}
                </Draggable>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </DndContext>
  );
}

export default GameScreen;
