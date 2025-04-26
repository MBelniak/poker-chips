import Socket from "react-native-tcp-socket/lib/types/Socket";

export type GameStatus = "waiting" | "playing" | "finished";

export type AvailableGame = {
  name: string;
  host: string;
  port: number;
};

export type Player =
  | { socket: Socket; name: string; isHost: false }
  | {
      socket: null;
      name: string;
      isHost: true;
    };

export type PlayerState = {
  chips: number;
};

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
  dealer: string | null;
  currentTurn: string | null;
  actionHistory: Action[];
  playersState: { name: string; state: PlayerState }[];
};

export const enum EventType {
  NEW_PLAYER_JOINED = "NEW_PLAYER_JOINED",
  NEW_PLAYER_JOIN_REQUEST = "NEW_PLAYER_JOIN_REQUEST",
  NEW_PLAYER_OTP_REQUEST = "NEW_PLAYER_OTP_REQUEST",
  NEW_PLAYER_OTP_RESPONSE = "NEW_PLAYER_OTP_RESPONSE",
  GAME_STATE = "GAME_STATE",
  INVALID_OTP = "INVALID_OTP",
  NAME_ALREADY_TAKEN = "NAME_ALREADY_TAKEN",
  DISCONNECT = "DISCONNECT",
  PLAYER_ACTION = "PLAYER_ACTION",
}

export type NewPlayerJoinedMessage = {
  type: EventType.NEW_PLAYER_JOINED;
  name: string;
};
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

export type Message =
  | NewPlayerJoinedMessage
  | NewPlayerJoinRequestMessage
  | { type: string };
