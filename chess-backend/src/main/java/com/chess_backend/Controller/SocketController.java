package com.chess_backend.Controller;

import com.chess_backend.dtos.Message;
import com.chess_backend.dtos.Move;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;

@CrossOrigin(origins = "*")
@Controller
public class SocketController {

    @MessageMapping("/message/{roomId}")
    @SendTo("/topic/message/{roomId}")
    public Message sendMessage(Message message, @DestinationVariable String roomId) {
        return message;
    }

    @MessageMapping("/move/{roomId}")
    @SendTo("/topic/move/{roomId}")
    public Move sendMove(Move move, @DestinationVariable String roomId) {
        return move;
    }

}