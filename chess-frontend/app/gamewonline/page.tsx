"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import SockJS from "sockjs-client"
import { Client } from "@stomp/stompjs"
import { Chessboard } from "react-chessboard"
import { Chess, Square } from "chess.js"

export default function Component() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [username, setUsername] = useState("")
  const [message, setMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<string[]>([])
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [fen, setFen] = useState("start")
  const [currentPlayer, setCurrentPlayer] = useState<"white" | "black">("white")
  const [playerColor, setPlayerColor] = useState<"white" | "black" | null>(null)
  const [isRoomCreator, setIsRoomCreator] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [allowedMoves, setAllowedMoves] = useState<Square[]>([])
  const [selectedPiece, setSelectedPiece] = useState<Square | null>(null)
  const [showRestartPrompt, setShowRestartPrompt] = useState(false)

  const chessRef = useRef(new Chess())
  const STORAGE_KEY = "chess_game_state"

  useEffect(() => {
    if (roomId && username) {
      const stompClient = new Client({
        brokerURL: "ws://localhost:8080/chat",
        connectHeaders: {},
        debug: function (str) {
          console.log(str)
        },
        reconnectDelay: 5000,
        onConnect: () => {
          stompClient.subscribe(`/topic/message/${roomId}`, (message) => {
            setChatMessages((prevMessages) => [...prevMessages, message.body])
          })

          stompClient.subscribe(`/topic/move/${roomId}`, (move) => {
            const moveObj = JSON.parse(move.body)
            try {
              const result = chessRef.current.move(moveObj.move)
              if (result) {
                updateGameState(result.san, moveObj.player)
              }
            } catch (error) {
              console.error("Invalid move received:", error)
            }
          })

          stompClient.subscribe(`/topic/join/${roomId}`, (joinMessage) => {
            const joinInfo = JSON.parse(joinMessage.body)
            if (isRoomCreator && !playerColor) {
              setPlayerColor("white")
              stompClient.publish({
                destination: `/app/assign-color/${roomId}`,
                body: JSON.stringify({ color: "black", assignedTo: joinInfo.username }),
              })
            }
          })

          stompClient.subscribe(`/topic/assign-color/${roomId}`, (colorMessage) => {
            const colorInfo = JSON.parse(colorMessage.body)
            if (colorInfo.assignedTo === username) {
              setPlayerColor(colorInfo.color)
            }
          })

          // Announce joining the room
          stompClient.publish({
            destination: `/app/join/${roomId}`,
            body: JSON.stringify({ username }),
          })
        },
        onWebSocketError: (error) => {
          setError("WebSocket Error: " + error)
          console.error("WebSocket Error: ", error)
        },
        onError: (error) => {
          setError("STOMP Error: " + error)
          console.error("STOMP Error: ", error)
        },
        webSocketFactory: () => new SockJS("http://localhost:8080/chat"),
      })

      stompClient.activate()
      setClient(stompClient)

      return () => {
        stompClient.deactivate()
      }
    }
  }, [roomId, username, isRoomCreator])

  const updateGameState = (san: string, player: string) => {
    const updatedFen = chessRef.current.fen();
    
    setFen(updatedFen); // Update the board's state
    setMoveHistory((prevHistory) => [...prevHistory, `${player}: ${san}`]);
    const newCurrentPlayer = currentPlayer === "white" ? "black" : "white";
    setCurrentPlayer(newCurrentPlayer);
    setAllowedMoves([]);
    setSelectedPiece(null);
  
    if (chessRef.current.isCheckmate()) {
      alert(`Checkmate! ${player} wins!`);
      setShowRestartPrompt(true);
    } else if (chessRef.current.isDraw()) {
      alert("Game is a draw!");
      setShowRestartPrompt(true);
    } else {
      // Save the game state
      const gameState = {
        fen: updatedFen,
        currentPlayer: newCurrentPlayer,
        moveHistory: [...moveHistory, `${player}: ${san}`],
      };
      console.log("Game state synchronized:", gameState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }
  };
  

  const createRoom = () => {
    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setIsRoomCreator(true);
    setPlayerColor("white"); // Creator is always white
  };
  
  const joinRoom = () => {
    if (username && roomId) {
      setIsRoomCreator(false);
      setPlayerColor("black"); // Joining player is always black
    } else {
      alert("Please provide both your name and a room ID.");
    }
  };
  

  const generateRoomId = () => {
    return `room-${Math.random().toString(36).substring(2, 10)}`
  }

  const sendMessage = () => {
    if (client && message && roomId) {
      client.publish({
        destination: `/app/message/${roomId}`,
        body: JSON.stringify({ username, message }),
      })
      setMessage("")
    }
  }

  const sendMove = (move: string) => {
    if (client && roomId) {
      client.publish({
        destination: `/app/move/${roomId}`,
        body: JSON.stringify({ move, player: username }),
      })
    }
  }

  const makeMove = (move: { from: Square; to: Square; promotion?: string }) => {
    const result = chessRef.current.move(move);
  
    if (result) {
      // Valid move according to chess.js
      updateGameState(result.san, username);
      sendMove(result.san);
      console.log("Valid move:", result);
      return true;
    } else {
      // Handle invalid moves (for synchronization purposes)
      console.warn("Invalid move attempted:", move);
  
      // Force synchronization by manually constructing the FEN
      const forcedFen = chessRef.current.fen(); // Optionally modify this if needed
      chessRef.current.load(forcedFen);
      updateGameState(`${move.from}-${move.to}`, username); // Create a generic move notation
      sendMove(`${move.from}-${move.to}`); // Sync with the server
      return true; // Allow the move visually
    }
  };
  

  const handleDisconnect = () => {
    if (client) {
      client.deactivate()
      setClient(null)
      setRoomId(null)
      setChatMessages([])
      setMoveHistory([])
      setError(null)
      chessRef.current = new Chess()
      setFen("start")
      setCurrentPlayer("white")
      setPlayerColor(null)
      setAllowedMoves([])
      setSelectedPiece(null)
    }
  }

  const onSquareClick = (square: Square) => {
    const moves = chessRef.current.moves({ square, verbose: true })
    if (moves.length > 0) {
      setSelectedPiece(square)
      setAllowedMoves(moves.map((move) => move.to as Square))
    }
  }

  const onPieceDrop = (sourceSquare: Square, targetSquare: Square, piece: string) => {
    const move = makeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: piece[1].toLowerCase(),
    })

    if (move === false) {
      return false
    }
    return true
  }

  const renderMoveHistory = () => (
    <div className="bg-gray-100 p-4 rounded-md">
      <h3 className="text-lg font-bold mb-2">Move History</h3>
      <div className="h-64 overflow-y-auto">
        {moveHistory.map((move, index) => (
          <p key={index} className="text-sm">
            {move}
          </p>
        ))}
      </div>
    </div>
  )

  const customSquareStyles = () => {
    const styles: { [square: string]: React.CSSProperties } = {}
    allowedMoves.forEach((square) => {
      styles[square] = {
        background: "radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)",
        borderRadius: "50%",
      }
    })
    if (selectedPiece) {
      styles[selectedPiece] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      }
    }
    return styles
  }

  return (
    <div className="container mx-auto p-4 text-black">
      {!roomId ? (
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <div className="mb-4">
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              type="text"
              placeholder="Enter Your Name"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={createRoom}
            >
              Create Room
            </button>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mx-2"
              type="text"
              placeholder="Enter Room ID"
              onChange={(e) => setRoomId(e.target.value)}
              value={roomId || ""}
            />
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={joinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <h2 className="text-2xl font-bold mb-2">Room ID: {roomId}</h2>
            <p className="mb-2">Welcome, {username}</p>
            <p className="mb-2">Current Player: {currentPlayer}</p>
            <p className="mb-2">Your Color: {playerColor || "Waiting for opponent..."}</p>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
              <h3 className="text-lg font-bold mb-2">Chat</h3>
              <div className="h-40 overflow-y-auto mb-2 border p-2 rounded bg-gray-100">
                {chatMessages.map((msg, index) => (
                  <p key={index} className="text-sm">
                    {msg}
                  </p>
                ))}
              </div>
              <div className="flex items-center">
                <input
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mr-2"
                  type="text"
                  placeholder="Type a message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                  onClick={sendMessage}
                >
                  Send
                </button>
              </div>
            </div>

            {renderMoveHistory()}
          </div>

          <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div style={{ width: "100%", maxWidth: "34rem", margin: "0 auto" }}>
              <Chessboard
                position={fen}
                onSquareClick={onSquareClick}
                onPieceDrop={onPieceDrop}
                boardOrientation={playerColor || "white"}
                customSquareStyles={customSquareStyles()}
              />
            </div>
          </div>
        </div>
      )}
      {error && <div className="text-red-500 mt-4">{error}</div>}
    </div>
  )
}