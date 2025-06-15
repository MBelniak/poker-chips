import { StateCreator } from "zustand/vanilla";
import { Store } from "@/model/store";
import { TablePlayer } from "@/model/store/slices/playerSlice";
import { ActionType, isActionTakesAmount } from "@/model/types";
import {
  cleanupTable,
  dealCards,
  gatherBets,
  moveDealer,
  nextAction,
  nextRound,
  sitDown,
  standUp,
} from "@/model/logic/tableLogic";
import { createActionMessage } from "@/model/messageCreators";
import Socket from "react-native-tcp-socket/lib/types/Socket";

export type Table = {
  isPlaying: boolean;
  buyIn: number;
  smallBlind: number;
  bigBlind: number;
  autoMoveDealer: boolean;
  bigBlindPosition?: number;
  currentBet?: number;
  currentPosition?: number;
  currentRound?: BettingRound;
  dealerPosition?: number;
  debug: boolean;
  handNumber: number;
  lastPosition?: number;
  lastRaise?: number;
  players: (TablePlayer | null)[];
  pots: Pot[];
  smallBlindPosition?: number;
};

export interface Pot {
  amount: number;
  eligiblePlayers: TablePlayer[];
}

export enum BettingRound {
  PRE_FLOP = "pre-flop",
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river",
}

export interface TableSlice {
  table: Table;
  setTable: (table: Table) => void;
  setTablePartial: (table: Partial<Table>) => void;
  setBuyIn: (amount: string) => void;
  getActingPlayers: () => TablePlayer[];
  getActivePlayers: () => TablePlayer[];
  getBigBlindPlayer: () => TablePlayer | null;
  getCurrentActor: () => TablePlayer | null;
  getCurrentPot: () => Pot;
  getDealer: () => TablePlayer | null;
  getLastActor: () => TablePlayer | null;
  getSidePots: () => Pot[] | null;
  getSmallBlindPlayer: () => TablePlayer | null;
  moveDealer: (seatNumber: number) => void;
  sitDown: (
    id: string,
    name: string,
    buyIn: number,
    seatNumber?: number,
  ) => number;
  standUp: (player: TablePlayer | string) => TablePlayer[];
  cleanUpTable: () => void;
  dealCards: () => void;
  nextAction: () => void;
  getBettingPlayers: () => (TablePlayer | null)[];
  gatherBets: () => void;
  nextRound: () => void;
  showdown: () => void;
  broadcastAction: (
    actionType: ActionType,
    actor: TablePlayer,
    amount?: number,
  ) => void;
}

