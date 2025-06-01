import { StateCreator } from "zustand/vanilla";
import { Store } from "@/model/store";
import { TablePlayer } from "@/model/store/slices/playerSlice";
import { ActionType } from "@/model/types";

export type Table = {
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
  // TODO implement broadcasting action to other players
  // broadcastAction: (actionType: ActionType, player: TablePlayer) => void;
}

export const createTableSlice: StateCreator<Store, [], [], TableSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  table: {
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

    if (store.table.players.filter((player) => player !== null).length === 0) {
      throw new Error(
        "Move dealer was called but there are no seated players.",
      );
    }

    const newTable = JSON.parse(JSON.stringify(store.table)) as Table;

    newTable.dealerPosition = seatNumber;
    if (newTable.dealerPosition! >= newTable.players.length) {
      newTable.dealerPosition! -=
        newTable.players.length *
        Math.floor(newTable.dealerPosition! / newTable.players.length);
    }
    while (store.getDealer() === null && newTable.players.length > 0) {
      newTable.dealerPosition!++;
      if (newTable.dealerPosition! >= newTable.players.length) {
        newTable.dealerPosition! -=
          newTable.players.length *
          Math.floor(newTable.dealerPosition! / newTable.players.length);
      }
    }
    newTable.smallBlindPosition = newTable.dealerPosition! + 1;
    if (newTable.smallBlindPosition >= newTable.players.length) {
      newTable.smallBlindPosition -=
        newTable.players.length *
        Math.floor(newTable.smallBlindPosition / newTable.players.length);
    }
    while (
      store.getSmallBlindPlayer() === null &&
      newTable.players.length > 0
    ) {
      newTable.smallBlindPosition!++;
      if (newTable.smallBlindPosition! >= newTable.players.length) {
        newTable.smallBlindPosition! -=
          newTable.players.length *
          Math.floor(newTable.smallBlindPosition! / newTable.players.length);
      }
    }
    newTable.bigBlindPosition = newTable.smallBlindPosition! + 1;
    if (newTable.bigBlindPosition >= newTable.players.length) {
      newTable.bigBlindPosition -=
        newTable.players.length *
        Math.floor(newTable.bigBlindPosition / newTable.players.length);
    }
    while (store.getBigBlindPlayer() === null && newTable.players.length > 0) {
      newTable.bigBlindPosition!++;
      if (newTable.bigBlindPosition! >= newTable.players.length) {
        newTable.bigBlindPosition! -=
          newTable.players.length *
          Math.floor(newTable.bigBlindPosition! / newTable.players.length);
      }
    }
    store.setTable(newTable);
  },
  sitDown: (id: string, name: string, buyIn: number, seatNumber?: number) => {
    const store = get();

    // If there are no null seats then the table is full.
    if (store.table.players.filter((player) => player === null).length === 0) {
      throw new Error("The table is currently full.");
    }
    if (buyIn < store.table.buyIn) {
      throw new Error(
        `Your buy-in must be greater or equal to the minimum buy-in of ${store.table.buyIn}.`,
      );
    }
    const existingPlayers = store.table.players.filter(
      (player) => player && player.id === id,
    );
    if (existingPlayers.length > 0 && !store.table.debug) {
      throw new Error("Player already joined this table.");
    }
    if (seatNumber && store.table.players[seatNumber] !== null) {
      throw new Error("There is already a player in the requested seat.");
    }

    const newPlayer = {
      id,
      name,
      stackSize: buyIn,
      left: false,
      showCards: false,
      folded: !!store.table.currentRound,
    } as TablePlayer;

    if (!seatNumber) {
      seatNumber = 0;
      while (store.table.players[seatNumber] !== null) {
        seatNumber++;
        if (seatNumber >= store.table.players.length) {
          throw new Error("No available seats!");
        }
      }
    }

    store.setTablePartial({
      players: store.table.players.with(seatNumber, newPlayer),
    });
    if (!store.table.currentRound) {
      store.cleanUpTable();
      store.moveDealer(get().table.dealerPosition ?? seatNumber);
    }

    return seatNumber;
  },
  standUp: (player: TablePlayer | string) => {
    const store = get();

    let playersToStandUp: TablePlayer[];
    if (typeof player === "string") {
      playersToStandUp = store.table.players.filter(
        (p: TablePlayer | null) => p && p.id === player && !p.left,
      ) as TablePlayer[];
      if (playersToStandUp.length === 0) {
        throw new Error(`No player found.`);
      }
    } else {
      playersToStandUp = store.table.players.filter(
        (p: TablePlayer | null) => p === player && !p.left,
      ) as TablePlayer[];
    }

    for (const player of playersToStandUp) {
      let currentStore = get();
      const playerIndex = currentStore.table.players.indexOf(player);

      if (currentStore.table.currentRound) {
        store.setTablePartial({
          players: currentStore.table.players.with(playerIndex, {
            ...player,
            folded: true,
            left: true,
          }),
        });
        if (
          store.getCurrentActor() === player ||
          store.getActingPlayers().length <= 1
        ) {
          store.nextAction();
        }
      } else {
        store.setTablePartial({
          players: currentStore.table.players.with(playerIndex, null),
        });

        currentStore = get();

        if (playerIndex === currentStore.table.dealerPosition) {
          if (
            currentStore.table.players.filter((player) => player !== null)
              .length === 0
          ) {
            store.setTablePartial({
              dealerPosition: undefined,
              smallBlindPosition: undefined,
              bigBlindPosition: undefined,
            });
          } else {
            store.moveDealer(currentStore.table.dealerPosition + 1);
          }
        }
      }
    }
    return playersToStandUp;
  },
  cleanUpTable: () => {
    const store = get();

    // Remove players who left;
    const leavingPlayers = store.table.players.filter(
      (player) => player && player.left,
    );
    leavingPlayers.forEach((player) => player && store.standUp(player));

    // Remove busted players;
    const bustedPlayers = get().table.players.filter(
      (player) => player && player.stackSize === 0,
    );
    bustedPlayers.forEach((player) => player && store.standUp(player));

    // Reset player bets, hole cards, and fold status.
    get().table.players.forEach((player) => {
      if (!player) return;
      player.bet = 0;
      player.raise = undefined;
      player.folded = false;
      player.showCards = false;
    });

    store.setTablePartial({
      pots: [{ amount: 0, eligiblePlayers: [] } as Pot],
      players: JSON.parse(JSON.stringify(get().table.players)),
      lastRaise: undefined,
      currentBet: undefined,
    });
  },
  dealCards: () => {
    let store = get();

    // Check for active round and throw if there is one.
    if (store.table.currentRound) {
      throw new Error("There is already an active hand!");
    }

    store.cleanUpTable();

    // Ensure there are at least two players.
    if (store.getActivePlayers().length < 2) {
      throw new Error("Not enough players to start.");
    }

    // Set round to pre-flop.
    store.setTablePartial({
      currentRound: BettingRound.PRE_FLOP,
      handNumber: get().table.handNumber + 1,
    });

    // Move dealer and blind positions if it's not the first hand.
    if (get().table.handNumber > 1 && get().table.autoMoveDealer) {
      store.moveDealer(get().table.dealerPosition! + 1);
    }

    store = get();
    const newTable = JSON.parse(JSON.stringify(store.table)) as Table;
    // Force small and big blind bets and set current bet amount.
    const sbPlayer = newTable.players[store.table.smallBlindPosition!]!;
    const bbPlayer = newTable.players[store.table.bigBlindPosition!]!;
    if (newTable.smallBlind > sbPlayer.stackSize) {
      sbPlayer.bet = sbPlayer.stackSize;
      sbPlayer.stackSize = 0;
    } else {
      sbPlayer.stackSize -= sbPlayer.bet = newTable.smallBlind;
    }
    if (newTable.bigBlind > bbPlayer.stackSize) {
      bbPlayer.bet = bbPlayer.stackSize;
      bbPlayer.stackSize = 0;
    } else {
      bbPlayer.stackSize -= bbPlayer.bet = newTable.bigBlind;
    }
    newTable.currentBet = newTable.bigBlind;

    // Set current and last actors.
    newTable.currentPosition = newTable.bigBlindPosition! + 1;
    if (newTable.currentPosition >= newTable.players.length) {
      newTable.currentPosition -=
        newTable.players.length *
        Math.floor(newTable.currentPosition / newTable.players.length);
    }
    while (store.getCurrentActor() === null && newTable.players.length > 0) {
      newTable.currentPosition!++;
      if (newTable.currentPosition! >= newTable.players.length) {
        newTable.currentPosition! -=
          newTable.players.length *
          Math.floor(newTable.currentPosition! / newTable.players.length);
      }
    }
    newTable.lastPosition = newTable.bigBlindPosition!;

    store.setTablePartial({
      players: newTable.players,
      currentBet: newTable.currentBet,
      currentPosition: newTable.currentPosition,
      lastPosition: newTable.lastPosition,
    });
  },
  nextAction: () => {
    const store = get();

    // See if everyone has folded.
    if (store.getActivePlayers().length === 1) {
      store.showdown();
      return;
    }

    // If current position is last position, move to next round.
    if (store.table.currentPosition === store.table.lastPosition) {
      store.nextRound();
      return;
    }

    // Send the action to the next player.
    const newTable = JSON.parse(JSON.stringify(store.table)) as Table;
    newTable.currentPosition!++;
    if (newTable.currentPosition! >= newTable.players.length) {
      newTable.currentPosition! -=
        newTable.players.length *
        Math.floor(newTable.currentPosition! / newTable.players.length);
    }

    store.setTablePartial({ currentPosition: newTable.currentPosition });

    // if the current actor is null, not an acting player, or if the player has folded or is all-in then move the action again.
    if (
      !store.getCurrentActor() ||
      !store.getActingPlayers().includes(store.getCurrentActor()!) ||
      (!get().table.currentBet && store.getActingPlayers().length === 1)
    ) {
      store.nextAction();
    }
  },
  getBettingPlayers: () => {
    return get().table.players.filter((player) => player && player.bet > 0);
  },
  gatherBets: () => {
    const store = get();

    // Obtain all players who placed bets.
    const bettingPlayers = store.getBettingPlayers();

    if (bettingPlayers.length <= 1) {
      bettingPlayers.forEach((player) => {
        if (!player) return;
        if (player.bet) {
          player.stackSize = player.stackSize + player.bet;
          player.bet = 0;
        }
      });
      store.setTablePartial({
        players: JSON.parse(JSON.stringify(store.players)),
      });
      return;
    }

    // Check for all-in players.
    let allInPlayers = bettingPlayers.filter(
      (player) => player && player.bet && player.stackSize === 0,
    );
    const currentPot = store.getCurrentPot();

    // Iterate over them and gather bets until there are no more all in players.
    while (allInPlayers.length > 0) {
      // Find lowest all-in player.
      const lowestAllInBet = allInPlayers
        .filter((player) => player !== null)
        .map((player) => player!.bet)
        .reduce((prevBet: number, evalBet: number) =>
          evalBet < prevBet ? evalBet : prevBet,
        );

      // If other players have bet more than the lowest all-in player then subtract the lowest all-in amount from their bet and add it to the pot.
      bettingPlayers.forEach((player) => {
        if (!player || player.bet === 0) return;
        if (player.bet >= lowestAllInBet) {
          player.bet -= lowestAllInBet;

          currentPot.amount += lowestAllInBet;
          if (!currentPot.eligiblePlayers.includes(player)) {
            currentPot.eligiblePlayers.push(player);
          }
          return;
        }
        // Gather bets from folded players and players who only called the lowest all-in.
        currentPot.amount += player.bet;
        player.bet = 0;
        if (!currentPot.eligiblePlayers.includes(player)) {
          currentPot.eligiblePlayers.push(player);
        }
      });

      allInPlayers = bettingPlayers.filter(
        (player) => player && player.bet && player.stackSize === 0,
      );

      // Create new pot.
      store.table.pots.push({ amount: 0, eligiblePlayers: [] } as Pot);
    }

    // Once we're done with all-in players add the remaining bets to the pot.
    store.getBettingPlayers().forEach((player) => {
      if (!player || player.bet === 0) return;
      currentPot.amount += player.bet;
      player.bet = 0;
      if (!currentPot.eligiblePlayers.includes(player)) {
        currentPot.eligiblePlayers.push(player);
      }
    });

    // Remove any folded players from pot eligibility.
    store.table.pots.forEach(
      (pot: Pot) =>
        (pot.eligiblePlayers = pot.eligiblePlayers.filter(
          (player) => !player?.folded && !player?.left,
        )),
    );

    store.setTablePartial({
      pots: JSON.parse(JSON.stringify(store.table.pots)),
      players: JSON.parse(JSON.stringify(store.table.players)),
    });
  },
  nextRound: () => {
    let store = get();

    const resetPosition = () => {
      const store = get();

      // Set action to first player after dealer.
      store.table.currentPosition = store.table.dealerPosition! + 1;
      if (store.table.currentPosition === store.table.players.length) {
        store.table.currentPosition = 0;
      }
      while (
        store.getCurrentActor() === null &&
        store.table.players.length > 0
      ) {
        store.table.currentPosition++;
        if (store.table.currentPosition >= store.table.players.length) {
          store.table.currentPosition = 0;
        }
      }
      store.table.lastPosition = store.table.dealerPosition!;
      if (
        !store.getActingPlayers().includes(store.getCurrentActor()!) ||
        store.getActingPlayers().length <= 1
      ) {
        store.nextAction();
      }
    };

    switch (store.table.currentRound) {
      case BettingRound.PRE_FLOP:
        // Gather bets and place them in the pot.
        store.gatherBets();
        store = get();

        // Set round to flop.
        store.setTablePartial({
          // Reset current bet and last raise.
          currentBet: undefined,
          lastRaise: undefined,
          currentRound: BettingRound.FLOP,
        });

        // Reset position;
        resetPosition();

        break;
      case BettingRound.FLOP:
        // Gather bets and place them in the pot.
        store.gatherBets();
        store = get();

        // Reset current bet and last raise.
        delete store.table.currentBet;
        delete store.table.lastRaise;

        // Set round to turn.
        store.setTablePartial({
          // Reset current bet and last raise.
          currentBet: undefined,
          lastRaise: undefined,
          currentRound: BettingRound.TURN,
        });

        // Reset position;
        resetPosition();

        break;
      case BettingRound.TURN:
        // Gather bets and place them in the pot.
        store.gatherBets();
        store = get();

        // Set round to river.
        store.setTablePartial({
          // Reset current bet and last raise.
          currentBet: undefined,
          lastRaise: undefined,
          currentRound: BettingRound.RIVER,
        });

        // Reset position.
        resetPosition();

        break;
      case BettingRound.RIVER:
        store.table.players.forEach((player) => {
          if (!player) return;
          player.showCards = !player.folded;
        });

        store.setTablePartial({
          players: JSON.parse(JSON.stringify(store.table.players)),
        });
        store.showdown();
        break;
    }
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
});
