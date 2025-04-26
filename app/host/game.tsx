import React from "react";
import { Text, View } from "react-native";
import { useStore } from "@/model/store";

const Game = () => {
  const { players } = useStore();

  return (
    <View style={{ marginBlock: "auto" }}>
      {players.length < 2 ? (
        <Text>{"At least 2 players required!"}</Text>
      ) : (
        <Text>Playing game...</Text>
      )}
    </View>
  );
};

export default Game;
