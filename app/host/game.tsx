import React, { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";
import { ShowdownPrompt } from "@/components/ShowdownPrompt";
import { useFocusEffect } from "expo-router";
import { CurrentPhaseText } from "@/components/CurrentPhaseText";

const Game = () => {
  const {
    players,
    setTablePartial,
    getDealer,
    getCurrentActor,
    cleanUpTable,
    startRound,
  } = useStore();

  const { currentPhase, tablePlayers, isShowdown } = useStore(
    useShallow((state) => ({
      currentPhase: state.table.currentPhase,
      tablePlayers: state.table.players,
      isShowdown: state.table.isShowdown,
    })),
  );
  const me = tablePlayers.find((player) => player?.id === HOST_PLAYER_ID);

  useFocusEffect(
    useCallback(() => {
      if (!currentPhase && !isShowdown) {
        cleanUpTable();
      }
    }, [cleanUpTable, currentPhase, isShowdown]),
  );

  useEffect(() => {
    startRound();
    return () => {
      cleanUpTable();
      setTablePartial({
        currentPhase: undefined,
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
          <CurrentPhaseText />
          <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
          {currentPhase == undefined && !isShowdown ? (
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
