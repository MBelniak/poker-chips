import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { HOST_PLAYER_ID } from "@/constants/string-constants";

const Game = () => {
  const { players, table } = useStore();
  const me = table?.players.find((player) => player?.id === HOST_PLAYER_ID);

  useEffect(() => {
    table?.dealCards();

    return () => {
      table?.cleanUp();
      if (table) {
        delete table.currentRound;
        delete table.currentPosition;
        delete table.lastPosition;
      }
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
          <Text>{"Dealer: " + table?.dealer}</Text>
          <Text>{"Current actor: " + table?.currentActor}</Text>
        </>
      )}
    </View>
  );
};

export default Game;
