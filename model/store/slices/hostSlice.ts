import Zeroconf from "react-native-zeroconf";
import Server from "react-native-tcp-socket/lib/types/Server";
import { Player } from "@/model/types";
import TcpSocket from "react-native-tcp-socket";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import { handleConnection } from "@/model/communication-host";
import {
  HOST,
  PORT,
  SERVICE_DOMAIN,
  SERVICE_NAME,
  SERVICE_PROTOCOL,
  SERVICE_TYPE,
} from "@/constants/Connection";
import { StateCreator } from "zustand/vanilla";
import { Store } from "@/model/store";
import { createDisconnectEvent } from "@/model/messageCreators";

export interface HostSlice {
  hostTcpService: Zeroconf;
  server: Server | null;
  players: Player[];
  pendingJoinRequests: Record<string, { otp: string; playerName: string }>; // socket._id => otp
  startServer: () => void;
  stopServer: () => void;
  addPlayer: (player: Player) => void;
  removePlayer: (player: Player) => void;
  removeAllPlayers: () => void;
  sendDisconnectEventToPlayer: (player: Player) => void;
  addJoinRequest: (
    id: string,
    data: { otp: string; playerName: string },
  ) => void;
  removeJoinRequest: (id: string) => void;
}

export const createHostSlice: StateCreator<Store, [], [], HostSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  hostTcpService: new Zeroconf(),
  server: null,
  players: [],
  pendingJoinRequests: {},
  startServer: () => {
    const store = get();
    const server = TcpSocket.createServer((socket: Socket) =>
      handleConnection(socket, get),
    );
    server.listen({
      port: PORT,
      host: HOST,
    });

    store.hostTcpService.publishService(
      SERVICE_TYPE,
      SERVICE_PROTOCOL,
      SERVICE_DOMAIN,
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
    store.hostTcpService.unpublishService(SERVICE_NAME);
    store.server?.close();
    console.log("Server stopped");
    set(() => ({ server: null }));
  },
  addPlayer: (player) => {
    const store = get();
    store.table?.sitDown(player.id, player.name, store.buyInAmount);
    set((state) => ({
      players: [...state.players, player],
    }));
  },
  removePlayer: (player) => {
    const store = get();
    store.table?.standUp(player.id);
    set((state) => ({
      players: state.players.toSpliced(
        state.players.findIndex((p) => p.socket?._id === player.socket?._id),
        1,
      ),
    }));
  },
  removeAllPlayers: () => {
    const store = get();
    store.table?.players?.forEach(
      (player) => player && store.table?.standUp(player?.id),
    );
    set(() => ({ players: [] }));
  },
  sendDisconnectEventToPlayer: (player: Player) => {
    player.socket?.write(createDisconnectEvent());
  },
  addJoinRequest: (id: string, data: { otp: string; playerName: string }) => {
    set((state) => ({
      pendingJoinRequests: {
        ...state.pendingJoinRequests,
        [id]: { ...data },
      },
    }));
  },
  removeJoinRequest: (id: string) => {
    set((state) => {
      delete state.pendingJoinRequests[id];
      return { pendingJoinRequests: { ...state.pendingJoinRequests } };
    });
  },
});
