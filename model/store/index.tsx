import { create } from "zustand";
import { GameState } from "@/model/types";
import { createHostSlice, HostSlice } from "@/model/store/slices/hostSlice";
import {
  ClientSlice,
  createClientSlice,
} from "@/model/store/slices/clientSlice";

export type Store = GameState &
  HostSlice &
  ClientSlice & {
    setBuyInAmount: (amount: string) => void;
    setGameState: (state: GameState) => void;
  };

export const useStore = create<Store>((set, get, store) => ({
  ...createHostSlice(set, get, store),
  ...createClientSlice(set, get, store),
  status: "waiting",
  dealer: null,
  currentTurn: null,
  actionHistory: [],
  playersState: [],
  buyInAmount: 0,
  setBuyInAmount: (amount: string) =>
    set(() => ({ buyInAmount: amount.length ? parseInt(amount) : 0 })),
  setGameState: (state: GameState) => {
    set(() => ({
      ...state,
    }));
  },
}));

export const mapStoreToGameState = (store: Store): GameState => {
  return {
    status: store.status,
    dealer: store.dealer,
    currentTurn: store.currentTurn,
    actionHistory: store.actionHistory,
    playersState: store.playersState,
    buyInAmount: store.buyInAmount,
  };
};
