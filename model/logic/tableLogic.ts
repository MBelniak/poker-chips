import { BettingRound, Pot, Table } from "@/model/store/slices/tableSlice";
import { Store } from "@/model/store";
import { TablePlayer } from "@/model/store/slices/playerSlice";

export const moveDealer = (seatNumber: number, store: Store) => {
  if (store.table.players.filter((player) => player !== null).length === 0) {
    throw new Error("Move dealer was called but there are no seated players.");
  }

  store.table.dealerPosition = seatNumber;
  if (store.table.dealerPosition! >= store.table.players.length) {
    store.table.dealerPosition! -=
      store.table.players.length *
      Math.floor(store.table.dealerPosition! / store.table.players.length);
  }
  while (store.getDealer() === null && store.table.players.length > 0) {
    store.table.dealerPosition!++;
    if (store.table.dealerPosition! >= store.table.players.length) {
      store.table.dealerPosition! -=
        store.table.players.length *
        Math.floor(store.table.dealerPosition! / store.table.players.length);
    }
  }
  store.table.smallBlindPosition = store.table.dealerPosition! + 1;
  if (store.table.smallBlindPosition >= store.table.players.length) {
    store.table.smallBlindPosition -=
      store.table.players.length *
      Math.floor(store.table.smallBlindPosition / store.table.players.length);
  }
  while (
    store.getSmallBlindPlayer() === null &&
    store.table.players.length > 0
  ) {
    store.table.smallBlindPosition!++;
    if (store.table.smallBlindPosition! >= store.table.players.length) {
      store.table.smallBlindPosition! -=
        store.table.players.length *
        Math.floor(
          store.table.smallBlindPosition! / store.table.players.length,
        );
    }
  }
  store.table.bigBlindPosition = store.table.smallBlindPosition! + 1;
  if (store.table.bigBlindPosition >= store.table.players.length) {
    store.table.bigBlindPosition -=
      store.table.players.length *
      Math.floor(store.table.bigBlindPosition / store.table.players.length);
  }
  while (store.getBigBlindPlayer() === null && store.table.players.length > 0) {
    store.table.bigBlindPosition!++;
    if (store.table.bigBlindPosition! >= store.table.players.length) {
      store.table.bigBlindPosition! -=
        store.table.players.length *
        Math.floor(store.table.bigBlindPosition! / store.table.players.length);
    }
  }
  store.setTable(JSON.parse(JSON.stringify(store.table)));
};

export const sitDown = (
  id: string,
  name: string,
  buyIn: number,
  store: Store,
  seatNumber?: number,
) => {
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
    store.moveDealer(store.table.dealerPosition ?? seatNumber);
  }

  return seatNumber;
};

export const standUp = (
  player: TablePlayer | string,
  store: Store,
  storeGetter: () => Store,
) => {
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
    let currentStore = storeGetter();
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

      currentStore = storeGetter();

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
};

export const cleanupTable = (storeGetter: () => Store) => {
  const store = storeGetter();

  // Remove players who left;
  const leavingPlayers = store.table.players.filter(
    (player) => player && player.left,
  );
  leavingPlayers.forEach((player) => player && store.standUp(player));

  // Remove busted players;
  const bustedPlayers = storeGetter().table.players.filter(
    (player) => player && player.stackSize === 0,
  );
  bustedPlayers.forEach((player) => player && store.standUp(player));

  // Reset player bets, hole cards, and fold status.
  storeGetter().table.players.forEach((player) => {
    if (!player) return;
    player.bet = 0;
    player.raise = undefined;
    player.folded = false;
    player.showCards = false;
  });

  store.setTablePartial({
    pots: [{ amount: 0, eligiblePlayers: [] } as Pot],
    players: JSON.parse(JSON.stringify(storeGetter().table.players)),
    lastRaise: undefined,
    currentBet: undefined,
  });
};

