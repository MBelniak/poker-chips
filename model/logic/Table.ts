import { ParsedTableState } from "@/model/types";
import { Player } from "@/model/logic/Player";

export class Table {
  constructor(
    public buyIn: number,
    public smallBlind: number = 5,
    public bigBlind: number = 10,
    public autoMoveDealer: boolean = true,
    public bigBlindPosition?: number,
    public currentBet?: number,
    public currentPosition?: number,
    public currentRound?: BettingRound,
    public dealerPosition?: number,
    public debug: boolean = false,
    public handNumber: number = 0,
    public lastPosition?: number,
    public lastRaise?: number,
    public players: (Player | null)[] = Array(10).fill(null),
    public pots: Pot[] = [],
    public smallBlindPosition?: number,
  ) {
    if (smallBlind >= bigBlind) {
      throw new Error("The small blind must be less than the big blind.");
    }
  }

  static fromParsedTableState(tableState: ParsedTableState): Table {
    return new Table(
      tableState.buyIn,
      tableState.smallBlind,
      tableState.bigBlind,
      tableState.autoMoveDealer,
      tableState.bigBlindPosition,
      tableState.currentBet,
      tableState.currentPosition,
      tableState.currentRound,
      tableState.dealerPosition,
      tableState.debug,
      tableState.handNumber,
      tableState.lastPosition,
      tableState.lastRaise,
      tableState.players,
      tableState.pots,
      tableState.smallBlindPosition,
    );
  }

  get actingPlayers() {
    return this.players.filter(
      (player) =>
        player &&
        !player.folded &&
        player.stackSize > 0 &&
        (!this.currentBet ||
          !player.raise ||
          (this.currentBet && player.bet < this.currentBet)),
    ) as Player[];
  }

  get activePlayers() {
    return this.players.filter(
      (player) => player && !player.folded,
    ) as Player[];
  }

  get bigBlindPlayer() {
    if (this.bigBlindPosition === undefined) return;
    return this.players[this.bigBlindPosition];
  }

  get currentActor() {
    if (this.currentPosition === undefined) return;
    return this.players[this.currentPosition];
  }

  get currentPot() {
    // If there is no pot, create one.
    if (this.pots.length === 0) {
      const newPot = new Pot();
      this.pots.push(newPot);
      return newPot;
    }
    return this.pots[this.pots.length - 1];
  }

  get dealer() {
    if (this.dealerPosition === undefined) return;
    return this.players[this.dealerPosition];
  }

  get lastActor() {
    if (this.lastPosition === undefined) return;
    return this.players[this.lastPosition];
  }

  get sidePots() {
    if (this.pots.length <= 1) {
      return;
    }
    return this.pots.slice(0, this.pots.length - 1);
  }

  get smallBlindPlayer() {
    if (this.smallBlindPosition === undefined) return;
    return this.players[this.smallBlindPosition];
  }

  moveDealer(seatNumber: number) {
    if (this.players.filter((player) => player !== null).length === 0) {
      throw new Error(
        "Move dealer was called but there are no seated players.",
      );
    }
    this.dealerPosition = seatNumber;
    if (this.dealerPosition! >= this.players.length) {
      this.dealerPosition! -=
        this.players.length *
        Math.floor(this.dealerPosition! / this.players.length);
    }
    while (this.dealer === null && this.players.length > 0) {
      this.dealerPosition!++;
      if (this.dealerPosition! >= this.players.length) {
        this.dealerPosition! -=
          this.players.length *
          Math.floor(this.dealerPosition! / this.players.length);
      }
    }
    this.smallBlindPosition = this.dealerPosition! + 1;
    if (this.smallBlindPosition >= this.players.length) {
      this.smallBlindPosition -=
        this.players.length *
        Math.floor(this.smallBlindPosition / this.players.length);
    }
    while (this.smallBlindPlayer === null && this.players.length > 0) {
      this.smallBlindPosition!++;
      if (this.smallBlindPosition! >= this.players.length) {
        this.smallBlindPosition! -=
          this.players.length *
          Math.floor(this.smallBlindPosition! / this.players.length);
      }
    }
    this.bigBlindPosition = this.smallBlindPosition! + 1;
    if (this.bigBlindPosition >= this.players.length) {
      this.bigBlindPosition -=
        this.players.length *
        Math.floor(this.bigBlindPosition / this.players.length);
    }
    while (this.bigBlindPlayer === null && this.players.length > 0) {
      this.bigBlindPosition!++;
      if (this.bigBlindPosition! >= this.players.length) {
        this.bigBlindPosition! -=
          this.players.length *
          Math.floor(this.bigBlindPosition! / this.players.length);
      }
    }
  }

