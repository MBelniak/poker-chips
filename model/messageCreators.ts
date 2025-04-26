import {
  DisconnectMessage,
  EventType,
  GameState,
  GameStateMessage,
  InvalidOtpMessage,
  Message,
  NewPlayerJoinedMessage,
  NewPlayerJoinRequestMessage,
  NewPlayerOTPRequestMessage,
  NewPlayerOTPResponseMessage,
  PlayerActionMessage,
} from "@/model/types";
import { mapStoreToGameState, Store } from "@/model/store";

export const isNewPlayerJoined = (
  msg: Message,
): msg is NewPlayerJoinedMessage => msg.type === EventType.NEW_PLAYER_JOINED;

export const isNewPlayerJoinRequest = (
  msg: Message,
): msg is NewPlayerJoinRequestMessage =>
  msg.type === EventType.NEW_PLAYER_JOIN_REQUEST;

export const isGameStateMessage = (msg: Message): msg is GameStateMessage =>
  msg.type === EventType.GAME_STATE;

export const isOtpRequestMessage = (
  msg: Message,
): msg is NewPlayerOTPRequestMessage =>
  msg.type === EventType.NEW_PLAYER_OTP_REQUEST;

export const isInvalidOtpMessage = (msg: Message): msg is InvalidOtpMessage =>
  msg.type === EventType.INVALID_OTP;

export const isNewPlayerOTPResponseMessage = (
  msg: Message,
): msg is NewPlayerOTPResponseMessage =>
  msg.type === EventType.NEW_PLAYER_OTP_RESPONSE;

export const isPlayerAction = (msg: Message): msg is PlayerActionMessage =>
  msg.type === EventType.PLAYER_ACTION;

export const isDisconnectMessage = (msg: Message): msg is DisconnectMessage =>
  msg.type === EventType.DISCONNECT;

export const createNewPlayerJoinedEvent = (name: string) =>
  JSON.stringify({
    type: EventType.NEW_PLAYER_JOINED,
    name,
  } as NewPlayerJoinedMessage);

export const createNewPlayerJoinRequestEvent = (name: string) =>
  JSON.stringify({
    type: EventType.NEW_PLAYER_JOIN_REQUEST,
    name,
  } as NewPlayerJoinRequestMessage);

export const createOtpRequestEvent = () =>
  JSON.stringify({ type: EventType.NEW_PLAYER_OTP_REQUEST });

export const createOtpResponseEvent = (otp: string) =>
  JSON.stringify({ type: EventType.NEW_PLAYER_OTP_RESPONSE, otp });

export const createGameStateEvent = (gameState: GameState) =>
  JSON.stringify({
    type: EventType.GAME_STATE,
    gameState: JSON.stringify(gameState),
  } as GameStateMessage);

export const createInvalidOtpMessage = () =>
  JSON.stringify({
    type: EventType.INVALID_OTP,
  });

export const createNameAlreadyTakenMessage = () =>
  JSON.stringify({ type: EventType.NAME_ALREADY_TAKEN });

export const createDisconnectEvent = () =>
  JSON.stringify({ type: EventType.DISCONNECT });
