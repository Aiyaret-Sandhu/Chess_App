package com.chess_backend.dtos;

public class Move {

    private String move;
    private String player;

    public Move() {}

    public Move(String move, String player) {
        this.move = move;
        this.player = player;
    }

    public String getMove() {
        return move;
    }

    public void setMove(String move) {
        this.move = move;
    }

    public String getPlayer() {
        return player;
    }

    public void setPlayer(String player) {
        this.player = player;
    }
}
