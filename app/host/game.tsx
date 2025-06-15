import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";

const Game = () => {
  const {
    players,
    setTablePartial,
    getDealer,
    getCurrentActor,
    cleanUpTable,
    startRound,
  } = useStore();

  const { tablePlayers } = useStore(
    useShallow((state) => ({ tablePlayers: state.table.players })),
  );
  const me = tablePlayers.find((player) => player?.id === HOST_PLAYER_ID);

  useEffect(() => {
    startRound();
    return () => {
      cleanUpTable();
      setTablePartial({
        currentRound: undefined,
        currentPosition: undefined,
        lastPosition: undefined,
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ marginBlock: "auto" }}>
      {players.length < 2 ? (
        <Text>{"At least 2 players required!"}</Text>
      ) : (
        <>
          <Text>{"Playing game"}</Text>
          <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
          <Text>{"Dealer: " + getDealer()?.name}</Text>
          <Text>{"Current actor: " + getCurrentActor()?.name}</Text>
          {getCurrentActor()?.id === HOST_PLAYER_ID && (
            <TakeActionComponent playerId={HOST_PLAYER_ID} />
          )}
        </>
      )}
    </View>
  );
};

export default Game;
