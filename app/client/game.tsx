import { Button, Text, View } from "react-native";
import { useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { ActionType } from "@/model/types";

const Game = () => {
  const router = useRouter();
  const {
    clientSocket,
    playerId,
    getDealer,
    getCurrentActor,
    exitGame,
    getLegalActions,
    callAction,
    broadcastAction,
  } = useStore();
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

  const takeTestAction = useCallback(() => {
    if (!me) return;
    const legalActions = getLegalActions(me);
    if (legalActions.length > 0 && legalActions.includes(ActionType.CALL)) {
      broadcastAction(ActionType.CALL, me);
      callAction(me);
    }
  }, [broadcastAction, callAction, getLegalActions, me]);

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
        <View>
          <Text>{"Take the action: "}</Text>
          <Button title={"Test call"} onPress={takeTestAction} />
        </View>
      )}
    </View>
  );
};

export default Game;
