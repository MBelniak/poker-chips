import { OTP_LENGTH } from "@/constants/Connection";
import Socket from "react-native-tcp-socket/lib/types/Socket";

export const getOtp = (): string =>
  Array(OTP_LENGTH)
    .fill(1)
    .map(() => Math.floor(Math.random() * 10))
    .join("");

export const getClientId = (socket: Socket): string => socket._id.toString();
