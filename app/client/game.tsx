import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { useEffect } from "react";

const Game = () => {
  const router = useRouter();
  const { clientSocket, playerId, table, exitGame } = useStore();

  const me = table?.players.find((player) => player?.id === playerId);

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
      <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
      <Text>{"Dealer: " + table?.dealer?.name}</Text>
      <Text>{"Current actor: " + table?.currentActor?.name}</Text>
    </View>
  );
};

export default Game;
