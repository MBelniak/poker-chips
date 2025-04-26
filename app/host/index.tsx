import React, { useCallback, useEffect } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { getDefaultGameState, useStore } from "@/model/store";
import { useFocusEffect, useRouter } from "expo-router";
import { getClientId } from "@/model/logic";
import { createGameStateEvent } from "@/model/messageCreators";

const Lobby = () => {
  const router = useRouter();
  const {
    server,
    status,
    dealer,
    players,
    buyInAmount,
    currentTurn,
    actionHistory,
    playersState,
    pendingJoinRequests,
    setGameState,
    setBuyInAmount,
    startServer,
    addPlayer,
    removeAllPlayers,
    sendDisconnectEventToPlayer,
    stopServer,
    removeJoinRequest,
  } = useStore();

  useFocusEffect(
    useCallback(() => {
      return () => {
        Object.keys(pendingJoinRequests).forEach(removeJoinRequest);
      };
    }, [pendingJoinRequests, removeJoinRequest]),
  );

  const createServer = useCallback(() => {
    startServer();
    addPlayer({ name: "host", socket: null, isHost: true });
    setGameState(getDefaultGameState());
  }, [addPlayer, setGameState, startServer]);

  const stopHosting = useCallback(() => {
    setBuyInAmount("");
    Object.keys(pendingJoinRequests).forEach(removeJoinRequest);
    players.forEach(sendDisconnectEventToPlayer);
    setGameState({ status: "waiting" });
    removeAllPlayers();
    stopServer();
  }, [
    pendingJoinRequests,
    players,
    removeAllPlayers,
    removeJoinRequest,
    sendDisconnectEventToPlayer,
    setBuyInAmount,
    setGameState,
    stopServer,
  ]);

  useEffect(() => {
    return () => {
      stopHosting();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    players.forEach((player) => {
      player.socket?.write(
        createGameStateEvent({
          status,
          dealer,
          currentTurn,
          actionHistory,
          playersState,
        }),
      );
    });
  }, [
    actionHistory,
    buyInAmount,
    currentTurn,
    dealer,
    players,
    playersState,
    status,
  ]);

  const startGame = useCallback(() => {
    setGameState({ status: "playing" });
    router.navigate("/host/game");
  }, [router, setGameState]);

  return (
    <View style={{ marginBlock: "auto" }}>
      <Text>Game Host</Text>
      {server == null ? (
        <View>
          <Text>Buy in amount: </Text>
          <TextInput
            keyboardType={"numeric"}
            onChangeText={(text) => setBuyInAmount(text)}
            value={buyInAmount ? buyInAmount.toString() : ""}
          />
          <Button
            title="Start Hosting"
            onPress={createServer}
            disabled={buyInAmount === 0}
          />
        </View>
      ) : (
        <View>
          <Text>Players count: {players.length}</Text>
          {players
            .filter((player) => !player.isHost)
            .map((player, index) => {
              return (
                <View key={index} style={{ flexDirection: "row", gap: 2 }}>
                  <Text>{player.name}</Text>
                </View>
              );
            })}
          {Object.keys(pendingJoinRequests).map((playerId, index) => {
            const player = players.find(
              (player) =>
                !player.isHost && getClientId(player.socket) === playerId,
            );
            return (
              <View key={index} style={{ flexDirection: "row", gap: 2 }}>
                <Text>{player?.name}</Text>
                <Text>{"OTP: " + pendingJoinRequests[playerId].otp}</Text>
              </View>
            );
          })}
          <Button
            title={status === "playing" ? "Continue" : "Start game"}
            onPress={startGame}
            disabled={players.length < 2}
          />
          <Button title="Stop Hosting" onPress={stopHosting} />
        </View>
      )}
    </View>
  );
};

export default Lobby;
