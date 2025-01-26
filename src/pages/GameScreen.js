import React, { useState, useEffect } from "react";
import {
  DndContext,
  TouchSensor,
  PointerSensor,
  useSensor,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Favorite, ArrowCircleDown } from "@mui/icons-material";
import celebrateSound from "../assets/celebrateLeaderboard.mp3";
import correctSound from "../assets/correct.wav";
import wrongSound from "../assets/wrong.wav";
import oxyLogo from "../assets/oxy-logo-color.webp";
import Background from "../assets/Background.webp";

const EndScreen = ({ gameWon, resetGame }) => {
  // Confetti setup
  const confettiWidth = window.innerWidth;
  const confettiHeight = window.innerHeight;

  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100vh",
        backgroundColor: gameWon
          ? "rgba(0, 128, 0, 0.85)"
          : "rgba(128, 0, 0, 0.85)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center", // Center-align text for all child components
        zIndex: 1000,
      }}
    >
      {/* Confetti for Win Screen */}
      {gameWon && <Confetti width={confettiWidth} height={confettiHeight} />}

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          background: "rgba(0, 0, 0, 0.6)",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.7)",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: { xs: "2rem", sm: "3rem" },
            marginBottom: "20px",
            color: gameWon ? "#ffeb3b" : "#ff5722",
            fontWeight: "bold",
            whiteSpace: "pre-line", // Allows line breaks from \n
          }}
        >
          {gameWon
            ? "🎉 Congratulations!\nYou Won! 🎉"
            : "Game Over! Try Again."}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            fontSize: { xs: "1rem", sm: "1.5rem" },
            marginBottom: "30px",
            color: "white",
          }}
        >
          {gameWon
            ? "You have successfully completed the puzzle! Great job!"
            : "You’ve run out of lives, but don’t give up! Try again to succeed!"}
        </Typography>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={resetGame}
            sx={{
              padding: "10px 20px",
              fontSize: "1.2rem",
              backgroundColor: gameWon ? "#4caf50" : "#d32f2f",
              "&:hover": {
                backgroundColor: gameWon ? "#388e3c" : "#b71c1c",
              },
            }}
          >
            {gameWon ? "Play Again" : "Try Again"}
          </Button>
        </motion.div>
      </motion.div>
    </Box>
  );
};

// 1) The correct final sequence (never changes)
const CORRECT_SEQUENCE = [
  "Organizational Goals & Development Focused Areas Identification",
  "Performance Goals & IDP Discussion with Direct Manager & Assessors",
  "Learning Solutions Implementation & Ongoing Feedback",
  "Performance Rating Calibration & Communication",
];

/**
 * Utility to shuffle an array of objects
 */
function shuffle(array) {
  return array
    .map((item) => ({ ...item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort, ...rest }) => rest);
}

/**
 * 2) Draggable Component
 */
