import { Message, TableStateMessage } from "./types";
import { Store } from "@/model/store";
import {
  isDisconnectMessage,
  isInvalidOtpMessage,
  isJoinedMessage,
  isJoinFailedMessage,
  isOtpRequestMessage,
  isStartRoundMessage,
  isTableStateMessage,
} from "./messageCreators";
import { Table } from "@/model/store/slices/tableSlice";

const handleTableStateMessage = (message: TableStateMessage, store: Store) => {
  const tableStateParsed = JSON.parse(message.tableState) as Table;
  store.setTable(tableStateParsed);
};

export const handleMessageFromHost = (message: Message, store: Store) => {
  if (isOtpRequestMessage(message)) {
    store.setIsWaitingForOtp(true);
    store.setJoinFailedMessage(null);
  } else if (isInvalidOtpMessage(message)) {
    store.setIsInvalidOtp(true);
  } else if (isJoinedMessage(message)) {
    store.setPlayerId(message.id);
  } else if (isTableStateMessage(message)) {
    store.setIsInvalidOtp(false);
    store.setIsJoined(true);
    handleTableStateMessage(message, store);
  } else if (isDisconnectMessage(message)) {
    store.clientSocket?.destroy();
    store.setClientSocket(null);
  } else if (isJoinFailedMessage(message)) {
    store.setJoinFailedMessage(message.message);
  } else if (isStartRoundMessage(message)) {
    store.dealCards();
  }
};
