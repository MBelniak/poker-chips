import Socket from "react-native-tcp-socket/lib/types/Socket";
import { BettingRound, Pot, Table } from "@/model/logic/Table";
import { Player as TablePlayer } from "@/model/logic/Player";
export type GameStatus = "waiting" | "playing" | "finished";

export type AvailableGame = {
  name: string;
  host: string;
  port: number;
};

export type Player = { name: string; id: string } & (
  | { socket: Socket; isHost: false }
  | {
      socket: null;
      isHost: true;
    }
);

export const enum ActionType {
  FOLD = "FOLD",
  CALL = "CALL",
  CHECK = "CHECK",
  BET = "BET",
}

export type Action = {
  actor: string;
  actionType: ActionType;
} & { actionType: ActionType.BET; amount: number };

export type GameState = {
  status: GameStatus;
  actionHistory: Action[];
  table: Table | null;
};

export type ParsedTableState = {
  buyIn: number;
  smallBlind: number;
  bigBlind: number;
  autoMoveDealer: boolean;
  bigBlindPosition?: number;
  currentBet?: number;
  currentPosition?: number;
  currentRound?: BettingRound;
  dealerPosition?: number;
  debug: boolean;
  handNumber: number;
  lastPosition?: number;
  lastRaise?: number;
  players: (TablePlayer | null)[];
  pots: Pot[];
  smallBlindPosition?: number;
};

export type GameStateParsed = {
  status: GameStatus;
  actionHistory: Action[];
  table: ParsedTableState;
};

export const enum EventType {
  NEW_PLAYER_JOIN_REQUEST = "NEW_PLAYER_JOIN_REQUEST",
  NEW_PLAYER_OTP_REQUEST = "NEW_PLAYER_OTP_REQUEST",
  NEW_PLAYER_OTP_RESPONSE = "NEW_PLAYER_OTP_RESPONSE",
  GAME_STATE = "GAME_STATE",
  INVALID_OTP = "INVALID_OTP",
  NAME_ALREADY_TAKEN = "NAME_ALREADY_TAKEN",
  DISCONNECT = "DISCONNECT",
  PLAYER_ACTION = "PLAYER_ACTION",
  JOIN_FAILED = "JOIN_FAILED",
  PLAYER_JOINED = "PLAYER_JOINED",
}

export type NewPlayerJoinRequestMessage = {
  type: EventType.NEW_PLAYER_JOIN_REQUEST;
  name: string;
};
export type NewPlayerOTPRequestMessage = {
  type: EventType.NEW_PLAYER_OTP_REQUEST;
};
export type NewPlayerOTPResponseMessage = {
  type: EventType.NEW_PLAYER_OTP_RESPONSE;
  otp: string;
};
export type InvalidOtpMessage = {
  type: EventType.INVALID_OTP;
};
export type PlayerJoinedEvent = {
  type: EventType.PLAYER_JOINED;
  id: string;
};
export type GameStateMessage = {
  type: EventType.GAME_STATE;
  gameState: string;
};
export type PlayerActionMessage = {
  type: EventType.PLAYER_ACTION;
  action: string;
};

export type DisconnectMessage = {
  type: EventType.DISCONNECT;
};

export type JoinFailedMessage = {
  type: EventType.JOIN_FAILED;
  message: string;
};

export type Message =
  | NewPlayerJoinRequestMessage
  | NewPlayerOTPResponseMessage
  | PlayerJoinedEvent
  | JoinFailedMessage
  | GameStateMessage
  | { type: string };
