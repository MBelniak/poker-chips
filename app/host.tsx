import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, Button } from "react-native";
import Zeroconf from "react-native-zeroconf";
import TcpSocket from "react-native-tcp-socket";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import Server from "react-native-tcp-socket/lib/types/Server";

const SERVICE_TYPE = "_http._tcp";
const SERVICE_NAME = "poker-game";
const PORT = 3000;

type GameStatus = "waiting" | "playing" | "finished";

type GameState = {
  status: GameStatus;
  currentTurn: string | null;
};

const enum EventType {
  NEW_PLAYER_JOINED = "NEW_PLAYER_JOINED",
  NEW_PLAYER_JOIN_REQUEST = "NEW_PLAYER_JOIN_REQUEST",
  GAME_STATE = "GAME_STATE",
  PLAYER_ACTION = "PLAYER_ACTION",
}

type NewPlayerJoinedMessage = {
  type: EventType.NEW_PLAYER_JOINED;
  name: string;
};
type NewPlayerJoinRequestMessage = {
  type: EventType.NEW_PLAYER_JOIN_REQUEST;
  name: string;
};
type GameStateMessage = { type: EventType.GAME_STATE; gameState: string };
type PlayerActionMessage = { type: EventType.PLAYER_ACTION; action: string };

type Message =
  | NewPlayerJoinedMessage
  | NewPlayerJoinRequestMessage
  | { type: string };

const isNewPlayerJoined = (msg: Message): msg is NewPlayerJoinedMessage =>
  msg.type === EventType.NEW_PLAYER_JOINED;

const isNewPlayerJoinRequest = (
  msg: Message,
): msg is NewPlayerJoinRequestMessage =>
  msg.type === EventType.NEW_PLAYER_JOIN_REQUEST;

const isPlayerAction = (msg: Message): msg is PlayerActionMessage =>
  msg.type === EventType.PLAYER_ACTION;

const createNewPlayerJoinedEvent = (name: string) =>
  JSON.stringify({
    type: EventType.NEW_PLAYER_JOINED,
    name,
  } as NewPlayerJoinedMessage);

const createGameStateEvent = (gameState: unknown) =>
  JSON.stringify({
    type: EventType.GAME_STATE,
    gameState: JSON.stringify(gameState),
  } as GameStateMessage);

const GameHost = () => {
  const [players, setPlayers] = useState<{ socket: Socket; name: string }[]>(
    [],
  );
  const [gameState, setGameState] = useState<GameState>({
    // Your game state here
    status: "waiting", // waiting, playing, finished
    currentTurn: null,
  });

  const zeroconf = useRef<Zeroconf>(new Zeroconf());
  const [server, setServer] = useState<Server | null>(null);

  const handleNewPlayerRequest = useCallback(
    (socket: Socket, msg: NewPlayerJoinRequestMessage) => {
      players.forEach((player) =>
        player.socket.write(createNewPlayerJoinedEvent(msg.name)),
      );
      socket.write(createGameStateEvent(gameState));
      setPlayers((players) => [...players, { socket, name: msg.name }]);
    },
    [gameState, players],
  );

  const handleConnection = useCallback(
    function (socket: Socket) {
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
          handleNewPlayerRequest(socket, msg);
        } else if (isPlayerAction(msg)) {
          //   TODO handle action, update game state, emit events to clients
        }
      });

      socket.on("error", (error) => {
        console.log("An error ocurred with client socket ", error);
      });

      socket.on("close", () => {
        setPlayers((players) => {
          const playerIndex = players.findIndex(
            (player) => player.socket._id === socket._id,
          );
          if (playerIndex > -1) {
            console.log("Player left ", players[playerIndex].name);
            console.log("Closed connection with ", socket.address());
            return players.toSpliced(playerIndex, 1);
          }
          return players;
        });
      });
    },
    [handleNewPlayerRequest],
  );

  const createServer = useCallback(() => {
    const _server = TcpSocket.createServer(handleConnection);
    _server.listen({
      port: PORT,
      host: "0.0.0.0",
    });
    setServer(_server);
  }, [handleConnection]);

  useEffect(() => {
    if (server) {
      zeroconf.current.publishService(
        SERVICE_TYPE,
        "tcp",
        "local.",
        SERVICE_NAME,
        PORT,
      );

      server.on("listening", () => {
        console.log("Listening for connections...");
      });

      server.on("error", (error: unknown) => {
        console.log("An error occurred with the server", error);
      });

      server.on("close", () => {
        console.log("Server closed connection");
      });
    }
  }, [server]);

  const stopHosting = useCallback(() => {
    if (server) {
      zeroconf.current.unpublishService(SERVICE_NAME);
      server.close();
      console.log("Server stopped");
    }
  }, [server]);

  useEffect(() => {
    return () => {
      stopHosting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      <Text>Players: {players.length}</Text>
      <Button title="Start Hosting" onPress={createServer} />
      <Button title="Stop Hosting" onPress={stopHosting} />

      {/* Game UI */}
    </View>
  );
};

export default GameHost;
