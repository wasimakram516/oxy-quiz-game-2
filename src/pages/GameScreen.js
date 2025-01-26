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

// Audio & Assets
import celebrateSound from "../assets/celebrateLeaderboard.mp3";
import correctSound from "../assets/correct.wav";
import wrongSound from "../assets/wrong.wav";
import oxyLogo from "../assets/oxy-logo-color.webp";
import Background from "../assets/Background.webp";

// ------------------------------
// 1) The correct final sequence (8 items total):
// ------------------------------
const CORRECT_SEQUENCE = [
  "Organizational goals",
  "Department goals",
  "Development focused area identifications",
  "Individual Performance goals",
  "Individual Development Plan (IDP)",
  "Discussion with Direct supervisor/ Assessor",
  "Learning Solution implementation and on going feedback",
  "Performance rating and calibration and communication",
];

// We'll slice them into two parts:
//    SCREEN 1 => indexes 0..3
//    SCREEN 2 => indexes 4..7
const PART_1 = CORRECT_SEQUENCE.slice(0, 4); // first 4
const PART_2 = CORRECT_SEQUENCE.slice(4, 8); // last 4

// ------------------------------
// Utility to shuffle an array of objects
// ------------------------------
function shuffle(array) {
  return array
    .map((item) => ({ ...item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ sort, ...rest }) => rest);
}

// ------------------------------
// 2) Draggable Component
// ------------------------------
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

// ------------------------------
// 3) Droppable Component
// ------------------------------
function Droppable({ id, children, label }) {
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
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };

  return (
    <Box ref={setNodeRef} style={style} data-id={id}>
      <Typography
        variant="body1"
        sx={{
          color: children ? "#000" : "#666",
        }}
      >
        {label}
      </Typography>
      {children || "Drop Here"}
    </Box>
  );
}

// ------------------------------
// 4) EndScreen Overlay
// ------------------------------
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

