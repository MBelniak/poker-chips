import { GameState, Message } from "./types";
import { Store } from "@/model/store";
import {
  isGameStateMessage,
  isInvalidOtpMessage,
  isOtpRequestMessage,
} from "./messageCreators";

export const handleMessageFromHost = (message: Message, store: Store) => {
  if (isOtpRequestMessage(message)) {
    store.setWaitingForOtp(true);
  } else if (isInvalidOtpMessage(message)) {
    store.setIsInvalidOtp(true);
  } else if (isGameStateMessage(message)) {
    store.setIsInvalidOtp(false);
    store.setIsJoined(true);
    store.setGameState(JSON.parse(message.gameState) as GameState);
  }
  //   TODO handle message
};
