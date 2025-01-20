"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Chessboard } from "react-chessboard";
import { Chess } from "chess.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Logo from "@/components/logo";
import Link from "next/link";
import Header from "@/components/header";

const ChessBoard = () => {
  const [chess] = useState(new Chess());
  const [difficulty, setDifficulty] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [fen, setFen] = useState<string>(chess.fen());
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [showValidMoves, setShowValidMoves] = useState<boolean>(false);
  const [showRestartPrompt, setShowRestartPrompt] = useState<boolean>(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const BASE_URL = "http://localhost:8080";

  const saveGame = (fen: string, moveHistory: string[]) => {
    localStorage.setItem("chessGameState", fen);
    localStorage.setItem("moveHistory", JSON.stringify(moveHistory));
  };

  const loadGame = () => {
    const savedFen = localStorage.getItem("chessGameState");
    const savedMoveHistory = localStorage.getItem("moveHistory");
    if (savedFen) {
      chess.load(savedFen);
      setFen(savedFen);
    }
    if (savedMoveHistory) {
      try {
        setMoveHistory(JSON.parse(savedMoveHistory) || []); // Ensure an empty array if parsing fails
      } catch (error) {
        console.error("Error parsing move history:", error);
        setMoveHistory([]); // Default to an empty array in case of error
      }
    }
  };

  useEffect(() => {
    loadGame(); // Load game from localStorage on component mount
  }, []);

  const startGame = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/chess/start`);
      setMessage(response.data);
      chess.reset();
      setFen(chess.fen());
      setValidMoves([]);
      setMoveHistory([]); // Reset move history on new game
      saveGame(chess.fen(), []); // Save new game state
    } catch (error) {
      console.error("Error starting the game:", error);
    }
  };

  const handleShowValidMoves = () => {
    setShowValidMoves((prev) => !prev);
  };

  const handleRestartGame = () => {
    setShowRestartPrompt(false);
    startGame(); // Restart the game
  };

  const makeMove = async (move: { from: string; to: string }) => {
    const piece = chess.get(move.from)?.type;
    const isPawn = piece === "p";
    const promotionRank =
      (move.to[1] === "8" && chess.turn() === "w") ||
      (move.to[1] === "1" && chess.turn() === "b");
    const moveObj =
      isPawn && promotionRank ? { ...move, promotion: "q" } : move;
    const result = chess.move(moveObj);
    if (result) {
      setFen(chess.fen());
      setValidMoves([]);

      // Record the user's move immediately after it is made
      const userColor = chess.turn() === "w" ? "Black" : "White";
      const userMoveHistory = `${userColor}: ${result.san}`;
      const updatedMoveHistory = [...moveHistory, userMoveHistory];

      setMoveHistory(updatedMoveHistory);
      saveGame(chess.fen(), updatedMoveHistory); // Save after updating history

      // Check for game over conditions
      if (chess.isCheckmate()) {
        toast.success("Checkmate! You win!");
        setShowRestartPrompt(true); // Show restart prompt
        return;
      } else if (chess.isDraw()) {
        toast.info("Game is a draw!");
        setShowRestartPrompt(true); // Show restart prompt for draw
        return;
      }

      setTimeout(async () => {
        try {
          const response = await axios.post(
            `${BASE_URL}/chess/move`,
            { fen: chess.fen() }
          );
          chess.move(response.data);
          setFen(chess.fen());
          saveGame(chess.fen(), updatedMoveHistory); // Save after bot move

          // Now record the bot's move after it's made
          const botColor = chess.turn() === "w" ? "Black" : "White";
          const botMoveHistory = `${botColor}: ${response.data}`;
          const finalMoveHistory = [...updatedMoveHistory, botMoveHistory];

          setMoveHistory(finalMoveHistory);
          saveGame(chess.fen(), finalMoveHistory); // Save after updating history

          if (chess.isCheckmate()) {
            toast.error("Checkmate! You lose!");
            setShowRestartPrompt(true); // Show restart prompt
          } else if (chess.isDraw()) {
            toast.info("Game is a draw!");
            setShowRestartPrompt(true); // Show restart prompt for draw
          }
        } catch (error) {
          console.error("Error making Stockfish's move:", error);
        }
      }, 1000);
    } else {
      toast.error("Invalid move!"); // Show the error toast for invalid moves
      console.log("Invalid move:", move);
    }
  };

  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      const move = { from: selectedSquare, to: square };
      makeMove(move);
      setSelectedSquare(null);
      setValidMoves([]);
    } else {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true }) as Array<{
        to: string;
      }>;
      const validMoveSquares = moves.map((move) => move.to);
      setValidMoves(validMoveSquares);
      saveGame(chess.fen());
    }
  };

  const setDifficultyLevel = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const level = parseInt(e.target.value);
    console.log(level);
    setDifficulty(level);
    try {
      await axios.post(
        `${BASE_URL}/chess/difficulty`,
        { difficulty: level },
        { headers: { "Content-Type": "application/json" } }
      );
      setMessage(`Difficulty set to ${level}`);
    } catch (error) {
      console.error("Error setting difficulty:", error);
    }
  };

  const quitGame = async () => {
    try {
      const response = await axios.post(`${BASE_URL}/chess/quit`);
      setMessage(response.data);
    } catch (error) {
      console.error("Error quitting the game:", error);
    }
  };

  const onPieceDrop = (sourceSquare: string, targetSquare: string) => {
    const move = { from: sourceSquare, to: targetSquare };
    makeMove(move);
    saveGame(chess.fen());
  };

  const renderMoveHistory = () => {
    return (
      <div
        className="move-history"
        style={{
          minHeight: "20rem",
          maxHeight: "60rem",
          overflowY: "auto", // Enable vertical scroll
          padding: "0.5rem",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          borderRadius: "0.25rem",
          backgroundColor: "rgba(40, 40, 40, 0.8)", // Optional background styling
          width: "30rem", // Set width for better layout control
          color: "white", // Text color
        }}
      >
        <h3 style={{ fontSize: "1.1rem" }} className="py-2">
          Move History
        </h3>
        <hr />
        <p style={{ color: "rgba(180, 180, 180, 0.8)" }} className="py-2">
          {moveHistory
            .map((move, index) => {
              console.log(move);
              return `${move.split(": ")[0]} : ${move.split(": ")[1]}`;
            })
            .join(", ")}
        </p>
      </div>
    );
  };

  return (
    <div>
      <Header text={"Game with Bot..."} />

      <div className="flex gap-10 align-middle justify-center flex-wrap">
        <div className="flex flex-col gap-10 align-middle justify-center">
          <div className="flex gap-10">
            {/* <button onClick={() => toast.success("This is a test toast!")}>
              Test Toast
            </button> */}
            <button
              onClick={startGame}
              className="px-6 py-2"
              style={{
                backgroundColor: "rgba(40,40,40,0.8)",
                borderRadius: "0.15rem",
                color: "rgba(0, 220, 0, 0.8)",
              }}
            >
              Start Game
            </button>
            <button
              onClick={quitGame}
              className="px-6 py-2"
              style={{
                backgroundColor: "rgba(40,40,40,0.8)",
                borderRadius: "0.15rem",
                color: "rgba(220, 0, 0, 0.8)",
              }}
            >
              Quit Game
            </button>
            <button
              onClick={handleShowValidMoves}
              className="px-6 py-2"
              style={{
                backgroundColor: "rgba(40,40,40,0.8)",
                borderRadius: "0.15rem",
                color: "rgba(135, 206, 235, 0.9)",
              }}
            >
              {" "}
              {showValidMoves ? "Hide Moves" : "Show Moves"}{" "}
            </button>
          </div>
          <div className="flex gap-10">
            <label
              htmlFor="difficulty"
              style={{ fontSize: "1.2rem", color: "rgba(148, 0, 211, 0.8)" }}
            >
              Set Difficulty:
            </label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={setDifficultyLevel}
              className="bg-black px-2 py-1"
            >
              <option value="0">Noob ( Below 400 )</option>
              <option value="1">Beginner ( In 400-600 )</option>
              <option value="3">Intermediate ( In 600-1000 ) </option>
              <option value="5">Advanced ( In 100-1400 )</option>
              <option value="7">Master ( In 1400-1800 )</option>
              <option value="10">GrandMaster ( 1800+ ) </option>
            </select>
          </div>
          <p>{message}</p>

          {renderMoveHistory()}
        </div>
        <div
          style={{
            width: "38rem",
            height: "38rem",
          }}
        >
          <Chessboard
            position={fen}
            onSquareClick={handleSquareClick}
            onPieceDrop={onPieceDrop}
            customSquareStyles={
              showValidMoves
                ? validMoves.reduce(
                    (acc, square) => ({
                      ...acc,
                      [square]: {
                        background: "rgba(100, 100, 100, 0.4)",
                        borderRadius: "70%",
                      },
                    }),
                    {}
                  )
                : {}
            }
          />
        </div>
      </div>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      {showRestartPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-lg mb-4 text-black">
              The game is over. Would you like to start a new game?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowRestartPrompt(false);
                  startGame();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowRestartPrompt(false)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;
