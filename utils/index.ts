import { OTP_LENGTH } from "@/constants/Connection";
import Socket from "react-native-tcp-socket/lib/types/Socket";
import { TablePlayer } from "@/model/store/slices/playerSlice";
import { Store } from "@/model/store";

export const getOtp = (): string =>
  Array(OTP_LENGTH)
    .fill(1)
    .map(() => Math.floor(Math.random() * 10))
    .join("");

export const getClientId = (socket: Socket): string => socket._id.toString();

export const substituteStorePlayerWithNewPlayer = (
  store: Store,
  player: TablePlayer,
) =>
  store.table.players.with(
    store.table.players.findIndex((pl) => pl?.id === player.id),
    player,
  );
