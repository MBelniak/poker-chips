import { StateCreator } from "zustand/vanilla";
import { Store } from "@/model/store";
import { ActionType } from "@/model/types";

export interface TablePlayer {
  bet: number;
  raise?: number;
  folded: boolean;
  showCards: boolean;
  left: boolean;
  id: string;
  name: string;
  stackSize: number;
}

export interface PlayerSlice {
  betAction: (player: TablePlayer, amount: number) => void;
  callAction: (player: TablePlayer) => void;
  checkAction: (player: TablePlayer) => void;
  raiseAction: (player: TablePlayer, amount: number) => void;
  foldAction: (player: TablePlayer) => void;
  getLegalActions: (player: TablePlayer) => ActionType[];
}

export const createPlayerSlice: StateCreator<Store, [], [], PlayerSlice> = (
  set,
  get,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _,
) => ({
  betAction: (player: TablePlayer, amount: number) => {
    const store = get();

    if (this !== store.getCurrentActor()) {
      throw new Error("Action invoked on player out of turn!");
    }
    if (!store.getLegalActions(player).includes(ActionType.BET)) {
      throw new Error("Illegal action.");
    }
    if (isNaN(amount)) {
      throw new Error("Amount was not a valid number.");
    }
    const currentBet = store.table.currentBet;
    if (currentBet)
      throw new Error("Illegal action. There is already a bet on the table.");
    if (amount < store.table.bigBlind) {
      throw new Error("A bet must be at least as much as the big blind.");
    } else if (amount > player.stackSize) {
      throw new Error("You cannot bet more than you brought to the table.");
    }
    store.raiseAction(player, amount);
  },
  callAction: (player: TablePlayer) => {
    const store = get();

    if (player !== store.getCurrentActor()) {
      throw new Error("Action invoked on player out of turn!");
    }
    if (!store.getLegalActions(player).includes(ActionType.CALL)) {
      throw new Error("Illegal action.");
    }
    const currentBet = store.table.currentBet;
    if (!currentBet)
      throw new Error("Illegal action. There is no bet to call.");
    const callAmount = currentBet - player.bet;
    // All-in via inability to call
    if (callAmount > player.stackSize) {
      // Add stack to current bet and empty stack;
      player.bet += player.stackSize;
      player.stackSize = 0;
    } else {
      delete player.raise;
      player.stackSize -= callAmount;
      player.bet += callAmount;
    }
    store.setTablePartial({
      players: JSON.parse(JSON.stringify(store.table.players)),
    });
    store.nextAction();
  },
  raiseAction(player: TablePlayer, amount: number) {
    const store = get();

    if (player !== store.getCurrentActor()) {
      throw new Error("Action invoked on player out of turn!");
    }
    const legalActions = store.getLegalActions(player);
    if (
      !legalActions.includes(ActionType.RAISE) &&
      !legalActions.includes(ActionType.BET)
    ) {
      throw new Error("Illegal action.");
    }
    if (amount === undefined || isNaN(amount)) {
      throw new Error("Amount was not a valid number.");
    }
    if (amount > player.stackSize) {
      throw new Error("You cannot bet more than you brought to the table.");
    }
    const currentBet = store.table.currentBet;
    const lastRaise = store.table.lastRaise;
    const minRaise = lastRaise ?? store.table.bigBlind;
    const raiseAmount = currentBet ? amount - currentBet : amount;
    // Do not allow the raise if it's less than the minimum and they aren't going all-in.
    if (raiseAmount < minRaise && amount < player.stackSize) {
      if (currentBet) {
        throw new Error(
          `You must raise by at least \`$${minRaise}\`, making the bet \`$${minRaise + currentBet}\`.`,
        );
      } else {
        throw new Error(`You must bet at least \`$${minRaise}\`.`);
      }
    } else if (raiseAmount < minRaise && amount >= player.stackSize) {
      // When the all-in player is raising for less than the minimum raise then increase the bet amount but do not change last raise value.
      player.bet += player.stackSize;
      player.stackSize = 0;
      store.table.currentBet = player.bet;
    } else if (amount >= minRaise) {
      player.stackSize -= amount;
      player.bet += amount;
      store.table.currentBet = player.bet;
      // Only mark raise values if there is a current bet.
      if (currentBet) {
        player.raise = store.table.lastRaise = amount - currentBet;
      }
      // Set last action to the player behind this one.
      store.table.lastPosition = store.table.currentPosition! - 1;
      if (store.table.lastPosition === -1)
        store.table.lastPosition = store.table.players.length - 1;
      while (
        !store.getLastActor() ||
        !store.getActingPlayers().includes(store.getLastActor()!)
      ) {
        store.table.lastPosition--;
        if (store.table.lastPosition === -1)
          store.table.lastPosition = store.table.players.length - 1;
      }
    }

    store.setTablePartial({
      players: JSON.parse(JSON.stringify(store.table.players)),
    });
    store.nextAction();
  },
  checkAction: (player: TablePlayer) => {
    const store = get();

    if (this !== store.getCurrentActor()) {
      throw new Error("Action invoked on player out of turn!");
    }
    if (!store.getLegalActions(player).includes(ActionType.CHECK)) {
      throw new Error("Illegal action.");
    }
    store.nextAction();
  },
  foldAction: (player: TablePlayer) => {
    const store = get();

    if (this !== store.getCurrentActor()) {
      throw new Error("Action invoked on player out of turn!");
    }
    if (!store.getLegalActions(player).includes(ActionType.FOLD)) {
      throw new Error("Illegal action.");
    }
    player.folded = true;
    store.setTablePartial({
      players: JSON.parse(JSON.stringify(store.table.players)),
    });
    store.nextAction();
  },
  getLegalActions: (player: TablePlayer) => {
    const store = get();

    const currentBet = store.table.currentBet;
    const lastRaise = store.table.lastRaise;
    const actions: ActionType[] = [];
    if (!currentBet) {
      actions.push(ActionType.CHECK, ActionType.BET);
    } else {
      if (player.bet === currentBet) {
        actions.push(ActionType.CHECK);
        if (
          player.stackSize > currentBet &&
          store.getActingPlayers().length > 0
        ) {
          actions.push(ActionType.RAISE);
        }
      }
      if (player.bet < currentBet) {
        actions.push(ActionType.CALL);
        if (
          player.stackSize > currentBet &&
          store.getActingPlayers().length > 0 &&
          (!lastRaise || !player.raise || lastRaise >= player.raise)
        ) {
          actions.push(ActionType.RAISE);
        }
      }
    }
    actions.push(ActionType.FOLD);
    return actions;
  },
});
