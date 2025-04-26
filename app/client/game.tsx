import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { useEffect } from "react";

const Game = () => {
  const router = useRouter();
  const { clientSocket, clientName, playersState, exitGame } = useStore();

  const me = playersState.find((player) => player.name === clientName);

  useFocusEffect(() => {
    if (clientSocket) {
      clientSocket.on("error", (error) => {
        console.log("Connection error: ", error);
        exitGame();
        router.navigate("/client");
      });

      clientSocket.on("close", () => {
        console.log("Connection closed");
        exitGame();
        router.navigate("/client");
      });
    }
  });

  useEffect(() => {
    return exitGame;
  }, [exitGame]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>{"Playing game"}</Text>
      <Text>{"My chips: " + (me?.state.chips ?? 0)}</Text>
    </View>
  );
};

export default Game;
