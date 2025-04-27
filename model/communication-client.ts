import { GameState, GameStateParsed, Message } from "./types";
import { Store } from "@/model/store";
import {
  isDisconnectMessage,
  isGameStateMessage,
  isInvalidOtpMessage,
  isJoinedMessage,
  isJoinFailedMessage,
  isOtpRequestMessage,
} from "./messageCreators";
import { Table } from "@/model/logic/Table";

export const handleMessageFromHost = (message: Message, store: Store) => {
  if (isOtpRequestMessage(message)) {
    store.setIsWaitingForOtp(true);
    store.setJoinFailedMessage(null);
  } else if (isInvalidOtpMessage(message)) {
    store.setIsInvalidOtp(true);
  } else if (isJoinedMessage(message)) {
    store.setPlayerId(message.id);
  } else if (isGameStateMessage(message)) {
    store.setIsInvalidOtp(false);
    store.setIsJoined(true);
    const gameStateParsed = JSON.parse(message.gameState) as GameStateParsed;
    const gameState = {
      status: gameStateParsed.status,
      actionHistory: gameStateParsed.actionHistory,
      table: null,
    } as GameState;
    if (gameStateParsed.table) {
      gameState.table = Table.fromParsedTableState(gameStateParsed.table);
      gameState.table.players.forEach((player) => {
        if (player) {
          player.table = gameState.table!;
        }
      });
    }
    store.setGameState(gameState);
  } else if (isDisconnectMessage(message)) {
    store.clientSocket?.destroy();
    store.setClientSocket(null);
  } else if (isJoinFailedMessage(message)) {
    store.setJoinFailedMessage(message.message);
  }
};
