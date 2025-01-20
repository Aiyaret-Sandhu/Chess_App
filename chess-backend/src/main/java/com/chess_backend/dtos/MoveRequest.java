package com.chess_backend.dtos;

public class MoveRequest {

    public String fen; // Forsyth-Edwards Notation)

    public String getFen() {
        return fen;
    }

    public void setFen(String fen) {
        this.fen = fen;
    }
}
