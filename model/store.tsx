import { create } from "zustand";
import { GameState, Player } from "@/model/types";
import Zeroconf from "react-native-zeroconf";
import Server from "react-native-tcp-socket/lib/types/Server";
import { HOST, PORT, SERVICE_NAME, SERVICE_TYPE } from "@/constants/Connection";
import TcpSocket from "react-native-tcp-socket";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import { handleConnection } from "@/model/communication"; // required for devtools typing

export interface HostStore extends GameState {
  service: Zeroconf;
  server: Server | null;
  players: Player[];
  startServer: () => void;
  stopServer: () => void;
  addPlayer: (player: Player) => void;
  removePlayer: (player: Player) => void;
}

export const useHostStore = create<HostStore>()((set, get) => ({
  service: new Zeroconf(),
  server: null,
  players: [],
  status: "waiting",
  dealer: null,
  currentTurn: null,
  actionHistory: [],
  playersState: [],
  startServer: () => {
    const store = get();
    const server = TcpSocket.createServer((socket: Socket) =>
      handleConnection(socket, get),
    );
    server.listen({
      port: PORT,
      host: HOST,
    });

    store.service.publishService(
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

    set(() => ({ server }));
  },
  stopServer: () => {
    const store = get();
    store.service.unpublishService(SERVICE_NAME);
    store.server?.close();
    console.log("Server stopped");
    set(() => ({ server: null }));
  },
  addPlayer: (player) =>
    set((state) => ({ players: [...state.players, player] })),
  removePlayer: (player) =>
    set((state) => ({
      players: state.players.toSpliced(
        state.players.findIndex((p) => p.socket?._id === player.socket?._id),
        1,
      ),
    })),
}));
