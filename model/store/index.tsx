import { create } from "zustand";
import { createHostSlice, HostSlice } from "@/model/store/slices/hostSlice";
import {
  ClientSlice,
  createClientSlice,
} from "@/model/store/slices/clientSlice";
import { createTableSlice, TableSlice } from "@/model/store/slices/tableSlice";
import {
  createPlayerSlice,
  PlayerSlice,
} from "@/model/store/slices/playerSlice";

export type Store = HostSlice & ClientSlice & TableSlice & PlayerSlice;

export const useStore = create<Store>((set, get, store) => ({
  ...createHostSlice(set, get, store),
  ...createClientSlice(set, get, store),
  ...createTableSlice(set, get, store),
  ...createPlayerSlice(set, get, store),
}));
