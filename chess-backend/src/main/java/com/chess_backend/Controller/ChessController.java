package com.chess_backend.Controller;

import com.chess_backend.dtos.DifficultyDTO;
import com.chess_backend.dtos.MoveRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.chess_backend.services.StockfishService;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/chess")
public class ChessController {

    private final StockfishService stockfishService;

    @Autowired
    public ChessController(StockfishService stockfishService) {
        this.stockfishService = stockfishService;
    }

    @PostMapping("/start")
    public ResponseEntity<String> startGame() {
        try {
            stockfishService.restartEngine();
            return ResponseEntity.ok("New Game started");
        }
        catch (Exception e) {
            return ResponseEntity.status(500).body("Error starting game: " + e.getMessage());
        }
    }

    @PostMapping("/move")
    public ResponseEntity<String> makeMove(@RequestBody MoveRequest moveRequest) {
        System.out.println("Received FEN : "  + moveRequest.getFen());
        try {
            String bestMove = stockfishService.getBestMove(moveRequest.getFen());
            return ResponseEntity.ok(bestMove);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error calculating move: " + e.getMessage());
        }
    }

    @PostMapping("/difficulty")
    public ResponseEntity<String> setDifficulty(@RequestBody DifficultyDTO difficultyDTO) {
        int difficulty = difficultyDTO.getDifficulty();
        stockfishService.setDifficulty(difficulty);
        return ResponseEntity.ok("Difficulty set to " + difficulty);
    }


    // Quit the game
    @PostMapping("/quit")
    public ResponseEntity<String> quitGame() {
        try {
            stockfishService.stopEngine();
            return ResponseEntity.ok("Game stopped.");
        }
        catch (Exception e) {
            return ResponseEntity.status(500).body("Error quiting game: " + e.getMessage());
        }
    }
}