  sitDown(id: string, name: string, buyIn: number, seatNumber?: number) {
    // If there are no null seats then the table is full.
    if (this.players.filter((player) => player === null).length === 0) {
      throw new Error("The table is currently full.");
    }
    if (buyIn < this.buyIn) {
      throw new Error(
        `Your buy-in must be greater or equal to the minimum buy-in of ${this.buyIn}.`,
      );
    }
    const existingPlayers = this.players.filter(
      (player) => player && player.id === id,
    );
    if (existingPlayers.length > 0 && !this.debug) {
      throw new Error("Player already joined this table.");
    }
    if (seatNumber && this.players[seatNumber] !== null) {
      throw new Error("There is already a player in the requested seat.");
    }
    const newPlayer = new Player(id, name, buyIn, this);
    if (!seatNumber) {
      seatNumber = 0;
      while (this.players[seatNumber] !== null) {
        seatNumber++;
        if (seatNumber >= this.players.length) {
          throw new Error("No available seats!");
        }
      }
    }
    this.players[seatNumber] = newPlayer;
    if (this.currentRound) {
      newPlayer.folded = true;
    } else {
      this.cleanUp();
      this.moveDealer(this.dealerPosition ?? seatNumber);
    }
    return seatNumber;
  }

  standUp(player: Player | string) {
    let playersToStandUp: Player[];
    if (typeof player === "string") {
      playersToStandUp = this.players.filter(
        (p) => p && p.id === player && !p.left,
      ) as Player[];
      if (playersToStandUp.length === 0) {
        throw new Error(`No player found.`);
      }
    } else {
      playersToStandUp = this.players.filter(
        (p) => p === player && !p.left,
      ) as Player[];
    }
    for (const player of playersToStandUp) {
      if (this.currentRound) {
        player.folded = true;
        player.left = true;
        if (this.currentActor === player || this.actingPlayers.length <= 1) {
          this.nextAction();
        }
      } else {
        const playerIndex = this.players.indexOf(player);
        this.players[playerIndex] = null;
        if (playerIndex === this.dealerPosition) {
          if (this.players.filter((player) => player !== null).length === 0) {
            delete this.dealerPosition;
            delete this.smallBlindPosition;
            delete this.bigBlindPosition;
          } else {
            this.moveDealer(this.dealerPosition + 1);
          }
        }
      }
    }
    return playersToStandUp;
  }

  cleanUp() {
    // Remove players who left;
    const leavingPlayers = this.players.filter(
      (player) => player && player.left,
    );
    leavingPlayers.forEach((player) => player && this.standUp(player));

    // Remove busted players;
    const bustedPlayers = this.players.filter(
      (player) => player && player.stackSize === 0,
    );
    bustedPlayers.forEach((player) => player && this.standUp(player));

    // Reset player bets, hole cards, and fold status.
    this.players.forEach((player) => {
      if (!player) return;
      player.bet = 0;
      delete player.raise;
      player.folded = false;
      player.showCards = false;
    });

    // Empty pots.
    this.pots = [new Pot()];

    // Remove last raise and current bet.
    delete this.lastRaise;
    delete this.currentBet;
  }

