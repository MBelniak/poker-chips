import React from "react";
import { Text, View } from "react-native";
import { useStore } from "@/model/store";

const Game = () => {
  const store = useStore();

  if (store.players.length < 2) {
    throw new Error("At least 2 players required!");
  }

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Playing game...</Text>
    </View>
  );
};

export default Game;
