import {
  ActionType,
  BroadcastActionMessage,
  DisconnectMessage,
  DistributePotMessage,
  EventType,
  InvalidOtpMessage,
  isActionTakesAmount,
  JoinFailedMessage,
  Message,
  NewPlayerJoinRequestMessage,
  NewPlayerOTPRequestMessage,
  NewPlayerOTPResponseMessage,
  NoAmountActionType,
  PlayerJoinedEvent,
  StartRoundMessage,
  TableStateMessage,
} from "@/model/types";
import { Pot, Table } from "@/model/store/slices/tableSlice";
import { TablePlayer } from "@/model/store/slices/playerSlice";

export const isNewPlayerJoinRequest = (
  msg: Message,
): msg is NewPlayerJoinRequestMessage =>
  msg.type === EventType.NEW_PLAYER_JOIN_REQUEST;

export const isTableStateMessage = (msg: Message): msg is TableStateMessage =>
  msg.type === EventType.TABLE_STATE;

export const isOtpRequestMessage = (
  msg: Message,
): msg is NewPlayerOTPRequestMessage =>
  msg.type === EventType.NEW_PLAYER_OTP_REQUEST;

export const isInvalidOtpMessage = (msg: Message): msg is InvalidOtpMessage =>
  msg.type === EventType.INVALID_OTP;

export const isJoinedMessage = (msg: Message): msg is PlayerJoinedEvent =>
  msg.type === EventType.PLAYER_JOINED;

export const isNewPlayerOTPResponseMessage = (
  msg: Message,
): msg is NewPlayerOTPResponseMessage =>
  msg.type === EventType.NEW_PLAYER_OTP_RESPONSE;

export const isDisconnectMessage = (msg: Message): msg is DisconnectMessage =>
  msg.type === EventType.DISCONNECT;

export const isJoinFailedMessage = (msg: Message): msg is JoinFailedMessage =>
  msg.type === EventType.JOIN_FAILED;

export const isStartRoundMessage = (msg: Message): msg is StartRoundMessage =>
  msg.type === EventType.START_ROUND;

export const isDistributePotMessage = (
  msg: Message,
): msg is DistributePotMessage => msg.type === EventType.DISTRIBUTE_POT;

export const isBroadcastPlayerActionMessage = (
  msg: Message,
): msg is BroadcastActionMessage => msg.type === EventType.PLAYER_ACTION;

export const createNewPlayerJoinRequestMessage = (name: string) =>
  JSON.stringify({
    type: EventType.NEW_PLAYER_JOIN_REQUEST,
    name,
  } as NewPlayerJoinRequestMessage);

export const createOtpRequestMessage = () =>
  JSON.stringify({ type: EventType.NEW_PLAYER_OTP_REQUEST });

export const createOtpResponseMessage = (otp: string) =>
  JSON.stringify({ type: EventType.NEW_PLAYER_OTP_RESPONSE, otp });

export const createPlayerJoinedEvent = (playerId: string) =>
  JSON.stringify({
    type: EventType.PLAYER_JOINED,
    id: playerId,
  });

export const createTableStateMessage = (tableState: Table) =>
  JSON.stringify({
    type: EventType.TABLE_STATE,
    tableState: JSON.stringify(tableState),
  } as TableStateMessage);

export const createInvalidOtpMessage = () =>
  JSON.stringify({
    type: EventType.INVALID_OTP,
  });

export const createNameAlreadyTakenMessage = () =>
  JSON.stringify({ type: EventType.NAME_ALREADY_TAKEN });

export const createDisconnectMessage = () =>
  JSON.stringify({ type: EventType.DISCONNECT });

export const createJoinFailedMessage = (message: string) =>
  JSON.stringify({ type: EventType.JOIN_FAILED, message });

export const createStartRoundMessage = () =>
  JSON.stringify({ type: EventType.START_ROUND });

export function createActionMessage(
  action: ActionType.BET | ActionType.RAISE,
  actor: TablePlayer,
  amount: number,
): string;
export function createActionMessage(
  action: NoAmountActionType,
  actor: TablePlayer,
): string;
export function createActionMessage(
  action: ActionType,
  actor: TablePlayer,
  amount?: number,
): string {
  if (isActionTakesAmount(action)) {
    return JSON.stringify({
      type: EventType.PLAYER_ACTION,
      message: {
        action,
        actor,
        amount,
      },
    });
  } else {
    return JSON.stringify({
      type: EventType.PLAYER_ACTION,
      message: {
        action,
        actor,
      },
    });
  }
}

export const createDistributePotToWinnersMessage = (
  pot: Pot,
  winners: TablePlayer[],
) => {
  return JSON.stringify({
    type: EventType.DISTRIBUTE_POT,
    pot,
    winners,
  });
};