  dealCards() {
    // Check for active round and throw if there is one.
    if (this.currentRound) {
      throw new Error("There is already an active hand!");
    }

    this.cleanUp();

    // Ensure there are at least two players.
    if (this.activePlayers.length < 2) {
      throw new Error("Not enough players to start.");
    }

    // Set round to pre-flop.
    this.currentRound = BettingRound.PRE_FLOP;

    // Increase hand number.
    this.handNumber++;

    // Move dealer and blind positions if it's not the first hand.
    if (this.handNumber > 1 && this.autoMoveDealer) {
      this.moveDealer(this.dealerPosition! + 1);
    }

    // Force small and big blind bets and set current bet amount.
    const sbPlayer = this.players[this.smallBlindPosition!]!;
    const bbPlayer = this.players[this.bigBlindPosition!]!;
    if (this.smallBlind > sbPlayer.stackSize) {
      sbPlayer.bet = sbPlayer.stackSize;
      sbPlayer.stackSize = 0;
    } else {
      sbPlayer.stackSize -= sbPlayer.bet = this.smallBlind;
    }
    if (this.bigBlind > bbPlayer.stackSize) {
      bbPlayer.bet = bbPlayer.stackSize;
      bbPlayer.stackSize = 0;
    } else {
      bbPlayer.stackSize -= bbPlayer.bet = this.bigBlind;
    }
    this.currentBet = this.bigBlind;

    // Set current and last actors.
    this.currentPosition = this.bigBlindPosition! + 1;
    if (this.currentPosition >= this.players.length) {
      this.currentPosition -=
        this.players.length *
        Math.floor(this.currentPosition / this.players.length);
    }
    while (this.currentActor === null && this.players.length > 0) {
      this.currentPosition!++;
      if (this.currentPosition! >= this.players.length) {
        this.currentPosition! -=
          this.players.length *
          Math.floor(this.currentPosition! / this.players.length);
      }
    }
    this.lastPosition = this.bigBlindPosition!;
  }

  nextAction() {
    // See if everyone has folded.
    if (this.activePlayers.length === 1) {
      this.showdown();
      return;
    }

    // If current position is last position, move to next round.
    if (this.currentPosition === this.lastPosition) {
      this.nextRound();
      return;
    }

    // Send the action to the next player.
    this.currentPosition!++;
    if (this.currentPosition! >= this.players.length) {
      this.currentPosition! -=
        this.players.length *
        Math.floor(this.currentPosition! / this.players.length);
    }

    // if the current actor is null, not an acting player, or if the player has folded or is all-in then move the action again.
    if (
      !this.currentActor ||
      !this.actingPlayers.includes(this.currentActor) ||
      (!this.currentBet && this.actingPlayers.length === 1)
    ) {
      this.nextAction();
    }
  }

  gatherBets() {
    // Obtain all players who placed bets.
    const bettingPlayers = this.players.filter(
      (player) => player && player.bet > 0,
    );

    if (bettingPlayers.length <= 1) {
      bettingPlayers.forEach((player) => {
        if (!player) return;
        if (player.bet) {
          player.stackSize += player.bet;
          player.bet = 0;
        }
      });
      return;
    }

    // Check for all-in players.
    let allInPlayers = bettingPlayers.filter(
      (player) => player && player.bet && player.stackSize === 0,
    );

    // Iterate over them and gather bets until there are no more all in players.
    while (allInPlayers.length > 0) {
      // Find lowest all-in player.
      const lowestAllInBet = allInPlayers
        .filter((player) => player !== null)
        .map((player) => player!.bet)
        .reduce((prevBet, evalBet) => (evalBet < prevBet ? evalBet : prevBet));
      // If other players have bet more than the lowest all-in player then subtract the lowest all-in amount from their bet and add it to the pot.
      bettingPlayers.forEach((player) => {
        if (!player || player.bet === 0) return;
        if (player.bet >= lowestAllInBet) {
          player.bet -= lowestAllInBet;
          this.currentPot.amount += lowestAllInBet;
          if (!this.currentPot.eligiblePlayers.includes(player)) {
            this.currentPot.eligiblePlayers.push(player);
          }
          return;
        }
        // Gather bets from folded players and players who only called the lowest all-in.
        this.currentPot.amount += player.bet;
        player.bet = 0;
        if (!this.currentPot.eligiblePlayers.includes(player)) {
          this.currentPot.eligiblePlayers.push(player);
        }
      });
      // Check for all-in players again.
      allInPlayers = allInPlayers.filter(
        (player) => player && player.bet && player.stackSize === 0,
      );
      // Create new pot.
      this.pots.push(new Pot());
    }

    // Once we're done with all-in players add the remaining bets to the pot.
    bettingPlayers.forEach((player) => {
      if (!player || player.bet === 0) return;
      this.currentPot.amount += player.bet;
      player.bet = 0;
      if (!this.currentPot.eligiblePlayers.includes(player)) {
        this.currentPot.eligiblePlayers.push(player);
      }
    });

    // Remove any folded players from pot eligibility.
    this.pots.forEach(
      (pot) =>
        (pot.eligiblePlayers = pot.eligiblePlayers.filter(
          (player) => !player.folded && !player.left,
        )),
    );
  }

