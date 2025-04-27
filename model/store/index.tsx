import { create } from "zustand";
import { GameState } from "@/model/types";
import { createHostSlice, HostSlice } from "@/model/store/slices/hostSlice";
import {
  ClientSlice,
  createClientSlice,
} from "@/model/store/slices/clientSlice";
import { Table } from "@/model/logic/Table";

export type Store = GameState &
  HostSlice &
  ClientSlice & {
    buyInAmount: number;
    setBuyInAmount: (amount: string) => void;
    setGameState: (state: Partial<GameState>) => void;
  };

export const getDefaultGameState = (buyInAmount: number): GameState => ({
  status: "waiting",
  actionHistory: [],
  table: new Table(buyInAmount),
});

export const useStore = create<Store>((set, get, store) => ({
  ...createHostSlice(set, get, store),
  ...createClientSlice(set, get, store),
  ...getDefaultGameState(0),
  buyInAmount: 0,
  setBuyInAmount: (amount: string) =>
    set(() => ({ buyInAmount: amount.length ? parseInt(amount) : 0 })),
  setGameState: (state: Partial<GameState>) => {
    set(() => ({
      ...state,
    }));
  },
}));

export const mapStoreToGameState = (store: Store): GameState => {
  return {
    status: store.status,
    actionHistory: store.actionHistory,
    table: store.table,
  };
};