function Draggable({ id, children, rotation = 0, margin = "0px", disabled }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
    disabled, // respects the "disableDraggables" state
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px) rotate(${rotation}deg)`
      : `rotate(${rotation}deg)`,
    padding: "20px",
    backgroundColor: "#f0f0f0",
    border: "1px solid #ccc",
    borderRadius: "8px",
    cursor: disabled ? "not-allowed" : "grab",
    textAlign: "center",
    margin: margin,
    userSelect: "none", // prevent text selection
  };

  return (
    <Box ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </Box>
  );
}

/**
 * 3) Droppable Component
 */
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

/**
 * 4) Main Game Component
 */
function GameScreen() {
  const navigate = useNavigate();

  // A) Lives
  const [lives, setLives] = useState(3);

  // B) Placed items (indexed by drop zone). Null if empty.
  const [placedOptions, setPlacedOptions] = useState(Array(4).fill(null));

  // C) Stable "shuffled" items that the user can drag from.
  //    Each item has: { text, rotation, margin }
  //    We only shuffle once when the component mounts.
  const [shuffledItems] = useState(() => {
    // Build array from correct sequence, but each with random angles/margin
    const initial = CORRECT_SEQUENCE.map((txt) => ({
      text: txt,
      rotation: Math.random() * 30 - 15,
      margin: `${Math.random() * 20}px`,
    }));
    return shuffle(initial);
  });

  // D) Overall game state
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // E) Disable draggables while sound is playing
  const [disableDraggables, setDisableDraggables] = useState(false);

  // F) DnD sensors
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

  /**
   * Function: Play audio and temporarily disable draggables
   */
  const playSound = async (sound) => {
    setDisableDraggables(true);
    const audio = new Audio(sound);
    await new Promise((resolve) => {
      audio.onended = () => {
        setDisableDraggables(false);
        resolve();
      };
      audio.play();
    });
  };

  /**
   * G) onDragEnd logic
   */
  const handleDragEnd = async ({ active, over }) => {
    if (!over || disableDraggables) return; // If no valid drop target or locked, do nothing

    const draggedText = active.id; // The text of the dragged item
    const dropZoneIndex = parseInt(over.id, 10); // e.g. 0, 1, 2, 3

    // If that drop zone is already filled, ignore
    if (placedOptions[dropZoneIndex] !== null) {
      return;
    }

    // 1) Enforce top-to-bottom rule without penalty:
    // If user tries slot i>0 but slot (i-1) is incorrect or unfilled, just ignore the drop.
    if (
      dropZoneIndex > 0 &&
      placedOptions[dropZoneIndex - 1] !== CORRECT_SEQUENCE[dropZoneIndex - 1]
    ) {
      // Just do nothing. Item will "snap back" automatically (no shake, no life loss).
      return;
    }

    // 2) Check if the dragged item is correct for this zone
    if (draggedText === CORRECT_SEQUENCE[dropZoneIndex]) {
      // CORRECT
      const newPlaced = [...placedOptions];
      newPlaced[dropZoneIndex] = draggedText;
      setPlacedOptions(newPlaced);

      // Check for complete win
      const isComplete = newPlaced.every(
        (opt, idx) => opt === CORRECT_SEQUENCE[idx]
      );
      if (isComplete) {
        setGameWon(true);
        await playSound(celebrateSound);
      } else {
        // Just a correct partial placement
        await playSound(correctSound);
      }
    } else {
      // 3) WRONG item for this zone => penalize
      await handleWrongDrop(over.id);
    }
  };

  /**
   * If user drops a wrong item on a valid zone, show shake, reduce life, no reset of correct placements.
   */
  const handleWrongDrop = async (dropZoneId) => {
    // Shake the drop zone
    const dropZoneElement = document.querySelector(`[data-id='${dropZoneId}']`);
    if (dropZoneElement) {
      dropZoneElement.classList.add("shake");
      setTimeout(() => dropZoneElement.classList.remove("shake"), 500);
    }

    // Play wrong sound
    await playSound(wrongSound);

    // Deduct life
    if (lives > 1) {
      setLives((prev) => prev - 1);
    } else {
      setGameOver(true);
    }
  };

  /**
   * Reset the game
   */
  const resetGame = () => {
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setPlacedOptions(Array(4).fill(null));
    // If you want a fresh shuffle each time, you can forcibly re-load or re-randomize,
    // but if you want them in the same positions, just navigate away or refresh:
    navigate("/");
  };

  return (
    <DndContext sensors={[currentSensor]} onDragEnd={handleDragEnd}>
      {/* OVERLAYS */}
      {(gameOver || gameWon) && (
        <EndScreen gameWon={gameWon} resetGame={resetGame} />
      )}

      {/* MAIN CONTENT (if not over) */}
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
              variant="h5"
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

          {/* Drop Zones in a column */}
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
            {/* 4 drop zones with arrows in between */}
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

            {/* Scattered Draggables (only those not yet placed) */}
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
              {/* Filter out items that are already placed */}
              {shuffledItems
                .filter(
                  (item) => !placedOptions.includes(item.text) // if not placed, show it
                )
                .map(({ text, rotation, margin }) => (
                  <Draggable
                    key={text}
                    id={text}
                    rotation={rotation}
                    margin={margin}
                    disabled={disableDraggables}
                  >
                    {text}
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