  nextRound() {
    const resetPosition = () => {
      // Set action to first player after dealer.
      this.currentPosition = this.dealerPosition! + 1;
      if (this.currentPosition === this.players.length) {
        this.currentPosition = 0;
      }
      while (this.currentActor === null && this.players.length > 0) {
        this.currentPosition++;
        if (this.currentPosition >= this.players.length) {
          this.currentPosition = 0;
        }
      }
      this.lastPosition = this.dealerPosition!;
      if (
        !this.actingPlayers.includes(this.currentActor!) ||
        this.actingPlayers.length <= 1
      ) {
        this.nextAction();
      }
    };

    switch (this.currentRound) {
      case BettingRound.PRE_FLOP:
        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to flop.
        this.currentRound = BettingRound.FLOP;

        // Reset position;
        resetPosition();

        break;
      case BettingRound.FLOP:
        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to turn.
        this.currentRound = BettingRound.TURN;

        // Reset position;
        resetPosition();

        break;
      case BettingRound.TURN:
        // Gather bets and place them in the pot.
        this.gatherBets();

        // Reset current bet and last raise.
        delete this.currentBet;
        delete this.lastRaise;

        // Set round to river.
        this.currentRound = BettingRound.RIVER;

        // Reset position.
        resetPosition();

        break;
      case BettingRound.RIVER:
        this.players.forEach((player) => {
          if (!player) return;
          player.showCards = !player.folded;
        });
        this.showdown();
        break;
    }
  }

  showdown() {
    delete this.currentRound;
    delete this.currentPosition;
    delete this.lastPosition;

    this.gatherBets();

    if (this.activePlayers.length > 1) {
      this.activePlayers.forEach((player) => {
        if (!player) return;
        player.showCards = true;
      });
    }

    // TODO Distribute pots and mark winners - prompt user
    // this.pots.forEach((pot) => {
    //   pot.winners = findWinners(pot.eligiblePlayers);
    //   const award = pot.amount / pot.winners!.length;
    //   pot.winners!.forEach((player) => (player.stackSize += award));
    // });
  }

  toJSON() {
    return {
      buyIn: this.buyIn,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      autoMoveDealer: this.autoMoveDealer,
      bigBlindPosition: this.bigBlindPosition,
      currentBet: this.currentBet,
      currentPosition: this.currentPosition,
      currentRound: this.currentRound,
      dealerPosition: this.dealerPosition,
      debug: this.debug,
      handNumber: this.handNumber,
      lastPosition: this.lastPosition,
      lastRaise: this.lastRaise,
      players: this.players,
      pots: this.pots,
      smallBlindPosition: this.smallBlindPosition,
    };
  }
}

export class Pot {
  amount: number = 0;
  eligiblePlayers: Player[] = [];
}

export enum BettingRound {
  PRE_FLOP = "pre-flop",
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river",
}
