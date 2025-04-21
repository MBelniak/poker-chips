import Socket from "react-native-tcp-socket/lib/types/Socket";
import Zeroconf from "react-native-zeroconf";
import { StateCreator } from "zustand/vanilla";
import { AvailableGame, Message } from "@/model/types";
import TcpSocket from "react-native-tcp-socket";
import { Store } from "@/model/store";
import { createNewPlayerJoinRequestEvent } from "@/model/messageCreators";
import { handleMessageFromHost } from "@/model/communication-client";

export interface ClientSlice {
  clientSocket: Socket | null;
  clientName: string;
  clientTcpService: Zeroconf;
  availableGames: AvailableGame[];
  isWaitingForOtp: boolean;
  isInvalidOtp: boolean;
  isJoined: boolean;
  addAvailableGame: (game: AvailableGame) => void;
  connectToGame: (game: AvailableGame) => Promise<void>;
  setClientName: (name: string) => void;
  setWaitingForOtp: (value: boolean) => void;
  setIsInvalidOtp: (isInvalid: boolean) => void;
  setIsJoined: (isJoined: boolean) => void;
}

export const createClientSlice: StateCreator<Store, [], [], ClientSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  clientSocket: null,
  clientTcpService: new Zeroconf(),
  availableGames: [],
  clientName: "",
  isWaitingForOtp: false,
  isInvalidOtp: false,
  isJoined: false,
  setClientName: (name: string) => set(() => ({ clientName: name })),
  addAvailableGame: (game: AvailableGame) =>
    set((state) => {
      if (!state.availableGames.some(({ host }) => host === game.host)) {
        return { availableGames: [...state.availableGames, game] };
      }
      return state;
    }),
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
          console.log(get().clientName);
          client.write(createNewPlayerJoinRequestEvent(get().clientName));
          set(() => ({ clientSocket: client }));
          resolve();
        },
      );

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
        set(() => ({ clientSocket: null }));
      });

      client.on("close", () => {
        console.log("Connection closed");
        set(() => ({ clientSocket: null }));
      });
    });
  },
  setWaitingForOtp: (value: boolean) => {
    set(() => ({ isWaitingForOtp: value }));
  },
  setIsInvalidOtp: (isInvalid: boolean) => {
    set(() => ({ isInvalidOtp: isInvalid }));
  },
  setIsJoined: (isJoined: boolean) => {
    set(() => ({ isJoined }));
  },
});