export const dealCards = (storeGetter: () => Store) => {
  let currentStore = storeGetter();

  // Check for active round and throw if there is one.
  if (currentStore.table.currentRound) {
    throw new Error("There is already an active hand!");
  }

  currentStore.cleanUpTable();

  // Ensure there are at least two players.
  if (currentStore.getActivePlayers().length < 2) {
    throw new Error("Not enough players to start.");
  }

  // Set round to pre-flop.
  currentStore.setTablePartial({
    currentRound: BettingRound.PRE_FLOP,
    handNumber: storeGetter().table.handNumber + 1,
  });

  currentStore = storeGetter();
  // Move dealer and blind positions if it's not the first hand.
  if (currentStore.table.handNumber > 1 && currentStore.table.autoMoveDealer) {
    currentStore.moveDealer(currentStore.table.dealerPosition! + 1);
  }

  currentStore = storeGetter();

  // Force small and big blind bets and set current bet amount.
  const sbPlayer =
    currentStore.table.players[currentStore.table.smallBlindPosition!]!;
  const bbPlayer =
    currentStore.table.players[currentStore.table.bigBlindPosition!]!;
  if (currentStore.table.smallBlind > sbPlayer.stackSize) {
    sbPlayer.bet = sbPlayer.stackSize;
    sbPlayer.stackSize = 0;
  } else {
    sbPlayer.stackSize -= sbPlayer.bet = currentStore.table.smallBlind;
  }
  if (currentStore.table.bigBlind > bbPlayer.stackSize) {
    bbPlayer.bet = bbPlayer.stackSize;
    bbPlayer.stackSize = 0;
  } else {
    bbPlayer.stackSize -= bbPlayer.bet = currentStore.table.bigBlind;
  }
  currentStore.table.currentBet = currentStore.table.bigBlind;

  // Set current and last actors.
  currentStore.table.currentPosition = currentStore.table.bigBlindPosition! + 1;
  if (currentStore.table.currentPosition >= currentStore.table.players.length) {
    currentStore.table.currentPosition -=
      currentStore.table.players.length *
      Math.floor(
        currentStore.table.currentPosition / currentStore.table.players.length,
      );
  }
  while (
    currentStore.getCurrentActor() === null &&
    currentStore.table.players.length > 0
  ) {
    currentStore.table.currentPosition!++;
    if (
      currentStore.table.currentPosition! >= currentStore.table.players.length
    ) {
      currentStore.table.currentPosition! -=
        currentStore.table.players.length *
        Math.floor(
          currentStore.table.currentPosition! /
            currentStore.table.players.length,
        );
    }
  }
  currentStore.table.lastPosition = currentStore.table.bigBlindPosition!;

  currentStore.setTablePartial({
    players: currentStore.table.players,
    currentBet: currentStore.table.currentBet,
    currentPosition: currentStore.table.currentPosition,
    lastPosition: currentStore.table.lastPosition,
  });
};

export const nextAction = (storeGetter: () => Store) => {
  const store = storeGetter();

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
  store.table.currentPosition!++;
  if (store.table.currentPosition! >= store.table.players.length) {
    store.table.currentPosition! -=
      store.table.players.length *
      Math.floor(store.table.currentPosition! / store.table.players.length);
  }

  store.setTablePartial({ currentPosition: store.table.currentPosition });

  // if the current actor is null, not an acting player, or if the player has folded or is all-in then move the action again.
  if (
    !store.getCurrentActor() ||
    !store.getActingPlayers().includes(store.getCurrentActor()!) ||
    (!storeGetter().table.currentBet && store.getActingPlayers().length === 1)
  ) {
    store.nextAction();
  }
};

export const gatherBets = (storeGetter: () => Store) => {
  const store = storeGetter();

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
};

export const nextRound = (storeGetter: () => Store) => {
  let store = storeGetter();

  const resetPosition = () => {
    const store = storeGetter();

    // Set action to first player after dealer.
    store.table.currentPosition = store.table.dealerPosition! + 1;
    if (store.table.currentPosition === store.table.players.length) {
      store.table.currentPosition = 0;
    }
    while (store.getCurrentActor() === null && store.table.players.length > 0) {
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
      store = storeGetter();

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
      store = storeGetter();

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
      store = storeGetter();

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
};
