import { useStore } from "@/model/store";
import React, { useCallback, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { ActionType } from "@/model/types";
import { Button, Text, TextInput, View } from "react-native";

export const TakeActionComponent: React.FC<{ playerId: string }> = ({
  playerId,
}) => {
  const {
    getLegalActions,
    callAction,
    foldAction,
    checkAction,
    raiseAction,
    betAction,
    broadcastAction,
  } = useStore();

  const [betAmount, setBetAmount] = useState("");

  const { players } = useStore(
    useShallow((state) => ({ players: state.table.players })),
  );

  const me = players.find((player) => player?.id === playerId);

  const legalActions = useMemo(
    () => (me ? getLegalActions(me) : []),
    [getLegalActions, me],
  );

  const takeAction = useCallback(
    (action: ActionType) => {
      if (!me) return;
      broadcastAction(action, me, parseInt(betAmount));
      switch (action) {
        case ActionType.FOLD:
          foldAction(me);
          break;
        case ActionType.CALL:
          callAction(me);
          break;
        case ActionType.CHECK:
          checkAction(me);
          break;
        case ActionType.BET:
          betAction(me, parseInt(betAmount));
          break;
        case ActionType.RAISE:
          raiseAction(me, parseInt(betAmount));
          break;
      }
    },
    [
      betAction,
      betAmount,
      broadcastAction,
      callAction,
      checkAction,
      foldAction,
      me,
      raiseAction,
    ],
  );

  return (
    <View>
      <Text>{"Take the action: "}</Text>
      {legalActions.includes(ActionType.CHECK) && (
        <Button title={"Check"} onPress={() => takeAction(ActionType.CHECK)} />
      )}
      {legalActions.includes(ActionType.CALL) && (
        <Button title={"Call"} onPress={() => takeAction(ActionType.CALL)} />
      )}
      {[ActionType.RAISE, ActionType.BET].some((action) =>
        legalActions.includes(action),
      ) && (
        <>
          <Text>{"Bet amount:"}</Text>
          <TextInput
            keyboardType={"numeric"}
            value={betAmount}
            onChangeText={(text) => setBetAmount(text)}
          />
        </>
      )}
      {legalActions.includes(ActionType.RAISE) && (
        <Button
          title={"Raise"}
          onPress={() => takeAction(ActionType.RAISE)}
          disabled={!betAmount.trim()}
        />
      )}
      {legalActions.includes(ActionType.BET) && (
        <Button
          title={"Bet"}
          onPress={() => takeAction(ActionType.BET)}
          disabled={!betAmount.trim()}
        />
      )}
      {legalActions.includes(ActionType.FOLD) && (
        <Button title={"Fold"} onPress={() => takeAction(ActionType.FOLD)} />
      )}
    </View>
  );
};