export const createTableSlice: StateCreator<Store, [], [], TableSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  table: {
    isPlaying: false,
    buyIn: 0,
    smallBlind: 5,
    bigBlind: 10,
    autoMoveDealer: true,
    bigBlindPosition: undefined,
    currentBet: undefined,
    currentPosition: undefined,
    currentRound: undefined,
    dealerPosition: undefined,
    debug: false,
    handNumber: 0,
    lastPosition: undefined,
    lastRaise: undefined,
    players: Array(10).fill(null),
    pots: [],
    smallBlindPosition: undefined,
  },
  setTable: (table: Table) => {
    set(() => ({
      table,
    }));
  },
  setTablePartial: (table: Partial<Table>) => {
    set((store) => ({
      table: { ...store.table, ...table },
    }));
  },
  setBuyIn: (amount: string) =>
    set((store) => ({
      table: { ...store.table, buyIn: amount.length ? parseInt(amount) : 0 },
    })),
  getActingPlayers: () => {
    const store = get();
    return store.table.players.filter(
      (player) =>
        player &&
        !player.folded &&
        player.stackSize > 0 &&
        (!store.table.currentBet ||
          !player.raise ||
          (store.table.currentBet && player.bet < store.table.currentBet)),
    ) as TablePlayer[];
  },
  getActivePlayers: () => {
    const store = get();

    return store.table.players.filter(
      (player) => player && !player.folded,
    ) as TablePlayer[];
  },

  getBigBlindPlayer: () => {
    const store = get();
    if (store.table.bigBlindPosition === undefined) return null;
    return store.table.players[store.table.bigBlindPosition];
  },

  getCurrentActor: () => {
    const store = get();
    if (store.table.currentPosition === undefined) return null;
    return store.table.players[store.table.currentPosition];
  },

  getCurrentPot: () => {
    const store = get();

    // If there is no pot, create one.
    if (store.table.pots.length === 0) {
      const newPot = { amount: 0, eligiblePlayers: [] } as Pot;
      store.setTablePartial({ pots: [...store.table.pots, newPot] });
      return newPot;
    }
    return store.table.pots[store.table.pots.length - 1];
  },

  getDealer: () => {
    const store = get();

    if (store.table.dealerPosition === undefined) return null;
    return store.table.players[store.table.dealerPosition];
  },
  getLastActor: () => {
    const store = get();

    if (store.table.lastPosition === undefined) return null;
    return store.table.players[store.table.lastPosition];
  },
  getSidePots: () => {
    const store = get();

    if (store.table.pots.length <= 1) {
      return null;
    }
    return store.table.pots.slice(0, store.table.pots.length - 1);
  },
  getSmallBlindPlayer: () => {
    const store = get();

    if (store.table.smallBlindPosition === undefined) return null;
    return store.table.players[store.table.smallBlindPosition];
  },
  moveDealer: (seatNumber: number) => {
    const store = get();
    moveDealer(seatNumber, store);
  },
  sitDown: (id: string, name: string, buyIn: number, seatNumber?: number) => {
    const store = get();
    return sitDown(id, name, buyIn, store, seatNumber);
  },
  standUp: (player: TablePlayer | string) => {
    const store = get();

    return standUp(player, store, get);
  },
  cleanUpTable: () => {
    cleanupTable(get);
  },
  dealCards: () => {
    set((store) => ({
      table: { ...store.table, isPlaying: true },
    }));
    dealCards(get);
  },
  nextAction: () => {
    nextAction(get);
  },
  getBettingPlayers: () => {
    return get().table.players.filter((player) => player && player.bet > 0);
  },
  gatherBets: () => {
    gatherBets(get);
  },
  nextRound: () => {
    nextRound(get);
  },
  showdown: () => {
    const store = get();

    store.setTablePartial({
      currentRound: undefined,
      currentPosition: undefined,
      lastPosition: undefined,
    });

    store.gatherBets();

    if (store.getActivePlayers().length > 1) {
      store.getActivePlayers().forEach((player) => {
        if (!player) return;
        player.showCards = true;
      });
      store.setTablePartial({
        players: JSON.parse(JSON.stringify(store.table.players)),
      });
    }

    // TODO Distribute pots and mark winners - prompt user
    // store.table.pots.forEach((pot) => {
    //   pot.winners = findWinners(pot.eligiblePlayers);
    //   const award = pot.amount / pot.winners!.length;
    //   pot.winners!.forEach((player) => (player.stackSize += award));
    // });
  },
  broadcastAction: (
    actionType: ActionType,
    actor: TablePlayer,
    amount?: number,
  ) => {
    const store = get();

    const sendActionMessageOnSocket = (socket: Socket) => {
      if (isActionTakesAmount(actionType)) {
        if (amount) {
          socket.write(createActionMessage(actionType, actor, amount));
        } else {
          console.error("Amount cannot be undefined for RAISE and BET actions");
        }
      } else {
        socket.write(createActionMessage(actionType, actor));
      }
    };

    if (store.server != null) {
      // We are the host, broadcast event to other players
      store.players
        .filter((player) => !!player.socket && player.id !== actor.id)
        .forEach((player) => {
          sendActionMessageOnSocket(player.socket!);
        });
    } else if (store.clientSocket) {
      sendActionMessageOnSocket(store.clientSocket);
    }
  },
});
