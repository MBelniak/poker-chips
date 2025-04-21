import {
  EventType,
  GameStateMessage,
  Message,
  NewPlayerJoinedMessage,
  NewPlayerJoinRequestMessage,
  PlayerActionMessage,
} from "./types";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import { HostStore } from "@/model/store";

export const isNewPlayerJoined = (
  msg: Message,
): msg is NewPlayerJoinedMessage => msg.type === EventType.NEW_PLAYER_JOINED;

export const isNewPlayerJoinRequest = (
  msg: Message,
): msg is NewPlayerJoinRequestMessage =>
  msg.type === EventType.NEW_PLAYER_JOIN_REQUEST;

export const isPlayerAction = (msg: Message): msg is PlayerActionMessage =>
  msg.type === EventType.PLAYER_ACTION;

export const createNewPlayerJoinedEvent = (name: string) =>
  JSON.stringify({
    type: EventType.NEW_PLAYER_JOINED,
    name,
  } as NewPlayerJoinedMessage);

export const createGameStateEvent = (gameState: unknown) =>
  JSON.stringify({
    type: EventType.GAME_STATE,
    gameState: JSON.stringify(gameState),
  } as GameStateMessage);

export const handleNewPlayerRequest = (
  socket: Socket,
  msg: NewPlayerJoinRequestMessage,
  store: HostStore,
) => {
  store.players.forEach((player) =>
    player.socket?.write(createNewPlayerJoinedEvent(msg.name)),
  );
  // TODO send game state to the new player
  store.addPlayer({ socket, name: msg.name });
};

export const handleConnection = (socket: Socket, get: () => HostStore) => {
  console.log(
    "New device connected with id: " +
      socket._id +
      " and address " +
      socket.address(),
  );
  socket.on("data", (data) => {
    const msg = JSON.parse(data.toString()) as Message;

    // Using if-else instead of switch for type guarding
    if (isNewPlayerJoinRequest(msg)) {
      handleNewPlayerRequest(socket, msg, get());
    }
  });

  socket.on("error", (error) => {
    console.log("An error ocurred with client socket ", error);
  });

  socket.on("close", () => {
    const store = get();
    const player = store.players.find(
      (player) => player.socket?._id === socket._id,
    );
    if (player) {
      console.log("Player left ", player.name);
      console.log("Closed connection with ", socket.address());
      return store.removePlayer(player);
    }
  });
};
