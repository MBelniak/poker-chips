import React, { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";
import { ShowdownPrompt } from "@/components/ShowdownPrompt";
import { useFocusEffect } from "expo-router";
import { CurrentPhaseText } from "@/components/CurrentPhaseText";
import FontAwesome from "@react-native-vector-icons/fontawesome";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Game = () => {
  const insets = useSafeAreaInsets();

  const {
    players,
    getDealer,
    getCurrentActor,
    cleanUpTable,
    startRound,
    isGameInProgress,
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
      if (!isGameInProgress()) {
        cleanUpTable();
      }
    }, [cleanUpTable, isGameInProgress]),
  );

  useEffect(() => {
    if (!isGameInProgress() && tablePlayers.length >= 2) {
      startRound();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, marginTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignSelf: "flex-start",
          justifyContent: "flex-end",
          width: "100%",
        }}
      >
        {/*  TODO display indicator about awaiting join request and handle click */}
        <FontAwesome
          name="bell"
          color={"#888"}
          size={24}
          style={{ marginRight: 20 }}
        />
      </View>
      <View style={{ flex: 1, justifyContent: "center" }}>
        {players.length < 2 ? (
          <Text>{"At least 2 players required!"}</Text>
        ) : (
          <>
            <CurrentPhaseText />
            <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
            {currentPhase == undefined && !isShowdown ? (
              <Button
                title={"Start a new round"}
                onPress={() => startRound()}
              />
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
    </View>
  );
};

export default Game;
