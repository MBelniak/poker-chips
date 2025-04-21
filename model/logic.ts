import { OTP_LENGTH } from "@/constants/Connection";

export const getOtp = (): string =>
  Array(OTP_LENGTH)
    .fill(1)
    .map(() => Math.floor(Math.random() * 10))
    .join("");
