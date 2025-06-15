import React, { useCallback, useEffect } from "react";
import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";
import { useShallow } from "zustand/react/shallow";
import { ActionType } from "@/model/types";

const Game = () => {
  const {
    players,
    playerId,
    setTablePartial,
    getDealer,
    getCurrentActor,
    cleanUpTable,
    startRound,
    getLegalActions,
    checkAction,
    broadcastAction,
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

  const takeTestAction = useCallback(() => {
    if (!me) return;
    const legalActions = getLegalActions(me);
    if (legalActions.length > 0 && legalActions.includes(ActionType.CHECK)) {
      checkAction(me);
      broadcastAction(ActionType.CHECK, me);
    }
  }, [broadcastAction, checkAction, getLegalActions, me]);

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
          {getCurrentActor()?.id === playerId && (
            <View>
              <Text>{"Take the action: "}</Text>
              <Button title={"Test check"} onPress={takeTestAction} />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default Game;
