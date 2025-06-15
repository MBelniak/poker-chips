import {
  BroadcastActionMessage,
  Message,
  NewPlayerJoinRequestMessage,
  NewPlayerOTPResponseMessage,
} from "./types";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import { Store } from "@/model/store";
import {
  createInvalidOtpMessage,
  createJoinFailedMessage,
  createNameAlreadyTakenMessage,
  createOtpRequestMessage,
  isBroadcastActionMessage,
  isNewPlayerJoinRequest,
  isNewPlayerOTPResponseMessage,
} from "./messageCreators";
import { getClientId, getOtp } from "@/utils";
import { handlePlayerActionMessage } from "@/model/logic/tableLogic";

export const handleNewPlayerOTPMessage = (
  socket: Socket,
  msg: NewPlayerOTPResponseMessage,
  store: Store,
) => {
  const id = getClientId(socket);
  if (msg.otp !== store.pendingJoinRequests[id].otp) {
    socket.write(createInvalidOtpMessage());
    return;
  }

  const playerName = store.pendingJoinRequests[id].playerName;

  store.removeJoinRequest(id);
  try {
    store.addPlayer({ socket, id, name: playerName, isHost: false });
  } catch (e) {
    socket.write(createJoinFailedMessage((e as Error).message));
  }
};

export const handleNewPlayerRequest = (
  socket: Socket,
  msg: NewPlayerJoinRequestMessage,
  store: Store,
) => {
  if (store.players.some((player) => player.name === msg.name)) {
    socket.write(createNameAlreadyTakenMessage());
    return;
  }
  console.log("Sending otp to new player ", msg.name);
  const otp = getOtp();
  store.addJoinRequest(getClientId(socket), {
    otp,
    playerName: msg.name,
  });
  socket.write(createOtpRequestMessage());
};

export const handleBroadcastAction = (
  message: BroadcastActionMessage,
  store: Store,
) => {
  handlePlayerActionMessage(message, store);
  store.broadcastAction(message.message.action, message.message.actor);
};

export const handleMessageFromClient = (
  socket: Socket,
  message: Message,
  store: Store,
) => {
  // Using if-else instead of switch for type guarding
  if (isNewPlayerJoinRequest(message)) {
    handleNewPlayerRequest(socket, message, store);
  } else if (isNewPlayerOTPResponseMessage(message)) {
    handleNewPlayerOTPMessage(socket, message, store);
  } else if (isBroadcastActionMessage(message)) {
    handleBroadcastAction(message, store);
  }
};

export const handleConnection = (socket: Socket, getStore: () => Store) => {
  console.log(
    "New device connected with id: " +
      socket._id +
      " and address " +
      socket.address(),
  );
  socket.on("data", (data) => {
    const msg = JSON.parse(data.toString()) as Message;

    handleMessageFromClient(socket, msg, getStore());
  });

  socket.on("error", (error) => {
    console.log("An error occurred with client socket ", error);
  });

  socket.on("close", () => {
    const store = getStore();
    const player = store.players.find(
      (player) => player.socket?._id === socket._id,
    );
    if (player) {
      console.log("Player left ", player.name);
      console.log("Closed connection with ", socket.address());
      store.removePlayer(player);
    }
  });
};
