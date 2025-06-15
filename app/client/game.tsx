import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";

const Game = () => {
  const router = useRouter();
  const { clientSocket, playerId, getDealer, getCurrentActor, exitGame } =
    useStore();

  const { players } = useStore(
    useShallow((state) => ({ players: state.table.players })),
  );

  const me = players.find((player) => player?.id === playerId);

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
    if (clientSocket == null) {
      router.navigate("/client");
    }
  }, [clientSocket, router]);

  useEffect(() => {
    return exitGame;
  }, [exitGame]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>{"Playing game"}</Text>
      <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
      <Text>{"Dealer: " + getDealer()?.name}</Text>
      <Text>{"Current actor: " + getCurrentActor()?.name}</Text>
      {getCurrentActor()?.id === playerId && (
        <TakeActionComponent playerId={playerId} />
      )}
    </View>
  );
};

export default Game;
