import React, { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";
import { ShowdownPrompt } from "@/components/ShowdownPrompt";
import { useFocusEffect } from "expo-router";

const Game = () => {
  const {
    players,
    setTablePartial,
    getDealer,
    getCurrentActor,
    cleanUpTable,
    startRound,
  } = useStore();

  const { currentRound, tablePlayers, isShowdown } = useStore(
    useShallow((state) => ({
      currentRound: state.table.currentRound,
      tablePlayers: state.table.players,
      isShowdown: state.table.isShowdown,
    })),
  );
  const me = tablePlayers.find((player) => player?.id === HOST_PLAYER_ID);

  useFocusEffect(
    useCallback(() => {
      if (!currentRound && !isShowdown) {
        cleanUpTable();
      }
    }, [cleanUpTable, currentRound, isShowdown]),
  );

  useEffect(() => {
    startRound();
    return () => {
      cleanUpTable();
      setTablePartial({
        currentRound: undefined,
        currentPosition: undefined,
        lastPosition: undefined,
        isShowdown: false,
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
          {currentRound == undefined && !isShowdown ? (
            <Button title={"Start a new round"} onPress={() => startRound()} />
          ) : (
            <>
              <Text>{"Dealer: " + getDealer()?.name}</Text>
              <Text>{"Current actor: " + getCurrentActor()?.name}</Text>
              {getCurrentActor()?.id === HOST_PLAYER_ID && (
                <TakeActionComponent playerId={HOST_PLAYER_ID} />
              )}
              {isShowdown && <ShowdownPrompt />}
            </>
          )}
        </>
      )}
    </View>
  );
};

export default Game;
