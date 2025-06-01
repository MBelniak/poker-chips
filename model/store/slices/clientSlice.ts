import Socket from "react-native-tcp-socket/lib/types/Socket";
import Zeroconf from "react-native-zeroconf";
import { StateCreator } from "zustand/vanilla";
import { AvailableGame, Message } from "@/model/types";
import TcpSocket from "react-native-tcp-socket";
import { Store } from "@/model/store";
import { createNewPlayerJoinRequestMessage } from "@/model/messageCreators";
import { handleMessageFromHost } from "@/model/communication-client";
import {
  SERVICE_DOMAIN,
  SERVICE_PROTOCOL,
  SERVICE_TYPE,
} from "@/constants/Connection";

export interface ClientSlice {
  clientSocket: Socket | null;
  clientName: string;
  playerId: string | null;
  clientTcpService: Zeroconf | null;
  availableGames: AvailableGame[];
  isWaitingForOtp: boolean;
  isInvalidOtp: boolean;
  isJoined: boolean;
  joinFailedMessage: string | null;
  startScanningForGames: () => void;
  stopScanningForGames: () => void;
  addAvailableGame: (game: AvailableGame) => void;
  connectToGame: (game: AvailableGame) => Promise<void>;
  setClientSocket: (clientSocket: Socket | null) => void;
  setClientName: (name: string) => void;
  setIsWaitingForOtp: (value: boolean) => void;
  setIsInvalidOtp: (isInvalid: boolean) => void;
  setIsJoined: (isJoined: boolean) => void;
  setJoinFailedMessage: (message: string | null) => void;
  setPlayerId: (id: string | null) => void;
  exitGame: () => void;
}

export const createClientSlice: StateCreator<Store, [], [], ClientSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  clientSocket: null,
  clientTcpService: null,
  availableGames: [],
  clientName: "",
  playerId: null,
  isWaitingForOtp: false,
  isInvalidOtp: false,
  isJoined: false,
  joinFailedMessage: null,
  setClientSocket: (clientSocket: Socket | null) => {
    set(() => ({ clientSocket }));
  },
  setClientName: (name: string) => set(() => ({ clientName: name })),
  addAvailableGame: (game: AvailableGame) =>
    set((state) => {
      if (!state.availableGames.some(({ host }) => host === game.host)) {
        return { availableGames: [...state.availableGames, game] };
      }
      return state;
    }),
  startScanningForGames: () => {
    const store = get();
    set(() => ({
      availableGames: [],
      isWaitingForOtp: false,
      isInvalidOtp: false,
      isJoined: false,
    }));

    store.clientTcpService = new Zeroconf();
    store.clientTcpService.on("resolved", (service) => {
      console.log("Found game:", service.name);
      store.addAvailableGame({
        host: service.host,
        name: service.name,
        port: service.port,
      });
    });

    store.clientTcpService.scan(SERVICE_TYPE, SERVICE_PROTOCOL, SERVICE_DOMAIN);

    store.clientTcpService.on("error", (error) => {
      // TODO handle error
      console.log("Error: ", error);
    });
  },
  connectToGame: (game: AvailableGame) => {
    console.log("Connecting to game ", game.name);

    return new Promise<void>((resolve, reject) => {
      const client = TcpSocket.createConnection(
        {
          host: game.host,
          port: game.port,
        },
        () => {
          console.log("Connected to game server");
        },
      );

      set(() => ({ clientSocket: client }));

      client.on("connect", () => {
        client.write(createNewPlayerJoinRequestMessage(get().clientName));
        resolve();
      });

      client.on("data", (data) => {
        try {
          const message = JSON.parse(data.toString()) as Message;
          handleMessageFromHost(message, get());
        } catch (e) {
          console.error("Error parsing server message", e);
        }
      });

      client.on("timeout", () => {
        reject(new Error("Connection timeout"));
      });

      client.on("error", (error) => {
        console.log("Connection error:", error);
        get().exitGame();
      });

      client.on("close", () => {
        console.log("Connection closed");
        get().exitGame();
      });
    });
  },
  stopScanningForGames: () => {
    const store = get();

    store.clientTcpService?.stop();
    store.clientTcpService?.removeAllListeners();
    store.setIsJoined(false);
    store.setIsWaitingForOtp(false);
    store.setIsInvalidOtp(false);
  },
  setIsWaitingForOtp: (value: boolean) =>
    set(() => ({ isWaitingForOtp: value })),
  setIsInvalidOtp: (isInvalid: boolean) =>
    set(() => ({ isInvalidOtp: isInvalid })),
  setIsJoined: (isJoined: boolean) => set(() => ({ isJoined })),
  setPlayerId: (playerId: string | null) => set(() => ({ playerId })),
  exitGame: () => {
    const store = get();
    console.log("Exiting game");
    store.clientSocket?.destroy();

    set(() => ({
      clientSocket: null,
    }));
  },
  setJoinFailedMessage: (message: string | null) =>
    set(() => ({ joinFailedMessage: message })),
});
