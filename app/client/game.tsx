import { Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { TakeActionComponent } from "@/components/TakeActionComponent";
import { CurrentPhaseText } from "@/components/CurrentPhaseText";

const Game = () => {
  const router = useRouter();
  const {
    clientSocket,
    playerId,
    cleanUpTable,
    getDealer,
    getCurrentActor,
    exitGame,
  } = useStore();

  const { players, currentPhase, isShowdown } = useStore(
    useShallow((state) => ({
      players: state.table.players,
      currentPhase: state.table.currentPhase,
      isShowdown: state.table.isShowdown,
    })),
  );

  const me = players.find((player) => player?.id === playerId);

  useFocusEffect(() => {
    if (clientSocket) {
      clientSocket.on("error", (error) => {
        console.log("Connection error: ", error);
        exitGame();
        router.back();
      });

      clientSocket.on("close", () => {
        console.log("Connection closed");
        exitGame();
        router.back();
      });
    }
  });

  useFocusEffect(
    useCallback(() => {
      if (!currentPhase && !isShowdown) {
        cleanUpTable();
      }
    }, [cleanUpTable, currentPhase, isShowdown]),
  );

  useEffect(() => {
    if (clientSocket == null) {
      router.back();
    }
  }, [clientSocket, router]);

  useEffect(() => {
    return exitGame;
  }, [exitGame]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <CurrentPhaseText />
      <Text>{"My chips: " + (me?.stackSize ?? 0)}</Text>
      <Text>{"Dealer: " + getDealer()?.name}</Text>
      <Text>
        {getCurrentActor()?.name && "Current actor: " + getCurrentActor()?.name}
      </Text>
      {getCurrentActor()?.id === playerId && (
        <TakeActionComponent playerId={playerId} />
      )}
    </View>
  );
};

export default Game;
