package com.chess_backend.services;


import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;

@Service
public class StockfishService {

    private Process stockfish;
    private BufferedReader input;
    private PrintWriter output;
    private int stockfishDifficulty = 10;

    public StockfishService() throws Exception{
        startEngine();
    }

    public void startEngine() throws Exception{
        ProcessBuilder pb = new ProcessBuilder("D:\\Chess App\\stockfish\\stockfish-windows-x86-64-avx2.exe");
        stockfish = pb.start();
        input = new BufferedReader(new InputStreamReader(stockfish.getInputStream()));
        output = new PrintWriter(new OutputStreamWriter(stockfish.getOutputStream()));
        output.println("uci");
    }

    public void stopEngine() throws Exception{
        output.println("quit");
        stockfish.destroy();
    }

    public void restartEngine() throws Exception{
        stopEngine();
        startEngine();
    }

    public void setDifficulty(int level){
        stockfishDifficulty = level;
    }

    public String getBestMove(String fen) throws Exception{
        output.println("position fen " + fen);
        output.flush();
        output.println("go depth " + stockfishDifficulty);
        output.flush();
        String bestMove = "";
        String line;
        long startTime = System.currentTimeMillis();
        while((line = input.readLine()) != null){
            System.out.println("Stockfish output: " + line);
            if(line.startsWith("bestmove")){
                bestMove = line.split(" ")[1];
                break;
            }
            // Timeout check
            if (System.currentTimeMillis() - startTime > 5000) { // 5 seconds timeout
                throw new Exception("Stockfish response timed out.");
            }
        }
        return bestMove;
    }




}