// ------------------------------
// 5) Main Game Component
// ------------------------------
function GameScreen() {
  const navigate = useNavigate();

  // Track which screen (1 or 2)
  const [screen, setScreen] = useState(1);

  // A) Lives
  const [lives, setLives] = useState(3);

  // B) Placed items (for all 8 slots). We'll only show relevant ones on each screen.
  //    Index 0-3 => screen 1, Index 4-7 => screen 2
  const [placedOptions, setPlacedOptions] = useState(Array(8).fill(null));

  // C) Two separate sets of shuffled items (one for each screen)
  const [shuffledPart1] = useState(() =>
    shuffle(
      PART_1.map((txt) => ({
        text: txt,
        rotation: Math.random() * 30 - 15,
        margin: `${Math.random() * 20}px`,
      }))
    )
  );

  const [shuffledPart2] = useState(() =>
    shuffle(
      PART_2.map((txt) => ({
        text: txt,
        rotation: Math.random() * 30 - 15,
        margin: `${Math.random() * 20}px`,
      }))
    )
  );

  // D) Overall game state
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // E) Disable draggables while sound is playing
  const [disableDraggables, setDisableDraggables] = useState(false);

  // F) DnD sensors
  const pointerSensor = useSensor(PointerSensor);
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 0,       // no delay
      tolerance: 0,   // optional: start dragging with no movement threshold
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
   * Function: Play audio *without blocking* if we want UI updates to happen
   * immediately (like showing the end screen).
   */
  const playSound = (sound) => {
    setDisableDraggables(true);
    const audio = new Audio(sound);
    audio.onended = () => {
      setDisableDraggables(false);
    };
    audio.play();
  };

  /**
   * G) onDragEnd logic
   */
  const handleDragEnd = ({ active, over }) => {
    if (!over || disableDraggables) return; // If no valid drop target or locked, do nothing

    const draggedText = active.id; // The text of the dragged item

    // The UI drop zones for each screen are labeled 0..3 visually,
    // but the actual "global" index depends on which screen we are on.
    // Screen 1 => global indices [0..3], Screen 2 => global indices [4..7]
    const localDropZoneIndex = parseInt(over.id, 10); // 0..3 from the Box
    const globalDropZoneIndex =
      screen === 1 ? localDropZoneIndex : localDropZoneIndex + 4;

    // If that drop zone is already filled, ignore
    if (placedOptions[globalDropZoneIndex] !== null) {
      return;
    }

    // The correct sub-sequence for the current screen
    const currentSequence = screen === 1 ? PART_1 : PART_2;

    // Enforce top-to-bottom rule: for local i>0, check local (i-1).
    // Map local (i-1) => global
    if (localDropZoneIndex > 0) {
      const globalAboveIndex =
        screen === 1 ? localDropZoneIndex - 1 : localDropZoneIndex - 1 + 4;
      // If the above is not correct, do nothing
      if (
        placedOptions[globalAboveIndex] !==
        CORRECT_SEQUENCE[globalAboveIndex]
      ) {
        return;
      }
    }

    // Check if the dragged item is correct for this zone
    const correctText = CORRECT_SEQUENCE[globalDropZoneIndex];
    if (draggedText === correctText) {
      // CORRECT
      const newPlaced = [...placedOptions];
      newPlaced[globalDropZoneIndex] = draggedText;
      setPlacedOptions(newPlaced);

      // Check if the user completed all 4 items of the current screen
      const start = screen === 1 ? 0 : 4;
      const end = screen === 1 ? 3 : 7; // inclusive
      const isScreenComplete = newPlaced
        .slice(start, end + 1)
        .every((item, idx) => item === CORRECT_SEQUENCE[start + idx]);

      if (isScreenComplete) {
        if (screen === 1) {
          // Done with screen 1 => show partial success sound, then move to screen 2
          playSound(correctSound);
          setScreen(2);
        } else {
          // Done with screen 2 => entire puzzle completed!
          // Show end screen *now* and play sound in parallel:
          setGameWon(true);
          playSound(celebrateSound);
        }
      } else {
        // Correct partial placement
        playSound(correctSound);
      }
    } else {
      // WRONG item => penalize
      handleWrongDrop(over.id);
    }
  };

  /**
   * If user drops a wrong item on a valid zone, show shake, reduce life.
   */
  const handleWrongDrop = (dropZoneId) => {
    // Shake the drop zone
    const dropZoneElement = document.querySelector(`[data-id='${dropZoneId}']`);
    if (dropZoneElement) {
      dropZoneElement.classList.add("shake");
      setTimeout(() => dropZoneElement.classList.remove("shake"), 500);
    }

    // Play wrong sound
    playSound(wrongSound);

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
    setScreen(1);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setPlacedOptions(Array(8).fill(null));
    navigate("/");
  };

  return (
    <DndContext sensors={[currentSensor]} onDragEnd={handleDragEnd}>
      {/* Overlays: End Screen if gameOver or gameWon */}
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

          {/* Title for each part */}
          <Typography
            variant="h4"
            sx={{fontWeight: "bold" }}
          >
            Part {screen} of 2
          </Typography>

          {/* Drop Zones in a column (4 per screen) */}
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
            {/* We only render 4 drop zones per screen */}
            <Box display="flex" flexDirection="column" gap="40px">
  {Array.from({ length: 4 }).map((_, localIndex) => {
    const globalIndex =
      screen === 1 ? localIndex + 1 : localIndex + 5; // Numbers 1-4 for Part 1, 5-8 for Part 2
    const showArrow = localIndex < 3;

    return (
      <Box
        key={localIndex}
        sx={{
          position: "relative",
          width: { xs: "300px", sm: "500px" },
        }}
      >
        <Droppable id={`${localIndex}`} label={globalIndex}>
          {placedOptions[screen === 1 ? localIndex : localIndex + 4]}
        </Droppable>
        {showArrow && (
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
    );
  })}
</Box>


            {/* Scattered Draggables (only those not yet placed + relevant to current screen) */}
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
              {(screen === 1 ? shuffledPart1 : shuffledPart2)
                .filter((item) => !placedOptions.includes(item.text))
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
